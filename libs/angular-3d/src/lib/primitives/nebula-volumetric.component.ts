import {
  Component,
  ChangeDetectionStrategy,
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
export class NebulaVolumetricComponent {
  // Signal inputs
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly width = input<number>(120);
  readonly height = input<number>(60);
  readonly layers = input<number>(2); // Number of shader planes
  readonly opacity = input<number>(0.6);
  readonly primaryColor = input<string>('#0088ff'); // Bright blue
  readonly secondaryColor = input<string>('#00d4ff'); // Cyan
  readonly tertiaryColor = input<string>('#ff6bd4'); // Pink accent
  readonly enableFlow = input<boolean>(true); // Animate noise over time
  readonly flowSpeed = input<number>(0.5); // Time multiplier for animation

  // Visual quality controls (matching temp/nebula-volumetric.component.ts)
  readonly noiseScale = input<number>(0.01); // Smaller = larger features, bigger = more detail
  readonly density = input<number>(1.1); // Overall cloud density (0.5 - 2.0)
  readonly edgeSoftness = input<number>(0.3); // Edge fade softness (0.1 = hard, 0.5 = very soft)
  readonly contrast = input<number>(1.0); // Bright/dim contrast (0.5 = low, 2.0 = high)
  readonly glowIntensity = input<number>(3.0); // Glow strength in bright areas (1.0 - 5.0)
  readonly colorIntensity = input<number>(1.8); // Color brightness multiplier (0.5 - 3.0)

  // DI
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);

  // Internal state
  private readonly group = new THREE.Group();
  private readonly nebulaLayers: THREE.Mesh[] = [];
  private readonly layerUniforms: Array<{ [uniform: string]: THREE.IUniform }> =
    [];
  private renderLoopCleanup!: () => void;

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
      const tertiary = new THREE.Color(this.tertiaryColor());

      this.layerUniforms.forEach((uniforms) => {
        uniforms['uPrimaryColor'].value = primary;
        uniforms['uSecondaryColor'].value = secondary;
        uniforms['uTertiaryColor'].value = tertiary;
      });
    });

    // Animation loop - always register, conditionally execute
    // This prevents memory leak if enableFlow changes after construction
    this.renderLoopCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      if (this.enableFlow()) {
        this.layerUniforms.forEach((uniforms) => {
          uniforms['uTime'].value += delta * this.flowSpeed();
        });
      }
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      // Cleanup always called now since renderLoopCleanup is always defined
      this.renderLoopCleanup();
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

    // Create uniforms for this layer (matching temp/nebula-volumetric.component.ts)
    const layerOpacityMultiplier = layerIndex === 0 ? 0.5 : 0.4;
    const layerNoiseMultiplier = layerIndex === 0 ? 1.0 : 1.3;
    const layerFlowMultiplier = layerIndex === 0 ? 1.0 : -0.6;
    const layerDensityMultiplier = layerIndex === 0 ? 1.0 : 0.9;

    const uniforms = {
      uTime: { value: 0.0 },
      uOpacity: { value: this.opacity() * layerOpacityMultiplier },
      uNoiseScale: { value: this.noiseScale() * layerNoiseMultiplier },
      uFlowSpeed: { value: this.flowSpeed() * layerFlowMultiplier },
      uDensity: { value: this.density() * layerDensityMultiplier },
      uEdgeSoftness: { value: this.edgeSoftness() },
      uContrast: { value: this.contrast() },
      uGlowIntensity: { value: this.glowIntensity() },
      uColorIntensity: { value: this.colorIntensity() },
      uPrimaryColor: { value: new THREE.Color(this.primaryColor()) },
      uSecondaryColor: { value: new THREE.Color(this.secondaryColor()) },
      uTertiaryColor: { value: new THREE.Color(this.tertiaryColor()) },
    };

    this.layerUniforms.push(uniforms);

    // Create shader material (matching temp/nebula-volumetric.component.ts)
    const material = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true, // CRITICAL: was missing
      side: THREE.DoubleSide,
      fog: false, // CRITICAL: was missing
    });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);

    // CRITICAL: Set renderOrder for proper transparent object rendering
    // Reference uses 997 for layer 1, 998 for layer 2
    mesh.renderOrder = 997 + layerIndex;

    // Position layers with x/y/z offsets like reference implementation
    if (layerIndex === 0) {
      mesh.position.set(0, 0, 0);
    } else {
      // Layer 2+ offset: [8, -5, -8] from reference
      const offsetScale = layerIndex;
      mesh.position.set(8 * offsetScale, -5 * offsetScale, -8 * offsetScale);
      // Scale down secondary layers
      mesh.scale.set(0.85, 0.85, 1);
    }

    // Slight rotation variation for each layer
    mesh.rotation.z = (layerIndex * Math.PI) / 8;

    this.group.add(mesh);
    this.nebulaLayers.push(mesh);
  }

  /**
   * Vertex Shader - Pass through with world position for seamless noise
   * (Matching temp/nebula-volumetric.component.ts)
   */
  private readonly vertexShader = `
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  /**
   * Fragment Shader - Advanced 3D Perlin Noise with Domain Warping
   * (Full implementation from temp/nebula-volumetric.component.ts)
   *
   * Features:
   * - Multi-stage radial falloff for ultra-soft edges
   * - 5 octave FBM for detailed smoke patterns
   * - Configurable density, contrast, glow, color intensity
   * - Domain warping for organic smoke tendrils
   */
  private readonly fragmentShader = `
    uniform float uTime;
    uniform float uOpacity;
    uniform float uNoiseScale;
    uniform float uFlowSpeed;
    uniform float uDensity;
    uniform float uEdgeSoftness;
    uniform float uContrast;
    uniform float uGlowIntensity;
    uniform float uColorIntensity;
    uniform vec3 uPrimaryColor;
    uniform vec3 uSecondaryColor;
    uniform vec3 uTertiaryColor;

    varying vec2 vUv;
    varying vec3 vWorldPosition;

    // 3D Simplex noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

      vec3 i  = floor(v + dot(v, C.yyy));
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

      vec4 x = x_ *ns.x + ns.yyyy;
      vec4 y = y_ *ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);

      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);

      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));

      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);

      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;

      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    // FBM for smoke/cloud patterns - 5 octaves for detailed appearance
    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;

      for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
      }

      return value;
    }

    // Domain warping for organic smoke tendrils
    vec3 domainWarp(vec3 p) {
      float warpAmount = 0.6;
      return p + vec3(
        fbm(p + vec3(1.7, 9.2, 4.1)) * warpAmount,
        fbm(p + vec3(8.3, 2.8, 5.5)) * warpAmount,
        fbm(p + vec3(3.5, 6.1, 2.9)) * warpAmount
      );
    }

    void main() {
      // World-space position for continuous field
      vec3 pos = vWorldPosition * uNoiseScale;

      // Slow-flowing animation
      float time = uTime * uFlowSpeed * 0.05;
      vec3 flowOffset = vec3(time * 0.15, time * 0.08, time * 0.05);

      // Apply domain warping for organic smoke
      vec3 warpedPos = domainWarp(pos + flowOffset);

      // Generate multi-scale smoke density
      float smoke1 = fbm(warpedPos);
      float smoke2 = fbm(warpedPos * 1.5 + vec3(5.2, 3.7, 8.1));
      float smoke3 = fbm(warpedPos * 0.6 + vec3(2.3, 7.1, 4.6));

      // Combine smoke layers
      float smokeDensity = smoke1 * 0.45 + smoke2 * 0.35 + smoke3 * 0.2;
      smokeDensity = (smokeDensity + 1.0) * 0.5; // Normalize to [0, 1]

      // Apply density multiplier
      smokeDensity *= uDensity;

      // CRITICAL: Ultra-soft edge falloff with NO visible boundaries
      vec2 centeredUv = vUv - 0.5;
      float distFromCenter = length(centeredUv);

      // Multi-stage radial falloff for extremely soft edges
      float radialFalloff1 = 1.0 - smoothstep(0.0, 0.6, distFromCenter);
      float radialFalloff2 = 1.0 - smoothstep(0.0, 0.5, distFromCenter);
      float radialFalloff3 = 1.0 - smoothstep(0.0, 0.4, distFromCenter);

      // Combine multiple falloff stages
      float edgeFalloff = radialFalloff1 * 0.3 + radialFalloff2 * 0.4 + radialFalloff3 * 0.3;

      // Configurable edge softness (lower = softer)
      edgeFalloff = pow(edgeFalloff, uEdgeSoftness);

      // Strong noise-based irregularity for organic edges
      float edgeNoise1 = fbm(warpedPos * 1.2) * 0.5 + 0.5;
      float edgeNoise2 = fbm(warpedPos * 0.6 + vec3(5.0, 5.0, 5.0)) * 0.5 + 0.5;
      float edgeNoise = edgeNoise1 * 0.6 + edgeNoise2 * 0.4;

      edgeFalloff *= 0.2 + edgeNoise * 0.8;

      // Calculate base alpha
      float alpha = smokeDensity * edgeFalloff;

      // Create BRIGHT and DIM areas (configurable contrast)
      // Use thresholding to create intense bright spots
      float brightAreas = smoothstep(0.55, 0.75, smokeDensity);
      float dimAreas = smoothstep(0.2, 0.4, smokeDensity);

      // Contrast control: either very bright or very dim
      float intensityMask = brightAreas * (2.5 * uContrast) + dimAreas * (0.3 * uContrast);

      // Very soft alpha curves for gas-like appearance
      alpha = pow(max(alpha, 0.0), 1.8);
      alpha = smoothstep(0.0, 1.0, alpha);
      alpha = smoothstep(0.0, 1.0, alpha); // Double smoothstep for extra softness

      // Apply opacity with intensity variation
      alpha *= uOpacity * intensityMask;

      // Discard nearly transparent pixels
      if (alpha < 0.002) discard;

      // Color mixing with HIGH CONTRAST
      // Bright areas = intense primary color
      // Dim areas = very dark secondary color
      float densityContrast = smoothstep(0.3, 0.7, smokeDensity);

      // Dark base color for dim areas
      vec3 darkColor = uSecondaryColor * 0.15;

      // Bright color for intense areas (configurable)
      vec3 brightColor = uPrimaryColor * uColorIntensity;

      // Mid-tone color
      vec3 midColor = mix(uSecondaryColor, uPrimaryColor, 0.6);

      // Mix based on density with high contrast
      vec3 color1 = mix(darkColor, midColor, densityContrast);
      vec3 color2 = mix(color1, brightColor, brightAreas);

      // Add accent color in specific density ranges
      vec3 finalColor = mix(color2, uTertiaryColor * 1.5, brightAreas * 0.2);

      // Strong brightness variation for dramatic lighting
      float brightness = 0.4 + smokeDensity * 1.2 + brightAreas * 1.5;
      finalColor *= brightness;

      // Configurable glow in VERY bright areas only
      float strongGlow = pow(brightAreas, 3.0) * uGlowIntensity;
      finalColor += strongGlow * uPrimaryColor * 2.0;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `;
}
