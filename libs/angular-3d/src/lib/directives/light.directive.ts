/**
 * LightDirective - Base directive for light registration with SceneGraphStore
 *
 * This directive provides a base pattern for all light components to register
 * with the SceneGraphStore. Lights are registered as type='light' and managed
 * by the store for hierarchical transformations and lifecycle management.
 *
 * Pattern: Signal-based reactive light registration with store
 *
 * @example
 * ```typescript
 * @Directive({
 *   selector: '[a3dAmbientLight]',
 *   standalone: true,
 * })
 * export class AmbientLightDirective {
 *   // Creates AmbientLight, calls registerLight()
 * }
 * ```
 */

import { Directive, inject } from '@angular/core';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';
import type * as THREE from 'three';

/**
 * LightDirective
 *
 * Base directive providing common light registration logic.
 * Specific light directives extend this pattern to create and register
 * their specific light types (AmbientLight, PointLight, etc.).
 *
 * Lifecycle:
 * 1. Child directive creates specific THREE light
 * 2. Child calls registerLight() to register with store (type='light')
 * 3. Store manages light lifecycle and disposal
 */
@Directive({
  selector: '[a3dLight]',
  standalone: true,
})
export class LightDirective {
  protected readonly store = inject(SceneGraphStore);
  protected readonly objectId = inject(OBJECT_ID);

  /**
   * Register a light with the SceneGraphStore
   * @param light - The THREE.Light instance to register
   */
  protected registerLight(light: THREE.Light): void {
    this.store.register(this.objectId, light, 'light');
  }

  /**
   * Remove light from store (triggers disposal)
   */
  protected removeLight(): void {
    this.store.remove(this.objectId);
  }
}
