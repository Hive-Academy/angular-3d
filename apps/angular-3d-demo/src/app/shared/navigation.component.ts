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
      [class.nav-hidden]="isHidden()"
    >
      <div
        class="max-w-container mx-auto px-4x py-3x flex items-center justify-between"
      >
        <!-- Logo -->
        <a
          routerLink="/"
          class="text-headline-md font-bold text-neon-green hover:animate-glow transition-all duration-250"
        >
          <img ngSrc="/logo.png" alt="logo" width="160" height="56" priority />
        </a>

        <!-- Nav Links -->
        <div class="hidden md:flex items-center gap-8">
          <a
            routerLink="/"
            routerLinkActive="!text-neon-green"
            [routerLinkActiveOptions]="{ exact: true }"
            class="text-base font-medium text-white/90 hover:text-neon-green transition-colors duration-250"
          >
            Home
          </a>
          <a
            routerLink="/angular-3d"
            routerLinkActive="!text-neon-green"
            class="text-base font-medium text-white/90 hover:text-neon-green transition-colors duration-250"
          >
            Angular-3D
          </a>
          <a
            routerLink="/angular-gsap"
            routerLinkActive="!text-neon-green"
            class="text-base font-medium text-white/90 hover:text-neon-green transition-colors duration-250"
          >
            Angular-GSAP
          </a>
          <a
            href="https://github.com/hive-academy"
            target="_blank"
            rel="noopener noreferrer"
            class="text-base font-medium text-white/90 hover:text-neon-green transition-colors duration-250"
          >
            GitHub
          </a>
        </div>

        <!-- Mobile Menu Button -->
        <button class="md:hidden text-neon-green" aria-label="Toggle menu">
          <svg
            class="w-6 h-6"
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
        background: rgba(10, 10, 10, 0.9);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid rgba(0, 255, 150, 0.1);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
      }

      .nav-hidden {
        transform: translateY(-100%);
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
          // Show solid nav after scrolling 100px
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
