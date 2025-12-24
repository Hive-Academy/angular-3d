import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  GlowTroikaTextComponent,
  ParticleTextComponent,
  ResponsiveTroikaTextComponent,
  SmokeTroikaTextComponent,
  TroikaTextComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';
import { SectionContainerComponent } from '../shared/section-container.component';
import { ShowcaseCardComponent } from '../shared/showcase-card.component';

/**
 * Text Showcase Component
 *
 * Showcases all 6 text rendering components from @hive-academy/angular-3d
 * with visual examples demonstrating different text effects.
 *
 * Component Coverage:
 * - TroikaTextComponent (Basic SDF text)
 * - ResponsiveTroikaTextComponent (Viewport-responsive sizing)
 * - GlowTroikaTextComponent (Emissive glow effect)
 * - SmokeTroikaTextComponent (Smoke/fog effect)
 * - ParticlesTextComponent (Particle cloud text)
 * - BubbleTextComponent (Bubble effect)
 *
 * Pattern: Uses ShowcaseCardComponent for consistent card layout,
 * SectionContainerComponent for section wrapper.
 */
@Component({
  selector: 'app-text-showcase',
  imports: [
    SectionContainerComponent,
    ShowcaseCardComponent,
    TroikaTextComponent,
    ResponsiveTroikaTextComponent,
    GlowTroikaTextComponent,
    SmokeTroikaTextComponent,
    ParticleTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <app-section-container [columns]="3" background="light">
      <span heading
        >3D <span class="text-primary-500">Text Rendering</span></span
      >
      <span description
        >6 text components with SDF-based rendering and visual effects</span
      >

      <!-- Troika Text (Basic) -->
      <app-showcase-card
        componentName="Troika Text"
        description="High-quality SDF text rendering"
        codeExample='<a3d-troika-text text="Angular 3D" [fontSize]="1" />'
        [cameraPosition]="[0, 0, 5]"
      >
        <a3d-troika-text
          sceneContent
          text="Angular 3D"
          [fontSize]="1"
          [color]="colors.indigo"
          viewportPosition="center"
        />
      </app-showcase-card>

      <!-- Responsive Troika Text -->
      <app-showcase-card
        componentName="Responsive Text"
        description="Viewport-responsive text sizing"
        codeExample='<a3d-responsive-troika-text text="Responsive" />'
        [cameraPosition]="[0, 0, 5]"
      >
        <a3d-responsive-troika-text
          sceneContent
          text="Responsive"
          [color]="colors.neonGreen"
          viewportPosition="center"
        />
      </app-showcase-card>

      <!-- Glow Text -->
      <app-showcase-card
        componentName="Glow Text"
        description="Text with emissive glow effect"
        codeExample='<a3d-glow-troika-text text="Glowing" [glowColor]="0x06b6d4" [glowIntensity]="2" />'
        [cameraPosition]="[0, 0, 5]"
      >
        <a3d-glow-troika-text
          sceneContent
          text="Glowing"
          [fontSize]="1"
          [glowColor]="colors.cyan"
          [glowIntensity]="2"
          viewportPosition="center"
        />
      </app-showcase-card>

      <!-- Smoke Text -->
      <app-showcase-card
        componentName="Smoke Text"
        description="Text with smoke/fog effect"
        codeExample='<a3d-smoke-troika-text text="Smokey" />'
        [cameraPosition]="[0, 0, 5]"
      >
        <a3d-smoke-troika-text
          sceneContent
          text="Smokey"
          [fontSize]="1"
          [color]="colors.violet"
          viewportPosition="center"
        />
      </app-showcase-card>

      <!-- Particles Text -->
      <app-showcase-card
        componentName="Particle Text"
        description="Text formed from particle cloud"
        codeExample='<a3d-particle-text text="Particles" [particleColor]="0xec4899" />'
        [cameraPosition]="[0, 0, 8]"
      >
        <a3d-particle-text
          sceneContent
          text="Particles"
          [particleColor]="colors.pink"
          viewportPosition="center"
        />
      </app-showcase-card>

      <!-- Bubble Text -->
      <app-showcase-card
        componentName="Bubble Text"
        description="Text with bubble effect"
        codeExample='<a3d-bubble-text text="Bubbles" [bubbleColor]="0xf59e0b" />'
        [cameraPosition]="[0, 0, 5]"
      >
        <a3d-bubble-text
          sceneContent
          text="Bubbles"
          [fontSize]="60"
          [bubbleColor]="colors.orange"
          viewportPosition="center"
        />
      </app-showcase-card>
    </app-section-container>
  `,
})
export class TextShowcaseComponent {
  public readonly colors = SCENE_COLORS;
}
