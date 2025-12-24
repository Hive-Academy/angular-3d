/**
 * Color Grading Effect Component - Cinematic color correction
 *
 * Provides comprehensive color grading controls including saturation,
 * contrast, brightness, gamma, exposure, and vignette effects.
 * Uses custom GLSL shaders for real-time color manipulation.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
  DestroyRef,
} from '@angular/core';
import { ShaderPass } from 'three-stdlib';
import { EffectComposerService } from '../effect-composer.service';
import { SceneService } from '../../canvas/scene.service';

/**
 * Custom color grading shader with comprehensive controls
 *
 * Implements common color correction techniques used in film/video:
 * - Exposure: Overall brightness before other adjustments
 * - Saturation: Color intensity (0 = grayscale, 1 = normal, >1 = vibrant)
 * - Contrast: Difference between light and dark areas
 * - Brightness: Overall lightness multiplier
 * - Gamma: Non-linear brightness adjustment (affects midtones)
 * - Vignette: Darkening of corners for cinematic effect
 */
const ColorGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1.0 },
    contrast: { value: 1.0 },
    brightness: { value: 1.0 },
    gamma: { value: 2.2 },
    exposure: { value: 1.0 },
    vignette: { value: 0.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision mediump float;

    uniform sampler2D tDiffuse;
    uniform float saturation;
    uniform float contrast;
    uniform float brightness;
    uniform float gamma;
    uniform float exposure;
    uniform float vignette;
    varying vec2 vUv;

    // Compute luminance using Rec. 709 coefficients
    vec3 adjustSaturation(vec3 color, float sat) {
      vec3 luminanceWeights = vec3(0.2126, 0.7152, 0.0722);
      float luminance = dot(color, luminanceWeights);
      return mix(vec3(luminance), color, sat);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      // Exposure - applied first (like camera exposure)
      color *= exposure;

      // Saturation - adjust color intensity
      color = adjustSaturation(color, saturation);

      // Contrast - expand/compress tonal range around midpoint
      color = (color - 0.5) * contrast + 0.5;

      // Brightness - simple multiplier
      color *= brightness;

      // Gamma correction - power curve for display
      color = pow(max(color, vec3(0.0)), vec3(1.0 / gamma));

      // Vignette - darken corners for cinematic effect
      if (vignette > 0.0) {
        vec2 center = vUv - 0.5;
        float dist = length(center);
        float vig = smoothstep(0.8, 0.2, dist * (1.0 + vignette));
        color *= mix(1.0, vig, vignette);
      }

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), texel.a);
    }
  `,
};

/**
 * ColorGradingEffectComponent - Cinematic color correction
 *
 * Adjusts saturation, contrast, brightness, gamma, exposure, and vignette.
 * Perfect for creating cinematic looks or correcting scene colors.
 *
 * Must be used inside `a3d-effect-composer`.
 *
 * @remarks
 * LUT (Look-Up Table) support is planned for a future version. LUT textures
 * enable complex color transformations by mapping input colors to output colors
 * through a 3D texture lookup, allowing for film-grade color grading presets.
 *
 * @example
 * ```html
 * <a3d-effect-composer>
 *   <a3d-color-grading-effect
 *     [saturation]="1.2"
 *     [contrast]="1.1"
 *     [vignette]="0.3"
 *   />
 * </a3d-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- Moody dark look with desaturated colors -->
 * <a3d-effect-composer>
 *   <a3d-color-grading-effect
 *     [saturation]="0.8"
 *     [contrast]="1.3"
 *     [brightness]="0.9"
 *     [exposure]="0.95"
 *     [vignette]="0.5"
 *   />
 * </a3d-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- Bright and vibrant look for product visualization -->
 * <a3d-effect-composer>
 *   <a3d-color-grading-effect
 *     [saturation]="1.3"
 *     [contrast]="1.05"
 *     [brightness]="1.1"
 *     [exposure]="1.1"
 *     [gamma]="2.4"
 *   />
 * </a3d-effect-composer>
 * ```
 */
@Component({
  selector: 'a3d-color-grading-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorGradingEffectComponent {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Saturation level - controls color intensity
   * 0 = grayscale, 1 = normal, >1 = more vibrant colors
   * Default: 1 (no change)
   */
  public readonly saturation = input<number>(1);

  /**
   * Contrast level - difference between light and dark areas
   * <1 = flatter image, 1 = normal, >1 = more contrast
   * Default: 1 (no change)
   */
  public readonly contrast = input<number>(1);

  /**
   * Brightness multiplier - overall lightness
   * <1 = darker, 1 = normal, >1 = brighter
   * Default: 1 (no change)
   */
  public readonly brightness = input<number>(1);

  /**
   * Gamma value - non-linear brightness curve
   * Lower values = brighter midtones, higher = darker midtones
   * Default: 2.2 (standard sRGB gamma)
   */
  public readonly gamma = input<number>(2.2);

  /**
   * Exposure level - simulates camera exposure
   * Applied before other adjustments, affects overall brightness
   * Default: 1 (no change)
   */
  public readonly exposure = input<number>(1);

  /**
   * Vignette intensity - darkens image corners
   * 0 = no vignette, higher values = stronger corner darkening
   * Default: 0 (disabled)
   */
  public readonly vignette = input<number>(0);

  private pass: ShaderPass | null = null;

  public constructor() {
    // Create pass when renderer is available
    effect(() => {
      const renderer = this.sceneService.renderer();

      if (renderer && !this.pass) {
        this.pass = new ShaderPass(ColorGradingShader);
        this.composerService.addPass(this.pass);
      }
    });

    // Update shader uniforms reactively
    effect(() => {
      if (this.pass) {
        this.pass.uniforms['saturation'].value = this.saturation();
        this.pass.uniforms['contrast'].value = this.contrast();
        this.pass.uniforms['brightness'].value = this.brightness();
        this.pass.uniforms['gamma'].value = this.gamma();
        this.pass.uniforms['exposure'].value = this.exposure();
        this.pass.uniforms['vignette'].value = this.vignette();
        this.sceneService.invalidate();
      }
    });

    // Cleanup on destroy using DestroyRef pattern
    this.destroyRef.onDestroy(() => {
      if (this.pass) {
        this.composerService.removePass(this.pass);
        this.pass = null;
      }
    });
  }
}
