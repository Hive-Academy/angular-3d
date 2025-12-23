import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

/**
 * Code snippet component with syntax highlighting and copy-to-clipboard functionality.
 * Used throughout showcase sections to display component usage examples.
 *
 * @example
 * ```html
 * <app-code-snippet
 *   code="<a3d-box />"
 *   language="html"
 * />
 * ```
 */
@Component({
  selector: 'app-code-snippet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative bg-background-dark rounded-lg overflow-hidden">
      <pre
        class="p-4x text-sm overflow-x-auto text-white"
      ><code [class]="'language-' + language()">{{ code() }}</code></pre>

      <button
        type="button"
        (click)="copyToClipboard()"
        class="absolute top-2x right-2x px-3x py-1x bg-primary-500 text-white rounded-md text-xs hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
        [attr.aria-label]="
          copied() ? 'Code copied to clipboard' : 'Copy code to clipboard'
        "
      >
        {{ copied() ? 'Copied!' : 'Copy' }}
      </button>
    </div>
  `,
})
export class CodeSnippetComponent {
  /**
   * Code string to display
   */
  readonly code = input.required<string>();

  /**
   * Programming language for syntax highlighting
   * @default 'html'
   */
  readonly language = input<'html' | 'typescript'>('html');

  /**
   * Internal state tracking whether code was recently copied
   */
  readonly copied = signal(false);

  /**
   * Copies code to clipboard and shows visual feedback for 2 seconds
   */
  copyToClipboard(): void {
    navigator.clipboard
      .writeText(this.code())
      .then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy code to clipboard:', err);
      });
  }
}
