import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  Scene3dComponent,
  CloudLayerComponent,
  ExtrudedText3DComponent,
  StarFieldComponent,
  EffectComposerComponent,
  SelectiveBloomEffectComponent,
} from '@hive-academy/angular-3d';

/**
 * Cloud Hero Scene - Flying Through Clouds with Premium 3D Glowing Text
 *
 * Features:
 * - TRUE 3D extruded text with depth and bevels
 * - Proper emission + bloom for REAL glow effect
 * - Stars visible only in night mode
 * - Day/Night toggle with different colors
 */
@Component({
  selector: 'app-cloud-hero-scene',
  imports: [
    Scene3dComponent,
    CloudLayerComponent,
    ExtrudedText3DComponent,
    StarFieldComponent,
    EffectComposerComponent,
    SelectiveBloomEffectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative overflow-hidden"
      [style.background]="backgroundColor()"
      style="height: calc(100vh - 180px);"
    >
      <a3d-scene-3d
        [cameraPosition]="[0, 0, 6000]"
        [cameraFov]="30"
        [cameraNear]="1"
        [cameraFar]="10000"
        [enableAntialiasing]="true"
        [alpha]="false"
        [backgroundColor]="backgroundColor()"
      >
        <!-- Ambient light for text visibility -->
        <!-- Note: scene-3d has built-in lights -->

        <!-- Stars - Only visible in night mode -->
        @if (isNightMode()) {
        <a3d-star-field
          [starCount]="3000"
          [radius]="8000"
          [size]="0.08"
          [multiSize]="true"
          [stellarColors]="true"
        />
        }

        <!-- PREMIUM 3D Extruded Text with SELECTIVE BLOOM -->
        <!-- bloomLayer=1 makes only this text glow, clouds will NOT bloom -->
        <a3d-extruded-text-3d
          [text]="'FLYTHROUGH'"
          [fontSize]="80"
          [depth]="15"
          [bevelEnabled]="true"
          [bevelThickness]="2"
          [bevelSize]="1"
          [bevelSegments]="5"
          [position]="[0, 100, 4000]"
          [color]="emissiveColor()"
          [emissiveColor]="emissiveColor()"
          [emissiveIntensity]="5"
          [metalness]="0.0"
          [roughness]="0.3"
          [pulseSpeed]="0.3"
          [edgeGlow]="true"
          [edgeGlowIntensity]="1.5"
          [bloomLayer]="1"
        />

        <!-- Cloud Layer - moves past the static text -->
        <!-- Clouds are NOT on bloom layer, so they won't glow -->
        <a3d-cloud-layer
          [textureUrl]="'/clouds/cloud10.png'"
          [cloudCount]="8000"
          [fogColor]="fogColor()"
          [speed]="0.03"
          [mouseParallax]="true"
        />

        <!-- Selective Bloom - ONLY blooms objects on layer 1 (the text) -->
        <!-- Clouds are not on layer 1, so they won't have bloom halo -->
        <a3d-effect-composer>
          <a3d-selective-bloom-effect
            [layer]="1"
            [threshold]="0"
            [strength]="1.5"
            [radius]="0.4"
          />
        </a3d-effect-composer>
      </a3d-scene-3d>

      <!-- Day/Night Toggle -->
      <button
        (click)="toggleMode()"
        class="absolute top-4 right-4 z-20 mode-toggle"
        [attr.aria-label]="isNightMode() ? 'Switch to day' : 'Switch to night'"
      >
        <span class="mode-icon">{{ isNightMode() ? '🌙' : '☀️' }}</span>
        <span class="mode-label">{{ isNightMode() ? 'Night' : 'Day' }}</span>
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .mode-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 9999px;
        color: white;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }
      }

      .mode-icon {
        font-size: 1.25rem;
      }
    `,
  ],
})
export class CloudHeroSceneComponent {
  public readonly isNightMode = signal(false);

  // Background colors (hex number format for scene-3d)
  public readonly backgroundColor = computed(() =>
    this.isNightMode() ? 0x050510 : 0x326696
  );

  // Fog matches background for seamless blend
  public readonly fogColor = computed(() =>
    this.isNightMode() ? '#050510' : '#4584b4'
  );

  // Text base color: white
  public readonly textColor = computed(() => '#ffffff');

  // Emissive (glow) color: warm golden for day, cool cyan for night
  public readonly emissiveColor = computed(() =>
    this.isNightMode() ? '#00ffff' : '#ffd700'
  );

  public toggleMode(): void {
    this.isNightMode.update((v) => !v);
  }
}
