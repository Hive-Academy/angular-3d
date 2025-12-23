import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
} from '@hive-academy/angular-3d';
import { CodeSnippetComponent } from './code-snippet.component';

/**
 * Reusable showcase card component for displaying 3D primitives/components with code examples.
 * Extracted from primitives-showcase.component.ts to eliminate duplication across showcase sections.
 *
 * @example
 * ```html
 * <app-showcase-card
 *   componentName="Box"
 *   description="Basic 3D box primitive"
 *   codeExample="<a3d-box />"
 *   [cameraPosition]="[0, 0, 3]"
 * >
 *   <a3d-box sceneContent [color]="colors.indigo" rotate3d />
 * </app-showcase-card>
 * ```
 */
@Component({
  selector: 'app-showcase-card',
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    CodeSnippetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="bg-white rounded-card shadow-card p-6x hover:shadow-lg transition-shadow"
    >
      <!-- 3D Preview Container -->
      <div
        class="h-48x mb-4x relative overflow-hidden rounded-lg bg-background-dark"
      >
        <a3d-scene-3d
          [cameraPosition]="cameraPosition()"
          [cameraFov]="cameraFov()"
        >
          <a3d-ambient-light [intensity]="0.5" />
          <a3d-directional-light [position]="[2, 2, 2]" [intensity]="0.8" />

          <!-- Content Projection for 3D Object -->
          <ng-content select="[sceneContent]" />
        </a3d-scene-3d>
      </div>

      <!-- Component Info -->
      <h3 class="text-headline-md font-bold mb-2x">{{ componentName() }}</h3>

      @if (description()) {
      <p class="text-body-sm text-text-secondary mb-3x">{{ description() }}</p>
      }

      <!-- Code Snippet -->
      <app-code-snippet [code]="codeExample()" language="html" />
    </div>
  `,
})
export class ShowcaseCardComponent {
  /**
   * Display name of the component being showcased
   */
  readonly componentName = input.required<string>();

  /**
   * Optional description of the component's purpose or features
   */
  readonly description = input<string>('');

  /**
   * Code example showing basic usage (HTML format)
   */
  readonly codeExample = input.required<string>();

  /**
   * Camera position for 3D scene preview
   * @default [0, 0, 3]
   */
  readonly cameraPosition = input<[number, number, number]>([0, 0, 3]);

  /**
   * Camera field of view for 3D scene preview
   * @default 75
   */
  readonly cameraFov = input<number>(75);
}
