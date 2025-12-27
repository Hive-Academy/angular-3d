import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  PolyhedronComponent,
  EnvironmentComponent,
  Float3dDirective,
  MouseTracking3dDirective,
  OrbitControlsComponent,
  EffectComposerComponent,
  BloomEffectComponent,
} from '@hive-academy/angular-3d';

/**
 * FloatingGeometryHeroSceneComponent - Interactive Floating Polyhedrons
 *
 * Features:
 * - 5 different polyhedron types with unique colors and sizes
 * - Float3dDirective for gentle bobbing animation
 * - MouseTracking3dDirective for cursor-based interaction
 * - Sunset environment for warm PBR reflections
 * - Subtle bloom effect for soft glow
 * - Damping-enabled orbit controls for smooth navigation
 */
@Component({
  selector: 'app-floating-geometry-hero-scene',
  standalone: true,
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    PolyhedronComponent,
    EnvironmentComponent,
    Float3dDirective,
    MouseTracking3dDirective,
    OrbitControlsComponent,
    EffectComposerComponent,
    BloomEffectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative overflow-hidden bg-gradient-to-b from-slate-900 to-indigo-950"
      style="height: calc(100vh - 180px);"
    >
      <a3d-scene-3d
        [cameraPosition]="[0, 0, 20]"
        [cameraFov]="50"
        [enableAntialiasing]="true"
        [backgroundColor]="0x0a0a1a"
      >
        <!-- Lighting -->
        <a3d-ambient-light [intensity]="0.2" />
        <a3d-directional-light
          [position]="[5, 10, 5]"
          [intensity]="1.2"
          [color]="'#ffeedd'"
        />

        <!-- Environment for PBR reflections -->
        <a3d-environment [preset]="'sunset'" [intensity]="0.5" />

        <!-- Icosahedron - Top left, indigo -->
        <a3d-polyhedron
          [type]="'icosahedron'"
          [position]="[-6, 3, 0]"
          [args]="[1.5, 0]"
          [color]="'#6366f1'"
          float3d
          [floatConfig]="{ height: 0.4, speed: 2500, ease: 'sine.inOut' }"
          mouseTracking3d
          [trackingConfig]="{ sensitivity: 0.3, damping: 0.08 }"
        />

        <!-- Octahedron - Top right, emerald -->
        <a3d-polyhedron
          [type]="'octahedron'"
          [position]="[5, 4, -2]"
          [args]="[1.3, 0]"
          [color]="'#10b981'"
          float3d
          [floatConfig]="{
            height: 0.5,
            speed: 3000,
            delay: 200,
            ease: 'sine.inOut'
          }"
          mouseTracking3d
          [trackingConfig]="{ sensitivity: 0.4, damping: 0.1 }"
        />

        <!-- Dodecahedron - Center, amber -->
        <a3d-polyhedron
          [type]="'dodecahedron'"
          [position]="[0, 0, 2]"
          [args]="[2, 0]"
          [color]="'#f59e0b'"
          float3d
          [floatConfig]="{
            height: 0.3,
            speed: 2800,
            delay: 400,
            ease: 'sine.inOut'
          }"
          mouseTracking3d
          [trackingConfig]="{ sensitivity: 0.25, damping: 0.06 }"
        />

        <!-- Tetrahedron - Bottom left, rose -->
        <a3d-polyhedron
          [type]="'tetrahedron'"
          [position]="[-5, -3, 1]"
          [args]="[1.4, 0]"
          [color]="'#f43f5e'"
          float3d
          [floatConfig]="{
            height: 0.45,
            speed: 2600,
            delay: 600,
            ease: 'sine.inOut'
          }"
          mouseTracking3d
          [trackingConfig]="{ sensitivity: 0.35, damping: 0.09 }"
        />

        <!-- Cube - Bottom right, cyan -->
        <a3d-polyhedron
          [type]="'cube'"
          [position]="[6, -2, -1]"
          [args]="[1.2, 0]"
          [color]="'#06b6d4'"
          float3d
          [floatConfig]="{
            height: 0.35,
            speed: 3200,
            delay: 800,
            ease: 'sine.inOut'
          }"
          mouseTracking3d
          [trackingConfig]="{ sensitivity: 0.3, damping: 0.07 }"
        />

        <!-- Post-processing: subtle bloom for soft glow -->
        <a3d-effect-composer>
          <a3d-bloom-effect [threshold]="0.9" [strength]="0.3" [radius]="0.5" />
        </a3d-effect-composer>

        <!-- Orbit controls with damping for smooth camera movement -->
        <a3d-orbit-controls
          [enableDamping]="true"
          [dampingFactor]="0.05"
          [enableZoom]="true"
          [minDistance]="10"
          [maxDistance]="40"
        />
      </a3d-scene-3d>

      <!-- Scene info overlay -->
      <div class="absolute bottom-4 left-4 z-20 text-white/70 text-sm">
        <p class="font-medium">Floating Geometry</p>
        <p class="text-xs text-white/50">
          Move your mouse to interact with the shapes
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class FloatingGeometryHeroSceneComponent {}
