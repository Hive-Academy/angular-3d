import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  BoxComponent,
  TorusComponent,
  BloomEffectComponent,
  Float3dDirective,
  Rotate3dDirective,
  Glow3dDirective,
  SpaceFlight3dDirective,
  MouseTracking3dDirective,
  Performance3dDirective,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';
import { SectionContainerComponent } from '../shared/section-container.component';
import { ShowcaseCardComponent } from '../shared/showcase-card.component';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * DirectivesShowcaseComponent
 *
 * Demonstrates all animation and behavior directives with 9+ interactive examples.
 * Each directive card shows distinct configuration variants and effect demonstrations.
 *
 * Directives showcased:
 * - Float3d (slow and fast variants)
 * - Rotate3d (Y-axis and X-axis variants)
 * - Glow3d (with BloomEffectComponent)
 * - SpaceFlight3d (animated path)
 * - MouseTracking3d (interactive)
 * - Performance3d (optimization)
 * - Combined example (Float + Rotate + Glow)
 */
@Component({
  selector: 'app-directives-showcase',
  imports: [
    SectionContainerComponent,
    ShowcaseCardComponent,
    BoxComponent,
    TorusComponent,
    BloomEffectComponent,
    // Directives
    Float3dDirective,
    Rotate3dDirective,
    Glow3dDirective,
    SpaceFlight3dDirective,
    MouseTracking3dDirective,
    Performance3dDirective,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="3" background="light">
      <span heading
        >Animation <span class="text-primary-500">Directives</span></span
      >
      <span description>9+ directives for adding behavior to 3D objects</span>

      <!-- Float3d Directive (Slow) -->
      <app-showcase-card
        componentName="Float3d (Slow)"
        description="Gentle floating animation with smooth motion"
        [codeExample]="floatSlowCodeExample"
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.indigo"
          float3d
          [floatConfig]="{ height: 0.2, speed: 4000 }"
        />
      </app-showcase-card>

      <!-- Float3d Directive (Fast) -->
      <app-showcase-card
        componentName="Float3d (Fast)"
        description="Rapid floating animation with energetic motion"
        [codeExample]="floatFastCodeExample"
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.pink"
          float3d
          [floatConfig]="{ height: 0.5, speed: 1500 }"
        />
      </app-showcase-card>

      <!-- Rotate3d Directive (Y-axis) -->
      <app-showcase-card
        componentName="Rotate3d (Y-axis)"
        description="Continuous rotation around vertical Y-axis"
        [codeExample]="rotateYCodeExample"
      >
        <a3d-torus
          sceneContent
          viewportPosition="center"
          [color]="colors.amber"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 20 }"
        />
      </app-showcase-card>

      <!-- Rotate3d Directive (X-axis) -->
      <app-showcase-card
        componentName="Rotate3d (X-axis)"
        description="Continuous rotation around horizontal X-axis"
        [codeExample]="rotateXCodeExample"
      >
        <a3d-torus
          sceneContent
          viewportPosition="center"
          [color]="colors.emerald"
          rotate3d
          [rotateConfig]="{ axis: 'x', speed: 20 }"
        />
      </app-showcase-card>

      <!-- Glow3d Directive -->
      <app-showcase-card
        componentName="Glow3d"
        description="Glowing/bloom effect on object (requires BloomEffect)"
        codeExample='<a3d-box a3dGlow3d [glowIntensity]="2" />
<a3d-bloom-effect [threshold]="0.5" [strength]="1.5" />'
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.cyan"
          a3dGlow3d
          [glowIntensity]="2"
        />
        <a3d-bloom-effect
          sceneContent
          [threshold]="0.5"
          [strength]="1.5"
          [radius]="0.5"
        />
      </app-showcase-card>

      <!-- SpaceFlight3d Directive -->
      <app-showcase-card
        componentName="SpaceFlight3d"
        description="Animated space-flight motion pattern along waypoints"
        codeExample='<a3d-box a3dSpaceFlight3d [flightPath]="waypoints" />'
        [cameraPosition]="[0, 0, 8]"
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.violet"
          a3dSpaceFlight3d
          [flightPath]="flightWaypoints"
          [rotationsPerCycle]="4"
          [loop]="true"
        />
      </app-showcase-card>

      <!-- MouseTracking3d Directive -->
      <app-showcase-card
        componentName="MouseTracking3d"
        description="Follows mouse cursor - hover over this card to see effect"
        [codeExample]="mouseTrackingCodeExample"
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.orange"
          mouseTracking3d
          [trackingConfig]="{ sensitivity: 0.5, damping: 0.1 }"
        />
      </app-showcase-card>

      <!-- Performance3d Directive -->
      <app-showcase-card
        componentName="Performance3d"
        description="Performance optimization for complex scenes"
        codeExample="<a3d-box a3dPerformance3d />"
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.teal"
          [a3dPerformance3d]="true"
        />
      </app-showcase-card>

      <!-- Combined Directives Example -->
      <app-showcase-card
        componentName="Combined (Float + Rotate + Glow)"
        description="Multiple directives on one object for complex animations"
        codeExample='<a3d-box float3d rotate3d a3dGlow3d />
<a3d-bloom-effect [threshold]="0.5" [strength]="1.2" />'
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.hotPink"
          float3d
          [floatConfig]="{ height: 0.3, speed: 2000 }"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 15 }"
          a3dGlow3d
          [glowIntensity]="1.5"
        />
        <a3d-bloom-effect sceneContent [threshold]="0.5" [strength]="1.2" />
      </app-showcase-card>
    </app-section-container>
  `,
})
export class DirectivesShowcaseComponent {
  public readonly colors = SCENE_COLORS;

  // Code examples with curly braces (must be class properties to avoid template parsing issues)
  public readonly floatSlowCodeExample =
    '<a3d-box float3d [floatConfig]="{ height: 0.2, speed: 4000 }" />';
  public readonly floatFastCodeExample =
    '<a3d-box float3d [floatConfig]="{ height: 0.5, speed: 1500 }" />';
  public readonly rotateYCodeExample =
    '<a3d-torus rotate3d [rotateConfig]="{ axis: \'y\', speed: 20 }" />';
  public readonly rotateXCodeExample =
    '<a3d-torus rotate3d [rotateConfig]="{ axis: \'x\', speed: 20 }" />';
  public readonly mouseTrackingCodeExample =
    '<a3d-box mouseTracking3d [trackingConfig]="{ sensitivity: 0.5 }" />';

  /**
   * Flight path waypoints for SpaceFlight3d demo
   * Creates a circular path with 4 waypoints
   */
  public readonly flightWaypoints = [
    { position: [2, 0, 0] as [number, number, number], duration: 1.5 },
    { position: [0, 0, 2] as [number, number, number], duration: 1.5 },
    { position: [-2, 0, 0] as [number, number, number], duration: 1.5 },
    { position: [0, 0, -2] as [number, number, number], duration: 1.5 },
  ];
}
