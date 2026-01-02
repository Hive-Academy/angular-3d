/**
 * SparkleCoronaComponent - Shell-Distributed Twinkling Particles
 *
 * A particle system component that creates a corona/halo effect around objects.
 * Unlike the standard ParticleSystemComponent which fills a volume, this component
 * distributes particles on a shell (surface) between two radii, creating the
 * distinctive sparkle corona effect seen on glass spheres.
 *
 * Features:
 * - **Shell distribution**: Particles on sphere surface, not inside volume
 * - **Multi-color sparkles**: Configurable mix of white, peach, and gold colors
 * - **Twinkling animation**: Per-particle sine wave opacity oscillation
 * - **Efficient updates**: Uses BufferAttribute.needsUpdate for performance
 *
 * @example
 * ```html
 * <!-- Basic corona around a sphere -->
 * <a3d-sparkle-corona
 *   [count]="3000"
 *   [innerRadius]="2.5"
 *   [outerRadius]="3.0"
 *   [position]="[0, 0, 0]"
 * />
 *
 * <!-- Custom colors and twinkling speed -->
 * <a3d-sparkle-corona
 *   [count]="5000"
 *   [innerRadius]="2.0"
 *   [outerRadius]="2.5"
 *   [twinkleSpeed]="3.0"
 *   [colorWeights]="{ white: 0.6, peach: 0.25, gold: 0.15 }"
 * />
 * ```
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  afterNextRender,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { NG_3D_PARENT } from '../types/tokens';
import { RenderLoopService } from '../render-loop/render-loop.service';

/**
 * Color weight distribution for sparkles
 */
export interface SparkleColorWeights {
  white: number;
  peach: number;
  gold: number;
}

/**
 * Default color weights: 50% white, 30% peach, 20% gold
 */
const DEFAULT_COLOR_WEIGHTS: SparkleColorWeights = {
  white: 0.5,
  peach: 0.3,
  gold: 0.2,
};

/**
 * Color RGB values for sparkle types
 */
const SPARKLE_COLORS = {
  white: { r: 1.0, g: 1.0, b: 1.0 },
  peach: { r: 1.0, g: 0.858, b: 0.678 }, // #FFDBAD
  gold: { r: 1.0, g: 0.8, b: 0.4 }, // #FFCC66
} as const;

/**
 * Generate positions uniformly distributed on a spherical shell (surface)
 *
 * Unlike sphere volume distribution which uses cbrt(random) for radius,
 * this uses linear interpolation between inner and outer radius to
 * create a thin shell of particles around the sphere edge.
 *
 * @param count - Number of particles to generate
 * @param innerRadius - Inner boundary of the shell
 * @param outerRadius - Outer boundary of the shell
 * @returns Float32Array of positions (x, y, z for each particle)
 */
function generateShellPositions(
  count: number,
  innerRadius: number,
  outerRadius: number
): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Uniform distribution on sphere surface using spherical coordinates
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    // Linear interpolation between inner and outer radius (shell, not volume)
    const r = innerRadius + Math.random() * (outerRadius - innerRadius);

    const idx = i * 3;
    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);
  }

  return positions;
}

/**
 * Generate multi-color vertex colors based on weight distribution
 *
 * @param count - Number of particles
 * @param weights - Color distribution weights
 * @returns Float32Array of colors (r, g, b for each particle)
 */
function generateSparkleColors(
  count: number,
  weights: SparkleColorWeights
): Float32Array {
  const colors = new Float32Array(count * 3);

  // Normalize weights to ensure they sum to 1
  const totalWeight = weights.white + weights.peach + weights.gold;
  const normalizedWhite = weights.white / totalWeight;
  const normalizedPeach = weights.peach / totalWeight;

  for (let i = 0; i < count; i++) {
    const colorChoice = Math.random();
    let color: { r: number; g: number; b: number };

    if (colorChoice < normalizedWhite) {
      // White sparkles
      color = SPARKLE_COLORS.white;
    } else if (colorChoice < normalizedWhite + normalizedPeach) {
      // Peach sparkles
      color = SPARKLE_COLORS.peach;
    } else {
      // Gold sparkles
      color = SPARKLE_COLORS.gold;
    }

    const idx = i * 3;
    colors[idx] = color.r;
    colors[idx + 1] = color.g;
    colors[idx + 2] = color.b;
  }

  return colors;
}

/**
 * Generate random twinkle phases for each particle
 *
 * Each particle gets a random phase offset so they don't all
 * twinkle in sync, creating a more natural sparkle effect.
 *
 * @param count - Number of particles
 * @returns Float32Array of phase values (0 to 2*PI)
 */
function generateTwinklePhases(count: number): Float32Array {
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    phases[i] = Math.random() * 2 * Math.PI;
  }

  return phases;
}

/**
 * Generate random twinkle speeds for each particle
 *
 * Particles twinkle at slightly different speeds for variety.
 *
 * @param count - Number of particles
 * @param baseSpeed - Base twinkle speed multiplier
 * @returns Float32Array of speed multipliers
 */
function generateTwinkleSpeeds(count: number, baseSpeed: number): Float32Array {
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Speed varies from baseSpeed * 0.5 to baseSpeed * 1.5
    speeds[i] = baseSpeed * (0.5 + Math.random());
  }

  return speeds;
}

@Component({
  selector: 'a3d-sparkle-corona',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class SparkleCoronaComponent {
  // Particle configuration inputs
  /** Number of sparkle particles */
  public readonly count = input<number>(3000);

  /** Inner shell radius (particles start from here) */
  public readonly innerRadius = input<number>(2.5);

  /** Outer shell radius (particles extend to here) */
  public readonly outerRadius = input<number>(3.0);

  /** Base size of each particle */
  public readonly baseSize = input<number>(0.02);

  /** Position of the corona center */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Base twinkle animation speed */
  public readonly twinkleSpeed = input<number>(2.0);

  /** Color distribution weights */
  public readonly colorWeights = input<SparkleColorWeights>(
    DEFAULT_COLOR_WEIGHTS
  );

  // Dependency injection
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // Three.js objects
  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsNodeMaterial | null = null;

  // Twinkling animation state
  private twinklePhases: Float32Array | null = null;
  private twinkleSpeeds: Float32Array | null = null;
  private opacityAttribute: THREE.BufferAttribute | null = null;

  // Animation cleanup function
  private cleanupAnimation: (() => void) | null = null;

  // Signal to track initialization
  private readonly isInitialized = signal(false);

  // Computed positions based on radii
  private readonly positions = computed(() => {
    const count = this.count();
    const inner = this.innerRadius();
    const outer = this.outerRadius();

    return generateShellPositions(count, inner, outer);
  });

  // Computed colors based on weights
  private readonly colors = computed(() => {
    const count = this.count();
    const weights = this.colorWeights();

    return generateSparkleColors(count, weights);
  });

  public constructor() {
    // Schedule initialization after render
    afterNextRender(() => {
      this.initialize();
      this.isInitialized.set(true);
    });

    // Effect for rebuilding particles when core inputs change
    effect(() => {
      const positions = this.positions();
      const colors = this.colors();
      const size = this.baseSize();
      const speed = this.twinkleSpeed();
      const initialized = this.isInitialized();

      if (initialized) {
        this.rebuildParticles(positions, colors, size, speed);
      }
    });

    // Effect for updating position
    effect(() => {
      const pos = this.position();
      const initialized = this.isInitialized();

      if (initialized && this.points) {
        this.points.position.set(...pos);
      }
    });
  }

  /**
   * Initialize the particle system
   */
  private initialize(): void {
    const positions = this.positions();
    const colors = this.colors();
    const size = this.baseSize();
    const speed = this.twinkleSpeed();

    this.rebuildParticles(positions, colors, size, speed);
  }

  /**
   * Rebuild the particle system with new parameters
   */
  private rebuildParticles(
    positions: Float32Array,
    colors: Float32Array,
    size: number,
    twinkleSpeed: number
  ): void {
    const count = positions.length / 3;

    // Cleanup previous animation callback
    if (this.cleanupAnimation) {
      this.cleanupAnimation();
      this.cleanupAnimation = null;
    }

    // Dispose old geometry
    if (this.geometry) {
      this.geometry.dispose();
    }

    // Dispose old material
    if (this.material) {
      this.material.dispose();
    }

    // Create new geometry with position, color, and opacity attributes
    this.geometry = new THREE.BufferGeometry();

    // Position attribute
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    // Color attribute for vertex colors
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Opacity attribute for twinkling (starts at full opacity)
    const opacities = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      opacities[i] = 1.0;
    }
    this.opacityAttribute = new THREE.BufferAttribute(opacities, 1);
    this.geometry.setAttribute('opacity', this.opacityAttribute);

    // Generate twinkling animation data
    this.twinklePhases = generateTwinklePhases(count);
    this.twinkleSpeeds = generateTwinkleSpeeds(count, twinkleSpeed);

    // Create material with vertex colors enabled
    this.material = new THREE.PointsNodeMaterial();
    this.material.size = size;
    this.material.sizeAttenuation = true;
    this.material.transparent = true;
    this.material.depthWrite = false;
    this.material.vertexColors = true;

    // Create or update points object
    if (!this.points) {
      this.points = new THREE.Points(this.geometry, this.material);
      this.points.position.set(...this.position());

      // Add to parent
      if (this.parentFn) {
        const parent = this.parentFn();
        if (parent) {
          parent.add(this.points);
        } else {
          console.warn('SparkleCoronaComponent: Parent not ready');
        }
      } else {
        console.warn('SparkleCoronaComponent: No parent found');
      }
    } else {
      this.points.geometry = this.geometry;
      this.points.material = this.material;
    }

    // Register twinkling animation callback
    this.cleanupAnimation = this.renderLoop.registerUpdateCallback(
      this.animate
    );

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Animation callback for twinkling effect
   *
   * Updates per-particle opacity based on sine wave with random phase.
   * Uses BufferAttribute.needsUpdate for efficient GPU updates.
   */
  private animate = (_delta: number, elapsed: number): void => {
    if (
      !this.opacityAttribute ||
      !this.twinklePhases ||
      !this.twinkleSpeeds ||
      !this.geometry
    ) {
      return;
    }

    const count = this.twinklePhases.length;

    for (let i = 0; i < count; i++) {
      const phase = this.twinklePhases[i];
      const speed = this.twinkleSpeeds[i];

      // Sine wave oscillation between 0.3 and 1.0 opacity
      // Using abs(sin) to avoid negative values
      const opacity = 0.3 + 0.7 * Math.abs(Math.sin(elapsed * speed + phase));

      this.opacityAttribute.setX(i, opacity);
    }

    // Mark attribute as needing update (efficient GPU update)
    this.opacityAttribute.needsUpdate = true;
  };

  /**
   * Cleanup Three.js resources
   */
  private cleanup(): void {
    // Remove animation callback
    if (this.cleanupAnimation) {
      this.cleanupAnimation();
      this.cleanupAnimation = null;
    }

    // Remove from parent
    if (this.parentFn && this.points) {
      const parent = this.parentFn();
      parent?.remove(this.points);
    }

    // Dispose geometry and material
    this.geometry?.dispose();
    this.material?.dispose();

    // Clear references
    this.points = null;
    this.geometry = null;
    this.material = null;
    this.opacityAttribute = null;
    this.twinklePhases = null;
    this.twinkleSpeeds = null;
  }
}
