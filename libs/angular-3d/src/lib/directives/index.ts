// @hive-academy/angular-3d - Directives module
// Float3d, Rotate3d animation directives for Three.js objects

export * from './float-3d.directive';
export * from './rotate-3d.directive';

// Core directives (mesh, group, transform)
export * from './mesh.directive';
export * from './group.directive';
export * from './transform.directive';

// Geometry directives
export * from './geometries/box-geometry.directive';
export * from './geometries/cylinder-geometry.directive';
export * from './geometries/torus-geometry.directive';
export * from './geometries/sphere-geometry.directive';
export * from './geometries/polyhedron-geometry.directive';

// Material directives
export * from './materials/standard-material.directive';
export * from './materials/physical-material.directive';
export * from './materials/lambert-material.directive';
export * from './materials/shader-material.directive';
export * from './materials/node-material.directive';

// Light directives
export * from './light.directive';
export * from './lights/ambient-light.directive';
export * from './lights/point-light.directive';
export * from './lights/directional-light.directive';
export * from './lights/spot-light.directive';

// Effect directives
export * from './glow-3d.directive';

// Animation directives
export * from './space-flight-3d.directive';

// Performance directives
export * from './performance-3d.directive';
export * from './scroll-zoom-coordinator.directive';
export * from './mouse-tracking-3d.directive';
