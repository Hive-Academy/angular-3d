import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  Scene3dComponent,
  EffectComposerComponent,
  BloomEffectComponent,
  OrbitControlsComponent,
} from '@hive-academy/angular-3d';

@Component({
  imports: [
    RouterModule,
    Scene3dComponent,
    OrbitControlsComponent,
    EffectComposerComponent,
    BloomEffectComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected title = 'angular-3d-demo';
}
