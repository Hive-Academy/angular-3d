import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import * as THREE from 'three';
import { SceneService } from '../../canvas/scene.service';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { TextSamplingService } from '../../services/text-sampling.service';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { NG_3D_PARENT } from '../../types/tokens';

/**
 * BubbleTextComponent - 3D Bubble Text using Instanced Meshes
 *
 * Creates transparent bubble spheres that form text shape, inspired by
 * Codrops bubble typer effect. Uses IcosahedronGeometry with custom
 * rim-lighting shader for realistic soap bubble appearance.
 *
 * Features:
 * - IcosahedronGeometry spheres (not flat planes)
 * - Custom bubble shader (transparent center, opaque rim)
 * - Grow → Burst → Regrow lifecycle animation
 * - Optional flying bubbles that float upward
 * - Billboard-free (true 3D spheres)
 *
 * @example
 * ```html
 * <a3d-bubble-text
 *   text="BUBBLES"
 *   [fontSize]="60"
 *   [bubbleColor]="'#00d4ff'"
 *   [opacity]="0.6"
 *   [maxBubbleScale]="0.2"
 *   [bubblesPerPixel]="2"
 *   [enableFlying]="true"
 * />
 * ```
 */

interface BubbleData {
  x: number;
  y: number;
  z: number;
  scale: number;
  maxScale: number;
  growSpeed: number;
  isFlying: boolean;
  flySpeed: number;
  toDelete: boolean;
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
  public readonly bubblesPerPixel = input<number>(2);
  public readonly growSpeed = input<number>(0.02);
  public readonly enableFlying = input<boolean>(true);
  public readonly flyingRatio = input<number>(0.2); // 20% of bubbles fly
  public readonly lineHeightMultiplier = input<number>(2.5); // Canvas height multiplier for text rendering

  // DI
  private readonly parent = inject(NG_3D_PARENT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService, { optional: true });
  private readonly sceneService = inject(SceneService);
  private readonly textSampling = inject(TextSamplingService);

  // Internal state
  private bubbleGeometry?: THREE.IcosahedronGeometry;
  private bubbleMaterial?: THREE.ShaderMaterial;
  private instancedMesh?: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();

  private bubbles: BubbleData[] = [];
  private stringBox = {
    wScene: 0,
    hScene: 0,
  };

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

    // Frame loop animation (skip if renderLoop not available)
    const cleanup = this.renderLoop?.registerUpdateCallback(() => {
      this.animateBubbles();
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      cleanup?.();
      const parent = this.parent?.();
      if (this.instancedMesh && parent) {
        parent.remove(this.instancedMesh);
        this.instancedMesh.geometry.dispose();
        (this.instancedMesh.material as THREE.ShaderMaterial).dispose();
      }
      if (this.bubbleGeometry) {
        this.bubbleGeometry.dispose();
      }
      if (this.bubbleMaterial) {
        this.bubbleMaterial.dispose();
      }
    });
  }

  /**
   * Refresh bubbles when text changes
   */
  private refreshBubbles(text: string, fontSize: number): void {
    if (!text || text.trim().length === 0) {
      const parent = this.parent?.();
      if (this.instancedMesh && parent) {
        parent.remove(this.instancedMesh);
        this.instancedMesh.geometry.dispose();
        (this.instancedMesh.material as THREE.ShaderMaterial).dispose();
        this.instancedMesh = undefined;
      }
      this.bubbles = [];
      return;
    }

    this.sampleTextPositions(text, fontSize);
    this.createBubbles();
    this.recreateInstancedMesh();
    this.isReady.set(true);
  }

  /**
   * Sample text positions using TextSamplingService
   */
  private sampleTextPositions(text: string, fontSize: number): void {
    const scaleFactor = this.fontScaleFactor();

    // Sample every 2nd pixel for performance, using lineHeightMultiplier for consistent vertical sampling
    const positions = this.textSampling.sampleTextPositions(
      text,
      fontSize,
      2,
      this.lineHeightMultiplier()
    );

    // Calculate scene dimensions
    const maxX = Math.max(...positions.map(([x]) => Math.abs(x)));
    const maxY = Math.max(...positions.map(([, y]) => Math.abs(y)));
    this.stringBox.wScene = maxX * 2 * scaleFactor * fontSize;
    this.stringBox.hScene = maxY * 2 * scaleFactor * fontSize;

    // Create bubbles from positions
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
    // Size variation favoring medium bubbles
    const sizeFactor = 0.3 + Math.random() * 0.7;
    const maxScale = this.maxBubbleScale() * sizeFactor;

    // Slight position randomization
    const offsetRange = 0.2;

    return {
      x: x + (Math.random() - 0.5) * offsetRange,
      y: y + (Math.random() - 0.5) * offsetRange,
      z: (Math.random() - 0.5) * 0.15,
      scale: Math.random() * maxScale, // Start at random scale
      maxScale: maxScale,
      growSpeed: this.growSpeed() * (0.5 + Math.random()),
      isFlying: this.enableFlying() && Math.random() < this.flyingRatio(),
      flySpeed: 0.001 + Math.random() * 0.002,
      toDelete: false,
    };
  }

  /**
   * Create bubbles array from sampled positions
   */
  private createBubbles(): void {
    // Already created in sampleTextPositions
  }

  /**
   * Create or recreate the instanced mesh
   */
  private recreateInstancedMesh(): void {
    const parent = this.parent?.();

    // Cleanup existing
    if (this.instancedMesh && parent) {
      parent.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.ShaderMaterial).dispose();
    }

    // Create geometry (Icosahedron for spherical bubbles)
    if (!this.bubbleGeometry) {
      this.bubbleGeometry = new THREE.IcosahedronGeometry(1, 2); // Detail level 2
    }

    // Create bubble shader material
    if (!this.bubbleMaterial) {
      this.bubbleMaterial = this.createBubbleShaderMaterial();
    }

    // Create instanced mesh
    this.instancedMesh = new THREE.InstancedMesh(
      this.bubbleGeometry,
      this.bubbleMaterial,
      this.bubbles.length
    );

    // Position mesh
    const [baseX, baseY, baseZ] = this.position();
    this.instancedMesh.position.set(baseX, baseY, baseZ);

    if (parent) {
      parent.add(this.instancedMesh);
    }
  }

  /**
   * Create bubble shader material with rim transparency effect
   */
  private createBubbleShaderMaterial(): THREE.ShaderMaterial {
    const bubbleColor = new THREE.Color(this.bubbleColor());

    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: bubbleColor },
        uOpacity: { value: this.opacity() },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          // Fresnel-like rim effect
          vec3 viewDir = normalize(vViewPosition);
          float rim = 1.0 - abs(dot(vNormal, viewDir));
          rim = pow(rim, 2.0);
          
          // Mix white center with colored rim (bubble refraction look)
          vec3 centerColor = vec3(1.0, 1.0, 1.0);
          vec3 rimColor = uColor;
          vec3 finalColor = mix(centerColor, rimColor, rim * 0.7);
          
          // Add rainbow iridescence
          float rainbow = sin(rim * 6.28) * 0.5 + 0.5;
          finalColor += vec3(rainbow * 0.1, rainbow * 0.05, rainbow * 0.15);
          
          // Alpha: more transparent at center, more opaque at rim
          float alpha = (0.2 + rim * 0.6) * uOpacity;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  /**
   * Animate bubbles each frame
   */
  private animateBubbles(): void {
    if (!this.instancedMesh || this.bubbles.length === 0) return;

    this.bubbles.forEach((b, idx) => {
      // Grow bubble
      b.scale += b.growSpeed;

      // Burst and regrow when reaching max scale
      if (b.scale >= b.maxScale) {
        b.scale = 0; // Burst! Start over
      }

      // Flying bubbles float upward
      if (b.isFlying && b.scale > b.maxScale * 0.5) {
        b.y += b.flySpeed;
      }

      // Apply transform
      this.dummy.position.set(b.x, b.y, b.z);
      this.dummy.scale.setScalar(b.scale);
      this.dummy.updateMatrix();
      this.instancedMesh!.setMatrixAt(idx, this.dummy.matrix);
    });

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
}
