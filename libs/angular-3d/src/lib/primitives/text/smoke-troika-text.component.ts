import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  effect,
  signal,
  DestroyRef,
} from '@angular/core';
import { Text } from 'troika-three-text';
import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { float, vec3, uniform, smoothstep, uv, mul, add, pow } from 'three/tsl';
import { NG_3D_PARENT } from '../../types/tokens';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { nativeFBM, domainWarp } from '../shaders/tsl-utilities';

/**
 * Smoke-effect 3D text component using TSL-based atmospheric rendering.
 *
 * Creates crisp SDF text with TSL-based smoke/fog effects. Uses MaterialX noise
 * for organic smoke patterns that work on both WebGPU and WebGL backends.
 *
 * @example
 * Static smoke text:
 * ```html
 * <a3d-smoke-troika-text
 *   text="SMOKE EFFECT"
 *   [fontSize]="1.0"
 *   smokeColor="#8a2be2"
 *   [smokeIntensity]="1.5"
 *   [enableFlow]="false"
 *   [position]="[0, 0, 0]"
 * />
 * ```
 *
 * @example
 * Animated flowing smoke:
 * ```html
 * <a3d-smoke-troika-text
 *   text="FLOWING"
 *   [fontSize]="0.8"
 *   smokeColor="#00ffff"
 *   [smokeIntensity]="1.0"
 *   [flowSpeed]="0.5"
 *   [density]="1.2"
 *   [edgeSoftness]="0.4"
 * />
 * ```
 *
 * @remarks
 * - Uses TSL-based smoke (NOT GLSL shaders) for GPU efficiency
 * - Single draw call per text instance
 * - Supports animated smoke flow using MaterialX noise
 * - Text quality preserved via Troika SDF rendering
 * - Material override approach maintains text crispness
 * - WebGPU/WebGL compatible via TSL auto-transpilation
 */
@Component({
  selector: 'a3d-smoke-troika-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `smoke-troika-text-${crypto.randomUUID()}`,
    },
  ],
})
export class SmokeTroikaTextComponent {
  // ========================================
  // CORE TEXT PROPERTIES (from TroikaTextComponent)
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
   * Base text color (before smoke effect applied).
   * @default '#ffffff'
   */
  public readonly color = input<string | number>('#ffffff');

  /**
   * URL or path to custom font file (TTF, OTF, WOFF).
   * If null, uses the default font.
   * @default null
   */
  public readonly font = input<string | null>(null);

  /**
   * Font style: 'normal' or 'italic'.
   * @default 'normal'
   */
  public readonly fontStyle = input<'normal' | 'italic'>('normal');

  /**
   * Font weight: 'normal', 'bold', or numeric (100-900).
   * @default 'normal'
   */
  public readonly fontWeight = input<string | number>('normal');

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
   * Maximum width for text wrapping in world units.
   * Text will wrap to multiple lines if it exceeds this width.
   * @default Infinity (no wrapping)
   */
  public readonly maxWidth = input<number>(Infinity);

  /**
   * Horizontal text alignment within the maxWidth.
   * @default 'left'
   */
  public readonly textAlign = input<'left' | 'right' | 'center' | 'justify'>(
    'left'
  );

  /**
   * Horizontal anchor point as percentage string ('left', 'center', 'right')
   * or numeric value (0 = left edge, 0.5 = center, 1 = right edge).
   * @default 'left'
   */
  public readonly anchorX = input<number | string>('left');

  /**
   * Vertical anchor point as percentage string ('top', 'middle', 'bottom')
   * or numeric value (0 = top edge, 0.5 = middle, 1 = bottom edge).
   * @default 'top'
   */
  public readonly anchorY = input<number | string>('top');

  /**
   * Line height as multiple of fontSize (number) or absolute value (string with units).
   * @default 1.2
   */
  public readonly lineHeight = input<number | string>(1.2);

  /**
   * Letter spacing adjustment in world units.
   * Positive values increase spacing, negative values decrease.
   * @default 0
   */
  public readonly letterSpacing = input<number>(0);

  /**
   * CSS white-space behavior: 'normal' or 'nowrap'.
   * @default 'normal'
   */
  public readonly whiteSpace = input<'normal' | 'nowrap'>('normal');

  /**
   * CSS overflow-wrap behavior: 'normal' or 'break-word'.
   * @default 'normal'
   */
  public readonly overflowWrap = input<'normal' | 'break-word'>('normal');

  // ========================================
  // VISUAL STYLING PROPERTIES
  // ========================================

  /**
   * Fill opacity (0 = transparent, 1 = opaque).
   * @default 1
   */
  public readonly fillOpacity = input<number>(1);

  /**
   * Outline/stroke width in world units (number) or as percentage string.
   * Set to 0 to disable outline.
   * @default 0
   */
  public readonly outlineWidth = input<number | string>(0);

  /**
   * Outline color as CSS string or numeric hex value.
   * @default '#000000'
   */
  public readonly outlineColor = input<string | number>('#000000');

  /**
   * Outline blur radius in world units (number) or as percentage string.
   * @default 0 (sharp outline)
   */
  public readonly outlineBlur = input<number | string>(0);

  /**
   * Outline opacity (0 = transparent, 1 = opaque).
   * @default 1
   */
  public readonly outlineOpacity = input<number>(1);

  // ========================================
  // ADVANCED RENDERING PROPERTIES
  // ========================================

  /**
   * Size of SDF glyph texture atlas in pixels.
   * Higher values = better quality but more memory.
   * @default 64
   */
  public readonly sdfGlyphSize = input<number>(64);

  /**
   * Level of detail for glyph geometry (1-4).
   * Higher values = smoother curves but more vertices.
   * @default 1
   */
  public readonly glyphGeometryDetail = input<number>(1);

  /**
   * Enable GPU-accelerated SDF generation (requires WebGL2).
   * Falls back to CPU if unavailable.
   * @default true
   */
  public readonly gpuAccelerateSDF = input<boolean>(true);

  /**
   * Depth offset for depth testing.
   * Useful for preventing z-fighting.
   * @default 0
   */
  public readonly depthOffset = input<number>(0);

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
  // SMOKE-SPECIFIC PROPERTIES
  // ========================================

  /**
   * Smoke tint color as CSS string or numeric hex value.
   * This color is blended with the base text color for the smoke effect.
   * @default '#8a2be2' (purple)
   */
  public readonly smokeColor = input<string | number>('#8a2be2');

  /**
   * Smoke density/intensity multiplier.
   * Higher values = denser, more visible smoke.
   * @default 1.0
   */
  public readonly smokeIntensity = input<number>(1.0);

  /**
   * Animation flow speed multiplier.
   * Only applies when enableFlow is true.
   * @default 0.5
   */
  public readonly flowSpeed = input<number>(0.5);

  /**
   * Edge softness for smoke falloff.
   * Lower values = softer, more gaseous edges.
   * @default 0.3
   */
  public readonly edgeSoftness = input<number>(0.3);

  /**
   * Overall smoke cloud density.
   * @default 1.1
   */
  public readonly density = input<number>(1.1);

  /**
   * Enable animated smoke flow.
   * If true, smoke will animate using MaterialX noise over time.
   * @default true
   */
  public readonly enableFlow = input<boolean>(true);

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
  public readonly isLoading = signal(false);

  /**
   * Load error signal - contains error message if font loading failed.
   * Null if no error or font loaded successfully.
   */
  public readonly loadError = signal<string | null>(null);

  // ========================================
  // INTERNAL STATE
  // ========================================

  private textObject?: Text;
  private smokeMaterial?: MeshBasicNodeMaterial;
  private uTime?: ReturnType<typeof uniform>;
  private cleanupRenderLoop?: () => void;
  private cleanupBillboard?: () => void;

  public constructor() {
    // Effect: Initialize and update text with TSL smoke material
    effect((onCleanup) => {
      const textContent = this.text();
      const parent = this.parent();

      if (!textContent || !parent) return;

      this.isLoading.set(true);
      this.loadError.set(null);

      // Create or update text object
      if (!this.textObject) {
        this.textObject = new Text();
        this.updateAllTextProperties();

        // Create custom TSL smoke material
        this.smokeMaterial = this.createSmokeMaterial();
        this.textObject.material = this.smokeMaterial;

        // Sync and add to parent
        this.textObject.sync(() => {
          if (this.textObject && parent) {
            parent.add(this.textObject);
            this.sceneStore.register(this.objectId, this.textObject, 'mesh');
            this.isLoading.set(false);
          }
        });
      } else {
        this.updateAllTextProperties();
        this.textObject.sync(() => {
          this.isLoading.set(false);
        });
      }

      onCleanup(() => {
        if (this.textObject && parent) {
          parent.remove(this.textObject);
          this.sceneStore.remove(this.objectId);
          this.textObject.dispose();
          this.textObject = undefined;
        }
      });
    });

    // Effect: Animate smoke flow
    // MEMORY LEAK FIX: Register callback ONCE (not inside effect)
    // Callback executes conditionally based on enableFlow() signal
    this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback((delta) => {
      // Execute conditionally based on signal
      if (this.enableFlow() && this.uTime) {
        (this.uTime.value as number) += delta * this.flowSpeed();
      }
    });

    // Effect: Billboard rotation (optional)
    effect(() => {
      if (!this.billboard()) {
        // Billboard disabled - cleanup if active
        if (this.cleanupBillboard) {
          this.cleanupBillboard();
          this.cleanupBillboard = undefined;
        }
        return;
      }

      const camera = this.sceneService.camera();
      if (!camera || !this.textObject) return;

      // Billboard enabled - register render loop callback
      this.cleanupBillboard = this.renderLoop.registerUpdateCallback(() => {
        if (this.textObject && camera) {
          this.textObject.quaternion.copy(camera.quaternion);
        }
      });
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.cleanupRenderLoop?.();
      this.cleanupBillboard?.();
      this.sceneStore.remove(this.objectId);
      if (this.smokeMaterial) {
        this.smokeMaterial.dispose();
      }
      if (this.textObject) {
        this.textObject.dispose();
      }
    });
  }

  /**
   * Create custom TSL smoke material
   * Uses MaterialX noise instead of GLSL shaders
   * @private
   */
  private createSmokeMaterial(): MeshBasicNodeMaterial {
    // Create TSL uniform nodes
    this.uTime = uniform(float(0));
    const uSmokeColor = uniform(
      vec3(...new THREE.Color(this.smokeColor()).toArray())
    );
    const uSmokeIntensity = uniform(float(this.smokeIntensity()));
    const uDensity = uniform(float(this.density()));
    const uEdgeSoftness = uniform(float(this.edgeSoftness()));

    const material = new MeshBasicNodeMaterial();

    // UV-space position for noise sampling
    const pos = vec3(mul(uv(), float(10.0)), float(0));

    // Animated flow offset
    const time = mul(this.uTime, float(0.05));
    const flowOffset = vec3(
      mul(time, float(0.15)),
      mul(time, float(0.08)),
      mul(time, float(0.05))
    );

    // Apply domain warping for organic smoke
    const warpedPos = domainWarp(add(pos, flowOffset), float(0.6));

    // Generate multi-scale smoke density using MaterialX FBM
    const smoke1 = nativeFBM(warpedPos, float(5), float(2.0), float(0.5));
    const smoke2 = nativeFBM(
      add(mul(warpedPos, float(1.5)), vec3(5.2, 3.7, 8.1)),
      float(4),
      float(2.0),
      float(0.5)
    );
    const smoke3 = nativeFBM(
      add(mul(warpedPos, float(0.6)), vec3(2.3, 7.1, 4.6)),
      float(3),
      float(2.0),
      float(0.5)
    );

    // Combine smoke layers
    const smokeDensity = add(
      add(mul(smoke1, float(0.45)), mul(smoke2, float(0.35))),
      mul(smoke3, float(0.2))
    );

    // Normalize to [0, 1]
    const normalizedDensity = mul(add(smokeDensity, float(1.0)), float(0.5));

    // Apply density multiplier
    const densityWithMult = mul(normalizedDensity, uDensity);

    // Ultra-soft edge falloff (no visible geometry boundaries)
    const centeredUv = add(uv(), vec3(-0.5, -0.5, 0));
    const distFromCenter = centeredUv.length();

    // Multi-stage radial falloff for extremely soft edges
    const radialFalloff1 = float(1).sub(
      smoothstep(float(0.0), float(0.6), distFromCenter)
    );
    const radialFalloff2 = float(1).sub(
      smoothstep(float(0.0), float(0.5), distFromCenter)
    );
    const radialFalloff3 = float(1).sub(
      smoothstep(float(0.0), float(0.4), distFromCenter)
    );

    // Combine multiple falloff stages
    const edgeFalloff = add(
      add(mul(radialFalloff1, float(0.3)), mul(radialFalloff2, float(0.4))),
      mul(radialFalloff3, float(0.3))
    );

    // Configurable edge softness
    const softEdgeFalloff = pow(edgeFalloff, uEdgeSoftness);

    // Noise-based irregularity for organic edges
    const edgeNoise1 = nativeFBM(
      mul(warpedPos, float(1.2)),
      float(3),
      float(2.0),
      float(0.5)
    );
    const edgeNoise2 = nativeFBM(
      add(mul(warpedPos, float(0.6)), vec3(5.0, 5.0, 5.0)),
      float(3),
      float(2.0),
      float(0.5)
    );
    const edgeNoise = add(
      mul(add(mul(edgeNoise1, float(0.5)), float(0.5)), float(0.6)),
      mul(add(mul(edgeNoise2, float(0.5)), float(0.5)), float(0.4))
    );

    const finalEdgeFalloff = mul(
      softEdgeFalloff,
      add(float(0.2), mul(edgeNoise, float(0.8)))
    );

    // Calculate base alpha
    const alpha = mul(mul(densityWithMult, finalEdgeFalloff), uSmokeIntensity);

    // Very soft alpha curves for gas-like appearance
    const alphaRaised = pow(alpha.max(float(0.0)), float(1.8));
    const alphaSmoothStep1 = smoothstep(float(0.0), float(1.0), alphaRaised);
    const alphaSmoothStep2 = smoothstep(
      float(0.0),
      float(1.0),
      alphaSmoothStep1
    );

    // Smoke color with intensity variation
    const brightness = add(float(0.4), mul(densityWithMult, float(1.2)));
    const finalColorBase = mul(uSmokeColor, brightness);

    // Add glow in bright areas
    const brightAreas = smoothstep(float(0.55), float(0.75), densityWithMult);
    const glow = mul(pow(brightAreas, float(3.0)), float(2.0));
    const finalColor = add(finalColorBase, mul(glow, uSmokeColor));

    // Assign color and opacity nodes to material
    material.colorNode = finalColor;
    material.opacityNode = alphaSmoothStep2;

    // Material properties
    material.transparent = true;
    material.blending = THREE.AdditiveBlending;
    material.depthWrite = false;
    material.side = THREE.DoubleSide;

    return material;
  }

  /**
   * Update all text properties from signal inputs.
   * Called whenever text is created or signal inputs change.
   * @private
   */
  private updateAllTextProperties(): void {
    if (!this.textObject) return;

    // Text content & font
    this.textObject.text = this.text();
    this.textObject.fontSize = this.fontSize();
    this.textObject.color = this.color();
    if (this.font()) this.textObject.font = this.font();
    this.textObject.fontStyle = this.fontStyle();
    this.textObject.fontWeight = this.fontWeight();

    // Layout
    this.textObject.maxWidth = this.maxWidth();
    this.textObject.textAlign = this.textAlign();
    this.textObject.anchorX = this.anchorX();
    this.textObject.anchorY = this.anchorY();
    this.textObject.lineHeight = this.lineHeight();
    this.textObject.letterSpacing = this.letterSpacing();
    this.textObject.whiteSpace = this.whiteSpace();
    this.textObject.overflowWrap = this.overflowWrap();

    // Styling
    this.textObject.fillOpacity = this.fillOpacity();
    this.textObject.outlineWidth = this.outlineWidth();
    this.textObject.outlineColor = this.outlineColor();
    this.textObject.outlineBlur = this.outlineBlur();
    this.textObject.outlineOpacity = this.outlineOpacity();

    // Advanced
    this.textObject.sdfGlyphSize = this.sdfGlyphSize();
    this.textObject.glyphGeometryDetail = this.glyphGeometryDetail();
    this.textObject.gpuAccelerateSDF = this.gpuAccelerateSDF();
    this.textObject.depthOffset = this.depthOffset();

    // Transform
    this.textObject.position.set(...this.position());
    this.textObject.rotation.set(...this.rotation());
    const s = this.scale();
    const scale: [number, number, number] =
      typeof s === 'number' ? [s, s, s] : s;
    this.textObject.scale.set(...scale);
  }
}
