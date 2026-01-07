import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * Section tab configuration for navigation
 */
interface SectionTab {
  path: string;
  label: string;
  icon: string;
}

/**
 * Navigation category grouping
 */
interface NavigationCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  tabs: SectionTab[];
  expanded: boolean;
}

/**
 * Angular 3D Showcase Layout Component
 *
 * Embedded sidebar layout within the showcase page.
 * Features:
 * - Sidebar navigation embedded in page content
 * - Collapsible category sections
 * - Mobile-responsive with toggle button
 * - Doesn't affect main site header/layout
 */
@Component({
  selector: 'app-angular-3d-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero Header -->
    <section class="hero-header">
      <div class="max-w-container mx-auto px-4x text-center py-6">
        <h1 class="text-display-xl font-bold mb-4x">
          <span class="text-gradient-primary">Angular 3D</span> Library
        </h1>
        <p class="text-headline-md text-text-secondary max-w-prose mx-auto">
          Explore our collection of 3D components, text rendering, lighting,
          animations, and postprocessing effects
        </p>
      </div>
    </section>

    <!-- Main Content with Embedded Sidebar -->
    <div class="showcase-container">
      <div class="showcase-wrapper">
        <!-- Toggle Button (Mobile) -->
        <button
          class="sidebar-toggle"
          (click)="toggleSidebar()"
          [class.active]="sidebarOpen()"
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <span class="toggle-text">Navigation</span>
        </button>

        <!-- Sidebar Navigation (Embedded) -->
        <aside
          class="embedded-sidebar"
          [class.open]="sidebarOpen()"
          [class.collapsed]="sidebarCollapsed()"
        >
          <!-- Sidebar Header -->
          <div class="sidebar-header">
            <div class="sidebar-header-content">
              <div class="sidebar-title-group">
                <h2 class="sidebar-title">Components</h2>
                <p class="sidebar-subtitle">Browse library features</p>
              </div>
              <button
                class="collapse-button"
                (click)="toggleSidebarCollapse()"
                [attr.aria-label]="
                  sidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'
                "
                title="Toggle sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M15 5L10 10L15 15"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M9 5L4 10L9 15"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Scrollable Navigation -->
          <nav class="sidebar-nav">
            @for (category of categories; track category.id) {
            <div class="nav-category">
              <!-- Category Header (Clickable to expand/collapse) -->
              <button
                class="category-header"
                (click)="toggleCategory(category.id)"
                [class.expanded]="category.expanded"
              >
                <div class="category-info">
                  <span class="category-icon">{{ category.icon }}</span>
                  <div class="category-text">
                    <h3 class="category-title">{{ category.title }}</h3>
                    <p class="category-description">
                      {{ category.description }}
                    </p>
                  </div>
                </div>
                <svg
                  class="expand-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>

              <!-- Category Tabs (Collapsible) -->
              @if (category.expanded) {
              <div class="category-tabs">
                @for (tab of category.tabs; track tab.path) {
                <a
                  [routerLink]="tab.path"
                  routerLinkActive="active"
                  class="tab-link"
                  (click)="onTabClick()"
                >
                  <span class="tab-icon">{{ tab.icon }}</span>
                  <span class="tab-label">{{ tab.label }}</span>
                </a>
                }
              </div>
              }
            </div>
            }
          </nav>
        </aside>

        <!-- Overlay for mobile (click to close sidebar) -->
        @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="closeSidebar()"></div>
        }

        <!-- Collapsed Sidebar Toggle (appears when sidebar is collapsed) -->
        @if (sidebarCollapsed()) {
        <button
          class="collapsed-toggle"
          (click)="toggleSidebarCollapse()"
          aria-label="Expand sidebar"
          title="Show sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M5 5L10 10L5 15"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M11 5L16 10L11 15"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        }

        <!-- Main Content Area -->
        <main class="showcase-content" [class.expanded]="sidebarCollapsed()">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* Hero Header */
      .hero-header {
        background: linear-gradient(
          135deg,
          #0a0a0f 0%,
          rgba(99, 102, 241, 0.1) 50%,
          #0a0a0f 100%
        );
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 5rem 1rem;
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

      /* Showcase Container */
      .showcase-container {
        max-width: 1600px;
        margin: 0 auto;
        padding: 2rem 1rem;
        background: #0a0a0f;
      }

      .showcase-wrapper {
        display: flex;
        gap: 2rem;
        position: relative;
        min-height: 600px;

        @media (max-width: 1024px) {
          gap: 0;
        }
      }

      /* Sidebar Toggle Button (Mobile) */
      .sidebar-toggle {
        display: none;
        position: sticky;
        top: 1rem;
        left: 1rem;
        z-index: 40;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.25rem;
        background: rgba(99, 102, 241, 0.15);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 0.75rem;
        color: white;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(8px);
        margin-bottom: 1rem;

        &:hover {
          background: rgba(99, 102, 241, 0.25);
          border-color: rgba(99, 102, 241, 0.5);
        }

        &.active {
          background: rgba(139, 92, 246, 0.25);
          border-color: rgba(139, 92, 246, 0.5);
        }

        @media (max-width: 1024px) {
          display: flex;
        }
      }

      .toggle-text {
        font-weight: 600;
      }

      /* Embedded Sidebar */
      .embedded-sidebar {
        width: 280px;
        min-width: 280px;
        background: rgba(15, 15, 25, 0.6);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 1rem;
        max-height: calc(100vh - 2rem);
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        /* Collapsed state (desktop) */
        &.collapsed {
          width: 0;
          min-width: 0;
          opacity: 0;
          pointer-events: none;
          transform: translateX(-100%);
        }

        @media (max-width: 1024px) {
          position: fixed;
          left: 1rem;
          top: 5rem;
          bottom: 1rem;
          max-height: none;
          z-index: 50;
          transform: translateX(-120%);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);

          &.open {
            transform: translateX(0);
          }

          /* Don't apply collapsed state on mobile */
          &.collapsed {
            width: 280px;
            min-width: 280px;
            opacity: 1;
            transform: translateX(-120%);

            &.open {
              transform: translateX(0);
            }
          }
        }
      }

      /* Sidebar Overlay (Mobile) */
      .sidebar-overlay {
        display: none;

        @media (max-width: 1024px) {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 45;
          animation: fadeIn 0.2s ease;
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      /* Sidebar Header */
      .sidebar-header {
        padding: 1.5rem 1.25rem 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .sidebar-header-content {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .sidebar-title-group {
        flex: 1;
        min-width: 0;
      }

      .sidebar-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 0.25rem 0;
        color: white;
      }

      .sidebar-subtitle {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
      }

      .collapse-button {
        flex-shrink: 0;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(99, 102, 241, 0.15);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 0.5rem;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(99, 102, 241, 0.25);
          border-color: rgba(99, 102, 241, 0.5);
          color: white;
          transform: scale(1.05);
        }

        &:active {
          transform: scale(0.95);
        }

        svg {
          transition: transform 0.2s ease;
        }
      }

      /* Sidebar Navigation */
      .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        padding: 0.75rem 0;

        /* Custom scrollbar */
        &::-webkit-scrollbar {
          width: 5px;
        }

        &::-webkit-scrollbar-track {
          background: transparent;
        }

        &::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;

          &:hover {
            background: rgba(255, 255, 255, 0.25);
          }
        }
      }

      /* Navigation Category */
      .nav-category {
        margin-bottom: 0.25rem;
      }

      .category-header {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1.25rem;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        color: white;

        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        &.expanded {
          background: rgba(255, 255, 255, 0.05);
        }
      }

      .category-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        text-align: left;
      }

      .category-icon {
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        background: rgba(99, 102, 241, 0.15);
        border-radius: 0.5rem;
        flex-shrink: 0;
      }

      .category-text {
        flex: 1;
      }

      .category-title {
        font-size: 0.8125rem;
        font-weight: 600;
        margin: 0 0 0.125rem 0;
        color: rgba(255, 255, 255, 0.9);
      }

      .category-description {
        font-size: 0.6875rem;
        margin: 0;
        color: rgba(255, 255, 255, 0.5);
        line-height: 1.3;
      }

      .expand-icon {
        flex-shrink: 0;
        transition: transform 0.2s ease;
        color: rgba(255, 255, 255, 0.5);
      }

      .category-header.expanded .expand-icon {
        transform: rotate(180deg);
      }

      /* Category Tabs */
      .category-tabs {
        padding: 0.25rem 0 0.5rem 0.75rem;
        animation: slideDown 0.2s ease;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .tab-link {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.5rem 1.25rem;
        margin: 0.125rem 0;
        color: rgba(255, 255, 255, 0.6);
        text-decoration: none;
        border-radius: 0.5rem;
        transition: all 0.2s ease;
        font-size: 0.8125rem;
        font-weight: 500;
        border-left: 2px solid transparent;

        &:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
          border-left-color: rgba(99, 102, 241, 0.3);
        }

        &.active {
          background: linear-gradient(
            90deg,
            rgba(99, 102, 241, 0.2),
            rgba(139, 92, 246, 0.1)
          );
          color: white;
          border-left-color: #8b5cf6;
          box-shadow: 0 1px 4px rgba(139, 92, 246, 0.15);
        }
      }

      .tab-icon {
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        flex-shrink: 0;
      }

      .tab-label {
        flex: 1;
      }

      /* Collapsed Sidebar Toggle Button */
      .collapsed-toggle {
        position: sticky;
        top: 1rem;
        left: 0;
        z-index: 30;
        width: 3rem;
        height: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(99, 102, 241, 0.2);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(99, 102, 241, 0.4);
        border-radius: 0 0.75rem 0.75rem 0;
        border-left: none;
        color: white;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 4px 0 12px rgba(99, 102, 241, 0.2);
        animation: slideIn 0.3s ease;

        &:hover {
          background: rgba(99, 102, 241, 0.3);
          border-color: rgba(99, 102, 241, 0.6);
          width: 3.5rem;
          box-shadow: 4px 0 16px rgba(99, 102, 241, 0.3);
        }

        &:active {
          transform: scale(0.95);
        }

        @media (max-width: 1024px) {
          display: none;
        }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* Main Content */
      .showcase-content {
        flex: 1;
        min-width: 0; /* Important for flex child */
        background: rgba(10, 10, 15, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 1rem;
        padding: 2rem;
        min-height: 600px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        /* Expanded state (when sidebar is collapsed) */
        &.expanded {
          margin-left: -2rem; /* Remove gap space */
          width: calc(100% + 2rem); /* Expand to fill sidebar space */
        }

        @media (max-width: 768px) {
          padding: 1rem;
        }

        @media (max-width: 1024px) {
          &.expanded {
            margin-left: 0;
            width: 100%;
          }
        }
      }
    `,
  ],
})
export default class Angular3dLayoutComponent {
  /**
   * Sidebar open/close state (for mobile)
   */
  public readonly sidebarOpen = signal(false);

  /**
   * Sidebar collapsed state (desktop - completely hidden)
   */
  public readonly sidebarCollapsed = signal(false);

  /**
   * Categorized navigation structure
   */
  public readonly categories: NavigationCategory[] = [
    {
      id: 'core',
      title: 'Core Components',
      description: 'Fundamental 3D building blocks',
      icon: '🔷',
      expanded: true,
      tabs: [
        { path: 'primitives', label: 'Primitives', icon: '📦' },
        { path: 'particles', label: 'Particles', icon: '✨' },
        { path: 'textures', label: 'Textures', icon: '🎨' },
        { path: 'backgrounds', label: 'Backgrounds', icon: '🌌' },
        { path: 'text', label: 'Text', icon: '✏️' },
        { path: 'lighting', label: 'Lighting', icon: '💡' },
      ],
    },
    {
      id: 'interactions',
      title: 'Interactions',
      description: 'Animation & user controls',
      icon: '⚡',
      expanded: true,
      tabs: [
        { path: 'directives', label: 'Directives', icon: '🔄' },
        { path: 'controls', label: 'Controls', icon: '🎮' },
        { path: 'loading-entrance', label: 'Loading & Entrance', icon: '🎬' },
      ],
    },
    {
      id: 'advanced',
      title: 'Advanced',
      description: 'Effects & optimization',
      icon: '🌟',
      expanded: true,
      tabs: [
        { path: 'postprocessing', label: 'Effects', icon: '✨' },
        { path: 'performance', label: 'Performance', icon: '📊' },
      ],
    },
    {
      id: 'demos',
      title: 'Scene Demos',
      description: 'Complete hero examples',
      icon: '🎬',
      expanded: false,
      tabs: [
        { path: 'hero-space', label: 'Space', icon: '🌍' },
        { path: 'clouds', label: 'Clouds', icon: '☁️' },
        { path: 'metaball', label: 'Metaball', icon: '🫧' },
        { path: 'crystal-grid', label: 'Crystal', icon: '💎' },
        { path: 'floating-geometry', label: 'Floating', icon: '🔮' },
        { path: 'particle-storm', label: 'Storm', icon: '⚡' },
        { path: 'bubble-dream', label: 'Bubbles', icon: '🔵' },
        { path: 'marble-hero', label: 'Marble', icon: '🪨' },
        { path: 'hexagonal-hero', label: 'Hex Hero', icon: '◇' },
        { path: 'hexagonal-features', label: 'Hex Features', icon: '⬡' },
      ],
    },
  ];

  /**
   * Toggle category expand/collapse
   */
  public toggleCategory(categoryId: string): void {
    const category = this.categories.find((c) => c.id === categoryId);
    if (category) {
      category.expanded = !category.expanded;
    }
  }

  /**
   * Toggle sidebar (mobile)
   */
  public toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  /**
   * Close sidebar (mobile)
   */
  public closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  /**
   * Handle tab click (close sidebar on mobile)
   */
  public onTabClick(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      this.closeSidebar();
    }
  }

  /**
   * Toggle sidebar collapse (desktop - completely hide/show)
   */
  public toggleSidebarCollapse(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }
}
