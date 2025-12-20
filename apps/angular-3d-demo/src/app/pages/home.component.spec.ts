import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { HomeComponent } from './home.component';
import { Component, ChangeDetectionStrategy } from '@angular/core';

// Mock the child components that import 3D library
jest.mock('../sections/hero-3d-teaser.component', () => ({
  Hero3dTeaserComponent: class MockHero3dTeaserComponent {},
}));
jest.mock('../sections/hero-gsap-teaser.component', () => ({
  HeroGsapTeaserComponent: class MockHeroGsapTeaserComponent {},
}));
jest.mock('../sections/library-overview.component', () => ({
  LibraryOverviewComponent: class MockLibraryOverviewComponent {},
}));
jest.mock('../sections/cta-section.component', () => ({
  CtaSectionComponent: class MockCtaSectionComponent {},
}));

@Component({
  selector: 'app-hero-3d-teaser',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockHero3dTeaserComponent {}

@Component({
  selector: 'app-hero-gsap-teaser',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockHeroGsapTeaserComponent {}

@Component({
  selector: 'app-library-overview',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockLibraryOverviewComponent {}

@Component({
  selector: 'app-cta-section',
  standalone: true,
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
            MockHeroGsapTeaserComponent,
            MockLibraryOverviewComponent,
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
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Two Libraries, One Ecosystem'
    );
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
    expect(compiled.querySelector('app-hero-gsap-teaser')).toBeTruthy();
    expect(compiled.querySelector('app-library-overview')).toBeTruthy();
    expect(compiled.querySelector('app-cta-section')).toBeTruthy();
  });
});
