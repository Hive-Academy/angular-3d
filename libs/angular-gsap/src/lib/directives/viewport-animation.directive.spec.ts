import { Component, viewChild } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  ViewportAnimationDirective,
  type ViewportAnimationConfig,
} from './viewport-animation.directive';
import { GsapCoreService } from '../services/gsap-core.service';

// Mock GSAP
const mockTween = {
  kill: jest.fn(),
  reverse: jest.fn(),
};

const mockGsap = {
  set: jest.fn(),
  to: jest.fn().mockReturnValue(mockTween),
  fromTo: jest.fn().mockReturnValue(mockTween),
};

const mockGsapCoreService = {
  gsap: mockGsap,
  scrollTrigger: null,
  isBrowser: true,
  isInitialized: () => true,
};

// Mock IntersectionObserver
class MockIntersectionObserver {
  public callback: IntersectionObserverCallback;
  public options: IntersectionObserverInit;

  public static instances: MockIntersectionObserver[] = [];

  constructor(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ) {
    this.callback = callback;
    this.options = options;
    MockIntersectionObserver.instances.push(this);
  }

  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();

  // Helper to simulate intersection
  public simulateIntersection(isIntersecting: boolean): void {
    const entry: Partial<IntersectionObserverEntry> = {
      isIntersecting,
      intersectionRatio: isIntersecting ? 1 : 0,
    };
    this.callback(
      [entry as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

@Component({
  selector: 'agsp-test-host',
  imports: [ViewportAnimationDirective],
  template: `
    <div viewportAnimation [viewportConfig]="config">Test Content</div>
  `,
})
class TestHostComponent {
  directive = viewChild(ViewportAnimationDirective);
  config: ViewportAnimationConfig = {
    animation: 'fadeIn',
    duration: 0.6,
    threshold: 0.1,
    once: true,
  };
}

@Component({
  selector: 'agsp-test-stagger-host',
  imports: [ViewportAnimationDirective],
  template: `
    <ul
      viewportAnimation
      [viewportConfig]="{
        animation: 'slideUp',
        stagger: 0.1,
        staggerTarget: 'li'
      }"
    >
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
  `,
})
class TestStaggerHostComponent {
  directive = viewChild(ViewportAnimationDirective);
}

describe('ViewportAnimationDirective', () => {
  let originalIntersectionObserver: typeof IntersectionObserver;

  beforeAll(() => {
    originalIntersectionObserver = window.IntersectionObserver;
    (
      window as unknown as {
        IntersectionObserver: typeof MockIntersectionObserver;
      }
    ).IntersectionObserver = MockIntersectionObserver;
  });

  afterAll(() => {
    window.IntersectionObserver = originalIntersectionObserver;
  });

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    jest.clearAllMocks();
  });

  describe('Basic functionality', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [
          { provide: GsapCoreService, useValue: mockGsapCoreService },
        ],
      }).compileComponents();
    });

    it('should create the directive', () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();

      const directive = fixture.componentInstance.directive();
      expect(directive).toBeTruthy();
    });

    it('should create IntersectionObserver after render', fakeAsync(() => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      tick();

      expect(MockIntersectionObserver.instances.length).toBe(1);
      expect(MockIntersectionObserver.instances[0].observe).toHaveBeenCalled();
    }));

    it('should set initial hidden state', fakeAsync(() => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      tick();

      expect(mockGsap.set).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ opacity: 0 })
      );
    }));

    it('should trigger animation when element enters viewport', fakeAsync(() => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      tick();

      // Simulate entering viewport
      MockIntersectionObserver.instances[0].simulateIntersection(true);

      expect(mockGsap.to).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          opacity: 1,
          duration: 0.6,
        })
      );
    }));

    it('should emit viewportEnter when element enters', fakeAsync(() => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      tick();

      const directive = fixture.componentInstance.directive()!;
      const enterSpy = jest.fn();
      directive.viewportEnter.subscribe(enterSpy);

      MockIntersectionObserver.instances[0].simulateIntersection(true);

      expect(enterSpy).toHaveBeenCalled();
    }));

    it('should disconnect observer on destroy', fakeAsync(() => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      tick();

      const observer = MockIntersectionObserver.instances[0];
      fixture.destroy();

      expect(observer.disconnect).toHaveBeenCalled();
    }));
  });

  describe('Animation presets', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [
          { provide: GsapCoreService, useValue: mockGsapCoreService },
        ],
      }).compileComponents();
    });

    it('should apply slideUp animation', fakeAsync(() => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.config = {
        animation: 'slideUp',
        duration: 0.8,
        threshold: 0.1,
        once: true,
      } as ViewportAnimationConfig;
      fixture.detectChanges();
      tick();

      // Check initial state includes y offset
      expect(mockGsap.set).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ y: 50, opacity: 0 })
      );
    }));

    it('should apply scaleIn animation', fakeAsync(() => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.componentInstance.config = {
        animation: 'scaleIn',
        duration: 0.6,
        threshold: 0.1,
        once: true,
      } as ViewportAnimationConfig;
      fixture.detectChanges();
      tick();

      expect(mockGsap.set).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ scale: 0.9, opacity: 0 })
      );
    }));
  });

  describe('Staggered animations', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestStaggerHostComponent],
        providers: [
          { provide: GsapCoreService, useValue: mockGsapCoreService },
        ],
      }).compileComponents();
    });

    it('should animate children with stagger', fakeAsync(() => {
      const fixture = TestBed.createComponent(TestStaggerHostComponent);
      fixture.detectChanges();
      tick();

      // Simulate entering viewport
      MockIntersectionObserver.instances[0].simulateIntersection(true);

      expect(mockGsap.to).toHaveBeenCalledWith(
        expect.anything(), // NodeList
        expect.objectContaining({
          stagger: 0.1,
        })
      );
    }));
  });

  describe('Public API', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [
          { provide: GsapCoreService, useValue: mockGsapCoreService },
        ],
      }).compileComponents();
    });

    it('should allow replaying animation', fakeAsync(() => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      tick();

      const directive = fixture.componentInstance.directive()!;

      // First play
      MockIntersectionObserver.instances[0].simulateIntersection(true);
      mockGsap.to.mockClear();

      // Replay
      directive.replay();

      expect(mockGsap.to).toHaveBeenCalled();
    }));

    it('should allow resetting animation', fakeAsync(() => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      tick();

      const directive = fixture.componentInstance.directive()!;

      // Play first
      MockIntersectionObserver.instances[0].simulateIntersection(true);
      mockGsap.set.mockClear();

      // Reset
      directive.reset();

      expect(mockGsap.set).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({ opacity: 0 })
      );
      expect(mockTween.kill).toHaveBeenCalled();
    }));
  });
});
