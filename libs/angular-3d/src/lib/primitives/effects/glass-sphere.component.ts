/**
 * GlassSphereComponent - Glass Sphere with Radiating Light Beams
 *
 * Creates a semi-transparent glass sphere with enhanced edge fresnel glow and
 * radiating particle beams shooting outward like light streaks.
 *
 * Features:
 * - Configurable coral/glass color with transparency
 * - Enhanced multi-layer TSL fresnel edge glow (thick, warm rim)
 * - Built-in GPU-instanced radiating beam system
 * - Beams shoot outward from sphere surface
 * - Gentle rotation and drift animation
 * - Signal-based reactive inputs
 *
 * @example
 * ```html
 * <a3d-glass-sphere
 *   [radius]="4.5"
 *   [position]="[0, 0, 0]"
 *   [enableBeams]="true"
 *   [beamCount]="300"
 *   [beamColors]="['#ff8866', '#ffe8d7']"
 * />
 * ```
 */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  Fn,
  abs,
  add,
  cameraPosition,
  dot,
  float,
  fract,
  length,
  mix,
  mul,
  normalWorld,
  normalize,
  positionLocal,
  positionWorld,
  pow,
  sin,
  smoothstep,
  sub,
  uv,
  vec2,
  vec3,
} from 'three/tsl';

import { RenderLoopService } from '../../render-loop/render-loop.service';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { NG_3D_PARENT } from '../../types/tokens';

/** Beam animation data */
interface BeamData {
  baseDirection: THREE.Vector3; // Original direction from sphere center
  angle: number; // Rotation angle around sphere
  distance: number; // Distance from sphere center
  rotationAxis: THREE.Vector3; // Axis to rotate around
}

@Component({
  selector: 'a3d-glass-sphere',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `glass-sphere-${crypto.randomUUID()}`,
    },
  ],
})
export class GlassSphereComponent {
  // ============================================================================
  // Geometry Inputs
  // ============================================================================

  /** Sphere radius (default: 4.5 for hero prominence) */
  public readonly radius = input<number>(4.5);

  /** Geometry segments for smooth curvature (default: 64) */
  public readonly segments = input<number>(64);

  /** World position as [x, y, z] tuple */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Uniform scale multiplier (default: 1) */
  public readonly scale = input<number>(1);

  // ============================================================================
  // Glass Material Inputs
  // ============================================================================

  /** Glass color (default: coral '#ffc0a0') */
  public readonly color = input<string>('#ffc0a0');

  /** Opacity (0-1, default: 0.3 for translucent glass) */
  public readonly opacity = input<number>(0.3);

  /** Surface roughness (0 = mirror, 1 = matte, default: 0.05 for glossy) */
  public readonly roughness = input<number>(0.05);

  /** Surface metalness (default: 0.0 for glass) */
  public readonly metalness = input<number>(0.0);

  // ============================================================================
  // Edge Glow Inputs
  // ============================================================================

  /** Fresnel edge glow color (default: warm coral '#ff9070') */
  public readonly edgeGlowColor = input<string>('#ff9070');

  /** Edge glow intensity multiplier (default: 1.2) */
  public readonly edgeGlowIntensity = input<number>(1.2);

  /** Fresnel power (higher = thinner glow line, default: 2.0) */
  public readonly edgeGlowPower = input<number>(2.0);

  // ============================================================================
  // Radiating Beam Inputs
  // ============================================================================

  /** Enable radiating particle beams (default: true) */
  public readonly enableBeams = input<boolean>(true);

  /** Number of radiating beams (default: 300) */
  public readonly beamCount = input<number>(300);

  /** Beam width (default: 0.05) */
  public readonly beamWidth = input<number>(0.05);

  /** Beam length (default: 2.0) */
  public readonly beamLength = input<number>(2.0);

  /** Beam color gradient (array of hex colors) */
  public readonly beamColors = input<string[]>(['#ff8866', '#ffe8d7']);

  /** Beam opacity (default: 0.4) */
  public readonly beamOpacity = input<number>(0.4);

  /** Beam rotation speed (radians per second) */
  public readonly beamRotationSpeed = input<number>(0.00005);

  /** Beam drift speed (units per second) */
  public readonly beamDriftSpeed = input<number>(0.001);

  /** Maximum beam distance before reset (default: 15) */
  public readonly beamMaxDistance = input<number>(15);

  // ============================================================================
  // Internal State
  // ============================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);

  // Glass shell
  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.MeshStandardNodeMaterial | null = null;
  private isAddedToScene = false;

  // Radiating beam system (now using Points for true particles)
  private beamMesh: THREE.Points | null = null;
  private beamGeometry: THREE.BufferGeometry | null = null;
  private beamMaterial: THREE.PointsNodeMaterial | null = null;
  private beamData: BeamData[] = [];
  private beamUpdateCleanup: (() => void) | null = null;

  public constructor() {
    // Effect: Create mesh and add to parent when parent becomes available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.isAddedToScene) {
        this.createMesh();
        if (this.mesh) {
          parent.add(this.mesh);
          this.isAddedToScene = true;

          // Create radiating beam system AFTER mesh is added to scene
          // Add beams directly to parent, not as child of glass mesh
          if (this.enableBeams()) {
            this.createBeamSystem(parent);
          }
        }
      }
    });

    // Effect: Update position when it changes (affects both glass and beams)
    effect(() => {
      const [x, y, z] = this.position();
      if (this.mesh) {
        this.mesh.position.set(x, y, z);
      }
      // Beams are separate from mesh, so update their position too
      if (this.beamMesh) {
        this.beamMesh.position.set(x, y, z);
      }
    });

    // Effect: Update scale when it changes (affects both glass and beams)
    effect(() => {
      const s = this.scale();
      if (this.mesh) {
        this.mesh.scale.setScalar(s);
      }
      // Beams are separate from mesh, so update their scale too
      if (this.beamMesh) {
        this.beamMesh.scale.setScalar(s);
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      const parent = this.parent();
      if (parent && this.mesh && this.isAddedToScene) {
        parent.remove(this.mesh);
      }
      // Also remove beams from parent
      if (parent && this.beamMesh) {
        parent.remove(this.beamMesh);
      }
      this.disposeMesh();
      this.isAddedToScene = false;
    });
  }

  /**
   * Create the glass sphere mesh with TSL fresnel material and particles
   */
  private createMesh(): void {
    // Create geometry
    const radius = this.radius();
    const segments = this.segments();
    this.geometry = new THREE.SphereGeometry(radius, segments, segments);

    // Parse color inputs
    const colorHex = new THREE.Color(this.color());
    const edgeColorHex = new THREE.Color(this.edgeGlowColor());
    const intensity = this.edgeGlowIntensity();
    const power = this.edgeGlowPower();

    // Create MeshStandardNodeMaterial with transparent glass properties
    // CRITICAL: depthWrite: false prevents glass from blocking particles behind/inside it
    this.material = new THREE.MeshStandardNodeMaterial({
      metalness: this.metalness(),
      roughness: this.roughness(),
      transparent: true,
      opacity: this.opacity(),
      side: THREE.DoubleSide,
      depthWrite: false, // Critical for transparency with particles inside
    });

    // CRITICAL FIX: Set base color to BLACK so sphere is invisible in center
    // Only the emissive edge glow will be visible (peachy rim)
    this.material.colorNode = vec3(0.0, 0.0, 0.0);

    // TSL Enhanced Fresnel edge glow - THICK coral rim matching reference image
    const fresnelEdgeGlow = Fn(() => {
      // Calculate view direction from camera to surface point
      const viewDir = normalize(cameraPosition.sub(positionWorld));

      // Rim factor: 1 at edges (perpendicular to view), 0 at center (facing camera)
      const rim = float(1).sub(abs(dot(normalWorld, viewDir)));

      // CRITICAL: Make glow ONLY on edges, not spreading to center
      // Higher power = sharper falloff = only edges glow

      // Layer 1: Soft outer edge
      const outerGlowPower = float(3.0); // Much higher = sharper
      const outerGlow = pow(rim, outerGlowPower).mul(2.0);

      // Layer 2: Medium edge
      const midGlowPower = float(power).mul(1.5); // power is 1.5 from input, so 2.25
      const midGlow = pow(rim, midGlowPower).mul(3.0);

      // Layer 3: Sharp bright rim
      const innerRimPower = float(power).mul(3.0); // 4.5 total
      const innerRim = pow(rim, innerRimPower).mul(5.0);

      // Combine - concentrated on edges only
      const combinedGlow = outerGlow
        .mul(0.4)
        .add(midGlow.mul(0.8))
        .add(innerRim.mul(2.0));

      // Edge glow color with intensity (warm coral)
      const edgeGlow = vec3(edgeColorHex.r, edgeColorHex.g, edgeColorHex.b)
        .mul(combinedGlow)
        .mul(intensity);

      return edgeGlow;
    });

    // Apply fresnel glow to emissive channel
    this.material.emissiveNode = fresnelEdgeGlow();

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Set initial position
    const [x, y, z] = this.position();
    this.mesh.position.set(x, y, z);

    // Set initial scale
    this.mesh.scale.setScalar(this.scale());

    // Glass doesn't cast shadows well
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;

    // Set renderOrder: glass renders after beams (higher = later)
    // Beams will have renderOrder 1, glass has 2 so glass appears on top
    this.mesh.renderOrder = 2;
  }

  /**
   * Create radiating particle system - true point particles around sphere
   */
  private createBeamSystem(
    parent: THREE.Object3D | THREE.Scene | THREE.Group
  ): void {
    const radius = this.radius();
    const count = this.beamCount();
    const beamWidth = this.beamWidth(); // Now used as particle size

    // Create BufferGeometry for points
    this.beamGeometry = new THREE.BufferGeometry();

    // Initialize position and color arrays
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Parse beam colors (support 2-5 colors)
    const colorStrings = this.beamColors();
    const threeColors = colorStrings.map((c) => new THREE.Color(c));

    // Create PointsNodeMaterial for true point particles
    this.beamMaterial = new THREE.PointsNodeMaterial();
    this.beamMaterial.transparent = true;
    this.beamMaterial.depthWrite = false;
    this.beamMaterial.blending = THREE.AdditiveBlending;
    this.beamMaterial.vertexColors = true;
    this.beamMaterial.sizeAttenuation = true;

    // Set base particle size and opacity
    this.beamMaterial.size = beamWidth * 100; // Scale up for visibility
    this.beamMaterial.opacity = this.beamOpacity();

    // Setup particle positions and colors
    for (let i = 0; i < count; i++) {
      // Random direction on sphere surface
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const baseX = Math.sin(phi) * Math.cos(theta);
      const baseY = Math.cos(phi);
      const baseZ = Math.sin(phi) * Math.sin(theta);

      // Direction vector from sphere center
      const direction = new THREE.Vector3(baseX, baseY, baseZ);

      // Position particle starting from sphere surface
      const startRadius = radius * 1.0; // At surface
      const distance = startRadius + Math.random() * 0.3; // Start very close to surface (corona)

      const idx = i * 3;
      positions[idx] = baseX * distance;
      positions[idx + 1] = baseY * distance;
      positions[idx + 2] = baseZ * distance;

      // Assign random color from palette
      const colorIndex = Math.floor(Math.random() * threeColors.length);
      const selectedColor = threeColors[colorIndex];
      colors[idx] = selectedColor.r;
      colors[idx + 1] = selectedColor.g;
      colors[idx + 2] = selectedColor.b;

      // Random size variation
      sizes[i] = 0.5 + Math.random() * 1.5;

      // Store particle data for animation
      const perpX = Math.random() - 0.5;
      const perpY = Math.random() - 0.5;
      const perpZ = Math.random() - 0.5;
      const rotationAxis = new THREE.Vector3(perpX, perpY, perpZ);
      rotationAxis.cross(direction);
      rotationAxis.normalize();

      this.beamData.push({
        baseDirection: direction.clone(),
        angle: Math.random() * Math.PI * 2,
        distance: distance,
        rotationAxis: rotationAxis,
      });
    }

    // Set buffer attributes
    this.beamGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.beamGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
    this.beamGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create Points object
    this.beamMesh = new THREE.Points(this.beamGeometry, this.beamMaterial);
    this.beamMesh.frustumCulled = false;
    this.beamMesh.renderOrder = 1;

    // Set position and scale
    const [x, y, z] = this.position();
    this.beamMesh.position.set(x, y, z);
    this.beamMesh.scale.setScalar(this.scale());

    // Add to scene
    parent.add(this.beamMesh);

    // Setup beam animation
    this.setupBeamAnimation();
  }

  /**
   * Setup particle animation - gentle rotation + outward drift
   */
  private setupBeamAnimation(): void {
    if (!this.beamMesh || !this.beamGeometry) return;

    const radius = this.radius();
    const maxDistance = this.beamMaxDistance();
    const rotationSpeed = this.beamRotationSpeed();
    const driftSpeed = this.beamDriftSpeed();

    const positionAttribute = this.beamGeometry.getAttribute(
      'position'
    ) as THREE.BufferAttribute;

    this.beamUpdateCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      const count = this.beamData.length;

      for (let i = 0; i < count; i++) {
        const data = this.beamData[i];

        // Gentle rotation around sphere (rotate direction vector)
        data.angle += rotationSpeed * delta * 1000;

        // Drift outward slowly
        data.distance += driftSpeed * delta * 1000;

        // Reset if too far
        if (data.distance > maxDistance) {
          data.distance = radius; // Back to surface
        }

        // Calculate new position by rotating base direction
        const tempDir = data.baseDirection.clone();
        tempDir.applyAxisAngle(data.rotationAxis, data.angle);

        // Update particle position
        const idx = i * 3;
        positionAttribute.array[idx] = tempDir.x * data.distance;
        positionAttribute.array[idx + 1] = tempDir.y * data.distance;
        positionAttribute.array[idx + 2] = tempDir.z * data.distance;
      }

      positionAttribute.needsUpdate = true;
    });

    this.destroyRef.onDestroy(() => {
      if (this.beamUpdateCleanup) {
        this.beamUpdateCleanup();
        this.beamUpdateCleanup = null;
      }
    });
  }

  /**
   * Dispose Three.js resources
   */
  private disposeMesh(): void {
    // Dispose beam system
    if (this.beamUpdateCleanup) {
      this.beamUpdateCleanup();
      this.beamUpdateCleanup = null;
    }
    if (this.beamGeometry) {
      this.beamGeometry.dispose();
      this.beamGeometry = null;
    }
    if (this.beamMaterial) {
      this.beamMaterial.dispose();
      this.beamMaterial = null;
    }
    this.beamMesh = null;
    this.beamData = [];

    // Dispose glass shell
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.mesh = null;
  }
}
