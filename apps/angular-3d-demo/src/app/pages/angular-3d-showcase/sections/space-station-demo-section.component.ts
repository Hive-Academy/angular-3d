/**
 * SpaceStationDemoSectionComponent - Demonstrates orbit-drift entrance with multiple stagger groups
 *
 * This demo showcases a different entrance preset (orbit-drift) and demonstrates
 * using multiple stagger groups for coordinated reveals of different object categories.
 *
 * Features Demonstrated:
 * - CinematicEntranceDirective with 'orbit-drift' preset (sweeping camera reveal)
 * - Two stagger groups: 'station-core' and 'station-exterior'
 * - Different reveal animations per group: scale-pop for core, rise-up for exterior
 * - AssetPreloaderService for loading orchestration
 * - StaggerGroupService for sequential group reveals
 *
 * @example
 * Usage in template:
 * ```html
 * <app-space-station-demo-section />
 * ```
 */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  Scene3dComponent,
  OrbitControlsComponent,
  BoxComponent,
  SphereComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
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
 * Demo section component showcasing Space Station with orbit-drift entrance.
 *
 * Demonstrates:
 * 1. orbit-drift camera entrance (sweeping side reveal)
 * 2. Multiple stagger groups for categorized reveals
 * 3. scale-pop for station core elements
 * 4. rise-up for station exterior elements
 */
@Component({
  selector: 'app-space-station-demo-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    Scene3dComponent,
    OrbitControlsComponent,
    BoxComponent,
    SphereComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
    StarFieldComponent,
    CinematicEntranceDirective,
    SceneRevealDirective,
  ],
  template: `
    <!-- Section Container -->
    <section
      class="relative py-24 bg-gradient-to-b from-slate-900 via-gray-900 to-slate-900"
    >
      <!-- Section Header -->
      <div class="container mx-auto px-6 mb-12">
        <div class="text-center max-w-3xl mx-auto">
          <!-- Badge -->
          <span
            class="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 backdrop-blur-md rounded-full text-sm font-medium border border-violet-500/30 mb-6"
          >
            <span class="relative flex h-2 w-2">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 bg-violet-500"
              ></span>
            </span>
            <span class="text-violet-300">Alternative Preset</span>
          </span>

          <!-- Title -->
          <h2
            class="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          >
            Space Station
            <span
              class="bg-gradient-to-r from-violet-400 to-pink-500 bg-clip-text text-transparent"
            >
              Orbit Drift
            </span>
          </h2>

          <!-- Description -->
          <p class="text-lg text-gray-300 leading-relaxed">
            Experience the orbit-drift entrance preset - camera sweeps in from
            an offset position. Multiple stagger groups reveal station
            components in categorized sequences.
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
            <!-- OrbitControls with orbit-drift entrance -->
            <a3d-orbit-controls
              [target]="[0, 0, 0]"
              [enableDamping]="true"
              [dampingFactor]="0.05"
              [minDistance]="8"
              [maxDistance]="30"
              a3dCinematicEntrance
              [entranceConfig]="entranceConfig"
              (controlsReady)="onControlsReady($event)"
              (entranceComplete)="onEntranceComplete()"
            />

            <!-- Lighting -->
            <a3d-ambient-light [intensity]="0.3" />
            <a3d-directional-light
              [position]="[10, 8, 5]"
              [intensity]="1.0"
              [color]="warmLightColor"
            />
            <a3d-directional-light
              [position]="[-8, 4, -6]"
              [intensity]="0.5"
              [color]="coolLightColor"
            />
            <!-- Central glow -->
            <a3d-point-light
              [position]="[0, 0, 0]"
              [intensity]="2"
              [distance]="15"
              [color]="coreLightColor"
            />

            <!-- Star Field Background -->
            <a3d-star-field
              [starCount]="2000"
              [radius]="60"
              [size]="0.02"
              [multiSize]="true"
              [stellarColors]="true"
              [enableTwinkle]="true"
            />

            <!-- ==================== STATION CORE (scale-pop) ==================== -->

            <!-- Central reactor sphere -->
            <a3d-sphere
              a3dSceneReveal
              [revealConfig]="{
                animation: 'scale-pop',
                staggerGroup: 'station-core',
                staggerIndex: 0,
                duration: 0.7
              }"
              [position]="[0, 0, 0]"
              [args]="[1.2, 32, 32]"
              [color]="coreColor"
              [emissive]="coreColor"
              [emissiveIntensity]="0.8"
              [metalness]="0.9"
              [roughness]="0.1"
            />

            <!-- Core ring 1 (horizontal) -->
            <a3d-box
              a3dSceneReveal
              [revealConfig]="{
                animation: 'scale-pop',
                staggerGroup: 'station-core',
                staggerIndex: 1,
                duration: 0.6
              }"
              [position]="[0, 0, 0]"
              [args]="[3, 0.2, 0.2]"
              [color]="ringColor"
            />

            <!-- Core ring 2 (vertical) -->
            <a3d-box
              a3dSceneReveal
              [revealConfig]="{
                animation: 'scale-pop',
                staggerGroup: 'station-core',
                staggerIndex: 2,
                duration: 0.6
              }"
              [position]="[0, 0, 0]"
              [args]="[0.2, 3, 0.2]"
              [color]="ringColor"
            />

            <!-- ==================== STATION EXTERIOR (rise-up) ==================== -->

            <!-- Left solar panel -->
            <a3d-box
              a3dSceneReveal
              [revealConfig]="{
                animation: 'rise-up',
                staggerGroup: 'station-exterior',
                staggerIndex: 0,
                duration: 0.8
              }"
              [position]="[-4, 0, 0]"
              [args]="[2.5, 0.1, 1.5]"
              [color]="panelColor"
              [emissive]="panelEmissive"
              [emissiveIntensity]="0.3"
            />

            <!-- Right solar panel -->
            <a3d-box
              a3dSceneReveal
              [revealConfig]="{
                animation: 'rise-up',
                staggerGroup: 'station-exterior',
                staggerIndex: 1,
                duration: 0.8
              }"
              [position]="[4, 0, 0]"
              [args]="[2.5, 0.1, 1.5]"
              [color]="panelColor"
              [emissive]="panelEmissive"
              [emissiveIntensity]="0.3"
            />

            <!-- Top antenna module -->
            <a3d-box
              a3dSceneReveal
              [revealConfig]="{
                animation: 'rise-up',
                staggerGroup: 'station-exterior',
                staggerIndex: 2,
                duration: 0.8
              }"
              [position]="[0, 3, 0]"
              [args]="[0.3, 2, 0.3]"
              [color]="antennaColor"
            />

            <!-- Bottom thruster module -->
            <a3d-sphere
              a3dSceneReveal
              [revealConfig]="{
                animation: 'rise-up',
                staggerGroup: 'station-exterior',
                staggerIndex: 3,
                duration: 0.8
              }"
              [position]="[0, -2.5, 0]"
              [args]="[0.6, 16, 16]"
              [color]="thrusterColor"
              [emissive]="thrusterEmissive"
              [emissiveIntensity]="0.6"
              [metalness]="0.6"
              [roughness]="0.4"
            />
          </a3d-scene-3d>

          <!-- Loading Overlay -->
          @if (!preloadState.isReady()) {
          <div
            class="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm z-10"
          >
            <!-- Loading Spinner -->
            <div class="relative mb-6">
              <div
                class="w-20 h-20 border-4 border-violet-500/20 rounded-full"
              ></div>
              <div
                class="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"
              ></div>
              <div
                class="absolute inset-0 flex items-center justify-center text-violet-400 font-bold text-lg"
              >
                {{ preloadState.progress() | number : '1.0-0' }}%
              </div>
            </div>

            <!-- Loading Text -->
            <div class="text-white text-lg font-medium mb-2">
              Initializing Station...
            </div>
            <div class="text-gray-400 text-sm">
              {{ preloadState.loadedCount() }} / {{ preloadState.totalCount() }}
              systems
            </div>

            <!-- Progress Bar -->
            <div class="w-64 h-2 bg-gray-800 rounded-full mt-4 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-300"
                [style.width.%]="preloadState.progress()"
              ></div>
            </div>
          </div>
          }

          <!-- Status Indicator -->
          @if (preloadState.isReady()) {
          <div class="absolute top-4 left-4 z-10 pointer-events-none">
            <div
              class="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10"
            >
              <div class="flex items-center gap-2 text-sm">
                @if (revealPhase() === 'entrance') {
                <span
                  class="w-2 h-2 bg-violet-500 rounded-full animate-pulse"
                ></span>
                <span class="text-violet-300">Camera Orbit...</span>
                } @else if (revealPhase() === 'core') {
                <span
                  class="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"
                ></span>
                <span class="text-cyan-300">Core Online</span>
                } @else if (revealPhase() === 'exterior') {
                <span
                  class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                ></span>
                <span class="text-emerald-300">Deploying Systems</span>
                } @else {
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                <span class="text-green-300">Station Active</span>
                }
              </div>
            </div>
          </div>
          }

          <!-- Animation Labels -->
          @if (revealPhase() === 'complete') {
          <div
            class="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          >
            <div
              class="flex gap-8 px-6 py-3 bg-black/50 backdrop-blur-sm rounded-xl border border-white/10"
            >
              <div class="text-center">
                <div class="text-xs text-gray-400 mb-1">Entrance</div>
                <div class="text-sm font-medium text-violet-300">
                  Orbit Drift
                </div>
              </div>
              <div class="text-center">
                <div class="text-xs text-gray-400 mb-1">Core Group</div>
                <div class="text-sm font-medium text-cyan-300">Scale Pop</div>
              </div>
              <div class="text-center">
                <div class="text-xs text-gray-400 mb-1">Exterior Group</div>
                <div class="text-sm font-medium text-emerald-300">Rise Up</div>
              </div>
            </div>
          </div>
          }

          <!-- Replay Button -->
          @if (revealPhase() === 'complete') {
          <button
            type="button"
            class="absolute top-4 right-4 z-10 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 backdrop-blur-sm rounded-lg border border-violet-500/30 text-violet-300 text-sm font-medium transition-all duration-200 hover:scale-105"
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
          <!-- Card 1: Orbit Drift -->
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">Orbit Drift</h3>
            <p class="text-gray-400 text-sm">
              Camera sweeps in from an offset position with combined horizontal
              and vertical drift for a dramatic reveal.
            </p>
          </div>

          <!-- Card 2: Multiple Stagger Groups -->
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
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">
              Multiple Groups
            </h3>
            <p class="text-gray-400 text-sm">
              Organize objects into logical groups. Core systems reveal first
              with scale-pop, then exterior with rise-up.
            </p>
          </div>

          <!-- Card 3: Sequential Reveals -->
          <div
            class="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-white/10"
          >
            <div
              class="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4"
            >
              <svg
                class="w-6 h-6 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-white mb-2">
              Sequential Reveal
            </h3>
            <p class="text-gray-400 text-sm">
              Groups reveal one after another. After core completes, exterior
              begins - creating layered cinematic effect.
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
export class SpaceStationDemoSectionComponent {
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

  /** Camera starting position */
  protected readonly cameraPosition: [number, number, number] = [0, 3, 15];

  /** Scene background color */
  protected readonly backgroundColor = SCENE_COLORS.darkNavy;

  // ================================
  // Light Colors
  // ================================

  protected readonly warmLightColor = SCENE_COLOR_STRINGS.warmWhite;
  protected readonly coolLightColor = SCENE_COLOR_STRINGS.skyBlue;
  protected readonly coreLightColor = SCENE_COLOR_STRINGS.cyan;

  // ================================
  // Station Colors
  // ================================

  /** Core reactor sphere color */
  protected readonly coreColor = SCENE_COLOR_STRINGS.cyan;

  /** Core ring color */
  protected readonly ringColor = SCENE_COLOR_STRINGS.indigo;

  /** Solar panel color */
  protected readonly panelColor = SCENE_COLOR_STRINGS.blue;
  protected readonly panelEmissive = SCENE_COLOR_STRINGS.cyan;

  /** Antenna color */
  protected readonly antennaColor = SCENE_COLOR_STRINGS.violet;

  /** Thruster color */
  protected readonly thrusterColor = SCENE_COLOR_STRINGS.orange;
  protected readonly thrusterEmissive = SCENE_COLOR_STRINGS.neonOrange;

  // ================================
  // Preload State
  // ================================

  /**
   * Preload state - using textures to simulate asset loading
   */
  protected readonly preloadState: PreloadState = this.preloader.preload([
    { url: 'earth.jpg', type: 'texture', weight: 1 },
    { url: 'moon.jpg', type: 'texture', weight: 1 },
  ]);

  // ================================
  // Animation State
  // ================================

  /** Track current reveal phase */
  protected readonly revealPhase = signal<
    'entrance' | 'core' | 'exterior' | 'complete'
  >('entrance');

  /** Reference to OrbitControls */
  private orbitControlsRef: import('three-stdlib').OrbitControls | null = null;

  // ================================
  // Entrance Configuration
  // ================================

  /**
   * Cinematic entrance config using orbit-drift preset.
   *
   * The orbit-drift preset creates a sweeping reveal from an offset
   * position - different from the dolly-in used in the other demo.
   */
  protected readonly entranceConfig: CinematicEntranceConfig = {
    preset: 'orbit-drift',
    duration: 3.0,
    easing: 'power2.inOut',
    preloadState: this.preloadState,
    autoStart: true,
  };

  // ================================
  // Event Handlers
  // ================================

  /**
   * Handle OrbitControls ready event.
   */
  protected onControlsReady(
    controls: import('three-stdlib').OrbitControls
  ): void {
    this.orbitControlsRef = controls;

    const directive = this.cinematicEntrance();
    if (directive) {
      directive.setOrbitControls(controls);
    }
  }

  /**
   * Handle cinematic entrance completion.
   *
   * Triggers sequential stagger group reveals:
   * 1. Core elements (scale-pop)
   * 2. Exterior elements (rise-up)
   */
  protected async onEntranceComplete(): Promise<void> {
    // First: reveal core elements with scale-pop
    this.revealPhase.set('core');
    await this.staggerService.revealGroup('station-core', 200);

    // Then: reveal exterior elements with rise-up
    this.revealPhase.set('exterior');
    await this.staggerService.revealGroup('station-exterior', 150);

    // Complete
    this.revealPhase.set('complete');
  }

  /**
   * Replay the entire demo sequence.
   */
  protected async replayDemo(): Promise<void> {
    // Reset state
    this.revealPhase.set('entrance');

    // Hide all revealed objects
    await Promise.all([
      this.staggerService.hideGroup('station-core'),
      this.staggerService.hideGroup('station-exterior'),
    ]);

    // Get the entrance directive and reset + restart
    const directive = this.cinematicEntrance();
    if (directive) {
      directive.reset();
      directive.start();
    }
  }
}
