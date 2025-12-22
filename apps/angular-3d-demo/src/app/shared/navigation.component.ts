import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { distinctUntilChanged, fromEvent, map } from 'rxjs';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage],
  template: `
    <nav
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      [class.nav-transparent]="!isSticky()"
      [class.nav-solid]="isSticky()"
      [class.nav-compact]="isSticky()"
      [class.nav-hidden]="isHidden()"
    >
      <div
        class="nav-inner max-w-container mx-auto px-4 flex items-center justify-between transition-all duration-300"
        [class.py-4]="!isSticky()"
        [class.py-1]="isSticky()"
      >
        <!-- Logo with smooth scale transition -->
        <a
          routerLink="/"
          class="logo-wrapper text-headline-md font-bold text-neon-green hover:animate-glow transition-all duration-300"
          [class.logo-compact]="isSticky()"
        >
          <img
            ngSrc="/logo.png"
            alt="logo"
            width="160"
            height="56"
            priority
            class="transition-all duration-300"
          />
        </a>

        <!-- Nav Links with compact sizing -->
        <div
          class="hidden md:flex items-center transition-all duration-300"
          [class.gap-8]="!isSticky()"
          [class.gap-6]="isSticky()"
        >
          <a
            routerLink="/"
            routerLinkActive="!text-neon-green"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-link font-medium text-white/90 hover:text-neon-green transition-all duration-300"
            [class.text-base]="!isSticky()"
            [class.text-sm]="isSticky()"
          >
            Home
          </a>
          <a
            routerLink="/angular-3d"
            routerLinkActive="!text-neon-green"
            class="nav-link font-medium text-white/90 hover:text-neon-green transition-all duration-300"
            [class.text-base]="!isSticky()"
            [class.text-sm]="isSticky()"
          >
            Angular 3D
          </a>
          <a
            routerLink="/angular-gsap"
            routerLinkActive="!text-neon-green"
            class="nav-link font-medium text-white/90 hover:text-neon-green transition-all duration-300"
            [class.text-base]="!isSticky()"
            [class.text-sm]="isSticky()"
          >
            Angular GSAP
          </a>
          <a
            href="https://github.com/hive-academy"
            target="_blank"
            rel="noopener noreferrer"
            class="nav-link font-medium text-white/90 hover:text-neon-green transition-all duration-300"
            [class.text-base]="!isSticky()"
            [class.text-sm]="isSticky()"
          >
            GitHub
          </a>
        </div>

        <!-- Mobile Menu Button -->
        <button class="md:hidden text-neon-green" aria-label="Toggle menu">
          <svg
            class="w-6 h-6 transition-all duration-300"
            [class.w-5]="isSticky()"
            [class.h-5]="isSticky()"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .nav-transparent {
        background: transparent;
        border-bottom: 1px solid transparent;
      }

      .nav-solid {
        background: rgba(10, 10, 10, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(0, 255, 150, 0.15);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
      }

      .nav-hidden {
        transform: translateY(-100%);
      }

      /* Logo smooth scaling */
      .logo-wrapper img {
        transform-origin: left center;
        transform: scale(1);
      }

      .logo-wrapper.logo-compact img {
        transform: scale(0.7);
        margin: -8px 0;
      }

      /* Nav link subtle glow on compact mode */
      .nav-compact .nav-link {
        letter-spacing: 0.02em;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  public readonly isSticky = signal(false);
  public readonly isHidden = signal(false);
  private lastScrollPosition = 0;

  public constructor() {
    if (isPlatformBrowser(this.platformId)) {
      fromEvent(this.document, 'scroll')
        .pipe(
          map(() => window.scrollY),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((scrollPos) => {
          // Show compact/solid nav after scrolling 100px
          this.isSticky.set(scrollPos > 100);

          // Hide nav when scrolling down past 400px, show when scrolling up
          if (scrollPos > this.lastScrollPosition && scrollPos > 400) {
            this.isHidden.set(true);
          } else {
            this.isHidden.set(false);
          }

          this.lastScrollPosition = scrollPos;
        });
    }
  }
}
