import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  Scene3dComponent,
  CloudLayerComponent,
  GlowTroikaTextComponent,
  StarFieldComponent,
} from '@hive-academy/angular-3d';

/**
 * Cloud Hero Scene - Flying Through Clouds with Glowing 3D Text
 *
 * Features:
 * - Self-glowing 3D text (NO bloom post-processing needed!)
 * - Stars visible only in night mode
 * - Day/Night toggle with different text colors
 */
@Component({
  selector: 'app-cloud-hero-scene',
  imports: [
    Scene3dComponent,
    CloudLayerComponent,
    GlowTroikaTextComponent,
    StarFieldComponent,
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
        [alpha]="true"
      >
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

        <!-- GLOWING 3D Text - Using Troika's NATIVE glow (outlineBlur)! -->
        <a3d-glow-troika-text
          [text]="'FLYTHROUGH'"
          [fontSize]="120"
          [position]="[0, 150, 4000]"
          [glowColor]="textGlowColor()"
          [textColor]="'#ffffff'"
          [glowBlur]="'50%'"
          [glowWidth]="'20%'"
          [glowOpacity]="1"
          [glowIntensity]="1.5"
          [pulseSpeed]="0.3"
          [anchorX]="'center'"
          [anchorY]="'middle'"
          [letterSpacing]="0.15"
        />

        <!-- Cloud Layer - pure white clouds, no bloom interference -->
        <a3d-cloud-layer
          [textureUrl]="'/clouds/cloud10.png'"
          [cloudCount]="8000"
          [fogColor]="fogColor()"
          [speed]="0.03"
          [mouseParallax]="true"
        />

        <!-- NO BLOOM! GlowTroikaText now has built-in glow -->
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

  // Background colors
  public readonly backgroundColor = computed(() =>
    this.isNightMode() ? '#050510' : '#326696'
  );

  // Fog matches background for seamless blend
  public readonly fogColor = computed(() =>
    this.isNightMode() ? '#050510' : '#4584b4'
  );

  // Text glow color: warm golden for day, cool cyan for night
  public readonly textGlowColor = computed(() =>
    this.isNightMode() ? '#00ffff' : '#ffd700'
  );

  // Main text color: white for both modes (visible against glow)
  public readonly textColor = computed(() =>
    this.isNightMode() ? '#ffffff' : '#ffffff'
  );

  public toggleMode(): void {
    this.isNightMode.update((v) => !v);
  }
}
