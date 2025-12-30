import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
} from '@angular/core';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { bayer16 } from 'three/addons/tsl/math/Bayer.js';
import {
  Fn,
  frameId,
  pass,
  screenCoordinate,
  screenUV,
  texture3D,
  time,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  BoxComponent,
  OrbitControlsComponent,
  PointLightComponent,
  RenderLoopService,
  Rotate3dDirective,
  Scene3dComponent,
  SceneService,
  SpotLightComponent,
  SvgIconComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Angular Crystal Caustics Scene
 *
 * Showcases a rotating glass cube with an Angular logo inside,
 * volumetric lighting, and bloom post-processing effects.
 * Uses composed library components instead of external GLTF models.
 */
@Component({
  selector: 'app-volumetric-caustics-scene',
  standalone: true,
  imports: [
    Scene3dComponent,
    BoxComponent,
    SvgIconComponent,
    SpotLightComponent,
    PointLightComponent,
    OrbitControlsComponent,
    Rotate3dDirective,
  ],
  template: `
    <a3d-scene-3d
      [cameraPosition]="[0, 0.3, 0.8]"
      [cameraNear]="0.025"
      [cameraFar]="5"
      [frameloop]="'always'"
      [backgroundColor]="backgroundColor"
      [enableShadows]="true"
    >
      <!-- Main spotlight for caustics effect -->
      <a3d-spot-light
        [position]="[0.3, 0.5, 0.3]"
        [angle]="Math.PI / 5"
        [penumbra]="0.8"
        [decay]="2"
        [distance]="2"
        [intensity]="3"
        [castShadow]="true"
        [color]="SCENE_COLORS.white"
      />

      <!-- Rotating Glass Cube -->
      <a3d-box
        [position]="[0, 0.15, 0]"
        [args]="[0.2, 0.2, 0.2]"
        [color]="glassColor"
        [emissive]="glassEmissive"
        [emissiveIntensity]="0.5"
        rotate3d
        [rotateConfig]="{ axis: 'y', speed: 15, direction: 1 }"
      />

      <!-- Angular Logo floating inside - synchronized rotation -->
      <a3d-svg-icon
        svgPath="images/logos/angular.svg"
        [position]="[0, 0.15, 0]"
        [scale]="0.0008"
        [depth]="0.03"
        [color]="angularRed"
        [emissive]="angularRed"
        [emissiveIntensity]="2.5"
        [metalness]="0.3"
        [roughness]="0.2"
        rotate3d
        [rotateConfig]="{ axis: 'y', speed: 15, direction: 1 }"
      />

      <!-- Neon accent lights for cyberpunk aesthetic -->
      <a3d-point-light
        [position]="[0.4, 0.2, 0.1]"
        [color]="angularRed"
        [intensity]="0.8"
        [distance]="1.5"
      />
      <a3d-point-light
        [position]="[-0.4, 0.2, -0.1]"
        [color]="neonCyan"
        [intensity]="0.5"
        [distance]="1.5"
      />

      <!-- Orbit controls for interactive viewing -->
      <a3d-orbit-controls
        [target]="[0, 0.15, 0]"
        [maxDistance]="2"
        [minDistance]="0.3"
      />
    </a3d-scene-3d>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumetricCausticsSceneComponent
  implements AfterViewInit, OnDestroy
{
  protected readonly SCENE_COLORS = SCENE_COLORS;
  protected readonly Math = Math;

  // Custom scene colors
  protected readonly backgroundColor = 0x050510;
  protected readonly glassColor = 0x88ccff;
  protected readonly glassEmissive = 0x001122;
  protected readonly angularRed = 0xdd0031;
  protected readonly neonCyan = 0x00ddff;

  private readonly sceneService = inject(SceneService);
  private readonly renderLoop = inject(RenderLoopService);

  private postProcessing: THREE.PostProcessing | null = null;

  public ngAfterViewInit(): void {
    const scene = this.sceneService.scene();
    const renderer = this.sceneService.renderer() as THREE.WebGPURenderer;
    const camera = this.sceneService.camera();

    if (!scene || !renderer || !camera) {
      console.warn('Scene not fully initialized for TSL setup');
      return;
    }

    this.setupSpotLight(scene);
    this.setupGround(scene);
    this.setupVolumetric(scene, camera, renderer);
  }

  private setupSpotLight(scene: THREE.Scene): void {
    const LAYER_VOLUMETRIC_LIGHTING = 10;
    scene.traverse((obj) => {
      if (obj instanceof THREE.SpotLight) {
        obj.shadow.mapType = THREE.HalfFloatType;
        obj.shadow.mapSize.width = 1024;
        obj.shadow.mapSize.height = 1024;
        obj.shadow.camera.near = 0.1;
        obj.shadow.camera.far = 2;
        obj.shadow.bias = -0.002;
        obj.layers.enable(LAYER_VOLUMETRIC_LIGHTING);
      }
    });
  }

  private setupGround(scene: THREE.Scene): void {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0x111122,
      roughness: 0.8,
      metalness: 0.2,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
  }

  private setupVolumetric(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGPURenderer
  ): void {
    const LAYER_VOLUMETRIC_LIGHTING = 10;
    const volumetricLightingIntensity = uniform(0.6);

    const volumetricLayer = new THREE.Layers();
    volumetricLayer.disableAll();
    volumetricLayer.enable(LAYER_VOLUMETRIC_LIGHTING);

    // Create 3D noise texture for volumetric fog
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
    const smokeAmount = uniform(2.5);

    const volumetricMaterial = new THREE.VolumeNodeMaterial();
    volumetricMaterial.steps = 20;
    volumetricMaterial.offsetNode = bayer16(screenCoordinate.add(frameId));

    volumetricMaterial.scatteringNode = Fn((nodeBuilder: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder = nodeBuilder as any;
      const timeScaled = vec3(time.mul(0.01), 0, time.mul(0.03));
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
      new THREE.BoxGeometry(1.5, 0.6, 1.5),
      volumetricMaterial
    );
    volumetricMesh.receiveShadow = true;
    volumetricMesh.position.y = 0.3;
    volumetricMesh.layers.disableAll();
    volumetricMesh.layers.enable(LAYER_VOLUMETRIC_LIGHTING);
    scene.add(volumetricMesh);

    // Post Processing with bloom
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

    const bloomPass = bloom(volumetricPass, 1.2, 0.8, 0);

    const scenePassColor = scenePass.add(
      bloomPass.mul(volumetricLightingIntensity)
    );

    this.postProcessing.outputNode = scenePassColor;

    // Override render loop for post-processing
    this.renderLoop.setRenderFunction(() => {
      this.postProcessing?.render();
    });
  }

  public ngOnDestroy(): void {
    this.postProcessing = null;
  }
}
