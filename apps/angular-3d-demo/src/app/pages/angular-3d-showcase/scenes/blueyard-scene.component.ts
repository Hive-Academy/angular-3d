/**
 * BlueyardSceneComponent - Blueyard-Inspired Hijacked Scroll Demo
 *
 * A full-viewport scroll experience inspired by blueyard.com that demonstrates
 * the integration between @hive-academy/angular-gsap hijacked scroll directives
 * and @hive-academy/angular-3d 3D scene rendering.
 *
 * Visual Reference (blueyard.com):
 * - Warm cream/peach gradient backgrounds (light theme)
 * - HUGE glass-like sphere with internal glow (like a sun)
 * - Dense sparkling particle halo around sphere
 * - Inner particles that glow within the sphere
 * - Sphere moves to top-right as user scrolls
 * - Dark text on light backgrounds
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
        <a3d-scene-3d [cameraPosition]="[0, 0, 12]" [cameraFov]="60">
          <!-- Soft ambient lighting - ONLY light source for natural look -->
          <a3d-ambient-light [intensity]="0.4" [color]="'#ffffff'" />

          <!-- HUGE Main Sphere - Sun-like, moves to top-right -->
          <a3d-sphere
            [position]="spherePosition()"
            [args]="[5, 128, 128]"
            [color]="currentSphereColor()"
            [emissive]="currentGlowColor()"
            [emissiveIntensity]="2.2"
            [metalness]="0.2"
            [roughness]="0.1"
          />

          <!-- Inner Particles - Dense glow INSIDE the sphere -->
          <a3d-particle-system
            [count]="20000"
            [spread]="4.5"
            [size]="0.06"
            [color]="currentGlowColor()"
            [opacity]="1.0"
            distribution="sphere"
            [position]="spherePosition()"
          />

          <!-- Corona Particles - Halo around the sphere -->
          <a3d-particle-system
            [count]="15000"
            [spread]="6"
            [size]="0.05"
            [color]="'#ffffff'"
            [opacity]="1.0"
            distribution="sphere"
            [position]="particleHaloPosition()"
          />

          <!-- Outer Glow Particles - Wider atmospheric glow -->
          <a3d-particle-system
            [count]="10000"
            [spread]="9"
            [size]="0.04"
            [color]="currentGlowColor()"
            [opacity]="0.8"
            distribution="sphere"
            [position]="particleHaloPosition()"
          />

          <!-- Scattered Sparkles - Wide field -->
          <a3d-particle-system
            [count]="5000"
            [spread]="15"
            [size]="0.03"
            [color]="'#ffffff'"
            [opacity]="0.6"
            distribution="sphere"
            [position]="[0, 0, 0]"
          />

          <!-- Strong Bloom for glow effect -->
          <a3d-effect-composer>
            <a3d-bloom-effect
              [threshold]="0.15"
              [strength]="2.5"
              [radius]="1.2"
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
        transition: background 1.2s ease-out;
      }

      .scene-layer {
        position: fixed;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background: transparent;
      }

      .section-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 10vh;
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
        opacity: 0.4;
        margin-bottom: 1.5rem;
        color: #555;
      }

      .section-title {
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: clamp(1.8rem, 5vw, 3rem);
        font-weight: 400;
        line-height: 1.3;
        margin: 0 0 1.5rem;
        color: #1a1a1a;
        letter-spacing: -0.01em;
      }

      .section-subtitle {
        font-size: clamp(0.9rem, 2vw, 1.1rem);
        font-weight: 300;
        opacity: 0.6;
        margin: 0;
        line-height: 1.6;
        color: #333;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .section-overlay {
          padding-top: 8vh;
        }

        .section-content {
          padding: 1rem;
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
      glowColor: '#FF8C50',
    },
    {
      id: 'computing',
      title: 'Computing',
      subtitle: 'Intelligence at the intersection of software and systems',
      gradientStart: '#F8F5FF',
      gradientEnd: '#E6D9FF',
      sphereColor: '#DDD6FE',
      glowColor: '#8B5CF6',
    },
    {
      id: 'engineering',
      title: 'Engineering',
      subtitle: 'Building the infrastructure of tomorrow',
      gradientStart: '#F0F7FF',
      gradientEnd: '#DBEAFE',
      sphereColor: '#BFDBFE',
      glowColor: '#3B82F6',
    },
    {
      id: 'biology',
      title: 'Biology',
      subtitle: 'Life sciences transforming human health',
      gradientStart: '#F0FDF4',
      gradientEnd: '#D1FAE5',
      sphereColor: '#A7F3D0',
      glowColor: '#10B981',
    },
    {
      id: 'crypto',
      title: 'Crypto',
      subtitle: 'Decentralized systems reshaping finance',
      gradientStart: '#FFF1F2',
      gradientEnd: '#FFE4E6',
      sphereColor: '#FECDD3',
      glowColor: '#F43F5E',
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
   * Time signal for subtle animations
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
   * Sphere position - starts at bottom center, moves to top-right like a rising sun
   */
  public readonly spherePosition = computed((): [number, number, number] => {
    const p = this.progress();
    const t = this.time();

    // Start: bottom center (0, -6, 0)
    // End: top right (4, 4, -2)
    const startX = 0;
    const startY = -6;
    const endX = 4;
    const endY = 4;

    // Interpolate position based on scroll progress
    const x = startX + (endX - startX) * p;
    const y = startY + (endY - startY) * p;

    // Add subtle floating animation
    const floatY = Math.sin(t * 0.3) * 0.1;
    const floatX = Math.cos(t * 0.2) * 0.05;

    return [x + floatX, y + floatY, -2];
  });

  /**
   * Particle halo position - centered slightly above the sphere
   */
  public readonly particleHaloPosition = computed(
    (): [number, number, number] => {
      const [x, y, z] = this.spherePosition();
      return [x, y + 0.5, z];
    }
  );

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

  public constructor() {
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
