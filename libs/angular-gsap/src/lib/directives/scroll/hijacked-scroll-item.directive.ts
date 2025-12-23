/**
 * HijackedScrollItemDirective - Individual Step Marker
 *
 * Marks elements as steps in a hijacked scroll sequence.
 * Works with HijackedScrollDirective to coordinate multi-step animations.
 *
 * Features:
 * - Registers element with parent scroll container
 * - Configurable slide direction for animations
 * - Optional custom animation properties
 *
 * Usage:
 * ```html
 * <div hijackedScroll>
 *   <div hijackedScrollItem slideDirection="left">Step 1</div>
 *   <div hijackedScrollItem slideDirection="right">Step 2</div>
 *   <div hijackedScrollItem>Step 3</div>
 * </div>
 * ```
 */

import { Directive, ElementRef, input, inject } from '@angular/core';

export type SlideDirection = 'left' | 'right' | 'up' | 'down' | 'none';

export interface HijackedScrollItemConfig {
  slideDirection?: SlideDirection;
  fadeIn?: boolean;
  scale?: boolean;
  customFrom?: Record<string, unknown>;
  customTo?: Record<string, unknown>;
}

@Directive({
  selector: '[hijackedScrollItem]',
  standalone: true,
})
export class HijackedScrollItemDirective {
  private readonly elementRef = inject(ElementRef);

  // Slide direction for entry/exit animations
  readonly slideDirection = input<SlideDirection>('none');

  // Enable fade animation
  readonly fadeIn = input<boolean>(true);

  // Enable scale animation
  readonly scale = input<boolean>(true);

  // Custom GSAP animation properties
  readonly customFrom = input<Record<string, unknown>>();
  readonly customTo = input<Record<string, unknown>>();

  /**
   * Get the native HTML element
   *
   * Returns the native DOM element for this step item.
   * Used internally by the parent directive for animation setup.
   *
   * @returns The native HTMLElement
   *
   * @example
   * ```typescript
   * // Internal use by HijackedScrollDirective
   * items.forEach((item) => {
   *   const element = item.getElement();
   *   // Apply styles and animations
   * });
   * ```
   */
  getElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  /**
   * Get animation configuration
   *
   * Returns the current configuration for this step including
   * slide direction, fade settings, and custom properties.
   *
   * @returns Configuration object for this step
   *
   * @example
   * ```typescript
   * // Internal use by HijackedScrollDirective
   * const config = item.getConfig();
   * console.log('Slide direction:', config.slideDirection);
   * console.log('Fade enabled:', config.fadeIn);
   * ```
   */
  getConfig(): HijackedScrollItemConfig {
    return {
      slideDirection: this.slideDirection(),
      fadeIn: this.fadeIn(),
      scale: this.scale(),
      customFrom: this.customFrom(),
      customTo: this.customTo(),
    };
  }

  /**
   * Calculate slide offset based on direction
   *
   * Calculates the x/y pixel offset for slide animations based on
   * the configured slide direction.
   *
   * @returns Object with x and y pixel offsets
   *
   * @example
   * ```typescript
   * // Internal use by HijackedScrollDirective
   * const offset = item.getSlideOffset();
   * // For 'left': { x: -60, y: 0 }
   * // For 'right': { x: 60, y: 0 }
   * // For 'up': { x: 0, y: -60 }
   * // For 'down': { x: 0, y: 60 }
   * // For 'none': { x: 0, y: 0 }
   * ```
   */
  getSlideOffset(): { x: number; y: number } {
    const direction = this.slideDirection();
    const offset = 60; // pixels

    switch (direction) {
      case 'left':
        return { x: -offset, y: 0 };
      case 'right':
        return { x: offset, y: 0 };
      case 'up':
        return { x: 0, y: -offset };
      case 'down':
        return { x: 0, y: offset };
      default:
        return { x: 0, y: 0 };
    }
  }
}
