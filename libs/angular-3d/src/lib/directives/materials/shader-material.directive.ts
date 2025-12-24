/**
 * ShaderMaterialDirective - Custom GLSL shaders for advanced visual effects
 *
 * Creates THREE.ShaderMaterial with custom vertex/fragment shaders,
 * reactive uniform updates, and auto-injected common uniforms (time, resolution, mouse).
 *
 * Enables advanced effects like:
 * - Water caustics and reflections
 * - Ray marching and signed distance fields
 * - Procedural textures and noise patterns
 * - Custom lighting models
 * - Post-processing style effects on meshes
 *
 * Pattern: Signal-based reactive material creation and updates
 *
 * @example
 * ```html
 * <!-- Basic shader with time animation -->
 * <a3d-box
 *   a3dShaderMaterial
 *   [vertexShader]="basicVertexShader"
 *   [fragmentShader]="waveFragmentShader"
 *   [uniforms]="{ amplitude: 0.5, frequency: 2.0 }"
 * />
 *
 * <!-- Gradient shader with color uniforms -->
 * <a3d-sphere
 *   a3dShaderMaterial
 *   [vertexShader]="vertexShader"
 *   [fragmentShader]="gradientShader"
 *   [uniforms]="{ colorA: '#ff0000', colorB: '#0000ff' }"
 *   [transparent]="true"
 * />
 *
 * <!-- Ray marching with mouse interaction -->
 * <a3d-plane
 *   a3dShaderMaterial
 *   [vertexShader]="screenVertexShader"
 *   [fragmentShader]="rayMarchShader"
 *   [injectMouse]="true"
 *   [side]="'double'"
 * />
 * ```
 */

import { Directive, inject, effect, input, DestroyRef } from '@angular/core';
import * as THREE from 'three';
import { MATERIAL_SIGNAL } from '../../tokens/material.token';
import { SceneService } from '../../canvas/scene.service';
import { RenderLoopService } from '../../render-loop/render-loop.service';

/**
 * Uniform value types supported by the directive.
 *
 * Supported types:
 * - number: Single float value
 * - number[]: Array converted to Vector2/3/4 based on length
 * - THREE.Vector2/3/4: Direct vector values
 * - THREE.Matrix3/4: Matrix values
 * - THREE.Color: Color values
 * - THREE.Texture: Texture samplers
 * - string: Hex color strings (e.g., '#ff0000') converted to THREE.Color
 */
export type UniformValue =
  | number
  | number[]
  | THREE.Vector2
  | THREE.Vector3
  | THREE.Vector4
  | THREE.Matrix3
  | THREE.Matrix4
  | THREE.Color
  | THREE.Texture
  | string; // hex color

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
 * ShaderMaterialDirective
 *
 * Creates ShaderMaterial with custom GLSL shaders and provides it via MATERIAL_SIGNAL.
 * Supports reactive uniform updates and auto-injection of common uniforms.
 *
 * Lifecycle:
 * 1. First effect creates material when shaders are available
 * 2. Second effect updates user uniforms reactively
 * 3. Third effect updates material properties (side, blending, etc.)
 * 4. Render callback updates time/resolution uniforms each frame
 *
 * Auto-injected uniforms (when enabled):
 * - time: float - elapsed time in seconds (updated each frame)
 * - resolution: vec2 - canvas width and height in pixels
 * - mouse: vec2 - normalized mouse position (0-1)
 */
@Directive({
  selector: '[a3dShaderMaterial]',
  standalone: true,
})
export class ShaderMaterialDirective {
  private readonly materialSignal = inject(MATERIAL_SIGNAL);
  private readonly sceneService = inject(SceneService);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // =========================================================================
  // Shader Code Inputs
  // =========================================================================

  /**
   * Vertex shader GLSL code (required)
   *
   * Must include a main() function that sets gl_Position.
   * Has access to standard Three.js uniforms: modelViewMatrix, projectionMatrix, etc.
   *
   * @example
   * ```glsl
   * varying vec2 vUv;
   * uniform float time;
   *
   * void main() {
   *   vUv = uv;
   *   vec3 pos = position;
   *   pos.z += sin(pos.x * 10.0 + time) * 0.1;
   *   gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
   * }
   * ```
   */
  public readonly vertexShader = input.required<string>();

  /**
   * Fragment shader GLSL code (required)
   *
   * Must include a main() function that sets gl_FragColor (or fragColor for WebGL2).
   *
   * @example
   * ```glsl
   * varying vec2 vUv;
   * uniform vec3 color;
   * uniform float time;
   *
   * void main() {
   *   float brightness = sin(vUv.x * 10.0 + time) * 0.5 + 0.5;
   *   gl_FragColor = vec4(color * brightness, 1.0);
   * }
   * ```
   */
  public readonly fragmentShader = input.required<string>();

  // =========================================================================
  // Uniforms and Defines
  // =========================================================================

  /**
   * Custom uniform values
   *
   * Keys become uniform names in shaders. Values are converted:
   * - Hex strings ('#ff0000') -> THREE.Color
   * - 2-element arrays -> THREE.Vector2
   * - 3-element arrays -> THREE.Vector3
   * - 4-element arrays -> THREE.Vector4
   * - Other values passed through directly
   *
   * Default: {}
   */
  public readonly uniforms = input<Record<string, UniformValue>>({});

  /**
   * Preprocessor defines for shader compilation
   *
   * Used for compile-time shader variants without runtime cost.
   * Keys become #define statements in the shader.
   *
   * @example
   * { USE_FOG: '', MAX_LIGHTS: '4' }
   * Results in: #define USE_FOG and #define MAX_LIGHTS 4
   *
   * Default: {}
   */
  public readonly defines = input<Record<string, string>>({});

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

  // =========================================================================
  // Auto-Inject Uniforms
  // =========================================================================

  /**
   * Auto-inject 'time' uniform (float, seconds elapsed)
   * Updated each frame via render loop callback.
   * Default: true
   */
  public readonly injectTime = input<boolean>(true);

  /**
   * Auto-inject 'resolution' uniform (vec2, canvas size in pixels)
   * Updated when renderer size changes.
   * Default: true
   */
  public readonly injectResolution = input<boolean>(true);

  /**
   * Auto-inject 'mouse' uniform (vec2, normalized 0-1 coordinates)
   * Note: Requires external mouse tracking to update the uniform.
   * Default: false
   */
  public readonly injectMouse = input<boolean>(false);

  // =========================================================================
  // Private State
  // =========================================================================

  /** Internal reference to created material */
  private material: THREE.ShaderMaterial | null = null;

  /** Cleanup function for render loop callback */
  private cleanupRenderLoop: (() => void) | null = null;

  /** Track if material was created to avoid recreation */
  private materialCreated = false;

  /** Cached resolution vector to avoid creating new objects each frame */
  private readonly cachedResolution = new THREE.Vector2();

  public constructor() {
    // Effect 1: Create material when shaders are available
    effect(() => {
      const vs = this.vertexShader();
      const fs = this.fragmentShader();

      // Both shaders required
      if (!vs || !fs) return;

      // Only create once
      if (this.materialCreated) return;

      this.createMaterial(vs, fs);
      this.materialCreated = true;
    });

    // Effect 2: Update user uniforms reactively
    effect(() => {
      if (!this.material) return;

      const userUniforms = this.uniforms();
      this.updateUserUniforms(userUniforms);
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
      this.material.needsUpdate = true;

      this.sceneService.invalidate();
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.dispose();
    });
  }

  /**
   * Create the ShaderMaterial with initial configuration
   */
  private createMaterial(vertexShader: string, fragmentShader: string): void {
    // Build uniform objects including auto-injected ones
    const uniformObjects: Record<string, THREE.IUniform> = {};

    // Auto-inject time uniform
    if (this.injectTime()) {
      uniformObjects['time'] = { value: 0 };
    }

    // Auto-inject resolution uniform
    if (this.injectResolution()) {
      uniformObjects['resolution'] = { value: new THREE.Vector2(1, 1) };
    }

    // Auto-inject mouse uniform
    if (this.injectMouse()) {
      uniformObjects['mouse'] = { value: new THREE.Vector2(0, 0) };
    }

    // Add user-defined uniforms
    const userUniforms = this.uniforms();
    for (const [key, value] of Object.entries(userUniforms)) {
      uniformObjects[key] = { value: this.convertUniformValue(value) };
    }

    // Create the ShaderMaterial
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: uniformObjects,
      defines: this.defines(),
      transparent: this.transparent(),
      wireframe: this.wireframe(),
      depthTest: this.depthTest(),
      depthWrite: this.depthWrite(),
      side: SIDE_MAP[this.side()],
      blending: BLENDING_MAP[this.blending()],
    });

    // Set to material signal for MeshDirective consumption
    this.materialSignal.set(this.material);

    // Setup auto-updating uniforms via render loop
    this.setupAutoUniforms();
  }

  /**
   * Setup render loop callback for auto-updating uniforms (time, resolution)
   */
  private setupAutoUniforms(): void {
    if (!this.material) return;

    // Only register if we have auto-inject uniforms enabled
    const needsRenderCallback = this.injectTime() || this.injectResolution();
    if (!needsRenderCallback) return;

    // Register render callback for per-frame uniform updates
    this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback(
      (_delta, elapsed) => {
        if (!this.material) return;

        // Update time uniform
        if (this.injectTime() && this.material.uniforms['time']) {
          this.material.uniforms['time'].value = elapsed;
        }

        // Update resolution uniform
        if (this.injectResolution() && this.material.uniforms['resolution']) {
          const renderer = this.sceneService.renderer();
          if (renderer) {
            renderer.getSize(this.cachedResolution);
            const resolutionUniform = this.material.uniforms['resolution'];
            // Only update if changed to avoid unnecessary invalidations
            const currentRes = resolutionUniform.value as THREE.Vector2;
            if (
              currentRes.x !== this.cachedResolution.x ||
              currentRes.y !== this.cachedResolution.y
            ) {
              currentRes.copy(this.cachedResolution);
            }
          }
        }

        // Note: mouse uniform needs to be updated externally via uniforms input
        // or through a separate mouse tracking mechanism
      }
    );
  }

  /**
   * Convert a UniformValue to the appropriate Three.js type
   */
  private convertUniformValue(value: UniformValue): unknown {
    // Handle hex color strings
    if (typeof value === 'string' && value.startsWith('#')) {
      return new THREE.Color(value);
    }

    // Handle number arrays -> Vector2/3/4
    if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          return new THREE.Vector2(value[0], value[1]);
        case 3:
          return new THREE.Vector3(value[0], value[1], value[2]);
        case 4:
          return new THREE.Vector4(value[0], value[1], value[2], value[3]);
        default:
          // Return as-is for other array lengths (e.g., for array uniforms)
          return value;
      }
    }

    // Pass through other values (numbers, vectors, textures, etc.)
    return value;
  }

  /**
   * Update user-defined uniforms without recreating the material
   */
  private updateUserUniforms(userUniforms: Record<string, UniformValue>): void {
    if (!this.material) return;

    for (const [key, value] of Object.entries(userUniforms)) {
      const convertedValue = this.convertUniformValue(value);

      if (this.material.uniforms[key]) {
        // Update existing uniform value
        this.material.uniforms[key].value = convertedValue;
      } else {
        // Add new uniform (dynamic uniform addition)
        this.material.uniforms[key] = { value: convertedValue };
      }
    }
  }

  /**
   * Dispose of material and cleanup render callback
   */
  private dispose(): void {
    // Cleanup render loop callback
    if (this.cleanupRenderLoop) {
      this.cleanupRenderLoop();
      this.cleanupRenderLoop = null;
    }

    // Dispose material
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    this.materialCreated = false;
  }
}
