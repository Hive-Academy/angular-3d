import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AmbientLightComponent,
  BloomEffectComponent,
  BubbleTextComponent,
  EffectComposerComponent,
  Float3dDirective,
  FloatingSphereComponent,
  MouseTracking3dDirective,
  NebulaVolumetricComponent,
  PointLightComponent,
  Scene3dComponent,
  SpotLightComponent,
} from '@hive-academy/angular-3d';

/**
 * Bubble Dream Hero Scene - Interactive Skills Showcase
 *
 * Features:
 * - Volumetric nebula with pink/purple dreamy colors
 * - BubbleTextComponent with properly sized, readable bubbles
 * - Decorative floating bubbles on left and right sides
 * - Skills overlay section with bubble-themed cards
 * - Soft bloom for ethereal atmosphere
 *
 * @example
 * ```html
 * <app-bubble-dream-hero-scene />
 * ```
 */
@Component({
  selector: 'app-bubble-dream-hero-scene',
  standalone: true,
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    PointLightComponent,
    SpotLightComponent,
    NebulaVolumetricComponent,
    BubbleTextComponent,
    FloatingSphereComponent,
    Float3dDirective,
    EffectComposerComponent,
    BloomEffectComponent,
    MouseTracking3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hero-container">
      <!-- Layer 1: 3D Scene (background) -->
      <div class="scene-layer">
        <a3d-scene-3d
          [cameraPosition]="[0, 0, 15]"
          [cameraFov]="50"
          [enableAntialiasing]="true"
          [alpha]="false"
          [backgroundColor]="backgroundColor"
        >
          <!-- Very dim ambient for deep shadows -->
          <a3d-ambient-light [intensity]="0.15" />

          <!-- Main spotlight on SKILLS text - dramatic top-down illumination -->
          <a3d-spot-light
            [position]="[0, 16, -6]"
            [target]="[0, 8, -12]"
            [intensity]="120"
            [color]="'#ffffff'"
            [angle]="0.5"
            [penumbra]="0.6"
            [distance]="40"
            [decay]="1.2"
          />

          <!-- Accent rim light from left side - purple glow -->
          <a3d-point-light
            [position]="[-10, 10, -10]"
            [intensity]="25"
            [color]="'#a855f7'"
            [distance]="30"
            [decay]="2"
          />

          <!-- Subtle warm fill from right side - pink accent -->
          <a3d-point-light
            [position]="[10, 6, -8]"
            [intensity]="15"
            [color]="'#f472b6'"
            [distance]="25"
            [decay]="2"
          />

          <!-- ============ CORNER BUBBLE SPHERES (Realistic Physical Material) ============ -->

          <!-- Top-Left Corner Bubble -->
          <a3d-floating-sphere
            float3d
            [floatConfig]="{ height: 0.6, speed: 4000 }"
            [position]="[-15, 10, -15]"
            [args]="[2, 32, 32]"
            [color]="'#e879f9'"
            [metalness]="0.0"
            [roughness]="0.0"
            [transmission]="0.9"
            [thickness]="0.5"
            [ior]="1.4"
            [clearcoat]="1.0"
            [clearcoatRoughness]="0.0"
            mouseTracking3d
            [trackingConfig]="{
              sensitivity: 0.8,
              limit: 0.5,
              damping: 0.05,
              invertX: true,
              translationRange: [10, 5],
              invertPosX: true
            }"
          />
          <!-- Spotlight for Top-Left Bubble -->
          <a3d-spot-light
            [position]="[-12, 14, -8]"
            [target]="[-15, 10, -15]"
            [intensity]="40"
            [color]="'#e879f9'"
            [angle]="0.4"
            [penumbra]="0.8"
            [distance]="25"
            [decay]="1.5"
          />

          <!-- Top-Right Corner Bubble -->
          <a3d-floating-sphere
            float3d
            [floatConfig]="{ height: 0.8, speed: 5000 }"
            [position]="[15, 10, -14]"
            [args]="[2.5, 32, 32]"
            [color]="'#a855f7'"
            [metalness]="0.0"
            [roughness]="0.0"
            [transmission]="0.9"
            [thickness]="0.5"
            [ior]="1.4"
            [clearcoat]="1.0"
            [clearcoatRoughness]="0.0"
            mouseTracking3d
            [trackingConfig]="{
              sensitivity: 0.8,
              limit: 0.5,
              damping: 0.05,
              invertX: true,
              translationRange: [10, 5],
              invertPosX: true
            }"
          />
          <!-- Spotlight for Top-Right Bubble -->
          <a3d-spot-light
            [position]="[12, 14, -7]"
            [target]="[15, 10, -14]"
            [intensity]="40"
            [color]="'#a855f7'"
            [angle]="0.4"
            [penumbra]="0.8"
            [distance]="25"
            [decay]="1.5"
          />

          <!-- Bottom-Left Corner Bubble -->
          <a3d-floating-sphere
            float3d
            [floatConfig]="{ height: 0.5, speed: 3500 }"
            [position]="[-12, -8, -13]"
            [args]="[1.8, 32, 32]"
            [color]="'#f472b6'"
            [metalness]="0.0"
            [roughness]="0.0"
            [transmission]="0.9"
            [thickness]="0.5"
            [ior]="1.4"
            [clearcoat]="1.0"
            [clearcoatRoughness]="0.0"
            mouseTracking3d
            [trackingConfig]="{
              sensitivity: 0.8,
              limit: 0.5,
              damping: 0.05,
              invertY: true,
              translationRange: [10, 5],
              invertPosY: true
            }"
          />
          <!-- Spotlight for Bottom-Left Bubble -->
          <a3d-spot-light
            [position]="[-9, -4, -6]"
            [target]="[-12, -8, -13]"
            [intensity]="35"
            [color]="'#f472b6'"
            [angle]="0.4"
            [penumbra]="0.8"
            [distance]="20"
            [decay]="1.5"
          />

          <!-- Bottom-Right Corner Bubble -->
          <a3d-floating-sphere
            float3d
            [floatConfig]="{ height: 0.7, speed: 4500 }"
            [position]="[15, -10, -16]"
            [args]="[2.2, 32, 32]"
            [color]="'#d946ef'"
            [metalness]="0.0"
            [roughness]="0.0"
            [transmission]="0.9"
            [thickness]="0.5"
            [ior]="1.4"
            [clearcoat]="1.0"
            [clearcoatRoughness]="0.0"
            mouseTracking3d
            [trackingConfig]="{
              sensitivity: 0.8,
              limit: 0.5,
              damping: 0.05,
              invertY: true,
              translationRange: [10, 5],
              invertPosY: true
            }"
          />
          <!-- Spotlight for Bottom-Right Bubble -->
          <a3d-spot-light
            [position]="[12, -6, -9]"
            [target]="[15, -10, -16]"
            [intensity]="35"
            [color]="'#d946ef'"
            [angle]="0.4"
            [penumbra]="0.8"
            [distance]="40"
            [decay]="1.5"
          />

          <!-- Dreamy nebula background with pink/purple gradients -->
          <a3d-nebula-volumetric
            [position]="[0, 0, -20]"
            [width]="50"
            [height]="35"
            [primaryColor]="'#d946ef'"
            [secondaryColor]="'#8b5cf6'"
            [opacity]="0.5"
          />

          <!-- Main bubble text - realistic soap bubble material with mouse interaction -->
          <a3d-bubble-text
            [text]="'SKILLS'"
            [fontSize]="80"
            [fontScaleFactor]="0.065"
            [bubbleColor]="bubbleColor"
            [opacity]="0.85"
            [maxBubbleScale]="0.22"
            [minBubbleScale]="0.12"
            [bubblesPerPixel]="1.5"
            [animationMode]="'breathe'"
            [animationSpeed]="0.3"
            [animationIntensity]="0.4"
            [mouseProximityEffect]="true"
            [mouseRadius]="2.5"
            [mouseScaleBoost]="1.8"
            [enableFlying]="true"
            [flyingRatio]="0.08"
            [flySpeed]="0.2"
            [position]="[0, 8, -12]"
            [transmission]="0.95"
            [thickness]="0.3"
            [ior]="1.4"
            [iridescence]="1.0"
            [iridescenceIOR]="1.3"
            [iridescenceThicknessMin]="100"
            [iridescenceThicknessMax]="400"
            [clearcoat]="1.0"
            [clearcoatRoughness]="0.0"
            [roughness]="0.0"
            [metalness]="0.0"
            [envMapIntensity]="1.5"
          />

          <!-- Soft bloom for dreamy ethereal atmosphere -->
          <a3d-effect-composer>
            <a3d-bloom-effect
              [threshold]="0.5"
              [strength]="0.6"
              [radius]="0.8"
            />
          </a3d-effect-composer>
        </a3d-scene-3d>
      </div>

      <!-- Layer 2: Skills Overlay (foreground) -->
      <div class="overlay-layer">
        <!-- Header -->
        <header class="header">
          <div class="brand">
            <span class="brand-icon">◯</span>
            <span class="brand-text">Bubble Dream</span>
          </div>
          <nav class="nav-links">
            <a href="#" class="nav-link">About</a>
            <a href="#" class="nav-link">Work</a>
            <a href="#" class="nav-link">Contact</a>
          </nav>
        </header>

        <!-- Skills Grid -->
        <main class="skills-section">
          <div class="skills-intro">
            <p class="skills-label">What I Do</p>
            <h2 class="skills-headline">
              Crafting digital experiences<br />with code & creativity
            </h2>
          </div>

          <div class="skills-grid">
            @for (skill of skills(); track skill.name) {
            <div class="skill-card" [style.--accent-color]="skill.color">
              <div class="skill-icon">{{ skill.icon }}</div>
              <h3 class="skill-name">{{ skill.name }}</h3>
              <p class="skill-description">{{ skill.description }}</p>
              <div class="skill-level">
                <div class="skill-progress" [style.width.%]="skill.level"></div>
              </div>
            </div>
            }
          </div>
        </main>

        <!-- Footer tagline -->
        <footer class="footer">
          <p class="footer-text">
            Interactive 3D powered by
            <span class="highlight">Angular-3D</span>
          </p>
        </footer>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .hero-container {
        position: relative;
        width: 100%;
        height: 100vh;
        min-height: 700px;
        overflow: hidden;
      }

      /* Scene Layer */
      .scene-layer {
        position: absolute;
        inset: 0;
        z-index: 0;
      }

      /* Overlay Layer */
      .overlay-layer {
        position: absolute;
        inset: 0;
        z-index: 10;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        padding: 2rem 3rem;
      }

      /* Header */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        pointer-events: auto;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .brand-icon {
        font-size: 1.5rem;
        color: #e879f9;
        opacity: 0.9;
      }

      .brand-text {
        font-size: 1.1rem;
        font-weight: 500;
        letter-spacing: 0.02em;
        color: rgba(255, 255, 255, 0.9);
      }

      .nav-links {
        display: flex;
        gap: 2rem;
      }

      .nav-link {
        font-size: 0.875rem;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        transition: color 0.2s ease;
        letter-spacing: 0.02em;
      }

      .nav-link:hover {
        color: #e879f9;
      }

      /* Skills Section */
      .skills-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 2rem 0;
        gap: 2.5rem;
      }

      .skills-intro {
        text-align: center;
        margin-bottom: 1rem;
      }

      .skills-label {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #e879f9;
        margin-bottom: 0.75rem;
      }

      .skills-headline {
        font-family: 'Georgia', 'Times New Roman', serif;
        font-size: clamp(1.5rem, 3vw, 2.25rem);
        font-weight: 400;
        line-height: 1.4;
        color: #ffffff;
        margin: 0;
      }

      /* Skills Grid */
      .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.25rem;
        max-width: 900px;
        margin: 0 auto;
        width: 100%;
        pointer-events: auto;
      }

      .skill-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.5rem;
        transition: all 0.3s ease;
        cursor: default;
      }

      .skill-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: var(--accent-color, #e879f9);
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3),
          0 0 20px
            color-mix(in srgb, var(--accent-color, #e879f9) 20%, transparent);
      }

      .skill-icon {
        font-size: 2rem;
        margin-bottom: 0.75rem;
      }

      .skill-name {
        font-size: 1rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.5rem;
      }

      .skill-description {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.5;
        margin: 0 0 1rem;
      }

      .skill-level {
        height: 3px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
      }

      .skill-progress {
        height: 100%;
        background: linear-gradient(
          90deg,
          var(--accent-color, #e879f9),
          #a855f7
        );
        border-radius: 2px;
        transition: width 0.5s ease;
      }

      /* Footer */
      .footer {
        text-align: center;
        padding-top: 1rem;
      }

      .footer-text {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
      }

      .highlight {
        color: #e879f9;
        font-weight: 500;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .overlay-layer {
          padding: 1.5rem;
        }

        .nav-links {
          display: none;
        }

        .skills-grid {
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .skill-card {
          padding: 1.25rem;
        }
      }

      @media (max-width: 480px) {
        .skills-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class BubbleDreamHeroSceneComponent {
  public readonly backgroundColor = 0x0a0515;
  public readonly bubbleColor = 0xffffff;
  public readonly accentBubbleColor = 0xe879f9;

  /**
   * Skills data for the overlay cards
   */
  public readonly skills = signal([
    {
      icon: '⚛️',
      name: 'Angular',
      description: 'Building scalable web applications with modern Angular',
      level: 95,
      color: '#dd0031',
    },
    {
      icon: '🎨',
      name: 'Three.js',
      description: 'Creating immersive 3D experiences for the web',
      level: 88,
      color: '#049ef4',
    },
    {
      icon: '✨',
      name: 'WebGPU',
      description: 'Next-gen graphics with TSL shaders',
      level: 75,
      color: '#a855f7',
    },
    {
      icon: '🚀',
      name: 'TypeScript',
      description: 'Type-safe code for robust applications',
      level: 92,
      color: '#3178c6',
    },
  ]);
}
