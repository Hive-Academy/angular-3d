import { TestBed } from '@angular/core/testing';
import { Angular3dShowcaseComponent } from './angular-3d-showcase.component';
import { Component, ChangeDetectionStrategy } from '@angular/core';

// Mock the child components that import 3D library
jest.mock('../scenes/hero-space-scene.component', () => ({
  HeroSpaceSceneComponent: class MockHeroSpaceSceneComponent {},
}));
jest.mock('../sections/primitives-showcase.component', () => ({
  PrimitivesShowcaseComponent: class MockPrimitivesShowcaseComponent {},
}));
jest.mock('../scenes/value-props-3d-scene.component', () => ({
  ValueProps3dSceneComponent: class MockValueProps3dSceneComponent {},
}));

@Component({
  selector: 'app-hero-space-scene',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockHeroSpaceSceneComponent {}

@Component({
  selector: 'app-primitives-showcase',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockPrimitivesShowcaseComponent {}

@Component({
  selector: 'app-value-props-3d-scene',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockValueProps3dSceneComponent {}

describe('Angular3dShowcaseComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Angular3dShowcaseComponent],
    })
      .overrideComponent(Angular3dShowcaseComponent, {
        set: {
          imports: [
            MockHeroSpaceSceneComponent,
            MockPrimitivesShowcaseComponent,
            MockValueProps3dSceneComponent,
          ],
        },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Angular3dShowcaseComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render all library sections', () => {
    const fixture = TestBed.createComponent(Angular3dShowcaseComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-hero-space-scene')).toBeTruthy();
    expect(compiled.querySelector('app-primitives-showcase')).toBeTruthy();
    expect(compiled.querySelector('app-value-props-3d-scene')).toBeTruthy();
  });
});
