import 'jest-preset-angular/setup-jest';

// Mock GSAP for animation tests
// The directives use: import { gsap } from 'gsap'
// And import { ScrollTrigger } from 'gsap/ScrollTrigger'
// So we need to support both named exports

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
  set: jest.fn(),
};

const scrollTriggerMock = {
  create: jest.fn(() => ({
    kill: jest.fn(),
    refresh: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    scroll: jest.fn(),
    progress: 0,
  })),
  refresh: jest.fn(),
};

// Mock the main gsap module with named export
jest.mock('gsap', () => ({
  gsap: gsapMock,
  default: gsapMock,
}));

// Mock the ScrollTrigger plugin with named export
jest.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: scrollTriggerMock,
}));
