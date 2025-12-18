import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HijackedScrollTimelineComponent } from './hijacked-scroll-timeline.component';
import { HijackedScrollItemDirective } from '../directives/hijacked-scroll-item.directive';
import { HijackedScrollDirective } from '../directives/hijacked-scroll.directive';

@Component({
  standalone: true,
  imports: [HijackedScrollTimelineComponent, HijackedScrollItemDirective],
  template: `
    <agsp-hijacked-scroll-timeline
      [scrollHeightPerStep]="100"
      [animationDuration]="0.5"
      [ease]="'power3.out'"
      [markers]="false"
      (currentStepChange)="onStepChange($event)"
      (progressChange)="onProgress($event)"
    >
      <div hijackedScrollItem [slideDirection]="'left'">Step 1</div>
      <div hijackedScrollItem [slideDirection]="'right'">Step 2</div>
    </agsp-hijacked-scroll-timeline>
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

describe('HijackedScrollTimelineComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should use host directive for HijackedScrollDirective', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const timelineElement = fixture.debugElement.children[0];

    // Should have HijackedScrollDirective as host directive
    const directive = timelineElement.injector.get(
      HijackedScrollDirective,
      null
    );
    expect(directive).toBeTruthy();
  });

  it('should project child hijackedScrollItem elements', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const timelineElement = fixture.debugElement.children[0];
    const directive = timelineElement.injector.get(HijackedScrollDirective);

    // Should discover projected items
    expect(directive.items().length).toBe(2);
  });

  it('should pass through inputs to host directive', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const timelineElement = fixture.debugElement.children[0];
    const directive = timelineElement.injector.get(HijackedScrollDirective);

    // Check that inputs were passed through
    expect(directive.scrollHeightPerStep()).toBe(100);
    expect(directive.animationDuration()).toBe(0.5);
    expect(directive.ease()).toBe('power3.out');
    expect(directive.markers()).toBe(false);
  });

  it('should support content projection', () => {
    @Component({
      standalone: true,
      imports: [HijackedScrollTimelineComponent, HijackedScrollItemDirective],
      template: `
        <agsp-hijacked-scroll-timeline>
          <div hijackedScrollItem>
            <h2>Custom Title</h2>
            <p>Custom content with <strong>HTML</strong></p>
          </div>
        </agsp-hijacked-scroll-timeline>
      `,
    })
    class CustomContentComponent {}

    TestBed.configureTestingModule({
      imports: [CustomContentComponent],
    });

    const fixture = TestBed.createComponent(CustomContentComponent);
    fixture.detectChanges();

    const timelineElement = fixture.debugElement.children[0];

    // Verify content is projected
    const content = timelineElement.nativeElement.textContent;
    expect(content).toContain('Custom Title');
    expect(content).toContain('Custom content with HTML');
  });

  it('should emit events from host directive', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const timelineElement = fixture.debugElement.children[0];
    const directive = timelineElement.injector.get(HijackedScrollDirective);

    // Manually trigger events from directive
    directive.currentStepChange.emit(1);
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify event was emitted through component
    expect(component.currentStep).toBe(1);

    directive.progressChange.emit(0.5);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.progress).toBe(0.5);
  });
});
