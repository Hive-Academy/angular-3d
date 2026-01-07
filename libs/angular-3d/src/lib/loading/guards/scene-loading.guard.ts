/**
 * Scene Loading Guard - Functional route guard for scene readiness
 *
 * Waits for a scene ready signal before allowing route activation.
 * Implements fail-open behavior: if the timeout is exceeded, navigation
 * proceeds anyway with a console warning.
 *
 * Features:
 * - Functional guard pattern (CanActivateFn)
 * - Configurable timeout (default 10000ms)
 * - Custom ready signal support
 * - Fail-open on timeout (never blocks navigation indefinitely)
 * - SSR-safe (handles non-browser environments)
 *
 * @example
 * ```typescript
 * // Basic usage - wait for custom ready signal
 * const routes: Routes = [
 *   {
 *     path: 'scene',
 *     loadComponent: () => import('./scene.component'),
 *     canActivate: [sceneLoadingGuard({
 *       readySignal: () => myReadySignal,
 *       timeout: 8000
 *     })]
 *   }
 * ];
 *
 * // Without ready signal - allows navigation immediately
 * const routes: Routes = [
 *   {
 *     path: 'scene',
 *     loadComponent: () => import('./scene.component'),
 *     canActivate: [sceneLoadingGuard()]
 *   }
 * ];
 * ```
 */

import { inject, PLATFORM_ID, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { CanActivateFn } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, timeout, catchError, of } from 'rxjs';

/**
 * Configuration options for sceneLoadingGuard.
 */
export interface SceneLoadingGuardConfig {
  /**
   * Timeout in milliseconds before allowing navigation anyway (fail-open).
   * Default: 10000 (10 seconds)
   */
  timeout?: number;

  /**
   * Factory function that returns the ready signal to wait for.
   * If not provided, the guard allows navigation immediately.
   *
   * @example
   * ```typescript
   * // Wait for a custom signal
   * readySignal: () => mySceneReadySignal
   *
   * // Wait for an injected service's signal
   * readySignal: () => inject(MyService).isReady
   * ```
   */
  readySignal?: () => Signal<boolean>;
}

/**
 * Functional route guard that waits for scene readiness.
 *
 * This guard is designed to coordinate with scene initialization,
 * allowing the loading UI to remain visible until the scene is ready
 * to render. It implements a fail-open pattern: if the ready signal
 * doesn't become true within the timeout period, navigation proceeds
 * anyway with a warning logged to the console.
 *
 * **SSR Considerations**: In server-side rendering contexts, the guard
 * allows navigation immediately since signal-to-observable conversion
 * requires a browser environment.
 *
 * @param config - Optional configuration object
 * @returns CanActivateFn that can be used in route definitions
 *
 * @example
 * ```typescript
 * // With custom ready signal and timeout
 * const routes: Routes = [
 *   {
 *     path: 'hero',
 *     loadComponent: () => import('./hero-section.component'),
 *     canActivate: [sceneLoadingGuard({
 *       readySignal: () => inject(SceneReadyService).isSceneReady,
 *       timeout: 5000
 *     })]
 *   }
 * ];
 *
 * // Default behavior - immediate navigation
 * canActivate: [sceneLoadingGuard()]
 * ```
 */
export function sceneLoadingGuard(
  config: SceneLoadingGuardConfig = {}
): CanActivateFn {
  return () => {
    const platformId = inject(PLATFORM_ID);
    const timeoutMs = config.timeout ?? 10000;

    // SSR safety: In non-browser environments, allow navigation immediately
    // since toObservable requires browser APIs for proper signal tracking
    if (!isPlatformBrowser(platformId)) {
      return of(true);
    }

    // If no ready signal provided, allow navigation immediately
    if (!config.readySignal) {
      return of(true);
    }

    // Get the ready signal from the factory function
    const readySignal = config.readySignal();

    // If signal is already true, allow navigation immediately
    if (readySignal()) {
      return of(true);
    }

    // Convert signal to observable and wait for true value
    // with timeout and fail-open error handling
    return toObservable(readySignal).pipe(
      // Wait until the signal emits true
      filter((ready) => ready === true),
      // Take only the first true emission
      take(1),
      // Apply timeout - will error if not ready within timeoutMs
      timeout(timeoutMs),
      // Fail-open: on timeout or any error, log warning and allow navigation
      catchError((error) => {
        const isTimeout =
          error?.name === 'TimeoutError' || error?.message?.includes('Timeout');

        if (isTimeout) {
          console.warn(
            `[sceneLoadingGuard] Timeout after ${timeoutMs}ms waiting for scene ready signal. ` +
              `Proceeding with navigation (fail-open behavior). ` +
              `Consider increasing the timeout or investigating scene initialization delays.`
          );
        } else {
          console.warn(
            `[sceneLoadingGuard] Error while waiting for scene ready signal: ${
              error?.message ?? error
            }. ` + `Proceeding with navigation (fail-open behavior).`
          );
        }
        return of(true);
      })
    );
  };
}
