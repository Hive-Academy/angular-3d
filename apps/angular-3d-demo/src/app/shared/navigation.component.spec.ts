import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavigationComponent } from './navigation.component';

describe('NavigationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NavigationComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render logo image', () => {
    const fixture = TestBed.createComponent(NavigationComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const logoImg = compiled.querySelector('img[alt="logo"]');
    expect(logoImg).toBeTruthy();
  });

  it('should have navigation links', () => {
    const fixture = TestBed.createComponent(NavigationComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(4); // Logo + 3 Nav Links + GitHub

    const linkTexts = Array.from(links).map((l) => l.textContent?.trim());
    expect(linkTexts).toContain('Home');
    expect(linkTexts).toContain('Angular 3D');
    expect(linkTexts).toContain('Angular GSAP');
    expect(linkTexts).toContain('GitHub');
  });
});
