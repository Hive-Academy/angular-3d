import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroSpaceSceneComponent } from '../scenes/hero-space-scene.component';
import { PrimitivesShowcaseComponent } from '../sections/primitives-showcase.component';
import { ValueProps3dSceneComponent } from '../scenes/value-props-3d-scene.component';

@Component({
  selector: 'app-angular-3d-showcase',
  imports: [
    HeroSpaceSceneComponent,
    PrimitivesShowcaseComponent,
    ValueProps3dSceneComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero Space Scene -->
    <app-hero-space-scene />

    <!-- Primitives -->
    <section class="py-16x bg-background-light">
      <app-primitives-showcase />
    </section>

    <!-- Value Props -->
    <section class="py-16x bg-background-dark">
      <app-value-props-3d-scene />
    </section>
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
