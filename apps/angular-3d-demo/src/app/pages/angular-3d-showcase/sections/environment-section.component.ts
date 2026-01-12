/**
 * Environment Section - Demonstrates HDRI environment loading and reflections.
 *
 * Shows:
 * 1. Environment presets (from polyhaven.com CDN)
 * 2. Custom HDRI loading (local 4K EXR files)
 * 3. Material properties that show reflections (roughness, metalness, transmission)
 * 4. Background display with blur options
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AmbientLightComponent,
  EnvironmentComponent,
  EnvironmentPreset,
  GlassShellComponent,
  MarbleSphereComponent,
  OrbitControlsComponent,
  Scene3dComponent,
  SphereComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/** Available presets to cycle through */
const PRESETS: EnvironmentPreset[] = [
  'sunset',
  'dawn',
  'studio',
  'warehouse',
  'forest',
  'apartment',
  'city',
  'park',
  'lobby',
  'night',
];

/** Local HDRI files (4K EXR) */
const LOCAL_HDRIS = [
  { name: 'Venice Sunset', path: 'hdri/venice_sunset_4k.exr' },
  { name: 'Kiara Dawn', path: 'hdri/kiara_1_dawn_4k.exr' },
  { name: 'Lebombo', path: 'hdri/lebombo_4k.exr' },
  { name: 'Dikhololo Night', path: 'hdri/dikhololo_night_4k.exr' },
  { name: 'Studio Small', path: 'hdri/studio_small_03_4k.exr' },
];

@Component({
  selector: 'app-environment-section',
  imports: [
    Scene3dComponent,
    EnvironmentComponent,
    SphereComponent,
    MarbleSphereComponent,
    GlassShellComponent,
    AmbientLightComponent,
    OrbitControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Environment Presets Demo -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            HDRI Environment Presets
          </h2>
          <p class="text-text-secondary">
            Pre-configured HDRIs from polyhaven.com (1K resolution for fast
            loading)
          </p>
        </div>

        <!-- Preset Controls -->
        <div class="flex justify-center gap-2x mb-6x flex-wrap">
          @for (preset of presets; track preset) {
          <button
            (click)="setPreset(preset)"
            [class]="
              'px-4x py-2x rounded-lg text-sm transition-all ' +
              (currentPreset() === preset
                ? 'bg-violet-500 text-white'
                : 'bg-white/10 text-text-secondary hover:bg-white/20')
            "
          >
            {{ preset }}
          </button>
          }
        </div>

        <!-- Background Toggle -->
        <div class="flex justify-center gap-4x mb-6x">
          <label class="flex items-center gap-2x cursor-pointer">
            <input
              type="checkbox"
              [checked]="showBackground()"
              (change)="showBackground.set(!showBackground())"
              class="w-4 h-4"
            />
            <span class="text-text-secondary">Show Background</span>
          </label>
          <label class="flex items-center gap-2x">
            <span class="text-text-secondary">Blur:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              [value]="backgroundBlur()"
              (input)="backgroundBlur.set(+$any($event.target).value)"
              class="w-24"
            />
            <span class="text-text-tertiary">{{ backgroundBlur() }}</span>
          </label>
          <label class="flex items-center gap-2x">
            <span class="text-text-secondary">Intensity:</span>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              [value]="envIntensity()"
              (input)="envIntensity.set(+$any($event.target).value)"
              class="w-24"
            />
            <span class="text-text-tertiary">{{ envIntensity() }}</span>
          </label>
        </div>

        <div
          class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 0, 12]">
            <a3d-orbit-controls
              [enableRotate]="true"
              [enableZoom]="true"
              [autoRotate]="true"
              [autoRotateSpeed]="0.5"
            />

            <!-- Environment with current preset -->
            <a3d-environment
              [preset]="currentPreset()"
              [background]="showBackground()"
              [blur]="backgroundBlur()"
              [intensity]="envIntensity()"
              (loading)="onPresetLoading($event)"
              (loaded)="onPresetLoaded()"
            />

            <!-- Minimal fill light -->
            <a3d-ambient-light [intensity]="0.05" />

            <!-- Row of spheres with different material properties -->
            <!-- High metalness, low roughness = mirror-like reflections -->
            <a3d-sphere
              [position]="[-6, 0, 0]"
              [args]="[1.5, 64, 64]"
              [color]="colors.white"
              [metalness]="1.0"
              [roughness]="0.0"
            />

            <!-- Medium metalness, low roughness = shiny metal -->
            <a3d-sphere
              [position]="[-2, 0, 0]"
              [args]="[1.5, 64, 64]"
              [color]="colors.amber"
              [metalness]="0.8"
              [roughness]="0.2"
            />

            <!-- Low metalness, medium roughness = plastic -->
            <a3d-sphere
              [position]="[2, 0, 0]"
              [args]="[1.5, 64, 64]"
              [color]="colors.cyan"
              [metalness]="0.1"
              [roughness]="0.5"
            />

            <!-- High roughness = matte (no reflections) -->
            <a3d-sphere
              [position]="[6, 0, 0]"
              [args]="[1.5, 64, 64]"
              [color]="colors.pink"
              [metalness]="0.0"
              [roughness]="1.0"
            />
          </a3d-scene-3d>
        </div>

        <!-- Loading indicator -->
        @if (presetLoadProgress() < 100 && presetLoadProgress() > 0) {
        <div class="mt-2x text-center text-text-tertiary">
          Loading HDRI: {{ presetLoadProgress() }}%
        </div>
        }

        <!-- Material Legend -->
        <div class="mt-4x grid grid-cols-4 gap-4x text-center text-sm">
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-white">metalness: 1, roughness: 0</code>
            <p class="text-xs text-text-tertiary mt-1">
              Perfect mirror reflections
            </p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-amber-400">metalness: 0.8, roughness: 0.2</code>
            <p class="text-xs text-text-tertiary mt-1">Brushed metal</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-cyan-400">metalness: 0.1, roughness: 0.5</code>
            <p class="text-xs text-text-tertiary mt-1">Glossy plastic</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-pink-400">metalness: 0, roughness: 1</code>
            <p class="text-xs text-text-tertiary mt-1">Matte (no reflection)</p>
          </div>
        </div>
      </section>

      <!-- Custom HDRI Loading (Local 4K Files) -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Custom HDRI Files</h2>
          <p class="text-text-secondary">
            Load your own 4K EXR files for higher quality reflections
          </p>
        </div>

        <!-- Local HDRI Controls -->
        <div class="flex justify-center gap-2x mb-6x flex-wrap">
          @for (hdri of localHdris; track hdri.path) {
          <button
            (click)="setCustomHdri(hdri.path)"
            [class]="
              'px-4x py-2x rounded-lg text-sm transition-all ' +
              (currentCustomHdri() === hdri.path
                ? 'bg-green-500 text-white'
                : 'bg-white/10 text-text-secondary hover:bg-white/20')
            "
          >
            {{ hdri.name }}
          </button>
          }
        </div>

        <div
          class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 0, 14]">
            <a3d-orbit-controls
              [enableRotate]="true"
              [enableZoom]="true"
              [autoRotate]="true"
              [autoRotateSpeed]="0.3"
            />

            <!-- Custom HDRI Environment -->
            <a3d-environment
              [hdri]="currentCustomHdri()"
              [background]="true"
              [blur]="0.2"
              [intensity]="1.2"
              (loading)="onCustomLoading($event)"
              (loaded)="onCustomLoaded()"
            />

            <!-- Marble Sphere - Shows raymarched interior + environment reflections -->
            <a3d-marble-sphere
              [radius]="1.8"
              [position]="[-4, 0, 0]"
              [colorA]="'#001a33'"
              [colorB]="'#66b3e5'"
              [edgeColor]="'#88ccff'"
              [animationSpeed]="0.3"
              [iterations]="20"
              [roughness]="0.08"
            />

            <!-- Glass Shell around center sphere - shows transmission + refraction -->
            <a3d-sphere
              [position]="[0, 0, 0]"
              [args]="[1.2, 64, 64]"
              [color]="colors.neonGreen"
              [metalness]="0.9"
              [roughness]="0.1"
            />
            <a3d-glass-shell
              [radius]="1.8"
              [position]="[0, 0, 0]"
              [ior]="1.5"
              [transmission]="0.95"
              [thickness]="0.3"
              [roughness]="0.02"
              [edgeColor]="'#aaffcc'"
              [edgeIntensity]="0.4"
            />

            <!-- Pure metallic sphere - maximum reflections -->
            <a3d-sphere
              [position]="[4, 0, 0]"
              [args]="[1.8, 64, 64]"
              [color]="colors.white"
              [metalness]="1.0"
              [roughness]="0.0"
            />
          </a3d-scene-3d>
        </div>

        <!-- Loading indicator -->
        @if (customLoadProgress() < 100 && customLoadProgress() > 0) {
        <div class="mt-2x text-center text-text-tertiary">
          Loading 4K HDRI: {{ customLoadProgress() }}%
        </div>
        }

        <!-- Component Legend -->
        <div class="mt-4x grid grid-cols-3 gap-4x text-center text-sm">
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-blue-400">&lt;a3d-marble-sphere&gt;</code>
            <p class="text-xs text-text-tertiary mt-1">
              Raymarched interior + glossy shell
            </p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-green-400">&lt;a3d-glass-shell&gt;</code>
            <p class="text-xs text-text-tertiary mt-1">
              Transmission + IOR refraction
            </p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-white">metalness: 1, roughness: 0</code>
            <p class="text-xs text-text-tertiary mt-1">Chrome mirror finish</p>
          </div>
        </div>
      </section>

      <!-- Code Examples -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Usage Examples</h2>
          <p class="text-text-secondary">
            How to use environment maps for realistic lighting
          </p>
        </div>

        <div class="grid grid-cols-2 gap-6x">
          <!-- Preset Example -->
          <div class="p-4x bg-white/5 rounded-lg">
            <h3 class="text-lg font-semibold mb-3x text-violet-400">
              Using Presets
            </h3>
            <pre
              class="text-xs text-text-secondary overflow-x-auto"
            ><code>&lt;a3d-scene-3d&gt;
  &lt;!-- Quick preset from polyhaven CDN --&gt;
  &lt;a3d-environment
    [preset]="'sunset'"
    [intensity]="1.2"
    [background]="true"
    [blur]="0.3"
  /&gt;

  &lt;!-- Metallic sphere will reflect the HDRI --&gt;
  &lt;a3d-sphere
    [metalness]="0.9"
    [roughness]="0.1"
  /&gt;
&lt;/a3d-scene-3d&gt;</code></pre>
          </div>

          <!-- Custom HDRI Example -->
          <div class="p-4x bg-white/5 rounded-lg">
            <h3 class="text-lg font-semibold mb-3x text-green-400">
              Custom HDRI Files
            </h3>
            <pre
              class="text-xs text-text-secondary overflow-x-auto"
            ><code>&lt;a3d-scene-3d&gt;
  &lt;!-- Load your own 4K HDRI --&gt;
  &lt;a3d-environment
    [hdri]="'/assets/my-studio.exr'"
    [intensity]="1.5"
    [background]="false"
    (loading)="progress = $event"
    (loaded)="onReady()"
  /&gt;

  &lt;!-- Glass shell for realistic refraction --&gt;
  &lt;a3d-glass-shell
    [ior]="1.5"
    [transmission]="0.95"
  /&gt;
&lt;/a3d-scene-3d&gt;</code></pre>
          </div>
        </div>

        <!-- Available Presets Reference -->
        <div class="mt-6x p-4x bg-white/5 rounded-lg">
          <h3 class="text-lg font-semibold mb-3x text-center">
            Available Presets
          </h3>
          <div class="flex flex-wrap justify-center gap-2x">
            @for (preset of presets; track preset) {
            <code class="px-2x py-1 bg-white/10 rounded text-xs">{{
              preset
            }}</code>
            }
          </div>
          <p class="text-xs text-text-tertiary text-center mt-3x">
            All presets load 1K HDRIs from polyhaven.com CDN. Use
            <code class="text-green-400">[hdri]</code> for higher resolution.
          </p>
        </div>
      </section>
    </div>
  `,
})
export default class EnvironmentSectionComponent {
  public readonly colors = SCENE_COLORS;
  public readonly presets = PRESETS;
  public readonly localHdris = LOCAL_HDRIS;

  // Preset demo state
  public readonly currentPreset = signal<EnvironmentPreset>('sunset');
  public readonly showBackground = signal(true);
  public readonly backgroundBlur = signal(0.3);
  public readonly envIntensity = signal(1.0);
  public readonly presetLoadProgress = signal(100);

  // Custom HDRI demo state
  public readonly currentCustomHdri = signal(LOCAL_HDRIS[0].path);
  public readonly customLoadProgress = signal(100);

  public setPreset(preset: EnvironmentPreset): void {
    this.presetLoadProgress.set(0);
    this.currentPreset.set(preset);
  }

  public setCustomHdri(path: string): void {
    this.customLoadProgress.set(0);
    this.currentCustomHdri.set(path);
  }

  public onPresetLoading(progress: number): void {
    this.presetLoadProgress.set(progress);
  }

  public onPresetLoaded(): void {
    this.presetLoadProgress.set(100);
  }

  public onCustomLoading(progress: number): void {
    this.customLoadProgress.set(progress);
  }

  public onCustomLoaded(): void {
    this.customLoadProgress.set(100);
  }
}
