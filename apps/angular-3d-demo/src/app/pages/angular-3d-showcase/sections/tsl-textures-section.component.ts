import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  SphereComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  EnvironmentComponent,
  NodeMaterialDirective,
  OrbitControlsComponent,
} from '@hive-academy/angular-3d';
import {
  tslPlanet,
  tslStars,
  tslCausticsTexture,
  tslPhotosphere,
  tslMarble,
  tslWood,
  tslRust,
  tslVoronoiCells,
  tslBrain,
  tslReticularVeins,
  tslWaterMarble,
  tslRoughClay,
  TSLNode,
} from '@hive-academy/angular-3d';
import { Color } from 'three';

interface TextureDemo {
  name: string;
  node: TSLNode;
  code: string;
  position: [number, number, number];
}

@Component({
  selector: 'app-tsl-textures-section',
  standalone: true,
  imports: [
    Scene3dComponent,
    SphereComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
    EnvironmentComponent,
    NodeMaterialDirective,
    OrbitControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-12x">
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            TSL Procedural Textures
          </h2>
          <p class="text-text-secondary">
            GPU-accelerated textures with dynamic lighting. Drag to rotate.
          </p>
        </div>

        <!-- Scene 1: Space Textures -->
        <div class="mb-10x">
          <h3 class="text-lg font-semibold text-cyan-400 mb-3x">
            Space & Sci-Fi
          </h3>
          <div
            class="aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 to-black shadow-2xl"
          >
            <a3d-scene-3d [cameraPosition]="[0, 0.5, 7]">
              <a3d-ambient-light [intensity]="0.4" />
              <a3d-directional-light
                [position]="[5, 8, 5]"
                [intensity]="1.2"
                [color]="'#88aaff'"
              />
              <a3d-point-light
                [position]="[-4, 3, 4]"
                [intensity]="0.8"
                [color]="'#ff6600'"
              />
              <a3d-environment
                [preset]="'night'"
                [intensity]="0.5"
                [background]="false"
              />
              <a3d-orbit-controls
                [enableDamping]="true"
                [dampingFactor]="0.05"
              />

              @for (texture of spaceTextures; track texture.name) {
              <a3d-sphere
                [args]="[1.4, 64, 64]"
                [position]="texture.position"
                [roughness]="0.3"
                [metalness]="0.2"
                a3dNodeMaterial
                [colorNode]="texture.node"
              />
              }
            </a3d-scene-3d>
          </div>
          <div class="grid grid-cols-4 gap-3x text-center text-sm mt-3x">
            @for (texture of spaceTextures; track texture.name) {
            <div class="p-2x bg-white/5 rounded-lg">
              <code class="text-cyan-400">{{ texture.code }}</code>
            </div>
            }
          </div>
        </div>

        <!-- Scene 2: Organic Textures -->
        <div class="mb-10x">
          <h3 class="text-lg font-semibold text-emerald-400 mb-3x">
            Organic Patterns
          </h3>
          <div
            class="aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-950 to-black shadow-2xl"
          >
            <a3d-scene-3d [cameraPosition]="[0, 0.5, 7]">
              <a3d-ambient-light [intensity]="0.4" />
              <a3d-directional-light
                [position]="[5, 8, 5]"
                [intensity]="1.0"
                [color]="'#aaffaa'"
              />
              <a3d-point-light
                [position]="[4, 3, 4]"
                [intensity]="0.6"
                [color]="'#44ff88'"
              />
              <a3d-environment
                [preset]="'forest'"
                [intensity]="0.4"
                [background]="false"
              />
              <a3d-orbit-controls
                [enableDamping]="true"
                [dampingFactor]="0.05"
              />

              @for (texture of organicTextures; track texture.name) {
              <a3d-sphere
                [args]="[1.4, 64, 64]"
                [position]="texture.position"
                [roughness]="0.4"
                [metalness]="0.15"
                a3dNodeMaterial
                [colorNode]="texture.node"
              />
              }
            </a3d-scene-3d>
          </div>
          <div class="grid grid-cols-4 gap-3x text-center text-sm mt-3x">
            @for (texture of organicTextures; track texture.name) {
            <div class="p-2x bg-white/5 rounded-lg">
              <code class="text-emerald-400">{{ texture.code }}</code>
            </div>
            }
          </div>
        </div>

        <!-- Scene 3: Nature & Materials -->
        <div class="mb-8x">
          <h3 class="text-lg font-semibold text-amber-400 mb-3x">
            Nature & Materials
          </h3>
          <div
            class="aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-b from-amber-950 to-black shadow-2xl"
          >
            <a3d-scene-3d [cameraPosition]="[0, 0.5, 7]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light
                [position]="[5, 8, 5]"
                [intensity]="1.2"
                [color]="'#ffeecc'"
              />
              <a3d-point-light
                [position]="[-4, 3, 4]"
                [intensity]="0.7"
                [color]="'#ffaa44'"
              />
              <a3d-environment
                [preset]="'sunset'"
                [intensity]="0.5"
                [background]="false"
              />
              <a3d-orbit-controls
                [enableDamping]="true"
                [dampingFactor]="0.05"
              />

              @for (texture of natureTextures; track texture.name) {
              <a3d-sphere
                [args]="[1.4, 64, 64]"
                [position]="texture.position"
                [roughness]="0.35"
                [metalness]="0.2"
                a3dNodeMaterial
                [colorNode]="texture.node"
              />
              }
            </a3d-scene-3d>
          </div>
          <div class="grid grid-cols-4 gap-3x text-center text-sm mt-3x">
            @for (texture of natureTextures; track texture.name) {
            <div class="p-2x bg-white/5 rounded-lg">
              <code class="text-amber-400">{{ texture.code }}</code>
            </div>
            }
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class TslTexturesSectionComponent {
  // Scene 1: Space Textures
  protected readonly spaceTextures: TextureDemo[] = [
    {
      name: 'Planet',
      node: tslPlanet({ scale: 2 }),
      code: 'tslPlanet()',
      position: [-4.5, 0, 0],
    },
    {
      name: 'Caustics',
      node: tslCausticsTexture({ speed: 1 }),
      code: 'tslCausticsTexture()',
      position: [-1.5, 0, 0],
    },
    {
      name: 'Photosphere',
      node: tslPhotosphere({ scale: 1.5, color: new Color('#ffaa00') }),
      code: 'tslPhotosphere()',
      position: [1.5, 0, 0],
    },
    {
      name: 'Starfield',
      node: tslStars({ density: 1.5, variation: 0.5 }),
      code: 'tslStars()',
      position: [4.5, 0, 0],
    },
  ];

  // Scene 2: Organic Textures
  protected readonly organicTextures: TextureDemo[] = [
    {
      name: 'Brain',
      node: tslBrain({ scale: 2, smooth: 0.6, speed: 0.5 }),
      code: 'tslBrain()',
      position: [-4.5, 0, 0],
    },
    {
      name: 'Reticular Veins',
      node: tslReticularVeins({ scale: 2, reticulation: 6, speed: 0.3 }),
      code: 'tslReticularVeins()',
      position: [-1.5, 0, 0],
    },
    {
      name: 'Water Marble',
      node: tslWaterMarble({ scale: 2, turbulence: 0.6, speed: 0.5 }),
      code: 'tslWaterMarble()',
      position: [1.5, 0, 0],
    },
    {
      name: 'Rough Clay',
      node: tslRoughClay({ scale: 2, roughness: 0.4, speed: 0.2 }),
      code: 'tslRoughClay()',
      position: [4.5, 0, 0],
    },
  ];

  // Scene 3: Nature Textures
  protected readonly natureTextures: TextureDemo[] = [
    {
      name: 'Marble',
      node: tslMarble({ color: new Color('#3344aa'), thinness: 6, speed: 0.2 }),
      code: 'tslMarble()',
      position: [-4.5, 0, 0],
    },
    {
      name: 'Wood',
      node: tslWood({ rings: 8, scale: 3, speed: 0.15 }),
      code: 'tslWood()',
      position: [-1.5, 0, 0],
    },
    {
      name: 'Rust',
      node: tslRust({ scale: 2, intensity: 0.8, speed: 0.1 }),
      code: 'tslRust()',
      position: [1.5, 0, 0],
    },
    {
      name: 'Voronoi',
      node: tslVoronoiCells({ scale: 2.5, edgeWidth: 0.15, speed: 0.3 }),
      code: 'tslVoronoiCells()',
      position: [4.5, 0, 0],
    },
  ];
}
