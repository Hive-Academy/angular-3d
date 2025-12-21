import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
  DestroyRef,
} from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../types/tokens';
import { OBJECT_ID } from '../tokens/object-id.token';
import { RenderLoopService } from '../render-loop/render-loop.service';

/**
 * NebulaVolumetricComponent - Realistic Shader-Based Nebula Clouds
 *
 * Creates volumetric nebula clouds using multi-layer shader planes with 3D Perlin noise
 * and domain warping. Produces organic, ethereal smoke-like effects with ultra-soft edges.
 *
 * Features:
 * - Multi-layer shader planes (configurable layer count)
 * - 3D Perlin noise with domain warping for organic tendrils
 * - Ultra-soft edge falloff (no visible geometry boundaries)
 * - Additive blending for volumetric appearance
 * - Configurable colors, opacity, flow speed, density
 * - Real-time animation with flowing noise patterns
 *
 * Architecture Notes:
 * - Direct Three.js group management (no angular-three templates)
 * - Uses NG_3D_PARENT for scene hierarchy
 * - Signal-based inputs for reactive updates
 * - Custom GLSL shaders for realistic nebula rendering
 * - Uses RenderLoopService for animation updates
 *
 * @example
 * ```html
 * <a3d-nebula-volumetric
 *   [position]="[0, 0, -20]"
 *   [width]="120"
 *   [height]="60"
 *   [layers]="2"
 *   [primaryColor]="'#0088ff'"
 *   [secondaryColor]="'#ff00ff'"
 *   [opacity]="0.6"
 *   [enableFlow]="true"
 * />
 * ```
 */

@Component({
  selector: 'a3d-nebula-volumetric',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `nebula-volumetric-${crypto.randomUUID()}`,
    },
  ],
})
export class NebulaVolumetricComponent implements OnDestroy {
  // Signal inputs
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly width = input<number>(120);
  readonly height = input<number>(60);
  readonly layers = input<number>(2); // Number of shader planes
  readonly opacity = input<number>(0.6);
  readonly primaryColor = input<string>('#0088ff'); // Bright blue
  readonly secondaryColor = input<string>('#ff00ff'); // Magenta
  readonly enableFlow = input<boolean>(true); // Animate noise over time
  readonly flowSpeed = input<number>(0.05); // Time multiplier for animation
  readonly noiseScale = input<number>(1.5); // Noise frequency
  readonly noiseDensity = input<number>(0.4); // Threshold for visible nebula

  // DI
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);

  // Internal state
  private readonly group = new THREE.Group();
  private readonly nebulaLayers: THREE.Mesh[] = [];
  private readonly layerUniforms: Array<{ [uniform: string]: THREE.IUniform }> =
    [];
  private renderLoopCleanup?: () => void;

  constructor() {
    // Effect: Add group to parent
    effect(() => {
      const parent = this.parent();
      if (parent) {
        parent.add(this.group);
        this.group.position.set(...this.position());
      }
    });

    // Effect: Create nebula layers when configuration changes
    effect(() => {
      const layerCount = this.layers();
      const width = this.width();
      const height = this.height();

      // Clear existing layers
      this.clearLayers();

      // Create new layers
      for (let i = 0; i < layerCount; i++) {
        this.createNebulaLayer(i, width, height, layerCount);
      }
    });

    // Effect: Update colors reactively
    effect(() => {
      const primary = new THREE.Color(this.primaryColor());
      const secondary = new THREE.Color(this.secondaryColor());

      this.layerUniforms.forEach((uniforms) => {
        uniforms['uPrimaryColor'].value = primary;
        uniforms['uSecondaryColor'].value = secondary;
      });
    });

    // Animation loop
    if (this.enableFlow()) {
      this.renderLoopCleanup = this.renderLoop.registerUpdateCallback(
        (delta) => {
          this.layerUniforms.forEach((uniforms) => {
            uniforms['uTime'].value += delta * this.flowSpeed();
          });
        }
      );
    }

    // Cleanup
    this.destroyRef.onDestroy(() => {
      if (this.renderLoopCleanup) {
        this.renderLoopCleanup();
      }
      const parent = this.parent();
      if (parent) {
        parent.remove(this.group);
      }
      this.clearLayers();
    });
  }

  /**
   * Clear existing nebula layers
   */
  private clearLayers(): void {
    this.nebulaLayers.forEach((mesh) => {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.ShaderMaterial).dispose();
    });
    this.nebulaLayers.length = 0;
    this.layerUniforms.length = 0;
  }

  /**
   * Create a single nebula layer with shader material
   */
  private createNebulaLayer(
    layerIndex: number,
    width: number,
    height: number,
    totalLayers: number
  ): void {
    // Create high-resolution plane geometry for smooth noise
    const geometry = new THREE.PlaneGeometry(width, height, 256, 256);

    // Create uniforms for this layer
    const uniforms = {
      uTime: { value: 0.0 },
      uPrimaryColor: { value: new THREE.Color(this.primaryColor()) },
      uSecondaryColor: { value: new THREE.Color(this.secondaryColor()) },
      uOpacity: { value: this.opacity() },
      uNoiseScale: { value: this.noiseScale() },
      uNoiseDensity: { value: this.noiseDensity() },
      uLayerOffset: { value: layerIndex * 0.3 }, // Offset for layer variation
    };

    this.layerUniforms.push(uniforms);

    // Create shader material
    const material = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);

    // Position layer with slight depth offset
    const depthSpacing = 2.0;
    mesh.position.z = (layerIndex - (totalLayers - 1) / 2) * depthSpacing;

    // Slight rotation variation for each layer
    mesh.rotation.z = (layerIndex * Math.PI) / 6;

    this.group.add(mesh);
    this.nebulaLayers.push(mesh);
  }

  /**
   * Vertex Shader - Pass through with vertex displacement for organic shape
   */
  private readonly vertexShader = `
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  /**
   * Fragment Shader - 3D Perlin Noise with Domain Warping
   */
  private readonly fragmentShader = `
    uniform float uTime;
    uniform vec3 uPrimaryColor;
    uniform vec3 uSecondaryColor;
    uniform float uOpacity;
    uniform float uNoiseScale;
    uniform float uNoiseDensity;
    uniform float uLayerOffset;

    varying vec2 vUv;
    varying vec3 vPosition;

    // 3D Perlin Noise (Simplified - FBM with multiple octaves)
    // Based on classic Perlin noise implementation

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);

      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);

      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;

      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;

      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);

      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }

    // Fractal Brownian Motion (FBM) - Multiple octaves of noise
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;

      for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }

      return value;
    }

    // Domain Warping - Distort space before sampling noise
    float domainWarpedNoise(vec3 p) {
      // First warp
      vec3 q = vec3(
        fbm(p + vec3(0.0, 0.0, 0.0)),
        fbm(p + vec3(5.2, 1.3, 0.0)),
        fbm(p + vec3(0.0, 0.0, 2.8))
      );

      // Second warp
      vec3 r = vec3(
        fbm(p + 4.0 * q + vec3(1.7, 9.2, 0.0)),
        fbm(p + 4.0 * q + vec3(8.3, 2.8, 0.0)),
        fbm(p + 4.0 * q + vec3(0.0, 0.0, 5.5))
      );

      return fbm(p + 4.0 * r);
    }

    void main() {
      // Create 3D coordinate for noise sampling
      vec3 noisePos = vec3(
        vPosition.xy * uNoiseScale,
        uTime * 0.1 + uLayerOffset
      );

      // Sample domain-warped noise
      float noise = domainWarpedNoise(noisePos);

      // Remap noise to 0-1 range
      noise = noise * 0.5 + 0.5;

      // Apply density threshold for nebula shape
      float density = smoothstep(uNoiseDensity - 0.1, uNoiseDensity + 0.1, noise);

      // Ultra-soft edge falloff based on distance from center
      vec2 centeredUv = vUv * 2.0 - 1.0;
      float distFromCenter = length(centeredUv);
      float edgeFalloff = smoothstep(1.0, 0.3, distFromCenter);

      // Combine density with edge falloff
      float alpha = density * edgeFalloff * uOpacity;

      // Color mixing based on noise
      vec3 color = mix(uPrimaryColor, uSecondaryColor, noise);

      // Output with additive blending
      gl_FragColor = vec4(color, alpha);
    }
  `;

  ngOnDestroy(): void {
    // Cleanup handled by DestroyRef
  }
}
