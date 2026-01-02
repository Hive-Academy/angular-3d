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
 * Premium 3D Extruded Text Component with proper emission for bloom.
 *
 * Uses Three.js TextGeometry for TRUE 3D text with:
 * - Depth extrusion (real 3D thickness)
 * - Beveled edges (smooth rounded corners)
 * - MeshStandardMaterial with high emissiveIntensity
 * - Works with bloom post-processing for true glow
 *
 * This creates text that looks 3D and glows properly with bloom!
 *
 * @example
 * ```html
 * <a3d-extruded-text-3d
 *   [text]="'GLOW'"
 *   [fontSize]="1.0"
 *   [depth]="0.2"
 *   [emissiveColor]="'#00ffff'"
 *   [emissiveIntensity]="50"
 * />
 * ```
 */
@Component({
  selector: 'a3d-extruded-text-3d',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `extruded-text-3d-${crypto.randomUUID()}`,
    },
  ],
})
export class ExtrudedText3DComponent {
  // ========================================
  // TEXT CONTENT
  // ========================================

  /** The text string to render. */
  public readonly text = input.required<string>();

  /** Font URL (JSON format from Three.js fonts). */
  public readonly fontUrl = input<string>(
    'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json'
  );

  // ========================================
  // SIZE & DEPTH
  // ========================================

  /** Font size in 3D world units. */
  public readonly fontSize = input<number>(1);

  /** Extrusion depth (thickness) of the text. */
  public readonly depth = input<number>(0.2);

  /** Curve segments for smoother text curves. */
  public readonly curveSegments = input<number>(12);

  // ========================================
  // BEVEL (Rounded edges)
  // ========================================

  /** Enable beveled edges for a premium look. */
  public readonly bevelEnabled = input<boolean>(true);

  /** Bevel thickness (depth of the bevel). */
  public readonly bevelThickness = input<number>(0.03);

  /** Bevel size (width of the bevel). */
  public readonly bevelSize = input<number>(0.02);

  /** Bevel segments for smoothness. */
  public readonly bevelSegments = input<number>(5);

  // ========================================
  // TRANSFORM
  // ========================================

  /** Position in 3D space [x, y, z]. */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Rotation in radians [x, y, z]. */
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);

  /** Scale factor. */
  public readonly scale = input<number | [number, number, number]>(1);

  /** Center the text horizontally. */
  public readonly centerX = input<boolean>(true);

  /** Center the text vertically. */
  public readonly centerY = input<boolean>(true);

  // ========================================
  // MATERIAL & EMISSION (For bloom glow)
  // ========================================

  /**
   * Base color of the text.
   * @default '#ffffff'
   */
  public readonly color = input<string | number>('#ffffff');

  /**
   * Emissive color (the glow color).
   * This is the color that will bloom!
   * @default '#00ffff'
   */
  public readonly emissiveColor = input<string | number>('#00ffff');

  /**
   * Emissive intensity - CRITICAL for bloom!
   * Must be HIGH (50-100+) to exceed bloom threshold and create glow.
   * Based on Don McCurdy's article: higher = more overwhelming bloom.
   * @default 50
   */
  public readonly emissiveIntensity = input<number>(50);

  /**
   * Metalness of the material (0 = plastic, 1 = metal).
   * @default 0.3
   */
  public readonly metalness = input<number>(0.3);

  /**
   * Roughness of the material (0 = mirror, 1 = rough).
   * @default 0.4
   */
  public readonly roughness = input<number>(0.4);

  // ========================================
  // ANIMATION
  // ========================================

  /**
   * Pulse animation speed for emissive intensity (0 = disabled).
   * @default 0
   */
  public readonly pulseSpeed = input<number>(0);

  /**
   * Enable Fresnel edge glow effect.
   * When enabled, text edges glow brighter at viewing angles,
   * creating a neon-like effect without relying on bloom.
   * @default false
   */
  public readonly edgeGlow = input<boolean>(false);

  /**
   * Edge glow intensity multiplier.
   * Higher values = stronger edge glow effect.
   * @default 2.0
   */
  public readonly edgeGlowIntensity = input<number>(2.0);

  /**
   * Bloom layer for selective bloom effect.
   * When specified, the text mesh will be added to this layer.
   * Use with a3d-selective-bloom-effect to bloom only the text.
   * @default undefined (no layer, uses default layer 0)
   */
  public readonly bloomLayer = input<number | undefined>(undefined);

  /**
   * Billboard mode - text always faces camera.
   * @default false
   */
  public readonly billboard = input<boolean>(false);

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

  public readonly isLoading = signal(true);
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
      const fontUrl = this.fontUrl();
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

    // Effect: Update material properties reactively
    effect(() => {
      if (!this.material) return;

      this.material.color.set(this.color() as THREE.ColorRepresentation);

      // Update TSL emissiveNode reactively
      const emissiveColorNode = tslColor(
        new THREE.Color(this.emissiveColor() as THREE.ColorRepresentation)
      );
      this.material.emissiveNode = mul(
        emissiveColorNode,
        float(this.emissiveIntensity())
      );

      this.material.metalness = this.metalness();
      this.material.roughness = this.roughness();
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

      const baseIntensity = this.emissiveIntensity();
      this.cleanupPulseLoop = this.renderLoop.registerUpdateCallback(
        (_delta, elapsed) => {
          if (!this.material) return;
          const pulse =
            Math.sin(elapsed * this.pulseSpeed() * Math.PI * 2) * 0.3 + 1.0;
          this.material.emissiveIntensity = baseIntensity * pulse;
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

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanupPulseLoop?.();
      this.cleanupBillboardLoop?.();
      const parent = this.parent();
      if (parent) this.cleanup(parent);
    });
  }

  private createTextMesh(
    textContent: string,
    font: Font,
    parent: THREE.Object3D
  ): void {
    // Reset cleanup flag when creating new mesh
    this.isCleanedUp = false;

    // Remove existing mesh if any
    if (this.textMesh) {
      parent.remove(this.textMesh);
      this.textMesh.geometry.dispose();
      this.sceneStore.remove(this.objectId);
    }

    // Create TextGeometry with extrusion and bevel
    // Note: bevelSegments is valid Three.js API but may be missing from three-stdlib types
    const geometry = new TextGeometry(textContent, {
      font: font,
      size: this.fontSize(),
      height: this.depth(), // Extrusion depth
      curveSegments: this.curveSegments(),
      bevelEnabled: this.bevelEnabled(),
      bevelThickness: this.bevelThickness(),
      bevelSize: this.bevelSize(),
      bevelSegments: this.bevelSegments(),
    } as ConstructorParameters<typeof TextGeometry>[1]);

    // Center geometry if requested
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      const centerOffset = new THREE.Vector3();
      if (this.centerX()) {
        centerOffset.x =
          -(geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2;
      }
      if (this.centerY()) {
        centerOffset.y =
          -(geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2;
      }
      geometry.translate(centerOffset.x, centerOffset.y, 0);
    }

    // Create material with TSL emissiveNode (CRITICAL for proper bloom!)
    // Using MeshStandardNodeMaterial with emissiveNode for GPU-native emission
    // This makes the TEXT ITSELF glow, not a surrounding halo
    this.material = new THREE.MeshStandardNodeMaterial();
    this.material.color = new THREE.Color(
      this.color() as THREE.ColorRepresentation
    );

    // TSL emissiveNode: color node multiplied by intensity
    // This is the proper way to do emission that works with TSL bloom
    const emissiveColorNode = tslColor(
      new THREE.Color(this.emissiveColor() as THREE.ColorRepresentation)
    );
    const baseEmissive = mul(
      emissiveColorNode,
      float(this.emissiveIntensity())
    );

    // Apply Fresnel edge glow if enabled
    // This boosts emissive at edges for a neon-like effect
    if (this.edgeGlow()) {
      // Fresnel: power=2.0 (soft falloff), intensity=edgeGlowIntensity, bias=1.0 (always some glow)
      const fresnelValue = tslFresnel(
        float(2.0),
        float(this.edgeGlowIntensity()),
        float(1.0)
      );
      // Multiply emissive by fresnel boost for edge glow
      this.material.emissiveNode = mul(baseEmissive, fresnelValue);
    } else {
      this.material.emissiveNode = baseEmissive;
    }

    this.material.metalness = this.metalness();
    this.material.roughness = this.roughness();
    this.material.toneMapped = false; // Allow HDR values > 1.0

    // Create mesh
    this.textMesh = new THREE.Mesh(geometry, this.material);

    // Apply transforms
    this.textMesh.position.set(...this.position());
    this.textMesh.rotation.set(...this.rotation());
    const s = this.scale();
    const scale: [number, number, number] =
      typeof s === 'number' ? [s, s, s] : s;
    this.textMesh.scale.set(...scale);

    // Apply bloom layer for selective bloom effect
    // The mesh stays on layer 0 (default) for main render,
    // but is also added to the bloom layer for selective bloom
    const layer = this.bloomLayer();
    if (layer !== undefined) {
      this.textMesh.layers.enable(layer);
    }

    // Add to scene
    parent.add(this.textMesh);
    this.sceneStore.register(this.objectId, this.textMesh, 'mesh');
  }

  private cleanup(parent: THREE.Object3D): void {
    // Prevent double cleanup - can be called from both effect onCleanup and destroyRef
    if (this.isCleanedUp || !this.textMesh) return;
    this.isCleanedUp = true;

    parent.remove(this.textMesh);
    this.textMesh.geometry.dispose();

    // Safely dispose material - check it exists and hasn't been disposed
    if (this.material) {
      try {
        this.material.dispose();
      } catch {
        // Material may already be disposed, ignore errors
      }
    }

    this.sceneStore.remove(this.objectId);
    this.textMesh = undefined;
    this.material = undefined;
  }
}
