import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroSpaceSceneComponent } from './scenes/hero-space-scene.component';
import { ValueProps3dSceneComponent } from './scenes/value-props-3d-scene.component';
import { PrimitivesShowcaseComponent } from './sections/primitives-showcase.component';
import { TextShowcaseComponent } from './sections/text-showcase.component';
import { LightingShowcaseComponent } from './sections/lighting-showcase.component';
import { DirectivesShowcaseComponent } from './sections/directives-showcase.component';
import { PostprocessingShowcaseComponent } from './sections/postprocessing-showcase.component';
import { ControlsShowcaseComponent } from './sections/controls-showcase.component';
import { ServicesDocumentationComponent } from './sections/services-documentation.component';

@Component({
  selector: 'app-angular-3d-showcase',
  imports: [
    HeroSpaceSceneComponent,
    ValueProps3dSceneComponent,
    PrimitivesShowcaseComponent,
    TextShowcaseComponent,
    LightingShowcaseComponent,
    DirectivesShowcaseComponent,
    PostprocessingShowcaseComponent,
    ControlsShowcaseComponent,
    ServicesDocumentationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 1. Hero Space Scene -->
    <app-hero-space-scene />

    <!-- 2. Primitives Showcase (17+ components) -->
    <app-primitives-showcase />

    <!-- 3. Text Showcase (6 components) -->
    <app-text-showcase />

    <!-- 4. Lighting Showcase (5 light types) -->
    <app-lighting-showcase />

    <!-- 5. Directives Showcase (9+ directives) -->
    <app-directives-showcase />

    <!-- 6. Postprocessing Showcase (Bloom before/after) -->
    <app-postprocessing-showcase />

    <!-- 7. Controls Showcase (OrbitControls variants) -->
    <app-controls-showcase />

    <!-- 8. Services Documentation (6 services) -->
    <app-services-documentation />

    <!-- 9. Value Props 3D Scene -->
    <app-value-props-3d-scene />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class Angular3dShowcaseComponent {}
