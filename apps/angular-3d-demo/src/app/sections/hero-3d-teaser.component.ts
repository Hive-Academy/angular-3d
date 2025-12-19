import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  PolyhedronComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  StarFieldComponent,
  Rotate3dDirective,
} from '@hive-academy/angular-3d';

@Component({
  selector: 'app-hero-3d-teaser',
  imports: [
    Scene3dComponent,
    PolyhedronComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    StarFieldComponent,
    Rotate3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative h-screen bg-background-dark overflow-hidden">
      <scene-3d [cameraPosition]="[0, 0, 5]" [cameraFov]="75">
        <!-- Lights -->
        <a3d-ambient-light [intensity]="0.5" />
        <a3d-directional-light
          [position]="[5, 5, 5]"
          [intensity]="0.8"
          [color]="'#A1FF4F'"
        />

        <!-- Star Field Background -->
        <a3d-star-field [count]="1000" [colors]="['#FFFFFF', '#A1FF4F']" />

        <!-- Rotating Icosahedron -->
        <a3d-polyhedron
          [type]="'icosahedron'"
          [position]="[0, 0, 0]"
          [color]="'#6366F1'"
          [wireframe]="true"
          rotate3d
          [rotationSpeed]="0.01"
          [rotationAxis]="'y'"
        />
      </scene-3d>
    </div>
  `,
})
export class Hero3dTeaserComponent {}
