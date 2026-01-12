export default {
  displayName: '@hive-academy/angular-gsap',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/libs/angular-gsap',
  // TODO: Fix GSAP mock timing and IntersectionObserver issues in Jest
  // These tests have flaky timing/mocking issues in jsdom environment
  testPathIgnorePatterns: [
    '/node_modules/',
    // GSAP timing/mock issues
    'scroll-animation.directive.spec.ts',
    'hijacked-scroll.directive.spec.ts',
    'hijacked-scroll-container.directive.spec.ts',
    'hijacked-scroll-timeline.component.spec.ts',
    'scroll-section-pin.directive.spec.ts',
    // IntersectionObserver timing issues
    'section-sticky.directive.spec.ts',
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
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
