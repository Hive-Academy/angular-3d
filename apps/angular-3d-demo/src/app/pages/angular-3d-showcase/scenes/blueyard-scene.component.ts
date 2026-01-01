/**
 * BlueyardSceneComponent - Blueyard-Inspired Hijacked Scroll Demo
 *
 * A full-viewport scroll experience inspired by blueyard.com that demonstrates
 * the integration between @hive-academy/angular-gsap hijacked scroll directives
 * and @hive-academy/angular-3d 3D scene rendering.
 *
 * Visual Reference (blueyard.com):
 * - Warm cream/peach gradient backgrounds (light theme)
 * - Glass-like translucent sphere with internal glow
 * - Sparkling particle corona emanating from sphere
 * - Dark text on light backgrounds
 * - Sphere positioned in lower viewport
 *
 * Section Themes:
 * 1. Landing - Warm peach/cream (#FFF5E6 -> #FFDAB9)
 * 2. Computing - Soft lavender (#F5F0FF -> #E6D9FF)
 * 3. Engineering - Cool sky blue (#F0F7FF -> #D6EBFF)
 * 4. Biology - Fresh mint (#F0FFF7 -> #D6FFF0)
 * 5. Crypto - Soft rose (#FFF0F5 -> #FFD6E6)
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  inject,
  afterNextRender,
  DestroyRef,
} from '@angular/core';
import {
  Scene3dComponent,
  ParticleSystemComponent,
  SphereComponent,
  EffectComposerComponent,
  BloomEffectComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
} from '@hive-academy/angular-3d';
import {
  HijackedScrollDirective,
  HijackedScrollItemDirective,
} from '@hive-academy/angular-gsap';

/**
 * Section configuration for the hijacked scroll experience
 */
interface SectionConfig {
  id: string;
  title: string;
  subtitle: string;
  gradientStart: string;
  gradientEnd: string;
  sphereColor: string;
  glowColor: string;
}

@Component({
  selector: 'app-blueyard-scene',
  standalone: true,
  imports: [
    Scene3dComponent,
    ParticleSystemComponent,
    SphereComponent,
    EffectComposerComponent,
    BloomEffectComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
    HijackedScrollDirective,
    HijackedScrollItemDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Main Container with Hijacked Scroll -->
    <div
      class="blueyard-container"
      hijackedScroll
      [scrollHeightPerStep]="100"
      [scrub]="0.3"
      [showFirstStepImmediately]="true"
      (progressChange)="onProgressChange($event)"
      (currentStepChange)="onStepChange($event)"
    >
      <!-- Background Gradient Layer - Light warm tones like Blueyard -->
      <div
        class="gradient-background"
        [style.background]="currentGradient()"
      ></div>

      <!-- 3D Scene Layer -->
      <div class="scene-layer">
        <a3d-scene-3d [cameraPosition]="[0, -1, 8]" [cameraFov]="50">
          <!-- Soft ambient lighting -->
          <a3d-ambient-light [intensity]="0.6" [color]="'#ffffff'" />

          <!-- Main directional light from above -->
          <a3d-directional-light
            [position]="[5, 10, 8]"
            [intensity]="1.0"
            [color]="'#ffffff'"
          />

          <!-- Rim light for glass effect -->
          <a3d-directional-light
            [position]="[-5, 2, -5]"
            [intensity]="0.5"
            [color]="'#FFE4C4'"
          />

          <!-- Inner glow point light -->
          <a3d-point-light
            [position]="spherePosition()"
            [intensity]="2.0"
            [color]="currentGlowColor()"
            [distance]="10"
          />

          <!-- Main Glass Sphere - Positioned lower, glossy -->
          <a3d-sphere
            [position]="spherePosition()"
            [args]="[2.5, 128, 128]"
            [color]="currentSphereColor()"
            [emissive]="currentGlowColor()"
            [emissiveIntensity]="0.4"
            [metalness]="0.1"
            [roughness]="0.2"
          />

          <!-- Primary Particle Corona - Dense inner particles -->
          <a3d-particle-system
            [count]="8000"
            [spread]="3.5"
            [size]="0.015"
            [color]="'#ffffff'"
            [opacity]="0.9"
            distribution="sphere"
            [position]="particlePosition()"
          />

          <!-- Secondary Particle Layer - Scattered outer glow -->
          <a3d-particle-system
            [count]="4000"
            [spread]="5"
            [size]="0.02"
            [color]="currentGlowColor()"
            [opacity]="0.6"
            distribution="sphere"
            [position]="particlePosition()"
          />

          <!-- Tertiary Particle Layer - Wide atmosphere -->
          <a3d-particle-system
            [count]="2000"
            [spread]="8"
            [size]="0.025"
            [color]="'#ffffff'"
            [opacity]="0.3"
            distribution="sphere"
            [position]="[0, -1, 0]"
          />

          <!-- Bloom for glow effect -->
          <a3d-effect-composer>
            <a3d-bloom-effect
              [threshold]="0.3"
              [strength]="1.2"
              [radius]="0.8"
            />
          </a3d-effect-composer>
        </a3d-scene-3d>
      </div>

      <!-- Section Content Overlays - Dark text on light bg -->
      @for (section of sections; track section.id; let i = $index) {
      <div
        hijackedScrollItem
        [slideDirection]="'none'"
        [fadeIn]="true"
        [scale]="false"
        class="section-overlay"
      >
        <div class="section-content">
          <span class="section-number">{{
            (i + 1).toString().padStart(2, '0')
          }}</span>
          <h2 class="section-title">{{ section.title }}</h2>
          <p class="section-subtitle">{{ section.subtitle }}</p>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .blueyard-container {
        position: relative;
        width: 100%;
        min-height: 100vh;
        overflow: hidden;
      }

      .gradient-background {
        position: fixed;
        inset: 0;
        z-index: 0;
        transition: background 1s ease-out;
      }

      .scene-layer {
        position: fixed;
        inset: 0;
        z-index: 1;
        pointer-events: none;
      }

      .section-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 15vh;
        z-index: 10;
        pointer-events: none;
      }

      .section-content {
        text-align: center;
        color: #1a1a1a;
        max-width: 700px;
        padding: 2rem;
        pointer-events: auto;
      }

      .section-number {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        opacity: 0.5;
        margin-bottom: 1.5rem;
        color: #666;
      }

      .section-title {
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: clamp(2rem, 6vw, 3.5rem);
        font-weight: 400;
        line-height: 1.2;
        margin: 0 0 1.5rem;
        color: #1a1a1a;
        letter-spacing: -0.02em;
      }

      .section-subtitle {
        font-size: clamp(1rem, 2.5vw, 1.25rem);
        font-weight: 300;
        opacity: 0.7;
        margin: 0;
        line-height: 1.6;
        color: #333;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .section-overlay {
          padding-top: 10vh;
        }

        .section-content {
          padding: 1.5rem;
        }

        .section-number {
          font-size: 0.625rem;
          margin-bottom: 1rem;
        }
      }
    `,
  ],
})
export class BlueyardSceneComponent {
  private readonly destroyRef = inject(DestroyRef);
  private animationId: number | null = null;

  /**
   * Section configurations with Blueyard-inspired light themes
   */
  public readonly sections: SectionConfig[] = [
    {
      id: 'landing',
      title: 'Will it be Utopia, or Oblivion?',
      subtitle: 'Discover the power of scroll-driven 3D experiences',
      gradientStart: '#FFF8F0',
      gradientEnd: '#FFE4C4',
      sphereColor: '#FFDAB9',
      glowColor: '#FFB07C',
    },
    {
      id: 'computing',
      title: 'Computing',
      subtitle: 'Intelligence at the intersection of software and systems',
      gradientStart: '#F8F5FF',
      gradientEnd: '#E6D9FF',
      sphereColor: '#DDD6FE',
      glowColor: '#A78BFA',
    },
    {
      id: 'engineering',
      title: 'Engineering',
      subtitle: 'Building the infrastructure of tomorrow',
      gradientStart: '#F0F7FF',
      gradientEnd: '#DBEAFE',
      sphereColor: '#BFDBFE',
      glowColor: '#60A5FA',
    },
    {
      id: 'biology',
      title: 'Biology',
      subtitle: 'Life sciences transforming human health',
      gradientStart: '#F0FDF4',
      gradientEnd: '#D1FAE5',
      sphereColor: '#A7F3D0',
      glowColor: '#34D399',
    },
    {
      id: 'crypto',
      title: 'Crypto',
      subtitle: 'Decentralized systems reshaping finance',
      gradientStart: '#FFF1F2',
      gradientEnd: '#FFE4E6',
      sphereColor: '#FECDD3',
      glowColor: '#FB7185',
    },
  ];

  /**
   * Current scroll progress (0-1 across entire scroll)
   */
  public readonly progress = signal<number>(0);

  /**
   * Current section index (0-4)
   */
  public readonly currentStep = signal<number>(0);

  /**
   * Time signal for animations
   */
  public readonly time = signal<number>(0);

  /**
   * Current gradient based on active section
   */
  public readonly currentGradient = computed(() => {
    const step = this.currentStep();
    const section = this.sections[step] ?? this.sections[0];
    return `linear-gradient(180deg, ${section.gradientStart} 0%, ${section.gradientEnd} 100%)`;
  });

  /**
   * Sphere position - stays in lower half of viewport, subtle movement
   */
  public readonly spherePosition = computed((): [number, number, number] => {
    const p = this.progress();
    const t = this.time();
    // Sphere positioned low, with gentle floating motion
    const baseY = -1.5;
    const floatY = Math.sin(t * 0.5) * 0.15;
    const scrollY = p * 0.5; // Subtle rise with scroll
    return [0, baseY + floatY + scrollY, 0];
  });

  /**
   * Particle position follows sphere
   */
  public readonly particlePosition = computed((): [number, number, number] => {
    const [x, y, z] = this.spherePosition();
    return [x, y + 0.3, z];
  });

  /**
   * Current sphere color based on active section
   */
  public readonly currentSphereColor = computed(() => {
    const step = this.currentStep();
    return this.sections[step]?.sphereColor ?? this.sections[0].sphereColor;
  });

  /**
   * Current glow color based on active section
   */
  public readonly currentGlowColor = computed(() => {
    const step = this.currentStep();
    return this.sections[step]?.glowColor ?? this.sections[0].glowColor;
  });

  constructor() {
    afterNextRender(() => {
      // Start animation loop for time-based effects
      const startTime = performance.now();

      const animate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        this.time.set(elapsed);
        this.animationId = requestAnimationFrame(animate);
      };

      this.animationId = requestAnimationFrame(animate);

      this.destroyRef.onDestroy(() => {
        if (this.animationId !== null) {
          cancelAnimationFrame(this.animationId);
        }
      });
    });
  }

  /**
   * Handle scroll progress updates from HijackedScrollDirective
   */
  public onProgressChange(progress: number): void {
    this.progress.set(progress);
  }

  /**
   * Handle step/section changes from HijackedScrollDirective
   */
  public onStepChange(step: number): void {
    this.currentStep.set(step);
  }
}
