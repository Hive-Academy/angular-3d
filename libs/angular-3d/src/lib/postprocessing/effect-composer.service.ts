/**
 * Effect Composer Service - Post-processing pipeline manager
 *
 * Manages the Three.js EffectComposer and render passes.
 * Allows switching between standard render and post-processing render.
 */

import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import * as THREE from 'three';
import { EffectComposer, RenderPass, Pass } from 'three-stdlib';
import { RenderLoopService } from '../render-loop/render-loop.service';

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
  private readonly passes = new Set<Pass>();

  // Stored references for default rendering
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // State signals
  private readonly _isEnabled = signal<boolean>(false);
  public readonly isEnabled = this._isEnabled.asReadonly();

  // Pending enable flag for enable() called before init()
  private pendingEnable = false;

  /**
   * Initialize the effect composer with scene resources
   */
  public init(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ): void {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.composer = new EffectComposer(renderer);

    // Create default render pass
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // Add any previously added passes (if any were added before init)
    this.passes.forEach((pass) => {
      this.composer?.addPass(pass);
    });

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
    this.renderer = null;
    this.scene = null;
    this.camera = null;
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
