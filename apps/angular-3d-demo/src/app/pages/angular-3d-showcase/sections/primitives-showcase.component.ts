import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  BoxComponent,
  CylinderComponent,
  TorusComponent,
  PolyhedronComponent,
  FloatingSphereComponent,
  Rotate3dDirective,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';
import { SectionContainerComponent } from '../shared/section-container.component';
import { ShowcaseCardComponent } from '../shared/showcase-card.component';

/**
 * Primitives showcase page demonstrating all basic geometry components.
 * Currently showcases Basic Geometries section with 9 geometry types.
 * Additional sections (Space Elements, Advanced Components, Environment) will be added in Batch 3.
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
    </app-section-container>
  `,
})
export class PrimitivesShowcaseComponent {
  public readonly colors = SCENE_COLORS;
}
