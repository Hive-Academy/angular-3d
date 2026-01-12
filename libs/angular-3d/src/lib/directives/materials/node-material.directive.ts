/**
 * NodeMaterialDirective - TSL Node-based material for WebGPU rendering
 *
 * This directive creates a THREE.NodeMaterial that accepts TSL (Three Shading Language)
 * node graphs for customizing material properties. NodeMaterial is the WebGPU-native
 * approach for custom shaders, replacing ShaderMaterial's GLSL shaders.
 *
 * TSL nodes provide a composable, type-safe way to build shader logic that works
 * across both WebGL and WebGPU renderers.
 *
 * Pattern: Signal-based reactive material creation and updates
 *
 * @example
 * ```typescript
 * import { color, uniform, sin, timerLocal, vec4 } from 'three/tsl';
 *
 * // In component:
 * colorNode = color(0xff6b6b);
 * pulsingColor = vec4(
 *   sin(timerLocal().mul(2)).mul(0.5).add(0.5),
 *   uniform(0.5),
 *   uniform(0.8),
 *   1
 * );
 * ```
 *
 * ```html
 * <a3d-box
 *   a3dNodeMaterial
 *   [colorNode]="colorNode"
 * />
 *
 * <a3d-sphere
 *   a3dNodeMaterial
 *   [colorNode]="pulsingColor"
 *   [transparent]="true"
 *   [opacityNode]="opacityNode"
 * />
 * ```
 */

import { Directive, inject, effect, input, DestroyRef } from '@angular/core';
import * as THREE from 'three/webgpu';
import type { Node as TSLNode } from 'three/webgpu';
import { MATERIAL_SIGNAL } from '../../tokens/material.token';
import { SceneService } from '../../canvas/scene.service';

/**
 * Mapping of side input values to THREE.js constants
 */
const SIDE_MAP: Record<'front' | 'back' | 'double', THREE.Side> = {
  front: THREE.FrontSide,
  back: THREE.BackSide,
  double: THREE.DoubleSide,
};

/**
 * Mapping of blending input values to THREE.js constants
 */
const BLENDING_MAP: Record<
  'normal' | 'additive' | 'subtractive' | 'multiply',
  THREE.Blending
> = {
  normal: THREE.NormalBlending,
  additive: THREE.AdditiveBlending,
  subtractive: THREE.SubtractiveBlending,
  multiply: THREE.MultiplyBlending,
};

/**
 * NodeMaterialDirective
 *
 * Creates NodeMaterial with TSL node graphs and provides it via MATERIAL_SIGNAL.
 * Supports reactive node updates for dynamic shader effects.
 *
 * Lifecycle:
 * 1. First effect creates material and assigns initial nodes
 * 2. Second effect updates nodes and material properties reactively
 *
 * Key advantages over ShaderMaterial:
 * - Works natively with WebGPU renderer
 * - Type-safe, composable shader nodes
 * - Automatic uniform management
 * - Cross-platform (WebGL fallback)
 */
@Directive({
  selector: '[a3dNodeMaterial]',
  standalone: true,
})
export class NodeMaterialDirective {
  private readonly materialSignal = inject(MATERIAL_SIGNAL);
  private readonly sceneService = inject(SceneService);
  private readonly destroyRef = inject(DestroyRef);

  // =========================================================================
  // TSL Node Inputs
  // =========================================================================

  /**
   * Color node - defines the base color of the material
   *
   * Can be a static color node or a dynamic expression.
   *
   * @example
   * ```typescript
   * import { color, vec3 } from 'three/tsl';
   * colorNode = color(0xff0000);
   * // or dynamic:
   * colorNode = vec3(sin(timerLocal()), 0.5, 0.5);
   * ```
   */
  public readonly colorNode = input<TSLNode | null>(null);

  /**
   * Position node - modifies vertex positions
   *
   * Use for vertex displacement effects, morphing, etc.
   *
   * @example
   * ```typescript
   * import { positionLocal, sin, timerLocal } from 'three/tsl';
   * positionNode = positionLocal.add(
   *   vec3(0, sin(timerLocal()).mul(0.1), 0)
   * );
   * ```
   */
  public readonly positionNode = input<TSLNode | null>(null);

  /**
   * Opacity node - controls material transparency
   *
   * Values from 0 (transparent) to 1 (opaque).
   * Requires transparent=true for values < 1.
   *
   * @example
   * ```typescript
   * import { float, sin, timerLocal } from 'three/tsl';
   * opacityNode = sin(timerLocal()).mul(0.5).add(0.5);
   * ```
   */
  public readonly opacityNode = input<TSLNode | null>(null);

  /**
   * Normal node - modifies surface normals
   *
   * Use for normal mapping, procedural bumps, etc.
   *
   * @example
   * ```typescript
   * import { normalLocal, texture } from 'three/tsl';
   * normalNode = texture(normalMap).xyz.normalize();
   * ```
   */
  public readonly normalNode = input<TSLNode | null>(null);

  /**
   * Emissive node - self-illumination color
   *
   * Makes the material glow. Works well with bloom postprocessing.
   *
   * @example
   * ```typescript
   * import { color, sin, timerLocal } from 'three/tsl';
   * emissiveNode = color(0xff0000).mul(sin(timerLocal()).mul(0.5).add(0.5));
   * ```
   */
  public readonly emissiveNode = input<TSLNode | null>(null);

  /**
   * Roughness node - surface roughness (0=smooth, 1=rough)
   *
   * Controls light scattering on the surface.
   *
   * @example
   * ```typescript
   * import { float, uv } from 'three/tsl';
   * roughnessNode = uv().x; // Gradient roughness
   * ```
   */
  public readonly roughnessNode = input<TSLNode | null>(null);

  /**
   * Metalness node - metallic property (0=dielectric, 1=metal)
   *
   * Controls material reflectivity characteristics.
   *
   * @example
   * ```typescript
   * import { float } from 'three/tsl';
   * metalnessNode = float(0.8);
   * ```
   */
  public readonly metalnessNode = input<TSLNode | null>(null);

  /**
   * Output node - final fragment output
   *
   * Use for complete custom fragment shaders. Overrides colorNode.
   *
   * @example
   * ```typescript
   * import { vec4, uv } from 'three/tsl';
   * outputNode = vec4(uv(), 0, 1);
   * ```
   */
  public readonly outputNode = input<TSLNode | null>(null);

  /**
   * Vertex node - custom vertex output
   *
   * Use for complete custom vertex transformations.
   *
   * @example
   * ```typescript
   * import { cameraProjectionMatrix, modelViewMatrix, positionLocal } from 'three/tsl';
   * vertexNode = cameraProjectionMatrix.mul(modelViewMatrix).mul(positionLocal);
   * ```
   */
  public readonly vertexNode = input<TSLNode | null>(null);

  // =========================================================================
  // Material Properties
  // =========================================================================

  /**
   * Enable alpha blending for transparent effects
   * Default: false
   */
  public readonly transparent = input<boolean>(false);

  /**
   * Render geometry as wireframe
   * Default: false
   */
  public readonly wireframe = input<boolean>(false);

  /**
   * Which side of faces to render
   * - 'front': Front faces only (default)
   * - 'back': Back faces only
   * - 'double': Both sides
   *
   * Default: 'front'
   */
  public readonly side = input<'front' | 'back' | 'double'>('front');

  /**
   * Enable depth testing (objects behind others are hidden)
   * Default: true
   */
  public readonly depthTest = input<boolean>(true);

  /**
   * Write to depth buffer
   * Default: true
   */
  public readonly depthWrite = input<boolean>(true);

  /**
   * Blending mode for combining colors
   * - 'normal': Standard alpha blending
   * - 'additive': Colors add together (good for glows)
   * - 'subtractive': Colors subtract
   * - 'multiply': Colors multiply together
   *
   * Default: 'normal'
   */
  public readonly blending = input<
    'normal' | 'additive' | 'subtractive' | 'multiply'
  >('normal');

  /**
   * Flat shading - use face normals instead of vertex normals
   * Default: false
   */
  public readonly flatShading = input<boolean>(false);

  // =========================================================================
  // Private State
  // =========================================================================

  /** Internal reference to created material */
  private material: THREE.MeshStandardNodeMaterial | null = null;

  /** Track if material was created to avoid recreation */
  private materialCreated = false;

  public constructor() {
    // Effect 1: Create material once
    effect(() => {
      // Read all node inputs to track them
      this.colorNode();
      this.positionNode();
      this.opacityNode();
      this.normalNode();
      this.emissiveNode();
      this.roughnessNode();
      this.metalnessNode();
      this.outputNode();
      this.vertexNode();

      // Only create once
      if (this.materialCreated) return;

      this.createMaterial();
      this.materialCreated = true;
    });

    // Effect 2: Update nodes reactively
    effect(() => {
      if (!this.material) return;

      // Update TSL nodes
      const colorNode = this.colorNode();
      const positionNode = this.positionNode();
      const opacityNode = this.opacityNode();
      const normalNode = this.normalNode();
      const emissiveNode = this.emissiveNode();
      const roughnessNode = this.roughnessNode();
      const metalnessNode = this.metalnessNode();
      const outputNode = this.outputNode();
      const vertexNode = this.vertexNode();

      // Assign nodes to material (null clears the node)
      if (colorNode !== null) {
        this.material.colorNode = colorNode;
      }
      if (positionNode !== null) {
        this.material.positionNode = positionNode;
      }
      if (opacityNode !== null) {
        this.material.opacityNode = opacityNode;
      }
      if (normalNode !== null) {
        this.material.normalNode = normalNode;
      }
      if (emissiveNode !== null) {
        this.material.emissiveNode = emissiveNode;
      }
      if (roughnessNode !== null) {
        this.material.roughnessNode = roughnessNode;
      }
      if (metalnessNode !== null) {
        this.material.metalnessNode = metalnessNode;
      }
      if (outputNode !== null) {
        this.material.outputNode = outputNode;
      }
      if (vertexNode !== null) {
        this.material.vertexNode = vertexNode;
      }

      this.material.needsUpdate = true;
      this.sceneService.invalidate();
    });

    // Effect 3: Update material properties reactively
    effect(() => {
      if (!this.material) return;

      this.material.transparent = this.transparent();
      this.material.wireframe = this.wireframe();
      this.material.depthTest = this.depthTest();
      this.material.depthWrite = this.depthWrite();
      this.material.side = SIDE_MAP[this.side()];
      this.material.blending = BLENDING_MAP[this.blending()];
      this.material.flatShading = this.flatShading();
      this.material.needsUpdate = true;

      this.sceneService.invalidate();
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.dispose();
    });
  }

  /**
   * Create the NodeMaterial with initial configuration
   */
  private createMaterial(): void {
    // Create MeshStandardNodeMaterial for PBR-like rendering with nodes
    // This provides a good base with roughness/metalness support
    this.material = new THREE.MeshStandardNodeMaterial();

    // Apply initial property values
    this.material.transparent = this.transparent();
    this.material.wireframe = this.wireframe();
    this.material.depthTest = this.depthTest();
    this.material.depthWrite = this.depthWrite();
    this.material.side = SIDE_MAP[this.side()];
    this.material.blending = BLENDING_MAP[this.blending()];
    this.material.flatShading = this.flatShading();

    // Set to material signal for MeshDirective consumption
    this.materialSignal.set(this.material);
  }

  /**
   * Dispose of material and cleanup
   */
  private dispose(): void {
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.materialCreated = false;
  }
}
