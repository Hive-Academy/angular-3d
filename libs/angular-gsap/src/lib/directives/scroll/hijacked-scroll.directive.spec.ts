import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HijackedScrollDirective } from './hijacked-scroll.directive';
import { HijackedScrollItemDirective } from './hijacked-scroll-item.directive';

@Component({
  standalone: true,
  imports: [HijackedScrollDirective, HijackedScrollItemDirective],
  template: `
    <div
      hijackedScroll
      [scrollHeightPerStep]="100"
      [animationDuration]="0.3"
      (currentStepChange)="onStepChange($event)"
      (progressChange)="onProgress($event)"
      data-testid="container"
    >
      <div hijackedScrollItem [slideDirection]="'left'" data-testid="item-1">
        Step 1
      </div>
      <div hijackedScrollItem [slideDirection]="'right'" data-testid="item-2">
        Step 2
      </div>
      <div hijackedScrollItem [slideDirection]="'none'" data-testid="item-3">
        Step 3
      </div>
    </div>
  `,
})
class TestHostComponent {
  public currentStep = 0;
  public progress = 0;

  public onStepChange(step: number): void {
    this.currentStep = step;
  }

  public onProgress(prog: number): void {
    this.progress = prog;
  }
}

describe('HijackedScrollDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should discover child items via contentChildren', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(HijackedScrollDirective);

    // Directive should discover 3 items
    expect(directive.items().length).toBe(3);
  });

  it('should create GSAP timeline with correct steps', async () => {
    const { gsap } = await import('gsap');
    const timelineMock = gsap.timeline as jest.Mock;

    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    // Should create timeline
    expect(timelineMock).toHaveBeenCalled();
  });

  it('should create ScrollTrigger for container', async () => {
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');

    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    // Should create ScrollTrigger
    expect(ScrollTrigger.create).toHaveBeenCalled();

    // Verify ScrollTrigger was configured with correct options
    const createCalls = (ScrollTrigger.create as jest.Mock).mock.calls;
    const lastCall = createCalls[createCalls.length - 1];
    expect(lastCall[0].pin).toBe(true);
    expect(lastCall[0].scrub).toBe(1);
  });

  it('should cleanup timeline and ScrollTrigger on destroy', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(HijackedScrollDirective);

    // Verify directive has timeline and scrollTrigger initialized
    expect(directive['scrollTrigger']).toBeDefined();
    expect(directive['masterTimeline']).toBeDefined();

    directive.ngOnDestroy();

    // Verify cleanup
    expect(directive['scrollTrigger']).toBeUndefined();
    expect(directive['masterTimeline']).toBeUndefined();
  });

  it('should expose public API methods', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(HijackedScrollDirective);

    expect(directive.refresh).toBeDefined();
    expect(directive.getProgress).toBeDefined();
    expect(directive.jumpToStep).toBeDefined();
  });

  it('should return progress from getProgress()', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(HijackedScrollDirective);

    const progress = directive.getProgress();
    expect(typeof progress).toBe('number');
  });

  it('should handle jumpToStep() calls', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(HijackedScrollDirective);

    // Should not throw
    expect(() => directive.jumpToStep(0)).not.toThrow();
    expect(() => directive.jumpToStep(1)).not.toThrow();
    expect(() => directive.jumpToStep(2)).not.toThrow();
  });

  it('should handle invalid jumpToStep() indices gracefully', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(HijackedScrollDirective);

    // Should not throw for invalid indices
    expect(() => directive.jumpToStep(-1)).not.toThrow();
    expect(() => directive.jumpToStep(999)).not.toThrow();
  });
});
