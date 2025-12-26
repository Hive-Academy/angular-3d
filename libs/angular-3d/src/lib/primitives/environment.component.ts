/**
 * EnvironmentComponent - HDRI/EXR Environment Map Loading
 *
 * Loads high dynamic range images for image-based lighting (IBL), enabling
 * photorealistic PBR material appearance. Supports custom HDRI files and
 * preset environments from polyhaven.com.
 *
 * ## Architecture
 *
 * This component uses THREE.PMREMGenerator to process equirectangular HDRI
 * images into environment maps suitable for PBR material reflections. The
 * processed environment map is applied to scene.environment, which all
 * PBR materials (MeshStandardMaterial, MeshPhysicalMaterial) automatically use.
 *
 * ## Features
 *
 * - Custom HDRI/EXR file loading via `hdri` input
 * - Preset environments via `preset` input (sunset, dawn, studio, etc.)
 * - Optional background display with configurable blur
 * - Intensity control for environment lighting strength
 * - Loading progress events for UI feedback
 * - Automatic resource cleanup on destroy
 *
 * @example
 * ```html
 * <!-- Load custom HDRI with background -->
 * <a3d-environment
 *   [hdri]="'/assets/studio.hdr'"
 *   [background]="true"
 *   [blur]="0.3"
 *   [intensity]="1.5"
 *   (loading)="onProgress($event)"
 *   (loaded)="onLoaded($event)"
 *   (error)="onError($event)"
 * />
 *
 * <!-- Use preset environment -->
 * <a3d-environment [preset]="'sunset'" [intensity]="1.2" />
 *
 * <!-- Studio lighting for product visualization -->
 * <a3d-environment [preset]="'studio'" [background]="true" [blur]="0.5" />
 * ```
 *
 * @example
 * ```typescript
 * // Component with loading state tracking
 * @Component({
 *   template: `
 *     <a3d-scene>
 *       <a3d-environment
 *         [hdri]="hdriPath()"
 *         [background]="true"
 *         [blur]="0.2"
 *         (loading)="loadProgress.set($event)"
 *         (loaded)="onEnvironmentReady($event)"
 *         (error)="handleError($event)"
 *       />
 *       @if (loadProgress() < 100) {
 *         <div class="loading">Loading: {{ loadProgress() }}%</div>
 *       }
 *       <a3d-box [position]="[0, 0, 0]">
 *         <ng-container a3dPhysicalMaterial [metalness]="1" [roughness]="0.1" />
 *       </a3d-box>
 *     </a3d-scene>
 *   `
 * })
 * export class ProductViewerComponent {
 *   hdriPath = signal('/assets/environments/studio_small.hdr');
 *   loadProgress = signal(0);
 *
 *   onEnvironmentReady(texture: THREE.Texture) {
 *     console.log('Environment loaded, PBR materials now reflect it');
 *   }
 *
 *   handleError(error: Error) {
 *     console.error('Failed to load environment:', error);
 *   }
 * }
 * ```
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  effect,
  inject,
  DestroyRef,
  signal,
  output,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { RGBELoader } from 'three-stdlib';
import { SceneService } from '../canvas/scene.service';

/**
 * Environment presets - URLs to commonly used HDRIs.
 * Using polyhaven.com CDN for high-quality free HDRIs.
 *
 * All presets use 1K resolution for fast loading while maintaining quality.
 * For higher quality, use the `hdri` input with a custom 2K/4K HDRI file.
 */
export const ENVIRONMENT_PRESETS: Record<string, string> = {
  sunset:
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_43d_clear_puresky_1k.hdr',
  dawn: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dikhololo_night_1k.hdr',
  night:
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonlit_golf_1k.hdr',
  warehouse:
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/empty_warehouse_01_1k.hdr',
  forest:
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/forest_slope_1k.hdr',
  apartment:
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/lebombo_1k.hdr',
  studio:
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr',
  city: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr',
  park: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/rooitou_park_1k.hdr',
  lobby:
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/modern_buildings_2_1k.hdr',
} as const;

/**
 * Available environment preset names.
 * Use these with the `preset` input for quick environment setup.
 */
export type EnvironmentPreset = keyof typeof ENVIRONMENT_PRESETS;

/**
 * EnvironmentComponent - Declarative HDRI environment loading
 *
 * Uses Angular signals for reactive updates and integrates with the
 * angular-3d scene service for automatic scene configuration.
 */
@Component({
  selector: 'a3d-environment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class EnvironmentComponent {
  // ============================================================================
  // Source Inputs (mutually exclusive - hdri takes precedence)
  // ============================================================================

  /**
   * Path to a custom HDRI/EXR file.
   * When provided, this takes precedence over the `preset` input.
   * Supports both local paths ('/assets/env.hdr') and URLs.
   */
  public readonly hdri = input<string | undefined>(undefined);

  /**
   * Preset environment to use from polyhaven.com.
   * Ignored if `hdri` is provided.
   * Available presets: sunset, dawn, night, warehouse, forest, apartment,
   * studio, city, park, lobby.
   */
  public readonly preset = input<EnvironmentPreset | undefined>(undefined);

  // ============================================================================
  // Configuration Inputs
  // ============================================================================

  /**
   * Whether to display the environment map as the scene background.
   * When true, the HDRI is visible as the skybox.
   * @default false
   */
  public readonly background = input<boolean>(false);

  /**
   * Background blur amount (0-1).
   * Only applies when `background` is true.
   * 0 = sharp background, 1 = fully blurred.
   * @default 0
   */
  public readonly blur = input<number>(0);

  /**
   * Environment lighting intensity multiplier.
   * Affects how strongly PBR materials are lit by the environment.
   * @default 1
   */
  public readonly intensity = input<number>(1);

  // ============================================================================
  // Output Events
  // ============================================================================

  /**
   * Emits loading progress percentage (0-100) during HDRI download.
   * Useful for displaying loading indicators.
   */
  public readonly loading = output<number>();

  /**
   * Emits when the environment map is fully loaded and applied.
   * Provides the processed THREE.Texture for advanced use cases.
   */
  public readonly loaded = output<THREE.Texture>();

  /**
   * Emits when an error occurs during loading.
   * The component handles errors gracefully without crashing the scene.
   */
  public readonly error = output<Error>();

  // ============================================================================
  // Injected Dependencies
  // ============================================================================

  private readonly sceneService = inject(SceneService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // Internal State
  // ============================================================================

  /** PMREM generator for processing equirectangular HDRIs */
  private pmremGenerator: THREE.PMREMGenerator | null = null;

  /** The processed environment map texture */
  private envMap: THREE.Texture | null = null;

  /** RGBE loader instance for loading HDR files */
  private loader: RGBELoader | null = null;

  /** Tracks active loading operation for cancellation */
  private loadingAborted = false;

  /**
   * Loading state signal - true while HDRI is being fetched.
   * Useful for conditional rendering in templates.
   */
  public readonly isLoading = signal(false);

  /**
   * Error message signal - contains error message if loading failed.
   * Null if no error or loading succeeded.
   */
  public readonly loadError = signal<string | null>(null);

  // ============================================================================
  // Constructor & Lifecycle
  // ============================================================================

  constructor() {
    // Effect: Load environment when source changes
    effect((onCleanup) => {
      const hdriPath = this.hdri();
      const presetName = this.preset();

      // Determine URL to load
      let url: string | undefined;
      if (hdriPath) {
        url = hdriPath;
      } else if (presetName && ENVIRONMENT_PRESETS[presetName]) {
        url = ENVIRONMENT_PRESETS[presetName];
      }

      if (!url) {
        // Clear environment if no source provided
        this.clearEnvironment();
        return;
      }

      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();

      if (!renderer || !scene) {
        return;
      }

      // Reset abort flag for new load
      this.loadingAborted = false;

      this.loadEnvironment(url, renderer, scene);

      onCleanup(() => {
        // Mark as aborted so callbacks don't apply to stale scene
        this.loadingAborted = true;
        this.clearEnvironment();
      });
    });

    // Effect: Update background display settings
    effect(() => {
      const scene = this.sceneService.scene();
      const showBackground = this.background();
      const blurAmount = this.blur();

      if (!scene || !this.envMap) {
        return;
      }

      if (showBackground) {
        scene.background = this.envMap;
        scene.backgroundBlurriness = Math.max(0, Math.min(1, blurAmount));
      } else {
        scene.background = null;
      }

      this.sceneService.invalidate();
    });

    // Effect: Update environment intensity
    effect(() => {
      const scene = this.sceneService.scene();
      const intensityValue = this.intensity();

      if (!scene) {
        return;
      }

      scene.environmentIntensity = Math.max(0, intensityValue);
      this.sceneService.invalidate();
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.dispose();
    });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Loads an HDRI file and applies it to the scene.
   *
   * @param url URL or path to the HDRI file
   * @param renderer WebGPU renderer for PMREM generation
   * @param scene Scene to apply environment to
   */
  private loadEnvironment(
    url: string,
    renderer: THREE.WebGPURenderer,
    scene: THREE.Scene
  ): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    // Dispose previous resources before loading new
    this.disposeResources();

    // Initialize PMREMGenerator for environment map processing
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();

    // Initialize RGBE loader
    this.loader = new RGBELoader();

    this.loader.load(
      url,
      // onLoad callback
      (texture) => {
        // Check if this load was aborted (e.g., component destroyed or source changed)
        if (this.loadingAborted) {
          texture.dispose();
          return;
        }

        // Generate environment map from equirectangular HDRI
        const pmremResult = this.pmremGenerator!.fromEquirectangular(texture);
        this.envMap = pmremResult.texture;

        // Apply as scene environment for PBR materials
        scene.environment = this.envMap;

        // Apply background if enabled
        if (this.background()) {
          scene.background = this.envMap;
          scene.backgroundBlurriness = Math.max(0, Math.min(1, this.blur()));
        }

        // Apply intensity
        scene.environmentIntensity = Math.max(0, this.intensity());

        // Dispose source texture (no longer needed after PMREM processing)
        texture.dispose();

        // Dispose PMREM generator (no longer needed after processing)
        if (this.pmremGenerator) {
          this.pmremGenerator.dispose();
          this.pmremGenerator = null;
        }

        // Update state
        this.isLoading.set(false);
        this.loaded.emit(this.envMap);
        this.sceneService.invalidate();
      },
      // onProgress callback
      (progress) => {
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          this.loading.emit(percent);
        }
      },
      // onError callback
      (err) => {
        // Check if this load was aborted
        if (this.loadingAborted) {
          return;
        }

        const error =
          err instanceof Error
            ? err
            : new Error(typeof err === 'string' ? err : 'Failed to load HDRI');

        this.isLoading.set(false);
        this.loadError.set(error.message);
        this.error.emit(error);

        console.error('[EnvironmentComponent] Failed to load HDRI:', error);
      }
    );
  }

  /**
   * Clears the environment from the scene without disposing resources.
   * Used when switching sources or on effect cleanup.
   */
  private clearEnvironment(): void {
    const scene = this.sceneService.scene();
    if (scene) {
      scene.environment = null;
      // Only clear background if it's a texture (not a color)
      if (scene.background instanceof THREE.Texture) {
        scene.background = null;
      }
      this.sceneService.invalidate();
    }
  }

  /**
   * Disposes Three.js resources without clearing scene.
   * Separated from clearEnvironment for proper cleanup ordering.
   */
  private disposeResources(): void {
    if (this.envMap) {
      this.envMap.dispose();
      this.envMap = null;
    }

    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
      this.pmremGenerator = null;
    }

    // Clear loader reference
    this.loader = null;
  }

  /**
   * Full cleanup - clears scene and disposes all resources.
   * Called on component destroy.
   */
  private dispose(): void {
    this.loadingAborted = true;
    this.clearEnvironment();
    this.disposeResources();
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Get the current environment map texture.
   * Returns null if no environment is loaded.
   *
   * @returns The processed environment map texture or null
   *
   * @example
   * ```typescript
   * const envMap = environmentComponent.getEnvMap();
   * if (envMap) {
   *   customMaterial.envMap = envMap;
   * }
   * ```
   */
  public getEnvMap(): THREE.Texture | null {
    return this.envMap;
  }

  /**
   * Force reload the current environment.
   * Useful when the HDRI file has been updated on the server.
   *
   * @remarks
   * If a load is already in progress, this method will log a warning and return
   * without starting a new load to prevent race conditions and resource leaks.
   *
   * @example
   * ```typescript
   * // Reload after file update
   * environmentComponent.reload();
   * ```
   */
  public reload(): void {
    // Prevent race conditions - don't start a new load while one is in progress
    if (this.isLoading()) {
      console.warn(
        '[EnvironmentComponent] Reload called while already loading, ignoring'
      );
      return;
    }

    const hdriPath = this.hdri();
    const presetName = this.preset();
    const renderer = this.sceneService.renderer();
    const scene = this.sceneService.scene();

    let url: string | undefined;
    if (hdriPath) {
      url = hdriPath;
    } else if (presetName && ENVIRONMENT_PRESETS[presetName]) {
      url = ENVIRONMENT_PRESETS[presetName];
    }

    if (url && renderer && scene) {
      this.loadingAborted = false;
      this.loadEnvironment(url, renderer, scene);
    }
  }
}
