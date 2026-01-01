/**
 * BlueyardSceneComponent - Blueyard-Inspired Hijacked Scroll Demo
 *
 * A full-viewport scroll experience inspired by blueyard.com that demonstrates
 * the integration between @hive-academy/angular-gsap hijacked scroll directives
 * and @hive-academy/angular-3d 3D scene rendering.
 *
 * Key Features:
 * - Hijacked scroll with 5 themed sections (Lenis smooth scroll)
 * - 3D particle sphere that responds to scroll progress
 * - CSS gradient backgrounds that transition between sections
 * - Post-processing effects: Bloom + ChromaticAberration + FilmGrain
 * - Mobile responsive with touch scroll support
 *
 * Section Themes (from Blueyard research - TASK_2025_033):
 * 1. Landing - Warm peach gradient (#FF9F7F -> #FFD4C4)
 * 2. Computing - Purple gradient (#8B5CF6 -> #C4B5FD)
 * 3. Engineering - Blue gradient (#3B82F6 -> #93C5FD)
 * 4. Biology - Teal gradient (#14B8A6 -> #5EEAD4)
 * 5. Crypto - Pink gradient (#EC4899 -> #F9A8D4)
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  Scene3dComponent,
  ParticleSystemComponent,
  SphereComponent,
  EffectComposerComponent,
  BloomEffectComponent,
  ChromaticAberrationEffectComponent,
  FilmGrainEffectComponent,
  ColorGradingEffectComponent,
  Rotate3dDirective,
  AmbientLightComponent,
  DirectionalLightComponent,
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
  gradient: string;
  sphereColor: string;
  particleColor: string;
  slideDirection: 'left' | 'right' | 'up' | 'down' | 'none';
}

/**
 * BlueyardSceneComponent - Showcases hijacked scroll + 3D scene integration
 *
 * Demonstrates the power of combining angular-gsap scroll animations with
 * angular-3d rendering for immersive scroll-driven 3D experiences.
 */
@Component({
  selector: 'app-blueyard-scene',
  standalone: true,
  imports: [
    Scene3dComponent,
    ParticleSystemComponent,
    SphereComponent,
    EffectComposerComponent,
    BloomEffectComponent,
    ChromaticAberrationEffectComponent,
    FilmGrainEffectComponent,
    ColorGradingEffectComponent,
    Rotate3dDirective,
    AmbientLightComponent,
    DirectionalLightComponent,
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
      [scrub]="0.5"
      [showFirstStepImmediately]="true"
      (progressChange)="onProgressChange($event)"
      (currentStepChange)="onStepChange($event)"
    >
      <!-- Background Gradient Layer - Transitions based on current step -->
      <div
        class="gradient-background"
        [style.background]="currentGradient()"
      ></div>

      <!-- 3D Scene Layer - Transparent to show gradient behind -->
      <div class="scene-layer">
        <a3d-scene-3d [cameraPosition]="[0, 0, 12]" [cameraFov]="60">
          <!-- Lighting Setup -->
          <a3d-ambient-light [intensity]="0.4" />
          <a3d-directional-light
            [position]="[5, 5, 10]"
            [intensity]="1.2"
            [color]="'#ffffff'"
          />

          <!-- Central Sphere - Position and color respond to scroll -->
          <a3d-sphere
            [position]="spherePosition()"
            [args]="[2, 64, 64]"
            [color]="currentSphereColor()"
            [emissive]="currentSphereColor()"
            [emissiveIntensity]="0.4"
            [metalness]="0.2"
            [roughness]="0.6"
            rotate3d
            [rotateConfig]="{ axis: 'y', speed: 0.3 }"
          />

          <!-- Particle Corona around Sphere -->
          <a3d-particle-system
            [count]="2000"
            [spread]="4"
            [size]="0.02"
            [color]="currentParticleColor()"
            [opacity]="particleOpacity()"
            distribution="sphere"
            [position]="particlePosition()"
          />

          <!-- Secondary Outer Particle Layer -->
          <a3d-particle-system
            [count]="1000"
            [spread]="8"
            [size]="0.015"
            [color]="currentParticleColor()"
            [opacity]="0.4"
            distribution="sphere"
            [position]="[0, 0, 0]"
          />

          <!-- Post-processing Effects Stack -->
          <a3d-effect-composer>
            <a3d-bloom-effect
              [threshold]="0.6"
              [strength]="0.8"
              [radius]="0.5"
            />
            <a3d-chromatic-aberration-effect [intensity]="0.015" />
            <a3d-film-grain-effect [intensity]="0.08" [speed]="1.0" />
            <a3d-color-grading-effect
              [vignette]="0.35"
              [saturation]="1.1"
              [contrast]="1.05"
            />
          </a3d-effect-composer>
        </a3d-scene-3d>
      </div>

      <!-- Section Content Overlays -->
      @for (section of sections; track section.id; let i = $index) {
      <div
        hijackedScrollItem
        [slideDirection]="section.slideDirection"
        [fadeIn]="true"
        [scale]="true"
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
        transition: background 0.8s ease-out;
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
        align-items: center;
        justify-content: center;
        z-index: 10;
        pointer-events: none;
      }

      .section-content {
        text-align: center;
        color: white;
        max-width: 600px;
        padding: 2rem;
        pointer-events: auto;
      }

      .section-number {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        opacity: 0.6;
        margin-bottom: 1rem;
      }

      .section-title {
        font-size: clamp(2.5rem, 8vw, 5rem);
        font-weight: 700;
        line-height: 1.1;
        margin: 0 0 1rem;
        text-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
      }

      .section-subtitle {
        font-size: clamp(1rem, 3vw, 1.5rem);
        font-weight: 400;
        opacity: 0.85;
        margin: 0;
        line-height: 1.5;
        text-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .section-content {
          padding: 1.5rem;
        }

        .section-number {
          font-size: 0.75rem;
        }
      }
    `,
  ],
})
export class BlueyardSceneComponent {
  /**
   * Section configurations with Blueyard-inspired themes
   */
  public readonly sections: SectionConfig[] = [
    {
      id: 'landing',
      title: 'Welcome',
      subtitle: 'Discover the power of scroll-driven 3D experiences',
      gradient:
        'linear-gradient(135deg, #FF9F7F 0%, #FFD4C4 50%, #FFECB3 100%)',
      sphereColor: '#FF9F7F',
      particleColor: '#FFD4C4',
      slideDirection: 'up',
    },
    {
      id: 'computing',
      title: 'Computing',
      subtitle: 'Intelligence at the intersection of software and systems',
      gradient:
        'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C4B5FD 100%)',
      sphereColor: '#8B5CF6',
      particleColor: '#C4B5FD',
      slideDirection: 'left',
    },
    {
      id: 'engineering',
      title: 'Engineering',
      subtitle: 'Building the infrastructure of tomorrow',
      gradient:
        'linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)',
      sphereColor: '#3B82F6',
      particleColor: '#93C5FD',
      slideDirection: 'right',
    },
    {
      id: 'biology',
      title: 'Biology',
      subtitle: 'Life sciences transforming human health',
      gradient:
        'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)',
      sphereColor: '#14B8A6',
      particleColor: '#5EEAD4',
      slideDirection: 'left',
    },
    {
      id: 'crypto',
      title: 'Crypto',
      subtitle: 'Decentralized systems reshaping finance',
      gradient:
        'linear-gradient(135deg, #EC4899 0%, #F472B6 50%, #F9A8D4 100%)',
      sphereColor: '#EC4899',
      particleColor: '#F9A8D4',
      slideDirection: 'up',
    },
  ];

  /**
   * Gradients array for quick lookup
   */
  private readonly gradients = this.sections.map((s) => s.gradient);

  /**
   * Current scroll progress (0-1 across entire scroll)
   */
  public readonly progress = signal<number>(0);

  /**
   * Current section index (0-4)
   */
  public readonly currentStep = signal<number>(0);

  /**
   * Current gradient based on active section
   */
  public readonly currentGradient = computed(() => {
    const step = this.currentStep();
    return this.gradients[step] ?? this.gradients[0];
  });

  /**
   * Sphere position - rises with scroll progress
   */
  public readonly spherePosition = computed((): [number, number, number] => {
    const p = this.progress();
    // Sphere rises from y=-2 to y=2 as user scrolls
    const y = p * 4 - 2;
    // Slight x oscillation for organic movement
    const x = Math.sin(p * Math.PI * 2) * 0.5;
    return [x, y, 0];
  });

  /**
   * Particle position follows sphere with slight offset
   */
  public readonly particlePosition = computed((): [number, number, number] => {
    const [x, y, z] = this.spherePosition();
    return [x, y * 0.8, z];
  });

  /**
   * Particle opacity pulses based on scroll progress
   */
  public readonly particleOpacity = computed(() => {
    const p = this.progress();
    // Opacity pulses between 0.5 and 0.9
    return 0.5 + Math.sin(p * Math.PI * 4) * 0.2 + 0.2;
  });

  /**
   * Current sphere color based on active section
   */
  public readonly currentSphereColor = computed(() => {
    const step = this.currentStep();
    return this.sections[step]?.sphereColor ?? this.sections[0].sphereColor;
  });

  /**
   * Current particle color based on active section
   */
  public readonly currentParticleColor = computed(() => {
    const step = this.currentStep();
    return this.sections[step]?.particleColor ?? this.sections[0].particleColor;
  });

  /**
   * Handle scroll progress updates from HijackedScrollDirective
   *
   * @param progress - Overall scroll progress (0-1)
   */
  public onProgressChange(progress: number): void {
    this.progress.set(progress);
  }

  /**
   * Handle step/section changes from HijackedScrollDirective
   *
   * @param step - Current section index (0-based)
   */
  public onStepChange(step: number): void {
    this.currentStep.set(step);
  }
}
