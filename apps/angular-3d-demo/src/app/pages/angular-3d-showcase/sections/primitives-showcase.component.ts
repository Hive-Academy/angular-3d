import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  BoxComponent,
  CylinderComponent,
  TorusComponent,
  PolyhedronComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  Rotate3dDirective,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

@Component({
  selector: 'app-primitives-showcase',
  imports: [
    Scene3dComponent,
    BoxComponent,
    CylinderComponent,
    TorusComponent,
    PolyhedronComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    Rotate3dDirective,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-container mx-auto px-4x">
      <h2 class="text-display-lg text-center mb-12x font-bold">
        Built-in <span class="text-primary-500">Primitives</span>
      </h2>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8x">
        <!-- Box -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <div class="h-48x mb-4x">
            <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light [position]="[2, 2, 2]" />
              <a3d-box
                viewportPosition="center"
                [color]="colors.indigo"
                rotate3d
                [rotateConfig]="{ axis: 'y', speed: 10 }"
              />
            </a3d-scene-3d>
          </div>
          <h3 class="text-headline-md font-bold mb-2x">Box</h3>
          <code class="text-body-sm text-text-secondary"
            >&lt;a3d-box /&gt;</code
          >
        </div>

        <!-- Cylinder -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <div class="h-48x mb-4x">
            <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light [position]="[2, 2, 2]" />
              <a3d-cylinder
                viewportPosition="center"
                [color]="colors.pink"
                rotate3d
                [rotateConfig]="{ axis: 'y', speed: 10 }"
              />
            </a3d-scene-3d>
          </div>
          <h3 class="text-headline-md font-bold mb-2x">Cylinder</h3>
          <code class="text-body-sm text-text-secondary"
            >&lt;a3d-cylinder /&gt;</code
          >
        </div>

        <!-- Torus -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <div class="h-48x mb-4x">
            <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light [position]="[2, 2, 2]" />
              <a3d-torus
                viewportPosition="center"
                [color]="colors.amber"
                rotate3d
                [rotateConfig]="{ axis: 'y', speed: 10 }"
              />
            </a3d-scene-3d>
          </div>
          <h3 class="text-headline-md font-bold mb-2x">Torus</h3>
          <code class="text-body-sm text-text-secondary"
            >&lt;a3d-torus /&gt;</code
          >
        </div>

        <!-- Icosahedron -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <div class="h-48x mb-4x">
            <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light [position]="[2, 2, 2]" />
              <a3d-polyhedron
                [type]="'icosahedron'"
                viewportPosition="center"
                [color]="colors.emerald"
                rotate3d
                [rotateConfig]="{ axis: 'y', speed: 10 }"
              />
            </a3d-scene-3d>
          </div>
          <h3 class="text-headline-md font-bold mb-2x">Icosahedron</h3>
          <code class="text-body-sm text-text-secondary"
            >&lt;a3d-polyhedron type="icosahedron" /&gt;</code
          >
        </div>
      </div>
    </div>
  `,
})
export class PrimitivesShowcaseComponent {
  public readonly colors = SCENE_COLORS;
}
