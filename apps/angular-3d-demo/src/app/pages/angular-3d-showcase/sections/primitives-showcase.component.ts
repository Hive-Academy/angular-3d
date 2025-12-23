import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  BoxComponent,
  CylinderComponent,
  TorusComponent,
  PolyhedronComponent,
  FloatingSphereComponent,
  PlanetComponent,
  StarFieldComponent,
  NebulaComponent,
  NebulaVolumetricComponent,
  GltfModelComponent,
  ParticleSystemComponent,
  SvgIconComponent,
  GroupComponent,
  FogComponent,
  BackgroundCubeComponent,
  BackgroundCubesComponent,
  Rotate3dDirective,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';
import { SectionContainerComponent } from '../shared/section-container.component';
import { ShowcaseCardComponent } from '../shared/showcase-card.component';

/**
 * Primitives showcase page demonstrating all basic geometry components.
 * Showcases 4 sections with 20+ primitive components:
 * - Basic Geometries (9 cards)
 * - Space Elements (4 cards)
 * - Advanced Components (4 cards)
 * - Environment Components (3 cards)
 */
@Component({
  selector: 'app-primitives-showcase',
  imports: [
    SectionContainerComponent,
    ShowcaseCardComponent,
    // Basic geometry primitives
    BoxComponent,
    CylinderComponent,
    TorusComponent,
    FloatingSphereComponent,
    PolyhedronComponent,
    // Space primitives
    PlanetComponent,
    StarFieldComponent,
    NebulaComponent,
    NebulaVolumetricComponent,
    // Advanced primitives
    GltfModelComponent,
    ParticleSystemComponent,
    SvgIconComponent,
    GroupComponent,
    // Environment primitives
    FogComponent,
    BackgroundCubeComponent,
    BackgroundCubesComponent,
    // Directives
    Rotate3dDirective,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="4">
      <span heading
        >Built-in <span class="text-primary-500">Primitives</span></span
      >
      <span description
        >17+ ready-to-use 3D components for rapid prototyping</span
      >

      <!-- Basic Geometries Section -->
      <div class="col-span-full mb-8x">
        <h3 class="text-headline-lg font-bold mb-6x">Basic Geometries</h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6x">
          <!-- Box -->
          <app-showcase-card
            componentName="Box"
            description="3D rectangular prism"
            codeExample='<a3d-box [color]="0x6366f1" />'
          >
            <a3d-box
              sceneContent
              viewportPosition="center"
              [color]="colors.indigo"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 10 }"
            />
          </app-showcase-card>

          <!-- Cylinder -->
          <app-showcase-card
            componentName="Cylinder"
            description="Cylindrical geometry"
            codeExample='<a3d-cylinder [color]="0xec4899" />'
          >
            <a3d-cylinder
              sceneContent
              viewportPosition="center"
              [color]="colors.pink"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 10 }"
            />
          </app-showcase-card>

          <!-- Torus -->
          <app-showcase-card
            componentName="Torus"
            description="Donut-shaped geometry"
            codeExample='<a3d-torus [color]="0xf59e0b" />'
          >
            <a3d-torus
              sceneContent
              viewportPosition="center"
              [color]="colors.amber"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 10 }"
            />
          </app-showcase-card>

          <!-- Floating Sphere -->
          <app-showcase-card
            componentName="Floating Sphere"
            description="Sphere with physical material"
            codeExample='<a3d-floating-sphere [color]="0x3b82f6" />'
          >
            <a3d-floating-sphere
              sceneContent
              viewportPosition="center"
              [color]="colors.blue"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 8 }"
            />
          </app-showcase-card>

          <!-- Polyhedron - Tetrahedron -->
          <app-showcase-card
            componentName="Polyhedron (Tetrahedron)"
            description="4-sided polyhedron"
            codeExample='<a3d-polyhedron type="tetrahedron" />'
          >
            <a3d-polyhedron
              sceneContent
              [type]="'tetrahedron'"
              viewportPosition="center"
              [color]="colors.teal"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 14 }"
            />
          </app-showcase-card>

          <!-- Polyhedron - Octahedron -->
          <app-showcase-card
            componentName="Polyhedron (Octahedron)"
            description="8-sided polyhedron"
            codeExample='<a3d-polyhedron type="octahedron" />'
          >
            <a3d-polyhedron
              sceneContent
              [type]="'octahedron'"
              viewportPosition="center"
              [color]="colors.red"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 12 }"
            />
          </app-showcase-card>

          <!-- Polyhedron - Dodecahedron -->
          <app-showcase-card
            componentName="Polyhedron (Dodecahedron)"
            description="12-sided polyhedron"
            codeExample='<a3d-polyhedron type="dodecahedron" />'
          >
            <a3d-polyhedron
              sceneContent
              [type]="'dodecahedron'"
              viewportPosition="center"
              [color]="colors.violet"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 10 }"
            />
          </app-showcase-card>

          <!-- Polyhedron - Icosahedron -->
          <app-showcase-card
            componentName="Polyhedron (Icosahedron)"
            description="20-sided polyhedron"
            codeExample='<a3d-polyhedron type="icosahedron" />'
          >
            <a3d-polyhedron
              sceneContent
              [type]="'icosahedron'"
              viewportPosition="center"
              [color]="colors.emerald"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 15 }"
            />
          </app-showcase-card>

          <!-- Polyhedron - Icosahedron (duplicate removed, only 4 polyhedron types in spec) -->
          <!-- Note: Implementation-plan shows 5 polyhedron cards, but spec only lists 4 types -->
          <!-- Tetrahedron (4), Octahedron (8), Dodecahedron (12), Icosahedron (20) = 4 types -->
          <!-- Adding 5th card with different icosahedron color for visual variety -->
          <app-showcase-card
            componentName="Polyhedron (Icosahedron)"
            description="20-sided polyhedron (alt color)"
            codeExample='<a3d-polyhedron type="icosahedron" [color]="0xf97316" />'
          >
            <a3d-polyhedron
              sceneContent
              [type]="'icosahedron'"
              viewportPosition="center"
              [color]="colors.orange"
              rotate3d
              [rotateConfig]="{ axis: 'x', speed: 13 }"
            />
          </app-showcase-card>
        </div>
      </div>

      <!-- Space Elements Section -->
      <div class="col-span-full mb-8x">
        <h3 class="text-headline-lg font-bold mb-6x">Space Elements</h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6x">
          <!-- Planet -->
          <app-showcase-card
            componentName="Planet"
            description="Planetary sphere with glow effect"
            codeExample='<a3d-planet [radius]="1.5" [color]="0x06b6d4" />'
            [cameraPosition]="[0, 0, 5]"
          >
            <a3d-planet
              sceneContent
              viewportPosition="center"
              [radius]="1.5"
              [color]="colors.cyan"
            />
          </app-showcase-card>

          <!-- Star Field -->
          <app-showcase-card
            componentName="Star Field"
            description="Procedural star field generation"
            codeExample='<a3d-star-field [starCount]="2000" />'
            [cameraPosition]="[0, 0, 10]"
          >
            <a3d-star-field sceneContent [starCount]="2000" />
          </app-showcase-card>

          <!-- Nebula -->
          <app-showcase-card
            componentName="Nebula"
            description="Particle-based nebula cloud"
            codeExample='<a3d-nebula [cloudCount]="60" />'
            [cameraPosition]="[0, 0, 10]"
          >
            <a3d-nebula
              sceneContent
              viewportPosition="center"
              [cloudCount]="60"
              [colorPalette]="['#8b5cf6', '#ec4899', '#06b6d4']"
            />
          </app-showcase-card>

          <!-- Nebula Volumetric -->
          <app-showcase-card
            componentName="Nebula Volumetric"
            description="Volumetric nebula with shader effects"
            codeExample='<a3d-nebula-volumetric [width]="40" [height]="20" />'
            [cameraPosition]="[0, 0, 20]"
          >
            <a3d-nebula-volumetric
              sceneContent
              [position]="[0, 0, -5]"
              [width]="40"
              [height]="20"
              [primaryColor]="'#8b5cf6'"
              [secondaryColor]="'#d946ef'"
              [opacity]="0.4"
            />
          </app-showcase-card>
        </div>
      </div>

      <!-- Advanced Components Section -->
      <div class="col-span-full mb-8x">
        <h3 class="text-headline-lg font-bold mb-6x">Advanced Components</h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6x">
          <!-- GLTF Model -->
          <app-showcase-card
            componentName="GLTF Model"
            description="Load and display 3D models"
            codeExample='<a3d-gltf-model modelPath="/3d/model.gltf" />'
            [cameraPosition]="[0, 0, 8]"
          >
            <a3d-gltf-model
              sceneContent
              viewportPosition="center"
              [modelPath]="'/3d/planet_earth/scene.gltf'"
              [scale]="1.5"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 10 }"
            />
          </app-showcase-card>

          <!-- Particle System -->
          <app-showcase-card
            componentName="Particle System"
            description="Customizable particle effects"
            codeExample='<a3d-particle-system [count]="5000" />'
            [cameraPosition]="[0, 0, 8]"
          >
            <a3d-particle-system
              sceneContent
              viewportPosition="center"
              [count]="5000"
              [color]="colors.cyan"
              [size]="0.1"
            />
          </app-showcase-card>

          <!-- SVG Icon -->
          <app-showcase-card
            componentName="SVG Icon"
            description="3D extruded SVG shapes"
            codeExample='<a3d-svg-icon [svgPath]="path" />'
            [cameraPosition]="[0, 0, 5]"
          >
            <a3d-svg-icon
              sceneContent
              viewportPosition="center"
              [svgPath]="angularLogoPath"
              [color]="colors.red"
              [scale]="0.01"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 20 }"
            />
          </app-showcase-card>

          <!-- Group -->
          <app-showcase-card
            componentName="Group"
            description="Container for organizing 3D objects"
            codeExample="<a3d-group><a3d-box /><a3d-box /></a3d-group>"
            [cameraPosition]="[0, 0, 5]"
          >
            <a3d-group
              sceneContent
              viewportPosition="center"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 15 }"
            >
              <a3d-box
                [position]="[-1.5, 0, 0]"
                [color]="colors.indigo"
                [args]="[0.8, 0.8, 0.8]"
              />
              <a3d-box
                [position]="[1.5, 0, 0]"
                [color]="colors.pink"
                [args]="[0.8, 0.8, 0.8]"
              />
            </a3d-group>
          </app-showcase-card>
        </div>
      </div>

      <!-- Environment Components Section -->
      <div class="col-span-full">
        <h3 class="text-headline-lg font-bold mb-6x">Environment Components</h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6x">
          <!-- Fog -->
          <app-showcase-card
            componentName="Fog"
            description="Atmospheric fog effect"
            codeExample='<a3d-fog [color]="0xcccccc" [near]="5" [far]="20" />'
            [cameraPosition]="[0, 0, 8]"
          >
            <a3d-fog
              sceneContent
              [color]="colors.skyBlue"
              [near]="3"
              [far]="15"
            />
            <a3d-box
              sceneContent
              [position]="[0, 0, -5]"
              [color]="colors.indigo"
            />
            <a3d-box
              sceneContent
              [position]="[-2, 0, -8]"
              [color]="colors.pink"
            />
            <a3d-box
              sceneContent
              [position]="[2, 0, -8]"
              [color]="colors.amber"
            />
          </app-showcase-card>

          <!-- Background Cube -->
          <app-showcase-card
            componentName="Background Cube"
            description="Single decorative background cube"
            codeExample='<a3d-background-cube [color]="0x8b5cf6" />'
            [cameraPosition]="[0, 0, 5]"
          >
            <a3d-background-cube
              sceneContent
              [color]="colors.violet"
              [args]="[2, 2, 2]"
            />
          </app-showcase-card>

          <!-- Background Cubes -->
          <app-showcase-card
            componentName="Background Cubes"
            description="Multiple decorative background cubes"
            codeExample='<a3d-background-cubes [count]="9" />'
            [cameraPosition]="[0, 0, 10]"
          >
            <a3d-background-cubes sceneContent [count]="9" />
          </app-showcase-card>
        </div>
      </div>
    </app-section-container>
  `,
})
export class PrimitivesShowcaseComponent {
  public readonly colors = SCENE_COLORS;

  /**
   * Angular logo SVG path (simplified)
   * Source: Angular branding guidelines
   */
  public readonly angularLogoPath =
    'M250 50L30 120l35 300 185 100 185-100 35-300z';
}
