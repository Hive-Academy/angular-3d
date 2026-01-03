/**
 * SceneLightingComponent - Preset-based Scene Lighting Setup
 *
 * A high-level component that creates multiple lights at once based on lighting presets.
 * This is a convenience wrapper around individual light components, providing curated
 * configurations for common lighting scenarios.
 *
 * @example
 * ```html
 * <!-- Studio lighting with key and fill lights -->
 * <a3d-scene-lighting preset="studio" />
 *
 * <!-- Outdoor lighting with sun simulation -->
 * <a3d-scene-lighting preset="outdoor" />
 *
 * <!-- Dramatic single spotlight -->
 * <a3d-scene-lighting preset="dramatic" />
 *
 * <!-- Custom with ambient override -->
 * <a3d-scene-lighting preset="studio" [ambientIntensity]="0.8" />
 * ```
 *
 * Presets:
 * - **studio**: Balanced lighting with key light (5,10,7.5), fill light (-5,5,-5), 40% ambient
 * - **outdoor**: Simulates natural daylight with sun at (10,20,10), sky-blue 60% ambient
 * - **dramatic**: Low 10% ambient with single spotlight from above
 * - **custom**: Minimal ambient only, use override inputs for full control
 *
 * For fine-grained control over individual lights, use the separate light components:
 * - `<a3d-ambient-light>`
 * - `<a3d-directional-light>`
 * - `<a3d-point-light>`
 * - `<a3d-spot-light>`
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  afterNextRender,
  signal,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { NG_3D_PARENT } from '../../types/tokens';

/** Lighting preset types */
export type LightingPreset =
  | 'studio'
  | 'outdoor'
  | 'dramatic'
  | 'custom'
  | 'cinematic-space'
  | 'neon-cyberpunk'
  | 'rim-light'
  | 'three-point';

/** Light configuration for presets */
interface LightConfig {
  /** Background color for the scene (hex number) */
  backgroundColor: number;
  ambientColor: number;
  ambientIntensity: number;
  lights: Array<{
    type: 'directional' | 'spot' | 'point';
    color: number;
    intensity: number;
    position: [number, number, number];
    castShadow?: boolean;
    angle?: number;
    penumbra?: number;
  }>;
}

/** Preset configurations */
const LIGHT_PRESETS: Record<LightingPreset, LightConfig> = {
  studio: {
    backgroundColor: 0x1a1a1a,
    ambientColor: 0xffffff,
    ambientIntensity: 0.4,
    lights: [
      {
        type: 'directional',
        color: 0xffffff,
        intensity: 1.0,
        position: [5, 10, 7.5],
        castShadow: true,
      },
      {
        type: 'directional',
        color: 0xffffff,
        intensity: 0.5,
        position: [-5, 5, -5],
        castShadow: false,
      },
    ],
  },
  outdoor: {
    backgroundColor: 0x87ceeb,
    ambientColor: 0x87ceeb,
    ambientIntensity: 0.6,
    lights: [
      {
        type: 'directional',
        color: 0xffffff,
        intensity: 1.2,
        position: [10, 20, 10],
        castShadow: true,
      },
    ],
  },
  dramatic: {
    backgroundColor: 0x050510,
    ambientColor: 0x111122,
    ambientIntensity: 0.1,
    lights: [
      {
        type: 'spot',
        color: 0xffffff,
        intensity: 2.0,
        position: [0, 10, 0],
        castShadow: true,
        angle: Math.PI / 6,
        penumbra: 0.5,
      },
    ],
  },
  custom: {
    backgroundColor: 0x000000,
    ambientColor: 0xffffff,
    ambientIntensity: 0.5,
    lights: [],
  },

  /**
   * Cinematic Space - Deep blue atmosphere with colored accent lights
   * Features: Low ambient, cool blue key light, cyan and magenta rim lights
   * Best for: Space scenes, hero sections, sci-fi environments
   */
  'cinematic-space': {
    backgroundColor: 0x020208,
    ambientColor: 0x0a0a1a,
    ambientIntensity: 0.15,
    lights: [
      // Key light - cool blue from upper right
      {
        type: 'directional',
        color: 0x4488ff,
        intensity: 0.8,
        position: [15, 10, 10],
        castShadow: true,
      },
      // Cyan rim light - left side
      {
        type: 'point',
        color: 0x00ffff,
        intensity: 1.2,
        position: [-12, 5, 8],
        castShadow: false,
      },
      // Magenta rim light - right side
      {
        type: 'point',
        color: 0xff00ff,
        intensity: 0.8,
        position: [12, -3, 6],
        castShadow: false,
      },
      // Deep blue fill from below
      {
        type: 'point',
        color: 0x2244ff,
        intensity: 0.5,
        position: [0, -8, 5],
        castShadow: false,
      },
    ],
  },

  /**
   * Neon Cyberpunk - High contrast with multiple colored point lights
   * Features: Very low ambient, vibrant neon accents, high intensity
   * Best for: Cyberpunk aesthetics, night scenes, futuristic UI
   */
  'neon-cyberpunk': {
    backgroundColor: 0x0a0010,
    ambientColor: 0x050510,
    ambientIntensity: 0.08,
    lights: [
      // Hot pink main accent
      {
        type: 'point',
        color: 0xff1493,
        intensity: 1.5,
        position: [-8, 4, 10],
        castShadow: true,
      },
      // Electric cyan accent
      {
        type: 'point',
        color: 0x00ffff,
        intensity: 1.5,
        position: [8, 2, 8],
        castShadow: false,
      },
      // Purple highlight
      {
        type: 'point',
        color: 0x8b00ff,
        intensity: 1.0,
        position: [0, 8, 6],
        castShadow: false,
      },
      // Yellow accent
      {
        type: 'point',
        color: 0xffff00,
        intensity: 0.6,
        position: [5, -5, 12],
        castShadow: false,
      },
    ],
  },

  /**
   * Rim Light - Strong backlight for silhouette and edge glow effects
   * Features: Minimal ambient, strong back directional, subtle front fill
   * Best for: Hero shots, dramatic reveals, product presentations
   */
  'rim-light': {
    backgroundColor: 0x080812,
    ambientColor: 0x101020,
    ambientIntensity: 0.1,
    lights: [
      // Strong backlight - creates rim/halo effect
      {
        type: 'directional',
        color: 0xffffff,
        intensity: 2.0,
        position: [0, 5, -15],
        castShadow: true,
      },
      // Subtle front fill - preserves some detail
      {
        type: 'directional',
        color: 0x6688cc,
        intensity: 0.3,
        position: [0, 0, 10],
        castShadow: false,
      },
      // Top highlight
      {
        type: 'point',
        color: 0xaaccff,
        intensity: 0.5,
        position: [0, 12, 0],
        castShadow: false,
      },
    ],
  },

  /**
   * Three-Point - Classic film lighting setup (key, fill, back)
   * Features: Balanced professional lighting, natural shadows
   * Best for: Product visualization, character lighting, presentations
   */
  'three-point': {
    backgroundColor: 0x151520,
    ambientColor: 0x202030,
    ambientIntensity: 0.25,
    lights: [
      // Key light - main light source, 45° from camera
      {
        type: 'directional',
        color: 0xffffff,
        intensity: 1.2,
        position: [8, 8, 10],
        castShadow: true,
      },
      // Fill light - softer, opposite side, half intensity
      {
        type: 'directional',
        color: 0xccddff,
        intensity: 0.6,
        position: [-8, 4, 8],
        castShadow: false,
      },
      // Back light - rim/separation light
      {
        type: 'directional',
        color: 0xffeedd,
        intensity: 0.8,
        position: [0, 6, -10],
        castShadow: false,
      },
    ],
  },
};

@Component({
  selector: 'a3d-scene-lighting',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class SceneLightingComponent implements OnDestroy {
  /** Static access to all preset names */
  public static readonly PRESET_NAMES: readonly LightingPreset[] = [
    'cinematic-space',
    'neon-cyberpunk',
    'rim-light',
    'three-point',
    'studio',
    'outdoor',
    'dramatic',
    'custom',
  ] as const;

  /** Get configuration for a specific preset */
  public static getPresetConfig(preset: LightingPreset): {
    backgroundColor: number;
    ambientColor: number;
    ambientIntensity: number;
  } {
    const config = LIGHT_PRESETS[preset];
    return {
      backgroundColor: config.backgroundColor,
      ambientColor: config.ambientColor,
      ambientIntensity: config.ambientIntensity,
    };
  }

  /** Lighting preset to use: 'studio', 'outdoor', 'dramatic', or 'custom' */
  public readonly preset = input<LightingPreset>('studio');

  /** Override ambient light intensity (0-1) */
  public readonly ambientIntensity = input<number | undefined>(undefined);

  /** Override ambient light color (hex number) */
  public readonly ambientColor = input<number | undefined>(undefined);

  /** Override key light (first light) intensity */
  public readonly keyIntensity = input<number | undefined>(undefined);

  /** Override fill light (second light) intensity */
  public readonly fillIntensity = input<number | undefined>(undefined);

  /** Emits the background color when preset changes */
  public readonly backgroundColorChange = output<number>();

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private ambientLight: THREE.AmbientLight | null = null;
  private lights: THREE.Light[] = [];

  /** Signal to track if render has happened */
  private readonly isRendered = signal(false);

  public constructor() {
    // Reactive effect for ambient intensity override
    effect(() => {
      if (this.ambientLight) {
        const overrideIntensity = this.ambientIntensity();
        if (overrideIntensity !== undefined) {
          this.ambientLight.intensity = overrideIntensity;
        }
      }
    });

    // Reactive effect for ambient color override (existing)
    effect(() => {
      if (this.ambientLight) {
        const overrideColor = this.ambientColor();
        if (overrideColor !== undefined) {
          this.ambientLight.color.set(overrideColor);
        }
      }
    });

    // Reactive effect for key light intensity override
    effect(() => {
      const keyOverride = this.keyIntensity();
      if (keyOverride !== undefined && this.lights.length > 0) {
        this.lights[0].intensity = keyOverride;
      }
    });

    // Reactive effect for fill light intensity override
    effect(() => {
      const fillOverride = this.fillIntensity();
      if (fillOverride !== undefined && this.lights.length > 1) {
        this.lights[1].intensity = fillOverride;
      }
    });

    // Mark as rendered after first render
    afterNextRender(() => {
      this.isRendered.set(true);
    });

    // Reactive effect for preset changes (runs in injection context)
    effect((onCleanup) => {
      // Skip if not yet rendered
      if (!this.isRendered()) {
        return;
      }

      const preset = this.preset();
      this.refreshLights(preset);

      onCleanup(() => {
        this.disposeLights();
      });
    });
  }

  private refreshLights(preset: LightingPreset): void {
    const config = LIGHT_PRESETS[preset];

    // Emit background color for parent to use
    this.backgroundColorChange.emit(config.backgroundColor);

    // Create ambient light
    this.ambientLight = new THREE.AmbientLight(
      this.ambientColor() ?? config.ambientColor,
      this.ambientIntensity() ?? config.ambientIntensity
    );

    // Add to parent
    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.ambientLight);

        // Create lights from preset config
        config.lights.forEach((lightConfig) => {
          let light: THREE.Light;

          switch (lightConfig.type) {
            case 'directional':
              light = new THREE.DirectionalLight(
                lightConfig.color,
                lightConfig.intensity
              );
              break;
            case 'spot': {
              const spotLight = new THREE.SpotLight(
                lightConfig.color,
                lightConfig.intensity
              );
              if (lightConfig.angle !== undefined) {
                spotLight.angle = lightConfig.angle;
              }
              if (lightConfig.penumbra !== undefined) {
                spotLight.penumbra = lightConfig.penumbra;
              }
              light = spotLight;
              break;
            }
            case 'point':
              light = new THREE.PointLight(
                lightConfig.color,
                lightConfig.intensity
              );
              break;
            default:
              return;
          }

          light.position.set(...lightConfig.position);
          if (lightConfig.castShadow !== undefined) {
            light.castShadow = lightConfig.castShadow;
          }

          this.lights.push(light);
          parent.add(light);
        });
      } else {
        console.warn('SceneLightingComponent: Parent not ready');
      }
    } else {
      console.warn('SceneLightingComponent: No parent found');
    }
  }

  private disposeLights(): void {
    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        if (this.ambientLight) {
          parent.remove(this.ambientLight);
        }
        this.lights.forEach((light) => {
          parent.remove(light);
          light.dispose();
        });
      }
    }
    this.ambientLight?.dispose();
    this.ambientLight = null;
    this.lights = [];
  }

  public ngOnDestroy(): void {
    this.disposeLights();
  }
}
