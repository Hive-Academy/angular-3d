// Visual effects components - metaballs, marble, backgrounds, glass, volumetric fog

// Compositional metaball system
export * from './metaball';

// Note: Old MetaballComponent (metaball.component.ts) is deprecated
// Use MetaballSceneComponent + MetaballSphereComponent + MetaballCursorComponent instead

export * from './marble-sphere.component';
export * from './background-cubes.component';
export * from './fire-sphere.component';
export * from './thruster-flame.component';
export * from './ground-fog.component';

// Warp speed lines effect - visual effect for camera flight navigation
// TODO: Export will be added in Batch 3 after WarpLinesComponent implementation
// export * from './warp-lines';
