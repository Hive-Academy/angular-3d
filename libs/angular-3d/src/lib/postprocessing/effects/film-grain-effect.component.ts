/**
 * Film Grain Effect Component - Animated noise overlay using TSL
 *
 * Creates a cinematic film grain effect by adding animated noise
 * to the scene output. Uses MaterialX fractal noise for GPU-optimized
 * noise generation that works on both WebGPU and WebGL backends.
 *
 * The grain animates over time to simulate the organic, flickering
 * quality of real film grain. The speed parameter controls how
 * quickly the grain pattern changes.
 *
 * Uses RenderLoopService for per-frame time updates to animate the noise.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
  DestroyRef,
  afterNextRender,
} from '@angular/core';
import { Fn, uv, float, vec3, uniform, mul } from 'three/tsl';
import { mx_fractal_noise_float } from 'three/tsl';
import { Node } from 'three/webgpu';
import { EffectComposerService } from '../effect-composer.service';
import { SceneService } from '../../canvas/scene.service';
import { RenderLoopService } from '../../render-loop/render-loop.service';

/**
 * FilmGrainEffectComponent - Animated cinematic film grain
 *
 * Overlays animated noise on the scene to create a film grain effect.
 * The noise is generated using MaterialX fractal noise for high quality
 * and GPU performance.
 *
 * Must be used inside `a3d-effect-composer`.
 *
 * @remarks
 * The effect uses a time uniform that is updated each frame via the
 * RenderLoopService. This creates the characteristic flickering/shimmering
 * quality of real film grain.
 *
 * The grain is applied as an additive overlay, meaning it adds brightness
 * variation to the scene without replacing colors entirely.
 *
 * @example
 * ```html
 * <a3d-effect-composer>
 *   <a3d-film-grain-effect [intensity]="0.1" />
 * </a3d-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- Subtle grain for modern digital look -->
 * <a3d-effect-composer>
 *   <a3d-film-grain-effect
 *     [intensity]="0.05"
 *     [speed]="0.5"
 *   />
 * </a3d-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- Heavy grain for vintage film look -->
 * <a3d-effect-composer>
 *   <a3d-color-grading-effect [saturation]="0.8" [vignette]="0.3" />
 *   <a3d-film-grain-effect [intensity]="0.2" [speed]="1.5" />
 * </a3d-effect-composer>
 * ```
 */
@Component({
  selector: 'a3d-film-grain-effect',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilmGrainEffectComponent {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Intensity of the film grain effect
   *
   * Controls how visible the grain overlay is.
   * Use subtle values for modern/digital looks, higher for vintage film.
   *
   * Range: 0.0 - 0.5 (clamped internally)
   * Default: 0.1
   *
   * - 0.0: No grain
   * - 0.05-0.1: Subtle, modern digital grain
   * - 0.1-0.2: Medium grain, noticeable but not distracting
   * - 0.2-0.5: Heavy grain, vintage film look
   */
  public readonly intensity = input<number>(0.1);

  /**
   * Animation speed of the grain pattern
   *
   * Controls how quickly the grain pattern changes over time.
   * Higher values create more rapid flickering.
   *
   * Range: 0.1 - 5.0 (recommended)
   * Default: 1.0
   *
   * - 0.5: Slow, subtle shimmer
   * - 1.0: Natural film grain speed
   * - 2.0-3.0: Fast, aggressive flickering
   */
  public readonly speed = input<number>(1.0);

  private readonly effectName = 'filmGrain';
  private initialized = false;

  // Time uniform for animation - updated each frame
  private readonly timeUniform = uniform(float(0));
  private renderLoopCleanup: (() => void) | null = null;

  public constructor() {
    afterNextRender(() => {
      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();
      const camera = this.sceneService.camera();

      if (renderer && scene && camera) {
        // Initialize the composer first (if not already done)
        this.composerService.init(renderer, scene, camera);

        // Create film grain TSL effect
        const filmGrainEffect = this.createFilmGrainNode();

        // Add effect to composer
        this.composerService.addEffect(this.effectName, filmGrainEffect);

        // Enable the composer to switch render function
        this.composerService.enable();
        this.initialized = true;

        // Register render loop callback to update time uniform
        this.renderLoopCleanup = this.renderLoop.registerUpdateCallback(
          (_delta, elapsed) => {
            // Update time uniform with elapsed time multiplied by speed
            this.timeUniform.value = elapsed * this.speed();
          }
        );
      }
    });

    // Update film grain parameters reactively
    effect(() => {
      // Trigger reactivity on all inputs
      this.intensity();
      this.speed();

      // Only update if initialized
      if (this.initialized) {
        // Rebuild effect with new parameters
        const filmGrainEffect = this.createFilmGrainNode();
        this.composerService.addEffect(this.effectName, filmGrainEffect);
        this.sceneService.invalidate();
      }
    });

    // Cleanup on destroy using DestroyRef pattern
    this.destroyRef.onDestroy(() => {
      // Remove render loop callback
      if (this.renderLoopCleanup) {
        this.renderLoopCleanup();
        this.renderLoopCleanup = null;
      }

      // Remove effect from composer
      this.composerService.removeEffect(this.effectName);
    });
  }

  /**
   * Create TSL film grain effect node
   *
   * Uses MaterialX fractal noise with animated z-coordinate to create
   * a shimmering grain pattern. The noise is remapped from [-1, 1] to
   * [0, 1] and scaled by intensity.
   *
   * The noise is applied as an additive offset (can be positive or negative)
   * centered around zero, meaning it adds and subtracts brightness
   * to create the grainy texture.
   */
  private createFilmGrainNode(): Node {
    // Clamp intensity to valid range (0.0 - 0.5)
    const intensityValue = Math.min(Math.max(this.intensity(), 0.0), 0.5);
    const timeNode = this.timeUniform;

    // Create TSL function for film grain
    const filmGrainFn = Fn(() => {
      // Get UV coordinates
      const uvCoord = uv();

      // Create animated noise position
      // Scale UV to create fine grain (higher multiplier = finer grain)
      // Animate z-coordinate with time for temporal variation
      const noisePos = vec3(
        mul(uvCoord.x, float(100)),
        mul(uvCoord.y, float(100)),
        mul(timeNode, float(10))
      );

      // Sample MaterialX fractal noise
      // Parameters: position, octaves, lacunarity, diminish
      // - octaves: 3 for medium detail (balance quality vs performance)
      // - lacunarity: 2.0 (frequency multiplier per octave)
      // - diminish: 0.5 (amplitude reduction per octave)
      const noise = mx_fractal_noise_float(
        noisePos,
        float(3),
        float(2.0),
        float(0.5)
      );

      // Remap noise from [-1, 1] to centered around 0 with intensity scaling
      // This creates both bright and dark grain particles
      // The result is added to the scene output, so:
      // - positive values brighten pixels
      // - negative values darken pixels
      const grain = mul(noise, float(intensityValue));

      // Return as vec3 color offset (grayscale grain applied equally to RGB)
      return vec3(grain, grain, grain);
    })();

    // Type assertion for return - filmGrainFn is a valid TSL Node
    return filmGrainFn as unknown as Node;
  }
}
