import {
  ChangeDetectionStrategy,
  Component,
  input,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
} from '@hive-academy/angular-3d';
import { CodeSnippetComponent } from './code-snippet.component';

/**
 * Reusable showcase card component for displaying 3D primitives/components with code examples.
 *
 * Uses ngTemplateOutlet pattern to preserve Angular DI hierarchy.
 * The sceneTemplate is instantiated INSIDE the Scene3dComponent context,
 * so child components can inject NG_3D_PARENT, RenderLoopService, etc.
 *
 * @example
 * ```html
 * <app-showcase-card
 *   componentName="Box"
 *   description="Basic 3D box primitive"
 *   codeExample="<a3d-box />"
 *   [sceneTemplate]="boxTemplate"
 * />
 *
 * <ng-template #boxTemplate>
 *   <a3d-box [color]="colors.indigo" rotate3d />
 * </ng-template>
 * ```
 */
@Component({
  selector: 'app-showcase-card',
  imports: [
    NgTemplateOutlet,
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

          <!-- Template Outlet for 3D Object (preserves injector hierarchy) -->
          @if (sceneTemplate()) {
          <ng-container *ngTemplateOutlet="sceneTemplate()" />
          }
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
  public readonly componentName = input.required<string>();

  /**
   * Optional description of the component's purpose or features
   */
  public readonly description = input<string>('');

  /**
   * Code example showing basic usage (HTML format)
   */
  public readonly codeExample = input.required<string>();

  /**
   * Template containing 3D components to render inside the scene.
   * Using TemplateRef instead of ng-content preserves Angular DI hierarchy.
   */
  public readonly sceneTemplate = input<TemplateRef<unknown>>();

  /**
   * Camera position for 3D scene preview
   * @default [0, 0, 3]
   */
  public readonly cameraPosition = input<[number, number, number]>([0, 0, 3]);

  /**
   * Camera field of view for 3D scene preview
   * @default 75
   */
  public readonly cameraFov = input<number>(75);
}
