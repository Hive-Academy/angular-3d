import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  TroikaTextComponent,
  GlowTroikaTextComponent,
  ParticleTextComponent,
  BubbleTextComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Text Section - 3D text rendering components.
 *
 * Contains 2 grouped scenes:
 * 1. Troika Text variants (basic, glow)
 * 2. Particle-based text (particles, bubbles)
 * Updated to use height multiplier 2.5 for better fitting.
 */
@Component({
  selector: 'app-text-section',
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    TroikaTextComponent,
    GlowTroikaTextComponent,
    ParticleTextComponent,
    BubbleTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Troika Text Variants -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">SDF Text Rendering</h2>
          <p class="text-text-secondary">
            High-quality text with Troika-three-text
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Basic Troika -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 8]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />
                <a3d-troika-text
                  text="Angular 3D"
                  [fontSize]="1.2"
                  [color]="colors.indigo"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-indigo-400"
                >&lt;a3d-troika-text /&gt;</code
              >
              <p class="text-xs text-text-tertiary mt-1x">Basic SDF text</p>
            </div>
          </div>

          <!-- Glow Text -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 8]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />
                <a3d-glow-troika-text
                  text="Neon Glow"
                  [fontSize]="1.2"
                  [glowColor]="colors.cyan"
                  [glowIntensity]="2"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-cyan-400"
                >&lt;a3d-glow-troika-text /&gt;</code
              >
              <p class="text-xs text-text-tertiary mt-1x">
                Emissive glow effect
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Particle-based Text -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Particle Text</h2>
          <p class="text-text-secondary">Text formed from animated particles</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Particle Text -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 18]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />
                <a3d-particle-text
                  text="Particles"
                  [fontScaleFactor]="0.07"
                  [fontSize]="55"
                  [lineHeightMultiplier]="6.0"
                  [particleColor]="colors.pink"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-pink-400"
                >&lt;a3d-particle-text /&gt;</code
              >
            </div>
          </div>

          <!-- Bubble Text -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 18]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />
                <a3d-bubble-text
                  text="Bubbles"
                  [fontSize]="60"
                  [lineHeightMultiplier]="3.0"
                  [fontScaleFactor]="0.07"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-orange-400"
                >&lt;a3d-bubble-text /&gt;</code
              >
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class TextSectionComponent {
  public readonly colors = SCENE_COLORS;
}
