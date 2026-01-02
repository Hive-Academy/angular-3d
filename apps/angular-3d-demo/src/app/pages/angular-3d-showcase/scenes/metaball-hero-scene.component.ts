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
  TroikaTextComponent,
  AmbientLightComponent,
  PointLightComponent,
  OrbitControlsComponent,
  tslPhotosphere,
  StarFieldComponent,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';

/**
 * Metaball Hero Section - Immersive Production Hero
 *
 * Features:
 * - Ray-marched metaballs as central focal point
 * - Photosphere background for depth
 * - Centered hero text with proper camera distance
 * - 6 themed presets with matching lighting
 * - Interactive orbit controls
 */
@Component({
  selector: 'app-metaball-hero-scene',
  imports: [
    Scene3dComponent,
    MetaballComponent,
    TroikaTextComponent,
    AmbientLightComponent,
    PointLightComponent,
    OrbitControlsComponent,
    StarFieldComponent,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative overflow-hidden"
      [style.background]="backgroundColorHex()"
      style="width: 100%; height: 100vh; min-height: 600px;"
    >
      <a3d-scene-3d
        [cameraPosition]="[0, 0, 10]"
        [cameraFov]="60"
        [enableAntialiasing]="true"
        [backgroundColor]="backgroundColor()"
      >
        <!-- Lighting Setup -->
        <a3d-ambient-light [intensity]="0.2" />

        <a3d-point-light
          [position]="[10, 5, 10]"
          [intensity]="1.2"
          [color]="lightColor()"
        />

        <!-- Deep space star field background -->
        <a3d-star-field
          [starCount]="2000"
          [radius]="15"
          [size]="0.01"
          [stellarColors]="true"
          [multiSize]="true"
        />

        <!-- Main metaball effect (fullscreen mode for hero section) -->
        <a3d-metaball
          [preset]="selectedPreset()"
          [sphereCount]="6"
          [smoothness]="0.3"
          [mouseProximityEffect]="true"
          [animationSpeed]="0.6"
          [movementScale]="1.2"
          [fullscreen]="true"
        />

        <!-- Hero headline (centered in viewport, scaled for camera z=10) -->
        <a3d-troika-text
          text="Where matter becomes thought"
          [fontSize]="0.8"
          viewportPosition="center"
          [viewportOffset]="{ offsetY: 2 }"
          [viewportZ]="1"
          [color]="'#ffffff'"
          anchorX="center"
          anchorY="middle"
        />

        <!-- Subtext (centered below, scaled for camera z=10) -->
        <a3d-troika-text
          [text]="subtextContent()"
          [fontSize]="0.25"
          viewportPosition="center"
          [viewportOffset]="{ offsetY: -2 }"
          [viewportZ]="1"
          [color]="'#aaaaaa'"
          anchorX="center"
          anchorY="middle"
        />

        <!-- Orbit Controls (adjusted distances for new camera position z=10) -->
        <a3d-orbit-controls
          [enableDamping]="true"
          [dampingFactor]="0.05"
          [autoRotate]="false"
          [minDistance]="5"
          [maxDistance]="30"
        />
      </a3d-scene-3d>

      <!-- Preset Selector UI (bottom-center) -->
      <div
        class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-wrap justify-center gap-2 px-4"
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
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
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
   * Photosphere texture node for glowing background sphere
   */
  protected readonly photosphereNode = tslPhotosphere({
    scale: 2,
    color: { r: 1, g: 0.6, b: 0.2 },
  });

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
   * Light color that matches the preset theme
   */
  public readonly lightColor = computed(() => {
    const colors: Record<MetaballPreset, string> = {
      moody: '#ffffff',
      cosmic: '#88aaff',
      neon: '#00ffcc',
      sunset: '#ff6622',
      holographic: '#ccaaff',
      minimal: '#ffffff',
    };
    return colors[this.selectedPreset()];
  });

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
   * Subtext content showing live metaball stats
   */
  public readonly subtextContent = computed(() => {
    const preset = this.selectedPreset();
    const presetDescriptions: Record<MetaballPreset, string> = {
      moody:
        'vessel: (0.00, 0.00) • field: 0.12u • merges: dynamic • theme: moody shadows',
      cosmic:
        'vessel: (0.00, 0.00) • field: 0.12u • merges: dynamic • theme: cosmic blue',
      neon: 'vessel: (0.00, 0.00) • field: 0.12u • merges: dynamic • theme: neon glow',
      sunset:
        'vessel: (0.00, 0.00) • field: 0.12u • merges: dynamic • theme: sunset warmth',
      holographic:
        'vessel: (0.00, 0.00) • field: 0.12u • merges: dynamic • theme: holographic',
      minimal:
        'vessel: (0.00, 0.00) • field: 0.12u • merges: dynamic • theme: minimal',
    };
    return presetDescriptions[preset];
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
