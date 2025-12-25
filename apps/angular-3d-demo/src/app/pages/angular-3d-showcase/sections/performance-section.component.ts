import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Scene3dComponent,
  InstancedMeshComponent,
  BoxGeometryDirective,
  StandardMaterialDirective,
  AmbientLightComponent,
  DirectionalLightComponent,
  OrbitControlsComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';
import * as THREE from 'three';

/**
 * Performance Section - InstancedMesh and Demand Rendering Demo
 *
 * Demonstrates performance optimizations:
 * - InstancedMesh: 100k+ objects with single draw call
 * - Demand rendering: Zero GPU usage when idle
 *
 * NOTE: Instance count is set at initialization and cannot be changed dynamically.
 * Use preset buttons to switch between different instance counts.
 */
@Component({
  selector: 'app-performance-section',
  standalone: true,
  imports: [
    CommonModule,
    Scene3dComponent,
    InstancedMeshComponent,
    BoxGeometryDirective,
    StandardMaterialDirective,
    AmbientLightComponent,
    DirectionalLightComponent,
    OrbitControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- InstancedMesh Performance Demo -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            InstancedMesh Performance
          </h2>
          <p class="text-text-secondary">
            Render 100,000+ objects with a single draw call
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Traditional Approach (1000 individual meshes - simulation) -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl relative"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 50]" [cameraFov]="60">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[10, 10, 10]"
                  [intensity]="0.8"
                />

                <!-- Simulated 1000 individual meshes (actually instanced but labeled as "traditional") -->
                <a3d-instanced-mesh
                  [count]="1000"
                  (meshReady)="initTraditionalGrid($event)"
                >
                  <ng-container a3dBoxGeometry [args]="[0.5, 0.5, 0.5]" />
                  <ng-container a3dStandardMaterial [color]="colors.pink" />
                </a3d-instanced-mesh>

                <a3d-orbit-controls
                  [enableDamping]="true"
                  [dampingFactor]="0.05"
                />
              </a3d-scene-3d>

              <!-- Badge: Draw Calls -->
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-red-500/80 rounded-full text-xs font-medium text-white"
              >
                ~1000 draw calls (simulated)
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">
                Traditional approach: 1 draw call per object
              </p>
              <p class="text-xs text-red-400">
                Performance limit: ~5,000 objects at 60fps
              </p>
            </div>
          </div>

          <!-- InstancedMesh Approach (50,000 instances) -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl relative"
            >
              @if (selectedPreset() === '1k') {
                <a3d-scene-3d [cameraPosition]="[0, 0, 50]" [cameraFov]="60">
                  <a3d-ambient-light [intensity]="0.5" />
                  <a3d-directional-light
                    [position]="[10, 10, 10]"
                    [intensity]="0.8"
                  />

                  <a3d-instanced-mesh
                    [count]="presetCounts['1k']"
                    [frustumCulled]="false"
                    (meshReady)="initInstancedGrid($event)"
                  >
                    <ng-container a3dBoxGeometry [args]="[0.5, 0.5, 0.5]" />
                    <ng-container a3dStandardMaterial [color]="colors.cyan" />
                  </a3d-instanced-mesh>

                  <a3d-orbit-controls
                    [enableDamping]="true"
                    [dampingFactor]="0.05"
                  />
                </a3d-scene-3d>
              }
              @if (selectedPreset() === '10k') {
                <a3d-scene-3d [cameraPosition]="[0, 0, 50]" [cameraFov]="60">
                  <a3d-ambient-light [intensity]="0.5" />
                  <a3d-directional-light
                    [position]="[10, 10, 10]"
                    [intensity]="0.8"
                  />

                  <a3d-instanced-mesh
                    [count]="presetCounts['10k']"
                    [frustumCulled]="false"
                    (meshReady)="initInstancedGrid($event)"
                  >
                    <ng-container a3dBoxGeometry [args]="[0.5, 0.5, 0.5]" />
                    <ng-container a3dStandardMaterial [color]="colors.cyan" />
                  </a3d-instanced-mesh>

                  <a3d-orbit-controls
                    [enableDamping]="true"
                    [dampingFactor]="0.05"
                  />
                </a3d-scene-3d>
              }
              @if (selectedPreset() === '50k') {
                <a3d-scene-3d [cameraPosition]="[0, 0, 50]" [cameraFov]="60">
                  <a3d-ambient-light [intensity]="0.5" />
                  <a3d-directional-light
                    [position]="[10, 10, 10]"
                    [intensity]="0.8"
                  />

                  <a3d-instanced-mesh
                    [count]="presetCounts['50k']"
                    [frustumCulled]="false"
                    (meshReady)="initInstancedGrid($event)"
                  >
                    <ng-container a3dBoxGeometry [args]="[0.5, 0.5, 0.5]" />
                    <ng-container a3dStandardMaterial [color]="colors.cyan" />
                  </a3d-instanced-mesh>

                  <a3d-orbit-controls
                    [enableDamping]="true"
                    [dampingFactor]="0.05"
                  />
                </a3d-scene-3d>
              }
              @if (selectedPreset() === '100k') {
                <a3d-scene-3d [cameraPosition]="[0, 0, 50]" [cameraFov]="60">
                  <a3d-ambient-light [intensity]="0.5" />
                  <a3d-directional-light
                    [position]="[10, 10, 10]"
                    [intensity]="0.8"
                  />

                  <a3d-instanced-mesh
                    [count]="presetCounts['100k']"
                    [frustumCulled]="false"
                    (meshReady)="initInstancedGrid($event)"
                  >
                    <ng-container a3dBoxGeometry [args]="[0.5, 0.5, 0.5]" />
                    <ng-container a3dStandardMaterial [color]="colors.cyan" />
                  </a3d-instanced-mesh>

                  <a3d-orbit-controls
                    [enableDamping]="true"
                    [dampingFactor]="0.05"
                  />
                </a3d-scene-3d>
              }

              <!-- Badge: Draw Call -->
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-green-500/80 rounded-full text-xs font-medium text-white"
              >
                1 draw call
              </div>

              <!-- Badge: Instance Count -->
              <div
                class="absolute top-4 right-4 px-3 py-1 bg-cyan-500/80 rounded-full text-xs font-medium text-white"
              >
                {{ presetCounts[selectedPreset()].toLocaleString() }} instances
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">
                InstancedMesh: 1 draw call for all instances
              </p>
              <p class="text-xs text-green-400">
                100x performance: 100,000+ objects at 60fps
              </p>
            </div>
          </div>
        </div>

        <!-- Preset Buttons -->
        <div class="mt-8x max-w-2xl mx-auto">
          <p class="text-sm font-medium text-white mb-3 text-center">
            Select Instance Count Preset:
          </p>
          <div class="flex gap-3 justify-center">
            <button
              (click)="selectedPreset.set('1k')"
              [class]="selectedPreset() === '1k' ? 'px-6 py-3 rounded-lg font-medium transition-colors bg-cyan-500 text-white' : 'px-6 py-3 rounded-lg font-medium transition-colors bg-white/10 text-white hover:bg-white/20'"
            >
              1,000
            </button>
            <button
              (click)="selectedPreset.set('10k')"
              [class]="selectedPreset() === '10k' ? 'px-6 py-3 rounded-lg font-medium transition-colors bg-cyan-500 text-white' : 'px-6 py-3 rounded-lg font-medium transition-colors bg-white/10 text-white hover:bg-white/20'"
            >
              10,000
            </button>
            <button
              (click)="selectedPreset.set('50k')"
              [class]="selectedPreset() === '50k' ? 'px-6 py-3 rounded-lg font-medium transition-colors bg-cyan-500 text-white' : 'px-6 py-3 rounded-lg font-medium transition-colors bg-white/10 text-white hover:bg-white/20'"
            >
              50,000
            </button>
            <button
              (click)="selectedPreset.set('100k')"
              [class]="selectedPreset() === '100k' ? 'px-6 py-3 rounded-lg font-medium transition-colors bg-cyan-500 text-white' : 'px-6 py-3 rounded-lg font-medium transition-colors bg-white/10 text-white hover:bg-white/20'"
            >
              100,000
            </button>
          </div>
          <p class="text-xs text-text-tertiary mt-3 text-center">
            Instance count is set at initialization. Changing presets recreates the mesh.
          </p>
        </div>
      </section>

      <!-- Demand-Based Rendering Demo -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            Demand-Based Rendering
          </h2>
          <p class="text-text-secondary">
            Render only when needed - 95% battery savings for static content
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Always Rendering (frameloop="always") -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl relative"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 6]" [frameloop]="'always'">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[5, 5, 5]"
                  [intensity]="0.8"
                />

                <a3d-instanced-mesh
                  [count]="5000"
                  (meshReady)="initAlwaysScene($event)"
                >
                  <ng-container a3dBoxGeometry [args]="[0.1, 0.1, 0.1]" />
                  <ng-container a3dStandardMaterial [color]="colors.red" />
                </a3d-instanced-mesh>
              </a3d-scene-3d>

              <!-- Badge: Rendering Status -->
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-red-500/80 rounded-full text-xs font-medium text-white animate-pulse"
              >
                Always Rendering (60fps)
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">
                frameloop="always" - renders every frame
              </p>
              <p class="text-xs text-red-400">
                GPU usage: 100% (even when static)
              </p>
            </div>
          </div>

          <!-- Demand Rendering (frameloop="demand") -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl relative"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 6]" [frameloop]="'demand'">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[5, 5, 5]"
                  [intensity]="0.8"
                />

                <a3d-instanced-mesh
                  [count]="5000"
                  (meshReady)="initDemandScene($event)"
                >
                  <ng-container a3dBoxGeometry [args]="[0.1, 0.1, 0.1]" />
                  <ng-container a3dStandardMaterial [color]="colors.emerald" />
                </a3d-instanced-mesh>

                <a3d-orbit-controls
                  [enableDamping]="true"
                  [dampingFactor]="0.05"
                />
              </a3d-scene-3d>

              <!-- Badge: Rendering Status -->
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-green-500/80 rounded-full text-xs font-medium text-white"
              >
                Demand Rendering (0fps when idle)
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">
                frameloop="demand" - renders only when invalidated
              </p>
              <p class="text-xs text-green-400">
                GPU usage: ~0% when idle (95% battery savings)
              </p>
            </div>
          </div>
        </div>

        <div
          class="mt-6x p-4x bg-cyan-500/10 border border-cyan-500/20 rounded-lg"
        >
          <p class="text-sm text-cyan-300">
            💡 <strong>Tip:</strong> Interact with the right scene (drag to
            orbit). Notice it renders during interaction, then stops when idle.
          </p>
        </div>
      </section>
    </div>
  `,
})
export default class PerformanceSectionComponent {
  public readonly colors = SCENE_COLORS;

  // Preset selection for instance count
  public readonly selectedPreset = signal<'1k' | '10k' | '50k' | '100k'>('50k');
  public readonly presetCounts = {
    '1k': 1000,
    '10k': 10000,
    '50k': 50000,
    '100k': 100000,
  } as const;

  /**
   * Initialize traditional grid (10x10x10 = 1000 cubes)
   */
  public initTraditionalGrid(mesh: THREE.InstancedMesh): void {
    const matrix = new THREE.Matrix4();
    const gridSize = 10;
    const spacing = 2;
    let index = 0;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          matrix.setPosition(
            (x - gridSize / 2) * spacing,
            (y - gridSize / 2) * spacing,
            (z - gridSize / 2) * spacing
          );
          mesh.setMatrixAt(index++, matrix);
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Initialize instanced grid (dynamic count based on slider)
   */
  public initInstancedGrid(mesh: THREE.InstancedMesh): void {
    const matrix = new THREE.Matrix4();
    const count = mesh.count;
    const gridDimension = Math.ceil(Math.pow(count, 1 / 3));
    const spacing = 2;

    let index = 0;
    for (let x = 0; x < gridDimension && index < count; x++) {
      for (let y = 0; y < gridDimension && index < count; y++) {
        for (let z = 0; z < gridDimension && index < count; z++) {
          matrix.setPosition(
            (x - gridDimension / 2) * spacing,
            (y - gridDimension / 2) * spacing,
            (z - gridDimension / 2) * spacing
          );
          mesh.setMatrixAt(index++, matrix);
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Initialize always-rendering scene (random positions)
   */
  public initAlwaysScene(mesh: THREE.InstancedMesh): void {
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < mesh.count; i++) {
      matrix.setPosition(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Initialize demand-rendering scene (random positions)
   */
  public initDemandScene(mesh: THREE.InstancedMesh): void {
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < mesh.count; i++) {
      matrix.setPosition(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}
