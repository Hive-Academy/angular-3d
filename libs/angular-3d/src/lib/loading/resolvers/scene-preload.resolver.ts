/**
 * Scene Preload Resolver - Functional route resolver for asset preloading
 *
 * Triggers asset preloading during route resolution, before the component
 * is initialized. Returns a PreloadState that can be accessed via
 * ActivatedRoute.data in the component.
 *
 * Features:
 * - Functional resolver pattern (ResolveFn)
 * - Static asset list or dynamic factory function support
 * - Route parameter-based asset URLs
 * - Returns PreloadState for progress tracking
 * - Empty asset array handling (immediately ready state)
 *
 * @example
 * ```typescript
 * // Static asset list
 * const routes: Routes = [
 *   {
 *     path: 'scene',
 *     loadComponent: () => import('./scene.component'),
 *     resolve: {
 *       preloadState: scenePreloadResolver([
 *         { url: '/assets/model.glb', type: 'gltf' },
 *         { url: '/assets/texture.jpg', type: 'texture' }
 *       ])
 *     }
 *   }
 * ];
 *
 * // Dynamic asset list based on route parameters
 * const routes: Routes = [
 *   {
 *     path: 'scene/:sceneId',
 *     loadComponent: () => import('./scene.component'),
 *     resolve: {
 *       preloadState: scenePreloadResolver((route) => [
 *         { url: `/assets/scenes/${route.paramMap.get('sceneId')}/model.glb`, type: 'gltf' }
 *       ])
 *     }
 *   }
 * ];
 *
 * // In the component, access via ActivatedRoute.data
 * @Component({...})
 * export class SceneComponent {
 *   private route = inject(ActivatedRoute);
 *
 *   // Access preloadState from resolved data
 *   preloadState = toSignal(
 *     this.route.data.pipe(map(data => data['preloadState'] as PreloadState))
 *   );
 * }
 * ```
 */

import { inject } from '@angular/core';
import type { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import {
  AssetPreloaderService,
  type AssetDefinition,
  type PreloadState,
} from '../../loaders';

/**
 * Factory function type for dynamic asset list generation.
 *
 * Receives the activated route snapshot, allowing access to:
 * - paramMap: Route parameters (e.g., :id, :sceneId)
 * - queryParamMap: Query parameters
 * - data: Static route data
 *
 * @example
 * ```typescript
 * // Generate assets based on route parameter
 * const factory: AssetListFactory = (route) => {
 *   const sceneId = route.paramMap.get('sceneId');
 *   return [
 *     { url: `/assets/scenes/${sceneId}/main.glb`, type: 'gltf', weight: 3 },
 *     { url: `/assets/scenes/${sceneId}/environment.hdr`, type: 'hdri' }
 *   ];
 * };
 *
 * // Use query params for optional assets
 * const factory: AssetListFactory = (route) => {
 *   const assets: AssetDefinition[] = [
 *     { url: '/assets/base-model.glb', type: 'gltf' }
 *   ];
 *
 *   if (route.queryParamMap.get('highRes') === 'true') {
 *     assets.push({ url: '/assets/high-res-texture.jpg', type: 'texture' });
 *   }
 *
 *   return assets;
 * };
 * ```
 */
export type AssetListFactory = (
  route: ActivatedRouteSnapshot
) => AssetDefinition[];

/**
 * Functional route resolver that preloads assets before route activation.
 *
 * This resolver integrates with Angular's route resolution phase to start
 * asset preloading before the routed component is initialized. The returned
 * PreloadState provides reactive signals for tracking loading progress.
 *
 * **Key Behavior**:
 * - Assets start loading during route resolution
 * - Component receives PreloadState via ActivatedRoute.data
 * - Empty asset arrays return an immediately ready state
 * - Factory functions are called with the route snapshot for dynamic URLs
 *
 * **Important**: The resolver returns the PreloadState immediately after
 * starting the preload operation. It does NOT wait for assets to finish
 * loading. This allows the component to render with a loading UI while
 * assets load in the background.
 *
 * @param assetsOrFactory - Static asset array or factory function
 * @returns ResolveFn that returns PreloadState
 *
 * @example
 * ```typescript
 * // Route configuration with static assets
 * {
 *   path: 'gallery',
 *   component: GalleryComponent,
 *   resolve: {
 *     preloadState: scenePreloadResolver([
 *       { url: '/models/gallery.glb', type: 'gltf', weight: 3 },
 *       { url: '/textures/floor.jpg', type: 'texture' },
 *       { url: '/textures/walls.jpg', type: 'texture' }
 *     ])
 *   }
 * }
 *
 * // Route configuration with dynamic assets
 * {
 *   path: 'product/:productId',
 *   component: ProductViewerComponent,
 *   resolve: {
 *     preloadState: scenePreloadResolver((route) => {
 *       const productId = route.paramMap.get('productId');
 *       return [
 *         { url: `/api/products/${productId}/model.glb`, type: 'gltf' }
 *       ];
 *     })
 *   }
 * }
 * ```
 */
export function scenePreloadResolver(
  assetsOrFactory: AssetDefinition[] | AssetListFactory
): ResolveFn<PreloadState> {
  return (route: ActivatedRouteSnapshot) => {
    // Inject the preloader service within the resolver execution context
    const preloader = inject(AssetPreloaderService);

    // Determine assets to load:
    // - If factory function, call it with the route snapshot
    // - If array, use directly
    const assets =
      typeof assetsOrFactory === 'function'
        ? assetsOrFactory(route)
        : assetsOrFactory;

    // Start preloading and return the state object immediately
    // The preloader handles empty arrays by returning an immediately ready state
    // Component will receive this via ActivatedRoute.data['preloadState']
    return preloader.preload(assets);
  };
}
