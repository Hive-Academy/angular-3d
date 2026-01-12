/**
 * DirectionalLightDirective - Creates and manages THREE.DirectionalLight
 *
 * This directive creates a directional light that emits parallel light rays in a
 * specific direction, simulating sunlight. The position determines where the light
 * comes from, and it points toward its target.
 *
 * Pattern: Signal-based reactive light creation with store registration
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'a3d-directional-light',
 *   hostDirectives: [
 *     { directive: DirectionalLightDirective, inputs: ['color', 'intensity', 'target', 'castShadow'] },
 *     { directive: TransformDirective, inputs: ['position'] }
 *   ]
 * })
 * export class DirectionalLightComponent {}
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
import * as THREE from 'three/webgpu';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * DirectionalLightDirective
 *
 * Creates THREE.DirectionalLight and registers with SceneGraphStore.
 * Directional light emits parallel rays in a specific direction, like sunlight.
 *
 * Lifecycle:
 * 1. Creates THREE.DirectionalLight in afterNextRender
 * 2. Registers light AND target with store (type='light')
 * 3. Updates light properties reactively via effects
 * 4. On destroy, removes light and target from store (store handles disposal)
 *
 * Note: Position is handled by TransformDirective via hostDirectives composition
 */
@Directive({
  selector: '[a3dDirectionalLight]',
  standalone: true,
})
export class DirectionalLightDirective {
  private readonly store = inject(SceneGraphStore);
  // DEBUG: Make optional to trace injection issue
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** Light color (CSS color string or hex number) */
  public readonly color = input<string | number>('white');

  /** Light intensity (default: 1) */
  public readonly intensity = input<number>(1);

  /** Target position for light direction */
  public readonly target = input<[number, number, number]>([0, 0, 0]);

  /** Whether light casts shadows */
  public readonly castShadow = input<boolean>(false);

  /** Reference to created light (null until initialized) */
  private light: THREE.DirectionalLight | null = null;

  public constructor() {
    // Update target position when input changes
    effect(() => {
      if (this.light) {
        this.light.target.position.set(...this.target());
        this.light.target.updateMatrixWorld();
      }
    });

    // Update light properties when inputs change
    effect(() => {
      if (this.light) {
        this.light.color.set(this.color());
        this.light.intensity = this.intensity();
        this.light.castShadow = this.castShadow();
      }
    });

    // Create and register light after render
    afterNextRender(() => {
      // DEBUG: Skip if no OBJECT_ID
      if (!this.objectId) {
        console.error(
          '[DirectionalLightDirective] No OBJECT_ID available - cannot register light'
        );
        return;
      }

      // Create THREE.DirectionalLight
      this.light = new THREE.DirectionalLight(this.color(), this.intensity());
      this.light.target.position.set(...this.target());
      this.light.castShadow = this.castShadow();

      // Register light with store as 'light' type
      this.store.register(this.objectId, this.light, 'light');

      // Register target with store (target is an Object3D that needs to be in scene graph)
      this.store.register(
        `${this.objectId}-target`,
        this.light.target,
        'group'
      );
    });

    // Cleanup: Remove light and target from store on destroy
    this.destroyRef.onDestroy(() => {
      if (this.objectId) {
        this.store.remove(this.objectId);
        this.store.remove(`${this.objectId}-target`);
      }
    });
  }
}
