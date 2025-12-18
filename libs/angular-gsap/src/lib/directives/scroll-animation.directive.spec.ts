import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ScrollAnimationDirective,
  type ScrollAnimationConfig,
} from './scroll-animation.directive';

@Component({
  standalone: true,
  imports: [ScrollAnimationDirective],
  template: `<div
    scrollAnimation
    [scrollConfig]="config"
    data-testid="animated-element"
  ></div>`,
})
class TestHostComponent {
  public config: ScrollAnimationConfig = { animation: 'fadeIn' };
}

describe('ScrollAnimationDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize GSAP animation with default config', () => {
    const gsap = require('gsap');
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    expect(gsap.timeline).toHaveBeenCalled();
  });

  it('should create ScrollTrigger instance', () => {
    const { ScrollTrigger } = require('gsap');
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    expect(ScrollTrigger.create).toHaveBeenCalled();
  });

  it('should respond to config changes', () => {
    const gsap = require('gsap');
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const callCount = (gsap.timeline as jest.Mock).mock.calls.length;

    // Change config
    fixture.componentInstance.config = { animation: 'slideUp' };
    fixture.detectChanges();

    // Should create new timeline (cleanup + reinit)
    expect(gsap.timeline).toHaveBeenCalledTimes(callCount + 1);
  });

  it('should cleanup on destroy', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directive = fixture.debugElement.children[0].injector.get(
      ScrollAnimationDirective
    );

    // Verify directive has animations initialized
    expect(directive['scrollTrigger']).toBeDefined();
    expect(directive['animation']).toBeDefined();

    directive.ngOnDestroy();

    // Verify cleanup was called
    expect(directive['scrollTrigger']).toBeUndefined();
    expect(directive['animation']).toBeUndefined();
  });

  it('should expose public API methods', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directive = fixture.debugElement.children[0].injector.get(
      ScrollAnimationDirective
    );

    expect(directive.refresh).toBeDefined();
    expect(directive.getProgress).toBeDefined();
    expect(directive.setEnabled).toBeDefined();
  });

  it('should return progress from getProgress()', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directive = fixture.debugElement.children[0].injector.get(
      ScrollAnimationDirective
    );

    const progress = directive.getProgress();
    expect(typeof progress).toBe('number');
  });

  it('should handle different animation types', () => {
    const fixture = TestBed.createComponent(TestHostComponent);

    const animationTypes: ScrollAnimationConfig['animation'][] = [
      'fadeIn',
      'fadeOut',
      'slideUp',
      'slideDown',
      'slideLeft',
      'slideRight',
      'scaleIn',
      'scaleOut',
      'parallax',
    ];

    animationTypes.forEach((animation) => {
      fixture.componentInstance.config = { animation };
      fixture.detectChanges();
      expect(fixture.nativeElement).toBeTruthy();
    });
  });
});
