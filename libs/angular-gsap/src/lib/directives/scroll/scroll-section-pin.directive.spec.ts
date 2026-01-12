import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ScrollSectionPinDirective } from './scroll-section-pin.directive';
import { GsapCoreService } from '../../services/gsap-core.service';

// Mock GsapCoreService
const mockGsapCoreService = {
  getScrollTrigger: jest.fn().mockResolvedValue({
    ScrollTrigger: {
      create: jest.fn().mockReturnValue({
        kill: jest.fn(),
        refresh: jest.fn(),
      }),
    },
  }),
};

// Test host component
@Component({
  standalone: true,
  imports: [ScrollSectionPinDirective],
  template: `
    <section
      scrollSectionPin
      [pinDuration]="pinDuration()"
      [start]="start()"
      (pinProgress)="onProgress($event)"
      (pinned)="onPinnedChange($event)"
    >
      <div class="content">Test Content</div>
    </section>
  `,
})
class TestHostComponent {
  readonly pinDuration = signal('300px');
  readonly start = signal('top top');

  public progressValue = 0;
  public isPinned = false;

  public onProgress(progress: number): void {
    this.progressValue = progress;
  }

  public onPinnedChange(pinned: boolean): void {
    this.isPinned = pinned;
  }
}

describe('ScrollSectionPinDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, ScrollSectionPinDirective],
      providers: [{ provide: GsapCoreService, useValue: mockGsapCoreService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply scrollSectionPin directive', () => {
    const section = fixture.nativeElement.querySelector('section');
    expect(section).toBeTruthy();
  });

  it('should have default pinDuration of 300px', () => {
    expect(component.pinDuration()).toBe('300px');
  });

  it('should have default start of "top top"', () => {
    expect(component.start()).toBe('top top');
  });

  it('should call GsapCoreService.getScrollTrigger', async () => {
    // Wait for afterNextRender
    await fixture.whenStable();
    expect(mockGsapCoreService.getScrollTrigger).toHaveBeenCalled();
  });

  describe('input configuration', () => {
    it('should accept custom pinDuration', () => {
      component.pinDuration.set('500px');
      fixture.detectChanges();
      expect(component.pinDuration()).toBe('500px');
    });

    it('should accept custom start position', () => {
      component.start.set('top center');
      fixture.detectChanges();
      expect(component.start()).toBe('top center');
    });
  });
});
