/**
 * NewpassiveHeroComponent - "NEWPASSIVE — Connecting Science to Global Wellness"
 *
 * Hybrid hero section:
 * - Three.js canvas (a3d-scene-3d) renders the cinematic space scene: starfield,
 *   nebula, night-side Earth with Fresnel atmosphere, sunrise bloom, network
 *   connection arcs/particles, central glass sphere with neon rings and a
 *   sparkle corona, bloom post-processing and slow camera drift.
 * - HTML/CSS overlay renders all UI/typography: navbar, gradient heading,
 *   subtitle, the in-sphere logo lockup, two glassmorphism portal cards and
 *   the 2/3 slider control.
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AmbientLightComponent,
  BloomEffectComponent,
  DirectionalLightComponent,
  EffectComposerComponent,
  GlassShellComponent,
  NebulaComponent,
  PlanetComponent,
  Scene3dComponent,
  SparkleCoronaComponent,
  SphereComponent,
  StarFieldComponent,
  TorusComponent,
} from '@hive-academy/angular-3d';
import { NewpassiveCameraDriftComponent } from './newpassive-camera-drift.component';
import { NewpassiveNetworkArcsComponent } from './newpassive-network-arcs.component';

@Component({
  selector: 'app-newpassive-hero',
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    StarFieldComponent,
    NebulaComponent,
    PlanetComponent,
    GlassShellComponent,
    SphereComponent,
    TorusComponent,
    SparkleCoronaComponent,
    EffectComposerComponent,
    BloomEffectComponent,
    NewpassiveNetworkArcsComponent,
    NewpassiveCameraDriftComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <!-- ==================== CANVAS LAYER (Three.js) ==================== -->
      <div class="scene-layer">
        <a3d-scene-3d
          [cameraPosition]="[0, 1.5, 20]"
          [cameraFov]="50"
          [backgroundColor]="spaceBackground"
          [powerPreference]="'high-performance'"
        >
          <!-- Lighting: cool ambient + warm sunrise key + cool fill -->
          <a3d-ambient-light [intensity]="0.35" [color]="'#8a93ff'" />
          <a3d-directional-light
            [position]="[0, -1, -25]"
            [target]="[0, 2, 10]"
            [intensity]="2.2"
            [color]="'#ff9a3c'"
          />
          <a3d-directional-light
            [position]="[-14, 12, 10]"
            [intensity]="0.45"
            [color]="'#7fb4ff'"
          />

          <!-- (1) Space / star background -->
          <a3d-star-field
            [starCount]="2600"
            [radius]="60"
            [multiSize]="true"
            [stellarColors]="true"
            [enableRotation]="true"
            [rotationSpeed]="0.004"
            [rotationAxis]="'y'"
          />
          <a3d-star-field
            [starCount]="1400"
            [radius]="85"
            [size]="0.02"
            [opacity]="0.5"
            [enableRotation]="true"
            [rotationSpeed]="0.007"
            [rotationAxis]="'y'"
          />

          <!-- Nebula wisps (purple left / blue right) -->
          <a3d-nebula
            [position]="[-20, 10, -45]"
            [cloudCount]="34"
            [radius]="16"
            [colorPalette]="['#7c3aed', '#4338ca', '#ec4899']"
            [minSize]="10"
            [maxSize]="26"
            [minOpacity]="0.03"
            [maxOpacity]="0.09"
            [enableFlow]="true"
            [flowSpeed]="0.008"
          />
          <a3d-nebula
            [position]="[22, 6, -50]"
            [cloudCount]="30"
            [radius]="15"
            [colorPalette]="['#1d4ed8', '#38bdf8', '#7c3aed']"
            [minSize]="10"
            [maxSize]="24"
            [minOpacity]="0.03"
            [maxOpacity]="0.08"
            [enableFlow]="true"
            [flowSpeed]="0.006"
          />

          <!-- (2) Night-side Earth curving across the lower half -->
          <a3d-planet
            [radius]="14"
            [segments]="96"
            [position]="[0, -16.5, 0]"
            [textureUrl]="'earth-night.jpg'"
            [emissive]="'#0a1636'"
            [emissiveIntensity]="0.12"
            [glowIntensity]="0"
          />

          <!-- (3) Fresnel atmospheric glow shell around the Earth -->
          <a3d-glass-shell
            [radius]="14.35"
            [segments]="96"
            [position]="[0, -16.5, 0]"
            [transmission]="1"
            [ior]="1.0"
            [roughness]="0.4"
            [thickness]="0.2"
            [edgeColor]="'#3d7bff'"
            [edgeIntensity]="1.3"
            [edgePower]="2.6"
          />

          <!-- (4) Sunrise bloom core peeking over the horizon -->
          <a3d-sphere
            [args]="[2.6, 32, 32]"
            [position]="[0, -4.4, -11]"
            [color]="'#ffb066'"
            [emissive]="'#ff8c3a'"
            [emissiveIntensity]="4"
          />

          <!-- (5)+(6) Network connection arcs + travelling particles -->
          <app-newpassive-network-arcs
            [earthCenter]="[0, -16.5, 0]"
            [earthRadius]="14"
            [arcCount]="8"
            [particlesPerArc]="2"
          />

          <!-- (7) Central glass sphere (physical transmission material) -->
          <a3d-glass-shell
            [radius]="3.4"
            [position]="[0, 0.6, 2]"
            [transmission]="0.97"
            [ior]="1.45"
            [roughness]="0.05"
            [thickness]="0.6"
            [edgeColor]="'#c084fc'"
            [edgeIntensity]="0.9"
            [edgePower]="2.4"
          />

          <!-- (8) Outer neon glow rings (purple / pink / blue) -->
          <a3d-torus
            [args]="[3.8, 0.045, 16, 160]"
            [position]="[0, 0.6, 2]"
            [rotation]="[0.12, 0.18, 0]"
            [color]="'#a855f7'"
            [emissive]="'#a855f7'"
            [emissiveIntensity]="2.6"
          />
          <a3d-torus
            [args]="[4.0, 0.03, 16, 160]"
            [position]="[0, 0.6, 2]"
            [rotation]="[1.42, 0, 0.22]"
            [color]="'#ec4899'"
            [emissive]="'#ec4899'"
            [emissiveIntensity]="2.2"
          />
          <a3d-torus
            [args]="[4.2, 0.022, 16, 160]"
            [position]="[0, 0.6, 2]"
            [rotation]="[1.28, 0.15, -0.3]"
            [color]="'#38bdf8'"
            [emissive]="'#38bdf8'"
            [emissiveIntensity]="2.0"
          />

          <!-- Sparkle corona hugging the glass sphere -->
          <a3d-sparkle-corona
            [count]="1600"
            [innerRadius]="3.5"
            [outerRadius]="4.4"
            [position]="[0, 0.6, 2]"
            [baseSize]="0.045"
            [twinkleSpeed]="2.4"
          />

          <!-- (14) Very slow cinematic camera drift -->
          <app-newpassive-camera-drift
            [amplitude]="0.6"
            [lookAt]="[0, -0.5, 0]"
          />

          <!-- (13) Bloom post-processing -->
          <a3d-effect-composer [enabled]="true">
            <a3d-bloom-effect
              [threshold]="0.32"
              [strength]="0.9"
              [radius]="0.6"
            />
          </a3d-effect-composer>
        </a3d-scene-3d>
      </div>

      <!-- ==================== HTML/CSS OVERLAY LAYER ==================== -->
      <div class="overlay">
        <!-- Navbar -->
        <nav class="navbar">
          <a class="brand" href="#">
            <span class="brand-mark"></span>
            NEWPASSIVE
          </a>
          <ul class="nav-links">
            <li><a class="active" href="#">HOME</a></li>
            <li><a href="#">ABOUT US</a></li>
            <li><a href="#">OUR SERVICES</a></li>
            <li><a href="#">CONTACT US</a></li>
          </ul>
        </nav>

        <!-- Heading + subtitle -->
        <header class="headline">
          <h1>CONNECTING SCIENCE<br />TO GLOBAL WELLNESS</h1>
          <p>
            Bridging breakthrough research and everyday health — one connected
            ecosystem uniting distributors, providers and patients across the
            globe.
          </p>
        </header>

        <!-- Logo lockup, visually inside the central glass sphere -->
        <div class="sphere-lockup">
          <div class="lockup-logo">NEWPASSIVE</div>
          <div class="lockup-divider"></div>
          <div class="lockup-tagline">
            A CONNECTED ECOSYSTEM<br />FOR A HEALTHIER WORLD
          </div>
        </div>

        <!-- Left glassmorphism card: Distribution Portal -->
        <aside class="glass-card card-left">
          <div class="card-icon">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 7l9-4 9 4-9 4-9-4z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              <path
                d="M3 12l9 4 9-4M3 17l9 4 9-4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3>DISTRIBUTION PORTAL</h3>
          <p>
            Manage inventory, orders and global logistics from a single command
            center.
          </p>
          <a class="card-cta" href="#">ENTER PORTAL <span>&rarr;</span></a>
        </aside>

        <!-- Right glassmorphism card: Healthcare Portal -->
        <aside class="glass-card card-right">
          <div class="card-icon icon-pink">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 21s-7.5-4.6-9.5-9A5.5 5.5 0 0 1 12 6.3 5.5 5.5 0 0 1 21.5 12c-2 4.4-9.5 9-9.5 9z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              <path
                d="M7 12h3l1.5-3 2 5L15 12h2"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h3>HEALTHCARE PORTAL</h3>
          <p>
            Clinical insights, patient programs and provider tools — connected
            in real time.
          </p>
          <a class="card-cta" href="#">ENTER PORTAL <span>&rarr;</span></a>
        </aside>

        <!-- Bottom slider control -->
        <div class="slider">
          <button
            type="button"
            class="slider-btn"
            aria-label="Previous slide"
            (click)="previousSlide()"
          >
            &larr;
          </button>
          <span class="slider-count">{{ slide() }}/{{ totalSlides }}</span>
          <button
            type="button"
            class="slider-btn"
            aria-label="Next slide"
            (click)="nextSlide()"
          >
            &rarr;
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .hero {
        position: relative;
        /* Paint above the demo app's fixed shell navbar (z-50) so the hero
           replica is standalone on this route */
        z-index: 60;
        width: 100%;
        height: 100vh;
        min-height: 640px;
        overflow: hidden;
        background: #040110;
        color: #e7e9ff;
        font-family: 'Segoe UI', 'Inter', system-ui, sans-serif;
      }

      .scene-layer {
        position: absolute;
        inset: 0;
      }

      .scene-layer a3d-scene-3d {
        display: block;
        width: 100%;
        height: 100%;
      }

      /* ---------------- Overlay ---------------- */
      .overlay {
        position: absolute;
        inset: 0;
        z-index: 10;
        pointer-events: none;
      }

      .overlay a,
      .overlay button {
        pointer-events: auto;
      }

      /* ---------------- Navbar ---------------- */
      .navbar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.4rem 3.5rem;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 1.05rem;
        font-weight: 700;
        letter-spacing: 0.35em;
        color: #ffffff;
        text-decoration: none;
      }

      .brand-mark {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: linear-gradient(135deg, #38bdf8, #a855f7, #ec4899);
        box-shadow: 0 0 12px rgba(168, 85, 247, 0.9);
      }

      .nav-links {
        display: flex;
        gap: 2.4rem;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .nav-links a {
        font-size: 0.72rem;
        letter-spacing: 0.22em;
        color: rgba(231, 233, 255, 0.72);
        text-decoration: none;
      }

      .nav-links a:hover,
      .nav-links a.active {
        color: #ffffff;
      }

      /* ---------------- Headline ---------------- */
      .headline {
        position: absolute;
        top: 12%;
        left: 50%;
        transform: translateX(-50%);
        width: min(880px, 92vw);
        text-align: center;
      }

      .headline h1 {
        margin: 0;
        font-size: clamp(2rem, 4.6vw, 3.6rem);
        font-weight: 800;
        line-height: 1.12;
        letter-spacing: 0.14em;
        background: linear-gradient(
          92deg,
          #7dd3fc 0%,
          #c084fc 48%,
          #f472b6 100%
        );
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        color: transparent;
        filter: drop-shadow(0 0 24px rgba(168, 85, 247, 0.35));
      }

      .headline p {
        margin: 1.1rem auto 0;
        max-width: 560px;
        font-size: 0.92rem;
        line-height: 1.7;
        letter-spacing: 0.05em;
        color: rgba(231, 233, 255, 0.68);
      }

      /* ---------------- In-sphere logo lockup ---------------- */
      .sphere-lockup {
        position: absolute;
        top: 54%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .lockup-logo {
        font-size: clamp(1.1rem, 2vw, 1.6rem);
        font-weight: 800;
        letter-spacing: 0.42em;
        color: #ffffff;
        text-shadow: 0 0 18px rgba(192, 132, 252, 0.9),
          0 0 42px rgba(56, 189, 248, 0.5);
      }

      .lockup-divider {
        width: 120px;
        height: 1px;
        margin: 0.7rem auto;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(192, 132, 252, 0.9),
          transparent
        );
      }

      .lockup-tagline {
        font-size: 0.6rem;
        letter-spacing: 0.32em;
        line-height: 1.9;
        color: rgba(240, 242, 255, 0.95);
        text-shadow: 0 0 10px rgba(4, 1, 16, 0.95),
          0 1px 4px rgba(4, 1, 16, 0.9);
      }

      /* ---------------- Glass cards ---------------- */
      .glass-card {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 240px;
        padding: 1.6rem 1.5rem;
        border-radius: 18px;
        background: rgba(88, 60, 160, 0.1);
        border: 1px solid rgba(168, 85, 247, 0.35);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 0 0 32px rgba(168, 85, 247, 0.28),
          inset 0 0 24px rgba(168, 85, 247, 0.08);
        text-align: left;
      }

      .card-left {
        left: 5vw;
      }

      .card-right {
        right: 5vw;
        border-color: rgba(236, 72, 153, 0.35);
        box-shadow: 0 0 32px rgba(236, 72, 153, 0.26),
          inset 0 0 24px rgba(236, 72, 153, 0.08);
      }

      .card-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        margin-bottom: 1rem;
        border-radius: 12px;
        color: #7dd3fc;
        background: rgba(56, 189, 248, 0.12);
        border: 1px solid rgba(56, 189, 248, 0.4);
        box-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
      }

      .card-icon svg {
        width: 24px;
        height: 24px;
      }

      .icon-pink {
        color: #f472b6;
        background: rgba(236, 72, 153, 0.12);
        border-color: rgba(236, 72, 153, 0.4);
        box-shadow: 0 0 16px rgba(236, 72, 153, 0.35);
      }

      .glass-card h3 {
        margin: 0 0 0.5rem;
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.22em;
        color: #ffffff;
      }

      .glass-card p {
        margin: 0 0 1.1rem;
        font-size: 0.74rem;
        line-height: 1.6;
        color: rgba(231, 233, 255, 0.62);
      }

      .card-cta {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.2em;
        color: #c084fc;
        text-decoration: none;
      }

      .card-cta:hover {
        color: #f0abfc;
      }

      /* ---------------- Slider ---------------- */
      .slider {
        position: absolute;
        bottom: 4.5%;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 1.2rem;
      }

      .slider-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        font-size: 1rem;
        color: #e7e9ff;
        background: rgba(88, 60, 160, 0.14);
        border: 1px solid rgba(168, 85, 247, 0.45);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 0 18px rgba(168, 85, 247, 0.3);
        cursor: pointer;
      }

      .slider-btn:hover {
        border-color: rgba(236, 72, 153, 0.7);
      }

      .slider-count {
        font-size: 0.8rem;
        letter-spacing: 0.3em;
        color: rgba(231, 233, 255, 0.85);
      }

      /* ---------------- Responsive ---------------- */
      @media (max-width: 1100px) {
        .card-left {
          left: 3vw;
        }
        .card-right {
          right: 3vw;
        }
      }

      @media (max-width: 860px) {
        .navbar {
          padding: 1.1rem 1.4rem;
        }

        .nav-links {
          gap: 1.2rem;
        }

        .glass-card {
          top: auto;
          bottom: 14%;
          transform: none;
          width: 200px;
          padding: 1.1rem 1rem;
        }

        .headline {
          top: 14%;
        }
      }

      @media (max-width: 640px) {
        .nav-links {
          display: none;
        }

        .glass-card {
          display: none;
        }

        .sphere-lockup {
          top: 50%;
        }
      }
    `,
  ],
})
export class NewpassiveHeroComponent {
  /** Deep-space scene clear color (hex literals are not valid in templates) */
  protected readonly spaceBackground = 0x040110;

  /** Total slides advertised by the hero slider */
  protected readonly totalSlides = 3;

  /** Current slide (reference shows 2/3) */
  protected readonly slide = signal(2);

  protected previousSlide(): void {
    this.slide.update((s) => (s === 1 ? this.totalSlides : s - 1));
  }

  protected nextSlide(): void {
    this.slide.update((s) => (s === this.totalSlides ? 1 : s + 1));
  }
}
