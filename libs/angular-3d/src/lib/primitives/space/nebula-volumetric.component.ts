import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import {
  abs,
  add,
  exp,
  float,
  mix,
  mul,
  positionLocal,
  pow,
  smoothstep,
  uniform,
  uv,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { NG_3D_PARENT } from '../../types/tokens';
import { domainWarp, nativeFBMVec3 } from '../shaders/tsl-utilities';

/**
 * NebulaVolumetricComponent - Realistic TSL-Based Nebula Clouds
 *
 * Creates volumetric nebula clouds using multi-layer TSL materials with MaterialX noise
 * and domain warping. Produces organic, ethereal smoke-like effects with ultra-soft edges.
 *
 * Features:
 * - Multi-layer TSL materials (configurable layer count)
 * - MaterialX fractal noise with domain warping for organic tendrils
 * - Ultra-soft edge falloff (no visible geometry boundaries)
 * - Additive blending for volumetric appearance
 * - Configurable colors, opacity, flow speed, density
 * - Real-time animation with flowing noise patterns
 * - GPU-accelerated procedural noise (WebGPU/WebGL compatible)
 *
 * Architecture Notes:
 * - Direct Three.js group management (no angular-three templates)
 * - Uses NG_3D_PARENT for scene hierarchy
 * - Signal-based inputs for reactive updates
 * - TSL materials with MaterialX noise (no GLSL shaders)
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
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly width = input<number>(120);
  public readonly height = input<number>(60);
  public readonly layers = input<number>(2); // Number of TSL material planes
  public readonly opacity = input<number>(0.6);
  public readonly primaryColor = input<number>(0x0088ff); // Bright blue
  public readonly secondaryColor = input<number>(0x00d4ff); // Cyan
  public readonly tertiaryColor = input<number>(0xff6bd4); // Pink accent
  public readonly enableFlow = input<boolean>(false); // Animate noise over time
  public readonly flowSpeed = input<number>(0.5); // Time multiplier for animation

  // Visual quality controls
  public readonly noiseScale = input<number>(0.01); // Smaller = larger features, bigger = more detail
  public readonly density = input<number>(1.1); // Overall cloud density (0.5 - 2.0)
  public readonly edgeSoftness = input<number>(0.3); // Edge fade softness (0.1 = hard, 0.5 = very soft)
  public readonly contrast = input<number>(1.0); // Bright/dim contrast (0.5 = low, 2.0 = high)
  public readonly glowIntensity = input<number>(3.0); // Glow strength in bright areas (1.0 - 5.0)
  public readonly colorIntensity = input<number>(1.8); // Color brightness multiplier (0.5 - 3.0)
  public readonly centerFalloff = input<number>(1.5); // Exponential center falloff rate (0.5 = gradual, 3.0 = sharp core)
  public readonly erosionStrength = input<number>(0.7); // Edge erosion strength (0.0 = none, 1.0 = maximum wispy)

  // Edge animation controls
  public readonly enableEdgePulse = input<boolean>(false); // Animate edge brightness/darkness
  public readonly edgePulseSpeed = input<number>(0.5); // Speed of edge pulsing (0.1 = slow, 2.0 = fast)
  public readonly edgePulseAmount = input<number>(0.3); // Intensity of edge pulse (0.0 = none, 1.0 = dramatic)

  // DI
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);

  // Internal state
  private readonly group = new THREE.Group();
  private readonly nebulaLayers: THREE.Mesh[] = [];
  private readonly layerTimeUniforms: ReturnType<typeof uniform>[] = [];
  private readonly layerEdgePulseUniforms: ReturnType<typeof uniform>[] = [];
  private renderLoopCleanup!: () => void;

  private isAddedToScene = false;
  private isDestroyed = false;

  public constructor() {
    // Effect: Add group to parent when parent becomes available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.isAddedToScene) {
        parent.add(this.group);
        this.isAddedToScene = true;
      }
    });

    // Effect: Update position when it changes
    effect(() => {
      const pos = this.position();
      this.group.position.set(...pos);
    });

    // Effect: Create nebula layers when configuration changes
    effect(() => {
      const layerCount = this.layers();
      const width = this.width();
      const height = this.height();

      // Don't create layers if component is being destroyed
      if (this.isDestroyed) return;

      // Clear existing layers
      this.clearLayers();

      // Create new layers
      for (let i = 0; i < layerCount; i++) {
        this.createNebulaLayer(i, width, height, layerCount);
      }
    });

    // Animation loop - always register, conditionally execute
    let edgePulseElapsed = 0;
    this.renderLoopCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      // Flow animation (swirling movement)
      if (this.enableFlow() && this.layerTimeUniforms.length > 0) {
        const speed = this.flowSpeed();
        this.layerTimeUniforms.forEach((uTime, i) => {
          // Layer-specific flow multiplier
          const flowMult = i === 0 ? 1.0 : -0.6;
          (uTime.value as number) += delta * speed * flowMult;
        });
      }

      // Edge pulse animation (breathing light/dark edges)
      if (this.enableEdgePulse() && this.layerEdgePulseUniforms.length > 0) {
        edgePulseElapsed += delta * this.edgePulseSpeed();
        const pulseAmount = this.edgePulseAmount();

        this.layerEdgePulseUniforms.forEach((uPulse, i) => {
          // Layer-specific phase offset for organic feel
          const phaseOffset = i * 0.7;
          // Sine wave oscillation between (1 - amount) and (1 + amount)
          const pulse =
            1.0 + Math.sin(edgePulseElapsed + phaseOffset) * pulseAmount;
          (uPulse.value as number) = pulse;
        });
      }
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      // Prevent double cleanup
      if (this.isDestroyed) return;
      this.isDestroyed = true;

      // Cleanup render loop callback
      if (this.renderLoopCleanup) {
        this.renderLoopCleanup();
      }
      // Remove from parent
      const parent = this.parent();
      if (parent && this.isAddedToScene) {
        parent.remove(this.group);
      }
      this.isAddedToScene = false;
      // Dispose Three.js resources
      this.clearLayers();
    });
  }

  /**
   * Clear existing nebula layers
   */
  private clearLayers(): void {
    this.nebulaLayers.forEach((mesh) => {
      if (!mesh) return;

      this.group.remove(mesh);

      // Safely dispose geometry
      if (mesh.geometry) {
        try {
          mesh.geometry.dispose();
        } catch {
          // Geometry may already be disposed
        }
      }

      // Safely dispose material - wrap in try-catch as WebGPU materials
      // can fail during disposal if internal state is already cleaned up
      if (mesh.material && mesh.material instanceof MeshBasicNodeMaterial) {
        try {
          mesh.material.dispose();
        } catch {
          // Material may already be disposed or in invalid state
        }
      }
    });
    this.nebulaLayers.length = 0;
    this.layerTimeUniforms.length = 0;
    this.layerEdgePulseUniforms.length = 0;
  }

  /**
   * Create a single nebula layer with TSL material
   * Uses MaterialX noise instead of GLSL shaders
   */
  private createNebulaLayer(
    layerIndex: number,
    width: number,
    height: number,
    _totalLayers: number
  ): void {
    // Create 1x1 plane geometry with high resolution for smooth noise
    const geometry = new THREE.PlaneGeometry(1, 1, 256, 256);

    // Layer-specific multipliers
    const layerOpacityMultiplier = layerIndex === 0 ? 0.5 : 0.4;
    const layerNoiseMultiplier = layerIndex === 0 ? 1.0 : 1.3;
    const layerDensityMultiplier = layerIndex === 0 ? 1.0 : 0.9;

    // Create TSL uniform nodes (these will be updated in render loop)
    const uTime = uniform(float(0));
    const uNoiseScale = uniform(
      float(this.noiseScale() * layerNoiseMultiplier)
    );
    const uDensity = uniform(float(this.density() * layerDensityMultiplier));
    const uOpacity = uniform(float(this.opacity() * layerOpacityMultiplier));
    const uEdgeSoftness = uniform(float(this.edgeSoftness()));
    const uContrast = uniform(float(this.contrast()));
    const uGlowIntensity = uniform(float(this.glowIntensity()));
    const uColorIntensity = uniform(float(this.colorIntensity()));
    const uCenterFalloff = uniform(float(this.centerFalloff()));
    const uErosionStrength = uniform(float(this.erosionStrength()));
    const uEdgePulse = uniform(float(1.0)); // Animated: modulates edge brightness
    const uPrimaryColor = uniform(
      vec3(...new THREE.Color(this.primaryColor()).toArray())
    );
    const uSecondaryColor = uniform(
      vec3(...new THREE.Color(this.secondaryColor()).toArray())
    );
    const uTertiaryColor = uniform(
      vec3(...new THREE.Color(this.tertiaryColor()).toArray())
    );

    // Store uniforms for animation
    this.layerTimeUniforms.push(uTime);
    this.layerEdgePulseUniforms.push(uEdgePulse);

    // Create TSL material node tree
    const material = new MeshBasicNodeMaterial();

    // Position with noise scaling
    const basePos = mul(positionLocal, uNoiseScale);

    // Slow-flowing animation
    const time = mul(uTime, float(0.05));
    const flowOffset = vec3(
      mul(time, float(0.15)),
      mul(time, float(0.08)),
      mul(time, float(0.05))
    );
    const animatedPos = add(basePos, flowOffset);

    // Apply domain warping for organic smoke tendrils
    const warpedPos = domainWarp(animatedPos, float(0.6));

    // Generate multi-scale smoke density using MaterialX FBM
    const smoke1 = nativeFBMVec3(warpedPos, float(5), float(2.0), float(0.5));
    const smoke2 = nativeFBMVec3(
      add(mul(warpedPos, float(1.5)), vec3(5.2, 3.7, 8.1)),
      float(4),
      float(2.0),
      float(0.5)
    );
    const smoke3 = nativeFBMVec3(
      add(mul(warpedPos, float(0.6)), vec3(2.3, 7.1, 4.6)),
      float(3),
      float(2.0),
      float(0.5)
    );

    // Combine smoke layers (extract x component for density value)
    const smokeDensity = add(
      add(mul(smoke1.x, float(0.45)), mul(smoke2.x, float(0.35))),
      mul(smoke3.x, float(0.2))
    );

    // Normalize to [0, 1]
    const normalizedDensity = mul(add(smokeDensity, float(1.0)), float(0.5));

    // Apply density multiplier
    const baseDensity = mul(normalizedDensity, uDensity);

    // CRITICAL: Ultra-soft edge falloff with NO visible boundaries
    const centeredUv = add(uv(), vec3(-0.5, -0.5, 0));
    const distFromCenter = centeredUv.length();

    // ========================================================================
    // FIX #4: Center-weighted density with EXPONENTIAL decay (from report)
    // Makes core bright and edges naturally thin - "nebula physics cheat"
    // density *= exp(-r * centerFalloff)
    // ========================================================================
    const centerWeight = exp(mul(distFromCenter.negate(), uCenterFalloff));
    const densityWithMult = mul(baseDensity, centerWeight);

    // ========================================================================
    // FIX #1: Improved radial falloff with wider smoothstep ranges
    // Prevents visible geometry boundaries
    // ========================================================================
    // Multi-stage radial falloff for extremely soft edges
    // Wider ranges: start fading earlier, complete fade later
    const radialFalloff1 = float(1).sub(
      smoothstep(float(0.15), float(0.55), distFromCenter)
    );
    const radialFalloff2 = float(1).sub(
      smoothstep(float(0.1), float(0.48), distFromCenter)
    );
    const radialFalloff3 = float(1).sub(
      smoothstep(float(0.05), float(0.42), distFromCenter)
    );

    // Combine multiple falloff stages with weighted blend
    const edgeFalloff = add(
      add(mul(radialFalloff1, float(0.35)), mul(radialFalloff2, float(0.4))),
      mul(radialFalloff3, float(0.25))
    );

    // Configurable edge softness
    const softEdgeFalloff = pow(edgeFalloff, uEdgeSoftness);

    // ========================================================================
    // FIX #2: Turbulence-based edge erosion using abs() of noise
    // Creates wispy, chaotic edges that break the silhouette
    // erosion = smoothstep(0.2, 0.8, abs(noise))
    // ========================================================================
    // Primary erosion noise (low frequency for large wispy features)
    const erosionNoise1 = nativeFBMVec3(
      mul(warpedPos, float(0.8)),
      float(3),
      float(2.0),
      float(0.5)
    );
    // Secondary erosion noise (higher frequency for detail)
    const erosionNoise2 = nativeFBMVec3(
      add(mul(warpedPos, float(1.5)), vec3(7.3, 3.1, 5.7)),
      float(4),
      float(2.0),
      float(0.5)
    );

    // TURBULENCE: Use abs() to create sharp ridges and valleys
    const turbulence1 = abs(erosionNoise1.x);
    const turbulence2 = abs(erosionNoise2.x);

    // Combine turbulence layers
    const combinedTurbulence = add(
      mul(turbulence1, float(0.6)),
      mul(turbulence2, float(0.4))
    );

    // Erosion mask: erode where turbulence is low
    const erosionMask = smoothstep(float(0.15), float(0.7), combinedTurbulence);

    // Blend erosion based on strength parameter
    const erosionFactor = mix(float(1.0), erosionMask, uErosionStrength);

    // ========================================================================
    // Combined edge falloff with erosion
    // Multiply soft falloff with erosion for wispy irregular boundaries
    // ========================================================================
    // Add noise-based variation to prevent circular edges
    const edgeNoise1 = nativeFBMVec3(
      mul(warpedPos, float(1.2)),
      float(3),
      float(2.0),
      float(0.5)
    );
    const edgeNoise2 = nativeFBMVec3(
      add(mul(warpedPos, float(0.6)), vec3(5.0, 5.0, 5.0)),
      float(3),
      float(2.0),
      float(0.5)
    );
    const edgeNoise = add(
      mul(add(mul(edgeNoise1.x, float(0.5)), float(0.5)), float(0.6)),
      mul(add(mul(edgeNoise2.x, float(0.5)), float(0.5)), float(0.4))
    );

    // Final edge falloff combines: soft radial + noise variation + turbulence erosion
    const baseEdgeFalloff = mul(
      mul(softEdgeFalloff, add(float(0.25), mul(edgeNoise, float(0.75)))),
      erosionFactor
    );

    // Apply edge pulse animation (modulates brightness at edges)
    // Pulse affects the edge regions more than the core
    const edgePulseEffect = mix(float(1.0), uEdgePulse, baseEdgeFalloff);
    const finalEdgeFalloff = mul(baseEdgeFalloff, edgePulseEffect);

    // Calculate base alpha - SIMPLIFIED for better visibility
    const alpha = mul(densityWithMult, finalEdgeFalloff);

    // Create BRIGHT and DIM areas (configurable contrast)
    const brightAreas = smoothstep(float(0.45), float(0.65), densityWithMult);
    const dimAreas = smoothstep(float(0.15), float(0.35), densityWithMult);

    // Contrast control with minimum floor to ensure visibility
    const intensityMask = float(0.3).max(
      add(
        mul(brightAreas, mul(float(2.5), uContrast)),
        mul(dimAreas, mul(float(0.5), uContrast))
      )
    );

    // Softer alpha curves
    const alphaRaised = pow(alpha.max(float(0.0)), float(1.2));
    const alphaSmoothStep = smoothstep(float(0.0), float(1.0), alphaRaised);

    // Apply opacity with intensity variation
    const finalAlpha = mul(mul(alphaSmoothStep, uOpacity), intensityMask);

    // Color mixing with HIGH CONTRAST
    const densityContrast = smoothstep(
      float(0.25),
      float(0.65),
      densityWithMult
    );

    // Dark base color for dim areas
    const darkColor = mul(uSecondaryColor, float(0.2));

    // Bright color for intense areas (configurable)
    const brightColor = mul(uPrimaryColor, uColorIntensity);

    // Mid-tone color
    const midColor = mix(uSecondaryColor, uPrimaryColor, float(0.6));

    // Mix based on density with high contrast
    const color1 = mix(darkColor, midColor, densityContrast);
    const color2 = mix(color1, brightColor, brightAreas);

    // Add accent color in specific density ranges
    const finalColorBase = mix(
      color2,
      mul(uTertiaryColor, float(1.5)),
      mul(brightAreas, float(0.2))
    );

    // Strong brightness variation for dramatic lighting
    const brightness = add(
      add(float(0.5), mul(densityWithMult, float(1.0))),
      mul(brightAreas, float(1.2))
    );
    const finalColorWithBrightness = mul(finalColorBase, brightness);

    // Configurable glow in VERY bright areas only
    const strongGlow = mul(pow(brightAreas, float(2.0)), uGlowIntensity);
    const finalColor = add(
      finalColorWithBrightness,
      mul(mul(strongGlow, uPrimaryColor), float(1.5))
    );

    // Assign color and opacity nodes to material
    material.colorNode = finalColor;
    material.opacityNode = finalAlpha;

    // Material properties
    material.transparent = true;
    material.blending = THREE.AdditiveBlending;
    material.depthWrite = false;
    material.depthTest = true;
    material.side = THREE.DoubleSide;
    material.fog = false;

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);

    // CRITICAL: Set renderOrder for proper transparent object rendering
    mesh.renderOrder = 997 + layerIndex;

    // Position and scale layers
    if (layerIndex === 0) {
      // Layer 1: Full size at origin
      mesh.position.set(0, 0, 0);
      mesh.scale.set(width, height, 1);
    } else {
      // Layer 2+: Offset and slightly smaller
      mesh.position.set(8, -5, -8);
      mesh.scale.set(width * 0.85, height * 0.85, 1);
    }

    this.group.add(mesh);
    this.nebulaLayers.push(mesh);
  }
}
