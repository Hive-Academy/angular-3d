import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  ElementRef,
  NgZone,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import * as THREE from 'three/webgpu';
import { MeshPhysicalNodeMaterial } from 'three/webgpu';
import { SceneService } from '../../canvas/scene.service';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { TextSamplingService } from '../../services/text-sampling.service';
import {
  RenderCallbackRegistry,
  createVisibilityObserver,
} from '../../services';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { NG_3D_PARENT } from '../../types/tokens';
import { tslFresnel, tslIridescence } from '../shaders/tsl-utilities';

import * as TSL from 'three/tsl';

const { float, vec3, color, mix } = TSL;

/**
 * Animation mode for bubble behavior
 */
export type BubbleAnimationMode = 'pulse' | 'breathe' | 'static' | 'wave';

/**
 * BubbleTextComponent - 3D Bubble Text using Instanced Meshes
 *
 * Creates transparent bubble spheres that form text shape, inspired by
 * Codrops bubble typer effect. Uses IcosahedronGeometry with TSL-based
 * rim-lighting shader for realistic soap bubble appearance.
 *
 * Features:
 * - IcosahedronGeometry spheres (true 3D bubbles)
 * - TSL bubble material (transparent center, opaque rim) - WebGPU native
 * - Multiple animation modes: pulse, breathe, static, wave
 * - Mouse proximity effect - bubbles grow when cursor is near
 * - Optional flying bubbles that float upward
 * - Smooth, dreamy animations (no jarring burst/reset)
 *
 * @example
 * ```html
 * <a3d-bubble-text
 *   text="BUBBLES"
 *   [fontSize]="60"
 *   [bubbleColor]="0x00d4ff"
 *   [opacity]="0.6"
 *   [maxBubbleScale]="0.2"
 *   [animationMode]="'breathe'"
 *   [animationSpeed]="0.3"
 *   [mouseProximityEffect]="true"
 * />
 * ```
 */

interface BubbleData {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  z: number;
  baseScale: number;
  scale: number;
  maxScale: number;
  phase: number; // For sine wave animation offset
  isFlying: boolean;
  flySpeed: number;
  flyOffset: number; // Accumulated fly distance
}

@Component({
  selector: 'a3d-bubble-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `bubble-text-${crypto.randomUUID()}`,
    },
  ],
})
export class BubbleTextComponent {
  // Signal inputs
  public readonly text = input.required<string>();
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly fontSize = input<number>(60);
  public readonly fontScaleFactor = input<number>(0.08);
  public readonly bubbleColor = input<number>(0xffffff);
  public readonly opacity = input<number>(0.5);
  public readonly maxBubbleScale = input<number>(0.18);
  public readonly minBubbleScale = input<number>(0.08); // Minimum scale for breathing
  public readonly bubblesPerPixel = input<number>(2);
  public readonly lineHeightMultiplier = input<number>(2.5);

  // Animation controls
  public readonly animationMode = input<BubbleAnimationMode>('breathe');
  public readonly animationSpeed = input<number>(0.5); // 0.1 = very slow, 1.0 = normal
  public readonly animationIntensity = input<number>(0.3); // How much bubbles scale (0-1)

  // Mouse interaction
  public readonly mouseProximityEffect = input<boolean>(false);
  public readonly mouseRadius = input<number>(3); // World units radius of effect
  public readonly mouseScaleBoost = input<number>(1.5); // Scale multiplier when mouse is near

  // Flying bubbles
  public readonly enableFlying = input<boolean>(false);
  public readonly flyingRatio = input<number>(0.1);
  public readonly flySpeed = input<number>(0.3); // Slower default

  // Realistic bubble material properties (MeshPhysicalMaterial)
  public readonly transmission = input<number>(1.0); // Glass-like transparency (0-1, can go slightly over for effect)
  public readonly thickness = input<number>(0.5); // Volume beneath surface for refraction
  public readonly ior = input<number>(1.3); // Index of refraction (water: 1.33, glass: 1.5)
  public readonly iridescence = input<number>(1.0); // Rainbow effect strength (0-1)
  public readonly iridescenceIOR = input<number>(1.3); // IOR for iridescence layer
  public readonly iridescenceThicknessMin = input<number>(100); // Thin-film thickness range min
  public readonly iridescenceThicknessMax = input<number>(400); // Thin-film thickness range max
  public readonly clearcoat = input<number>(1.0); // Glossy coating (0-1)
  public readonly clearcoatRoughness = input<number>(0.0); // Coating roughness (0-1)
  public readonly metalness = input<number>(0.0); // Usually 0 for bubbles
  public readonly roughness = input<number>(0.0); // Usually 0 for smooth bubbles
  public readonly envMapIntensity = input<number>(1.5); // Environment reflection strength

  // Legacy inputs (kept for backwards compatibility)
  public readonly growSpeed = input<number>(0.01);

  // DI
  private readonly parent = inject(NG_3D_PARENT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService, { optional: true });
  private readonly callbackRegistry = inject(RenderCallbackRegistry);
  private readonly sceneService = inject(SceneService);
  private readonly textSampling = inject(TextSamplingService);
  private readonly document = inject(DOCUMENT);
  private readonly ngZone = inject(NgZone);
  private readonly elementRef = inject(ElementRef);

  // Visibility tracking for performance optimization
  private readonly componentId = `bubble-text-${crypto.randomUUID()}`;
  private readonly visibility = createVisibilityObserver({
    rootMargin: '200px',
  });

  // Internal state
  private bubbleGeometry?: THREE.IcosahedronGeometry;
  private bubbleMaterial?: MeshPhysicalNodeMaterial;
  private instancedMesh?: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();

  private bubbles: BubbleData[] = [];
  private elapsedTime = 0;

  // Mouse tracking
  private mouseNDC = new THREE.Vector2(0, 0);
  private mouseWorld = new THREE.Vector3(0, 0, 0);
  private raycaster = new THREE.Raycaster();
  private isMouseTracking = false;

  // Bubble counts
  private readonly MAX_BUBBLES = 5000;

  public readonly isReady = signal(false);

  public constructor() {
    // Effect: Initialize bubble system when text or settings change
    effect(() => {
      const parent = this.parent?.();
      const text = this.text();
      const fontSize = this.fontSize();

      if (!parent || !text) return;

      this.refreshBubbles(text, fontSize);

      if (this.instancedMesh && parent) {
        parent.add(this.instancedMesh);
      }
    });

    // Effect: Setup mouse tracking when enabled
    effect(() => {
      if (this.mouseProximityEffect()) {
        this.setupMouseTracking();
      } else {
        this.cleanupMouseTracking();
      }
    });

    // Frame loop animation - registered with centralized callback registry
    // for pause/resume support when not visible
    const cleanup = this.callbackRegistry.register(
      this.componentId,
      (delta) => {
        this.elapsedTime += delta;
        this.animateBubbles(delta);
      }
    );

    // Setup visibility detection to pause when off-screen
    effect(() => {
      // Initialize visibility observer after parent is available
      const parent = this.parent?.();
      if (parent) {
        // Observe the scene's canvas or closest container
        const canvas = this.sceneService.domElement;
        if (canvas) {
          this.visibility.observe(canvas);
        }
      }
    });

    // Pause/resume based on visibility
    effect(() => {
      if (this.visibility.isVisible()) {
        this.callbackRegistry.resume(this.componentId);
      } else {
        this.callbackRegistry.pause(this.componentId);
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      cleanup?.();
      this.cleanupMouseTracking();
      const parent = this.parent?.();
      if (this.instancedMesh && parent) {
        parent.remove(this.instancedMesh);
        this.instancedMesh.geometry.dispose();
        const material = this.instancedMesh
          .material as MeshPhysicalNodeMaterial;
        if (material) {
          try {
            material.dispose();
          } catch {
            // Material may already be disposed
          }
        }
      }
      if (this.bubbleGeometry) {
        this.bubbleGeometry.dispose();
      }
      if (this.bubbleMaterial) {
        try {
          this.bubbleMaterial.dispose();
        } catch {
          // Material may already be disposed
        }
      }
    });
  }

  /**
   * Setup mouse tracking for proximity effect
   */
  private setupMouseTracking(): void {
    if (this.isMouseTracking) return;
    this.isMouseTracking = true;

    this.ngZone.runOutsideAngular(() => {
      this.document.addEventListener('mousemove', this.onMouseMove);
    });
  }

  /**
   * Cleanup mouse tracking
   */
  private cleanupMouseTracking(): void {
    if (!this.isMouseTracking) return;
    this.isMouseTracking = false;
    this.document.removeEventListener('mousemove', this.onMouseMove);
  }

  /**
   * Handle mouse move for proximity effect
   */
  private onMouseMove = (event: MouseEvent): void => {
    // Get canvas element from scene service (domElement getter)
    const canvas = this.sceneService.domElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Calculate NDC coordinates relative to canvas
    this.mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Project to world space at z=0 plane (where bubbles are)
    const camera = this.sceneService.camera(); // Signal accessor
    if (camera) {
      this.raycaster.setFromCamera(this.mouseNDC, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      this.raycaster.ray.intersectPlane(plane, this.mouseWorld);

      // Adjust for instance mesh position
      if (this.instancedMesh) {
        this.mouseWorld.sub(this.instancedMesh.position);
      }
    }
  };

  /**
   * Refresh bubbles when text changes
   */
  private refreshBubbles(text: string, fontSize: number): void {
    if (!text || text.trim().length === 0) {
      const parent = this.parent?.();
      if (this.instancedMesh && parent) {
        parent.remove(this.instancedMesh);
        this.instancedMesh.geometry.dispose();
        (this.instancedMesh.material as MeshPhysicalNodeMaterial).dispose();
        this.instancedMesh = undefined;
      }
      this.bubbles = [];
      return;
    }

    this.sampleTextPositions(text, fontSize);
    this.recreateInstancedMesh();
    this.isReady.set(true);
  }

  /**
   * Sample text positions using TextSamplingService
   */
  private sampleTextPositions(text: string, fontSize: number): void {
    const scaleFactor = this.fontScaleFactor();

    const positions = this.textSampling.sampleTextPositions(
      text,
      fontSize,
      2,
      this.lineHeightMultiplier()
    );

    const bubblesPerPixel = this.bubblesPerPixel();
    this.bubbles = [];

    positions.forEach(([nx, ny]) => {
      for (let i = 0; i < bubblesPerPixel; i++) {
        if (this.bubbles.length >= this.MAX_BUBBLES) break;
        this.bubbles.push(
          this.createBubble(
            nx * fontSize * scaleFactor,
            ny * fontSize * scaleFactor
          )
        );
      }
    });
  }

  /**
   * Create a single bubble with random properties
   */
  private createBubble(x: number, y: number): BubbleData {
    const sizeFactor = 0.4 + Math.random() * 0.6;
    const maxScale = this.maxBubbleScale() * sizeFactor;
    const minScale = this.minBubbleScale() * sizeFactor;
    const baseScale = minScale + (maxScale - minScale) * 0.5;

    // Slight position randomization
    const offsetRange = 0.15;
    const bx = x + (Math.random() - 0.5) * offsetRange;
    const by = y + (Math.random() - 0.5) * offsetRange;

    return {
      baseX: bx,
      baseY: by,
      x: bx,
      y: by,
      z: (Math.random() - 0.5) * 0.1,
      baseScale: baseScale,
      scale: baseScale,
      maxScale: maxScale,
      phase: Math.random() * Math.PI * 2, // Random phase offset for organic feel
      isFlying: this.enableFlying() && Math.random() < this.flyingRatio(),
      flySpeed: (0.5 + Math.random() * 0.5) * this.flySpeed(),
      flyOffset: 0,
    };
  }

  /**
   * Create or recreate the instanced mesh
   */
  private recreateInstancedMesh(): void {
    const parent = this.parent?.();

    if (this.instancedMesh && parent) {
      parent.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as MeshPhysicalNodeMaterial).dispose();
    }

    if (!this.bubbleGeometry) {
      this.bubbleGeometry = new THREE.IcosahedronGeometry(1, 2);
    }

    this.bubbleMaterial = this.createBubbleMaterial();

    this.instancedMesh = new THREE.InstancedMesh(
      this.bubbleGeometry,
      this.bubbleMaterial,
      this.bubbles.length
    );

    const [baseX, baseY, baseZ] = this.position();
    this.instancedMesh.position.set(baseX, baseY, baseZ);

    // Initialize instance matrices with bubble positions
    // This ensures bubbles are visible even before animation callback runs
    this.bubbles.forEach((b, idx) => {
      this.dummy.position.set(b.x, b.y, b.z);
      this.dummy.scale.setScalar(b.baseScale);
      this.dummy.updateMatrix();
      this.instancedMesh!.setMatrixAt(idx, this.dummy.matrix);
    });
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    if (parent) {
      parent.add(this.instancedMesh);
    }
  }

  /**
   * Create realistic bubble material using MeshPhysicalNodeMaterial
   *
   * Uses physically-based properties for realistic soap bubble appearance:
   * - Transmission: Glass-like transparency with refraction
   * - Iridescence: Rainbow thin-film interference effect
   * - Clearcoat: Glossy surface coating
   * - TSL fresnel for additional rim effect
   */
  private createBubbleMaterial(): MeshPhysicalNodeMaterial {
    const bubbleColorValue = new THREE.Color(this.bubbleColor());
    const opacityValue = this.opacity();

    // Create base color with fresnel-based tinting for depth
    const baseColor = color(bubbleColorValue);
    const fresnelValue = tslFresnel(float(2.0), float(0.6), float(0.2));
    const centerColor = vec3(1, 1, 1);
    const finalColor = mix(centerColor, baseColor, fresnelValue.mul(0.7));

    // Add TSL iridescence for additional rainbow shimmer on top of physical iridescence
    const iridescent = tslIridescence(fresnelValue, float(0.05));
    const colorWithIridescence = finalColor.add(iridescent);

    // Create physically-based bubble material
    const material = new MeshPhysicalNodeMaterial();

    // Apply TSL color node for dynamic coloring
    material.colorNode = colorWithIridescence;

    // Physical bubble properties
    material.transmission = this.transmission();
    material.thickness = this.thickness();
    material.ior = this.ior();
    material.roughness = this.roughness();
    material.metalness = this.metalness();

    // Iridescence (thin-film interference - rainbow soap bubble effect)
    material.iridescence = this.iridescence();
    material.iridescenceIOR = this.iridescenceIOR();
    material.iridescenceThicknessRange = [
      this.iridescenceThicknessMin(),
      this.iridescenceThicknessMax(),
    ];

    // Clearcoat (glossy surface layer)
    material.clearcoat = this.clearcoat();
    material.clearcoatRoughness = this.clearcoatRoughness();

    // Environment mapping intensity
    material.envMapIntensity = this.envMapIntensity();

    // Transparency and rendering
    material.transparent = true;
    material.opacity = opacityValue;
    material.side = THREE.DoubleSide;
    material.depthWrite = false;

    return material;
  }

  /**
   * Animate bubbles each frame with smooth animations
   */
  private animateBubbles(delta: number): void {
    if (!this.instancedMesh || this.bubbles.length === 0) return;

    const mode = this.animationMode();
    const speed = this.animationSpeed();
    const intensity = this.animationIntensity();
    const time = this.elapsedTime * speed;

    const useMouseEffect = this.mouseProximityEffect();
    const mouseRadius = this.mouseRadius();
    const mouseRadiusSq = mouseRadius * mouseRadius;
    const mouseBoost = this.mouseScaleBoost();

    this.bubbles.forEach((b, idx) => {
      let targetScale = b.baseScale;

      // Apply animation mode
      switch (mode) {
        case 'breathe': {
          // Gentle breathing - all bubbles pulse together with slight phase offset
          const breathe = Math.sin(time * 2 + b.phase * 0.3) * 0.5 + 0.5;
          const scaleRange = b.maxScale - b.baseScale * 0.5;
          targetScale = b.baseScale * 0.7 + scaleRange * breathe * intensity;
          break;
        }

        case 'pulse': {
          // Individual pulses with staggered timing
          const pulse = Math.sin(time * 3 + b.phase) * 0.5 + 0.5;
          targetScale =
            b.baseScale * (1 - intensity * 0.3 + pulse * intensity * 0.6);
          break;
        }

        case 'wave': {
          // Wave propagates across text based on position
          const wavePhase = b.baseX * 0.5 + time * 2;
          const wave = Math.sin(wavePhase) * 0.5 + 0.5;
          targetScale = b.baseScale * (0.8 + wave * intensity * 0.4);
          break;
        }

        case 'static':
        default:
          // No animation, just base scale
          targetScale = b.baseScale;
          break;
      }

      // Apply mouse proximity effect
      if (useMouseEffect) {
        const dx = b.x - this.mouseWorld.x;
        const dy = b.y - this.mouseWorld.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < mouseRadiusSq) {
          // Smooth falloff based on distance
          const dist = Math.sqrt(distSq);
          const falloff = 1 - dist / mouseRadius;
          const smoothFalloff = falloff * falloff * (3 - 2 * falloff); // Smoothstep
          targetScale *= 1 + (mouseBoost - 1) * smoothFalloff;
        }
      }

      // Flying bubbles float upward slowly
      if (b.isFlying) {
        b.flyOffset += delta * b.flySpeed * 0.1;
        // Reset when too high (gentle loop)
        if (b.flyOffset > 5) {
          b.flyOffset = 0;
        }
        b.y = b.baseY + b.flyOffset;
      }

      // Smooth scale transition
      b.scale += (targetScale - b.scale) * 0.1;

      // Apply transform
      this.dummy.position.set(b.x, b.y, b.z);
      this.dummy.scale.setScalar(Math.max(0.01, b.scale)); // Prevent zero scale
      this.dummy.updateMatrix();
      this.instancedMesh!.setMatrixAt(idx, this.dummy.matrix);
    });

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
}
