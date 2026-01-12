/**
 * CloudLayerComponent - GPU-Optimized Volumetric Clouds
 *
 * Creates realistic cloud layers matching the MrDoob reference.
 * Uses merged geometries for optimal GPU performance.
 * Now uses TSL (Three.js Shading Language) for WebGPU/WebGL native materials.
 *
 * @example
 * ```html
 * <a3d-cloud-layer
 *   [textureUrl]="'clouds/cloud10.png'"
 *   [cloudCount]="8000"
 * />
 * ```
 */

import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  PLATFORM_ID,
} from '@angular/core';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { SceneService } from '../../canvas/scene.service';
import { injectTextureLoader } from '../../loaders/inject-texture-loader';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { NG_3D_PARENT } from '../../types/tokens';
import { applyFog, clampForBloom } from '../shaders/tsl-utilities';

import * as TSL from 'three/tsl';

const { texture, uv, positionView, float, pow, color } = TSL;

@Component({
  selector: 'a3d-cloud-layer',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudLayerComponent {
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private readonly renderLoop = inject(RenderLoopService);
  private readonly sceneService = inject(SceneService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  // Required: Cloud texture URL
  public readonly textureUrl = input.required<string>();

  // Cloud configuration - defaults match reference
  public readonly cloudCount = input<number>(8000);
  public readonly planeSize = input<number>(64);

  // Fog settings - defaults match reference
  public readonly fogColor = input<string | number>('#4584b4');
  public readonly fogNear = input<number>(-100);
  public readonly fogFar = input<number>(3000);

  // Animation
  public readonly speed = input<number>(0.03);
  public readonly mouseParallax = input<boolean>(true);

  // Texture loader
  private readonly textureResource = injectTextureLoader(this.textureUrl);

  // Three.js objects
  private cloudMesh: THREE.Mesh | null = null;
  private cloudMeshBack: THREE.Mesh | null = null;
  private material: MeshBasicNodeMaterial | null = null;
  private startTime = 0;
  private mouseX = 0;
  private mouseY = 0;
  private windowHalfX = 0;
  private windowHalfY = 0;

  // Handler reference for cleanup
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private animationCleanup: (() => void) | null = null;

  public constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.startTime = Date.now();
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;

    // Create clouds when texture is loaded
    effect(() => {
      const loadedTexture = this.textureResource.data();
      if (!loadedTexture) return;

      this.createClouds(loadedTexture);
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  private createClouds(loadedTexture: THREE.Texture): void {
    const parent = this.parentFn?.();
    if (!parent) {
      console.warn('[CloudLayerComponent] No parent found');
      return;
    }

    // Cleanup existing
    this.cleanup();

    // Configure texture - exact match to reference
    loadedTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTexture.magFilter = THREE.LinearFilter;
    loadedTexture.minFilter = THREE.LinearMipMapLinearFilter;

    // Create TSL-based material
    this.material = this.createCloudMaterial(loadedTexture);

    // Create merged geometry - EXACT match to reference positioning
    const geometry = this.createMergedCloudGeometry();

    // Create main cloud mesh
    this.cloudMesh = new THREE.Mesh(geometry, this.material);
    this.cloudMesh.renderOrder = 2;

    // Create back copy for seamless looping (at -8000)
    this.cloudMeshBack = this.cloudMesh.clone();
    this.cloudMeshBack.position.z = -8000;
    this.cloudMeshBack.renderOrder = 1;

    // Add to scene
    parent.add(this.cloudMesh);
    parent.add(this.cloudMeshBack);

    // Setup mouse parallax
    if (this.mouseParallax()) {
      this.setupMouseParallax();
    }

    // Start animation
    this.startAnimation();
  }

  /**
   * Create TSL-based cloud material
   * Replaces GLSL ShaderMaterial with native TSL nodes
   */
  private createCloudMaterial(
    cloudTexture: THREE.Texture
  ): MeshBasicNodeMaterial {
    const fogColorValue = this.fogColor();
    const fogColorThree = new THREE.Color(fogColorValue);

    // Create TSL nodes for the material
    // Sample the cloud texture
    const texColor = texture(cloudTexture, uv());

    // Calculate view depth for fog (use view-space z position)
    const depth = positionView.z.negate();

    // Apply depth-based alpha modification (matches original: pow(gl_FragCoord.z, 20.0))
    // Use a power curve to fade clouds based on depth
    const depthFade = pow(depth.div(3000).clamp(0, 1), float(0.5));
    const alphaWithDepth = texColor.a.mul(depthFade);

    // Apply fog to the color
    const foggedColor = applyFog(
      texColor,
      color(fogColorThree),
      float(this.fogNear()),
      float(this.fogFar()),
      depth
    );

    // Clamp RGB to stay below bloom threshold (0.85)
    const clampedColor = clampForBloom(foggedColor, 0.85);

    // Create MeshBasicNodeMaterial with TSL nodes
    const material = new MeshBasicNodeMaterial();
    material.colorNode = clampedColor;
    material.opacityNode = alphaWithDepth;
    material.transparent = true;
    material.depthWrite = false;
    material.depthTest = false;

    return material;
  }

  private createMergedCloudGeometry(): THREE.BufferGeometry {
    // EXACT match to reference: 64x64 plane
    const planeGeo = new THREE.PlaneGeometry(
      this.planeSize(),
      this.planeSize()
    );
    const tempObject = new THREE.Object3D();
    const geometries: THREE.BufferGeometry[] = [];

    const count = this.cloudCount();

    for (let i = 0; i < count; i++) {
      // EXACT positioning from reference:
      // x: random() * 1000 - 500 (spread -500 to +500)
      // y: -random() * random() * 200 - 15 (clouds below camera, concentrated)
      // z: i (0 to cloudCount, spread along depth)
      tempObject.position.x = Math.random() * 1000 - 500;
      tempObject.position.y = -Math.random() * Math.random() * 200 - 15;
      tempObject.position.z = i;

      // Random rotation
      tempObject.rotation.z = Math.random() * Math.PI;

      // Random scale: 0.5 to 2.0
      tempObject.scale.x = tempObject.scale.y =
        Math.random() * Math.random() * 1.5 + 0.5;

      tempObject.updateMatrix();

      const clonedGeo = planeGeo.clone();
      clonedGeo.applyMatrix4(tempObject.matrix);
      geometries.push(clonedGeo);
    }

    const mergedGeo = mergeGeometries(geometries);

    // Cleanup
    geometries.forEach((g) => g.dispose());
    planeGeo.dispose();

    return mergedGeo;
  }

  private startAnimation(): void {
    // Animation loop - moves CLOUDS, not camera (keeps other scene objects stationary)
    this.animationCleanup = this.renderLoop.registerUpdateCallback(() => {
      const camera = this.sceneService.camera();
      if (!camera) return;

      // Calculate position based on time
      const elapsed = Date.now() - this.startTime;
      const position = (elapsed * this.speed()) % 8000;

      // Mouse parallax on camera (subtle effect)
      if (this.mouseParallax()) {
        camera.position.x += (this.mouseX - camera.position.x) * 0.01;
        camera.position.y += (-this.mouseY - camera.position.y) * 0.01;
      }

      // Move CLOUD MESHES instead of camera
      // This keeps text and other scene objects stationary!
      if (this.cloudMesh) {
        this.cloudMesh.position.z = position;
      }
      if (this.cloudMeshBack) {
        this.cloudMeshBack.position.z = position;
      }
    });
  }

  private setupMouseParallax(): void {
    if (this.mouseMoveHandler) return;

    this.mouseMoveHandler = (event: MouseEvent) => {
      this.mouseX = (event.clientX - this.windowHalfX) * 0.25;
      this.mouseY = (event.clientY - this.windowHalfY) * 0.15;
    };

    document.addEventListener('mousemove', this.mouseMoveHandler, false);
  }

  private cleanup(): void {
    const parent = this.parentFn?.();

    if (this.animationCleanup) {
      this.animationCleanup();
      this.animationCleanup = null;
    }

    if (this.cloudMesh) {
      parent?.remove(this.cloudMesh);
      this.cloudMesh.geometry?.dispose();
      this.cloudMesh = null;
    }

    if (this.cloudMeshBack) {
      parent?.remove(this.cloudMeshBack);
      this.cloudMeshBack.geometry?.dispose();
      this.cloudMeshBack = null;
    }

    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    if (this.mouseMoveHandler) {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
  }
}
