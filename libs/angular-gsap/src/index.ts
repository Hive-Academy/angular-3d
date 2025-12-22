// Directives
export {
  ScrollAnimationDirective,
  type ScrollAnimationConfig,
  type AnimationType,
} from './lib/directives/scroll-animation.directive';
export {
  HijackedScrollDirective,
  type HijackedScrollConfig,
} from './lib/directives/hijacked-scroll.directive';
export {
  HijackedScrollItemDirective,
  type HijackedScrollItemConfig,
  type SlideDirection,
} from './lib/directives/hijacked-scroll-item.directive';
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

// Services
export {
  LenisSmoothScrollService,
  type LenisServiceOptions,
  type LenisScrollEvent,
} from './lib/services/lenis-smooth-scroll.service';

// Components
export { HijackedScrollTimelineComponent } from './lib/components/hijacked-scroll-timeline.component';
export { ParallaxSplitScrollComponent } from './lib/components/parallax-split-scroll.component';
