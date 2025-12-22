import {
  Component,
  ElementRef,
  inject,
  viewChild,
  signal,
  afterNextRender,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  HijackedScrollTimelineComponent,
  HijackedScrollItemDirective,
  HijackedScrollDirective,
} from '@hive-academy/angular-gsap';
import {
  Scene3dComponent,
  GltfModelComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  StarFieldComponent,
  // Rotate3dDirective,
  Float3dDirective,
  MouseTracking3dDirective,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

@Component({
  selector: 'app-library-overview-section',
  imports: [
    CommonModule,
    RouterLink,
    HijackedScrollTimelineComponent,
    HijackedScrollItemDirective,
    // Angular 3D Imports
    Scene3dComponent,
    GltfModelComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    StarFieldComponent,
    // Rotate3dDirective,
    Float3dDirective,
    MouseTracking3dDirective,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section #sectionRef class="relative mt-30">
      <!-- Sticky Sidebar Navigation -->
      <nav
        class="fixed left-4 lg:left-8 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3 transition-all duration-500"
        [class.opacity-100]="sidebarVisible()"
        [class.opacity-0]="!sidebarVisible()"
        [class.pointer-events-none]="!sidebarVisible()"
        [class.translate-x-0]="sidebarVisible()"
        [class.-translate-x-12]="!sidebarVisible()"
      >
        @for (section of sections; track section.id; let i = $index) {
          <button
            (click)="scrollToSection(i)"
            class="group flex items-center gap-3 transition-all duration-300 hover:translate-x-1"
          >
            <!-- Number Badge -->
            <div
              class="relative flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300"
              [class.bg-gradient-to-br]="currentStep() === i"
              [class.from-indigo-500]="currentStep() === i"
              [class.to-violet-600]="currentStep() === i"
              [class.text-white]="currentStep() === i"
              [class.shadow-lg]="currentStep() === i"
              [class.shadow-indigo-500/40]="currentStep() === i"
              [class.scale-110]="currentStep() === i"
              [class.bg-slate-800/80]="currentStep() !== i"
              [class.text-slate-400]="currentStep() !== i"
            >
              {{ (i + 1).toString().padStart(2, '0') }}
            </div>
            <!-- Active bar -->
            <div
              class="h-0.5 rounded-full transition-all duration-300"
              [class.w-6]="currentStep() === i"
              [class.bg-gradient-to-r]="currentStep() === i"
              [class.from-indigo-500]="currentStep() === i"
              [class.to-violet-500]="currentStep() === i"
              [class.w-0]="currentStep() !== i"
            ></div>
          </button>
        }
      </nav>

      <!-- Fullpage Scroll Timeline -->
      <agsp-hijacked-scroll-timeline
        #scrollTimeline
        [scrollHeightPerStep]="1200"
        [start]="'top top'"
        [animationDuration]="0.7"
        [ease]="'power2.inOut'"
        [scrub]="0.5"
        (currentStepChange)="onStepChange($event)"
        (progressChange)="onProgressChange($event)"
      >
        @for (section of sections; track section.id; let i = $index) {
          <div
            hijackedScrollItem
            [slideDirection]="i % 2 === 0 ? 'left' : 'right'"
            [fadeIn]="i !== 0"
            [scale]="true"
          >
            <!-- FULLSCREEN SLIDE -->
            <div class="h-full w-full flex overflow-hidden bg-background-dark relative">
                 <!-- Background gradient specific to section -->
                 <div class="absolute inset-0 pointer-events-none" [ngClass]="section.bgGradient"></div>

              <!-- Left Column (Visual) -->
              <div class="w-1/2 h-full flex items-center justify-center p-8 lg:p-16 relative z-10">
                 @if (section.id === 'angular-3d') {
                    <!-- 3D Scene Visual -->
                    <div class="relative w-full aspect-square max-w-2xl rounded-2xl overflow-hidden border border-primary-500/20 bg-background-dark/50 backdrop-blur-sm">
                        <a3d-scene-3d [cameraPosition]="[0, 0, 15]" [cameraFov]="60">
                            <a3d-ambient-light [intensity]="0.4" />
                            <a3d-directional-light [position]="[5, 5, 5]" [intensity]="1" [color]="colors.neonGreen" />
                            <a3d-star-field [starCount]="2000" [radius]="50" [enableTwinkle]="true" [stellarColors]="true" [multiSize]="true" />
                            
                            <!-- Robot Model with Mouse Tracking -->
                            <a3d-gltf-model
                              modelPath="3d/mini_robot.glb"
                              [scale]="[0.05, 0.05, 0.05]"
                              [position]="[0, -1, 12]"
                              viewportPosition="center"
                              mouseTracking3d
                              [trackingConfig]="{
                                sensitivity: 0.8, 
                                limit: 0.5, 
                                damping: 0.05, 
                                invertX: true, 
                                translationRange: [10, 5],
                                invertPosX: true 
                              }"
                              float3d
                              [floatConfig]="{ height: 0.2, speed: 2 }"
                            />
                        </a3d-scene-3d>
                     </div>
                 } @else if (section.id === 'angular-gsap') {
                     <!-- GSAP Visual (Animation Demos) -->
                     <div class="relative w-full max-w-2xl aspect-square rounded-2xl overflow-hidden border border-primary-500/20 bg-background-dark/50 backdrop-blur-sm shadow-card p-8 flex flex-col justify-center">
                        <div class="space-y-8">
                             <!-- Scroll trigger demo -->
                            <div class="relative">
                                <div class="text-body-sm font-mono text-primary-500/60 mb-2">scrollAnimation directive</div>
                                <div class="flex gap-4 overflow-hidden">
                                    @for (k of [1,2,3,4]; track k) {
                                        <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg animate-pulse" [style.animation-delay.ms]="k * 200"></div>
                                    }
                                </div>
                            </div>
                            <!-- Timeline demo -->
                            <div class="relative">
                                <div class="text-body-sm font-mono text-primary-500/60 mb-2">hijackedScroll directive</div>
                                <div class="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                                    <div class="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green to-primary-500 rounded-full animate-slide-progress" style="width: 70%"></div>
                                </div>
                                <div class="flex justify-between mt-2 text-xs text-gray-400"><span>0%</span><span>Section Progress</span><span>100%</span></div>
                            </div>
                            <!-- Code preview -->
                            <div class="bg-background-dark rounded-xl p-6 border border-gray-800">
                                <div class="flex items-center gap-2 mb-4"><div class="w-3 h-3 rounded-full bg-red-500"></div><div class="w-3 h-3 rounded-full bg-yellow-500"></div><div class="w-3 h-3 rounded-full bg-green-500"></div><span class="ml-4 text-xs text-gray-400 font-mono">component.html</span></div>
                                <pre class="text-neon-green font-mono text-xs overflow-x-auto"><code>&lt;div scrollAnimation [animationType]="'fadeInUp'"&gt; ... &lt;/div&gt;</code></pre>
                            </div>
                        </div>
                     </div>
                 }
              </div>

              <!-- Right Column (Content) -->
              <div class="w-1/2 h-full flex flex-col justify-center px-8 lg:px-16 lg:pr-24 relative z-10">
                 <!-- Package Badge -->
                 <div class="flex items-center gap-3 mb-6">
                   <span class="px-3 py-1 bg-primary-500/20 border border-primary-500/40 rounded-full text-primary-400 text-sm font-mono">
                     {{ section.package }}
                   </span>
                 </div>

                 <!-- Headline -->
                 <h2 class="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6" [innerHTML]="section.headline"></h2>

                 <!-- Description -->
                 <p class="text-lg text-gray-300 leading-relaxed mb-8">{{ section.description }}</p>

                 <!-- Capabilities Grid -->
                 <div class="grid grid-cols-2 gap-3 mb-8">
                   @for (capability of section.capabilities; track capability; let j = $index) {
                     <div 
                       class="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-neon-green/30 transition-all duration-500 group"
                       [class.opacity-0]="currentStep() !== i"
                       [class.translate-y-8]="currentStep() !== i"
                       [class.opacity-100]="currentStep() === i"
                       [class.translate-y-0]="currentStep() === i"
                       [style.transition-delay.ms]="j * 100 + 500"
                     >
                       <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-neon-green/20 text-neon-green">
                         <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                       </div>
                       <span class="text-sm text-gray-200 group-hover:text-white transition-colors">{{ capability }}</span>
                     </div>
                   }
                 </div>

                 <!-- Metric Badge -->
                 <div class="inline-flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-primary-500/20 to-neon-green/20 rounded-xl border border-primary-500/30 mb-8 w-fit">
                   <div class="text-3xl font-bold bg-gradient-to-br from-primary-400 to-neon-green bg-clip-text text-transparent">{{ section.metricValue }}</div>
                   <div>
                     <div class="text-lg font-bold text-white">{{ section.metricLabel }}</div>
                     <div class="text-sm text-gray-400">{{ section.metricSub }}</div>
                   </div>
                 </div>

                 <!-- CTA Button -->
                 <a [routerLink]="section.link" class="inline-flex items-center gap-2 px-8 py-4 bg-neon-green text-background-dark rounded-button font-semibold hover:scale-105 hover:shadow-neon-green transition-all duration-250 w-fit">
                   {{ section.ctaText }}
                   <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                 </a>
              </div>
            </div>
          </div>
        }
      </agsp-hijacked-scroll-timeline>
    </section>
  `,
  styles: [
    `
      @keyframes slide-progress {
        0%,
        100% {
          width: 20%;
        }
        50% {
          width: 80%;
        }
      }
      .animate-slide-progress {
        animation: slide-progress 3s ease-in-out infinite;
      }
      :host {
        display: block;
        overflow: hidden;
      }
    `,
  ],
})
export class LibraryOverviewSectionComponent {
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  public readonly colors = SCENE_COLORS;

  private readonly hijackedScrollDirective = viewChild(HijackedScrollDirective);

  // Section visibility state
  private readonly sectionInView = signal(false);
  // Step tracking state
  public readonly currentStep = signal(0);
  public readonly scrollProgress = signal(0);
  // Sidebar visibility
  public readonly sidebarVisible = signal(false);
  private sectionObserver?: IntersectionObserver;

  public constructor() {
    afterNextRender(() => {
      this.setupSectionObserver();
    });

    this.destroyRef.onDestroy(() => {
      this.sectionObserver?.disconnect();
    });
  }

  private setupSectionObserver(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '0px',
      threshold: [0, 0.1],
    };

    this.sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const isVisible = entry.isIntersecting;
        this.sectionInView.set(isVisible);
        this.updateSidebarVisibility();
      });
    }, options);

    this.sectionObserver.observe(this.elementRef.nativeElement);
  }

  private updateSidebarVisibility(): void {
    const inView = this.sectionInView();
    // Show sidebar when section is in view, but maybe refine logic if needed
    // The previous implementation used scroll progress > 0.01 && < 0.99
    // Since this is a full-page hijack, 'inView' is usually sufficient once it occupies standard viewport
    this.sidebarVisible.set(inView);
  }

  public onStepChange(step: number): void {
    this.currentStep.set(step);
  }

  public onProgressChange(progress: number): void {
    this.scrollProgress.set(progress);
  }

  public scrollToSection(index: number): void {
    const directive = this.hijackedScrollDirective();
    if (directive) {
      directive.jumpToStep(index);
    }
  }

  public readonly sections = [
    {
      id: 'angular-3d',
      package: '@hive-academy/angular-3d',
      headline:
        'Build <span class="text-neon-green">Stunning 3D</span> Experiences with Angular',
      description:
        'Pure Angular wrapper for Three.js. Create immersive 3D scenes using declarative components, not imperative code. Signal-based reactivity with automatic resource cleanup.',
      capabilities: [
        '27+ Primitives',
        'GLTF Model Loading',
        'Post-processing Effects',
        'OrbitControls',
        'Signal-based State',
        'Animation Directives',
        'Scene Lighting',
        'Texture Support',
      ],
      metricValue: '27+',
      metricLabel: 'Primitives',
      metricSub: 'Ready-to-use 3D components', // fixed typo
      ctaText: 'Explore Components',
      link: '/angular-3d',
      bgGradient:
        'bg-gradient-to-br from-primary-500/5 via-transparent to-neon-green/5',
    },
    {
      id: 'angular-gsap',
      package: '@hive-academy/angular-gsap',
      headline:
        'Scroll-Driven <span class="text-primary-500">Animations</span> Made Simple',
      description:
        'Signal-based GSAP directives for Angular. Create stunning scroll animations, hijacked scroll sections, and timeline orchestration with SSR compatibility.',
      capabilities: [
        'ScrollTrigger Integration',
        'Hijacked Scroll Sections',
        'Timeline Orchestration',
        'SSR Compatible',
        'Signal-based State',
        'Automatic Cleanup',
        'GSAP Directives',
        'Scroll Progress',
      ],
      metricValue: '60%',
      metricLabel: 'Less Code',
      metricSub: 'vs manual GSAP setup',
      ctaText: 'View Animations',
      link: '/angular-gsap',
      bgGradient:
        'bg-gradient-to-br from-primary-500/10 via-transparent to-indigo-500/10',
    },
  ];
}
