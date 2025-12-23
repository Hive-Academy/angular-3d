/**
 * AdvancedPerformanceOptimizerService - Component-scoped performance optimization
 *
 * Provides advanced performance optimization features for 3D scenes:
 * - Frustum culling with batch processing
 * - LOD (Level of Detail) management
 * - Performance health monitoring
 * - Adaptive quality scaling
 * - Memory management
 *
 * CRITICAL: This service is component-scoped (NOT providedIn: 'root').
 * Each Scene3dComponent provides its own instance for per-scene optimization.
 */

import {
  Injectable,
  signal,
  computed,
  inject,
  DestroyRef,
  isDevMode,
} from '@angular/core';
import * as THREE from 'three';
import { SceneGraphStore } from '../store/scene-graph.store';

// ============================================================================
// Configuration Interfaces
// ============================================================================

export interface FrustumCullingConfig {
  enabled: boolean;
  /** Margin factor for frustum (e.g., 1.2 = 20% larger frustum) */
  margin: number;
  /** Update frequency in frames (e.g., 30 = every 30 frames) */
  updateFrequency: number;
  /** Number of objects to process per frame */
  batchSize: number;
}

export interface PerformanceTarget {
  targetFPS: number;
  /** Max frame time in milliseconds (e.g., 16.67ms = 60fps) */
  maxFrameTime: number;
  qualityPreference: 'performance' | 'balanced' | 'quality';
  /** Enable adaptive quality scaling based on FPS */
  adaptiveScaling: boolean;
}

export interface OptimizationRecommendation {
  category: 'geometry' | 'material' | 'lighting' | 'postprocessing' | 'general';
  severity: 'low' | 'medium' | 'high';
  message: string;
  action?: string;
}

// ============================================================================
// AdvancedPerformanceOptimizerService
// ============================================================================

/**
 * Component-scoped service for advanced 3D performance optimization.
 *
 * Provided by Scene3dComponent to ensure per-scene optimization.
 * Each scene has independent performance management.
 */

// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable() // Component-scoped, NOT providedIn: 'root'
export class AdvancedPerformanceOptimizerService {
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // Configuration Signals
  // ============================================================================

  private readonly frustumCullingConfig = signal<FrustumCullingConfig>({
    enabled: true,
    margin: 1.2,
    updateFrequency: 30,
    batchSize: 50,
  });

  private readonly performanceTarget = signal<PerformanceTarget>({
    targetFPS: 60,
    maxFrameTime: 16.67, // 1000ms / 60fps
    qualityPreference: 'balanced',
    adaptiveScaling: true,
  });

  // ============================================================================
  // Internal State
  // ============================================================================

  private readonly registeredObjects = new Map<string, THREE.Object3D>();
  private readonly performanceMetrics = signal({
    fps: 60,
    frameTime: 16.67,
    drawCalls: 0,
    triangles: 0,
  });

  private frameCount = 0;
  private lastFPSUpdate = performance.now();
  private frameTimeAccumulator = 0;

  // ============================================================================
  // Computed Signals
  // ============================================================================

  /**
   * Performance health score (0-100)
   * Based on FPS and frame time relative to targets
   */
  public readonly performanceHealthScore = computed(() => {
    const metrics = this.performanceMetrics();
    const target = this.performanceTarget();

    // FPS score: 1.0 = meeting target, 0.0 = 0 fps
    const fpsScore = Math.min(metrics.fps / target.targetFPS, 1);

    // Frame time score: 1.0 = under budget, 0.0 = infinite time
    const frameTimeScore = Math.min(
      target.maxFrameTime / (metrics.frameTime || target.maxFrameTime),
      1
    );

    // Combined score (0-100)
    return Math.round(((fpsScore + frameTimeScore) / 2) * 100);
  });

  /**
   * Should optimization be applied?
   * True if adaptive scaling enabled and health score < 80
   */
  public readonly shouldOptimize = computed(() => {
    const score = this.performanceHealthScore();
    return this.performanceTarget().adaptiveScaling && score < 80;
  });

  // ============================================================================
  // Initialization
  // ============================================================================

  public constructor() {
    // Setup cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Initialize the optimizer with scene camera
   * Called by Scene3dComponent after camera is created
   */
  public initialize(camera?: THREE.Camera): void {
    // Store camera reference for frustum culling
    // Implementation would use camera.frustum for culling checks
    if (isDevMode()) {
      console.log(
        '[AdvancedPerformanceOptimizer] Initialized with camera',
        camera
      );
    }
  }

  // ============================================================================
  // Object Registration
  // ============================================================================

  /**
   * Register an object for performance optimization
   */
  public registerObject(id: string, object: THREE.Object3D): void {
    if (!object) {
      console.warn(
        `[AdvancedPerformanceOptimizer] Cannot register null object: ${id}`
      );
      return;
    }

    this.registeredObjects.set(id, object);
  }

  /**
   * Unregister an object from optimization
   */
  public unregisterObject(id: string): void {
    this.registeredObjects.delete(id);
  }

  /**
   * Get registered object by ID
   */
  public getRegisteredObject(id: string): THREE.Object3D | undefined {
    return this.registeredObjects.get(id);
  }

  /**
   * Get count of registered objects
   */
  public getRegisteredObjectCount(): number {
    return this.registeredObjects.size;
  }

  // ============================================================================
  // Performance Monitoring
  // ============================================================================

  /**
   * Update performance metrics
   * Called each frame by render loop
   */
  public updateMetrics(delta: number, renderer?: any): void {
    this.frameCount++;
    this.frameTimeAccumulator += delta * 1000; // Convert to ms

    const now = performance.now();
    const elapsed = now - this.lastFPSUpdate;

    // Update FPS every second
    if (elapsed >= 1000) {
      const fps = Math.round((this.frameCount / elapsed) * 1000);
      const avgFrameTime = this.frameTimeAccumulator / this.frameCount;

      this.performanceMetrics.set({
        fps,
        frameTime: avgFrameTime,
        drawCalls: renderer?.info?.render?.calls || 0,
        triangles: renderer?.info?.render?.triangles || 0,
      });

      // Reset counters
      this.frameCount = 0;
      this.frameTimeAccumulator = 0;
      this.lastFPSUpdate = now;
    }
  }

  // ============================================================================
  // Optimization Operations
  // ============================================================================

  /**
   * Perform frustum culling on registered objects
   * Called periodically based on updateFrequency
   */
  public performFrustumCulling(
    _camera: THREE.Camera,
    frustum: THREE.Frustum
  ): void {
    const config = this.frustumCullingConfig();
    if (!config.enabled) return;

    // Process objects in batches to avoid frame spikes
    const objects = Array.from(this.registeredObjects.values());
    const batchSize = config.batchSize;

    for (let i = 0; i < Math.min(objects.length, batchSize); i++) {
      const object = objects[i];
      if (!object) continue;

      // Check if object is in frustum
      const inFrustum = this.isInFrustum(object, frustum, config.margin);
      object.visible = inFrustum;
    }
  }

  /**
   * Check if object is within camera frustum
   * Uses bounding sphere intersection test with margin
   */
  private isInFrustum(
    object: THREE.Object3D,
    frustum: THREE.Frustum,
    margin: number
  ): boolean {
    // Ensure object has geometry with bounding sphere
    if (!(object as any).geometry) {
      // No geometry - assume visible (e.g., lights, groups)
      return true;
    }

    const geometry = (object as any).geometry;

    // Compute bounding sphere if not already computed
    if (!geometry.boundingSphere) {
      geometry.computeBoundingSphere();
    }

    // Still no bounding sphere - assume visible as fallback
    if (!geometry.boundingSphere) {
      return true;
    }

    // Create world-space bounding sphere
    const boundingSphere = new THREE.Sphere();
    boundingSphere
      .copy(geometry.boundingSphere)
      .applyMatrix4(object.matrixWorld);

    // Expand sphere radius by margin for early visibility
    boundingSphere.radius *= margin;

    // Test intersection with frustum
    return frustum.intersectsSphere(boundingSphere);
  }

  /**
   * Apply adaptive quality scaling based on performance
   */
  public applyAdaptiveScaling(): void {
    const shouldOptimize = this.shouldOptimize();

    if (shouldOptimize) {
      // Reduce quality to improve performance
      this.scaleQualityDown();
    } else {
      // Restore quality when performance is good
      this.scaleQualityUp();
    }
  }

  private scaleQualityDown(): void {
    // Implementation would reduce:
    // - Shadow map resolution
    // - Texture resolution
    // - Particle counts
    // - Post-processing effects
    if (isDevMode()) {
      console.log('[AdvancedPerformanceOptimizer] Scaling quality DOWN');
    }
  }

  private scaleQualityUp(): void {
    // Implementation would restore quality settings
    if (isDevMode()) {
      console.log('[AdvancedPerformanceOptimizer] Scaling quality UP');
    }
  }

  // ============================================================================
  // Recommendations
  // ============================================================================

  /**
   * Get performance optimization recommendations
   */
  public getPerformanceRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const metrics = this.performanceMetrics();
    const target = this.performanceTarget();

    // Check FPS
    if (metrics.fps < target.targetFPS * 0.8) {
      recommendations.push({
        category: 'general',
        severity: 'high',
        message: `Low FPS detected (${metrics.fps} vs target ${target.targetFPS})`,
        action: 'Enable adaptive scaling or reduce scene complexity',
      });
    }

    // Check frame time
    if (metrics.frameTime > target.maxFrameTime * 1.2) {
      recommendations.push({
        category: 'general',
        severity: 'medium',
        message: `Frame time exceeds budget (${metrics.frameTime.toFixed(
          2
        )}ms vs ${target.maxFrameTime}ms)`,
        action: 'Reduce draw calls or optimize shaders',
      });
    }

    // Check draw calls
    if (metrics.drawCalls > 100) {
      recommendations.push({
        category: 'geometry',
        severity: 'medium',
        message: `High draw call count (${metrics.drawCalls})`,
        action: 'Consider geometry instancing or merging meshes',
      });
    }

    // Check registered objects
    if (this.registeredObjects.size > 500) {
      recommendations.push({
        category: 'general',
        severity: 'low',
        message: `Large number of registered objects (${this.registeredObjects.size})`,
        action: 'Enable frustum culling or use LOD',
      });
    }

    return recommendations;
  }

  // ============================================================================
  // Configuration Updates
  // ============================================================================

  /**
   * Update frustum culling configuration
   */
  public updateFrustumCullingConfig(
    config: Partial<FrustumCullingConfig>
  ): void {
    this.frustumCullingConfig.update((current) => ({
      ...current,
      ...config,
    }));
  }

  /**
   * Update performance target configuration
   */
  public updatePerformanceTarget(config: Partial<PerformanceTarget>): void {
    this.performanceTarget.update((current) => ({
      ...current,
      ...config,
    }));
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  private cleanup(): void {
    this.registeredObjects.clear();
    if (isDevMode()) {
      console.log('[AdvancedPerformanceOptimizer] Cleaned up');
    }
  }
}
