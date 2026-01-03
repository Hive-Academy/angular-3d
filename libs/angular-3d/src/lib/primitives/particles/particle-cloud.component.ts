/**
 * Particle Cloud Component
 *
 * Renders a cloud of discrete particles using GPU instancing.
 * Supports size variation, color gradients, and organic motion animation.
 *
 * Features:
 * - GPU instanced rendering (1 draw call for thousands of particles)
 * - Dramatic size variation (tiny stars to large orbs)
 * - Color gradients based on size
 * - Per-instance opacity variation
 * - Density gradients (denser in center)
 * - Organic noise-based motion
 * - Sphere boundary constraints
 *
 * @example
 * ```html
 * <!-- Interior dense cloud -->
 * <a3d-particle-cloud
 *   [count]="40000"
 *   [size]="0.08"
 *   [radiusMin]="0"
 *   [radiusMax]="4.3"
 *   [distribution]="'density-gradient'"
 *   [colorGradient]="['#ffffff', '#ffccaa', '#ff8866']"
 * />
 *
 * <!-- Exterior sparse background -->
 * <a3d-particle-cloud
 *   [count]="8000"
 *   [size]="0.03"
 *   [radiusMin]="4.7"
 *   [radiusMax]="9.0"
 *   [distribution]="'uniform'"
 *   [opacity]="0.3"
 * />
 * ```
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import * as THREE from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { uv, float, smoothstep, sub, length, vec2, mul } from 'three/tsl';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { NG_3D_PARENT } from '../../types/tokens';

@Component({
  selector: 'a3d-particle-cloud',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class ParticleCloudComponent {
  private readonly parent = inject(NG_3D_PARENT);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  /** Number of particles */
  readonly count = input<number>(10000);

  /** Base particle size */
  readonly size = input<number>(0.05);

  /** Minimum radius for particle distribution */
  readonly radiusMin = input<number>(0);

  /** Maximum radius for particle distribution */
  readonly radiusMax = input<number>(1.0);

  /** Position offset [x, y, z] */
  readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Distribution type */
  readonly distribution = input<'uniform' | 'density-gradient'>('uniform');

  /** Color gradient (array of hex colors) */
  readonly colorGradient = input<string[]>(['#ffffff']);

  /** Base opacity */
  readonly opacity = input<number>(0.8);

  /** Enable animation */
  readonly animated = input<boolean>(true);

  /** Animation speed */
  readonly animationSpeed = input<number>(0.3);

  private particlesMesh: THREE.InstancedMesh | null = null;
  private particlesGeometry: THREE.PlaneGeometry | null = null;
  private particlesMaterial: MeshBasicNodeMaterial | null = null;
  private particleData: Array<{
    velocity: THREE.Vector3;
    noiseOffset: THREE.Vector3;
    color: THREE.Color;
  }> = [];
  private particleUpdateCleanup: (() => void) | null = null;

  constructor() {
    afterNextRender(() => {
      this.createParticles();
      if (this.animated()) {
        this.setupAnimation();
      }
    });
  }

  private createParticles(): void {
    const count = this.count();
    const particleSize = this.size();
    const radiusMin = this.radiusMin();
    const radiusMax = this.radiusMax();
    const baseOpacity = this.opacity();
    const colors = this.parseColorGradient();

    // Generate positions
    const positions = this.generatePositions(count, radiusMin, radiusMax);

    // Create geometry
    this.particlesGeometry = new THREE.PlaneGeometry(1, 1);

    // Create TSL material with circular falloff
    const centeredUV = sub(uv(), vec2(0.5, 0.5));
    const dist = length(centeredUV);
    const circularAlpha = sub(float(1.0), smoothstep(float(0.0), float(0.7), dist));

    this.particlesMaterial = new MeshBasicNodeMaterial();
    this.particlesMaterial.transparent = true;
    this.particlesMaterial.depthWrite = false;
    this.particlesMaterial.blending = THREE.AdditiveBlending;
    this.particlesMaterial.side = THREE.DoubleSide;
    this.particlesMaterial.opacityNode = circularAlpha;
    this.particlesMaterial.vertexColors = true;

    // Create instanced mesh
    this.particlesMesh = new THREE.InstancedMesh(
      this.particlesGeometry,
      this.particlesMaterial,
      count
    );
    this.particlesMesh.frustumCulled = false;

    // Setup instances
    const matrix = new THREE.Matrix4();
    const colorBuffer = new Float32Array(count * 4); // RGBA
    this.particleData = [];

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];

      const distFromCenter = Math.sqrt(x * x + y * y + z * z);
      const normalizedDist = (distFromCenter - radiusMin) / (radiusMax - radiusMin);

      // Size variation (60% tiny, 25% medium, 15% large)
      const sizeRandom = Math.random();
      let sizeVariation;
      if (sizeRandom < 0.6) {
        sizeVariation = particleSize * (0.2 + Math.random() * 0.6); // Tiny
      } else if (sizeRandom < 0.85) {
        sizeVariation = particleSize * (0.8 + Math.random() * 0.7); // Medium
      } else {
        sizeVariation = particleSize * (1.5 + Math.random() * 1.5); // Large
      }

      // Color from gradient based on size
      const colorIndex = Math.min(
        Math.floor(normalizedDist * colors.length),
        colors.length - 1
      );
      const particleColor = colors[colorIndex];

      // Opacity variation
      const opacityFalloff = 1.0 - normalizedDist * 0.5;
      const finalOpacity = opacityFalloff * baseOpacity * (0.7 + Math.random() * 0.3);

      // Set per-instance color (RGBA)
      colorBuffer[i * 4] = particleColor.r;
      colorBuffer[i * 4 + 1] = particleColor.g;
      colorBuffer[i * 4 + 2] = particleColor.b;
      colorBuffer[i * 4 + 3] = finalOpacity;

      // Set transform
      matrix.makeScale(sizeVariation, sizeVariation, sizeVariation);
      matrix.setPosition(x, y, z);
      this.particlesMesh.setMatrixAt(i, matrix);

      // Store animation data
      this.particleData.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.0001,
          (Math.random() - 0.5) * 0.0001,
          (Math.random() - 0.5) * 0.0001
        ),
        noiseOffset: new THREE.Vector3(
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100
        ),
        color: particleColor,
      });
    }

    // Set instance colors
    this.particlesMesh.instanceColor = new THREE.InstancedBufferAttribute(colorBuffer, 4);
    this.particlesMesh.instanceMatrix.needsUpdate = true;

    // Apply position offset
    const [px, py, pz] = this.position();
    this.particlesMesh.position.set(px, py, pz);

    // Add to parent
    const parent = this.parent();
    if (parent) {
      parent.add(this.particlesMesh);
    }

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.dispose();
    });
  }

  private generatePositions(
    count: number,
    radiusMin: number,
    radiusMax: number
  ): Float32Array {
    const positions = new Float32Array(count * 3);
    const distribution = this.distribution();

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      // Radial distribution
      let r;
      if (distribution === 'density-gradient') {
        // Denser in center (power of 2.5)
        r = radiusMin + Math.pow(Math.random(), 2.5) * (radiusMax - radiusMin);
      } else {
        // Uniform distribution
        r = radiusMin + Math.cbrt(Math.random()) * (radiusMax - radiusMin);
      }

      const idx = i * 3;
      positions[idx] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx + 1] = r * Math.cos(phi);
      positions[idx + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    return positions;
  }

  private parseColorGradient(): THREE.Color[] {
    return this.colorGradient().map((hex) => new THREE.Color(hex));
  }

  private setupAnimation(): void {
    const noiseSpeed = this.animationSpeed();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const radiusMax = this.radiusMax();

    this.particleUpdateCleanup = this.renderLoop.registerUpdateCallback(() => {
      if (!this.particlesMesh) return;

      const time = performance.now() * 0.001;

      for (let i = 0; i < this.particleData.length; i++) {
        const data = this.particleData[i];

        this.particlesMesh.getMatrixAt(i, matrix);
        position.setFromMatrixPosition(matrix);
        const scale = new THREE.Vector3();
        matrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);

        // Noise-based motion
        const noiseX =
          Math.sin((position.y + data.noiseOffset.x) * 5 + time * noiseSpeed) * 0.0005;
        const noiseY =
          Math.sin((position.z + data.noiseOffset.y) * 5 + time * noiseSpeed) * 0.0005;
        const noiseZ =
          Math.sin((position.x + data.noiseOffset.z) * 5 + time * noiseSpeed) * 0.0005;

        data.velocity.x += noiseX;
        data.velocity.y += noiseY;
        data.velocity.z += noiseZ;

        position.x += data.velocity.x;
        position.y += data.velocity.y;
        position.z += data.velocity.z;

        // Boundary constraint
        const dist = position.length();
        if (dist > radiusMax) {
          position.normalize().multiplyScalar(radiusMax * 0.99);
          const normal = position.clone().normalize();
          data.velocity.reflect(normal);
          data.velocity.multiplyScalar(0.5);
        }

        data.velocity.multiplyScalar(0.98);

        matrix.makeScale(scale.x, scale.y, scale.z);
        matrix.setPosition(position);
        this.particlesMesh.setMatrixAt(i, matrix);
      }

      this.particlesMesh.instanceMatrix.needsUpdate = true;
    });

    this.destroyRef.onDestroy(() => {
      if (this.particleUpdateCleanup) {
        this.particleUpdateCleanup();
        this.particleUpdateCleanup = null;
      }
    });
  }

  private dispose(): void {
    if (this.particlesMesh) {
      const parent = this.parent();
      if (parent) {
        parent.remove(this.particlesMesh);
      }
    }

    if (this.particlesGeometry) {
      this.particlesGeometry.dispose();
      this.particlesGeometry = null;
    }

    if (this.particlesMaterial) {
      this.particlesMaterial.dispose();
      this.particlesMaterial = null;
    }

    this.particlesMesh = null;
    this.particleData = [];
  }
}
