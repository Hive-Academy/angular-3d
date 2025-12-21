/**
 * Performance3dDirective - Automatic performance optimization registration
 *
 * Registers 3D objects with AdvancedPerformanceOptimizerService for:
 * - Frustum culling
 * - LOD management
 * - Adaptive quality scaling
 *
 * Features:
 * - Automatic registration on initialization
 * - Lifecycle-aware cleanup on destroy
 * - Works with any Three.js Object3D
 * - Configurable enable/disable
 *
 * @example
 * ```html
 * <!-- Enable performance optimization -->
 * <a3d-box [a3dPerformance3d]="true" />
 *
 * <!-- With configuration -->
 * <a3d-sphere [a3dPerformance3d]="{ enabled: true }" />
 *
 * <!-- Disable optimization -->
 * <a3d-model [a3dPerformance3d]="false" />
 * ```
 */

import {
  Directive,
  inject,
  DestroyRef,
  afterNextRender,
  input,
} from '@angular/core';
import { AdvancedPerformanceOptimizerService } from '../services/advanced-performance-optimizer.service';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';

/**
 * Performance optimization configuration
 */
export interface PerformanceConfig {
  enabled: boolean;
}

/**
 * Performance3dDirective
 *
 * Automatically registers objects with the performance optimizer service.
 * Each Scene3dComponent has its own optimizer instance, ensuring per-scene optimization.
 */
@Directive({
  selector: '[a3dPerformance3d]',
  standalone: true,
})
export class Performance3dDirective {
  // Inject services
  private readonly optimizer = inject(AdvancedPerformanceOptimizerService);
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Performance configuration
   * Can be boolean or config object
   */
  public readonly a3dPerformance3d = input<boolean | PerformanceConfig>(true);

  constructor() {
    // Register object after next render (when Three.js object exists)
    afterNextRender(() => {
      const config = this.normalizeConfig(this.a3dPerformance3d());

      if (!config.enabled) {
        return;
      }

      if (!this.objectId) {
        console.warn(
          '[Performance3dDirective] No OBJECT_ID found - cannot register for optimization'
        );
        return;
      }

      const object = this.sceneStore.getObject(this.objectId);
      if (!object) {
        console.warn(
          `[Performance3dDirective] Object ${this.objectId} not found in scene store`
        );
        return;
      }

      // Register with optimizer
      this.optimizer.registerObject(this.objectId, object);
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.objectId) {
        this.optimizer.unregisterObject(this.objectId);
      }
    });
  }

  /**
   * Normalize config input to PerformanceConfig object
   */
  private normalizeConfig(
    input: boolean | PerformanceConfig
  ): PerformanceConfig {
    if (typeof input === 'boolean') {
      return { enabled: input };
    }
    return input;
  }
}
