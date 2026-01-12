/**
 * SSAO Effect Component - Screen Space Ambient Occlusion
 *
 * IMPORTANT: SSAO is NOT available in WebGPU native PostProcessing.
 * This component exists for API compatibility but logs a warning and does nothing.
 *
 * Native TSL (Three.js Shading Language) does not yet provide an SSAO node.
 * SSAO requires depth buffer access and complex sampling which is not yet
 * exposed in the native PostProcessing API.
 *
 * Future implementations may use:
 * 1. GTAOPass from three/addons (requires integration work)
 * 2. Custom TSL SSAO implementation (when depth buffer access is added)
 * 3. Post-processing compatibility mode (hybrid approach)
 *
 * For now, this component gracefully disables SSAO in WebGPU mode.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  afterNextRender,
} from '@angular/core';
import { SceneService } from '../../canvas/scene.service';

/**
 * SsaoEffectComponent - Screen Space Ambient Occlusion (DISABLED)
 *
 * This component is a NO-OP placeholder for API compatibility.
 * SSAO is not available in native WebGPU PostProcessing.
 *
 * When used, it will:
 * 1. Log a warning explaining SSAO is unavailable
 * 2. Suggest alternatives (GTAO, custom implementation)
 * 3. Do nothing (no effect added to post-processing pipeline)
 *
 * Must be used inside `a3d-effect-composer` (for API consistency).
 *
 * @remarks
 * Native TSL does not yet provide an SSAO node. The three-stdlib SSAOPass
 * relied on GLSL shaders which are incompatible with the new TSL-based
 * PostProcessing API.
 *
 * SSAO will be re-enabled when:
 * - Native TSL adds depth buffer sampling
 * - GTAOPass is integrated into PostProcessing
 * - A custom TSL SSAO implementation is created
 *
 * @example
 * ```html
 * <!-- This will log a warning and do nothing -->
 * <a3d-effect-composer>
 *   <a3d-ssao-effect
 *     [kernelRadius]="8"
 *     [minDistance]="0.001"
 *     [maxDistance]="0.1"
 *   />
 * </a3d-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- API preserved for backward compatibility -->
 * <a3d-effect-composer>
 *   <a3d-ssao-effect
 *     [kernelRadius]="16"
 *     [minDistance]="0.0005"
 *     [maxDistance]="0.15"
 *   />
 * </a3d-effect-composer>
 * ```
 */
@Component({
  selector: 'a3d-ssao-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SsaoEffectComponent {
  private readonly sceneService = inject(SceneService);

  /**
   * Kernel radius - the sampling radius in pixels for occlusion calculation.
   * NOTE: This parameter is preserved for API compatibility but has no effect.
   * Default: 8
   */
  public readonly kernelRadius = input<number>(8);

  /**
   * Minimum distance threshold - prevents self-occlusion artifacts.
   * NOTE: This parameter is preserved for API compatibility but has no effect.
   * Default: 0.001
   */
  public readonly minDistance = input<number>(0.001);

  /**
   * Maximum distance threshold - limits occlusion range.
   * NOTE: This parameter is preserved for API compatibility but has no effect.
   * Default: 0.1
   */
  public readonly maxDistance = input<number>(0.1);

  public constructor() {
    afterNextRender(() => {
      // Log warning about SSAO unavailability
      console.warn(
        '[SSAO] SSAO effect not available in WebGPU mode - native TSL has no SSAO node. ' +
          'Skipping SSAO effect. ' +
          'Alternatives: Use GTAO (three/addons) or wait for native TSL SSAO implementation. ' +
          'Component preserved for API compatibility.'
      );

      // Component exists but does nothing
      // This is intentional - graceful degradation
    });
  }
}
