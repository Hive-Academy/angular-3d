import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  ViewportPositioningService,
  ViewportPositionDirective,
  Rotate3dDirective,
  PlanetComponent,
  StarFieldComponent,
  InstancedParticleTextComponent,
  NebulaVolumetricComponent,
  OrbitControlsComponent,
  BloomEffectComponent,
} from '@hive-academy/angular-3d';

/**
 * Enhanced Hero 3D Teaser Component
 *
 * Production-quality 3D space scene showcasing advanced library capabilities.
 * Demonstrates ViewportPositioningService integration and modern positioning patterns.
 *
 * Features (Batch 1):
 * - Realistic planet with rotation
 * - Theme-based lighting configuration
 * - Viewport positioning system
 *
 * Features (Batch 2):
 * - Multi-layer star fields (3 layers, 7500+ stars with parallax depth)
 * - Instanced particle text (programmatic positioning via service)
 * - Volumetric nebula effects (directive-based named positioning)
 * - Interactive camera controls and bloom post-processing
 *
 * POSITIONING PATTERNS REFERENCE:
 *
 * This component demonstrates TWO positioning approaches provided by the angular-3d library:
 *
 * 1. DIRECTIVE-BASED POSITIONING (preferred for static positions):
 *    - Usage: viewportPosition="center" [viewportOffset]="{ offsetZ: -9 }"
 *    - Best for: Elements with fixed named positions (center, top-left, bottom-right, etc.)
 *    - Benefits: Declarative, reactive repositioning on viewport resize, no component logic needed
 *    - Example: Planet positioned at center with Z-depth offset
 *
 * 2. SERVICE-BASED POSITIONING (for computed positions):
 *    - Usage: [position]="positionSignal()" where signal = positioning.getPosition({ x: '50%', y: '25%' })
 *    - Best for: Percentage-based positions, dynamic calculations, complex positioning logic
 *    - Benefits: Full control, percentage support, reactive signals that auto-update
 *    - Example: Particle text positioned at custom percentage coordinates
 *
 * When to use which pattern:
 * - Named positions (center, top-right, etc.) → Use directive
 * - Percentage coordinates (x: '50%', y: '38%') → Use service
 * - Static offsets from named positions → Use directive with viewportOffset
 * - Dynamic/computed positions → Use service with getPosition()
 *
 * Z-DEPTH LAYERING CONVENTION:
 * - Foreground (0 to -5): Text, UI elements, interactive objects
 * - Midground (-5 to -15): Secondary elements, logos, decorative shapes
 * - Background (-15+): Nebula, distant stars, atmospheric effects
 */
@Component({
  selector: 'app-hero-3d-teaser',
  standalone: true,
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    ViewportPositionDirective,
    Rotate3dDirective,
    PlanetComponent,
    StarFieldComponent,
    InstancedParticleTextComponent,
    NebulaVolumetricComponent,
    OrbitControlsComponent,
    BloomEffectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-full h-full"
      role="img"
      aria-label="Interactive 3D space scene with rotating planet Earth, multi-layer twinkling star fields, particle text reading 'Angular 3D Library', volumetric nebula effects, and interactive camera controls allowing zoom and rotation"
    >
      <a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75">
        <!-- LIGHTING: Theme-based configuration for space atmosphere -->
        <!-- Minimal ambient for dark space -->
        <a3d-ambient-light [color]="'#ffffff'" [intensity]="0.05" />

        <!-- Strong directional for sunlight effect -->
        <a3d-directional-light
          [position]="[30, 15, 25]"
          [color]="'#ffffff'"
          [intensity]="0.3"
          [castShadow]="true"
        />

        <!-- PLANET: Earth-like planet with rotation -->
        <!-- POSITIONING PATTERN: Directive-based named position for static elements -->
        <!-- Pattern Used: viewportPosition="center" [viewportOffset]="{ offsetZ: -9 }" -->
        <!-- Why Directive: Fixed named position (center) with static Z-offset -->
        <!-- Z-DEPTH: Midground (-9) - main focal point of the scene -->
        <!-- Using PlanetComponent fallback (GLTF asset not available) -->
        <a3d-planet
          viewportPosition="center"
          [viewportOffset]="{ offsetZ: -9 }"
          [radius]="2.3"
          [segments]="64"
          [color]="'#2244ff'"
          [metalness]="0.4"
          [roughness]="0.6"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 60 }"
        />

        <!-- MULTI-LAYER STAR FIELDS: 3 layers for parallax depth -->
        <!-- POSITIONING: Star fields self-center at origin (no positioning needed) -->
        <!-- Z-DEPTH: Background layer (radius 50) creates depth perception -->
        <!-- Background layer - largest radius, most stars, full effects -->
        <a3d-star-field
          [starCount]="3000"
          [radius]="50"
          [enableTwinkle]="true"
          [multiSize]="true"
          [stellarColors]="true"
        />
        <!-- Midground layer - medium radius, moderate stars -->
        <a3d-star-field [starCount]="2000" [radius]="40" />
        <!-- Foreground layer - smallest radius, most visible stars -->
        <a3d-star-field
          [starCount]="2500"
          [radius]="30"
          [enableTwinkle]="true"
        />

        <!-- PARTICLE TEXT: Instanced rendering for performance -->
        <!-- POSITIONING PATTERN: Programmatic positioning via service -->
        <!-- Pattern Used: [position]="topTextPosition()" where topTextPosition = positioning.getPosition({ x: '50%', y: '25%' }) -->
        <!-- Why Service: Percentage-based coordinates require computed positions -->
        <!-- Benefits: Reactive signal auto-updates on viewport resize, no manual calculations -->
        <!-- Z-DEPTH: Foreground (default 0) - text floats in front of planet -->
        <a3d-instanced-particle-text
          text="Angular 3D Library"
          [position]="topTextPosition()"
          [fontSize]="25"
          [particleColor]="10265519"
          [opacity]="0.35"
        />

        <!-- VOLUMETRIC NEBULA: Layered atmospheric effects -->
        <!-- POSITIONING PATTERN: Named position with directive -->
        <!-- Pattern Used: viewportPosition="top-right" [viewportOffset]="{ offsetZ: -20 }" -->
        <!-- Why Directive: Named position (top-right) provides CSS-like positioning API -->
        <!-- Benefits: Declarative, self-documenting, no component class logic needed -->
        <!-- Z-DEPTH: Background (-20) - distant atmospheric effect behind everything -->
        <a3d-nebula-volumetric
          viewportPosition="top-right"
          [viewportOffset]="{ offsetZ: -20 }"
          [width]="60"
          [height]="20"
          [layers]="2"
          [opacity]="0.9"
          [primaryColor]="'#0088ff'"
        />

        <!-- CAMERA CONTROLS: Interactive orbit controls -->
        <a3d-orbit-controls
          [enableDamping]="true"
          [dampingFactor]="0.05"
          [enableZoom]="true"
          [minDistance]="5"
          [maxDistance]="50"
        />

        <!-- BLOOM POST-PROCESSING: Subtle glow effect -->
        <a3d-bloom-effect [threshold]="0.8" [strength]="0.5" [radius]="0.4" />
      </a3d-scene-3d>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class Hero3dTeaserComponent {
  // POSITIONING SERVICE: Inject for programmatic positioning
  private readonly positioning = inject(ViewportPositioningService);

  // REACTIVE POSITION: Programmatic positioning for particle text
  // Demonstrates service-based positioning pattern (alternative to directive)
  readonly topTextPosition = this.positioning.getPosition({
    x: '50%',
    y: '25%',
  });

  /**
   * RESOURCE CLEANUP STRATEGY:
   *
   * This component follows best practices for resource management:
   *
   * 1. Library Component Cleanup (Automatic):
   *    - Scene3dComponent: Manages Three.js scene disposal via DestroyRef
   *    - PlanetComponent: Disposes geometry/material in DestroyRef.onDestroy()
   *    - StarFieldComponent: Cleans up BufferGeometry and Materials automatically
   *    - InstancedParticleTextComponent: Disposes InstancedMesh resources
   *    - NebulaVolumetricComponent: Cleans up particle system
   *    - OrbitControlsComponent: Removes event listeners and disposes controls
   *    - BloomEffectComponent: Disposes post-processing passes
   *
   * 2. Service Cleanup (Singleton):
   *    - ViewportPositioningService: Provided in 'root', persists across navigation
   *    - Position signals are reactive and garbage collected when component destroyed
   *
   * 3. Manual Cleanup (None Required):
   *    - No direct Three.js objects created in this component
   *    - All 3D resources managed by library components
   *    - DestroyRef pattern ensures automatic cleanup on component unmount
   *
   * Memory Leak Prevention:
   * - Navigate away from this page: All library components trigger cleanup
   * - Revisit page: Fresh instances created, no lingering references
   * - Expected behavior: Memory returns to baseline after unmount
   */
}
