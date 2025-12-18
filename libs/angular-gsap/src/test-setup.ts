import 'jest-preset-angular/setup-jest';

// Mock GSAP for animation tests (handles default import: `import gsap from 'gsap'`)
jest.mock('gsap', () => {
  const mockTimeline = {
    to: jest.fn().mockReturnThis(),
    fromTo: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    kill: jest.fn(),
    pause: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    progress: jest.fn(() => 0),
    isActive: jest.fn(() => false),
  };

  const gsapMock = {
    to: jest.fn(() => mockTimeline),
    fromTo: jest.fn(() => mockTimeline),
    timeline: jest.fn(() => mockTimeline),
    registerPlugin: jest.fn(),
    defaults: jest.fn(),
    killTweensOf: jest.fn(),
  };

  return {
    default: gsapMock,
    ...gsapMock,
    ScrollTrigger: {
      create: jest.fn(() => ({
        kill: jest.fn(),
        refresh: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        progress: 0,
      })),
      refresh: jest.fn(),
    },
  };
});
