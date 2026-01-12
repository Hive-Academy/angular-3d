import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  effect,
  signal,
  DestroyRef,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { color as tslColor, float, mul } from 'three/tsl';
import { TextGeometry, FontLoader, Font } from 'three-stdlib';
import { NG_3D_PARENT } from '../../types/tokens';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { tslFresnel } from '../shaders/tsl-utilities';

/**
 * Glow-enabled 3D text component using TSL-based emission.
 *
 * Uses Three.js TextGeometry with TSL (Three Shader Language) for WebGPU-native
 * glow effects. The glow is achieved through emissive materials and Fresnel edge
 * lighting instead of outline shaders.
 *
 * WebGPU Compatible: ✅ (uses TSL emissiveNode)
 *
 * @example
 * ```html
 * <a3d-glow-troika-text
 *   text="NEON GLOW"
 *   [fontSize]="1.0"
 *   glowColor="#00ffff"
 *   [glowIntensity]="1.5"
 *   [glowBlur]="0.5"
 * />
 * ```
 */
@Component({
  selector: 'a3d-glow-troika-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `glow-troika-text-${crypto.randomUUID()}`,
    },
  ],
})
export class GlowTroikaTextComponent {
  // ========================================
  // CORE TEXT PROPERTIES
  // ========================================

  /** The text string to render. */
  public readonly text = input.required<string>();

  /** Font size in 3D world units. */
  public readonly fontSize = input<number>(0.1);

  /** URL or path to custom font file. */
  public readonly font = input<string | null>(null);

  // ========================================
  // TRANSFORM PROPERTIES
  // ========================================

  /** Position in 3D space [x, y, z]. */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Rotation in radians [x, y, z]. */
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);

  /** Scale factor. Can be uniform or per-axis [x, y, z]. */
  public readonly scale = input<number | [number, number, number]>(1);

  // ========================================
  // LAYOUT PROPERTIES
  // ========================================

  /** Horizontal anchor point. */
  public readonly anchorX = input<number | string>('left');

  /** Vertical anchor point. */
  public readonly anchorY = input<number | string>('top');

  // ========================================
  // VISUAL STYLING
  // ========================================

  /** Fill opacity (0-1). */
  public readonly fillOpacity = input<number>(1);

  // ========================================
  // GLOW PROPERTIES (TSL-based)
  // ========================================

  /**
   * Glow/emission color - the neon glow color.
   * @default '#00ffff' (cyan)
   */
  public readonly glowColor = input<string | number>('#00ffff');

  /**
   * Main text fill color.
   * If null, uses glowColor (solid neon look).
   * @default '#ffffff' (white text with colored glow)
   */
  public readonly textColor = input<string | number | null>('#ffffff');

  /**
   * Glow intensity multiplier (for emissive material).
   * Higher values make the glow brighter (works with bloom!).
   * @default 1.5
   */
  public readonly glowIntensity = input<number>(1.5);

  /**
   * Edge glow strength using Fresnel effect.
   * Higher values = stronger edge glow.
   * @default 2.0
   */
  public readonly glowBlur = input<number | string>(2.0);

  /**
   * Pulse animation speed (0 = disabled).
   * @default 0
   */
  public readonly pulseSpeed = input<number>(0);

  /**
   * Enable billboard mode - text always faces the camera.
   * @default false
   */
  public readonly billboard = input<boolean>(false);

  /**
   * Extrusion depth for 3D text.
   * @default 0.05
   */
  public readonly depth = input<number>(0.05);

  // ========================================
  // DEPENDENCY INJECTION
  // ========================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly sceneService = inject(SceneService);
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID);

  // ========================================
  // STATE
  // ========================================

  public readonly isLoading = signal(false);
  public readonly loadError = signal<string | null>(null);

  private textMesh?: THREE.Mesh;
  private material?: THREE.MeshStandardNodeMaterial;
  private loadedFont?: Font;
  private cleanupPulseLoop?: () => void;
  private cleanupBillboardLoop?: () => void;
  private isCleanedUp = false;

  public constructor() {
    // Effect: Load font and create text
    effect((onCleanup) => {
      const textContent = this.text();
      const fontUrl =
        this.font() ||
        'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';
      const parent = this.parent();

      if (!textContent || !parent) return;

      this.isLoading.set(true);
      this.loadError.set(null);

      // Load font if not cached
      if (!this.loadedFont) {
        const loader = new FontLoader();
        loader.load(
          fontUrl,
          (font) => {
            this.loadedFont = font;
            this.createTextMesh(textContent, font, parent);
            this.isLoading.set(false);
          },
          undefined,
          (error) => {
            console.error('Font loading error:', error);
            this.loadError.set('Failed to load font');
            this.isLoading.set(false);
          }
        );
      } else {
        this.createTextMesh(textContent, this.loadedFont, parent);
        this.isLoading.set(false);
      }

      onCleanup(() => {
        this.cleanup(parent);
      });
    });

    // Effect: Update glow properties reactively
    effect(() => {
      if (!this.material) return;

      const glowColorValue = new THREE.Color(this.glowColor());
      const textColorValue = this.textColor()
        ? new THREE.Color(this.textColor() as string | number)
        : glowColorValue.clone();

      this.material.color.set(textColorValue);

      // Create TSL emissive glow with Fresnel
      const glowBlurValue =
        typeof this.glowBlur() === 'string'
          ? parseFloat(this.glowBlur() as string)
          : (this.glowBlur() as number);

      const emissiveColorNode = tslColor(glowColorValue);
      const fresnelValue = tslFresnel(
        float(2.0),
        float(glowBlurValue),
        float(0.5)
      );
      this.material.emissiveNode = mul(
        emissiveColorNode,
        fresnelValue,
        float(this.glowIntensity())
      );

      this.material.opacity = this.fillOpacity();
    });

    // Effect: Pulse animation
    effect(() => {
      if (this.pulseSpeed() === 0) {
        if (this.cleanupPulseLoop) {
          this.cleanupPulseLoop();
          this.cleanupPulseLoop = undefined;
        }
        return;
      }

      if (!this.material) return;

      const baseIntensity = this.glowIntensity();
      this.cleanupPulseLoop = this.renderLoop.registerUpdateCallback(
        (_delta, elapsed) => {
          if (!this.material) return;

          // Pulse glow intensity
          const pulse =
            Math.sin(elapsed * this.pulseSpeed() * Math.PI * 2) * 0.3 + 1.0;

          const glowColorValue = new THREE.Color(this.glowColor());
          const glowBlurValue =
            typeof this.glowBlur() === 'string'
              ? parseFloat(this.glowBlur() as string)
              : (this.glowBlur() as number);

          const emissiveColorNode = tslColor(glowColorValue);
          const fresnelValue = tslFresnel(
            float(2.0),
            float(glowBlurValue),
            float(0.5)
          );
          this.material!.emissiveNode = mul(
            emissiveColorNode,
            fresnelValue,
            float(baseIntensity * pulse)
          );
        }
      );
    });

    // Effect: Billboard
    effect(() => {
      if (!this.billboard()) {
        if (this.cleanupBillboardLoop) {
          this.cleanupBillboardLoop();
          this.cleanupBillboardLoop = undefined;
        }
        return;
      }

      const camera = this.sceneService.camera();
      if (!camera || !this.textMesh) return;

      this.cleanupBillboardLoop = this.renderLoop.registerUpdateCallback(() => {
        if (this.textMesh && camera) {
          this.textMesh.quaternion.copy(camera.quaternion);
        }
      });
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.cleanupPulseLoop?.();
      this.cleanupBillboardLoop?.();
      this.sceneStore.remove(this.objectId);
      const parent = this.parent();
      if (parent) this.cleanup(parent);
    });
  }

  private createTextMesh(
    textContent: string,
    font: Font,
    parent: THREE.Object3D
  ): void {
    // Reset cleanup flag
    this.isCleanedUp = false;

    // Remove existing mesh if any
    if (this.textMesh) {
      parent.remove(this.textMesh);
      this.textMesh.geometry.dispose();
      this.sceneStore.remove(this.objectId);
    }

    // Create TextGeometry with slight extrusion for better lighting
    const geometry = new TextGeometry(textContent, {
      font: font,
      size: this.fontSize(),
      height: this.depth(),
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 3,
    } as ConstructorParameters<typeof TextGeometry>[1]);

    // Apply centering based on anchorX/anchorY
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      const centerOffset = new THREE.Vector3();

      // Map anchorX
      const anchorX = this.anchorX();
      if (anchorX === 'left' || anchorX === 0) {
        centerOffset.x = 0;
      } else if (anchorX === 'center' || anchorX === 0.5) {
        centerOffset.x =
          -(geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2;
      } else if (anchorX === 'right' || anchorX === 1) {
        centerOffset.x = -(
          geometry.boundingBox.max.x - geometry.boundingBox.min.x
        );
      } else if (typeof anchorX === 'number') {
        centerOffset.x =
          -(geometry.boundingBox.max.x - geometry.boundingBox.min.x) * anchorX;
      }

      // Map anchorY
      const anchorY = this.anchorY();
      if (anchorY === 'top' || anchorY === 0) {
        centerOffset.y = 0;
      } else if (anchorY === 'middle' || anchorY === 0.5) {
        centerOffset.y =
          -(geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2;
      } else if (anchorY === 'bottom' || anchorY === 1) {
        centerOffset.y = -(
          geometry.boundingBox.max.y - geometry.boundingBox.min.y
        );
      } else if (typeof anchorY === 'number') {
        centerOffset.y =
          -(geometry.boundingBox.max.y - geometry.boundingBox.min.y) * anchorY;
      }

      geometry.translate(centerOffset.x, centerOffset.y, 0);
    }

    // Create material with TSL emissive glow (WebGPU compatible)
    const glowColorValue = new THREE.Color(this.glowColor());
    const textColorValue = this.textColor()
      ? new THREE.Color(this.textColor() as string | number)
      : glowColorValue.clone();

    this.material = new THREE.MeshStandardNodeMaterial();
    this.material.color = textColorValue;

    // TSL Fresnel-based edge glow
    const glowBlurValue =
      typeof this.glowBlur() === 'string'
        ? parseFloat(this.glowBlur() as string)
        : (this.glowBlur() as number);

    const emissiveColorNode = tslColor(glowColorValue);
    const fresnelValue = tslFresnel(
      float(2.0),
      float(glowBlurValue),
      float(0.5)
    );
    this.material.emissiveNode = mul(
      emissiveColorNode,
      fresnelValue,
      float(this.glowIntensity())
    );

    this.material.transparent = this.fillOpacity() < 1;
    this.material.opacity = this.fillOpacity();
    this.material.toneMapped = false; // Allow HDR values for bloom

    // Create mesh
    this.textMesh = new THREE.Mesh(geometry, this.material);

    // Apply transforms
    this.textMesh.position.set(...this.position());
    this.textMesh.rotation.set(...this.rotation());
    const s = this.scale();
    const scale: [number, number, number] =
      typeof s === 'number' ? [s, s, s] : s;
    this.textMesh.scale.set(...scale);

    // Add to scene
    parent.add(this.textMesh);
    this.sceneStore.register(this.objectId, this.textMesh, 'mesh');
  }

  private cleanup(parent: THREE.Object3D): void {
    // Prevent double cleanup
    if (this.isCleanedUp || !this.textMesh) return;
    this.isCleanedUp = true;

    parent.remove(this.textMesh);
    this.textMesh.geometry.dispose();

    // Safely dispose material
    if (this.material) {
      try {
        this.material.dispose();
      } catch {
        // Material may already be disposed
      }
    }

    this.sceneStore.remove(this.objectId);
    this.textMesh = undefined;
    this.material = undefined;
  }
}
