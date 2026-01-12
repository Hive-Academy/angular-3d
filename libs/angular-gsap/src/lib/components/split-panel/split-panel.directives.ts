import { Directive } from '@angular/core';

/**
 * Directive to mark the parallax image content slot
 *
 * @example
 * ```html
 * <img splitPanelImage [src]="'image.png'" alt="Feature" />
 * ```
 */
@Directive({
  selector: '[splitPanelImage]',
  standalone: true,
})
export class SplitPanelImageDirective {}

/**
 * Directive to mark the step badge content slot
 *
 * @example
 * ```html
 * <div splitPanelBadge>
 *   <span class="text-2xl font-bold">1</span>
 * </div>
 * ```
 */
@Directive({
  selector: '[splitPanelBadge]',
  standalone: true,
})
export class SplitPanelBadgeDirective {}

/**
 * Directive to mark the title content slot
 *
 * @example
 * ```html
 * <h3 splitPanelTitle>ScrollAnimationDirective</h3>
 * ```
 */
@Directive({
  selector: '[splitPanelTitle]',
  standalone: true,
})
export class SplitPanelTitleDirective {}

/**
 * Directive to mark the description content slot
 *
 * @example
 * ```html
 * <p splitPanelDescription>Apply scroll-triggered animations...</p>
 * ```
 */
@Directive({
  selector: '[splitPanelDescription]',
  standalone: true,
})
export class SplitPanelDescriptionDirective {}

/**
 * Directive to mark the features/notes list slot
 *
 * @example
 * ```html
 * <div splitPanelFeatures>
 *   <div>Feature 1</div>
 *   <div>Feature 2</div>
 * </div>
 * ```
 */
@Directive({
  selector: '[splitPanelFeatures]',
  standalone: true,
})
export class SplitPanelFeaturesDirective {}
