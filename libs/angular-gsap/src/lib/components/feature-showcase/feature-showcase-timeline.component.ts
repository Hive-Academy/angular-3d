import { Component, input, computed } from '@angular/core';

/**
 * FeatureShowcaseTimelineComponent - Container for Feature Steps
 *
 * A container component that provides consistent theming and layout
 * for a series of FeatureStepComponents. Handles ambient glow effects,
 * theme colors, and optional hero/footer sections.
 *
 * Features:
 * - Consistent dark gradient background with ambient glow
 * - Theme variants (indigo, emerald, custom)
 * - Optional hero and footer content projection
 * - Automatic color coordination with child FeatureStepComponents
 *
 * @example
 * ```html
 * <agsp-feature-showcase-timeline [colorTheme]="'indigo'">
 *   <!-- Optional Hero Section -->
 *   <div featureHero>
 *     <h2>Angular 3D</h2>
 *     <p>Pure Angular wrapper for Three.js</p>
 *   </div>
 *
 *   <!-- Feature Steps -->
 *   <agsp-feature-step [layout]="'left'" [stepNumber]="1">
 *     <span featureBadge>1</span>
 *     <h3 featureTitle>Scene3D</h3>
 *     ...
 *   </agsp-feature-step>
 *
 *   <agsp-feature-step [layout]="'right'" [stepNumber]="2">
 *     ...
 *   </agsp-feature-step>
 *
 *   <!-- Optional Footer Section -->
 *   <div featureFooter>
 *     <div class="grid grid-cols-3">...</div>
 *   </div>
 * </agsp-feature-showcase-timeline>
 * ```
 */
@Component({
  selector: 'agsp-feature-showcase-timeline',
  standalone: true,
  imports: [],
  template: `
    <!-- Dark immersive background -->
    <div [class]="containerClasses()" class="relative w-full overflow-hidden">
      <!-- Ambient glow effects -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          [class]="primaryGlowClasses()"
          class="absolute w-[600px] h-[600px] rounded-full blur-[120px]"
        ></div>
        <div
          [class]="secondaryGlowClasses()"
          class="absolute w-[500px] h-[500px] rounded-full blur-[100px]"
        ></div>
      </div>

      <!-- Content Container -->
      <div class="container mx-auto px-8 py-12 relative z-10">
        <!-- Hero Section (optional) -->
        <ng-content select="[featureHero]" />

        <!-- Feature Steps -->
        <ng-content />

        <!-- Footer Section (optional) -->
        <ng-content select="[featureFooter]" />
      </div>
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
export class FeatureShowcaseTimelineComponent {
  /**
   * Color theme for the showcase
   * - 'indigo': Indigo/purple gradient (Angular 3D style)
   * - 'emerald': Emerald/cyan gradient (Angular GSAP style)
   * - 'custom': Use customColors input
   */
  readonly colorTheme = input<'indigo' | 'emerald' | 'custom'>('indigo');

  /**
   * Custom color configuration when colorTheme is 'custom'
   */
  readonly customColors = input<
    | {
        primary: string;
        secondary: string;
        backgroundVia: string;
      }
    | undefined
  >(undefined);

  // Computed theme classes
  readonly containerClasses = computed(() => {
    const theme = this.colorTheme();
    const custom = this.customColors();

    if (theme === 'custom' && custom) {
      return `bg-gradient-to-b from-slate-900 ${custom.backgroundVia} to-slate-900`;
    }

    switch (theme) {
      case 'emerald':
        return 'bg-gradient-to-b from-slate-900 via-emerald-950/30 to-slate-900';
      case 'indigo':
      default:
        return 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900';
    }
  });

  readonly primaryGlowClasses = computed(() => {
    const theme = this.colorTheme();
    const custom = this.customColors();

    if (theme === 'custom' && custom) {
      return `top-1/4 left-1/4 ${custom.primary}`;
    }

    switch (theme) {
      case 'emerald':
        return 'top-1/4 right-1/4 bg-emerald-500/10';
      case 'indigo':
      default:
        return 'top-1/4 left-1/4 bg-indigo-500/10';
    }
  });

  readonly secondaryGlowClasses = computed(() => {
    const theme = this.colorTheme();
    const custom = this.customColors();

    if (theme === 'custom' && custom) {
      return `bottom-1/4 right-1/4 ${custom.secondary}`;
    }

    switch (theme) {
      case 'emerald':
        return 'bottom-1/4 left-1/4 bg-cyan-500/10';
      case 'indigo':
      default:
        return 'bottom-1/4 right-1/4 bg-purple-500/10';
    }
  });
}
