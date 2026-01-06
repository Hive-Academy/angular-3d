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
 * Claude Skills Showcase Section
 *
 * Showcases our custom Claude Agent Skills:
 * - angular-3d-scene-crafter: 3D scene design via conversational AI
 * - angular-gsap-animation-crafter: Scroll animation design via conversational AI
 *
 * Design replicated from bubble-dream-hero-scene with updated content.
 *
 * @example
 * ```html
 * <app-claude-skills-showcase-section />
 * ```
 */
@Component({
  selector: 'app-claude-skills-showcase-section',
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
    <div class="showcase-container">
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

          <!-- Main spotlight on AI CRAFTED text -->
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

          <!-- Accent rim light from left - purple glow -->
          <a3d-point-light
            [position]="[-10, 10, -10]"
            [intensity]="25"
            [color]="'#a855f7'"
            [distance]="30"
            [decay]="2"
          />

          <!-- Warm fill from right - pink accent -->
          <a3d-point-light
            [position]="[10, 6, -8]"
            [intensity]="15"
            [color]="'#f472b6'"
            [distance]="25"
            [decay]="2"
          />

          <!-- ============ CORNER BUBBLE SPHERES ============ -->

          <!-- Top-Left Corner Bubble -->
          <!-- Top-Left: Reduced segments 32->24 for performance -->
          <a3d-floating-sphere
            float3d
            [floatConfig]="{ height: 0.6, speed: 4000 }"
            [position]="[-15, 10, -15]"
            [args]="[2, 24, 24]"
            [color]="'#e879f9'"
            [metalness]="0.0"
            [roughness]="0.0"
            [transmission]="0.9"
            [thickness]="0.5"
            [ior]="1.4"
            [clearcoat]="1.0"
            [clearcoatRoughness]="0.0"
          />
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
          <!-- Top-Right: Reduced segments 32->24 for performance -->
          <a3d-floating-sphere
            float3d
            [floatConfig]="{ height: 0.8, speed: 5000 }"
            [position]="[15, 10, -14]"
            [args]="[2.5, 24, 24]"
            [color]="'#a855f7'"
            [metalness]="0.0"
            [roughness]="0.0"
            [transmission]="0.9"
            [thickness]="0.5"
            [ior]="1.4"
            [clearcoat]="1.0"
            [clearcoatRoughness]="0.0"
          />
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
          <!-- Bottom-Left: Reduced segments 32->24 for performance -->
          <a3d-floating-sphere
            float3d
            [floatConfig]="{ height: 0.5, speed: 3500 }"
            [position]="[-12, -8, -13]"
            [args]="[1.8, 24, 24]"
            [color]="'#f472b6'"
            [metalness]="0.0"
            [roughness]="0.0"
            [transmission]="0.9"
            [thickness]="0.5"
            [ior]="1.4"
            [clearcoat]="1.0"
            [clearcoatRoughness]="0.0"
          />
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
          <!-- Bottom-Right: Reduced segments 32->24 for performance -->
          <a3d-floating-sphere
            float3d
            [floatConfig]="{ height: 0.7, speed: 4500 }"
            [position]="[15, -10, -16]"
            [args]="[2.2, 24, 24]"
            [color]="'#d946ef'"
            [metalness]="0.0"
            [roughness]="0.0"
            [transmission]="0.9"
            [thickness]="0.5"
            [ior]="1.4"
            [clearcoat]="1.0"
            [clearcoatRoughness]="0.0"
          />
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

          <!-- Dreamy nebula background -->
          <a3d-nebula-volumetric
            [position]="[0, 0, -20]"
            [width]="50"
            [height]="35"
            [primaryColor]="'#d946ef'"
            [secondaryColor]="'#8b5cf6'"
            [opacity]="0.5"
          />

          <!-- Main bubble text -->
          <a3d-bubble-text
            [text]="'AI CRAFTED'"
            [fontSize]="70"
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

          <!-- Soft bloom -->
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
            <span class="brand-icon">✨</span>
            <span class="brand-text">Claude Agent Skills</span>
          </div>
          <nav class="nav-links">
            <a
              href="https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview"
              target="_blank"
              class="nav-link"
              >Learn More</a
            >
          </nav>
        </header>

        <!-- Skills Section -->
        <main class="skills-section">
          <div class="skills-intro">
            <p class="skills-label">AI-Enhanced Development</p>
            <h2 class="skills-headline">
              Design stunning experiences<br />with conversational AI
            </h2>
          </div>

          <div class="skills-grid">
            @for (skill of skills(); track skill.name) {
            <div class="skill-card" [style.--accent-color]="skill.color">
              <div class="skill-icon">{{ skill.icon }}</div>
              <h3 class="skill-name">{{ skill.name }}</h3>
              <p class="skill-description">{{ skill.description }}</p>
              <div class="skill-features">
                @for (feature of skill.features; track feature) {
                <span class="feature-tag">{{ feature }}</span>
                }
              </div>
            </div>
            }
          </div>
        </main>

        <!-- Footer -->
        <footer class="footer">
          <p class="footer-text">
            Powered by
            <a
              href="https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview"
              target="_blank"
              class="highlight"
              >Claude Agent Skills</a
            >
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

      .showcase-container {
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
        grid-template-columns: repeat(2, minmax(280px, 1fr));
        gap: 1.5rem;
        max-width: 800px;
        margin: 0 auto;
        width: 100%;
        pointer-events: auto;
      }

      .skill-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.75rem;
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
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }

      .skill-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.5rem;
      }

      .skill-description {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.6;
        margin: 0 0 1rem;
      }

      .skill-features {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .feature-tag {
        font-size: 0.7rem;
        padding: 0.25rem 0.5rem;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 4px;
        color: rgba(255, 255, 255, 0.7);
      }

      /* Footer */
      .footer {
        text-align: center;
        padding-top: 1rem;
        pointer-events: auto;
      }

      .footer-text {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        margin: 0;
      }

      .highlight {
        color: #e879f9;
        font-weight: 500;
        text-decoration: none;
      }

      .highlight:hover {
        text-decoration: underline;
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
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .skill-card {
          padding: 1.25rem;
        }
      }
    `,
  ],
})
export class ClaudeSkillsShowcaseSectionComponent {
  public readonly backgroundColor = 0x0a0515;
  public readonly bubbleColor = 0xffffff;

  /**
   * Claude Agent Skills data
   */
  public readonly skills = signal([
    {
      icon: '🎨',
      name: '3D Scene Crafter',
      description:
        'Design stunning 3D scenes through conversational AI guidance. Analyzes reference images and generates production-ready Angular-3D code.',
      features: [
        'Image reverse-engineering',
        'Material recommendations',
        'Lighting setups',
        'Code generation',
      ],
      color: '#e879f9',
    },
    {
      icon: '✨',
      name: 'Animation Crafter',
      description:
        'Create smooth scroll-based animations with AI-guided design. Analyzes motion patterns and configures GSAP animations.',
      features: [
        'Motion analysis',
        'Timing optimization',
        'Scroll triggers',
        'GSAP configuration',
      ],
      color: '#a855f7',
    },
  ]);
}
