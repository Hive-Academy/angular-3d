/**
 * LoadingEntranceDemoSectionComponent - Demonstrates Loading & Cinematic Entrance System
 *
 * This demo showcases the complete loading orchestration and cinematic entrance flow:
 * 1. Asset preloading with progress tracking (GLTF model + texture)
 * 2. Cinematic camera entrance animation (dolly-in preset)
 * 3. Staggered reveal of 3D objects after entrance completes
 *
 * Features Demonstrated:
 * - AssetPreloaderService for multi-asset loading with unified progress
 * - CinematicEntranceDirective with preloadState integration
 * - SceneRevealDirective with stagger group coordination
 * - StaggerGroupService for cascade reveal effects
 * - OrbitControls coordination during entrance animation
 *
 * @example
 * Usage in template:
 * ```html
 * <app-loading-entrance-demo-section />
 * ```
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  Scene3dComponent,
  OrbitControlsComponent,
  BoxComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  StarFieldComponent,
  AssetPreloaderService,
  CinematicEntranceDirective,
  SceneRevealDirective,
  StaggerGroupService,
  type CinematicEntranceConfig,
  type PreloadState,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS, SCENE_COLOR_STRINGS } from '../../../shared/colors';

/**
 * Demo section component for Loading & Cinematic Entrance system.
 *
 * Demonstrates the full flow:
 * 1. Assets preload with progress UI
 * 2. When ready, cinematic camera entrance plays
 * 3. After entrance completes, objects reveal with stagger animation
 */
@Component({
  selector: 'app-loading-entrance-demo-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    Scene3dComponent,
    OrbitControlsComponent,
    BoxComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    StarFieldComponent,
    CinematicEntranceDirective,
    SceneRevealDirective,
  ],
  template: `
    <!-- Section Container -->
    <section
      class="relative py-24 bg-gradient-to-b from-gray-900 via-slate-900 to-gray-900"
    >
      <!-- Section Header -->
      <div class="container mx-auto px-6 mb-12">
        <div class="text-center max-w-3xl mx-auto">
          <!-- Badge -->
          <span
            class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 backdrop-blur-md rounded-full text-sm font-medium border border-cyan-500/30 mb-6"
          >
            <span class="relative flex h-2 w-2">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"
              ></span>
            </span>
            <span class="text-cyan-300">New Feature</span>
          </span>

          <!-- Title -->
          <h2
            class="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          >
            Loading &
            <span
              class="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
            >
              Cinematic Entrance
            </span>
          </h2>

          <!-- Description -->
          <p class="text-lg text-gray-300 leading-relaxed">
            Orchestrate asset loading with beautiful progress UI, then wow users
            with cinematic camera entrance animations. Objects reveal with
            staggered cascade effects for professional polish.
          </p>
        </div>
      </div>

      <!-- Demo Container -->
      <div class="container mx-auto px-6">
        <div
          class="relative aspect-video max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/10 bg-gray-950 shadow-2xl"
        >
          <!-- 3D Scene -->
          <a3d-scene-3d
            [cameraPosition]="cameraPosition"
            [cameraFov]="50"
            [backgroundColor]="backgroundColor"
          >
            <!-- OrbitControls with CinematicEntrance directive -->
            <!-- The directive coordinates with controls: disables during animation, syncs target after -->
            <a3d-orbit-controls
              [target]="[0, 0, 0]"
              [enableDamping]="true"
              [dampingFactor]="0.05"
              [minDistance]="8"
              [maxDistance]="25"
              a3dCinematicEntrance
              [entranceConfig]="entranceConfig"
              (controlsReady)="onControlsReady($event)"
              (entranceComplete)="onEntranceComplete()"
            />

            <!-- Lighting -->
            <a3d-ambient-light [intensity]="0.4" />
            <a3d-directional-light
              [position]="[8, 10, 5]"
              [intensity]="1.2"
              [color]="lightColor"
            />
            <a3d-directional-light
              [position]="[-5, 3, -8]"
              [intensity]="0.4"
              [color]="rimLightColor"
            />

            <!-- Star Field Background -->
            <a3d-star-field
              [starCount]="1500"
              [radius]="50"
              [size]="0.025"
              [multiSize]="true"
              [stellarColors]="true"
              [enableTwinkle]="true"
            />

            <!-- Box 1: Scale Pop Animation -->
            <a3d-box
              a3dSceneReveal
              [revealConfig]="{
                animation: 'scale-pop',
                staggerGroup: 'demo-boxes',
                staggerIndex: 0,
                duration: 0.8
              }"
              [position]="[-4, 0, 0]"
              [args]="[1.8, 1.8, 1.8]"
              [color]="box1Color"
            />

            <!-- Box 2: Fade In Animation -->
            <a3d-box
              a3dSceneReveal
              [revealConfig]="{
                animation: 'fade-in',
                staggerGroup: 'demo-boxes',
                staggerIndex: 1,
                duration: 0.8
              }"
              [position]="[0, 0, 0]"
              [args]="[2, 2, 2]"
              [color]="box2Color"
            />

            <!-- Box 3: Rise Up Animation -->
            <a3d-box
              a3dSceneReveal
              [revealConfig]="{
                animation: 'rise-up',
                staggerGroup: 'demo-boxes',
                staggerIndex: 2,
                duration: 0.8
              }"
              [position]="[4, 0, 0]"
              [args]="[1.8, 1.8, 1.8]"
              [color]="box3Color"
            />
          </a3d-scene-3d>

          <!-- Loading Overlay - Shows during preload -->
          @if (!preloadState.isReady()) {
          <div
            class="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm z-10"
          >
            <!-- Loading Spinner -->
            <div class="relative mb-6">
              <div
                class="w-20 h-20 border-4 border-cyan-500/20 rounded-full"
              ></div>
              <div
                class="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"
              ></div>
              <div
                class="absolute inset-0 flex items-center justify-center text-cyan-400 font-bold text-lg"
              >
                {{ preloadState.progress() | number : '1.0-0' }}%
              </div>
            </div>

            <!-- Loading Text -->
            <div class="text-white text-lg font-medium mb-2">
              Loading Assets...
            </div>
            <div class="text-gray-400 text-sm">
              {{ preloadState.loadedCount() }} / {{ preloadState.totalCount() }}
              assets
            </div>

            <!-- Progress Bar -->
            <div class="w-64 h-2 bg-gray-800 rounded-full mt-4 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                [style.width.%]="preloadState.progress()"
              ></div>
            </div>
          </div>
          }

          <!-- Status Indicator (after loading) -->
          @if (preloadState.isReady()) {
          <div class="absolute top-4 left-4 z-10 pointer-events-none">
            <div
              class="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10"
            >
              <div class="flex items-center gap-2 text-sm">
                @if (!entranceCompleted()) {
                <span
                  class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
                ></span>
                <span class="text-yellow-300">Camera Entrance...</span>
                } @else {
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                <span class="text-green-300">Interactive Mode</span>
                }
              </div>
            </div>
          </div>
          }

          <!-- Animation Labels -->
          @if (entranceCompleted()) {
          <div
            class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          >
            <div
              class="flex gap-8 px-6 py-3 bg-black/50 backdrop-blur-sm rounded-xl border border-white/10"
            >
              <div class="text-center">
                <div class="text-xs text-gray-400 mb-1">Left Box</div>
                <div class="text-sm font-medium text-cyan-300">Scale Pop</div>
              </div>
              <div class="text-center">
                <div class="text-xs text-gray-400 mb-1">Center Box</div>
                <div class="text-sm font-medium text-emerald-300">Fade In</div>
              </div>
              <div class="text-center">
                <div class="text-xs text-gray-400 mb-1">Right Box</div>
                <div class="text-sm font-medium text-violet-300">Rise Up</div>
              </div>
            </div>
          </div>
          }

          <!-- Replay Button -->
          @if (entranceCompleted()) {
          <button
            type="button"
            class="absolute top-4 right-4 z-10 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-sm rounded-lg border border-cyan-500/30 text-cyan-300 text-sm font-medium transition-all duration-200 hover:scale-105"
            (click)="replayDemo()"
          >
            <span class="flex items-center gap-2">
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Replay
            </span>
          </button>
          }
        </div>

        <!-- Feature Cards -->
        <div class="grid md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          <!-- Card 1: Asset Preloading -->
          <div
            class="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10"
          >
            <div
              class="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4"
            >
              <svg
                class="w-6 h-6 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">
              Asset Preloading
            </h3>
            <p class="text-gray-400 text-sm">
              Unified progress tracking across GLTF models and textures with
              weighted loading for accurate percentages.
            </p>
          </div>

          <!-- Card 2: Camera Entrance -->
          <div
            class="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10"
          >
            <div
              class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4"
            >
              <svg
                class="w-6 h-6 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">
              Cinematic Entrance
            </h3>
            <p class="text-gray-400 text-sm">
              Four built-in presets: dolly-in, orbit-drift, crane-up, and
              fade-drift. Full OrbitControls coordination.
            </p>
          </div>

          <!-- Card 3: Stagger Reveal -->
          <div
            class="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10"
          >
            <div
              class="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center mb-4"
            >
              <svg
                class="w-6 h-6 text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">
              Stagger Reveal
            </h3>
            <p class="text-gray-400 text-sm">
              Three animation types: scale-pop, fade-in, rise-up. Cascade timing
              with StaggerGroupService coordination.
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class LoadingEntranceDemoSectionComponent {
  // ================================
  // Dependency Injection
  // ================================

  private readonly preloader = inject(AssetPreloaderService);
  private readonly staggerService = inject(StaggerGroupService);

  // ================================
  // ViewChild References
  // ================================

  private readonly cinematicEntrance = viewChild(CinematicEntranceDirective);

  // ================================
  // Scene Configuration
  // ================================

  /** Camera starting position (before entrance animation moves it) */
  protected readonly cameraPosition: [number, number, number] = [0, 2, 12];

  /** Scene background color */
  protected readonly backgroundColor = SCENE_COLORS.darkNavy;

  /** Main directional light color */
  protected readonly lightColor = SCENE_COLOR_STRINGS.warmWhite;

  /** Rim light color for depth */
  protected readonly rimLightColor = SCENE_COLOR_STRINGS.skyBlue;

  /** Box colors - vibrant gradient scheme */
  protected readonly box1Color = SCENE_COLOR_STRINGS.cyan;
  protected readonly box2Color = SCENE_COLOR_STRINGS.emerald;
  protected readonly box3Color = SCENE_COLOR_STRINGS.violet;

  // ================================
  // Preload State
  // ================================

  /**
   * Preload state from AssetPreloaderService.
   *
   * We preload a texture to demonstrate the loading system.
   * In real applications, you would preload GLTF models and textures
   * that are actually used in the scene.
   *
   * Note: The demo uses BoxComponent which doesn't require preloaded assets,
   * but we demonstrate the loading flow with a sample texture.
   */
  protected readonly preloadState: PreloadState = this.preloader.preload([
    // Preload earth texture to demonstrate loading progress
    { url: 'earth.jpg', type: 'texture', weight: 1 },
    // Preload moon texture for additional demo
    { url: 'moon.jpg', type: 'texture', weight: 1 },
  ]);

  // ================================
  // Animation State
  // ================================

  /** Track whether entrance animation has completed */
  protected readonly entranceCompleted = signal(false);

  /** Reference to OrbitControls for cinematic entrance coordination */
  private orbitControlsRef: import('three-stdlib').OrbitControls | null = null;

  // ================================
  // Entrance Configuration
  // ================================

  /**
   * Cinematic entrance configuration.
   *
   * Uses 'dolly-in' preset which moves the camera from far to close,
   * creating a classic film "push in" effect.
   *
   * The preloadState integration means the animation automatically
   * starts when all assets are loaded.
   */
  protected readonly entranceConfig: CinematicEntranceConfig = {
    preset: 'dolly-in',
    duration: 2.5,
    easing: 'power2.inOut',
    preloadState: this.preloadState,
    autoStart: true,
  };

  // ================================
  // Event Handlers
  // ================================

  /**
   * Handle OrbitControls ready event.
   *
   * Passes the controls reference to the CinematicEntranceDirective
   * for coordination (disable during animation, sync target after).
   */
  protected onControlsReady(
    controls: import('three-stdlib').OrbitControls
  ): void {
    this.orbitControlsRef = controls;

    // Get the directive reference and set controls
    const directive = this.cinematicEntrance();
    if (directive) {
      directive.setOrbitControls(controls);
    }
  }

  /**
   * Handle cinematic entrance completion.
   *
   * Triggers the staggered reveal of all 3D objects in the scene.
   * Objects reveal in order based on their staggerIndex.
   */
  protected async onEntranceComplete(): Promise<void> {
    // Reveal all boxes with 150ms stagger delay
    await this.staggerService.revealGroup('demo-boxes', 150);

    // Mark entrance as complete for UI update
    this.entranceCompleted.set(true);
  }

  /**
   * Replay the entire demo sequence.
   *
   * Hides all objects, resets entrance state, and triggers a new entrance.
   */
  protected async replayDemo(): Promise<void> {
    // Reset state
    this.entranceCompleted.set(false);

    // Hide all revealed objects
    await this.staggerService.hideGroup('demo-boxes');

    // Get the entrance directive and manually trigger new entrance
    const directive = this.cinematicEntrance();
    if (directive) {
      // Reset the directive's internal state by re-triggering
      // Note: The directive's start() method handles re-triggering
      directive.start();
    }
  }
}
