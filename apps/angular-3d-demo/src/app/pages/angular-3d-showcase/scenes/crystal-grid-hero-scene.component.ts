import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AmbientLightComponent,
  BloomEffectComponent,
  EffectComposerComponent,
  Glow3dDirective,
  OrbitControlsComponent,
  PointLightComponent,
  Rotate3dDirective,
  Scene3dComponent,
  TorusComponent,
} from '@hive-academy/angular-3d';

/**
 * Crystal Grid Hero Scene - Geometric Neon Showcase
 *
 * A mesmerizing 3D scene featuring:
 * - Multiple wireframe torus shapes creating a "crystal grid" effect
 * - Vibrant emissive colors (cyan, magenta, yellow) for neon aesthetics
 * - Individual rotation animations on different axes
 * - Glow effects on each torus for enhanced visual impact
 * - Strong bloom post-processing for intense neon glow
 * - Auto-rotating orbit controls for dynamic viewing
 */
@Component({
  selector: 'app-crystal-grid-hero-scene',
  standalone: true,
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    PointLightComponent,
    TorusComponent,
    Rotate3dDirective,
    Glow3dDirective,
    OrbitControlsComponent,
    EffectComposerComponent,
    BloomEffectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden" style="height: calc(100vh - 180px);">
      <a3d-scene-3d
        [cameraPosition]="[0, 0, 25]"
        [cameraFov]="50"
        [backgroundColor]="328976"
      >
        <!-- Ambient Light for base visibility -->
        <a3d-ambient-light [intensity]="0.15" />

        <!-- Central Point Light - Cyan color to enhance the neon effect -->
        <a3d-point-light
          [position]="[0, 0, 10]"
          [intensity]="2"
          [color]="'#00ffff'"
          [distance]="50"
        />

        <!-- Secondary Point Light - Magenta accent -->
        <a3d-point-light
          [position]="[-10, 5, 5]"
          [intensity]="1.5"
          [color]="'#ff00ff'"
          [distance]="40"
        />

        <!-- Crystal Torus 1 - Cyan (Top Left) -->
        <a3d-torus
          [position]="[-8, 4, 0]"
          [args]="[2, 0.5, 16, 50]"
          [color]="'#00ffff'"
          [wireframe]="true"
          [emissive]="'#00ffff'"
          [emissiveIntensity]="2"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 1 }"
          a3dGlow3d
          [glowColor]="'#00ffff'"
          [glowIntensity]="0.3"
          [glowScale]="1.3"
        />

        <!-- Crystal Torus 2 - Magenta (Bottom Right) -->
        <a3d-torus
          [position]="[8, -4, 0]"
          [args]="[2.5, 0.6, 16, 50]"
          [color]="'#ff00ff'"
          [wireframe]="true"
          [emissive]="'#ff00ff'"
          [emissiveIntensity]="2"
          rotate3d
          [rotateConfig]="{ axis: 'x', speed: 0.8 }"
          a3dGlow3d
          [glowColor]="'#ff00ff'"
          [glowIntensity]="0.3"
          [glowScale]="1.3"
        />

        <!-- Crystal Torus 3 - Yellow (Center Back) -->
        <a3d-torus
          [position]="[0, 0, -5]"
          [args]="[3, 0.7, 16, 50]"
          [color]="'#ffff00'"
          [wireframe]="true"
          [emissive]="'#ffff00'"
          [emissiveIntensity]="2"
          rotate3d
          [rotateConfig]="{ axis: 'z', speed: 0.6 }"
          a3dGlow3d
          [glowColor]="'#ffff00'"
          [glowIntensity]="0.3"
          [glowScale]="1.3"
        />

        <!-- Crystal Torus 4 - Cyan variant (Top Right) -->
        <a3d-torus
          [position]="[6, 6, -3]"
          [args]="[1.5, 0.4, 16, 50]"
          [color]="'#00ffcc'"
          [wireframe]="true"
          [emissive]="'#00ffcc'"
          [emissiveIntensity]="2"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 1.2 }"
          a3dGlow3d
          [glowColor]="'#00ffcc'"
          [glowIntensity]="0.25"
          [glowScale]="1.25"
        />

        <!-- Crystal Torus 5 - Magenta variant (Bottom Left) -->
        <a3d-torus
          [position]="[-6, -6, -3]"
          [args]="[1.5, 0.4, 16, 50]"
          [color]="'#ff00cc'"
          [wireframe]="true"
          [emissive]="'#ff00cc'"
          [emissiveIntensity]="2"
          rotate3d
          [rotateConfig]="{ axis: 'x', speed: 1.4 }"
          a3dGlow3d
          [glowColor]="'#ff00cc'"
          [glowIntensity]="0.25"
          [glowScale]="1.25"
        />

        <!-- Post-processing - Strong Bloom for Neon Effect -->
        <a3d-effect-composer>
          <a3d-bloom-effect [threshold]="0.5" [strength]="1.2" [radius]="0.4" />
        </a3d-effect-composer>

        <!-- Interactive Controls with Auto-Rotation -->
        <a3d-orbit-controls
          [autoRotate]="true"
          [autoRotateSpeed]="0.5"
          [enableDamping]="true"
          [dampingFactor]="0.05"
          [minDistance]="12"
          [maxDistance]="45"
        />
      </a3d-scene-3d>
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
export class CrystalGridHeroSceneComponent {}
