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
import { NG_3D_PARENT } from '../../types/tokens';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';
import { SceneGraphStore } from '../../store/scene-graph.store';

/**
 * Smoke-effect 3D text component using shader-based atmospheric rendering.
 *
 * Creates crisp SDF text with shader-based smoke/fog effects. Uses custom
 * fragment shader with Perlin noise for organic smoke patterns.
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
 * - Uses shader-based smoke (NOT particles) for GPU efficiency
 * - Single draw call per text instance
 * - Supports animated smoke flow using Perlin noise
 * - Text quality preserved via Troika SDF rendering
 * - Material override approach maintains text crispness
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
   * If true, smoke will animate using Perlin noise over time.
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
  private smokeMaterial?: THREE.ShaderMaterial;
  private cleanupRenderLoop?: () => void;
  private cleanupBillboard?: () => void;

  public constructor() {
    // Effect: Initialize and update text with smoke shader
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

        // Create custom smoke shader material
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

    // Effect: Update shader uniforms when smoke properties change
    effect(() => {
      if (!this.smokeMaterial) return;

      // Update uniforms reactively
      this.smokeMaterial.uniforms['uSmokeColor'].value = new THREE.Color(
        this.smokeColor()
      );
      this.smokeMaterial.uniforms['uSmokeIntensity'].value =
        this.smokeIntensity();
      this.smokeMaterial.uniforms['uFlowSpeed'].value = this.flowSpeed();
      this.smokeMaterial.uniforms['uDensity'].value = this.density();
      this.smokeMaterial.uniforms['uEdgeSoftness'].value = this.edgeSoftness();
    });

    // Effect: Animate smoke flow
    // MEMORY LEAK FIX: Register callback ONCE (not inside effect)
    // Callback executes conditionally based on enableFlow() signal
    this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback((delta) => {
      // Execute conditionally based on signal
      if (this.enableFlow() && this.smokeMaterial) {
        this.smokeMaterial.uniforms['uTime'].value += delta * this.flowSpeed();
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
   * Create custom smoke shader material
   * @private
   */
  private createSmokeMaterial(): THREE.ShaderMaterial {
    const uniforms = {
      uTime: { value: 0.0 },
      uSmokeColor: { value: new THREE.Color(this.smokeColor()) },
      uSmokeIntensity: { value: this.smokeIntensity() },
      uFlowSpeed: { value: this.flowSpeed() },
      uDensity: { value: this.density() },
      uEdgeSoftness: { value: this.edgeSoftness() },
    };

    return new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Vertex Shader - Pass through with UV coordinates
   * @private
   */
  private readonly vertexShader = `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  /**
   * Fragment Shader - Smoke effect with Perlin noise
   * Based on NebulaVolumetricComponent shader pattern
   * @private
   */
  private readonly fragmentShader = `
    uniform float uTime;
    uniform vec3 uSmokeColor;
    uniform float uSmokeIntensity;
    uniform float uFlowSpeed;
    uniform float uDensity;
    uniform float uEdgeSoftness;

    varying vec2 vUv;

    // 3D Simplex noise function (from NebulaVolumetricComponent)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    // FBM (Fractal Brownian Motion) for detailed smoke patterns
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;

      for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }

      return value;
    }

    // Domain warping for organic smoke tendrils
    vec3 domainWarp(vec3 p) {
      float warpAmount = 0.6;
      return p + vec3(
        fbm(p + vec3(1.7, 9.2, 4.1)) * warpAmount,
        fbm(p + vec3(8.3, 2.8, 5.5)) * warpAmount,
        fbm(p + vec3(3.5, 6.1, 2.9)) * warpAmount
      );
    }

    void main() {
      // UV-space position for noise sampling
      vec3 pos = vec3(vUv * 10.0, 0.0);

      // Animated flow offset
      float time = uTime * uFlowSpeed * 0.05;
      vec3 flowOffset = vec3(time * 0.15, time * 0.08, time * 0.05);

      // Apply domain warping for organic smoke
      vec3 warpedPos = domainWarp(pos + flowOffset);

      // Generate multi-scale smoke density using FBM
      float smoke1 = fbm(warpedPos);
      float smoke2 = fbm(warpedPos * 1.5 + vec3(5.2, 3.7, 8.1));
      float smoke3 = fbm(warpedPos * 0.6 + vec3(2.3, 7.1, 4.6));

      // Combine smoke layers
      float smokeDensity = smoke1 * 0.45 + smoke2 * 0.35 + smoke3 * 0.2;
      smokeDensity = (smokeDensity + 1.0) * 0.5; // Normalize to [0, 1]

      // Apply density multiplier
      smokeDensity *= uDensity;

      // Ultra-soft edge falloff (no visible geometry boundaries)
      vec2 centeredUv = vUv - 0.5;
      float distFromCenter = length(centeredUv);

      // Multi-stage radial falloff for extremely soft edges
      float radialFalloff1 = 1.0 - smoothstep(0.0, 0.6, distFromCenter);
      float radialFalloff2 = 1.0 - smoothstep(0.0, 0.5, distFromCenter);
      float radialFalloff3 = 1.0 - smoothstep(0.0, 0.4, distFromCenter);

      // Combine multiple falloff stages
      float edgeFalloff = radialFalloff1 * 0.3 + radialFalloff2 * 0.4 + radialFalloff3 * 0.3;

      // Configurable edge softness
      edgeFalloff = pow(edgeFalloff, uEdgeSoftness);

      // Noise-based irregularity for organic edges
      float edgeNoise1 = fbm(warpedPos * 1.2) * 0.5 + 0.5;
      float edgeNoise2 = fbm(warpedPos * 0.6 + vec3(5.0, 5.0, 5.0)) * 0.5 + 0.5;
      float edgeNoise = edgeNoise1 * 0.6 + edgeNoise2 * 0.4;

      edgeFalloff *= 0.2 + edgeNoise * 0.8;

      // Calculate base alpha
      float alpha = smokeDensity * edgeFalloff * uSmokeIntensity;

      // Very soft alpha curves for gas-like appearance
      alpha = pow(max(alpha, 0.0), 1.8);
      alpha = smoothstep(0.0, 1.0, alpha);
      alpha = smoothstep(0.0, 1.0, alpha); // Double smoothstep for extra softness

      // Discard nearly transparent pixels for performance
      if (alpha < 0.002) discard;

      // Smoke color with intensity variation
      float brightness = 0.4 + smokeDensity * 1.2;
      vec3 finalColor = uSmokeColor * brightness;

      // Add glow in bright areas
      float brightAreas = smoothstep(0.55, 0.75, smokeDensity);
      float glow = pow(brightAreas, 3.0) * 2.0;
      finalColor += glow * uSmokeColor;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

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
