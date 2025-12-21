import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { HomeComponent } from './home.component';
import { Component, ChangeDetectionStrategy } from '@angular/core';

// Mock the child components that import 3D library
jest.mock('./sections/hero-3d-teaser.component', () => ({
  Hero3dTeaserComponent: class MockHero3dTeaserComponent {},
}));
jest.mock('./sections/angular-3d-section.component', () => ({
  Angular3dSectionComponent: class MockAngular3dSectionComponent {},
}));
jest.mock('./sections/angular-gsap-section.component', () => ({
  AngularGsapSectionComponent: class MockAngularGsapSectionComponent {},
}));
jest.mock('./sections/cta-section.component', () => ({
  CtaSectionComponent: class MockCtaSectionComponent {},
}));

@Component({
  selector: 'app-hero-3d-teaser',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockHero3dTeaserComponent {}

@Component({
  selector: 'app-angular-3d-section',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockAngular3dSectionComponent {}

@Component({
  selector: 'app-angular-gsap-section',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockAngularGsapSectionComponent {}

@Component({
  selector: 'app-cta-section',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockCtaSectionComponent {}

describe('HomeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    })
      .overrideComponent(HomeComponent, {
        set: {
          imports: [
            RouterLink,
            MockHero3dTeaserComponent,
            MockAngular3dSectionComponent,
            MockAngularGsapSectionComponent,
            MockCtaSectionComponent,
          ],
        },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render the main headline', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Stunning');
  });

  it('should have links to showcases', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('routerLink')).toBe('/angular-3d');
    expect(links[1].getAttribute('routerLink')).toBe('/angular-gsap');
  });

  it('should render all child sections', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-hero-3d-teaser')).toBeTruthy();
    expect(compiled.querySelector('app-angular-3d-section')).toBeTruthy();
    expect(compiled.querySelector('app-angular-gsap-section')).toBeTruthy();
    expect(compiled.querySelector('app-cta-section')).toBeTruthy();
  });
});
