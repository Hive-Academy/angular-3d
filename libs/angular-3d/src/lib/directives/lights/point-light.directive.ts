/**
 * PointLightDirective - Creates and manages THREE.PointLight
 *
 * This directive creates a point light that emits light in all directions from
 * a single point in space, like a light bulb. Supports distance falloff and shadows.
 *
 * Pattern: Signal-based reactive light creation with store registration
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'a3d-point-light',
 *   hostDirectives: [
 *     { directive: PointLightDirective, inputs: ['color', 'intensity', 'distance', 'decay', 'castShadow'] },
 *     { directive: TransformDirective, inputs: ['position'] }
 *   ]
 * })
 * export class PointLightComponent {}
 * ```
 */

import {
  Directive,
  inject,
  DestroyRef,
  afterNextRender,
  input,
  effect,
} from '@angular/core';
import * as THREE from 'three';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * PointLightDirective
 *
 * Creates THREE.PointLight and registers with SceneGraphStore.
 * Point light emits from a single point in all directions with distance falloff.
 *
 * Lifecycle:
 * 1. Creates THREE.PointLight in afterNextRender
 * 2. Registers light with store (type='light')
 * 3. Updates light properties reactively via effects
 * 4. On destroy, removes light from store (store handles disposal)
 *
 * Note: Position is handled by TransformDirective via hostDirectives composition
 */
@Directive({
  selector: '[a3dPointLight]',
  standalone: true,
})
export class PointLightDirective {
  private readonly store = inject(SceneGraphStore);
  // DEBUG: Make optional to trace injection issue
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  // DEBUG: Log injection result
  private readonly _debug = (() => {
    console.log(
      '[PointLightDirective] OBJECT_ID injection result:',
      this.objectId
    );
    return true;
  })();

  /** Light color (CSS color string or hex number) */
  public readonly color = input<string | number>('white');

  /** Light intensity (default: 1) */
  public readonly intensity = input<number>(1);

  /** Maximum distance of light influence (0 = infinite) */
  public readonly distance = input<number>(0);

  /** Light decay rate (2 = physically accurate) */
  public readonly decay = input<number>(2);

  /** Whether light casts shadows */
  public readonly castShadow = input<boolean>(false);

  /** Reference to created light (null until initialized) */
  private light: THREE.PointLight | null = null;

  public constructor() {
    // Update light properties when inputs change
    effect(() => {
      if (this.light) {
        this.light.color.set(this.color());
        this.light.intensity = this.intensity();
        this.light.distance = this.distance();
        this.light.decay = this.decay();
        this.light.castShadow = this.castShadow();
      }
    });

    // Create and register light after render
    afterNextRender(() => {
      // DEBUG: Skip if no OBJECT_ID
      if (!this.objectId) {
        console.error(
          '[PointLightDirective] No OBJECT_ID available - cannot register light'
        );
        return;
      }

      // Create THREE.PointLight
      this.light = new THREE.PointLight(
        this.color(),
        this.intensity(),
        this.distance(),
        this.decay()
      );
      this.light.castShadow = this.castShadow();

      // Register with store as 'light' type
      this.store.register(this.objectId, this.light, 'light');
    });

    // Cleanup: Remove light from store on destroy
    this.destroyRef.onDestroy(() => {
      if (this.objectId) {
        this.store.remove(this.objectId);
      }
    });
  }
}
