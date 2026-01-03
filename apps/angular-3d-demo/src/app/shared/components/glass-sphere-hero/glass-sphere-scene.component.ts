/**
 * GlassSphereSceneComponent - 3D Glass Sphere Hero Scene
 *
 * A child component for Scene3dComponent that creates a glossy glass sphere
 * with PMREMGenerator environment map reflections and SparkleCorona particles.
 *
 * Features:
 * - **PMREMGenerator environment map**: Warm cream/peach tones for realistic reflections
 * - **MeshStandardNodeMaterial**: Low roughness (0.1) for glossy glass appearance
 * - **TSL fresnel edge glow**: Subtle (0.15 intensity) warm peach rim glow
 * - **Scroll-driven position**: Sphere moves from bottom-center to top-right
 * - **SparkleCorona integration**: Twinkling particles around sphere edge
 *
 * @example
 * ```html
 * <a3d-scene-3d [cameraPosition]="[0, 0, 12]" [backgroundColor]="null">
 *   <app-glass-sphere-scene [scrollProgress]="0.5" />
 * </a3d-scene-3d>
 * ```
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import {
  Fn,
  abs,
  cameraPosition,
  dot,
  float,
  normalWorld,
  normalize,
  positionWorld,
  pow,
  vec3,
} from 'three/tsl';

import {
  SceneService,
  SparkleCoronaComponent,
  Scene3dComponent,
} from '@hive-academy/angular-3d';

/**
 * GlassSphereSceneComponent - Child component for 3D glass sphere scene
 *
 * MUST be placed inside a Scene3dComponent to access SceneService.
 */
@Component({
  selector: 'app-glass-sphere-scene',
  standalone: true,
  imports: [SparkleCoronaComponent, Scene3dComponent],
  template: `
    <a3d-scene-3d
      [cameraPosition]="[0, 0, 12]"
      [cameraFov]="50"
      [backgroundColor]="null"
    >
      <!-- SparkleCorona for particle effect -->
      <a3d-sparkle-corona
        [count]="5000"
        [innerRadius]="3.5"
        [outerRadius]="6.0"
        [baseSize]="0.05"
        [position]="spherePosition()"
        [twinkleSpeed]="1.5"
        [colorWeights]="{ white: 0.4, peach: 0.4, gold: 0.2 }"
      />
    </a3d-scene-3d>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlassSphereSceneComponent implements OnDestroy {
  /**
   * Scroll progress from 0 (bottom) to 1 (top)
   * Controls sphere position from bottom-center to top-right
   */
  public readonly scrollProgress = input<number>(0);

  // Dependency injection
  private readonly sceneService = inject(SceneService);

  // Three.js objects
  private sphere: THREE.Mesh | null = null;
  private initialized = false;

  /**
   * Computed sphere position based on scroll progress
   *
   * Start: bottom-center (0, -4, 0)
   * End: top-right (5, 3, 0)
   * Easing: ease-out cubic for smooth deceleration
   */
  public readonly spherePosition = computed((): [number, number, number] => {
    // Scroll-based sphere position animation
    // BlueYard reference: Sphere starts on LEFT side, moves to top-right corner
    const startX = -5; // LEFT side of screen (visible on left half)
    const startY = -1; // Slightly below center
    const endX = 6; // Top-right corner
    const endY = 4;

    // Ease-out cubic: 1 - (1 - p)^3
    const p = Math.max(0, Math.min(1, this.scrollProgress()));
    const eased = 1 - Math.pow(1 - p, 3);

    const x = startX + (endX - startX) * eased;
    const y = startY + (endY - startY) * eased;

    return [x, y, 0];
  });

  /**
   * Computed sphere scale based on scroll progress
   *
   * Implements marble-to-sun transformation:
   * Start: 1.0 (full size - prominent marble)
   * End: 0.3 (small size - sun in corner)
   */
  public readonly sphereScale = computed((): number => {
    const p = Math.max(0, Math.min(1, this.scrollProgress()));

    // Ease-out cubic for smooth transition
    const eased = 1 - Math.pow(1 - p, 3);

    // Scale from 1.0 to 0.3 (sun size)
    const startScale = 1.0;
    const endScale = 0.3;
    return startScale + (endScale - startScale) * eased;
  });

  public constructor() {
    // Effect to initialize scene when SceneService is ready
    effect(() => {
      const scene = this.sceneService.scene();
      const renderer = this.sceneService.renderer() as THREE.WebGPURenderer;
      const camera = this.sceneService.camera();

      if (scene && renderer && camera && !this.initialized) {
        // Check if renderer has valid size
        const size = new THREE.Vector2();
        renderer.getSize(size);

        if (size.width === 0 || size.height === 0) {
          // Retry after a short delay if size is not ready
          setTimeout(() => {
            renderer.getSize(size);
            if (size.width > 0 && size.height > 0 && !this.initialized) {
              this.initialized = true;
              this.setupScene(scene, renderer);
            }
          }, 100);
          return;
        }

        this.initialized = true;
        // Defer setup to next tick to avoid change detection issues
        setTimeout(() => {
          this.setupScene(scene, renderer);
        }, 0);
      }
    });

    // Effect to update sphere position and scale when scrollProgress changes
    effect(() => {
      const position = this.spherePosition();
      const scale = this.sphereScale();
      if (this.sphere) {
        this.sphere.position.set(...position);
        this.sphere.scale.setScalar(scale);
      }
    });
  }

  /**
   * Setup the complete 3D scene
   */
  private setupScene(scene: THREE.Scene, renderer: THREE.WebGPURenderer): void {
    try {
      // Task 2.2: Setup environment map for glossy reflections
      this.setupEnvironment(scene, renderer);

      // Task 2.3: Create glass sphere with TSL material
      this.createGlassSphere(scene);

      console.log(
        '[GlassSphereScene] Scene setup complete - coral sphere with particles'
      );
    } catch (error) {
      console.error('[GlassSphereScene] Error during setup:', error);
    }
  }

  /**
   * Task 2.2: Create PMREMGenerator environment map
   *
   * Creates a warm cream/peach environment for realistic glass reflections.
   * Uses "light spheres" positioned in the environment to create
   * specular highlights on the glass surface.
   *
   * Pattern: volumetric-caustics-scene.component.ts:177-232
   */
  private setupEnvironment(
    scene: THREE.Scene,
    renderer: THREE.WebGPURenderer
  ): void {
    // Create PMREMGenerator for prefiltered reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Create environment scene for warm cream/peach reflections
    const envScene = new THREE.Scene();

    // Background sphere: warm cream color
    // This creates the base color for all reflections
    const bgGeometry = new THREE.SphereGeometry(50, 32, 32);
    const bgMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff0e0, // Warm cream (255, 240, 224)
      side: THREE.BackSide,
    });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    envScene.add(bgMesh);

    // Light 1: White sphere for bright specular highlights
    // Positioned high and to the side for natural key light reflection
    const light1Geometry = new THREE.SphereGeometry(8, 16, 16);
    const light1Material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const light1 = new THREE.Mesh(light1Geometry, light1Material);
    light1.position.set(30, 40, 20);
    envScene.add(light1);

    // Light 2: Warm peach sphere for secondary highlight
    // Positioned opposite to create dimension
    const light2Geometry = new THREE.SphereGeometry(4, 16, 16);
    const light2Material = new THREE.MeshBasicMaterial({ color: 0xffd4a0 }); // Warm peach (255, 212, 160)
    const light2 = new THREE.Mesh(light2Geometry, light2Material);
    light2.position.set(-25, 15, -20);
    envScene.add(light2);

    // Light 3: Additional soft white for fill
    const light3Geometry = new THREE.SphereGeometry(6, 16, 16);
    const light3Material = new THREE.MeshBasicMaterial({ color: 0xfff8f0 }); // Soft warm white
    const light3 = new THREE.Mesh(light3Geometry, light3Material);
    light3.position.set(-10, -20, 30);
    envScene.add(light3);

    // Generate environment map using CubeCamera
    const envCamera = new THREE.CubeCamera(
      0.1,
      100,
      new THREE.WebGLCubeRenderTarget(256)
    );
    envCamera.update(renderer, envScene);

    // Create prefiltered environment map
    const envMap = pmremGenerator.fromCubemap(
      envCamera.renderTarget.texture
    ).texture;

    // Apply to scene for all materials to use
    scene.environment = envMap;

    // Cleanup temporary resources
    bgGeometry.dispose();
    bgMaterial.dispose();
    light1Geometry.dispose();
    light1Material.dispose();
    light2Geometry.dispose();
    light2Material.dispose();
    light3Geometry.dispose();
    light3Material.dispose();
    pmremGenerator.dispose();
  }

  /**
   * Task 2.3: Create glass sphere with TSL material
   *
   * Creates a glossy glass sphere using MeshStandardNodeMaterial with:
   * - Low roughness (0.1) for sharp reflections
   * - Warm white base color
   * - Fresnel edge glow for glass rim effect
   *
   * IMPORTANT: Edge glow intensity is 0.15 (SUBTLE), NOT 2.2 (sun-like)
   *
   * Pattern: volumetric-caustics-scene.component.ts:254-354
   */
  private createGlassSphere(scene: THREE.Scene): void {
    // Sphere geometry with high segments for smooth surface
    // Radius 4.5 to match BlueYard prominence
    const geometry = new THREE.SphereGeometry(4.5, 64, 64);

    // MeshStandardNodeMaterial for PBR rendering with TSL nodes
    const material = new THREE.MeshStandardNodeMaterial({
      metalness: 0.0, // Non-metallic for glass
      roughness: 0.1, // LOW roughness = glossy reflections (KEY!)
      transparent: true,
      opacity: 0.95,
    });

    // Strong coral/pink base color matching BlueYard design
    // This creates the warm glow that makes particles visible
    material.colorNode = vec3(1.0, 0.75, 0.65);

    // TSL Fresnel edge glow for glass rim effect
    // Pattern from volumetric-caustics-scene.component.ts:339-345
    const fresnelEdgeGlow = Fn(() => {
      // Calculate view direction from camera to surface point
      const viewDir = normalize(cameraPosition.sub(positionWorld));

      // Rim factor: 1 at edges (perpendicular to view), 0 at center (facing camera)
      const rim = float(1).sub(abs(dot(normalWorld, viewDir)));

      // Power function to concentrate glow at edges
      // Higher power = thinner glow line
      const fresnelPower = pow(rim, float(2.5));

      // Strong coral edge glow matching BlueYard design
      // RGB: (1.0, 0.6, 0.5) - warm coral rim
      // Intensity: 0.4 - prominent glow
      const edgeGlow = vec3(1.0, 0.6, 0.5).mul(fresnelPower).mul(0.4);

      return edgeGlow;
    });

    // Apply fresnel glow to emissive channel
    material.emissiveNode = fresnelEdgeGlow();

    // Create mesh
    this.sphere = new THREE.Mesh(geometry, material);

    // Set initial position based on scroll progress
    const initialPosition = this.spherePosition();
    this.sphere.position.set(...initialPosition);

    // No shadows for glass (would look wrong)
    this.sphere.castShadow = false;
    this.sphere.receiveShadow = false;

    // Add to scene
    scene.add(this.sphere);
  }

  /**
   * Cleanup Three.js resources
   */
  public ngOnDestroy(): void {
    if (this.sphere) {
      // Get scene reference before cleanup
      const scene = this.sceneService.scene();

      // Remove from scene
      if (scene) {
        scene.remove(this.sphere);
      }

      // Dispose geometry
      this.sphere.geometry.dispose();

      // Dispose material
      if (this.sphere.material instanceof THREE.Material) {
        this.sphere.material.dispose();
      }

      this.sphere = null;
    }
  }
}
