import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  Scene3dComponent,
  CloudLayerComponent,
  TroikaTextComponent,
  StarFieldComponent,
} from '@hive-academy/angular-3d';

/**
 * Cloud Hero Scene - Flying Through Clouds with 3D Text
 *
 * Features:
 * - 3D text visible behind clouds in the sky
 * - Stars visible only in night mode
 * - Day/Night toggle
 */
@Component({
  selector: 'app-cloud-hero-scene',
  imports: [
    Scene3dComponent,
    CloudLayerComponent,
    TroikaTextComponent,
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
        [enableAntialiasing]="false"
        [alpha]="true"
      >
        <!-- Stars - Only visible in night mode (behind everything) -->
        @if (isNightMode()) {
        <a3d-star-field
          [starCount]="3000"
          [radius]="8000"
          [size]="0.08"
          [multiSize]="true"
          [stellarColors]="true"
        />
        }

        <!-- 3D Text in the sky (visible above clouds) -->
        <a3d-troika-text
          [text]="'FLYTHROUGH'"
          [fontSize]="80"
          [position]="[0, 80, 4000]"
          [color]="textColor()"
          [anchorX]="'center'"
          [anchorY]="'middle'"
          [fillOpacity]="0.9"
        />

        <!-- Cloud Layer -->
        <a3d-cloud-layer
          [textureUrl]="'/clouds/cloud10.png'"
          [cloudCount]="8000"
          [fogColor]="fogColor()"
          [speed]="0.03"
          [mouseParallax]="true"
        />
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

  public readonly backgroundColor = computed(() =>
    this.isNightMode() ? '#050510' : '#326696'
  );

  public readonly fogColor = computed(() =>
    this.isNightMode() ? '#050510' : '#4584b4'
  );

  public readonly textColor = computed(() =>
    this.isNightMode() ? '#ffffff' : '#1e4877'
  );

  public toggleMode(): void {
    this.isNightMode.update((v) => !v);
  }
}
