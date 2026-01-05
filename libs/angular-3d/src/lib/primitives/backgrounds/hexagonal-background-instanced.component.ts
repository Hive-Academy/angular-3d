import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
} from '@angular/core';
import {
  Fn,
  abs,
  attribute,
  float,
  fract,
  instanceIndex,
  mix,
  mul,
  positionLocal,
  sin,
  smoothstep,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';
import { ColorRepresentation } from 'three/webgpu';
import { SceneService } from '../../canvas/scene.service';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { NG_3D_PARENT } from '../../types/tokens';

interface HexPhaseData {
  phaseX: number;
  phaseY: number;
  phaseDepth: number;
}

/**
 * HexagonalBackgroundInstancedComponent - Interactive neon hexagonal background
 *
 * Creates a circular dome of hexagons with dynamic edge glow:
 * - **Edges**: Thin neon outline (always visible, pulsing colors)
 * - **Faces**: Dark by default, light up bright near mouse cursor
 * - Instanced rendering (single draw call for performance)
 * - TSL-based WebGPU-compatible shaders (colorNode)
 * - Continuous depth bobbing and rotation wobble animations
 * - Bloom post-processing ready
 *
 * **Effect Behavior**:
 * - By default, only hexagon edges glow with pulsing neon colors
 * - Moving mouse near hexagons reveals their full bright face
 * - Mouse influence radius is configurable (default: 3.0 world units)
 *
 * Based on: https://codepen.io/prisoner849/pen/abYjammb
 *
 * @example
 * ```html
 * <a3d-hexagonal-background-instanced
 *   [circleCount]="10"
 *   [colorPalette]="[0xff8888, 0x88ff88, 0x8888ff]"
 *   [hexRadius]="0.5"
 *   [hexHeight]="0.1"
 *   [mouseInfluenceRadius]="3.0"
 * />
 * ```
 */
@Component({
  selector: 'a3d-hexagonal-background-instanced',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `hexagonal-background-instanced-${crypto.randomUUID()}`,
    },
  ],
})
export class HexagonalBackgroundInstancedComponent {
  // Signal inputs
  /**
   * Number of rings in the circular grid (default: 10)
   * Total hexagons ≈ (circleCount * (circleCount + 1)) / 2 * 6 + 1
   */
  public readonly circleCount = input<number>(10);

  /**
   * Color palette for hexagons (random assignment)
   */
  public readonly colorPalette = input<ColorRepresentation[]>([
    0xff8888, // Red
    0x88ff88, // Green
    0x8888ff, // Blue
    0xffffff, // White
  ]);

  /**
   * Radius of each hexagon
   */
  public readonly hexRadius = input<number>(0.5);

  /**
   * Height/thickness of hexagon prism
   */
  public readonly hexHeight = input<number>(0.1);

  /**
   * Base color of hexagon faces (should be dark to show only edges by default)
   */
  public readonly baseColor = input<ColorRepresentation>(0x000000);

  /**
   * Material roughness (0-1)
   */
  public readonly roughness = input<number>(0.75);

  /**
   * Material metalness (0-1)
   */
  public readonly metalness = input<number>(0.25);

  /**
   * Animation speed multiplier
   */
  public readonly animationSpeed = input<number>(0.5);

  /**
   * Depth bobbing amplitude
   */
  public readonly depthAmplitude = input<number>(0.125);

  /**
   * Rotation wobble amplitude
   */
  public readonly rotationAmplitude = input<number>(Math.PI * 0.0625);

  /**
   * Bloom layer for selective bloom effect (1-31)
   * Set to 0 to disable bloom for this component
   */
  public readonly bloomLayer = input<number>(1);

  /**
   * Mouse influence radius for face glow reveal (in world units)
   * Controls how far from the cursor the hexagon faces will glow
   */
  public readonly mouseInfluenceRadius = input<number>(3.0);

  /**
   * Geometry shape type
   * Controls the number of sides for the cylindrical hexagon prisms
   * - hexagon: 6 sides (default)
   * - diamond: 4 sides
   * - octagon: 8 sides
   * - square: 4 sides (aligned differently than diamond)
   */
  public readonly shape = input<'hexagon' | 'diamond' | 'octagon' | 'square'>(
    'hexagon'
  );

  /**
   * Custom geometry (advanced users - overrides shape input)
   * WARNING: Custom geometry MUST have positionLocal.z variation for edge detection to work.
   * Geometries without Z-axis variation will not show edge glow effect.
   */
  public readonly customGeometry = input<THREE.BufferGeometry | null>(null);

  /**
   * Edge color (neon glow color for hexagon edges)
   * If null, uses colorPalette with pulsing animation (default behavior)
   * If set, edges will use this static color (unless edgePulse is true)
   */
  public readonly edgeColor = input<ColorRepresentation | null>(null);

  /**
   * Whether edge color should pulse (animate over time)
   * Only applies if edgeColor is set
   * - true: edge color pulses with time-based animation
   * - false: edge color is static
   * NOTE: If edgeColor is null, this input is ignored (palette always pulses)
   */
  public readonly edgePulse = input<boolean>(true);

  /**
   * Face color when mouse is near (hover glow color)
   * This is the bright color revealed when cursor moves over hexagons
   */
  public readonly hoverColor = input<ColorRepresentation>(0xffffff);

  // Dependencies
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly objectId = inject(OBJECT_ID);
  private readonly sceneService = inject(SceneService);
  private readonly elementRef = inject(ElementRef);

  // Three.js objects
  private instancedMesh!: THREE.InstancedMesh;
  private material!: THREE.MeshStandardNodeMaterial;
  private phaseData: HexPhaseData[] = [];
  private clock = new THREE.Clock();
  private timeUniform!: THREE.UniformNode<number>;
  private mousePositionUniform!: THREE.UniformNode<THREE.Vector2>;
  private mouseInfluenceRadiusUniform!: THREE.UniformNode<number>;
  private edgeColorUniform!: THREE.UniformNode<THREE.Color>;
  private hasEdgeColorUniform!: THREE.UniformNode<number>; // 0 or 1 (boolean)
  private edgePulseUniform!: THREE.UniformNode<number>;
  private hoverColorUniform!: THREE.UniformNode<THREE.Color>;
  private baseColorUniform!: THREE.UniformNode<THREE.Color>; // ADDED: For user-controlled base face color

  // Mouse tracking
  private pointer = new THREE.Vector2();
  private worldMousePosition = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();
  private initialized = false;

  public constructor() {
    // FIXED: effect() must be in injection context (constructor), not in afterNextRender()
    effect(() => {
      const renderer = this.sceneService.renderer();
      const camera = this.sceneService.camera();

      if (renderer && camera && !this.initialized) {
        this.initialized = true;
        this.setupHoverInteraction();
      }
    });

    afterNextRender(() => {
      this.createInstancedHexagons();

      const parent = this.parent();
      if (parent) {
        parent.add(this.instancedMesh);
      }

      // Register animation loop
      const cleanup = this.renderLoop.registerUpdateCallback(() => {
        this.updateAnimation();
      });

      // Cleanup
      this.destroyRef.onDestroy(() => {
        cleanup();
        const parent = this.parent();
        if (parent && this.instancedMesh) {
          parent.remove(this.instancedMesh);
        }
        if (this.instancedMesh) {
          this.instancedMesh.geometry.dispose();
          if (this.material) {
            this.material.dispose();
          }
        }
      });
    });
  }

  /**
   * Creates geometry based on shape or customGeometry input
   * @returns BufferGeometry for instanced mesh
   */
  private createGeometry(): THREE.BufferGeometry {
    const customGeom = this.customGeometry();
    if (customGeom) {
      return customGeom;
    }

    const sidesMap: Record<string, number> = {
      hexagon: 6,
      diamond: 4,
      octagon: 8,
      square: 4,
    };

    const sides = sidesMap[this.shape()];

    const geometry = new THREE.CylinderGeometry(
      this.hexRadius(),
      this.hexRadius(),
      this.hexHeight(),
      sides
    );

    geometry.rotateX(Math.PI / 2); // Face camera (align with XY plane)
    return geometry;
  }

  private createInstancedHexagons(): void {
    const _hexRadius = this.hexRadius();
    const hexHeight = this.hexHeight();
    const circleCount = this.circleCount();
    const colors = this.colorPalette().map((c) => new THREE.Color(c));

    // Create geometry using helper method
    const geometry = this.createGeometry();

    // Calculate instance count: radial grid formula
    const instCount = ((circleCount * (circleCount + 1)) / 2) * 6 + 1;

    // IMPORTANT: Add mouse influence attribute BEFORE creating material
    // so the shader knows about it during compilation
    const mouseInfluenceArray = new Float32Array(instCount).fill(0);
    geometry.setAttribute(
      'mouseInfluence',
      new THREE.InstancedBufferAttribute(mouseInfluenceArray, 1)
    );

    // Create MeshStandardNodeMaterial with TSL nodes for WebGPU-compatible edge glow
    // This replaces the GLSL onBeforeCompile approach that doesn't work with WebGPU
    this.material = new THREE.MeshStandardNodeMaterial({
      color: this.baseColor(), // FIXED: Use user-provided base color input
      roughness: this.roughness(),
      metalness: this.metalness(),
    });

    // Parse color palette into RGB vectors
    const paletteColors = colors.map((c) => vec3(c.r, c.g, c.b));
    // Pad to 4 colors if needed
    while (paletteColors.length < 4) {
      paletteColors.push(vec3(1, 1, 1)); // Default white
    }

    // Create uniforms for animation and mouse interaction
    this.timeUniform = uniform(0);
    this.mousePositionUniform = uniform(new THREE.Vector2(999, 999)); // Start off-screen
    this.mouseInfluenceRadiusUniform = uniform(this.mouseInfluenceRadius());

    // Uniforms for enhanced color control
    // FIXED: TSL doesn't support null uniforms - use boolean flag + always-valid color
    const edgeColorInput = this.edgeColor();
    this.edgeColorUniform = uniform(
      edgeColorInput
        ? new THREE.Color(edgeColorInput)
        : new THREE.Color(0xffffff)
    );
    this.hasEdgeColorUniform = uniform(edgeColorInput ? 1.0 : 0.0); // 1.0 = use edgeColor, 0.0 = use palette
    this.edgePulseUniform = uniform(this.edgePulse() ? 1.0 : 0.0);
    this.hoverColorUniform = uniform(new THREE.Color(this.hoverColor()));
    this.baseColorUniform = uniform(new THREE.Color(this.baseColor())); // ADDED: User-controlled base color

    const time = this.timeUniform;
    const heightScale = float(hexHeight / 0.1);

    // Mouse influence per instance (calculated in CPU each frame)
    const mouseInfluence = attribute('mouseInfluence');

    // TSL Color Modification Function
    // Replaces diffuse color at edges with bright neon colors
    // Supports both palette-based pulsing and static edge colors
    const edgeColorNode = Fn(() => {
      // Time-based pulsing (0 to 1) - varies per instance via instanceIndex
      const phaseOffset = fract(mul(float(instanceIndex), float(0.618))); // Golden ratio for variety
      const t = mul(
        sin(mul(time, float(3.14159)).add(mul(phaseOffset, float(6.28)))),
        float(0.5)
      ).add(float(0.5));

      // Edge detection thresholds scaled by hexHeight
      const edgeStart = mul(float(0.015), heightScale);
      const edgeEnd = mul(
        float(0.02).add(mul(float(1.0).sub(t), float(0.03))),
        heightScale
      );

      // edgeFactor is LOW (0) at edges, HIGH (1) away from edges (faces)
      const edgeFactor = smoothstep(edgeStart, edgeEnd, abs(positionLocal.z));

      // Base material color - FIXED: Use user-provided baseColor input instead of hardcoded value
      const baseColor = vec3(
        this.baseColorUniform.x,
        this.baseColorUniform.y,
        this.baseColorUniform.z
      );

      // === EDGE COLOR LOGIC (NEW) ===
      // Convert edgeColor uniform to vec3
      const staticEdgeColor = vec3(
        this.edgeColorUniform.x,
        this.edgeColorUniform.y,
        this.edgeColorUniform.z
      );

      // Palette-based color selection (existing logic)
      const colorIdx = fract(mul(float(instanceIndex), float(0.25))); // 0, 0.25, 0.5, 0.75
      const color01 = mix(
        paletteColors[0],
        paletteColors[1],
        smoothstep(float(0.0), float(0.25), colorIdx)
      );
      const color23 = mix(
        paletteColors[2],
        paletteColors[3],
        smoothstep(float(0.5), float(0.75), colorIdx)
      );
      const selectedPaletteColor = mix(
        color01,
        color23,
        smoothstep(float(0.25), float(0.5), colorIdx)
      );

      // Apply pulse to palette color (controlled by edgePulseUniform)
      // If edgePulse=false, blend factor is 0 (shows baseColor, not bright palette)
      const paletteWithPulse = mix(
        baseColor,
        selectedPaletteColor,
        mul(t, this.edgePulseUniform)
      );

      // Choose edge color: static OR pulsing palette
      // Use mix() with hasStaticEdgeColor as blend factor (TSL doesn't support ternary)
      const staticEdgeWithPulse = mix(
        baseColor,
        staticEdgeColor,
        this.edgePulseUniform
      ); // Static edge (pulsed if edgePulse=true)
      const edgeColor = mix(
        paletteWithPulse, // When hasStaticEdgeColor=0 (false)
        staticEdgeWithPulse, // When hasStaticEdgeColor=1 (true)
        this.hasEdgeColorUniform
      );

      // === HOVER COLOR LOGIC (NEW) ===
      const hoverColor = vec3(
        this.hoverColorUniform.x,
        this.hoverColorUniform.y,
        this.hoverColorUniform.z
      );

      // Face color: dark base or bright hover based on mouse proximity
      const faceColor = mix(baseColor, hoverColor, mouseInfluence);

      // Final color: mix edge and face based on edgeFactor
      // edgeFactor=0 (edges) → show edgeColor
      // edgeFactor=1 (faces) → show faceColor
      return mix(edgeColor, faceColor, edgeFactor);
    })();

    // Apply color modification to diffuse color
    this.material.colorNode = edgeColorNode;

    // Create instanced mesh
    this.instancedMesh = new THREE.InstancedMesh(
      geometry,
      this.material,
      instCount
    );
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;

    // Enable bloom layer for selective bloom effect
    const bloomLayer = this.bloomLayer();
    if (bloomLayer > 0) {
      this.instancedMesh.layers.enable(bloomLayer);
    }
    this.instancedMesh.name = this.objectId;

    // Generate radial hexagonal grid
    const dummy = new THREE.Object3D();
    const unit = Math.sqrt(3) * 0.5 * 1.025;
    const angle = Math.PI / 3;
    const axis = new THREE.Vector3(0, 0, 1);
    const axisVector = new THREE.Vector3(0, -unit, 0);
    const sideVector = new THREE.Vector3(0, unit, 0).applyAxisAngle(
      axis,
      -angle
    );
    const positionVec = new THREE.Vector3();
    const colorPhases: number[] = [];

    let counter = 0;

    // Create rings in 6 segments (hexagonal symmetry)
    for (let seg = 0; seg < 6; seg++) {
      for (let ax = 1; ax <= circleCount; ax++) {
        for (let sd = 0; sd < ax; sd++) {
          positionVec
            .copy(axisVector)
            .multiplyScalar(ax)
            .addScaledVector(sideVector, sd)
            .applyAxisAngle(axis, angle * seg + Math.PI / 6);

          this.setHexData(dummy, positionVec, counter, colors, colorPhases);
          counter++;
        }
      }
    }

    // Central hexagon
    this.setHexData(dummy, new THREE.Vector3(), counter, colors, colorPhases);

    // Set color phase attribute
    geometry.setAttribute(
      'colorPhase',
      new THREE.InstancedBufferAttribute(new Float32Array(colorPhases), 2)
    );
  }

  private setHexData(
    dummy: THREE.Object3D,
    pos: THREE.Vector3,
    idx: number,
    _colors: THREE.Color[],
    colorPhases: number[]
  ): void {
    // Set position
    dummy.position.copy(pos);
    dummy.updateMatrix();
    this.instancedMesh.setMatrixAt(idx, dummy.matrix);

    // Don't set instance color - we're using colorNode to control all colors
    // The shader will handle edge glow and mouse proximity effects

    // Color phase (animation offset and speed)
    colorPhases.push(Math.random() * Math.PI * 2, Math.random() * 0.5 + 1);

    // Store phase data for depth/rotation animation
    this.phaseData.push({
      phaseX: (Math.random() - 0.5) * Math.PI * 2,
      phaseY: (Math.random() - 0.5) * Math.PI * 2,
      phaseDepth: Math.random() * Math.PI * 2,
    });
  }

  private updateAnimation(): void {
    if (!this.instancedMesh || !this.timeUniform) return;

    const t = this.clock.getElapsedTime() * this.animationSpeed();
    this.timeUniform.value = t;

    const mat4 = new THREE.Matrix4();
    const dummy = new THREE.Object3D();
    const depthAmp = this.depthAmplitude();
    const rotAmp = this.rotationAmplitude();
    const influenceRadius = this.mouseInfluenceRadius();

    // Get mouse influence attribute
    const mouseInfluenceAttr = this.instancedMesh.geometry.getAttribute(
      'mouseInfluence'
    ) as THREE.InstancedBufferAttribute;
    const mouseInfluenceArray = mouseInfluenceAttr?.array as Float32Array;

    // Animate each hexagon instance
    let maxInfluence = 0;
    this.phaseData.forEach((ph, idx) => {
      this.instancedMesh.getMatrixAt(idx, mat4);
      mat4.decompose(dummy.position, dummy.quaternion, dummy.scale);

      // Calculate mouse proximity influence (0 = far, 1 = near)
      // Use only XY distance (ignore Z since hexagons bob up/down)
      if (mouseInfluenceArray) {
        const dx = dummy.position.x - this.worldMousePosition.x;
        const dy = dummy.position.y - this.worldMousePosition.y;
        const dist2D = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(
          0,
          1 - Math.min(1, dist2D / influenceRadius)
        );
        // Smooth falloff using smoothstep
        const smoothInfluence = influence * influence * (3 - 2 * influence);
        mouseInfluenceArray[idx] = smoothInfluence;
        if (smoothInfluence > maxInfluence) maxInfluence = smoothInfluence;
      }

      // Depth bobbing animation
      dummy.position.z = Math.sin(ph.phaseDepth + t) * depthAmp;

      // Rotation wobble
      dummy.rotation.set(
        Math.cos(ph.phaseX + t * Math.sign(ph.phaseX)) * rotAmp,
        Math.sin(ph.phaseY + t * Math.sign(ph.phaseY)) * rotAmp,
        0
      );

      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(idx, dummy.matrix);
    });

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (mouseInfluenceAttr) {
      mouseInfluenceAttr.needsUpdate = true;
    }
  }

  /**
   * Setup mouse tracking for proximity-based glow effect
   */
  private setupHoverInteraction(): void {
    const renderer = this.sceneService.renderer();
    const camera = this.sceneService.camera();

    // No need for null check - effect() ensures both are available
    const canvas = renderer!.domElement;

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycast to find world position
      this.raycaster.setFromCamera(this.pointer, camera!);

      // Create a plane at z=0 to get 3D world position
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersectionPoint = new THREE.Vector3();

      if (this.raycaster.ray.intersectPlane(plane, intersectionPoint)) {
        this.worldMousePosition.copy(intersectionPoint);
      }

      // Update mouse position uniform for shader
      this.mousePositionUniform.value.set(
        this.worldMousePosition.x,
        this.worldMousePosition.y
      );
    };

    const onPointerLeave = () => {
      // Move mouse far away when pointer leaves canvas
      this.worldMousePosition.set(999, 999, 999);
      this.mousePositionUniform.value.set(999, 999);
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    // Cleanup listeners on destroy
    this.destroyRef.onDestroy(() => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    });
  }
}
