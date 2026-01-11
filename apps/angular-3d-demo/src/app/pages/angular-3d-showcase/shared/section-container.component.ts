import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Consistent section wrapper with heading, description, and responsive grid layout.
 * Ensures visual consistency across all showcase sections.
 *
 * @example
 * ```html
 * <app-section-container background="light" [columns]="3">
 *   <h2 heading>Primitives</h2>
 *   <p description>Building blocks for 3D scenes</p>
 *
 *   <!-- Grid content (auto-wrapped in responsive grid) -->
 *   <app-showcase-card ... />
 *   <app-showcase-card ... />
 *   <app-showcase-card ... />
 * </app-section-container>
 * ```
 */
@Component({
  selector: 'app-section-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      [class]="
        'py-16x ' +
        (background() === 'light'
          ? 'bg-background-light'
          : 'bg-background-dark')
      "
    >
      <div class="max-w-container mx-auto px-4x">
        <!-- Section Header -->
        <div class="text-center mb-12x">
          <h2 class="text-display-lg font-bold mb-4x">
            <ng-content select="[heading]" />
          </h2>
          <p class="text-headline-md text-text-secondary max-w-prose mx-auto">
            <ng-content select="[description]" />
          </p>
        </div>

        <!-- Grid Content -->
        <div [class]="getGridClasses()">
          <ng-content />
        </div>
      </div>
    </section>
  `,
})
export class SectionContainerComponent {
  /**
   * Background color variant
   * @default 'light'
   */
  public readonly background = input<'light' | 'dark'>('light');

  /**
   * Number of columns in desktop grid layout
   * Mobile: always 1 column
   * Tablet: always 2 columns
   * Desktop: 2, 3, or 4 columns based on this input
   * @default 3
   */
  public readonly columns = input<2 | 3 | 4>(3);

  /**
   * Generates responsive Tailwind grid classes based on column configuration
   * - All layouts: 1 column on mobile (< 768px)
   * - All layouts: 2 columns on tablet (768px - 1024px)
   * - Desktop (1024px+): 2, 3, or 4 columns based on input
   */
  public getGridClasses(): string {
    const colsMap = {
      2: 'grid md:grid-cols-2 gap-8x',
      3: 'grid md:grid-cols-2 lg:grid-cols-3 gap-8x',
      4: 'grid md:grid-cols-2 lg:grid-cols-4 gap-8x',
    };
    return colsMap[this.columns()];
  }
}
