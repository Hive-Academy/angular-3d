/**
 * Marble Hero Scene - Example Hero Section with 3D Background
 *
 * Demonstrates how to combine <a3d-marble-sphere> with HTML overlays
 * for a hero section with 3D background.
 *
 * Key patterns demonstrated:
 * 1. Using MarbleSphereComponent for animated marble effect
 * 2. Layering HTML content above 3D canvas
 * 3. Auto-rotating orbit controls for ambient movement
 * 4. Simple lighting setup for glossy materials
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  MarbleSphereComponent,
  OrbitControlsComponent,
  PointLightComponent,
  Scene3dComponent,
  SpotLightComponent,
} from '@hive-academy/angular-3d';

/**
 * Content Component - Contains 3D elements
 */
@Component({
  selector: 'app-marble-hero-content',
  standalone: true,
  imports: [
    SpotLightComponent,
    PointLightComponent,
    OrbitControlsComponent,
    MarbleSphereComponent,
  ],
  template: `
    <!-- Marble sphere with default emerald/teal colors -->
    <a3d-marble-sphere
      [radius]="0.2"
      [position]="[0, 0.25, 0]"
      [colorA]="'#001a13'"
      [colorB]="'#66e5b3'"
      [edgeColor]="'#4cd9a8'"
      [animationSpeed]="0.3"
      [iterations]="16"
    />

    <!-- Main spotlight for volumetric feel -->
    <a3d-spot-light
      [position]="[0.5, 0.7, 0.5]"
      [angle]="Math.PI / 4"
      [penumbra]="0.9"
      [decay]="2"
      [distance]="3"
      [intensity]="4"
      [castShadow]="true"
      [color]="spotlightColor"
    />

    <!-- Teal accent light -->
    <a3d-point-light
      [position]="[0.5, 0.3, 0.3]"
      [color]="tealAccent"
      [intensity]="2"
      [distance]="2"
    />

    <!-- Cool backlight -->
    <a3d-point-light
      [position]="[-0.5, 0.2, -0.3]"
      [color]="coolBacklight"
      [intensity]="1"
      [distance]="2"
    />

    <!-- Auto-rotating orbit controls -->
    <a3d-orbit-controls
      [target]="[0, 0.25, 0]"
      [maxDistance]="1.5"
      [minDistance]="0.4"
      [autoRotate]="true"
      [autoRotateSpeed]="0.6"
      [enableDamping]="true"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarbleHeroContentComponent {
  protected readonly Math = Math;

  // Light colors as component properties (Angular templates can't parse hex directly)
  protected readonly spotlightColor = 0xffffff;
  protected readonly tealAccent = 0x00897b;
  protected readonly coolBacklight = 0x26a69a;
}

/**
 * Parent Container with HTML Overlay
 */
@Component({
  selector: 'app-marble-hero-scene',
  standalone: true,
  imports: [Scene3dComponent, MarbleHeroContentComponent],
  template: `
    <div class="hero-container">
      <!-- 3D Scene Background -->
      <a3d-scene-3d
        [cameraPosition]="[0, 0.35, 0.7]"
        [cameraNear]="0.025"
        [cameraFar]="5"
        [frameloop]="'always'"
        [backgroundColor]="backgroundColor"
        [enableShadows]="true"
      >
        <app-marble-hero-content />
      </a3d-scene-3d>

      <!-- HTML Overlay Content -->
      <div class="hero-overlay">
        <h1 class="hero-title">Magical Marble</h1>
        <p class="hero-subtitle">
          Raymarched volumetric interior with glossy glass shell
        </p>
        <div class="hero-cta">
          <button class="cta-button">Get Started</button>
          <button class="cta-button secondary">Learn More</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 85vh;
        min-height: 500px;
        position: relative;
      }

      .hero-container {
        position: relative;
        width: 100%;
        height: 100%;
      }

      a3d-scene-3d {
        position: absolute;
        inset: 0;
        z-index: 0;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        pointer-events: none;
        text-align: center;
      }

      .hero-title {
        font-size: clamp(2.5rem, 8vw, 5rem);
        font-weight: 700;
        color: white;
        margin: 0 0 1rem;
        text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      }

      .hero-subtitle {
        font-size: clamp(1rem, 3vw, 1.5rem);
        color: rgba(255, 255, 255, 0.8);
        margin: 0 0 2rem;
        max-width: 600px;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
      }

      .hero-cta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;
        pointer-events: auto;
      }

      .cta-button {
        padding: 0.875rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        border: none;
        border-radius: 9999px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        background: linear-gradient(135deg, #4cd9a8, #26a69a);
        color: white;
      }

      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(76, 217, 168, 0.4);
      }

      .cta-button.secondary {
        background: transparent;
        border: 2px solid rgba(255, 255, 255, 0.5);
        color: white;
      }

      .cta-button.secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: white;
        box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarbleHeroSceneComponent {
  // Dark emerald background
  protected readonly backgroundColor = 0x0a1a15;
}
