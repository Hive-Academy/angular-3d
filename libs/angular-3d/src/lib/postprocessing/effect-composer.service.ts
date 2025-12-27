/**
 * Effect Composer Service - Post-processing pipeline manager
 *
 * Manages the Three.js EffectComposer and render passes.
 * Allows switching between standard render and post-processing render.
 *
 * Uses three-stdlib EffectComposer with WebGPU renderer. The three-stdlib passes
 * (UnrealBloomPass, BokehPass, SSAOPass, ShaderPass) work with WebGPURenderer
 * through compatibility layer. For native WebGPU post-processing with TSL nodes,
 * consider THREE.PostProcessing when it stabilizes.
 */

import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import * as THREE from 'three/webgpu';
import { EffectComposer, RenderPass, Pass, ShaderPass } from 'three-stdlib';
import { RenderLoopService } from '../render-loop/render-loop.service';

/**
 * Flip shader to correct Y-axis inversion when using WebGPURenderer
 * with WebGL fallback and three-stdlib EffectComposer.
 *
 * WebGPU and WebGL have different coordinate systems for render targets.
 * This shader flips the image vertically to correct the inversion.
 */
const FlipShader = {
  uniforms: {
    tDiffuse: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      // Flip Y coordinate
      vUv.y = 1.0 - vUv.y;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      gl_FragColor = texture2D(tDiffuse, vUv);
    }
  `,
};

/**
 * Service to manage post-processing effects.
 *
 * Wraps `three-stdlib` EffectComposer.
 * Replaces the default `RenderLoopService` render function with `composer.render()`.
 *
 * CRITICAL: Component-scoped service (NOT singleton).
 * Provided by Scene3dComponent for per-scene post-processing isolation.
 */
@Injectable()
export class EffectComposerService implements OnDestroy {
  private readonly renderLoop = inject(RenderLoopService);

  private composer: EffectComposer | null = null;
  private renderPass: RenderPass | null = null;
  private flipPass: ShaderPass | null = null;
  private readonly passes = new Set<Pass>();

  // Stored references for default rendering
  // Note: three-stdlib EffectComposer expects WebGLRenderer, but accepts
  // WebGPURenderer through Three.js compatibility layer
  private renderer: THREE.WebGPURenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // Track if using WebGL fallback (needs Y-flip correction)
  private needsFlipCorrection = false;

  // State signals
  private readonly _isEnabled = signal<boolean>(false);
  public readonly isEnabled = this._isEnabled.asReadonly();

  // Pending enable flag for enable() called before init()
  private pendingEnable = false;

  /**
   * Initialize the effect composer with scene resources
   *
   * Note: three-stdlib EffectComposer works with WebGPURenderer through
   * Three.js compatibility layer. GLSL-based passes are automatically
   * handled by the renderer.
   */
  public init(
    renderer: THREE.WebGPURenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ): void {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // Detect if using WebGL fallback (needs Y-flip correction for render targets)
    // WebGPU and WebGL have different coordinate systems
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const backend = (renderer as any).backend;
    this.needsFlipCorrection = !backend?.isWebGPU;

    if (this.needsFlipCorrection) {
      console.log(
        '[EffectComposer] WebGL fallback detected, enabling Y-flip correction'
      );
    }

    // Cast to any for three-stdlib type compatibility
    // three-stdlib EffectComposer accepts WebGPURenderer at runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.composer = new EffectComposer(renderer as any);

    // Create default render pass
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // Add any previously added passes (if any were added before init)
    this.passes.forEach((pass) => {
      this.composer?.addPass(pass);
    });

    // Add flip correction pass at the end if using WebGL fallback
    // This corrects the Y-axis inversion caused by coordinate system differences
    if (this.needsFlipCorrection) {
      this.flipPass = new ShaderPass(FlipShader);
      this.flipPass.renderToScreen = true;
      this.composer.addPass(this.flipPass);
    }

    // If enabled, ensure render loop is using composer
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
   * Update the size of the composer
   */
  public setSize(width: number, height: number): void {
    this.composer?.setSize(width, height);
  }

  /**
   * Add a post-processing pass
   */
  public addPass(pass: Pass): void {
    this.passes.add(pass);
    this.composer?.addPass(pass);
  }

  /**
   * Remove a post-processing pass
   */
  public removePass(pass: Pass): void {
    this.passes.delete(pass);
    this.composer?.removePass(pass);
  }

  /**
   * Enable post-processing
   * If composer is not yet initialized, enable request is queued
   */
  public enable(): void {
    if (this._isEnabled()) return;
    this._isEnabled.set(true);

    if (this.composer) {
      // Composer initialized - enable immediately
      this.updateRenderLoop();
    } else {
      // Composer not yet initialized - queue enable for after init()
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
    this.passes.clear();
    // Disposal of passes is usually user responsibility or handle here if strictly owned
    // For now, we assume components dispose their own passes.
    this.composer = null;
    this.renderPass = null;
    this.flipPass = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.needsFlipCorrection = false;
  }

  private updateRenderLoop(): void {
    if (this._isEnabled() && this.composer) {
      this.renderLoop.setRenderFunction(() => {
        this.composer?.render();
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
