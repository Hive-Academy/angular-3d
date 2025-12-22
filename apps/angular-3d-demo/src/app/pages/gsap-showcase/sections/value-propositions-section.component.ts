import {
  Component,
  signal,
  ChangeDetectionStrategy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ScrollAnimationDirective,
  HijackedScrollTimelineComponent,
  HijackedScrollItemDirective,
} from '@hive-academy/angular-gsap';

/**
 * Library Showcase Section - Fullpage Scroll Experience
 *
 * Showcases Angular 3D/GSAP libraries with:
 * - Fullpage hijacked scroll (one slide at a time)
 * - Sticky numbered sidebar navigation
 * - Heavy/weighty scroll feel
 * - Animated content transitions
 */
@Component({
  selector: 'app-value-propositions-section',
  imports: [
    CommonModule,
    ScrollAnimationDirective,
    HijackedScrollTimelineComponent,
    HijackedScrollItemDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Fullpage Hijacked Scroll Section -->
    <section class="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <!-- Ambient glow effects -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div class="absolute top-1/3 left-1/4 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px]"></div>
        <div class="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px]"></div>
      </div>

      <!-- Sticky Sidebar Navigation -->
      <nav
        class="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden lg:block transition-opacity duration-500"
        [class.opacity-100]="sidebarVisible()"
        [class.opacity-0]="!sidebarVisible()"
        [class.pointer-events-none]="!sidebarVisible()"
      >
        <div class="space-y-4">
          @for (section of librarySections(); track section.id; let i = $index) {
            <button
              (click)="scrollToSection(i)"
              class="group flex items-center gap-4 transition-all duration-500"
            >
              <!-- Number Badge -->
              <div
                class="relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-500"
                [class.bg-gradient-to-br]="currentStep() === i"
                [class.from-indigo-500]="currentStep() === i"
                [class.to-violet-600]="currentStep() === i"
                [class.shadow-lg]="currentStep() === i"
                [class.shadow-indigo-500/40]="currentStep() === i"
                [class.scale-110]="currentStep() === i"
                [class.bg-slate-800/80]="currentStep() !== i"
                [class.hover:bg-slate-700]="currentStep() !== i"
              >
                <span
                  class="text-sm font-bold transition-colors duration-300"
                  [class.text-white]="currentStep() === i"
                  [class.text-slate-400]="currentStep() !== i"
                >
                  {{ (i + 1).toString().padStart(2, '0') }}
                </span>
                <!-- Active glow ring -->
                @if (currentStep() === i) {
                  <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-50 blur-md -z-10"></div>
                }
              </div>

              <!-- Active Indicator Bar -->
              <div
                class="h-1 rounded-full transition-all duration-500"
                [class.w-8]="currentStep() === i"
                [class.bg-gradient-to-r]="currentStep() === i"
                [class.from-indigo-500]="currentStep() === i"
                [class.to-violet-500]="currentStep() === i"
                [class.w-0]="currentStep() !== i"
              ></div>
            </button>
          }
        </div>
      </nav>

      <!-- Fullpage Scroll Timeline -->
      <agsp-hijacked-scroll-timeline
        [scrollHeightPerStep]="150"
        [start]="'top top'"
        [animationDuration]="0.6"
        [ease]="'power3.out'"
        (currentStepChange)="onStepChange($event)"
        (progressChange)="onProgressChange($event)"
      >
        @for (section of librarySections(); track section.id; let i = $index) {
          <div
            hijackedScrollItem
            [slideDirection]="i % 2 === 0 ? 'left' : 'right'"
            [fadeIn]="true"
            [scale]="true"
          >
            <!-- Fullpage Section -->
            <div class="min-h-screen flex items-center justify-center px-8 lg:pl-32 lg:pr-16">
              <div class="max-w-6xl w-full mx-auto">
                <!-- Two-column layout -->
                <div class="grid lg:grid-cols-2 gap-12 items-center">
                  <!-- Content Column -->
                  <div
                    class="order-2 lg:order-1"
                    [class.lg:order-2]="i % 2 !== 0"
                  >
                    <!-- Section Number -->
                    <div class="flex items-center gap-4 mb-6">
                      <span class="text-6xl font-black bg-gradient-to-br from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                        {{ (i + 1).toString().padStart(2, '0') }}
                      </span>
                      <div class="h-px flex-1 bg-gradient-to-r from-indigo-500/50 to-transparent max-w-[200px]"></div>
                    </div>

                    <!-- Package Name -->
                    <p class="text-sm font-mono text-indigo-400 uppercase tracking-widest mb-3">
                      {{ section.packageName }}
                    </p>

                    <!-- Headline -->
                    <h2 class="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                      {{ section.businessHeadline }}
                    </h2>

                    <!-- Description -->
                    <p class="text-lg text-slate-300 leading-relaxed mb-8">
                      {{ section.solution }}
                    </p>

                    <!-- Capabilities Grid -->
                    <div class="grid grid-cols-2 gap-3 mb-8">
                      @for (capability of section.capabilities; track capability; let capIdx = $index) {
                        <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/30 transition-colors">
                          <svg class="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span class="text-sm text-slate-300">{{ capability }}</span>
                        </div>
                      }
                    </div>

                    <!-- Metric Badge -->
                    <div class="inline-flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-2xl border border-indigo-500/30">
                      <div class="text-4xl font-black bg-gradient-to-br from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                        {{ section.metricValue }}
                      </div>
                      <div>
                        <div class="text-sm font-bold text-white">{{ section.metricLabel }}</div>
                        <div class="text-xs text-slate-400">vs traditional approach</div>
                      </div>
                    </div>
                  </div>

                  <!-- Visual Column -->
                  <div
                    class="order-1 lg:order-2 flex items-center justify-center"
                    [class.lg:order-1]="i % 2 !== 0"
                  >
                    <!-- Visual placeholder with icon -->
                    <div class="relative w-full max-w-md aspect-square flex items-center justify-center">
                      <!-- Glow background -->
                      <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-3xl blur-xl"></div>
                      <!-- Card -->
                      <div class="relative w-full h-full rounded-3xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm flex items-center justify-center p-8">
                        <div class="text-center">
                          <div class="text-8xl mb-6">{{ section.icon }}</div>
                          <p class="text-lg font-semibold text-white mb-2">{{ section.visualTitle }}</p>
                          <p class="text-sm text-slate-400">{{ section.visualSubtitle }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </agsp-hijacked-scroll-timeline>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ValuePropositionsSectionComponent {
  private readonly platformId = inject(PLATFORM_ID);

  // State
  public readonly currentStep = signal(0);
  public readonly scrollProgress = signal(0);
  public readonly sidebarVisible = signal(true);

  /**
   * Handle step change from hijacked scroll
   */
  public onStepChange(step: number): void {
    this.currentStep.set(step);
  }

  /**
   * Handle progress change
   */
  public onProgressChange(progress: number): void {
    this.scrollProgress.set(progress);
    // Show/hide sidebar based on progress (fade in after first 5%)
    this.sidebarVisible.set(progress > 0.02 && progress < 0.98);
  }

  /**
   * Scroll to specific section (for sidebar navigation)
   */
  public scrollToSection(index: number): void {
    if (isPlatformBrowser(this.platformId)) {
      // The hijacked scroll handles this via its public API
      // For now, we'll rely on the scroll behavior
      const element = document.getElementById(`section-${index}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * Library Showcase Sections
   * Content about Angular 3D, Angular GSAP, and architecture patterns
   */
  public readonly librarySections = signal([
    {
      id: 'angular-3d',
      packageName: '@hive-academy/angular-3d',
      businessHeadline: 'Three.js Made Angular-Native',
      painPoint:
        'Raw Three.js requires imperative code, manual lifecycle management, and complex render loops',
      solution:
        'Pure Angular components with signal-based inputs, automatic resource cleanup, and declarative scene composition. Write 3D scenes like Angular templates.',
      capabilities: [
        'Signal-based reactive inputs',
        'NG_3D_PARENT hierarchy injection',
        'Automatic dispose() cleanup',
        'OnPush change detection',
      ],
      metricValue: '10+',
      metricLabel: '3D Primitives',
      icon: '🎮',
      visualTitle: 'Scene3D Component',
      visualSubtitle: 'WebGL canvas with automatic resize',
    },
    {
      id: 'angular-gsap',
      packageName: '@hive-academy/angular-gsap',
      businessHeadline: 'GSAP Animations, Angular Style',
      painPoint:
        'GSAP ScrollTrigger requires manual setup, cleanup, and SSR workarounds in Angular',
      solution:
        'Declarative directives for scroll-triggered animations, hijacked scroll sequences, and sticky sections. SSR-safe with automatic browser detection.',
      capabilities: [
        'ScrollAnimationDirective',
        'HijackedScrollTimeline',
        'SectionStickyDirective',
        'SSR-safe platform detection',
      ],
      metricValue: '5+',
      metricLabel: 'Animation Directives',
      icon: '✨',
      visualTitle: 'Scroll Animations',
      visualSubtitle: 'Trigger animations on scroll',
    },
    {
      id: 'nx-workspace',
      packageName: 'Nx Monorepo',
      businessHeadline: 'Enterprise-Grade Workspace Architecture',
      painPoint:
        'Managing multiple Angular libraries and apps with shared dependencies is complex',
      solution:
        'Nx monorepo with intelligent task caching, project graph visualization, and affected-only testing. Libraries share code, applications stay lean.',
      capabilities: [
        'Nx 22+ with project graph',
        'Affected-only test runs',
        'Shared library architecture',
        'Automated dependency updates',
      ],
      metricValue: '80%',
      metricLabel: 'Faster CI Builds',
      icon: '🏗️',
      visualTitle: 'Project Graph',
      visualSubtitle: 'Visualize dependencies',
    },
    {
      id: 'signals',
      packageName: 'Angular Signals',
      businessHeadline: 'Fine-Grained Reactivity',
      painPoint:
        'Zone.js change detection causes unnecessary re-renders and performance issues',
      solution:
        'Signal-based state management with computed() for derived values and effect() for side effects. Components re-render only when signals change.',
      capabilities: [
        'signal() for state',
        'computed() for derived',
        'effect() for side effects',
        'input() signal-based inputs',
      ],
      metricValue: '100%',
      metricLabel: 'Signal-Based',
      icon: '📡',
      visualTitle: 'Reactive Primitives',
      visualSubtitle: 'Fine-grained updates',
    },
    {
      id: 'hierarchy',
      packageName: 'NG_3D_PARENT Token',
      businessHeadline: 'Parent-Child 3D Communication',
      painPoint:
        'Three.js objects need parent references for scene graph hierarchy - hard to do declaratively',
      solution:
        'Injection token pattern where child components automatically receive parent Object3D reference. Compose 3D scenes like Angular component trees.',
      capabilities: [
        'NG_3D_PARENT injection',
        'Automatic scene graph',
        'Declarative hierarchy',
        'Type-safe references',
      ],
      metricValue: '0',
      metricLabel: 'Manual Wiring',
      icon: '🌳',
      visualTitle: 'Scene Hierarchy',
      visualSubtitle: 'Declarative composition',
    },
    {
      id: 'animation-directives',
      packageName: 'Animation Directives',
      businessHeadline: 'Declarative 3D Animations',
      painPoint:
        'Animating 3D objects requires GSAP setup, animation loops, and manual cleanup',
      solution:
        'Apply animations with directives: float3d for bobbing motion, rotate3d for spinning, scrollAnimation for scroll-triggered effects. All with automatic cleanup.',
      capabilities: [
        'Float3dDirective',
        'Rotate3dDirective',
        'Configurable axis/speed',
        'DestroyRef cleanup',
      ],
      metricValue: '1 Line',
      metricLabel: 'Per Animation',
      icon: '🎭',
      visualTitle: 'Directive Animations',
      visualSubtitle: 'Add motion declaratively',
    },
    {
      id: 'ssr-safety',
      packageName: 'SSR Compatibility',
      businessHeadline: 'Server-Side Rendering Safe',
      painPoint:
        'Three.js and GSAP fail on server - no window, no document, no WebGL',
      solution:
        'Platform detection with isPlatformBrowser(), afterNextRender() for browser-only code, and graceful degradation for SSR builds.',
      capabilities: [
        'isPlatformBrowser() guards',
        'afterNextRender() timing',
        'PLATFORM_ID injection',
        'Graceful SSR fallbacks',
      ],
      metricValue: '100%',
      metricLabel: 'SSR Compatible',
      icon: '🖥️',
      visualTitle: 'Universal Apps',
      visualSubtitle: 'Works everywhere',
    },
    {
      id: 'onpush',
      packageName: 'OnPush Strategy',
      businessHeadline: 'Optimized Change Detection',
      painPoint:
        'Default change detection runs on every async event - expensive for 60fps 3D rendering',
      solution:
        'All components use OnPush change detection, only updating when inputs change. Combined with signals for surgical re-renders.',
      capabilities: [
        'ChangeDetectionStrategy.OnPush',
        'Signal-triggered updates',
        'Minimal re-renders',
        '60fps 3D performance',
      ],
      metricValue: '60',
      metricLabel: 'FPS Target',
      icon: '⚡',
      visualTitle: 'Performance First',
      visualSubtitle: 'Optimized rendering',
    },
    {
      id: 'cleanup',
      packageName: 'Resource Cleanup',
      businessHeadline: 'Zero Memory Leaks',
      painPoint:
        'Three.js geometries, materials, and textures must be manually disposed or they leak GPU memory',
      solution:
        'Automatic resource tracking with dispose() called in ngOnDestroy. DestroyRef for subscription cleanup. No manual memory management.',
      capabilities: [
        'Automatic dispose()',
        'DestroyRef subscriptions',
        'GPU memory cleanup',
        'Animation cleanup',
      ],
      metricValue: '0',
      metricLabel: 'Memory Leaks',
      icon: '🧹',
      visualTitle: 'Auto Cleanup',
      visualSubtitle: 'Dispose on destroy',
    },
    {
      id: 'testing',
      packageName: 'Testing Strategy',
      businessHeadline: 'Comprehensive Test Coverage',
      painPoint:
        'Testing Three.js components is hard - no real WebGL context in Jest',
      solution:
        'Co-located spec files with Jest, mocked Three.js objects, and TestBed setup utilities. Test component behavior, not WebGL internals.',
      capabilities: [
        'Jest unit tests',
        'Co-located *.spec.ts',
        'Three.js mocking',
        'Component TestBed setup',
      ],
      metricValue: '80%+',
      metricLabel: 'Coverage Target',
      icon: '🧪',
      visualTitle: 'Test Coverage',
      visualSubtitle: 'Reliable components',
    },
  ]);
}
