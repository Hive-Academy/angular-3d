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
  // Existing library shaders
  tslBlueYardParticles,
  tslVolumetricParticleCloud,
  tslFireClouds,
  tslVolumetricFog,
  createOptimizedFireNode,
  createMarbleMaterial,
} from '@hive-academy/angular-3d';
import { Color } from 'three';

interface AdvancedDemo {
  name: string;
  description: string;
  code: string;
}

interface DemoCategory {
  name: string;
  color: string;
  demos: AdvancedDemo[];
}

@Component({
  selector: 'app-tsl-textures-advanced-section',
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
          <h2 class="text-display-md font-bold mb-2x">Advanced TSL Shaders</h2>
          <p class="text-text-secondary">
            Particles, volumetric effects, fire, and marble raymarching from the
            library. Drag to orbit.
          </p>
        </div>

        <!-- Advanced Effects Scene -->
        <div
          class="h-screen rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-950 to-black shadow-2xl mb-6x"
        >
          <a3d-scene-3d [cameraPosition]="[0, 0, 10]">
            <a3d-ambient-light [intensity]="0.4" />
            <a3d-directional-light
              [position]="[5, 8, 5]"
              [intensity]="1.2"
              [color]="'#ffffff'"
            />
            <a3d-point-light
              [position]="[-4, 3, 4]"
              [intensity]="0.8"
              [color]="'#6366f1'"
            />
            <a3d-point-light
              [position]="[4, -2, 4]"
              [intensity]="0.6"
              [color]="'#f472b6'"
            />
            <a3d-environment
              [preset]="'night'"
              [intensity]="0.5"
              [background]="false"
            />
            <a3d-orbit-controls
              [enableDamping]="true"
              [dampingFactor]="0.05"
              [enablePan]="true"
              [minDistance]="5"
              [maxDistance]="20"
            />

            <!-- Row 1: Particles & Volumetric -->
            <!-- BlueYard Particles -->
            <a3d-sphere
              [args]="[1.2, 64, 64]"
              [position]="[-3.5, 2, 0]"
              [roughness]="0.3"
              [metalness]="0.7"
              a3dNodeMaterial
              [colorNode]="blueyardParticlesNode"
            />

            <!-- Volumetric Particle Cloud -->
            <a3d-sphere
              [args]="[1.2, 64, 64]"
              [position]="[0, 2, 0]"
              [roughness]="0.2"
              [metalness]="0.8"
              a3dNodeMaterial
              [colorNode]="volumetricParticlesNode"
            />

            <!-- Fire Clouds -->
            <a3d-sphere
              [args]="[1.2, 64, 64]"
              [position]="[3.5, 2, 0]"
              [roughness]="0.1"
              [metalness]="0.9"
              a3dNodeMaterial
              [colorNode]="fireCloudsNode"
            />

            <!-- Row 2: Advanced Effects -->
            <!-- Volumetric Fog -->
            <a3d-sphere
              [args]="[1.2, 64, 64]"
              [position]="[-3.5, -1.5, 0]"
              [roughness]="0.15"
              [metalness]="0.7"
              a3dNodeMaterial
              [colorNode]="volumetricFogNode"
            />

            <!-- Fire Texture -->
            <a3d-sphere
              [args]="[1.2, 64, 64]"
              [position]="[0, -1.5, 0]"
              [roughness]="0.0"
              [metalness]="0.0"
              a3dNodeMaterial
              [colorNode]="fireTextureNode"
            />

            <!-- Marble Raymarching -->
            <a3d-sphere
              [args]="[1.2, 64, 64]"
              [position]="[3.5, -1.5, 0]"
              [roughness]="marbleMaterial.roughness"
              [metalness]="marbleMaterial.metalness"
              a3dNodeMaterial
              [colorNode]="marbleMaterial.colorNode"
              [emissiveNode]="marbleMaterial.emissiveNode"
            />
          </a3d-scene-3d>
        </div>

        <!-- Category Legend -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6x">
          @for (category of categories; track category.name) {
          <div class="p-4x bg-white/5 rounded-lg">
            <h4 class="font-semibold mb-3x" [style.color]="category.color">
              {{ category.name }}
            </h4>
            <div class="space-y-2x">
              @for (demo of category.demos; track demo.name) {
              <div class="text-sm">
                <code [style.color]="category.color">{{ demo.code }}</code>
                <p class="text-xs text-text-secondary mt-0.5x">
                  {{ demo.description }}
                </p>
              </div>
              }
            </div>
          </div>
          }
        </div>
      </section>
    </div>
  `,
})
export default class TslTexturesAdvancedSectionComponent {
  // Categories for legend
  protected readonly categories: DemoCategory[] = [
    {
      name: 'Particles & Clouds',
      color: '#ff9966', // coral
      demos: [
        {
          name: 'BlueYard Particles',
          code: 'tslBlueYardParticles()',
          description: 'Animated coral-colored floating particles',
        },
        {
          name: 'Volumetric Particles',
          code: 'tslVolumetricParticleCloud()',
          description: 'Multi-layer particles with depth variation',
        },
        {
          name: 'Fire Clouds',
          code: 'tslFireClouds()',
          description: 'Animated fire/smoke cloud effect',
        },
      ],
    },
    {
      name: 'Volumetric & Raymarching',
      color: '#34d399', // emerald
      demos: [
        {
          name: 'Volumetric Fog',
          code: 'tslVolumetricFog()',
          description: 'Raymarched fog with density variation',
        },
        {
          name: 'Fire Texture',
          code: 'createOptimizedFireNode()',
          description: 'Turbulent sun/fire effect',
        },
        {
          name: 'Marble Raymarching',
          code: 'createMarbleMaterial()',
          description: 'Glossy glass with animated volume interior',
        },
      ],
    },
  ];

  // =========================================================================
  // Row 1: Particles & Clouds - Using existing library shaders
  // =========================================================================

  /** BlueYard Particles - coral animated particles */
  protected readonly blueyardParticlesNode = tslBlueYardParticles({
    scale: 3,
    density: 2.5,
    speed: 0.4,
    color1: new Color(0xffddcc),
    color2: new Color(0xff9966),
    background: new Color(0x111111),
  });

  /** Volumetric Particle Cloud - multi-layer particles */
  protected readonly volumetricParticlesNode = tslVolumetricParticleCloud({
    scale: 2.5,
    density: 2.5,
    speed: 0.4,
    coreColor: new Color(0xffffff),
    midColor: new Color(0x88ddff),
    edgeColor: new Color(0x4488aa),
  });

  /** Fire Clouds - animated fire/smoke */
  protected readonly fireCloudsNode = tslFireClouds({
    scale: 2.5,
    speed: 0.5,
    turbulence: 3,
    color1: new Color(0xffcc00), // bright yellow
    color2: new Color(0xff4400), // orange-red
    color3: new Color(0x220000), // dark red/black
  });

  // =========================================================================
  // Row 2: Volumetric & Raymarching
  // =========================================================================

  /** Volumetric Fog - raymarched fog sphere */
  protected readonly volumetricFogNode = tslVolumetricFog({
    radius: 1.0,
    centerColor: '#ffffff',
    edgeColor: '#6699ff',
    densityScale: 3.0,
    noiseScale: 2.0,
    steps: 32,
  });

  /** Fire Texture - turbulent sun/fire */
  protected readonly fireTextureNode = createOptimizedFireNode(
    0.5, // speed
    0.3, // distortion
    4.0, // scale
    true // sunMode
  );

  /** Marble Raymarching - glossy glass with volume */
  protected readonly marbleMaterial = createMarbleMaterial({
    colorA: '#001a13', // Dark emerald
    colorB: '#66e5b3', // Bright teal
    edgeColor: '#00ffcc', // Cyan glow
    iterations: 8,
    depth: 0.6,
    timeScale: 0.3,
    noiseScale: 3.0,
  });
}
