/**
 * ParallaxSplitItemDirective - Individual Step in Parallax Split Scroll
 *
 * Marks elements as steps in a parallax split-screen sequence.
 * Each step has an image and text content with alternating layouts.
 *
 * Features:
 * - Image source and alt configuration
 * - Layout direction (text-left/image-right or vice-versa)
 * - Content projection for flexible text layouts
 *
 * Usage:
 * ```html
 * <agsp-parallax-split-scroll>
 *   <div parallaxSplitItem
 *        [imageSrc]="'/assets/step1.jpg'"
 *        [imageAlt]="'Step 1'"
 *        [layout]="'left'">
 *     <h3>Title</h3>
 *     <p>Description</p>
 *   </div>
 * </agsp-parallax-split-scroll>
 * ```
 */

import { Directive, ElementRef, input, inject } from '@angular/core';

export type SplitLayout = 'left' | 'right';

export interface ParallaxSplitItemConfig {
  imageSrc: string;
  imageAlt: string;
  layout: SplitLayout;
}

@Directive({
  selector: '[parallaxSplitItem]',
  standalone: true,
})
export class ParallaxSplitItemDirective {
  private readonly elementRef = inject(ElementRef);

  /** Image source URL for this step */
  readonly imageSrc = input.required<string>();

  /** Image alt text for accessibility */
  readonly imageAlt = input<string>('');

  /** Layout direction: 'left' = text left/image right, 'right' = image left/text right */
  readonly layout = input<SplitLayout>('left');

  /** Get the native HTML element */
  public getElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  /** Get configuration for this step */
  public getConfig(): ParallaxSplitItemConfig {
    return {
      imageSrc: this.imageSrc(),
      imageAlt: this.imageAlt(),
      layout: this.layout(),
    };
  }
}
