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
import { TextGeometry, FontLoader, Font } from 'three-stdlib';
import { NG_3D_PARENT } from '../../types/tokens';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';
import { SceneGraphStore } from '../../store/scene-graph.store';

/**
 * Production-grade 3D text component using Three.js TextGeometry.
 *
 * Provides high-quality text rendering compatible with WebGPU.
 * Uses TextGeometry for true geometry-based text rendering instead of SDF.
 *
 * WebGPU Compatible: ✅ (uses Three.js native TextGeometry)
 *
 * @example
 * Basic usage:
 * ```html
 * <a3d-troika-text
 *   text="Hello Three.js!"
 *   [fontSize]="0.5"
 *   color="#00ffff"
 *   [position]="[0, 0, 0]"
 *   anchorX="center"
 *   anchorY="middle"
 * />
 * ```
 *
 * @example
 * Multi-line text with layout:
 * ```html
 * <a3d-troika-text
 *   text="Line 1&#10;Line 2&#10;Line 3"
 *   [fontSize]="0.3"
 *   textAlign="center"
 *   anchorX="center"
 *   anchorY="middle"
 * />
 * ```
 *
 * @remarks
 * - Text is rendered using Three.js TextGeometry for sharp quality at all scales
 * - Font loading is async with loading state feedback via isLoading() signal
 * - Supports ng-content for directive composition (a3dFloat3d, a3dRotate3d)
 * - Full WebGPU and WebGL support
 * - All Three.js resources are properly disposed on component destruction
 */
@Component({
  selector: 'a3d-troika-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `troika-text-${crypto.randomUUID()}`,
    },
  ],
})
export class TroikaTextComponent {
  // ========================================
  // CORE TEXT PROPERTIES
  // ========================================

  /**
   * The text string to render.
   * Supports multi-line text using newline characters (\n).
   * @required
   */
  public readonly text = input.required<string>();

  /**
   * Font size in 3D world units.
   * @default 0.1
   */
  public readonly fontSize = input<number>(0.1);

  /**
   * Text color as CSS string or numeric hex value.
   * @default '#ffffff'
   */
  public readonly color = input<string | number>('#ffffff');

  /**
   * URL or path to custom font file (JSON format from Three.js fonts).
   * If null, uses the default Helvetiker Bold font.
   * @default null
   */
  public readonly font = input<string | null>(null);

  // ========================================
  // TRANSFORM PROPERTIES
  // ========================================

  /**
   * Position in 3D space [x, y, z].
   * @default [0, 0, 0]
   */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /**
   * Rotation in radians [x, y, z].
   * @default [0, 0, 0]
   */
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);

  /**
   * Scale factor. Can be uniform (number) or per-axis [x, y, z].
   * @default 1
   */
  public readonly scale = input<number | [number, number, number]>(1);

  // ========================================
  // LAYOUT PROPERTIES
  // ========================================

  /**
   * Horizontal anchor point as string ('left', 'center', 'right') or numeric value (0-1).
   * @default 'left'
   */
  public readonly anchorX = input<number | string>('left');

  /**
   * Vertical anchor point as string ('top', 'middle', 'bottom') or numeric value (0-1).
   * @default 'top'
   */
  public readonly anchorY = input<number | string>('top');

  // Note: maxWidth, textAlign, lineHeight, etc. are not supported with TextGeometry
  // These were Troika-specific features. For multi-line text, use \n characters.

  // ========================================
  // VISUAL STYLING PROPERTIES
  // ========================================

  /**
   * Fill opacity (0 = transparent, 1 = opaque).
   * @default 1
   */
  public readonly fillOpacity = input<number>(1);

  // ========================================
  // 3D GEOMETRY PROPERTIES (NEW!)
  // ========================================

  /**
   * Extrusion depth (thickness) of the text.
   * Set to 0 for flat text, > 0 for 3D extruded text.
   * @default 0.02 (slight depth for better lighting)
   */
  public readonly depth = input<number>(0.02);

  /**
   * Enable beveled edges for smoother appearance.
   * @default false
   */
  public readonly bevelEnabled = input<boolean>(false);

  // ========================================
  // BEHAVIOR PROPERTIES
  // ========================================

  /**
   * Enable billboard mode - text always faces the camera.
   * Useful for labels and UI elements in 3D space.
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
  // STATE SIGNALS
  // ========================================

  /**
   * Loading state signal - true while font is being loaded.
   * Useful for displaying loading indicators in UI.
   */
  public readonly isLoading = signal(true);

  /**
   * Load error signal - contains error message if font loading failed.
   * Null if no error or font loaded successfully.
   */
  public readonly loadError = signal<string | null>(null);

  // ========================================
  // INTERNAL STATE
  // ========================================

  private textMesh?: THREE.Mesh;
  private material?: THREE.MeshStandardNodeMaterial;
  private loadedFont?: Font;
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

    // Effect: Update material color reactively
    effect(() => {
      if (!this.material) return;
      this.material.color.set(this.color() as THREE.ColorRepresentation);
      this.material.opacity = this.fillOpacity();
    });

    // Effect: Billboard rotation
    effect(() => {
      if (!this.billboard()) {
        // Billboard disabled - cleanup if active
        if (this.cleanupBillboardLoop) {
          this.cleanupBillboardLoop();
          this.cleanupBillboardLoop = undefined;
        }
        return;
      }

      const camera = this.sceneService.camera();
      if (!camera || !this.textMesh) return;

      // Billboard enabled - register render loop callback
      this.cleanupBillboardLoop = this.renderLoop.registerUpdateCallback(() => {
        if (this.textMesh && camera) {
          this.textMesh.quaternion.copy(camera.quaternion);
        }
      });
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.cleanupBillboardLoop?.();
      this.sceneStore.remove(this.objectId);
      const parent = this.parent();
      if (parent) this.cleanup(parent);
    });
  }

  /**
   * Create text mesh from font
   */
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

    // Create TextGeometry
    const geometry = new TextGeometry(textContent, {
      font: font,
      size: this.fontSize(),
      height: this.depth(), // Extrusion depth
      curveSegments: 12,
      bevelEnabled: this.bevelEnabled(),
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

    // Create material (WebGPU compatible)
    this.material = new THREE.MeshStandardNodeMaterial();
    this.material.color = new THREE.Color(
      this.color() as THREE.ColorRepresentation
    );
    this.material.transparent = this.fillOpacity() < 1;
    this.material.opacity = this.fillOpacity();
    this.material.side = THREE.FrontSide;

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

  /**
   * Cleanup resources
   */
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
