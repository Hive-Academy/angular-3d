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
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  input,
  effect,
} from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../../types/tokens';

/** Lighting preset types */
export type LightingPreset = 'studio' | 'outdoor' | 'dramatic' | 'custom';

/** Light configuration for presets */
interface LightConfig {
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
    ambientColor: 0xffffff,
    ambientIntensity: 0.5,
    lights: [],
  },
};

@Component({
  selector: 'a3d-scene-lighting',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class SceneLightingComponent implements OnInit, OnDestroy {
  /** Lighting preset to use: 'studio', 'outdoor', 'dramatic', or 'custom' */
  public readonly preset = input<LightingPreset>('studio');

  /** Override ambient light intensity (0-1) */
  public readonly ambientIntensity = input<number | undefined>(undefined);

  /** Override ambient light color (hex number) */
  public readonly ambientColor = input<number | undefined>(undefined);

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private ambientLight: THREE.AmbientLight | null = null;
  private lights: THREE.Light[] = [];

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

    // Reactive effect for ambient color override
    effect(() => {
      if (this.ambientLight) {
        const overrideColor = this.ambientColor();
        if (overrideColor !== undefined) {
          this.ambientLight.color.set(overrideColor);
        }
      }
    });
  }

  public ngOnInit(): void {
    const config = LIGHT_PRESETS[this.preset()];

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

  public ngOnDestroy(): void {
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
    this.lights = [];
  }
}
