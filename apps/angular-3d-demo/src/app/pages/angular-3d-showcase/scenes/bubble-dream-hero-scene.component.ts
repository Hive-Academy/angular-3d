import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  NebulaVolumetricComponent,
  BubbleTextComponent,
  EffectComposerComponent,
  BloomEffectComponent,
} from '@hive-academy/angular-3d';

/**
 * Bubble Dream Hero Scene - Whimsical bubble text with dreamy nebula background
 *
 * Features:
 * - Volumetric nebula with pink/purple dreamy colors
 * - BubbleTextComponent with floating bubbles
 * - Soft bloom for ethereal atmosphere
 * - Playful, whimsical aesthetic
 *
 * @example
 * ```html
 * <app-bubble-dream-hero-scene />
 * ```
 */
@Component({
  selector: 'app-bubble-dream-hero-scene',
  standalone: true,
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    NebulaVolumetricComponent,
    BubbleTextComponent,
    EffectComposerComponent,
    BloomEffectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden" style="height: calc(100vh - 180px);">
      <a3d-scene-3d
        [cameraPosition]="[0, 0, 12]"
        [cameraFov]="55"
        [enableAntialiasing]="true"
        [alpha]="false"
        [backgroundColor]="backgroundColor"
      >
        <!-- Soft ambient lighting for bubble visibility -->
        <a3d-ambient-light [intensity]="0.3" />

        <!-- Directional light for bubble reflections -->
        <a3d-directional-light
          [position]="[0, 5, 5]"
          [intensity]="0.8"
          [color]="'#ffffff'"
        />

        <!-- Dreamy nebula background with pink/purple gradients -->
        <a3d-nebula-volumetric
          [position]="[0, 0, -15]"
          [width]="40"
          [height]="25"
          [primaryColor]="'#d946ef'"
          [secondaryColor]="'#8b5cf6'"
          [opacity]="0.4"
        />

        <!-- Bubble text with flying bubbles for playful effect -->
        <a3d-bubble-text
          [text]="'BUBBLE DREAM'"
          [fontSize]="70"
          [fontScaleFactor]="0.07"
          [bubbleColor]="bubbleColor"
          [opacity]="0.6"
          [maxBubbleScale]="0.8"
          [bubblesPerPixel]="2"
          [growSpeed]="0.015"
          [enableFlying]="true"
          [flyingRatio]="0.08"
          [position]="[0, 0, 0]"
        />

        <!-- Soft bloom for dreamy ethereal atmosphere -->
        <a3d-effect-composer>
          <a3d-bloom-effect [threshold]="0.7" [strength]="0.4" [radius]="0.6" />
        </a3d-effect-composer>
      </a3d-scene-3d>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class BubbleDreamHeroSceneComponent {
  readonly backgroundColor = 0x0f0520;
  readonly bubbleColor = 0xffffff;
}
