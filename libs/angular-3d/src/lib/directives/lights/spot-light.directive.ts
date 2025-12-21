/**
 * SpotLightDirective - Creates and manages THREE.SpotLight
 *
 * This directive creates a spot light that emits light from a single point in a
 * cone shape toward a target, like a flashlight or stage spotlight. Supports
 * distance falloff, cone angle, penumbra (soft edge), and shadows.
 *
 * Pattern: Signal-based reactive light creation with store registration
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'a3d-spot-light',
 *   hostDirectives: [
 *     { directive: SpotLightDirective, inputs: ['color', 'intensity', 'distance', 'angle', 'penumbra', 'decay', 'target', 'castShadow'] },
 *     { directive: TransformDirective, inputs: ['position'] }
 *   ]
 * })
 * export class SpotLightComponent {}
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
 * SpotLightDirective
 *
 * Creates THREE.SpotLight and registers with SceneGraphStore.
 * Spot light emits in a cone shape from a point toward a target.
 *
 * Lifecycle:
 * 1. Creates THREE.SpotLight in afterNextRender
 * 2. Registers light AND target with store (type='light')
 * 3. Updates light properties reactively via effects
 * 4. On destroy, removes light and target from store (store handles disposal)
 *
 * Note: Position is handled by TransformDirective via hostDirectives composition
 */
@Directive({
  selector: '[a3dSpotLight]',
  standalone: true,
})
export class SpotLightDirective {
  private readonly store = inject(SceneGraphStore);
  // DEBUG: Make optional to trace injection issue
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  // DEBUG: Log injection result
  private readonly _debug = (() => {
    console.log(
      '[SpotLightDirective] OBJECT_ID injection result:',
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

  /** Maximum angle of light cone in radians (default: PI/3 = 60 degrees) */
  public readonly angle = input<number>(Math.PI / 3);

  /** Percent of spotlight cone attenuated at edge (0-1, default: 0) */
  public readonly penumbra = input<number>(0);

  /** Light decay rate (2 = physically accurate) */
  public readonly decay = input<number>(2);

  /** Target position for light direction */
  public readonly target = input<[number, number, number]>([0, 0, 0]);

  /** Whether light casts shadows */
  public readonly castShadow = input<boolean>(false);

  /** Reference to created light (null until initialized) */
  private light: THREE.SpotLight | null = null;

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
        this.light.distance = this.distance();
        this.light.angle = this.angle();
        this.light.penumbra = this.penumbra();
        this.light.decay = this.decay();
        this.light.castShadow = this.castShadow();
      }
    });

    // Create and register light after render
    afterNextRender(() => {
      // DEBUG: Skip if no OBJECT_ID
      if (!this.objectId) {
        console.error(
          '[SpotLightDirective] No OBJECT_ID available - cannot register light'
        );
        return;
      }

      // Create THREE.SpotLight
      this.light = new THREE.SpotLight(
        this.color(),
        this.intensity(),
        this.distance(),
        this.angle(),
        this.penumbra(),
        this.decay()
      );
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
