/**
 * Chromatic Aberration Effect Component - RGB channel offset using TSL
 *
 * Creates a lens distortion effect by offsetting RGB color channels
 * based on distance from the center of the screen. This mimics the
 * optical aberration found in real camera lenses.
 *
 * The effect is subtle by design (intensity 0.0 - 0.1) to avoid
 * producing jarring visuals while still adding cinematic polish.
 *
 * Uses native TSL operations for WebGPU/WebGL cross-platform compatibility.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
  OnDestroy,
} from '@angular/core';
import { Fn, uv, float, vec2, vec3, sub, mul } from 'three/tsl';
import { Node } from 'three/webgpu';
import { EffectComposerService } from '../effect-composer.service';
import { SceneService } from '../../canvas/scene.service';

/**
 * Direction modes for chromatic aberration offset
 */
export type ChromaticAberrationDirection = 'radial' | 'horizontal' | 'vertical';

/**
 * ChromaticAberrationEffectComponent - RGB channel offset for lens distortion
 *
 * Offsets red and blue channels in opposite directions based on distance
 * from the center of the screen, creating a subtle lens aberration effect.
 *
 * Must be used inside a3d-scene-3d.
 *
 * @remarks
 * The effect samples UV coordinates at offset positions for each channel:
 * - Red channel: UV + offset (outward)
 * - Green channel: UV (no offset - reference)
 * - Blue channel: UV - offset (inward)
 *
 * This creates the characteristic color fringing seen at the edges of
 * low-quality camera lenses.
 *
 * @example
 * ```html
 * <a3d-scene-3d>
 *   <a3d-chromatic-aberration-effect [intensity]="0.02" />
 * </a3d-scene-3d>
 * ```
 *
 * @example
 * ```html
 * <!-- Horizontal only aberration for anamorphic lens look -->
 * <a3d-scene-3d>
 *   <a3d-chromatic-aberration-effect
 *     [intensity]="0.03"
 *     direction="horizontal"
 *   />
 * </a3d-scene-3d>
 * ```
 */
@Component({
  selector: 'a3d-chromatic-aberration-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChromaticAberrationEffectComponent implements OnDestroy {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);

  /**
   * Intensity of the chromatic aberration effect
   *
   * Controls how much the RGB channels are offset from each other.
   * Use subtle values for realistic lens effects.
   *
   * Range: 0.0 - 0.1 (clamped internally)
   * Default: 0.02
   *
   * - 0.0: No effect
   * - 0.01-0.02: Subtle, realistic lens aberration
   * - 0.03-0.05: More noticeable, stylized look
   * - 0.05-0.1: Strong effect, may be distracting
   */
  public readonly intensity = input<number>(0.02);

  /**
   * Direction of the chromatic aberration offset
   *
   * - 'radial': Offset based on distance from center (default, most realistic)
   * - 'horizontal': Offset only along X-axis (anamorphic lens look)
   * - 'vertical': Offset only along Y-axis
   *
   * Default: 'radial'
   */
  public readonly direction = input<ChromaticAberrationDirection>('radial');

  private readonly effectName = 'chromaticAberration';
  private effectAdded = false;

  public constructor() {
    // Add effect when renderer is available
    effect(() => {
      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();
      const camera = this.sceneService.camera();

      if (renderer && scene && camera && !this.effectAdded) {
        // Initialize the composer first (if not already done)
        this.composerService.init(renderer, scene, camera);

        // Create chromatic aberration TSL effect
        const chromaticAberrationEffect = this.createChromaticAberrationNode();

        // Add effect to composer
        this.composerService.addEffect(
          this.effectName,
          chromaticAberrationEffect
        );

        this.effectAdded = true;

        // Enable the composer to switch render function
        this.composerService.enable();
      }
    });

    // Update chromatic aberration parameters reactively
    effect(() => {
      if (this.effectAdded) {
        // Rebuild effect with new parameters
        const chromaticAberrationEffect = this.createChromaticAberrationNode();
        this.composerService.addEffect(
          this.effectName,
          chromaticAberrationEffect
        );
        this.sceneService.invalidate();
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.effectAdded) {
      this.composerService.removeEffect(this.effectName);
      this.effectAdded = false;
    }
  }

  /**
   * Create TSL chromatic aberration effect node
   *
   * Calculates UV offset based on distance from center and direction mode,
   * then creates a color difference that represents the aberration.
   *
   * The effect is additive - it adds color offsets to simulate RGB separation.
   */
  private createChromaticAberrationNode(): Node {
    // Clamp intensity to valid range (0.0 - 0.1)
    const intensityValue = Math.min(Math.max(this.intensity(), 0.0), 0.1);
    const directionValue = this.direction();

    // Create TSL function for chromatic aberration
    const chromaticAberrationFn = Fn(() => {
      // Get UV coordinates (0-1 range)
      const uvCoord = uv();

      // Calculate offset based on direction mode
      // Center is at (0.5, 0.5)
      const center = vec2(0.5, 0.5);
      const fromCenter = sub(uvCoord, center);

      // Calculate offset direction based on mode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let offset: any;

      if (directionValue === 'horizontal') {
        // Horizontal only - offset based on X distance from center
        offset = vec2(fromCenter.x, float(0));
      } else if (directionValue === 'vertical') {
        // Vertical only - offset based on Y distance from center
        offset = vec2(float(0), fromCenter.y);
      } else {
        // Radial (default) - offset based on full distance from center
        offset = fromCenter;
      }

      // Scale offset by intensity
      const scaledOffset = mul(offset, float(intensityValue));

      // Create color offset that simulates RGB channel separation
      // Red shifts outward (positive offset), Blue shifts inward (negative offset)
      const redOffset = mul(scaledOffset.x, float(2.0)); // Red shifts more on X
      const blueOffset = mul(scaledOffset.y.negate(), float(2.0)); // Blue shifts opposite on Y

      // Return the color offset (difference from original)
      // This gets added to the scene output in the effect chain
      return vec3(redOffset, float(0), blueOffset);
    })();

    // Type assertion for return - chromaticAberrationFn is a valid TSL Node
    return chromaticAberrationFn as unknown as Node;
  }
}
