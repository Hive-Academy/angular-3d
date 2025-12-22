import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  PolyhedronComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  Float3dDirective,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

@Component({
  selector: 'app-cta-scene',
  imports: [
    Scene3dComponent,
    PolyhedronComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    Float3dDirective,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 25]" [cameraFov]="50">
      <!-- Lights -->
      <a3d-ambient-light [intensity]="0.6" />
      <a3d-directional-light [position]="[10, 10, 5]" [intensity]="0.8" />

      <!-- Floating Polyhedrons: Midground (-2 to -4) -->
      <a3d-polyhedron
        [type]="'icosahedron'"
        viewportPosition="middle-left"
        [viewportOffset]="{ offsetX: -3, offsetY: 1, offsetZ: -2 }"
        [color]="colors.indigo"
        float3d
        [floatConfig]="{ height: 0.5, speed: 4500 }"
      />

      <a3d-polyhedron
        [type]="'octahedron'"
        viewportPosition="middle-right"
        [viewportOffset]="{ offsetX: 3, offsetY: -1, offsetZ: -2 }"
        [color]="colors.neonGreen"
        float3d
        [floatConfig]="{ height: 0.4, speed: 5000 }"
      />

      <a3d-polyhedron
        [type]="'dodecahedron'"
        viewportPosition="center"
        [viewportOffset]="{ offsetZ: -4 }"
        [color]="colors.indigo"
        float3d
        [floatConfig]="{ height: 0.6, speed: 4000 }"
      />
    </a3d-scene-3d>
  `,
})
export class CtaSceneComponent {
  public readonly colors = SCENE_COLORS;
}
