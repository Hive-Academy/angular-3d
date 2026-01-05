import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import {
  float,
  vec3,
  normalize,
  cameraPosition,
  positionWorld,
  normalWorld,
  dot,
  pow,
} from 'three/tsl';
import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop';
import {
  createVolumetricFireNode,
  createVolumetricFireUniforms,
  type VolumetricFireUniforms,
} from '../shaders/tsl-volumetric-fire';

/**
 * FireSphereComponent - Volumetric Sun/Fire Sphere
 *
 * Creates a sphere with:
 * - Volumetric ray-marched fire/sun core with multi-color gradient
 * - Optional corona glow extending beyond the sphere
 * - Optional particle emission system (for prominence effects)
 *
 * **Sun Mode** (default): Realistic sun with white-yellow core → orange → red edges
 * **Fire Mode**: Customizable single-color fire effect
 *
 * @example Sun Mode (realistic sun):
 * <a3d-fire-sphere
 *   [radius]="4.5"
 *   [sunMode]="true"
 *   [showCorona]="true"
 *   [coronaScale]="1.3"
 * />
 *
 * @example Fire Mode (custom color):
 * <a3d-fire-sphere
 *   [radius]="4.5"
 *   [sunMode]="false"
 *   [fireColor]="'#ff6600'"
 *   [showShell]="true"
 * />
 */
@Component({
  selector: 'a3d-fire-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class FireSphereComponent {
  // ========================================================================
  // Sphere Configuration Inputs
  // ========================================================================

  /** Sphere radius (default: 4.5) */
  public readonly radius = input<number>(4.5);

  /** Sphere position [x, y, z] */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Sphere scale multiplier */
  public readonly scale = input<number>(1.0);

  // ========================================================================
  // Mode Selection
  // ========================================================================

  /**
   * Sun mode: true = realistic sun colors (white→yellow→orange→red)
   * Fire mode: false = uses fireColor for tinting
   */
  public readonly sunMode = input<boolean>(true);

  // ========================================================================
  // Volumetric Fire Configuration
  // ========================================================================

  /** Fire color - only used when sunMode=false (default: orange) */
  public readonly fireColor = input<string>('#ff6600');

  /** Fire turbulence magnitude - higher = more chaotic flames (default: 0.4) */
  public readonly fireMagnitude = input<number>(0.4);

  /** Fire animation speed (default: 0.5) */
  public readonly fireSpeed = input<number>(0.5);

  /** Fire noise scale (default: 0.8) */
  public readonly fireNoiseScale = input<number>(0.8);

  // ========================================================================
  // Glass Shell Configuration (creates 3D depth effect)
  // ========================================================================

  /** Enable glass shell around fire (default: true) */
  public readonly showShell = input<boolean>(true);

  /** Shell color - darker tint at edges (default: warm brown) */
  public readonly shellColor = input<string>('#cc8866');

  /** Shell edge darkness - Fresnel power, higher = sharper edge (default: 2.0) */
  public readonly shellEdgePower = input<number>(2.0);

  /** Shell opacity at edges (default: 0.4) */
  public readonly shellEdgeOpacity = input<number>(0.4);

  /** Shell size multiplier relative to fire radius (default: 1.02 - slightly larger) */
  public readonly shellScale = input<number>(1.02);

  // ========================================================================
  // Corona Glow Configuration (sun mode - luminous outer glow)
  // ========================================================================

  /** Enable corona glow for sun mode (default: true) */
  public readonly showCorona = input<boolean>(true);

  /** Corona size multiplier - how far the glow extends (default: 1.3 = 30% beyond) */
  public readonly coronaScale = input<number>(1.3);

  /** Corona color - blends with sun edge color (default: orange-red) */
  public readonly coronaColor = input<string>('#ff4400');

  /** Corona intensity/brightness (default: 0.6) */
  public readonly coronaIntensity = input<number>(0.6);

  // ========================================================================
  // Particle Emission Configuration Inputs
  // ========================================================================

  /** Number of particles in system (default: 800) */
  public readonly particleCount = input<number>(800);

  /** Particle size (default: 0.08) */
  public readonly particleSize = input<number>(0.08);

  /** Outward flow speed (units/second, default: 0.3) */
  public readonly flowSpeed = input<number>(0.3);

  /** Max distance from sphere before despawn (default: 5.5) */
  public readonly maxDistance = input<number>(5.5);

  /** Particle colors (default: 5-color peachy palette) */
  public readonly particleColors = input<string[]>([
    '#ffffff',
    '#fff5e6',
    '#ffccaa',
    '#ff8866',
    '#ff6644',
  ]);

  /** Base particle opacity (default: 0.6) */
  public readonly particleOpacity = input<number>(0.6);

  // ========================================================================
  // Internal State
  // ========================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // Fire sphere mesh (volumetric fire core)
  private sphereMesh: THREE.Mesh | null = null;
  private sphereGeometry: THREE.SphereGeometry | null = null;
  private sphereMaterial: THREE.MeshBasicNodeMaterial | null = null;
  private volumetricFireUniforms: VolumetricFireUniforms | null = null;
  private fireUpdateCleanup: (() => void) | null = null;

  // Glass shell mesh (Fresnel effect - darker edges)
  private shellMesh: THREE.Mesh | null = null;
  private shellGeometry: THREE.SphereGeometry | null = null;
  private shellMaterial: THREE.MeshBasicNodeMaterial | null = null;

  // Corona glow mesh (sun mode - luminous outer glow)
  private coronaMesh: THREE.Mesh | null = null;
  private coronaGeometry: THREE.SphereGeometry | null = null;
  private coronaMaterial: THREE.MeshBasicNodeMaterial | null = null;

  // Particle system
  private particlePoints: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particleMaterial: THREE.PointsNodeMaterial | null = null;
  private particleData: Array<{
    distance: number;
    direction: THREE.Vector3;
    baseOpacity: number;
  }> = [];
  private particleUpdateCleanup: (() => void) | null = null;

  // ========================================================================
  // Component Initialization
  // ========================================================================

  public constructor() {
    effect(() => {
      const parent = this.parent();
      if (parent && !this.sphereMesh) {
        this.createFireSphere();
        this.createGlassShell();
        this.createCoronaGlow();
        this.createParticleSystem();
        this.setupFireUpdates();
        this.setupParticleAnimation();

        // Add in render order: corona first (background glow), fire, shell, particles
        if (this.coronaMesh) parent.add(this.coronaMesh);
        parent.add(this.sphereMesh!);
        if (this.shellMesh) parent.add(this.shellMesh);
        if (this.particlePoints) parent.add(this.particlePoints);
      }
    });

    effect(() => {
      const [x, y, z] = this.position();
      if (this.coronaMesh) this.coronaMesh.position.set(x, y, z);
      if (this.sphereMesh) this.sphereMesh.position.set(x, y, z);
      if (this.shellMesh) this.shellMesh.position.set(x, y, z);
      if (this.particlePoints) this.particlePoints.position.set(x, y, z);
    });

    effect(() => {
      const s = this.scale();
      if (this.coronaMesh) this.coronaMesh.scale.setScalar(s * this.coronaScale());
      if (this.sphereMesh) this.sphereMesh.scale.setScalar(s);
      if (this.shellMesh) this.shellMesh.scale.setScalar(s * this.shellScale());
      if (this.particlePoints) this.particlePoints.scale.setScalar(s);
    });

    this.destroyRef.onDestroy(() => this.dispose());
  }

  // ========================================================================
  // Fire Sphere Creation
  // ========================================================================

  private createFireSphere(): void {
    const radius = this.radius();
    const noiseScale = this.fireNoiseScale();
    const speed = this.fireSpeed();
    const isSunMode = this.sunMode();

    // Use larger sphere geometry to contain corona extension
    const extendedRadius = isSunMode ? radius * 1.15 : radius;
    this.sphereGeometry = new THREE.SphereGeometry(extendedRadius, 64, 64);

    // Create volumetric fire uniforms
    this.volumetricFireUniforms = createVolumetricFireUniforms({
      color: new THREE.Color(this.fireColor()),
      sphereRadius: radius,
      noiseScale: [noiseScale, noiseScale, noiseScale, speed],
      magnitude: this.fireMagnitude(),
      lacunarity: 2.0,
      gain: 0.5,
    });

    // Create volumetric fire/sun fragment node
    // Pass sunMode to use built-in multi-color gradient
    const volumetricNode = createVolumetricFireNode(
      this.volumetricFireUniforms,
      40, // iterations
      isSunMode // sunMode - uses realistic sun colors when true
    );

    // Create material with volumetric fire shader
    this.sphereMaterial = new THREE.MeshBasicNodeMaterial();
    this.sphereMaterial.fragmentNode = volumetricNode;
    this.sphereMaterial.transparent = true;
    this.sphereMaterial.depthWrite = false;
    this.sphereMaterial.blending = THREE.AdditiveBlending;
    this.sphereMaterial.side = THREE.DoubleSide;

    this.sphereMesh = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this.sphereMesh.renderOrder = 1;
  }

  private setupFireUpdates(): void {
    if (!this.volumetricFireUniforms) return;

    this.fireUpdateCleanup = this.renderLoop.registerUpdateCallback(() => {
      if (this.sphereMesh && this.volumetricFireUniforms) {
        this.sphereMesh.updateMatrixWorld();
        this.volumetricFireUniforms.invModelMatrix.value
          .copy(this.sphereMesh.matrixWorld)
          .invert();
        this.volumetricFireUniforms.scale.value.copy(this.sphereMesh.scale);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.fireUpdateCleanup) {
        this.fireUpdateCleanup();
        this.fireUpdateCleanup = null;
      }
    });
  }

  // ========================================================================
  // Glass Shell Creation (Fresnel - darker edges for 3D depth)
  // ========================================================================

  /**
   * Create glass shell sphere with Fresnel effect
   * - Transparent at center (view through to fire)
   * - Darker/more opaque at edges (creates depth/containment)
   */
  private createGlassShell(): void {
    if (!this.showShell()) return;

    const radius = this.radius();
    const shellScale = this.shellScale();
    const shellColor = new THREE.Color(this.shellColor());
    const edgePower = this.shellEdgePower();
    const edgeOpacity = this.shellEdgeOpacity();

    // Create slightly larger sphere for shell
    this.shellGeometry = new THREE.SphereGeometry(radius * shellScale, 64, 64);

    // Fresnel effect: transparent center, opaque edges
    // fresnel = 1 - dot(viewDir, normal)
    // Higher fresnel = viewing at edge (grazing angle)
    const viewDir = normalize(cameraPosition.sub(positionWorld));
    const normal = normalize(normalWorld); // Use actual geometry normal
    const fresnel = float(1.0).sub(dot(viewDir, normal).clamp(0, 1));
    const fresnelPow = pow(fresnel, float(edgePower));

    // Mix: transparent at center (fresnel=0), colored at edges (fresnel=1)
    const finalOpacity = fresnelPow.mul(float(edgeOpacity));
    const finalColor = vec3(shellColor.r, shellColor.g, shellColor.b);

    // Create material with Fresnel shader
    this.shellMaterial = new THREE.MeshBasicNodeMaterial();
    this.shellMaterial.colorNode = finalColor;
    this.shellMaterial.opacityNode = finalOpacity;
    this.shellMaterial.transparent = true;
    this.shellMaterial.depthWrite = false;
    this.shellMaterial.side = THREE.FrontSide; // Only outer surface

    this.shellMesh = new THREE.Mesh(this.shellGeometry, this.shellMaterial);
    this.shellMesh.renderOrder = 2; // After fire, before particles
  }

  // ========================================================================
  // Corona Glow Creation (Sun mode - luminous outer atmosphere)
  // ========================================================================

  /**
   * Create corona glow sphere for sun mode
   * - Larger sphere with inverted Fresnel (glow at edges)
   * - Creates luminous solar atmosphere effect
   * - Extends visual beyond the sun surface
   */
  private createCoronaGlow(): void {
    // Only create corona in sun mode and when enabled
    if (!this.sunMode() || !this.showCorona()) return;

    const radius = this.radius();
    const coronaScale = this.coronaScale();
    const coronaColor = new THREE.Color(this.coronaColor());
    const intensity = this.coronaIntensity();

    // Create larger sphere for corona glow
    this.coronaGeometry = new THREE.SphereGeometry(radius * coronaScale, 48, 48);

    // Inverted Fresnel: glow at edges, transparent at center
    // This creates the luminous halo effect around the sun
    const viewDir = normalize(cameraPosition.sub(positionWorld));
    const normal = normalize(normalWorld);
    const fresnel = float(1.0).sub(dot(viewDir, normal).clamp(0, 1));

    // Softer power for gradual glow falloff
    const fresnelPow = pow(fresnel, float(1.5));

    // Radial falloff from surface - corona fades outward
    // Calculate distance from sun surface (not center)
    const distFromCenter = positionWorld.length();
    const normalizedDist = distFromCenter.div(float(radius * coronaScale));

    // Combine Fresnel edge glow with radial falloff
    const radialFade = float(1.0).sub(normalizedDist).clamp(0, 1);
    const coronaGlow = fresnelPow.mul(radialFade).mul(float(intensity));

    // Orange-red gradient for realistic corona
    const glowColor = vec3(coronaColor.r, coronaColor.g, coronaColor.b);

    // Create material with additive blending for luminous effect
    this.coronaMaterial = new THREE.MeshBasicNodeMaterial();
    this.coronaMaterial.colorNode = glowColor;
    this.coronaMaterial.opacityNode = coronaGlow;
    this.coronaMaterial.transparent = true;
    this.coronaMaterial.depthWrite = false;
    this.coronaMaterial.blending = THREE.AdditiveBlending;
    this.coronaMaterial.side = THREE.BackSide; // Render inside of sphere (halo effect)

    this.coronaMesh = new THREE.Mesh(this.coronaGeometry, this.coronaMaterial);
    this.coronaMesh.renderOrder = 0; // Before fire (background glow)
  }

  // ========================================================================
  // Particle System (Outward Corona)
  // ========================================================================

  private createParticleSystem(): void {
    const radius = this.radius();
    const count = this.particleCount();
    const size = this.particleSize();

    this.particleGeometry = new THREE.BufferGeometry();

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorStrings = this.particleColors();
    const threeColors = colorStrings.map((c) => new THREE.Color(c));

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const dirX = Math.sin(phi) * Math.cos(theta);
      const dirY = Math.cos(phi);
      const dirZ = Math.sin(phi) * Math.sin(theta);

      const startDistance = radius * 1.0;

      const idx = i * 3;
      positions[idx] = dirX * startDistance;
      positions[idx + 1] = dirY * startDistance;
      positions[idx + 2] = dirZ * startDistance;

      const colorIndex = Math.floor(Math.random() * threeColors.length);
      const selectedColor = threeColors[colorIndex];
      colors[idx] = selectedColor.r;
      colors[idx + 1] = selectedColor.g;
      colors[idx + 2] = selectedColor.b;

      this.particleData.push({
        distance: startDistance,
        direction: new THREE.Vector3(dirX, dirY, dirZ).normalize(),
        baseOpacity: this.particleOpacity() * (0.5 + Math.random() * 0.5),
      });
    }

    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );

    this.particleMaterial = new THREE.PointsNodeMaterial();
    this.particleMaterial.size = size * 100;
    this.particleMaterial.sizeAttenuation = true;
    this.particleMaterial.transparent = true;
    this.particleMaterial.depthWrite = false;
    this.particleMaterial.blending = THREE.AdditiveBlending;
    this.particleMaterial.vertexColors = true;

    this.particlePoints = new THREE.Points(
      this.particleGeometry,
      this.particleMaterial
    );
    this.particlePoints.frustumCulled = false;
    this.particlePoints.renderOrder = 2;
  }

  private setupParticleAnimation(): void {
    const radius = this.radius();
    const maxDistance = this.maxDistance();
    const flowSpeed = this.flowSpeed();

    const positionAttribute = this.particleGeometry!.getAttribute(
      'position'
    ) as THREE.BufferAttribute;

    this.particleUpdateCleanup = this.renderLoop.registerUpdateCallback(
      (delta) => {
        for (let i = 0; i < this.particleData.length; i++) {
          const data = this.particleData[i];

          data.distance += flowSpeed * delta * 1000;

          if (data.distance > maxDistance) {
            data.distance = radius * 1.0;
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

          const idx = i * 3;
          positionAttribute.array[idx] = data.direction.x * data.distance;
          positionAttribute.array[idx + 1] = data.direction.y * data.distance;
          positionAttribute.array[idx + 2] = data.direction.z * data.distance;
        }

        positionAttribute.needsUpdate = true;
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

    if (this.fireUpdateCleanup) {
      this.fireUpdateCleanup();
      this.fireUpdateCleanup = null;
    }
    if (this.particleUpdateCleanup) {
      this.particleUpdateCleanup();
      this.particleUpdateCleanup = null;
    }

    if (parent) {
      if (this.coronaMesh) parent.remove(this.coronaMesh);
      if (this.sphereMesh) parent.remove(this.sphereMesh);
      if (this.shellMesh) parent.remove(this.shellMesh);
      if (this.particlePoints) parent.remove(this.particlePoints);
    }

    try {
      this.coronaGeometry?.dispose();
      this.sphereGeometry?.dispose();
      this.shellGeometry?.dispose();
      this.particleGeometry?.dispose();
      this.coronaMaterial?.dispose();
      this.sphereMaterial?.dispose();
      this.shellMaterial?.dispose();
      this.particleMaterial?.dispose();
    } catch (e) {
      console.warn('FireSphere: dispose warning', e);
    }

    this.coronaMesh = null;
    this.coronaGeometry = null;
    this.coronaMaterial = null;
    this.sphereMesh = null;
    this.sphereGeometry = null;
    this.sphereMaterial = null;
    this.volumetricFireUniforms = null;
    this.shellMesh = null;
    this.shellGeometry = null;
    this.shellMaterial = null;
    this.particlePoints = null;
    this.particleGeometry = null;
    this.particleMaterial = null;
    this.particleData = [];
  }
}
