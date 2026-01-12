import { Directive } from '@angular/core';

/**
 * Directive to mark the step badge content slot
 *
 * @example
 * ```html
 * <span featureBadge>1</span>
 * ```
 */
@Directive({
  selector: '[featureBadge]',
  standalone: true,
})
export class FeatureBadgeDirective {}

/**
 * Directive to mark the step title content slot
 *
 * @example
 * ```html
 * <h3 featureTitle>Scene3D - Zero-Config 3D Canvas</h3>
 * ```
 */
@Directive({
  selector: '[featureTitle]',
  standalone: true,
})
export class FeatureTitleDirective {}

/**
 * Directive to mark the step description content slot
 *
 * @example
 * ```html
 * <p featureDescription>The Scene3D component handles WebGL context...</p>
 * ```
 */
@Directive({
  selector: '[featureDescription]',
  standalone: true,
})
export class FeatureDescriptionDirective {}

/**
 * Directive to mark the step notes container slot
 *
 * @example
 * ```html
 * <div featureNotes>
 *   <span>Note 1</span>
 *   <span>Note 2</span>
 * </div>
 * ```
 */
@Directive({
  selector: '[featureNotes]',
  standalone: true,
})
export class FeatureNotesDirective {}

/**
 * Directive to mark the visual content slot (image, code, video)
 *
 * @example
 * ```html
 * <img featureVisual [src]="step.image" [alt]="step.title" />
 * ```
 */
@Directive({
  selector: '[featureVisual]',
  standalone: true,
})
export class FeatureVisualDirective {}

/**
 * Directive to mark the decoration/background pattern slot
 *
 * @example
 * ```html
 * <div featureDecoration>
 *   <app-decorative-pattern [pattern]="'data-flow'" />
 * </div>
 * ```
 */
@Directive({
  selector: '[featureDecoration]',
  standalone: true,
})
export class FeatureDecorationDirective {}
