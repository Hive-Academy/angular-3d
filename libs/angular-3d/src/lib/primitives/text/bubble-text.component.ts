import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { SceneService } from '../../canvas/scene.service';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { TextSamplingService } from '../../services/text-sampling.service';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { NG_3D_PARENT } from '../../types/tokens';
import { tslFresnel, tslIridescence } from '../shaders/tsl-utilities';

import * as TSL from 'three/tsl';

const { float, vec3, color, mix } = TSL;

/**
 * BubbleTextComponent - 3D Bubble Text using Instanced Meshes
 *
 * Creates transparent bubble spheres that form text shape, inspired by
 * Codrops bubble typer effect. Uses IcosahedronGeometry with TSL-based
 * rim-lighting shader for realistic soap bubble appearance.
 *
 * Features:
 * - IcosahedronGeometry spheres (not flat planes)
 * - TSL bubble material (transparent center, opaque rim) - WebGPU native
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
  private bubbleMaterial?: MeshStandardNodeMaterial;
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

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      cleanup?.();
      const parent = this.parent?.();
      if (this.instancedMesh && parent) {
        parent.remove(this.instancedMesh);
        this.instancedMesh.geometry.dispose();
        // Safely dispose material
        const material = this.instancedMesh
          .material as MeshStandardNodeMaterial;
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
   * Refresh bubbles when text changes
   */
  private refreshBubbles(text: string, fontSize: number): void {
    if (!text || text.trim().length === 0) {
      const parent = this.parent?.();
      if (this.instancedMesh && parent) {
        parent.remove(this.instancedMesh);
        this.instancedMesh.geometry.dispose();
        (this.instancedMesh.material as MeshStandardNodeMaterial).dispose();
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
      (this.instancedMesh.material as MeshStandardNodeMaterial).dispose();
    }

    // Create geometry (Icosahedron for spherical bubbles)
    if (!this.bubbleGeometry) {
      this.bubbleGeometry = new THREE.IcosahedronGeometry(1, 2); // Detail level 2
    }

    // Create TSL bubble material
    this.bubbleMaterial = this.createBubbleMaterial();

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
   * Create TSL-based bubble material with rim transparency effect
   * Uses native TSL nodes for WebGPU/WebGL compatibility
   */
  private createBubbleMaterial(): MeshStandardNodeMaterial {
    const bubbleColorValue = new THREE.Color(this.bubbleColor());
    const opacityValue = this.opacity();

    // Create TSL color node
    const baseColor = color(bubbleColorValue);

    // Calculate fresnel rim effect using TSL utilities
    const fresnelValue = tslFresnel(float(2.0), float(0.6), float(0.2));

    // Mix white center with colored rim (bubble refraction look)
    const centerColor = vec3(1, 1, 1);
    const finalColor = mix(centerColor, baseColor, fresnelValue.mul(0.7));

    // Add rainbow iridescence using TSL utilities
    const iridescent = tslIridescence(fresnelValue, float(0.1));
    const colorWithIridescence = finalColor.add(iridescent);

    // Alpha: more transparent at center, more opaque at rim
    const alpha = float(0.2).add(fresnelValue.mul(0.6)).mul(opacityValue);

    // Create MeshStandardNodeMaterial with TSL nodes
    const material = new MeshStandardNodeMaterial();
    material.colorNode = colorWithIridescence;
    material.opacityNode = alpha;
    material.transparent = true;
    material.side = THREE.DoubleSide;
    material.depthWrite = false;

    return material;
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
