import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  HijackedScrollItemDirective,
  type SlideDirection,
} from './hijacked-scroll-item.directive';

@Component({
  standalone: true,
  imports: [HijackedScrollItemDirective],
  template: `
    <div
      hijackedScrollItem
      [slideDirection]="direction"
      [fadeIn]="fade"
      [scale]="doScale"
      data-testid="item"
    >
      Content
    </div>
  `,
})
class TestHostComponent {
  public direction: SlideDirection = 'left';
  public fade = true;
  public doScale = true;
}

describe('HijackedScrollItemDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should return the native HTML element', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(
      HijackedScrollItemDirective
    );

    const element = directive.getElement();
    expect(element instanceof HTMLElement).toBe(true);
    expect(element.getAttribute('data-testid')).toBe('item');
  });

  it('should calculate slide offset for left direction', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.direction = 'left';
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(
      HijackedScrollItemDirective
    );

    const offset = directive.getSlideOffset();
    expect(offset.x).toBe(-60);
    expect(offset.y).toBe(0);
  });

  it('should calculate slide offset for right direction', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.direction = 'right';
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(
      HijackedScrollItemDirective
    );

    const offset = directive.getSlideOffset();
    expect(offset.x).toBe(60);
    expect(offset.y).toBe(0);
  });

  it('should calculate slide offset for up direction', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.direction = 'up';
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(
      HijackedScrollItemDirective
    );

    const offset = directive.getSlideOffset();
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(-60);
  });

  it('should calculate slide offset for down direction', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.direction = 'down';
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(
      HijackedScrollItemDirective
    );

    const offset = directive.getSlideOffset();
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(60);
  });

  it('should return zero offset for none direction', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.direction = 'none';
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(
      HijackedScrollItemDirective
    );

    const offset = directive.getSlideOffset();
    expect(offset.x).toBe(0);
    expect(offset.y).toBe(0);
  });

  it('should generate config with correct values', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.direction = 'left';
    fixture.componentInstance.fade = true;
    fixture.componentInstance.doScale = false;
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(
      HijackedScrollItemDirective
    );

    const config = directive.getConfig();
    expect(config.slideDirection).toBe('left');
    expect(config.fadeIn).toBe(true);
    expect(config.scale).toBe(false);
  });

  it('should include custom from/to in config', () => {
    @Component({
      standalone: true,
      imports: [HijackedScrollItemDirective],
      template: `
        <div
          hijackedScrollItem
          [customFrom]="customFromProps"
          [customTo]="customToProps"
        >
          Content
        </div>
      `,
    })
    class CustomComponent {
      public customFromProps = { rotation: 0 };
      public customToProps = { rotation: 360 };
    }

    TestBed.configureTestingModule({
      imports: [CustomComponent],
    });

    const fixture = TestBed.createComponent(CustomComponent);
    fixture.detectChanges();

    const directiveElement = fixture.debugElement.children[0];
    const directive = directiveElement.injector.get(
      HijackedScrollItemDirective
    );

    const config = directive.getConfig();
    expect(config.customFrom).toEqual({ rotation: 0 });
    expect(config.customTo).toEqual({ rotation: 360 });
  });
});
