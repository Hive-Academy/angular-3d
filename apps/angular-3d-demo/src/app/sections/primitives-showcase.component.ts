import { Component } from '@angular/core';
import {
  Scene3dComponent,
  BoxComponent,
  SphereComponent,
  CylinderComponent,
  TorusComponent,
  PolyhedronComponent,
  ConeComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  Rotate3dDirective,
} from '@hive-academy/angular-3d';

@Component({
  selector: 'app-primitives-showcase',
  imports: [
    Scene3dComponent,
    BoxComponent,
    SphereComponent,
    CylinderComponent,
    TorusComponent,
    PolyhedronComponent,
    ConeComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    Rotate3dDirective,
  ],
  template: `
    <div class="max-w-container mx-auto px-4x">
      <h2 class="text-display-lg text-center mb-12x font-bold">
        Built-in <span class="text-primary-500">Primitives</span>
      </h2>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8x">
        <!-- Box -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <div class="h-48x mb-4x">
            <scene-3d [cameraPosition]="[0, 0, 3]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light [position]="[2, 2, 2]" />
              <a3d-box [color]="'#6366F1'" rotate3d [rotationSpeed]="0.01" />
            </scene-3d>
          </div>
          <h3 class="text-headline-md font-bold mb-2x">Box</h3>
          <code class="text-body-sm text-text-secondary"
            >&lt;a3d-box /&gt;</code
          >
        </div>

        <!-- Sphere -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <div class="h-48x mb-4x">
            <scene-3d [cameraPosition]="[0, 0, 3]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light [position]="[2, 2, 2]" />
              <a3d-sphere [color]="'#A1FF4F'" rotate3d [rotationSpeed]="0.01" />
            </scene-3d>
          </div>
          <h3 class="text-headline-md font-bold mb-2x">Sphere</h3>
          <code class="text-body-sm text-text-secondary"
            >&lt;a3d-sphere /&gt;</code
          >
        </div>

        <!-- Cylinder -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <div class="h-48x mb-4x">
            <scene-3d [cameraPosition]="[0, 0, 3]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light [position]="[2, 2, 2]" />
              <a3d-cylinder
                [color]="'#EC4899'"
                rotate3d
                [rotationSpeed]="0.01"
              />
            </scene-3d>
          </div>
          <h3 class="text-headline-md font-bold mb-2x">Cylinder</h3>
          <code class="text-body-sm text-text-secondary"
            >&lt;a3d-cylinder /&gt;</code
          >
        </div>

        <!-- Torus -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <div class="h-48x mb-4x">
            <scene-3d [cameraPosition]="[0, 0, 3]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light [position]="[2, 2, 2]" />
              <a3d-torus [color]="'#F59E0B'" rotate3d [rotationSpeed]="0.01" />
            </scene-3d>
          </div>
          <h3 class="text-headline-md font-bold mb-2x">Torus</h3>
          <code class="text-body-sm text-text-secondary"
            >&lt;a3d-torus /&gt;</code
          >
        </div>

        <!-- Icosahedron -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <div class="h-48x mb-4x">
            <scene-3d [cameraPosition]="[0, 0, 3]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light [position]="[2, 2, 2]" />
              <a3d-polyhedron
                [type]="'icosahedron'"
                [color]="'#10B981'"
                rotate3d
                [rotationSpeed]="0.01"
              />
            </scene-3d>
          </div>
          <h3 class="text-headline-md font-bold mb-2x">Icosahedron</h3>
          <code class="text-body-sm text-text-secondary"
            >&lt;a3d-polyhedron type="icosahedron" /&gt;</code
          >
        </div>

        <!-- Cone -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <div class="h-48x mb-4x">
            <scene-3d [cameraPosition]="[0, 0, 3]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light [position]="[2, 2, 2]" />
              <a3d-cone [color]="'#8B5CF6'" rotate3d [rotationSpeed]="0.01" />
            </scene-3d>
          </div>
          <h3 class="text-headline-md font-bold mb-2x">Cone</h3>
          <code class="text-body-sm text-text-secondary"
            >&lt;a3d-cone /&gt;</code
          >
        </div>
      </div>
    </div>
  `,
})
export class PrimitivesShowcaseComponent {}
