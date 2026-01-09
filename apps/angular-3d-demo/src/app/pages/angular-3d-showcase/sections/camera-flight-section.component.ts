import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Scene3dComponent,
  SphereComponent,
  BoxComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  OrbitControlsComponent,
  CameraFlightDirective,
  type CameraWaypoint,
  type WaypointNavigationState,
  type FlightProgressEvent,
} from '@hive-academy/angular-3d';
import { OrbitControls } from 'three-stdlib';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Camera Flight Section - Minimal demo for CameraFlightDirective testing.
 *
 * This section provides a simple scene to test and debug the CameraFlightDirective
 * without the complexity of full hero sections. Features:
 * - Simple dark background with basic shapes
 * - Colored spheres marking waypoint positions
 * - Central target marker showing lookAt point
 * - Flight progress and waypoint indicators
 * - Clear instructions for hold-to-fly navigation
 */
@Component({
  selector: 'app-camera-flight-section',
  imports: [
    CommonModule,
    Scene3dComponent,
    SphereComponent,
    BoxComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    OrbitControlsComponent,
    CameraFlightDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Header -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Camera Flight</h2>
          <p class="text-text-secondary">
            Waypoint-based camera navigation with hold-to-fly controls
          </p>
        </div>
      </section>

      <!-- Main Demo Scene -->
      <section class="max-w-container mx-auto px-4x">
        <div class="relative">
          <!-- Scene Container -->
          <div
            class="aspect-[16/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl border border-white/10"
          >
            <a3d-scene-3d
              [cameraPosition]="waypoints[0].position"
              [backgroundColor]="colors.backgroundDark"
            >
              <!-- Basic Lighting -->
              <a3d-ambient-light [intensity]="0.4" />
              <a3d-directional-light
                [position]="[10, 10, 10]"
                [intensity]="0.8"
              />
              <a3d-directional-light
                [position]="[-10, 5, -10]"
                [intensity]="0.3"
              />

              <!-- Central Target Marker (where camera always looks) -->
              <a3d-box
                [position]="[0, 0, 0]"
                [scale]="[0.5, 0.5, 0.5]"
                [color]="colors.white"
              />

              <!-- Waypoint Markers -->
              <!-- Waypoint 0: Start (Front) -->
              <a3d-sphere
                [position]="waypoints[0].position"
                [scale]="[0.3, 0.3, 0.3]"
                [color]="colors.emerald"
              />

              <!-- Waypoint 1: Side (Right) -->
              <a3d-sphere
                [position]="waypoints[1].position"
                [scale]="[0.3, 0.3, 0.3]"
                [color]="colors.amber"
              />

              <!-- Waypoint 2: Back -->
              <a3d-sphere
                [position]="waypoints[2].position"
                [scale]="[0.3, 0.3, 0.3]"
                [color]="colors.pink"
              />

              <!-- Waypoint 3: Other Side (Left) -->
              <a3d-sphere
                [position]="waypoints[3].position"
                [scale]="[0.3, 0.3, 0.3]"
                [color]="colors.cyan"
              />

              <!-- Ground Reference Plane Markers (shows orbit path) -->
              @for (angle of orbitAngles; track angle) {
              <a3d-sphere
                [position]="getOrbitPosition(angle)"
                [scale]="[0.1, 0.1, 0.1]"
                [color]="colors.softGray"
              />
              }

              <!-- OrbitControls with CameraFlightDirective -->
              <a3d-orbit-controls
                #orbitControls
                a3dCameraFlight
                [waypoints]="waypoints"
                [enabled]="flightEnabled()"
                [enableDamping]="true"
                [dampingFactor]="0.05"
                (controlsReady)="onControlsReady($event)"
                (flightStart)="onFlightStart()"
                (flightEnd)="onFlightEnd()"
                (waypointReached)="onWaypointReached($event)"
                (navigationStateChange)="onNavigationStateChange($event)"
                (progressChange)="onProgressChange($event)"
              />
            </a3d-scene-3d>
          </div>

          <!-- Overlay UI -->
          <div
            class="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none"
          >
            <!-- Left: Instructions -->
            <div
              class="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-sm"
            >
              <div class="font-semibold mb-2 text-white">Controls</div>
              <ul class="space-y-1 text-gray-300 text-xs">
                <li>
                  <span class="text-emerald-400">Hold LEFT CLICK</span> - Fly
                  forward
                </li>
                <li>
                  <span class="text-amber-400">Press Q</span> - Fly backward
                </li>
                <li>
                  <span class="text-cyan-400">Release</span> - Pause flight
                </li>
              </ul>
            </div>

            <!-- Right: Status -->
            <div
              class="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-sm text-right"
            >
              <div class="font-semibold mb-2 text-white">Status</div>
              <div class="space-y-1 text-xs">
                <div class="flex justify-between gap-4">
                  <span class="text-gray-400">Waypoint:</span>
                  <span class="font-mono" [class]="waypointColorClass()">
                    {{ currentWaypointIndex() + 1 }} /
                    {{ waypoints.length }}
                  </span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-gray-400">Flying:</span>
                  <span
                    [class]="isFlying() ? 'text-emerald-400' : 'text-gray-500'"
                  >
                    {{ isFlying() ? 'Yes' : 'No' }}
                  </span>
                </div>
                <div class="flex justify-between gap-4">
                  <span class="text-gray-400">Direction:</span>
                  <span class="text-white font-mono">
                    {{ flightDirection() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom: Progress Bar -->
          <div class="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div class="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3">
              <!-- Waypoint indicators -->
              <div class="flex justify-between mb-2">
                @for (wp of waypoints; track wp.id; let i = $index) {
                <div class="flex flex-col items-center">
                  <div
                    class="w-3 h-3 rounded-full border-2 transition-all duration-300"
                    [class]="getWaypointIndicatorClass(i)"
                  ></div>
                  <span
                    class="text-[10px] mt-1 font-mono"
                    [class]="getWaypointLabelClass(i)"
                  >
                    {{ wp.id }}
                  </span>
                </div>
                }
              </div>

              <!-- Progress bar -->
              <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-100"
                  [style.width.%]="overallProgress()"
                ></div>
              </div>

              <!-- Progress text -->
              <div class="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Start</span>
                <span>{{ overallProgress().toFixed(0) }}%</span>
                <span>End</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Waypoint Configuration Display -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h3 class="text-headline-md font-bold mb-2x">
            Waypoint Configuration
          </h3>
          <p class="text-text-secondary text-sm">
            Camera orbits around center, always looking at [0, 0, 0]
          </p>
        </div>

        <div class="grid md:grid-cols-4 gap-4">
          @for (wp of waypoints; track wp.id; let i = $index) {
          <div
            class="p-4 rounded-xl border transition-all duration-300"
            [class]="getWaypointCardClass(i)"
          >
            <div class="flex items-center gap-2 mb-3">
              <div
                class="w-4 h-4 rounded-full"
                [style.background]="getWaypointColor(i)"
              ></div>
              <span class="font-semibold text-sm">{{ wp.id }}</span>
            </div>
            <div class="space-y-1 text-xs text-gray-400">
              <div>
                <span class="text-gray-500">Position:</span>
                <span class="font-mono ml-1">
                  [{{ wp.position.join(', ') }}]
                </span>
              </div>
              <div>
                <span class="text-gray-500">LookAt:</span>
                <span class="font-mono ml-1">
                  [{{ wp.lookAt.join(', ') }}]
                </span>
              </div>
              <div>
                <span class="text-gray-500">Duration:</span>
                <span class="font-mono ml-1">{{ wp.duration ?? 2 }}s</span>
              </div>
            </div>
          </div>
          }
        </div>
      </section>

      <!-- Usage Code -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h3 class="text-headline-md font-bold mb-2x">Usage</h3>
        </div>

        <div class="bg-gray-900 rounded-xl p-6 overflow-x-auto">
          <pre class="text-sm text-gray-300"><code>{{ usageCode }}</code></pre>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export default class CameraFlightSectionComponent {
  public readonly colors = SCENE_COLORS;

  /** Reference to the CameraFlightDirective */
  private readonly flightDirective = viewChild(CameraFlightDirective);

  /** Flight enabled state */
  public readonly flightEnabled = signal(true);

  /** Current waypoint index */
  public readonly currentWaypointIndex = signal(0);

  /** Is camera currently flying */
  public readonly isFlying = signal(false);

  /** Current flight direction */
  public readonly flightDirection = signal<'forward' | 'backward' | 'none'>(
    'none'
  );

  /** Flight progress within current segment (0-1) */
  public readonly segmentProgress = signal(0);

  /**
   * Waypoints defining the camera flight path.
   * Camera orbits around center, always looking at [0, 0, 0].
   * This simple configuration avoids camera flip issues.
   */
  public readonly waypoints: CameraWaypoint[] = [
    {
      id: 'front',
      position: [0, 5, 15],
      lookAt: [0, 0, 0],
      duration: 2,
      ease: 'power2.inOut',
    },
    {
      id: 'right',
      position: [15, 5, 0],
      lookAt: [0, 0, 0],
      duration: 2,
      ease: 'power2.inOut',
    },
    {
      id: 'back',
      position: [0, 5, -15],
      lookAt: [0, 0, 0],
      duration: 2,
      ease: 'power2.inOut',
    },
    {
      id: 'left',
      position: [-15, 5, 0],
      lookAt: [0, 0, 0],
      duration: 2,
      ease: 'power2.inOut',
    },
  ];

  /** Angles for orbit path markers (every 30 degrees) */
  public readonly orbitAngles = [30, 60, 120, 150, 210, 240, 300, 330];

  /** Calculate position on orbit path for a given angle */
  public getOrbitPosition(angleDeg: number): [number, number, number] {
    const angleRad = (angleDeg * Math.PI) / 180;
    const radius = 15;
    return [
      Math.sin(angleRad) * radius,
      0, // Ground level
      Math.cos(angleRad) * radius,
    ];
  }

  /** Calculate overall progress through all waypoints */
  public overallProgress(): number {
    const currentIdx = this.currentWaypointIndex();
    const totalSegments = this.waypoints.length - 1;
    if (totalSegments <= 0) return 0;

    const completedSegments = currentIdx;
    const segmentContribution = this.isFlying() ? this.segmentProgress() : 0;

    return ((completedSegments + segmentContribution) / totalSegments) * 100;
  }

  /** Get CSS class for waypoint color in status display */
  public waypointColorClass(): string {
    const colors = [
      'text-emerald-400',
      'text-amber-400',
      'text-pink-400',
      'text-cyan-400',
    ];
    return colors[this.currentWaypointIndex()] || 'text-white';
  }

  /** Get CSS class for waypoint indicator dot */
  public getWaypointIndicatorClass(index: number): string {
    const currentIdx = this.currentWaypointIndex();
    const baseColors = [
      'border-emerald-400',
      'border-amber-400',
      'border-pink-400',
      'border-cyan-400',
    ];

    if (index === currentIdx) {
      return `${baseColors[index]} bg-current scale-125`;
    } else if (index < currentIdx) {
      return `${baseColors[index]} bg-current opacity-60`;
    }
    return `${baseColors[index]} bg-transparent opacity-40`;
  }

  /** Get CSS class for waypoint label */
  public getWaypointLabelClass(index: number): string {
    const currentIdx = this.currentWaypointIndex();
    if (index === currentIdx) {
      return 'text-white';
    } else if (index < currentIdx) {
      return 'text-gray-400';
    }
    return 'text-gray-600';
  }

  /** Get CSS class for waypoint card */
  public getWaypointCardClass(index: number): string {
    const currentIdx = this.currentWaypointIndex();
    const borderColors = [
      'border-emerald-500/50',
      'border-amber-500/50',
      'border-pink-500/50',
      'border-cyan-500/50',
    ];

    if (index === currentIdx) {
      return `${borderColors[index]} bg-white/10 shadow-lg`;
    }
    return 'border-white/10 bg-white/5';
  }

  /** Get hex color for waypoint */
  public getWaypointColor(index: number): string {
    const colors = ['#10b981', '#f59e0b', '#ec4899', '#06b6d4'];
    return colors[index] || '#ffffff';
  }

  /** Handle OrbitControls ready event */
  public onControlsReady(controls: OrbitControls): void {
    const directive = this.flightDirective();
    if (directive) {
      directive.setOrbitControls(controls);
      console.log('[CameraFlightSection] OrbitControls connected to directive');
    }
  }

  /** Handle flight start event */
  public onFlightStart(): void {
    console.log('[CameraFlightSection] Flight started');
  }

  /** Handle flight end event */
  public onFlightEnd(): void {
    console.log('[CameraFlightSection] Flight ended');
  }

  /** Handle waypoint reached event */
  public onWaypointReached(event: { index: number }): void {
    console.log('[CameraFlightSection] Waypoint reached:', event.index);
  }

  /** Handle navigation state change */
  public onNavigationStateChange(state: WaypointNavigationState): void {
    this.currentWaypointIndex.set(state.currentIndex);
    this.isFlying.set(state.isFlying);
    this.flightDirection.set(state.direction);
  }

  /** Handle progress change during flight */
  public onProgressChange(event: FlightProgressEvent): void {
    this.segmentProgress.set(event.progress);
  }

  /** Usage code example */
  public readonly usageCode = `// Template
<a3d-orbit-controls
  a3dCameraFlight
  [waypoints]="waypoints"
  [enabled]="flightEnabled()"
  (controlsReady)="onControlsReady($event)"
  (waypointReached)="onWaypointReached($event)"
  (navigationStateChange)="onNavigationStateChange($event)"
/>

// Component
waypoints: CameraWaypoint[] = [
  { id: 'start', position: [0, 5, 15], lookAt: [0, 0, 0] },
  { id: 'side', position: [15, 5, 0], lookAt: [0, 0, 0] },
  { id: 'back', position: [0, 5, -15], lookAt: [0, 0, 0] },
];

onControlsReady(controls: OrbitControls): void {
  this.flightDirective.setOrbitControls(controls);
}`;
}
