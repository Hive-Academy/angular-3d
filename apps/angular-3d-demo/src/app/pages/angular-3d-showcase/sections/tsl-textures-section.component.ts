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
  // Space/Sci-Fi (5)
  tslPlanet,
  tslStars,
  tslCausticsTexture,
  tslPhotosphere,
  tslGasGiant,
  // Natural Materials (4)
  tslMarble,
  tslWood,
  tslRust,
  tslConcrete,
  // Patterns (5)
  tslPolkaDots,
  tslGrid,
  tslVoronoiCells,
  tslBricks,
  tslFabric,
  // Organic (4)
  tslBrain,
  tslReticularVeins,
  tslWaterMarble,
  tslRoughClay,
  // Shape Modifiers (2)
  tslSupersphere,
  tslMelter,
  TSLNode,
} from '@hive-academy/angular-3d';
import { Color } from 'three';
import { time } from 'three/tsl';

interface TextureDemo {
  name: string;
  node: TSLNode;
  code: string;
  category: string;
}

interface TextureCategory {
  name: string;
  color: string;
  textures: TextureDemo[];
}

@Component({
  selector: 'app-tsl-textures-section',
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
    <div class="py-12x">
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            TSL Procedural Textures
          </h2>
          <p class="text-text-secondary">
            {{ allTextures.length }} GPU-accelerated textures in a single scene.
            Drag to orbit, scroll to zoom.
          </p>
        </div>

        <!-- Unified Scene with all textures -->
        <div
          class="h-screen rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 to-black shadow-2xl mb-6x"
        >
          <a3d-scene-3d [cameraPosition]="[0, 1, 14]">
            <a3d-ambient-light [intensity]="0.5" />
            <a3d-directional-light
              [position]="[10, 15, 10]"
              [intensity]="1.0"
              [color]="'#ffffff'"
            />
            <a3d-point-light
              [position]="[-8, 5, 8]"
              [intensity]="0.6"
              [color]="'#88aaff'"
            />
            <a3d-point-light
              [position]="[8, 3, 8]"
              [intensity]="0.5"
              [color]="'#ffaa88'"
            />
            <a3d-environment
              [preset]="'studio'"
              [intensity]="0.4"
              [background]="false"
            />
            <a3d-orbit-controls
              [enableDamping]="true"
              [dampingFactor]="0.05"
              [enablePan]="true"
              [minDistance]="4"
              [maxDistance]="25"
            />

            @for (texture of allTextures; track texture.name; let i = $index) {
            <a3d-sphere
              [args]="[1.2, 64, 64]"
              [position]="getPosition(i)"
              [roughness]="0.3"
              [metalness]="0.2"
              a3dNodeMaterial
              [colorNode]="texture.node"
            />
            }

            <!-- Shape Modifiers (use positionNode, added after textures) -->
            <a3d-sphere
              [args]="[1.2, 64, 64]"
              [position]="getPosition(allTextures.length)"
              [roughness]="0.3"
              [metalness]="0.7"
              a3dNodeMaterial
              [positionNode]="supersphereNode"
              [colorNode]="supersphereColor"
            />
            <a3d-sphere
              [args]="[1.2, 64, 64]"
              [position]="getPosition(allTextures.length + 1)"
              [roughness]="0.4"
              [metalness]="0.6"
              a3dNodeMaterial
              [positionNode]="melterNode"
              [colorNode]="melterColor"
            />
          </a3d-scene-3d>
        </div>

        <!-- Category Legend -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4x">
          @for (category of categories; track category.name) {
          <div class="p-3x bg-white/5 rounded-lg">
            <h4 class="font-semibold mb-2x" [style.color]="category.color">
              {{ category.name }}
            </h4>
            <div class="space-y-1x">
              @for (texture of category.textures; track texture.name) {
              <div class="text-xs text-text-secondary">
                <code [style.color]="category.color">{{ texture.code }}</code>
              </div>
              }
            </div>
          </div>
          }
        </div>

        <!-- Shape Modifiers - rendered separately with positionNode -->
        <div class="mt-6x">
          <h3 class="text-lg font-semibold text-rose-400 mb-3x text-center">
            Shape Modifiers (positionNode)
          </h3>
          <div class="grid grid-cols-2 gap-4x text-center">
            <div class="p-3x bg-white/5 rounded-lg">
              <code class="text-rose-400">tslSupersphere()</code>
              <p class="text-xs text-text-secondary mt-1x">
                Sphere → Cube morph (exponent=4)
              </p>
            </div>
            <div class="p-3x bg-white/5 rounded-lg">
              <code class="text-rose-400">tslMelter()</code>
              <p class="text-xs text-text-secondary mt-1x">
                Animated melting effect
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class TslTexturesSectionComponent {
  // Grid configuration: 5 columns, rows determined by texture count
  private readonly COLUMNS = 5;
  private readonly SPHERE_SPACING = 3.2;
  private readonly ROW_SPACING = 3.5;

  // All texture categories with their textures
  protected readonly categories: TextureCategory[] = [
    {
      name: 'Space & Sci-Fi',
      color: '#22d3ee', // cyan-400
      textures: [
        {
          name: 'Planet',
          node: tslPlanet({ scale: 5 }),
          code: 'tslPlanet()',
          category: 'space',
        },
        {
          name: 'Caustics',
          node: tslCausticsTexture({ speed: 1 }),
          code: 'tslCausticsTexture()',
          category: 'space',
        },
        {
          name: 'Photosphere',
          node: tslPhotosphere({ scale: 1.5, color: new Color('#ffaa00') }),
          code: 'tslPhotosphere()',
          category: 'space',
        },
        {
          name: 'Gas Giant',
          node: tslGasGiant({ scale: 2 }),
          code: 'tslGasGiant()',
          category: 'space',
        },
        {
          name: 'Starfield',
          node: tslStars({ density: 10, variation: 0.5, speed: 0.4, seed: 5 }),
          code: 'tslStars()',
          category: 'space',
        },
      ],
    },
    {
      name: 'Natural Materials',
      color: '#f59e0b', // amber-500
      textures: [
        {
          name: 'Marble',
          node: tslMarble({
            color: new Color('#3344aa'),
            thinness: 6,
            speed: 0.2,
          }),
          code: 'tslMarble()',
          category: 'materials',
        },
        {
          name: 'Wood',
          node: tslWood({ rings: 8, scale: 3, speed: 0.15 }),
          code: 'tslWood()',
          category: 'materials',
        },
        {
          name: 'Rust',
          node: tslRust({ scale: 2, intensity: 0.8, speed: 0.1 }),
          code: 'tslRust()',
          category: 'materials',
        },
        {
          name: 'Concrete',
          node: tslConcrete({ scale: 2, roughness: 0.6 }),
          code: 'tslConcrete()',
          category: 'materials',
        },
      ],
    },
    {
      name: 'Patterns',
      color: '#a855f7', // purple-500
      textures: [
        {
          name: 'Polka Dots',
          node: tslPolkaDots({ scale: 5, dotSize: 0.3 }),
          code: 'tslPolkaDots()',
          category: 'patterns',
        },
        {
          name: 'Grid',
          node: tslGrid({ scale: 4, lineWidth: 0.05 }),
          code: 'tslGrid()',
          category: 'patterns',
        },
        {
          name: 'Voronoi',
          node: tslVoronoiCells({ scale: 2.5, edgeWidth: 0.15, speed: 0.3 }),
          code: 'tslVoronoiCells()',
          category: 'patterns',
        },
        {
          name: 'Bricks',
          node: tslBricks({ scale: 3, mortarWidth: 0.05 }),
          code: 'tslBricks()',
          category: 'patterns',
        },
        {
          name: 'Fabric',
          node: tslFabric({ scale: 4, weaveScale: 0.5 }),
          code: 'tslFabric()',
          category: 'patterns',
        },
      ],
    },
    {
      name: 'Organic',
      color: '#10b981', // emerald-500
      textures: [
        {
          name: 'Brain',
          node: tslBrain({ scale: 2, smooth: 0.6, speed: 0.5 }),
          code: 'tslBrain()',
          category: 'organic',
        },
        {
          name: 'Reticular Veins',
          node: tslReticularVeins({ scale: 2, reticulation: 6, speed: 0.3 }),
          code: 'tslReticularVeins()',
          category: 'organic',
        },
        {
          name: 'Water Marble',
          node: tslWaterMarble({ scale: 2, turbulence: 0.6, speed: 0.5 }),
          code: 'tslWaterMarble()',
          category: 'organic',
        },
        {
          name: 'Rough Clay',
          node: tslRoughClay({ scale: 2, roughness: 0.4, speed: 0.2 }),
          code: 'tslRoughClay()',
          category: 'organic',
        },
      ],
    },
  ];

  // Flatten all textures for rendering
  protected readonly allTextures: TextureDemo[] = this.categories.flatMap(
    (c) => c.textures
  );

  /**
   * Calculate 3D position for texture sphere in grid layout
   * Layout: 5 columns × N rows, centered horizontally
   */
  protected getPosition(index: number): [number, number, number] {
    const col = index % this.COLUMNS;
    const row = Math.floor(index / this.COLUMNS);

    // Center the grid horizontally
    const xOffset = ((this.COLUMNS - 1) / 2) * this.SPHERE_SPACING;

    // Calculate positions
    const x = col * this.SPHERE_SPACING - xOffset;
    const y = -row * this.ROW_SPACING + 2; // Start higher, go down
    const z = 0;

    return [x, y, z];
  }

  // =========================================================================
  // Shape Modifier Nodes (positionNode-based vertex deformation)
  // =========================================================================

  /** Supersphere: morphs from sphere (exp=2) toward cube (exp→∞) */
  protected readonly supersphereNode = tslSupersphere({ exponent: 4 });

  /** Color for supersphere - marble texture */
  protected readonly supersphereColor = tslMarble({
    color: new Color('#ff6b6b'),
    thinness: 8,
    speed: 0.1,
  });

  /** Melter: animated dripping/melting vertex displacement */
  protected readonly melterNode = tslMelter({
    intensity: 0.4,
    frequency: 3,
    time: time,
  });

  /** Color for melter - water marble for liquid look */
  protected readonly melterColor = tslWaterMarble({
    scale: 2,
    turbulence: 0.8,
    speed: 0.3,
  });
}
