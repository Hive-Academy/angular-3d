import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  PolyhedronComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  Float3dDirective,
} from '@hive-academy/angular-3d';

@Component({
  selector: 'app-cta-scene',
  imports: [
    Scene3dComponent,
    PolyhedronComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    Float3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 6]" [cameraFov]="50">
      <!-- Lights -->
      <a3d-ambient-light [intensity]="0.6" />
      <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.8" />

      <!-- Floating Polyhedrons -->
      <a3d-polyhedron
        [type]="'icosahedron'"
        [position]="[-3, 1, -2]"
        [color]="'#6366F1'"
        float3d
        [floatConfig]="{ height: 0.5, speed: 4500 }"
      />

      <a3d-polyhedron
        [type]="'octahedron'"
        [position]="[3, -1, -2]"
        [color]="'#A1FF4F'"
        float3d
        [floatConfig]="{ height: 0.4, speed: 5000 }"
      />

      <a3d-polyhedron
        [type]="'dodecahedron'"
        [position]="[0, 0, -4]"
        [color]="'#6366F1'"
        float3d
        [floatConfig]="{ height: 0.6, speed: 4000 }"
      />
    </a3d-scene-3d>
  `,
})
export class CtaSceneComponent {}
