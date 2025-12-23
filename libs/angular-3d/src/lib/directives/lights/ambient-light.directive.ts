/**
 * AmbientLightDirective - Creates and manages THREE.AmbientLight
 *
 * This directive creates an ambient light that illuminates all objects in the scene
 * equally from all directions. Ambient light has no specific source or direction.
 *
 * Pattern: Signal-based reactive light creation with store registration
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'a3d-ambient-light',
 *   hostDirectives: [
 *     { directive: AmbientLightDirective, inputs: ['color', 'intensity'] }
 *   ]
 * })
 * export class AmbientLightComponent {}
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
 * AmbientLightDirective
 *
 * Creates THREE.AmbientLight and registers with SceneGraphStore.
 * Ambient light provides uniform illumination across the entire scene.
 *
 * Lifecycle:
 * 1. Creates THREE.AmbientLight in afterNextRender
 * 2. Registers light with store (type='light')
 * 3. Updates light properties reactively via effects
 * 4. On destroy, removes light from store (store handles disposal)
 */
@Directive({
  selector: '[a3dAmbientLight]',
  standalone: true,
})
export class AmbientLightDirective {
  private readonly store = inject(SceneGraphStore);
  // DEBUG: Make optional to trace injection issue
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** Light color (CSS color string or hex number) */
  public readonly color = input<string | number>('white');

  /** Light intensity (default: 1) */
  public readonly intensity = input<number>(1);

  /** Reference to created light (null until initialized) */
  private light: THREE.AmbientLight | null = null;

  public constructor() {
    // Update light properties when inputs change
    effect(() => {
      if (this.light) {
        this.light.color.set(this.color());
        this.light.intensity = this.intensity();
      }
    });

    // Create and register light after render
    afterNextRender(() => {
      // DEBUG: Skip if no OBJECT_ID
      if (!this.objectId) {
        console.error(
          '[AmbientLightDirective] No OBJECT_ID available - cannot register light'
        );
        return;
      }

      // Create THREE.AmbientLight
      this.light = new THREE.AmbientLight(this.color(), this.intensity());

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
