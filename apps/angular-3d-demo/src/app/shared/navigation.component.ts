import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navigation',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav
      class="fixed top-0 left-0 right-0 z-50 bg-background-dark/80 backdrop-blur-md border-b border-neon-green/10"
    >
      <div
        class="max-w-container mx-auto px-4x py-3x flex items-center justify-between"
      >
        <!-- Logo -->
        <a
          routerLink="/"
          class="text-headline-md font-bold text-neon-green hover:animate-glow transition-all duration-250"
        >
          Hive Academy
        </a>

        <!-- Nav Links -->
        <div class="hidden md:flex items-center gap-6x">
          <a
            routerLink="/"
            routerLinkActive="text-neon-green"
            [routerLinkActiveOptions]="{ exact: true }"
            class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"
          >
            Home
          </a>
          <a
            routerLink="/angular-3d"
            routerLinkActive="text-neon-green"
            class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"
          >
            Angular-3D
          </a>
          <a
            routerLink="/angular-gsap"
            routerLinkActive="text-neon-green"
            class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"
          >
            Angular-GSAP
          </a>
          <a
            href="https://github.com/hive-academy"
            target="_blank"
            rel="noopener noreferrer"
            class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"
          >
            GitHub
          </a>

          <!-- CTA Button -->
          <button
            class="px-6x py-2x bg-primary-500 text-white rounded-button font-semibold hover:scale-105 hover:shadow-button-hover transition-all duration-250"
          >
            Get Started
          </button>
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

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationComponent {}
