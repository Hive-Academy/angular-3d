import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop';
import {
  createMarbleMaterial,
  MarbleMaterialConfig,
} from '../shaders/tsl-marble';
import { tslCausticsTexture, tslPhotosphere } from '../shaders/tsl-textures';
import * as TSL from 'three/tsl';

/**
 * CoralSphereComponent - Warm Peachy Sphere with Outward Particle Corona
 *
 * Creates a semi-transparent sphere with:
 * - Marble-based material with animated caustic interior (warm peachy)
 * - Coral/peach edge glow
 * - Particle emission system that flows OUTWARD from surface
 * - Particles fade and despawn as they travel away
 *
 * @example
 * <a3d-coral-sphere
 *   [radius]="4.5"
 *   [particleCount]="800"
 *   [flowSpeed]="0.3"
 * />
 */
@Component({
  selector: 'a3d-coral-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class CoralSphereComponent {
  // ========================================================================
  // Sphere Configuration Inputs
  // ========================================================================

  /** Sphere radius (default: 4.5) */
  readonly radius = input<number>(4.5);

  /** Sphere position [x, y, z] */
  readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Sphere scale multiplier */
  readonly scale = input<number>(1.0);

  /** Interior texture type (default: 'caustics') */
  readonly interiorTexture = input<'caustics' | 'photosphere'>('caustics');

  /** Sphere opacity (default: 0.15) */
  readonly opacity = input<number>(0.15);

  // ========================================================================
  // Particle Emission Configuration Inputs
  // ========================================================================

  /** Number of particles in system (default: 800) */
  readonly particleCount = input<number>(800);

  /** Particle size (default: 0.08) */
  readonly particleSize = input<number>(0.08);

  /** Outward flow speed (units/second, default: 0.3) */
  readonly flowSpeed = input<number>(0.3);

  /** Max distance from sphere before despawn (default: 5.5) */
  readonly maxDistance = input<number>(5.5);

  /** Particle colors (default: 5-color peachy palette) */
  readonly particleColors = input<string[]>([
    '#ffffff', // White
    '#fff5e6', // Cream
    '#ffccaa', // Light coral
    '#ff8866', // Coral
    '#ff6644', // Deep orange
  ]);

  /** Base particle opacity (default: 0.6) */
  readonly particleOpacity = input<number>(0.6);

  // ========================================================================
  // Internal State
  // ========================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // Sphere mesh
  private sphereMesh: THREE.Mesh | null = null;
  private sphereGeometry: THREE.SphereGeometry | null = null;
  private sphereMaterial:
    | THREE.MeshStandardMaterial
    | THREE.MeshStandardNodeMaterial
    | null = null;

  // Particle system
  private particlePoints: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particleMaterial: THREE.PointsNodeMaterial | null = null;

  // Particle tracking data
  private particleData: Array<{
    distance: number; // Current distance from sphere center
    direction: THREE.Vector3; // Normalized outward direction
    baseOpacity: number; // Base opacity for this particle
  }> = [];

  private particleUpdateCleanup: (() => void) | null = null;

  // ========================================================================
  // Component Initialization
  // ========================================================================

  constructor() {
    // Effect: Create sphere and particles when parent available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.sphereMesh) {
        this.createSphereMesh();
        this.createParticleEmissionSystem();
        this.setupParticleLifecycle();

        parent.add(this.sphereMesh!);
        parent.add(this.particlePoints!);
      }
    });

    // Effect: Update position
    effect(() => {
      const [x, y, z] = this.position();
      if (this.sphereMesh) this.sphereMesh.position.set(x, y, z);
      if (this.particlePoints) this.particlePoints.position.set(x, y, z);
    });

    // Effect: Update scale
    effect(() => {
      const s = this.scale();
      if (this.sphereMesh) this.sphereMesh.scale.setScalar(s);
      if (this.particlePoints) this.particlePoints.scale.setScalar(s);
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => this.dispose());
  }

  // ========================================================================
  // Sphere Creation (Marble Pattern)
  // ========================================================================

  /**
   * Create sphere mesh with marble material and animated interior texture
   * Pattern: marble-sphere.component.ts:241-292
   */
  private createSphereMesh(): void {
    const radius = this.radius();

    // Create geometry
    this.sphereGeometry = new THREE.SphereGeometry(radius, 64, 64);

    // ULTRA SIMPLE TEST: Just solid color, NO TSL, NO texture
    // If this doesn't show peachy, something else is broken
    this.sphereMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffd4a3'), // Bright peachy color
      metalness: 0.2,
      roughness: 0.8,
      transparent: true,
      opacity: this.opacity(),
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Create mesh
    this.sphereMesh = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this.sphereMesh.renderOrder = 2; // Render after particles
  }

  // ========================================================================
  // Particle Emission System (Surface-Based, Outward Flow)
  // ========================================================================

  /**
   * Create particle emission system with outward-only flow
   * Pattern: sparkle-corona.component.ts:90-112 (surface generation)
   */
  private createParticleEmissionSystem(): void {
    const radius = this.radius();
    const count = this.particleCount();
    const size = this.particleSize();

    // Create geometry
    this.particleGeometry = new THREE.BufferGeometry();

    // Initialize position, color, and opacity arrays
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const opacities = new Float32Array(count);

    // Parse particle color palette
    const colorStrings = this.particleColors();
    const threeColors = colorStrings.map((c) => new THREE.Color(c));

    // Generate initial particle positions (AT sphere surface)
    for (let i = 0; i < count; i++) {
      // Random direction on sphere surface
      // Pattern: sparkle-corona.component.ts:99-100
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Direction vector (normalized)
      const dirX = Math.sin(phi) * Math.cos(theta);
      const dirY = Math.cos(phi);
      const dirZ = Math.sin(phi) * Math.sin(theta);

      // CRITICAL: Start particles AT sphere surface (radius * 1.0)
      // NOT inside volume
      const startDistance = radius * 1.0;

      // Set position
      const idx = i * 3;
      positions[idx] = dirX * startDistance;
      positions[idx + 1] = dirY * startDistance;
      positions[idx + 2] = dirZ * startDistance;

      // Assign random color from palette
      const colorIndex = Math.floor(Math.random() * threeColors.length);
      const selectedColor = threeColors[colorIndex];
      colors[idx] = selectedColor.r;
      colors[idx + 1] = selectedColor.g;
      colors[idx + 2] = selectedColor.b;

      // Initialize opacity
      opacities[i] = this.particleOpacity();

      // Store particle data for animation
      this.particleData.push({
        distance: startDistance,
        direction: new THREE.Vector3(dirX, dirY, dirZ).normalize(),
        baseOpacity: this.particleOpacity() * (0.5 + Math.random() * 0.5), // Vary opacity
      });
    }

    // Set buffer attributes
    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
    this.particleGeometry.setAttribute(
      'opacity',
      new THREE.BufferAttribute(opacities, 1)
    );

    // Create circular texture for round particles
    const circularTexture = this.createCircularTexture();

    // Create material
    this.particleMaterial = new THREE.PointsNodeMaterial();
    this.particleMaterial.size = size * 100; // Increased from 50 for better visibility
    this.particleMaterial.sizeAttenuation = true;
    this.particleMaterial.transparent = true;
    this.particleMaterial.opacity = 0.9; // High base opacity
    this.particleMaterial.depthWrite = false;
    this.particleMaterial.blending = THREE.AdditiveBlending;
    this.particleMaterial.vertexColors = true;
    this.particleMaterial.map = circularTexture; // Circular sprite

    // Create Points object
    this.particlePoints = new THREE.Points(
      this.particleGeometry,
      this.particleMaterial
    );
    this.particlePoints.frustumCulled = false;
    this.particlePoints.renderOrder = 1; // Render before sphere
  }

  /**
   * Create circular texture for point sprite
   * Makes particles appear as round glowing dots instead of squares
   */
  private createCircularTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Radial gradient for soft circular glow
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // ========================================================================
  // Particle Lifecycle Animation (Outward Flow Only)
  // ========================================================================

  /**
   * Setup particle lifecycle animation
   * Spawn -> Flow Outward -> Fade -> Despawn -> Respawn
   *
   * CRITICAL: Particles ONLY flow outward, never inward
   * This prevents particles from penetrating sphere interior
   */
  private setupParticleLifecycle(): void {
    const radius = this.radius();
    const maxDistance = this.maxDistance();
    const flowSpeed = this.flowSpeed();

    const positionAttribute = this.particleGeometry!.getAttribute(
      'position'
    ) as THREE.BufferAttribute;
    const opacityAttribute = this.particleGeometry!.getAttribute(
      'opacity'
    ) as THREE.BufferAttribute;

    this.particleUpdateCleanup = this.renderLoop.registerUpdateCallback(
      (delta) => {
        const count = this.particleData.length;

        for (let i = 0; i < count; i++) {
          const data = this.particleData[i];

          // FLOW OUTWARD: Increase distance from center
          // NEVER decrease distance (no inward flow)
          data.distance += flowSpeed * delta * 1000;

          // DESPAWN: If particle too far, respawn at surface
          if (data.distance > maxDistance) {
            data.distance = radius * 1.0; // Back to surface

            // Optional: Regenerate random direction for variety
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            data.direction
              .set(
                Math.sin(phi) * Math.cos(theta),
                Math.cos(phi),
                Math.sin(phi) * Math.sin(theta)
              )
              .normalize();
          }

          // UPDATE POSITION: Move along outward direction
          const idx = i * 3;
          positionAttribute.array[idx] = data.direction.x * data.distance;
          positionAttribute.array[idx + 1] = data.direction.y * data.distance;
          positionAttribute.array[idx + 2] = data.direction.z * data.distance;

          // FADE: Opacity decreases with distance from sphere
          // Particles brightest at surface, fade as they travel
          const normalizedDistance =
            (data.distance - radius) / (maxDistance - radius);
          const fadeFactor = 1.0 - normalizedDistance;
          opacityAttribute.array[i] = data.baseOpacity * fadeFactor;
        }

        positionAttribute.needsUpdate = true;
        opacityAttribute.needsUpdate = true;
      }
    );

    this.destroyRef.onDestroy(() => {
      if (this.particleUpdateCleanup) {
        this.particleUpdateCleanup();
        this.particleUpdateCleanup = null;
      }
    });
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  private dispose(): void {
    const parent = this.parent();

    // Remove from scene
    if (parent && this.sphereMesh) parent.remove(this.sphereMesh);
    if (parent && this.particlePoints) parent.remove(this.particlePoints);

    // Cleanup animation
    if (this.particleUpdateCleanup) {
      this.particleUpdateCleanup();
      this.particleUpdateCleanup = null;
    }

    // Dispose sphere resources
    this.sphereGeometry?.dispose();
    this.sphereMaterial?.dispose();
    this.sphereMesh = null;

    // Dispose particle resources
    this.particleGeometry?.dispose();
    this.particleMaterial?.dispose();
    this.particleMaterial?.map?.dispose(); // Dispose circular texture
    this.particlePoints = null;
    this.particleData = [];
  }
}
