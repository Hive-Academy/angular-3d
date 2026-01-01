/**
 * Effect Composer Service - Post-processing pipeline manager
 *
 * Manages the native Three.js PostProcessing pipeline using TSL nodes.
 * Allows switching between standard render and post-processing render.
 *
 * Uses native THREE.PostProcessing with WebGPU renderer and TSL effect nodes.
 * TSL nodes automatically transpile to WGSL (WebGPU) or GLSL (WebGL fallback),
 * ensuring cross-backend compatibility.
 *
 * Migration from three-stdlib EffectComposer complete (TASK_2025_031 Batch 5).
 */

import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { Node } from 'three/webgpu';
import BloomNode, { bloom } from 'three/addons/tsl/display/BloomNode.js';
import DepthOfFieldNode, {
  dof,
} from 'three/addons/tsl/display/DepthOfFieldNode.js';
import { RenderLoopService } from '../render-loop/render-loop.service';

// Import local type declarations (see lib/types/three-tsl-addons.d.ts)
// These provide TypeScript support for TSL addons which don't have official types

/**
 * Configuration for bloom effect
 */
export interface BloomConfig {
  threshold: number;
  strength: number;
  radius: number;
}

/**
 * Configuration for selective bloom effect
 * Uses Three.js Layers to bloom only specific objects
 */
export interface SelectiveBloomConfig {
  layer: number;
  threshold: number;
  strength: number;
  radius: number;
}

/**
 * Configuration for depth of field effect
 */
export interface DOFConfig {
  focus: number;
  aperture: number;
  maxBlur: number;
}

/**
 * Service to manage post-processing effects using native THREE.PostProcessing.
 *
 * Wraps native `THREE.PostProcessing` with TSL effect nodes.
 * Replaces the default `RenderLoopService` render function with `postProcessing.render()`.
 *
 * CRITICAL: Component-scoped service (NOT singleton).
 * Provided by Scene3dComponent for per-scene post-processing isolation.
 *
 * TSL nodes (pass, bloom, dof) automatically handle:
 * - WebGPU: Transpile to WGSL shaders
 * - WebGL: Transpile to GLSL shaders
 * - Y-flip correction: Native PostProcessing handles coordinate systems
 */
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class EffectComposerService implements OnDestroy {
  private readonly renderLoop = inject(RenderLoopService);

  private postProcessing: THREE.PostProcessing | null = null;
  private scenePassNode: ReturnType<typeof pass> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private scenePassColor: any = null; // Cached scene color texture node
  private effectNodes: Map<string, Node | BloomNode | DepthOfFieldNode> =
    new Map();

  // Stored references for default rendering
  private renderer: THREE.WebGPURenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // State signals
  private readonly _isEnabled = signal<boolean>(false);
  public readonly isEnabled = this._isEnabled.asReadonly();

  // Pending enable flag for enable() called before init()
  private pendingEnable = false;

  // Selective bloom layer camera and config
  private bloomLayerCamera: THREE.Camera | null = null;
  private selectiveBloomConfig: SelectiveBloomConfig | null = null;

  /**
   * Initialize the PostProcessing pipeline with scene resources
   *
   * Native PostProcessing works with WebGPURenderer and TSL nodes.
   * TSL nodes automatically transpile to WGSL (WebGPU) or GLSL (WebGL fallback).
   * No Y-flip correction needed - native PostProcessing handles coordinate systems.
   */
  public init(
    renderer: THREE.WebGPURenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ): void {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // Create native PostProcessing instance
    this.postProcessing = new THREE.PostProcessing(renderer);

    // Create scene pass (replaces RenderPass from three-stdlib)
    this.scenePassNode = pass(scene, camera);

    // Cache the scene color texture node - used for additive effects
    this.scenePassColor = this.scenePassNode.getTextureNode('output');

    // Initial output is just the scene pass color
    this.postProcessing.outputNode = this.scenePassColor;

    // If enabled, ensure render loop is using PostProcessing
    if (this._isEnabled()) {
      this.updateRenderLoop();
    }

    // Apply pending enable if it was requested before init
    if (this.pendingEnable) {
      this.pendingEnable = false;
      this.updateRenderLoop();
    }
  }

  /**
   * Update the size of the PostProcessing pipeline
   */
  public setSize(width: number, height: number): void {
    // PostProcessing automatically handles size from renderer
    // No explicit setSize needed (unlike three-stdlib EffectComposer)
    void width;
    void height;
  }

  /**
   * Add bloom effect using TSL bloom node
   *
   * Bloom is an ADDITIVE effect - it adds glow on top of the scene.
   * The final output is: sceneColor + bloomEffect
   *
   * Bloom parameters:
   * - threshold: Luminance threshold - only bright areas above this contribute to bloom
   * - strength: Intensity of the glow effect
   * - radius: Spread of the bloom effect (0-1)
   *
   * @param config Bloom configuration (threshold, strength, radius)
   */
  public addBloom(config: BloomConfig): void {
    if (!this.postProcessing || !this.scenePassColor) {
      console.warn('[EffectComposer] Cannot add bloom before init() is called');
      return;
    }

    // Create bloom effect from cached scene color texture
    // bloom(inputNode, strength, radius, threshold)
    const bloomNode = bloom(
      this.scenePassColor,
      config.strength,
      config.radius,
      config.threshold
    );

    // Store effect node
    this.effectNodes.set('bloom', bloomNode);

    // Rebuild output chain to include new effect
    this.rebuildOutputChain();
  }

  /**
   * Update bloom effect parameters
   *
   * @param config Updated bloom configuration
   */
  public updateBloom(config: BloomConfig): void {
    const existingBloom = this.effectNodes.get('bloom') as BloomNode;
    if (!existingBloom) return;

    // BloomNode has uniform properties we can update directly
    if (existingBloom.strength) {
      existingBloom.strength.value = config.strength;
    }
    if (existingBloom.radius) {
      existingBloom.radius.value = config.radius;
    }
    if (existingBloom.threshold) {
      existingBloom.threshold.value = config.threshold;
    }
  }

  /**
   * Remove bloom effect
   */
  public removeBloom(): void {
    const bloomNode = this.effectNodes.get('bloom') as BloomNode;
    if (bloomNode?.dispose) {
      bloomNode.dispose();
    }
    this.effectNodes.delete('bloom');
    this.rebuildOutputChain();
  }

  /**
   * Add selective bloom effect using layer-based rendering
   *
   * Only objects on the specified Three.js layer will be bloomed.
   * Other objects in the scene will NOT be affected by bloom.
   *
   * This creates a true "neon" effect where only specific objects glow.
   *
   * @param config Selective bloom configuration (layer, threshold, strength, radius)
   */
  public addSelectiveBloom(config: SelectiveBloomConfig): void {
    if (
      !this.postProcessing ||
      !this.scenePassColor ||
      !this.camera ||
      !this.scene
    ) {
      console.warn(
        '[EffectComposer] Cannot add selective bloom before init() is called'
      );
      return;
    }

    // Store config for updates
    this.selectiveBloomConfig = config;

    // Create a camera that only sees the bloom layer
    this.bloomLayerCamera = this.camera.clone();
    this.bloomLayerCamera.layers.disableAll();
    this.bloomLayerCamera.layers.enable(config.layer);

    // Create a separate scene pass for bloom layer only
    const bloomLayerPass = pass(this.scene, this.bloomLayerCamera);
    const bloomLayerColor = bloomLayerPass.getTextureNode('output');

    // Apply bloom to the layer-only render
    const selectiveBloomNode = bloom(
      bloomLayerColor,
      config.strength,
      config.radius,
      config.threshold
    );

    // Store effect node
    this.effectNodes.set('selectiveBloom', selectiveBloomNode);

    // Rebuild output chain to include new effect
    this.rebuildOutputChain();
  }

  /**
   * Update selective bloom effect parameters
   *
   * @param config Updated selective bloom configuration
   */
  public updateSelectiveBloom(config: SelectiveBloomConfig): void {
    const existingBloom = this.effectNodes.get('selectiveBloom') as BloomNode;
    if (!existingBloom) return;

    // Update bloom parameters
    if (existingBloom.strength) {
      existingBloom.strength.value = config.strength;
    }
    if (existingBloom.radius) {
      existingBloom.radius.value = config.radius;
    }
    if (existingBloom.threshold) {
      existingBloom.threshold.value = config.threshold;
    }

    // If layer changed, need to recreate
    if (
      this.selectiveBloomConfig &&
      config.layer !== this.selectiveBloomConfig.layer
    ) {
      this.removeSelectiveBloom();
      this.addSelectiveBloom(config);
    }

    this.selectiveBloomConfig = config;
  }

  /**
   * Remove selective bloom effect
   */
  public removeSelectiveBloom(): void {
    const bloomNode = this.effectNodes.get('selectiveBloom') as BloomNode;
    if (bloomNode?.dispose) {
      bloomNode.dispose();
    }
    this.effectNodes.delete('selectiveBloom');
    this.bloomLayerCamera = null;
    this.selectiveBloomConfig = null;
    this.rebuildOutputChain();
  }

  /**
   * Add depth of field effect using TSL dof node
   *
   * DOF requires access to depth buffer from scene pass.
   * Parameters:
   * - focus: Focus distance in world units
   * - aperture: Controls DOF range (smaller = wider focus area)
   * - maxBlur: Maximum blur intensity
   *
   * @param config DOF configuration (focus, aperture, maxBlur)
   */
  public addDepthOfField(config: DOFConfig): void {
    if (!this.postProcessing || !this.scenePassNode) {
      console.warn('[EffectComposer] Cannot add DOF before init() is called');
      return;
    }

    // Get current output node
    const currentOutput = this.getCurrentOutput();

    // Get depth buffer from scene pass for DOF calculations
    // dof(textureNode, viewZNode, focusDistance, focalLength, bokehScale)
    //
    // TSL DOF parameters (different from old BokehPass):
    // - focusDistance: Distance in world units where objects are in sharp focus
    // - focalLength: Range of sharpness in world units (larger = more in focus)
    // - bokehScale: Intensity of the blur effect (0-1 typically, larger = more blur)
    const viewZ = this.scenePassNode.getViewZNode();

    // Convert old BokehPass semantics to TSL DOF:
    // - focus stays the same (world units)
    // - aperture → inversely related to focal length (smaller aperture = larger focus range)
    // - maxBlur → directly maps to bokehScale (but needs much smaller values)
    const focusDistance = config.focus;
    const focalLength = 1.0 / Math.max(config.aperture, 0.001); // Invert aperture
    const bokehScale = config.maxBlur * 10; // Gentle scaling for blur intensity

    const dofNode = dof(
      currentOutput as Node,
      viewZ,
      focusDistance,
      focalLength,
      bokehScale
    );

    // Store effect node
    this.effectNodes.set('dof', dofNode);

    // Rebuild output chain
    this.rebuildOutputChain();
  }

  /**
   * Update DOF effect parameters
   *
   * @param config Updated DOF configuration
   */
  public updateDepthOfField(config: DOFConfig): void {
    const existingDof = this.effectNodes.get('dof') as DepthOfFieldNode;
    if (!existingDof) return;

    // For DOF, we need to recreate since parameters are set at construction
    // Remove and re-add with new config
    this.removeDepthOfField();
    this.addDepthOfField(config);
  }

  /**
   * Remove depth of field effect
   */
  public removeDepthOfField(): void {
    const dofNode = this.effectNodes.get('dof') as DepthOfFieldNode;
    if (dofNode?.dispose) {
      dofNode.dispose();
    }
    this.effectNodes.delete('dof');
    this.rebuildOutputChain();
  }

  /**
   * Add a custom TSL effect node
   *
   * @param name Unique identifier for the effect
   * @param effectNode TSL effect node
   */
  public addEffect(name: string, effectNode: Node): void {
    this.effectNodes.set(name, effectNode);
    this.rebuildOutputChain();
  }

  /**
   * Remove a custom effect by name
   *
   * @param name Effect identifier
   */
  public removeEffect(name: string): void {
    this.effectNodes.delete(name);
    this.rebuildOutputChain();
  }

  /**
   * Enable post-processing
   * If PostProcessing is not yet initialized, enable request is queued
   */
  public enable(): void {
    if (this._isEnabled()) return;
    this._isEnabled.set(true);

    if (this.postProcessing) {
      // PostProcessing initialized - enable immediately
      this.updateRenderLoop();
    } else {
      // PostProcessing not yet initialized - queue enable for after init()
      this.pendingEnable = true;
      console.warn(
        '[EffectComposer] Enable requested before init, will activate after init'
      );
    }
  }

  /**
   * Disable post-processing
   */
  public disable(): void {
    if (!this._isEnabled()) return;
    this._isEnabled.set(false);
    this.updateRenderLoop();
  }

  /**
   * Cleanup on destroy
   */
  public ngOnDestroy(): void {
    this.disable();

    // Dispose all effect nodes
    for (const [, effectNode] of this.effectNodes) {
      if ('dispose' in effectNode && typeof effectNode.dispose === 'function') {
        effectNode.dispose();
      }
    }

    this.effectNodes.clear();
    this.postProcessing = null;
    this.scenePassNode = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }

  /**
   * Get the current output node (last effect in chain or scene pass)
   */
  private getCurrentOutput(): Node | BloomNode | DepthOfFieldNode {
    if (this.effectNodes.size === 0) {
      return this.scenePassNode as unknown as Node;
    }

    // Return last effect node in insertion order
    const effectArray = Array.from(this.effectNodes.values());
    return effectArray[effectArray.length - 1];
  }

  /**
   * Rebuild the output chain by compositing all effect nodes
   *
   * For additive effects like bloom: output = sceneColor + bloomEffect
   * For replacement effects like DOF: output = dofEffect
   * For custom effects: output = mix/blend with current output
   *
   * Chain order:
   * 1. Scene color (base)
   * 2. Bloom effects (additive)
   * 3. Custom effects (color manipulation - additive blend)
   * 4. DOF (replacement - applied last as it processes the whole image)
   */
  private rebuildOutputChain(): void {
    if (!this.postProcessing || !this.scenePassColor) return;

    // Start with cached scene color as base
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let output: any = this.scenePassColor;

    // Reserved effect names that are handled specially
    const reservedEffects = new Set(['bloom', 'selectiveBloom', 'dof']);

    // Add bloom effect (additive compositing)
    const bloomNode = this.effectNodes.get('bloom') as BloomNode;
    if (bloomNode) {
      // Bloom is ADDED to scene color, not replaced
      output = output.add(bloomNode);
    }

    // Add selective bloom (additive - only blooms objects on the specified layer)
    const selectiveBloomNode = this.effectNodes.get(
      'selectiveBloom'
    ) as BloomNode;
    if (selectiveBloomNode) {
      // Selective bloom is added on top
      output = output.add(selectiveBloomNode);
    }

    // Process custom effects (color grading, chromatic aberration, film grain, etc.)
    // Custom effects are applied AFTER bloom but BEFORE DOF
    // They are blended with the current output (typically as color modifications)
    for (const [name, effectNode] of this.effectNodes) {
      if (reservedEffects.has(name)) {
        continue; // Skip reserved effects - already handled above
      }

      // Custom effects are TSL color transformation nodes
      // They return a color value that should blend with the current output
      // Using mix for subtle blending: output = mix(output, effectOutput, 0.5)
      // Or multiply for color grading: output = output * effectOutput
      // For most custom effects, we use additive blend (output + effectOffset)
      // where effectOffset represents the color adjustment
      output = output.add(effectNode);
    }

    // DOF replaces the output (it processes the entire image)
    const dofNode = this.effectNodes.get('dof') as DepthOfFieldNode;
    if (dofNode) {
      // DOF should take the current output (scene + bloom) as input
      // But since DOF is created with scenePassColor, we need to recreate logic
      // For now, if DOF exists, it becomes the output
      output = dofNode;
    }

    // Set final output
    this.postProcessing.outputNode = output;
  }

  /**
   * Update render loop to use PostProcessing or default rendering
   */
  private updateRenderLoop(): void {
    if (this._isEnabled() && this.postProcessing) {
      this.renderLoop.setRenderFunction(() => {
        this.postProcessing?.render();
      });
    } else if (this.renderer && this.scene && this.camera) {
      // Restore default render
      this.renderLoop.setRenderFunction(() => {
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      });
    }
  }
}
