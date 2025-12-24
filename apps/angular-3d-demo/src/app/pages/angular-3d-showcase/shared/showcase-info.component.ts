import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CodeSnippetComponent } from './code-snippet.component';

/**
 * Reusable showcase card component for displaying 3D primitives with code examples.
 *
 * This component provides the card layout (title, description, code snippet).
 * The 3D scene preview should be rendered by the parent component, NOT this component.
 *
 * This pattern avoids Angular DI hierarchy issues with content projection.
 *
 * @example
 * ```html
 * <div class="card">
 *   <div class="scene-preview">
 *     <a3d-scene-3d>
 *       <a3d-box rotate3d />
 *     </a3d-scene-3d>
 *   </div>
 *   <app-showcase-info
 *     componentName="Box"
 *     description="3D box primitive"
 *     codeExample="<a3d-box />"
 *   />
 * </div>
 * ```
 */
@Component({
  selector: 'app-showcase-info',
  imports: [CodeSnippetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="text-headline-md font-bold mb-2x">{{ componentName() }}</h3>

    @if (description()) {
    <p class="text-body-sm text-text-secondary mb-3x">{{ description() }}</p>
    }

    <app-code-snippet [code]="codeExample()" language="html" />
  `,
})
export class ShowcaseInfoComponent {
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
}
