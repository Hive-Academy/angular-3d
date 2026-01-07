// Animation directives - float, rotate, space-flight, cinematic entrance, scene reveal
export * from './float-3d.directive';
export * from './rotate-3d.directive';
export * from './space-flight-3d.directive';
export {
  CinematicEntranceDirective,
  type CinematicEntranceConfig,
  type EntrancePreset,
} from './cinematic-entrance.directive';
export {
  SceneRevealDirective,
  type SceneRevealConfig,
  type RevealAnimation,
} from './scene-reveal.directive';

// Animation coordination services
export {
  StaggerGroupService,
  type RevealableDirective,
} from './stagger-group.service';
