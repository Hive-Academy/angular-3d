import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  Scene3dComponent,
  MetaballComponent,
  MetaballPreset,
} from '@hive-academy/angular-3d';

/**
 * Metaball Hero Scene - Interactive Ray-Marched Metaballs Demo
 *
 * Features:
 * - Ray-marched metaballs with SDF blending
 * - Interactive cursor sphere that follows mouse/touch
 * - 6 color presets: moody, cosmic, neon, sunset, holographic, minimal
 * - Adaptive quality for mobile devices
 * - TailwindCSS styled preset selector
 */
@Component({
  selector: 'app-metaball-hero-scene',
  imports: [Scene3dComponent, MetaballComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative overflow-hidden"
      [style.background]="backgroundColorHex()"
      style="height: calc(100vh - 180px);"
    >
      <a3d-scene-3d
        [cameraPosition]="[0, 0, 1]"
        [cameraFov]="75"
        [enableAntialiasing]="true"
        [alpha]="true"
        [backgroundColor]="backgroundColor()"
      >
        <a3d-metaball
          [preset]="selectedPreset()"
          [sphereCount]="6"
          [smoothness]="0.3"
          [mouseProximityEffect]="true"
          [animationSpeed]="0.6"
          [movementScale]="1.2"
        />
      </a3d-scene-3d>

      <!-- Preset Selector UI -->
      <div
        class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-wrap justify-center gap-2 px-4"
      >
        @for (preset of presets; track preset) {
        <button
          (click)="selectPreset(preset)"
          [class]="getPresetButtonClass(preset)"
          [attr.aria-label]="'Select ' + preset + ' preset'"
          [attr.aria-pressed]="selectedPreset() === preset"
          type="button"
        >
          {{ preset }}
        </button>
        }
      </div>

      <!-- Scene Title -->
      <div class="absolute top-4 left-4 z-20">
        <h2 class="text-white/90 text-lg font-semibold tracking-wide">
          Metaball Shader
        </h2>
        <p class="text-white/60 text-sm mt-1">
          Ray-marched SDF with cursor interaction
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .preset-button {
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: capitalize;
        letter-spacing: 0.025em;
        transition: all 0.2s ease;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        cursor: pointer;
      }

      .preset-button:hover {
        transform: scale(1.05);
      }

      .preset-button:focus-visible {
        outline: 2px solid white;
        outline-offset: 2px;
      }

      .preset-button-inactive {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
      }

      .preset-button-inactive:hover {
        background: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
      }

      .preset-button-active {
        background: rgba(255, 255, 255, 0.25);
        color: white;
        border-color: rgba(255, 255, 255, 0.4);
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.15);
      }
    `,
  ],
})
export class MetaballHeroSceneComponent {
  /**
   * Currently selected preset
   */
  public readonly selectedPreset = signal<MetaballPreset>('holographic');

  /**
   * Available presets for the selector
   */
  public readonly presets: MetaballPreset[] = [
    'moody',
    'cosmic',
    'neon',
    'sunset',
    'holographic',
    'minimal',
  ];

  /**
   * Background color as hex number for Scene3dComponent
   */
  public readonly backgroundColor = computed(() => {
    const presetColors: Record<MetaballPreset, number> = {
      moody: 0x050505,
      cosmic: 0x000011,
      neon: 0x000505,
      sunset: 0x150505,
      holographic: 0x0a0a15,
      minimal: 0x0a0a0a,
    };
    return presetColors[this.selectedPreset()];
  });

  /**
   * Background color as CSS hex string for the container div
   */
  public readonly backgroundColorHex = computed(() => {
    const presetColors: Record<MetaballPreset, string> = {
      moody: '#050505',
      cosmic: '#000011',
      neon: '#000505',
      sunset: '#150505',
      holographic: '#0a0a15',
      minimal: '#0a0a0a',
    };
    return presetColors[this.selectedPreset()];
  });

  /**
   * Select a new preset
   */
  public selectPreset(preset: MetaballPreset): void {
    this.selectedPreset.set(preset);
  }

  /**
   * Get CSS classes for preset button based on active state
   */
  public getPresetButtonClass(preset: MetaballPreset): string {
    const baseClass = 'preset-button';
    const isActive = this.selectedPreset() === preset;
    return `${baseClass} ${
      isActive ? 'preset-button-active' : 'preset-button-inactive'
    }`;
  }
}
