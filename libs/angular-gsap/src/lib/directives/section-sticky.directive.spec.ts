import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SectionStickyDirective } from './section-sticky.directive';

@Component({
  template: `
    <section sectionSticky [stickyThreshold]="0.1" data-testid="section">
      <nav class="section-sticky-target" data-testid="target">
        Navigation Content
      </nav>
      <div class="content">Main Content</div>
    </section>
  `,
  imports: [SectionStickyDirective],
})
class TestComponent {}

describe('SectionStickyDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let sectionElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();

    sectionElement = fixture.debugElement.query(
      By.css('[data-testid="section"]')
    );
  });

  it('should create directive instance', () => {
    expect(sectionElement).toBeTruthy();
  });

  it('should have initial data-section-in-view attribute', (done) => {
    setTimeout(() => {
      const section = sectionElement.nativeElement as HTMLElement;
      const attr = section.getAttribute('data-section-in-view');
      expect(attr).toBeTruthy();
      done();
    }, 100);
  });

  it('should apply section-in-view class when intersecting', (done) => {
    setTimeout(() => {
      const section = sectionElement.nativeElement as HTMLElement;
      const hasClass =
        section.classList.contains('section-in-view') ||
        section.getAttribute('data-section-in-view') === 'true';
      expect(hasClass).toBeTruthy();
      done();
    }, 100);
  });

  it('should have configured threshold', () => {
    const directiveInstance = sectionElement.injector.get(
      SectionStickyDirective
    );
    expect(directiveInstance.stickyThreshold()).toBe(0.1);
  });

  it('should cleanup observer on destroy', () => {
    const directiveInstance = sectionElement.injector.get(
      SectionStickyDirective
    );
    const disconnectSpy = jest.fn();

    // Mock observer
    (
      directiveInstance as unknown as { observer: { disconnect: jest.Mock } }
    ).observer = {
      disconnect: disconnectSpy,
    };

    fixture.destroy();
    expect(disconnectSpy).toHaveBeenCalled();
  });
});

describe('SectionStickyDirective - SSR Safety', () => {
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
  });

  it('should handle missing IntersectionObserver gracefully', () => {
    const originalIO = window.IntersectionObserver;

    // Remove IntersectionObserver
    (
      window as unknown as { IntersectionObserver: undefined }
    ).IntersectionObserver = undefined;

    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();

    // Restore
    window.IntersectionObserver = originalIO;
  });

  it('should debounce intersection events', (done) => {
    fixture.detectChanges();

    const sectionElement = fixture.debugElement.query(
      By.css('[data-testid="section"]')
    );
    const directiveInstance = sectionElement.injector.get(
      SectionStickyDirective
    );

    let updateCount = 0;
    const originalUpdate = (
      directiveInstance as unknown as {
        updateStickyState: (v: boolean) => void;
      }
    ).updateStickyState.bind(directiveInstance);

    (
      directiveInstance as unknown as {
        updateStickyState: (v: boolean) => void;
      }
    ).updateStickyState = (...args: [boolean]) => {
      updateCount++;
      originalUpdate(...args);
    };

    // Simulate multiple rapid intersection updates
    const debouncedUpdate = (
      directiveInstance as unknown as { debouncedUpdate: (v: boolean) => void }
    ).debouncedUpdate.bind(directiveInstance);
    debouncedUpdate(true);
    debouncedUpdate(false);
    debouncedUpdate(true);

    // Should debounce to single update
    setTimeout(() => {
      expect(updateCount).toBeLessThanOrEqual(1);
      done();
    }, 100);
  });
});
