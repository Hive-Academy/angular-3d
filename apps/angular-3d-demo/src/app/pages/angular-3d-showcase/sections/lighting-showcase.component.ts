import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  TorusComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  SpotLightComponent,
  SceneLightingComponent,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';
import { ShowcaseCardComponent } from '../shared/showcase-card.component';
import { SectionContainerComponent } from '../shared/section-container.component';

/**
 * Lighting Showcase Component
 *
 * Side-by-side comparison of all 5 light types illuminating the same reference object (Torus).
 * Each card demonstrates a different light type's unique characteristics.
 *
 * Light Coverage:
 * - AmbientLight (Global illumination, no shadows)
 * - DirectionalLight (Sun-like parallel rays)
 * - PointLight (Omnidirectional point source)
 * - SpotLight (Cone-shaped with adjustable angle)
 * - SceneLighting (Pre-configured multi-light setup)
 *
 * Pattern: Same reference object (indigo torus) in all cards for visual comparison.
 * Directional/Point/Spot cards use low ambient (0.2) to show light directionality.
 */
@Component({
  selector: 'app-lighting-showcase',
  imports: [
    SectionContainerComponent,
    ShowcaseCardComponent,
    TorusComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
    SpotLightComponent,
    SceneLightingComponent,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <app-section-container [columns]="3" background="dark">
      <span heading
        >Lighting <span class="text-neon-green">Comparison</span></span
      >
      <span description
        >5 light types demonstrating different illumination techniques</span
      >

      <!-- Ambient Light -->
      <app-showcase-card
        componentName="Ambient Light"
        description="Global illumination (no shadows)"
        codeExample='<a3d-ambient-light [intensity]="0.8" [color]="0xffffff" />'
      >
        <a3d-ambient-light
          sceneContent
          [intensity]="0.8"
          [color]="colors.white"
        />
        <a3d-torus
          sceneContent
          viewportPosition="center"
          [color]="colors.indigo"
        />
      </app-showcase-card>

      <!-- Directional Light -->
      <app-showcase-card
        componentName="Directional Light"
        description="Sun-like parallel rays"
        codeExample='<a3d-directional-light [position]="[5, 5, 5]" [intensity]="1" />'
      >
        <a3d-ambient-light sceneContent [intensity]="0.2" />
        <a3d-directional-light
          sceneContent
          [position]="[5, 5, 5]"
          [intensity]="1.2"
          [color]="colors.neonGreen"
        />
        <a3d-torus
          sceneContent
          viewportPosition="center"
          [color]="colors.indigo"
        />
      </app-showcase-card>

      <!-- Point Light -->
      <app-showcase-card
        componentName="Point Light"
        description="Omnidirectional point source"
        codeExample='<a3d-point-light [position]="[2, 2, 2]" [intensity]="2" />'
      >
        <a3d-ambient-light sceneContent [intensity]="0.2" />
        <a3d-point-light
          sceneContent
          [position]="[2, 2, 2]"
          [intensity]="2"
          [color]="colors.cyan"
        />
        <a3d-torus
          sceneContent
          viewportPosition="center"
          [color]="colors.indigo"
        />
      </app-showcase-card>

      <!-- Spot Light -->
      <app-showcase-card
        componentName="Spot Light"
        description="Cone-shaped light (adjustable angle)"
        codeExample='<a3d-spot-light [position]="[0, 3, 3]" [angle]="0.5" />'
      >
        <a3d-ambient-light sceneContent [intensity]="0.2" />
        <a3d-spot-light
          sceneContent
          [position]="[0, 3, 3]"
          [angle]="0.5"
          [intensity]="2"
          [color]="colors.amber"
          [target]="[0, 0, 0]"
        />
        <a3d-torus
          sceneContent
          viewportPosition="center"
          [color]="colors.indigo"
        />
      </app-showcase-card>

      <!-- Scene Lighting (Pre-configured) -->
      <app-showcase-card
        componentName="Scene Lighting"
        description="Pre-configured multi-light setup"
        codeExample="<a3d-scene-lighting />"
      >
        <a3d-scene-lighting sceneContent />
        <a3d-torus
          sceneContent
          viewportPosition="center"
          [color]="colors.indigo"
        />
      </app-showcase-card>
    </app-section-container>
  `,
})
export class LightingShowcaseComponent {
  public readonly colors = SCENE_COLORS;
}
