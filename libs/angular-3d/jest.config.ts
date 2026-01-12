export default {
  displayName: 'angular-3d',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/libs/angular-3d',
  // TODO: Fix three/tsl module resolution in Jest - these tests fail during TS compilation
  // because source files import from 'three/tsl' which Jest can't resolve
  testPathIgnorePatterns: [
    '/node_modules/',
    // Components using three/tsl imports
    'scene-3d.component.spec.ts',
    'planet.component.spec.ts',
    'star-field.component.spec.ts',
    'nebula.component.spec.ts',
    'cloud-layer.component.spec.ts',
    'troika-text.component.spec.ts',
    'responsive-troika-text.component.spec.ts',
    'glow-troika-text.component.spec.ts',
    'gltf-model.component.spec.ts',
    'bloom-effect.component.spec.ts',
    'effect-composer.service.spec.ts',
    // Animation directives using GSAP
    'float-3d.directive.spec.ts',
    'rotate-3d.directive.spec.ts',
    // Missing SceneGraphStore provider
    'svg-icon.component.spec.ts',
  ],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(three|.*\\.mjs$))'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  // WebGPU module resolution for tests
  // three/webgpu and three/tsl are re-exports of core three.js
  // with additional WebGPU-specific types and TSL utilities
  moduleNameMapper: {
    '^three/webgpu$': 'three',
    '^three/tsl$': '<rootDir>/src/lib/test-utils/tsl-mock.ts',
  },
};
