export default {
  displayName: 'angular-3d',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/libs/angular-3d',
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
