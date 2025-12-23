import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { StepIndicatorComponent } from './step-indicator.component';

// Test host component
@Component({
  standalone: true,
  imports: [StepIndicatorComponent],
  template: `
    <agsp-step-indicator
      [stepCount]="stepCount()"
      [currentStep]="currentStep()"
      [visible]="visible()"
      [position]="position()"
      (stepClick)="onStepClick($event)"
    />
  `,
})
class TestHostComponent {
  readonly stepCount = signal(5);
  readonly currentStep = signal(0);
  readonly visible = signal(true);
  readonly position = signal<'left' | 'right'>('left');

  public clickedStep: number | null = null;

  public onStepClick(step: number): void {
    this.clickedStep = step;
  }
}

describe('StepIndicatorComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, StepIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render correct number of step buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(5);
  });

  it('should update button count when stepCount changes', () => {
    component.stepCount.set(3);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(3);
  });

  it('should emit stepClick when button is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[2].click();
    expect(component.clickedStep).toBe(2);
  });

  it('should apply left positioning by default', () => {
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.classList.contains('left-4')).toBe(true);
  });

  it('should apply right positioning when set', () => {
    component.position.set('right');
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.classList.contains('right-4')).toBe(true);
  });

  it('should show opacity-0 when not visible', () => {
    component.visible.set(false);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav.classList.contains('opacity-0')).toBe(true);
  });

  it('should display step numbers with leading zeros', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].textContent).toContain('01');
    expect(buttons[4].textContent).toContain('05');
  });

  it('should have aria-label for accessibility', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].getAttribute('aria-label')).toBe('Go to step 1');
    expect(buttons[2].getAttribute('aria-label')).toBe('Go to step 3');
  });

  it('should mark current step with aria-current', () => {
    component.currentStep.set(2);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[2].getAttribute('aria-current')).toBe('step');
    expect(buttons[0].getAttribute('aria-current')).toBeNull();
  });
});
