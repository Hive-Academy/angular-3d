/**
 * Volumetric Caustics Scene - Raymarched Magical Marble Hero
 *
 * Implements the "Magical Marbles" effect using TSL raymarching.
 * Based on the Codrops tutorial: https://tympanus.net/codrops/2021/08/02/magical-marbles-in-three-js/
 *
 * The effect creates fake volume inside a glass sphere by:
 * 1. Raymarching from surface towards center
 * 2. Sampling a 3D noise pattern at each step
 * 3. Accumulating "volume" to mix between two colors
 * 4. Animating with time-based displacement
 */
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  inject,
} from '@angular/core';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { bayer16 } from 'three/addons/tsl/math/Bayer.js';
import {
  Fn,
  Loop,
  abs,
  cameraPosition,
  clamp,
  cos,
  dot,
  float,
  frameId,
  mix,
  normalWorld,
  normalize,
  pass,
  positionLocal,
  positionWorld,
  pow,
  screenCoordinate,
  screenUV,
  sin,
  smoothstep,
  texture3D,
  time,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  OrbitControlsComponent,
  PointLightComponent,
  RenderLoopService,
  Scene3dComponent,
  SceneService,
  SpotLightComponent,
  nativeFBM,
  tslCausticsTexture,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Child Component: Raymarched Magical Marble Hero Scene
 */
@Component({
  selector: 'app-volumetric-caustics-content',
  standalone: true,
  imports: [SpotLightComponent, PointLightComponent, OrbitControlsComponent],
  template: `
    <!-- Main spotlight for volumetric effect -->
    <a3d-spot-light
      [position]="[0.5, 0.7, 0.5]"
      [angle]="Math.PI / 4"
      [penumbra]="0.9"
      [decay]="2"
      [distance]="3"
      [intensity]="4"
      [castShadow]="true"
      [color]="spotlightColor"
    />

    <!-- Teal accent light -->
    <a3d-point-light
      [position]="[0.5, 0.3, 0.3]"
      [color]="tealAccent"
      [intensity]="2"
      [distance]="2"
    />

    <!-- Cool backlight -->
    <a3d-point-light
      [position]="[-0.5, 0.2, -0.3]"
      [color]="coolBacklight"
      [intensity]="1"
      [distance]="2"
    />

    <!-- Orbit controls -->
    <a3d-orbit-controls
      [target]="[0, 0.25, 0]"
      [maxDistance]="1.5"
      [minDistance]="0.4"
      [autoRotate]="true"
      [autoRotateSpeed]="0.6"
      [enableDamping]="true"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumetricCausticsContentComponent implements OnDestroy {
  protected readonly SCENE_COLORS = SCENE_COLORS;
  protected readonly Math = Math;

  // Emerald/teal color scheme matching the reference
  protected readonly spotlightColor = 0xffffff;
  protected readonly tealAccent = 0x00897b; // Darker teal
  protected readonly coolBacklight = 0x26a69a; // Medium teal

  private readonly sceneService = inject(SceneService);
  private readonly renderLoop = inject(RenderLoopService);

  private postProcessing: THREE.PostProcessing | null = null;
  private marble: THREE.Mesh | null = null;
  private initialized = false;

  public constructor() {
    effect(() => {
      const scene = this.sceneService.scene();
      const renderer = this.sceneService.renderer() as THREE.WebGPURenderer;
      const camera = this.sceneService.camera();

      if (scene && renderer && camera && !this.initialized) {
        const size = new THREE.Vector2();
        renderer.getSize(size);

        if (size.width === 0 || size.height === 0) {
          setTimeout(() => {
            renderer.getSize(size);
            if (size.width > 0 && size.height > 0 && !this.initialized) {
              this.initialized = true;
              this.setupScene(scene, camera, renderer);
            }
          }, 100);
          return;
        }

        this.initialized = true;
        setTimeout(() => {
          this.setupScene(scene, camera, renderer);
        }, 0);
      }
    });
  }

  private setupScene(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGPURenderer
  ): void {
    try {
      // Create environment map for glossy reflections (key to the Codrops effect)
      this.setupEnvironment(scene, renderer);
      this.setupLighting(scene);
      this.setupRaymarchedMarble(scene);
      this.setupGround(scene);
      this.setupVolumetric(scene, camera, renderer);
      console.log('[MagicalMarble] Raymarched hero scene setup complete');
    } catch (e) {
      console.error('[MagicalMarble] Error during setup:', e);
    }
  }

  /**
   * Create a simple procedural environment map for reflections
   * This is what gives the marble its glossy "glass shell" appearance
   */
  private setupEnvironment(
    scene: THREE.Scene,
    renderer: THREE.WebGPURenderer
  ): void {
    // Create a simple gradient environment using a render target
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Create a simple gradient scene for the environment
    const envScene = new THREE.Scene();

    // Create gradient background using a large sphere with gradient material
    const envGeometry = new THREE.SphereGeometry(50, 32, 32);
    const envMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a4a4a, // Teal-ish environment
      side: THREE.BackSide,
    });
    const envMesh = new THREE.Mesh(envGeometry, envMaterial);
    envScene.add(envMesh);

    // Add some "lights" in the environment for reflections
    const light1 = new THREE.Mesh(
      new THREE.SphereGeometry(5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    light1.position.set(20, 30, 20);
    envScene.add(light1);

    const light2 = new THREE.Mesh(
      new THREE.SphereGeometry(3, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x80ffff })
    );
    light2.position.set(-20, 10, -15);
    envScene.add(light2);

    // Generate environment map from the scene
    const envCamera = new THREE.CubeCamera(
      0.1,
      100,
      new THREE.WebGLCubeRenderTarget(256)
    );
    envCamera.update(renderer, envScene);

    const envMap = pmremGenerator.fromCubemap(
      envCamera.renderTarget.texture
    ).texture;

    // Apply environment map to scene
    scene.environment = envMap;

    // Cleanup
    envGeometry.dispose();
    envMaterial.dispose();
    pmremGenerator.dispose();
  }

  private setupLighting(scene: THREE.Scene): void {
    const LAYER_VOLUMETRIC_LIGHTING = 10;
    scene.traverse((obj) => {
      if (obj instanceof THREE.SpotLight) {
        obj.shadow.mapType = THREE.HalfFloatType;
        obj.shadow.mapSize.width = 1024;
        obj.shadow.mapSize.height = 1024;
        obj.shadow.camera.near = 0.1;
        obj.shadow.camera.far = 3;
        obj.shadow.bias = -0.002;
        obj.layers.enable(LAYER_VOLUMETRIC_LIGHTING);
      }
    });
  }

  /**
   * Create a magical marble using TSL raymarching
   * This replicates the Codrops "Magical Marbles" effect using TSL instead of onBeforeCompile
   * Key: Use MeshStandardNodeMaterial with LOW ROUGHNESS for glossy shell reflections
   */
  private setupRaymarchedMarble(scene: THREE.Scene): void {
    const geometry = new THREE.SphereGeometry(0.2, 64, 64);

    // Use MeshStandardNodeMaterial (like Codrops) with LOW roughness for glossy reflections
    // The glossy "shell" comes from the low roughness + environment map reflections
    const material = new THREE.MeshStandardNodeMaterial({
      metalness: 0.0,
      roughness: 0.1, // KEY: Low roughness = glossy reflections (matches Codrops)
    });

    // Colors for the marble (emerald green like reference)
    const colorA = vec3(0.0, 0.2, 0.15); // Dark emerald
    const colorB = vec3(0.4, 0.9, 0.7); // Bright teal-green

    // Raymarching parameters
    const iterations = 16;
    const depth = float(0.8);
    const smoothingFactor = float(0.15);

    // TSL Raymarching function for fake volume
    const raymarchMarble = Fn(() => {
      // Ray direction from camera to surface point
      const rayDir = normalize(positionWorld.sub(cameraPosition)).negate();

      // Start position (on sphere surface, in local space)
      const rayOrigin = positionLocal.normalize();

      // Per-iteration step
      const perIteration = float(1.0).div(float(iterations));
      const deltaRay = rayDir.mul(perIteration).mul(depth);

      // Accumulate volume
      const totalVolume = float(0).toVar();
      const p = vec3(rayOrigin).toVar();

      // Time-based animation for wavy motion
      const t = time.mul(0.3);

      // Loop through iterations
      Loop(iterations, ({ i }) => {
        // Animated displacement using noise
        const displacement = vec3(
          sin(p.x.mul(5).add(t)),
          cos(p.y.mul(5).add(t.mul(0.7))),
          sin(p.z.mul(5).add(t.mul(1.2)))
        ).mul(0.15);

        const displacedP = p.add(displacement);

        // Sample 3D noise at current position (acts as heightmap)
        const noiseVal = nativeFBM(
          displacedP.mul(3),
          float(4),
          float(2.0),
          float(0.5)
        )
          .add(1)
          .div(2);

        // Calculate cutoff based on iteration depth
        const cutoff = float(1).sub(float(i).mul(perIteration));

        // Take a slice with smoothstep
        const slice = smoothstep(cutoff, cutoff.add(smoothingFactor), noiseVal);

        // Accumulate volume
        totalVolume.addAssign(slice.mul(perIteration));

        // March ray forward
        p.addAssign(deltaRay);
      });

      // Clamp total volume
      const volume = clamp(totalVolume, float(0), float(1));

      // Mix colors based on volume (using HDR-like boost for richness)
      const marbleColor = mix(colorA, colorB, volume.pow(0.7));

      return marbleColor;
    });

    // Apply raymarched color to the material
    material.colorNode = raymarchMarble();

    // Add fresnel rim for glass edge effect
    const viewDir = normalize(cameraPosition.sub(positionWorld));
    const rim = float(1).sub(abs(dot(normalWorld, viewDir)));
    const fresnelPower = pow(rim, float(3.0));

    // Teal edge glow
    const edgeGlow = vec3(0.3, 0.8, 0.7).mul(fresnelPower).mul(0.6);
    material.emissiveNode = edgeGlow;

    // Create mesh
    this.marble = new THREE.Mesh(geometry, material);
    this.marble.position.set(0, 0.25, 0);
    this.marble.castShadow = true;
    this.marble.receiveShadow = true;

    scene.add(this.marble);
  }

  /**
   * Create ground plane with animated TSL caustic texture
   */
  private setupGround(scene: THREE.Scene): void {
    const geometry = new THREE.PlaneGeometry(3, 3);

    const material = new THREE.MeshStandardNodeMaterial({
      roughness: 0.5,
      metalness: 0.2,
    });

    // Apply animated caustics texture with teal tint
    const caustics = tslCausticsTexture({
      scale: 2.5,
      speed: 0.6,
      color: new THREE.Color(0x26a69a),
      seed: 42,
    });

    const baseColor = vec3(0.01, 0.04, 0.03);
    const causticIntensity = float(0.4);
    material.colorNode = mix(baseColor, caustics, causticIntensity);

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  /**
   * Setup volumetric fog with teal-tinted caustic light rays
   */
  private setupVolumetric(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGPURenderer
  ): void {
    const LAYER_VOLUMETRIC_LIGHTING = 10;
    const volumetricLightingIntensity = uniform(0.5);

    const volumetricLayer = new THREE.Layers();
    volumetricLayer.disableAll();
    volumetricLayer.enable(LAYER_VOLUMETRIC_LIGHTING);

    const createTexture3D = (): THREE.Data3DTexture => {
      let i = 0;
      const size = 128;
      const data = new Uint8Array(size * size * size);
      const scale = 10;
      const perlin = new ImprovedNoise();
      const repeatFactor = 5.0;

      for (let z = 0; z < size; z++) {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            const nx = (x / size) * repeatFactor;
            const ny = (y / size) * repeatFactor;
            const nz = (z / size) * repeatFactor;
            const noiseValue = perlin.noise(nx * scale, ny * scale, nz * scale);
            data[i] = 128 + 128 * noiseValue;
            i++;
          }
        }
      }
      const tex = new THREE.Data3DTexture(data, size, size, size);
      tex.format = THREE.RedFormat;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.unpackAlignment = 1;
      tex.needsUpdate = true;
      return tex;
    };

    const noiseTexture3D = createTexture3D();
    const smokeAmount = uniform(2.0);

    const volumetricMaterial = new THREE.VolumeNodeMaterial();
    volumetricMaterial.steps = 20;
    volumetricMaterial.offsetNode = bayer16(screenCoordinate.add(frameId));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    volumetricMaterial.scatteringNode = Fn((nodeBuilder: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder = nodeBuilder as any;
      const timeScaled = vec3(time.mul(0.01), float(0), time.mul(0.03));
      const sampleGrain = (s: number, ts = 1) =>
        texture3D(
          noiseTexture3D,
          builder.positionRay.add(timeScaled.mul(ts)).mul(s).mod(1).toVar(),
          0
        ).r.add(0.5);

      let density = sampleGrain(1);
      density = density.mul(sampleGrain(0.5, 1));
      density = density.mul(sampleGrain(0.2, 2));

      return smokeAmount.mix(1, density);
    });

    const volumetricMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.8, 2),
      volumetricMaterial
    );
    volumetricMesh.receiveShadow = true;
    volumetricMesh.position.y = 0.4;
    volumetricMesh.layers.disableAll();
    volumetricMesh.layers.enable(LAYER_VOLUMETRIC_LIGHTING);
    scene.add(volumetricMesh);

    // Post Processing
    this.postProcessing = new THREE.PostProcessing(renderer);

    const scenePass = pass(scene, camera);
    const sceneDepth = scenePass.getTextureNode('depth');

    volumetricMaterial.depthNode = sceneDepth.sample(screenUV);

    const volumetricPass = pass(scene, camera, {
      depthBuffer: false,
      samples: 0,
    });
    volumetricPass.setLayers(volumetricLayer);
    volumetricPass.setResolutionScale(0.5);

    // Teal-tinted bloom
    const bloomPass = bloom(volumetricPass, 1.0, 0.5, 0);
    const tealTint = vec3(0.7, 1.0, 0.9);
    const tintedBloom = bloomPass.mul(tealTint);

    const scenePassColor = scenePass.add(
      tintedBloom.mul(volumetricLightingIntensity)
    );

    this.postProcessing.outputNode = scenePassColor;

    this.renderLoop.setRenderFunction(() => {
      this.postProcessing?.render();
    });
  }

  public ngOnDestroy(): void {
    if (this.marble) {
      this.marble.geometry.dispose();
      if (this.marble.material instanceof THREE.Material) {
        this.marble.material.dispose();
      }
    }
    this.postProcessing = null;
  }
}

/**
 * Parent Container
 */
@Component({
  selector: 'app-volumetric-caustics-scene',
  standalone: true,
  imports: [Scene3dComponent, VolumetricCausticsContentComponent],
  template: `
    <a3d-scene-3d
      [cameraPosition]="[0, 0.35, 0.7]"
      [cameraNear]="0.025"
      [cameraFar]="5"
      [frameloop]="'always'"
      [backgroundColor]="backgroundColor"
      [enableShadows]="true"
    >
      <app-volumetric-caustics-content />
    </a3d-scene-3d>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 85vh;
        min-height: 500px;
        position: relative;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumetricCausticsSceneComponent {
  // Dark emerald background
  protected readonly backgroundColor = 0x0a1a15;
}
