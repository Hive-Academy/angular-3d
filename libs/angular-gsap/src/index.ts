// Directives - Scroll related (from organized folder)
export {
  ScrollAnimationDirective,
  type ScrollAnimationConfig,
  type AnimationType,
} from './lib/directives/scroll/scroll-animation.directive';
export {
  HijackedScrollDirective,
  type HijackedScrollConfig,
} from './lib/directives/scroll/hijacked-scroll.directive';
export {
  HijackedScrollItemDirective,
  type HijackedScrollItemConfig,
  type SlideDirection,
} from './lib/directives/scroll/hijacked-scroll-item.directive';
export { ScrollSectionPinDirective } from './lib/directives/scroll/scroll-section-pin.directive';

// Directives - Other
export {
  ViewportAnimationDirective,
  type ViewportAnimationConfig,
  type ViewportAnimationType,
} from './lib/directives/viewport-animation.directive';
export { SectionStickyDirective } from './lib/directives/section-sticky.directive';
export {
  ParallaxSplitItemDirective,
  type ParallaxSplitItemConfig,
  type SplitLayout,
} from './lib/directives/parallax-split-item.directive';
export {
  LenisSmoothScrollDirective,
  type LenisSmoothScrollConfig,
} from './lib/directives/lenis-smooth-scroll.directive';

// Providers (Modern Angular pattern)
export {
  provideGsap,
  GSAP_CONFIG,
  type GsapConfig,
} from './lib/providers/gsap.provider';
export { provideLenis, LENIS_CONFIG } from './lib/providers/lenis.provider';

// Services
export { GsapCoreService } from './lib/services/gsap-core.service';
export {
  LenisSmoothScrollService,
  type LenisServiceOptions,
  type LenisScrollEvent,
} from './lib/services/lenis-smooth-scroll.service';

// Components - Scroll Timeline
export {
  HijackedScrollTimelineComponent,
  ScrollTimelineComponent,
  StepIndicatorComponent,
  type StepData,
} from './lib/components/scroll-timeline';

// Components - Feature Showcase
export {
  FeatureShowcaseTimelineComponent,
  FeatureStepComponent,
  FeatureBadgeDirective,
  FeatureTitleDirective,
  FeatureDescriptionDirective,
  FeatureNotesDirective,
  FeatureVisualDirective,
  FeatureDecorationDirective,
} from './lib/components/feature-showcase';

// Components - Split Panel
export {
  SplitPanelSectionComponent,
  SplitPanelImageDirective,
  SplitPanelBadgeDirective,
  SplitPanelTitleDirective,
  SplitPanelDescriptionDirective,
  SplitPanelFeaturesDirective,
} from './lib/components/split-panel';

// Components - Other
export { ParallaxSplitScrollComponent } from './lib/components/parallax-split-scroll.component';
