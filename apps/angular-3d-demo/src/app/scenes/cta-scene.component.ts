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
    <scene-3d [cameraPosition]="[0, 0, 6]" [cameraFov]="50">
      <!-- Lights -->
      <a3d-ambient-light [intensity]="0.6" />
      <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.8" />

      <!-- Floating Polyhedrons -->
      <a3d-polyhedron
        [type]="'icosahedron'"
        [position]="[-3, 1, -2]"
        [color]="'#6366F1'"
        [opacity]="0.35"
        float3d
        [floatHeight]="0.5"
        [floatDuration]="4.5"
      />

      <a3d-polyhedron
        [type]="'octahedron'"
        [position]="[3, -1, -2]"
        [color]="'#A1FF4F'"
        [opacity]="0.3"
        float3d
        [floatHeight]="0.4"
        [floatDuration]="5"
      />

      <a3d-polyhedron
        [type]="'dodecahedron'"
        [position]="[0, 0, -4]"
        [color]="'#6366F1'"
        [opacity]="0.4"
        float3d
        [floatHeight]="0.6"
        [floatDuration]="4"
      />
    </scene-3d>
  `,
})
export class CtaSceneComponent {}
