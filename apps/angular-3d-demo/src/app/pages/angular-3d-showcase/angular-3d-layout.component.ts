import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/**
 * Section tab configuration for navigation
 */
interface SectionTab {
  path: string;
  label: string;
  icon: string;
}

/**
 * Angular 3D Showcase Layout Component
 *
 * Parent layout with tab-based navigation for lazy-loaded child routes.
 * Each child route contains grouped 3D scenes, ensuring only 1-2 WebGL
 * contexts are active at any time.
 */
@Component({
  selector: 'app-angular-3d-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero Header -->
    <section
      class="relative py-16x bg-gradient-to-br from-background-dark via-primary-900/20 to-background-dark"
    >
      <div class="max-w-container mx-auto px-4x text-center">
        <h1 class="text-display-xl font-bold mb-4x">
          <span class="text-gradient-primary">Angular 3D</span> Library
        </h1>
        <p class="text-headline-md text-text-secondary max-w-prose mx-auto">
          Explore our collection of 3D components, text rendering, lighting,
          animations, and postprocessing effects
        </p>
      </div>
    </section>

    <!-- Tab Navigation -->
    <nav
      class="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-white/10"
    >
      <div class="max-w-container mx-auto px-4x">
        <div class="flex gap-1x overflow-x-auto py-2x hide-scrollbar">
          @for (tab of tabs; track tab.path) {
          <a
            [routerLink]="tab.path"
            routerLinkActive="active-tab"
            class="tab-link"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
          </a>
          }
        </div>
      </div>
    </nav>

    <!-- Child Route Content -->
    <main class="min-h-screen bg-background-dark">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .text-gradient-primary {
        background: linear-gradient(
          135deg,
          #6366f1 0%,
          #8b5cf6 50%,
          #d946ef 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .tab-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        border-radius: 0.75rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.6);
        white-space: nowrap;
        transition: all 0.2s ease;

        &:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }

        &.active-tab {
          color: white;
          background: linear-gradient(
            135deg,
            rgba(99, 102, 241, 0.2),
            rgba(139, 92, 246, 0.2)
          );
          box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.3);
        }
      }

      .tab-icon {
        font-size: 1.125rem;
      }

      .tab-label {
        @media (max-width: 768px) {
          display: none;
        }
      }

      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
        padding-right: 2rem; /* Ensure last item is visible */

        &::-webkit-scrollbar {
          height: 4px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      }
    `,
  ],
})
export default class Angular3dLayoutComponent {
  public readonly tabs: SectionTab[] = [
    { path: 'primitives', label: 'Primitives', icon: '🔷' },
    { path: 'textures', label: 'Textures', icon: '🎨' },
    { path: 'text', label: 'Text', icon: '✏️' },
    { path: 'lighting', label: 'Lighting', icon: '💡' },
    { path: 'directives', label: 'Directives', icon: '⚡' },
    { path: 'postprocessing', label: 'Effects', icon: '✨' },
    { path: 'controls', label: 'Controls', icon: '🎮' },
    { path: 'performance', label: 'Performance', icon: '📊' },
    // Scene demos
    { path: 'hero-space', label: 'Hero Space', icon: '🌍' },
    { path: 'clouds', label: 'Clouds', icon: '☁️' },
    { path: 'metaball', label: 'Metaball', icon: '🫧' },
    { path: 'crystal-grid', label: 'Crystal Grid', icon: '💎' },
    { path: 'floating-geometry', label: 'Floating Geo', icon: '🔮' },
    { path: 'particle-storm', label: 'Particles', icon: '⚡' },
    { path: 'bubble-dream', label: 'Bubble Dream', icon: '🔵' },
    { path: 'marble-hero', label: 'Marble Hero', icon: '🔮' },
  ];
}
