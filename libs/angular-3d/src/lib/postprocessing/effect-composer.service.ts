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
@Injectable()
export class EffectComposerService implements OnDestroy {
  private readonly renderLoop = inject(RenderLoopService);

  private postProcessing: THREE.PostProcessing | null = null;
  private scenePassNode: ReturnType<typeof pass> | null = null;
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

    // Initial output is just the scene pass
    this.postProcessing.outputNode = this.scenePassNode;

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
   * Bloom parameters:
   * - threshold: Luminance threshold - only bright areas above this contribute to bloom
   * - strength: Intensity of the glow effect
   * - radius: Spread of the bloom effect (0-1)
   *
   * @param config Bloom configuration (threshold, strength, radius)
   */
  public addBloom(config: BloomConfig): void {
    if (!this.postProcessing || !this.scenePassNode) {
      console.warn('[EffectComposer] Cannot add bloom before init() is called');
      return;
    }

    // Get current output node (either scene pass or last effect)
    const currentOutput = this.getCurrentOutput();

    // Create bloom effect node
    // bloom(inputNode, strength, radius, threshold)
    // Note: bloom() takes strength first, then radius, then threshold
    const bloomNode = bloom(
      currentOutput as Node,
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
    const viewZ = this.scenePassNode.getViewZNode();
    const dofNode = dof(
      currentOutput as Node,
      viewZ,
      config.focus, // Focus distance in world units
      config.aperture * 100, // Convert aperture to focal length-like value
      config.maxBlur * 100 // Scale maxBlur to bokehScale
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
   * Rebuild the output chain by chaining all effect nodes
   *
   * Output chain: scenePass → effect1 → effect2 → ... → effectN
   */
  private rebuildOutputChain(): void {
    if (!this.postProcessing) return;

    let output: Node | BloomNode | DepthOfFieldNode = this
      .scenePassNode as unknown as Node;

    // Chain all effects in insertion order
    for (const [, effectNode] of this.effectNodes) {
      output = effectNode;
    }

    // Set final output - use type assertion for Three.js internal compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.postProcessing.outputNode = output as any;
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
