import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  TorusComponent,
  BoxComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  BloomEffectComponent,
  Glow3dDirective,
  Rotate3dDirective,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';
import { SectionContainerComponent } from '../shared/section-container.component';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * PostprocessingShowcaseComponent
 *
 * Demonstrates postprocessing effects with before/after comparison.
 * Shows BloomEffectComponent impact on glowing objects using identical scenes.
 *
 * Key features:
 * - Side-by-side comparison (without bloom vs with bloom)
 * - Identical scenes in both cards (same objects, positions, colors)
 * - Clear visual demonstration of bloom effect
 * - Production-quality parameter configuration
 */
@Component({
  selector: 'app-postprocessing-showcase',
  imports: [
    SectionContainerComponent,
    Scene3dComponent,
    TorusComponent,
    BoxComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    BloomEffectComponent,
    Glow3dDirective,
    Rotate3dDirective,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="2" background="dark">
      <span heading
        >Postprocessing <span class="text-neon-green">Effects</span></span
      >
      <span description
        >EffectComposer and BloomEffect for high-quality visuals</span
      >

      <!-- Without Bloom -->
      <div class="bg-background-light rounded-card shadow-card p-6x">
        <div class="h-96x mb-4x relative overflow-hidden rounded-lg">
          <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
            <a3d-ambient-light [intensity]="0.3" />
            <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.8" />

            <!-- Center torus (cyan, glowing, rotating) -->
            <a3d-torus
              viewportPosition="center"
              [color]="colors.cyan"
              a3dGlow3d
              [glowIntensity]="2"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 15 }"
            />

            <!-- Left box (pink, rotating) -->
            <a3d-box
              [position]="[-2, 0, 0]"
              [color]="colors.pink"
              a3dGlow3d
              [glowIntensity]="2"
              rotate3d
              [rotateConfig]="{ axis: 'x', speed: 20 }"
            />

            <!-- Right box (neon green, rotating) -->
            <a3d-box
              [position]="[2, 0, 0]"
              [color]="colors.neonGreen"
              a3dGlow3d
              [glowIntensity]="2"
              rotate3d
              [rotateConfig]="{ axis: 'z', speed: 18 }"
            />

            <!-- NO BLOOM EFFECT - this is the key difference -->
          </a3d-scene-3d>
        </div>
        <h3 class="text-headline-md font-bold mb-2x">Without Bloom</h3>
        <p class="text-body-sm text-text-secondary mb-3x">
          Standard rendering without postprocessing effects. Objects use Glow3d
          directive but lack the halo effect.
        </p>
        <pre
          class="bg-background-dark rounded-lg p-3x text-sm overflow-x-auto"
        ><code class="language-html">&lt;a3d-scene-3d&gt;
  &lt;!-- No bloom effect --&gt;
  &lt;a3d-box a3dGlow3d /&gt;
&lt;/a3d-scene-3d&gt;</code></pre>
      </div>

      <!-- With Bloom -->
      <div class="bg-background-light rounded-card shadow-card p-6x">
        <div class="h-96x mb-4x relative overflow-hidden rounded-lg">
          <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
            <a3d-ambient-light [intensity]="0.3" />
            <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.8" />

            <!-- IDENTICAL SCENE as "Without Bloom" card -->
            <!-- Center torus (cyan, glowing, rotating) -->
            <a3d-torus
              viewportPosition="center"
              [color]="colors.cyan"
              a3dGlow3d
              [glowIntensity]="2"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 15 }"
            />

            <!-- Left box (pink, rotating) -->
            <a3d-box
              [position]="[-2, 0, 0]"
              [color]="colors.pink"
              a3dGlow3d
              [glowIntensity]="2"
              rotate3d
              [rotateConfig]="{ axis: 'x', speed: 20 }"
            />

            <!-- Right box (neon green, rotating) -->
            <a3d-box
              [position]="[2, 0, 0]"
              [color]="colors.neonGreen"
              a3dGlow3d
              [glowIntensity]="2"
              rotate3d
              [rotateConfig]="{ axis: 'z', speed: 18 }"
            />

            <!-- BLOOM EFFECT - creates glow halo around bright objects -->
            <a3d-bloom-effect
              [threshold]="0.5"
              [strength]="1.5"
              [radius]="0.5"
            />
          </a3d-scene-3d>
        </div>
        <h3 class="text-headline-md font-bold mb-2x">With Bloom</h3>
        <p class="text-body-sm text-text-secondary mb-3x">
          Bloom effect creates glow halo around bright objects (threshold: 0.5,
          strength: 1.5, radius: 0.5)
        </p>
        <pre
          class="bg-background-dark rounded-lg p-3x text-sm overflow-x-auto"
        ><code class="language-html">&lt;a3d-scene-3d&gt;
  &lt;a3d-box a3dGlow3d /&gt;
  &lt;a3d-bloom-effect
    [threshold]="0.5"
    [strength]="1.5"
    [radius]="0.5" /&gt;
&lt;/a3d-scene-3d&gt;</code></pre>
      </div>
    </app-section-container>
  `,
})
export class PostprocessingShowcaseComponent {
  public readonly colors = SCENE_COLORS;
}
