/**
 * Angular 3D Application State Store
 *
 * Centralized signal-based state management for Angular 3D applications.
 * Provides reactive state for scenes, cameras, lights, materials, and animations.
 *
 * @example
 * ```typescript
 * @Component({ ... })
 * export class MyComponent {
 *   private store = inject(Angular3DStateStore);
 *
 *   constructor() {
 *     // Read state
 *     const camera = this.store.state().camera;
 *
 *     // Update state
 *     this.store.updateCamera({ position: [0, 5, 10] });
 *   }
 * }
 * ```
 */

import { Injectable, signal, computed } from '@angular/core';

// ============================================================================
// State Interfaces
// ============================================================================

/**
 * State for a scene object (mesh, group, light, camera)
 */
export interface SceneObjectState {
  readonly id: string;
  readonly name: string;
  readonly type: 'mesh' | 'group' | 'light' | 'camera';
  readonly visible: boolean;
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
  readonly parent?: string;
  readonly children: readonly string[];
  readonly userData: Record<string, unknown>;
}

/**
 * State for a Three.js scene
 */
export interface SceneState {
  readonly id: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly backgroundColor: number;
  readonly fog?: {
    readonly type: 'linear' | 'exponential';
    readonly color: number;
    readonly near: number;
    readonly far: number;
    readonly density?: number;
  };
  readonly environment?: string;
  readonly objects: Record<string, SceneObjectState>;
}

/**
 * State for camera configuration
 */
export interface CameraState {
  readonly type: 'perspective' | 'orthographic';
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly fov?: number;
  readonly zoom: number;
  readonly near: number;
  readonly far: number;
  readonly isControlsEnabled: boolean;
}

/**
 * State for a light source
 */
export interface LightState {
  readonly id: string;
  readonly type: 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere';
  readonly color: number;
  readonly intensity: number;
  readonly position?: readonly [number, number, number];
  readonly target?: readonly [number, number, number];
  readonly castShadow: boolean;
}

/**
 * State for a material
 */
export interface MaterialState {
  readonly id: string;
  readonly type: 'basic' | 'standard' | 'physical' | 'lambert' | 'phong';
  readonly color: number;
  readonly opacity: number;
  readonly transparent: boolean;
  readonly wireframe: boolean;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly emissive?: number;
  readonly map?: string;
}

/**
 * State for an animation
 */
export interface AnimationState {
  readonly id: string;
  readonly target: string;
  readonly isPlaying: boolean;
  readonly duration: number;
  readonly currentTime: number;
  readonly loop: boolean;
  readonly timeScale: number;
}

/**
 * Performance metrics state
 */
export interface PerformanceState {
  readonly fps: number;
  readonly frameTime: number;
  readonly memoryUsage: number;
  readonly drawCalls: number;
  readonly triangles: number;
  readonly geometries: number;
  readonly textures: number;
}

/**
 * Complete application state
 */
export interface Angular3DAppState {
  readonly scenes: Record<string, SceneState>;
  readonly activeSceneId: string | null;
  readonly camera: CameraState;
  readonly lights: Record<string, LightState>;
  readonly materials: Record<string, MaterialState>;
  readonly animations: Record<string, AnimationState>;
  readonly performance: PerformanceState;
  readonly isDebugMode: boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: Angular3DAppState = {
  scenes: {},
  activeSceneId: null,
  camera: {
    type: 'perspective',
    position: [0, 0, 5],
    target: [0, 0, 0],
    fov: 75,
    zoom: 1,
    near: 0.1,
    far: 1000,
    isControlsEnabled: true,
  },
  lights: {},
  materials: {},
  animations: {},
  performance: {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
  },
  isDebugMode: false,
};

// ============================================================================
// State Store Service
// ============================================================================

/**
 * Centralized state management for Angular 3D applications.
 *
 * Provides signal-based reactive state for:
 * - Multiple scenes with objects
 * - Camera configuration
 * - Lights and materials
 * - Animation tracking
 * - Performance metrics
 */
@Injectable({
  providedIn: 'root',
})
export class Angular3DStateStore {
  // Core state signal
  private readonly _state = signal<Angular3DAppState>(initialState);
  private readonly _lastUpdateTime = signal<number>(Date.now());

  // Performance monitoring
  private performanceFrameId: number | null = null;

  // ============================================================================
  // Public Readonly Accessors
  // ============================================================================

  /** Complete application state (readonly) */
  public readonly state = this._state.asReadonly();

  /** Timestamp of last state update */
  public readonly lastUpdateTime = this._lastUpdateTime.asReadonly();

  // ============================================================================
  // Computed Selectors
  // ============================================================================

  /** Currently active scene or null */
  public readonly activeScene = computed(() => {
    const state = this._state();
    return state.activeSceneId
      ? state.scenes[state.activeSceneId] ?? null
      : null;
  });

  /** Objects in the active scene */
  public readonly sceneObjects = computed(() => {
    const scene = this.activeScene();
    return scene ? Object.values(scene.objects) : [];
  });

  /** All registered lights */
  public readonly activeLights = computed(() => {
    return Object.values(this._state().lights);
  });

  /** All registered materials */
  public readonly activeMaterials = computed(() => {
    return Object.values(this._state().materials);
  });

  /** Animations that are currently playing */
  public readonly playingAnimations = computed(() => {
    return Object.values(this._state().animations).filter(
      (anim) => anim.isPlaying
    );
  });

  /** Debug mode status */
  public readonly isDebugMode = computed(() => this._state().isDebugMode);

  /** Performance metrics */
  public readonly performance = computed(() => this._state().performance);

  /** Performance health status */
  public readonly performanceStatus = computed(() => {
    const perf = this._state().performance;
    return {
      ...perf,
      isHealthy: perf.fps >= 30 && perf.frameTime < 33.33,
    };
  });

  // ============================================================================
  // Scene Management
  // ============================================================================

  /**
   * Create a new scene and add it to state
   */
  public createScene(
    id: string,
    name: string,
    config?: Partial<SceneState>
  ): SceneState {
    const sceneState: SceneState = {
      id,
      name,
      isActive: false,
      backgroundColor: 0x000000,
      objects: {},
      ...config,
    };

    this._state.update((state) => ({
      ...state,
      scenes: {
        ...state.scenes,
        [id]: sceneState,
      },
    }));

    this.notifyStateChange();
    return sceneState;
  }

  /**
   * Update an existing scene
   */
  public updateScene(
    sceneId: string,
    updates: Partial<Omit<SceneState, 'id'>>
  ): void {
    this._state.update((state) => {
      if (!state.scenes[sceneId]) return state;

      return {
        ...state,
        scenes: {
          ...state.scenes,
          [sceneId]: {
            ...state.scenes[sceneId],
            ...updates,
            id: sceneId,
          },
        },
      };
    });
    this.notifyStateChange();
  }

  /**
   * Remove a scene from state
   */
  public removeScene(sceneId: string): void {
    this._state.update((state) => {
      const { [sceneId]: _removed, ...remainingScenes } = state.scenes;
      return {
        ...state,
        scenes: remainingScenes,
        activeSceneId:
          state.activeSceneId === sceneId ? null : state.activeSceneId,
      };
    });
    this.notifyStateChange();
  }

  /**
   * Set the active scene
   */
  public setActiveScene(sceneId: string | null): void {
    this._state.update((state) => ({
      ...state,
      activeSceneId: sceneId,
    }));
    this.notifyStateChange();
  }

  // ============================================================================
  // Scene Object Management
  // ============================================================================

  /**
   * Add an object to a scene
   */
  public addSceneObject(sceneId: string, objectState: SceneObjectState): void {
    this._state.update((state) => {
      if (!state.scenes[sceneId]) return state;

      return {
        ...state,
        scenes: {
          ...state.scenes,
          [sceneId]: {
            ...state.scenes[sceneId],
            objects: {
              ...state.scenes[sceneId].objects,
              [objectState.id]: objectState,
            },
          },
        },
      };
    });
    this.notifyStateChange();
  }

  /**
   * Update a scene object
   */
  public updateSceneObject(
    sceneId: string,
    objectId: string,
    updates: Partial<Omit<SceneObjectState, 'id'>>
  ): void {
    this._state.update((state) => {
      const scene = state.scenes[sceneId];
      if (!scene || !scene.objects[objectId]) return state;

      return {
        ...state,
        scenes: {
          ...state.scenes,
          [sceneId]: {
            ...scene,
            objects: {
              ...scene.objects,
              [objectId]: {
                ...scene.objects[objectId],
                ...updates,
                id: objectId,
              },
            },
          },
        },
      };
    });
    this.notifyStateChange();
  }

  /**
   * Remove an object from a scene
   */
  public removeSceneObject(sceneId: string, objectId: string): void {
    this._state.update((state) => {
      const scene = state.scenes[sceneId];
      if (!scene || !scene.objects[objectId]) return state;

      const { [objectId]: _removed, ...remainingObjects } = scene.objects;

      return {
        ...state,
        scenes: {
          ...state.scenes,
          [sceneId]: {
            ...scene,
            objects: remainingObjects,
          },
        },
      };
    });
    this.notifyStateChange();
  }

  // ============================================================================
  // Camera Management
  // ============================================================================

  /**
   * Update camera configuration
   */
  public updateCamera(updates: Partial<CameraState>): void {
    this._state.update((state) => ({
      ...state,
      camera: { ...state.camera, ...updates },
    }));
    this.notifyStateChange();
  }

  // ============================================================================
  // Light Management
  // ============================================================================

  /**
   * Add a light to state
   */
  public addLight(lightState: LightState): void {
    this._state.update((state) => ({
      ...state,
      lights: {
        ...state.lights,
        [lightState.id]: lightState,
      },
    }));
    this.notifyStateChange();
  }

  /**
   * Update a light
   */
  public updateLight(
    lightId: string,
    updates: Partial<Omit<LightState, 'id'>>
  ): void {
    this._state.update((state) => {
      if (!state.lights[lightId]) return state;

      return {
        ...state,
        lights: {
          ...state.lights,
          [lightId]: {
            ...state.lights[lightId],
            ...updates,
            id: lightId,
          },
        },
      };
    });
    this.notifyStateChange();
  }

  /**
   * Remove a light
   */
  public removeLight(lightId: string): void {
    this._state.update((state) => {
      const { [lightId]: _removed, ...remainingLights } = state.lights;
      return {
        ...state,
        lights: remainingLights,
      };
    });
    this.notifyStateChange();
  }

  // ============================================================================
  // Material Management
  // ============================================================================

  /**
   * Add a material to state
   */
  public addMaterial(materialState: MaterialState): void {
    this._state.update((state) => ({
      ...state,
      materials: {
        ...state.materials,
        [materialState.id]: materialState,
      },
    }));
    this.notifyStateChange();
  }

  /**
   * Update a material
   */
  public updateMaterial(
    materialId: string,
    updates: Partial<Omit<MaterialState, 'id'>>
  ): void {
    this._state.update((state) => {
      if (!state.materials[materialId]) return state;

      return {
        ...state,
        materials: {
          ...state.materials,
          [materialId]: {
            ...state.materials[materialId],
            ...updates,
            id: materialId,
          },
        },
      };
    });
    this.notifyStateChange();
  }

  /**
   * Remove a material
   */
  public removeMaterial(materialId: string): void {
    this._state.update((state) => {
      const { [materialId]: _removed, ...remainingMaterials } = state.materials;
      return {
        ...state,
        materials: remainingMaterials,
      };
    });
    this.notifyStateChange();
  }

  // ============================================================================
  // Animation Management
  // ============================================================================

  /**
   * Add an animation to state
   */
  public addAnimation(animationState: AnimationState): void {
    this._state.update((state) => ({
      ...state,
      animations: {
        ...state.animations,
        [animationState.id]: animationState,
      },
    }));
    this.notifyStateChange();
  }

  /**
   * Update an animation
   */
  public updateAnimation(
    animationId: string,
    updates: Partial<Omit<AnimationState, 'id'>>
  ): void {
    this._state.update((state) => {
      if (!state.animations[animationId]) return state;

      return {
        ...state,
        animations: {
          ...state.animations,
          [animationId]: {
            ...state.animations[animationId],
            ...updates,
            id: animationId,
          },
        },
      };
    });
    this.notifyStateChange();
  }

  /**
   * Remove an animation
   */
  public removeAnimation(animationId: string): void {
    this._state.update((state) => {
      const { [animationId]: _removed, ...remainingAnimations } =
        state.animations;
      return {
        ...state,
        animations: remainingAnimations,
      };
    });
    this.notifyStateChange();
  }

  // ============================================================================
  // Performance Management
  // ============================================================================

  /**
   * Update performance metrics (does not trigger state change notification to avoid spam)
   */
  public updatePerformance(updates: Partial<PerformanceState>): void {
    this._state.update((state) => ({
      ...state,
      performance: { ...state.performance, ...updates },
    }));
  }

  /**
   * Start automatic performance monitoring
   */
  public startPerformanceMonitoring(): void {
    if (this.performanceFrameId !== null) return;

    let frameCount = 0;
    let lastTime = performance.now();

    const updateStats = (): void => {
      frameCount++;
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime);
        const frameTime = deltaTime / frameCount;

        this.updatePerformance({
          fps,
          frameTime,
          memoryUsage:
            (performance as unknown as { memory?: { usedJSHeapSize: number } })
              .memory?.usedJSHeapSize ?? 0,
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      this.performanceFrameId = requestAnimationFrame(updateStats);
    };

    this.performanceFrameId = requestAnimationFrame(updateStats);
  }

  /**
   * Stop automatic performance monitoring
   */
  public stopPerformanceMonitoring(): void {
    if (this.performanceFrameId !== null) {
      cancelAnimationFrame(this.performanceFrameId);
      this.performanceFrameId = null;
    }
  }

  // ============================================================================
  // Debug Mode
  // ============================================================================

  /**
   * Toggle debug mode
   */
  public toggleDebugMode(): void {
    this._state.update((state) => ({
      ...state,
      isDebugMode: !state.isDebugMode,
    }));
    this.notifyStateChange();
  }

  /**
   * Set debug mode explicitly
   */
  public setDebugMode(enabled: boolean): void {
    this._state.update((state) => ({
      ...state,
      isDebugMode: enabled,
    }));
    this.notifyStateChange();
  }

  // ============================================================================
  // State Reset
  // ============================================================================

  /**
   * Reset state to initial values
   */
  public reset(): void {
    this.stopPerformanceMonitoring();
    this._state.set(initialState);
    this.notifyStateChange();
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private notifyStateChange(): void {
    this._lastUpdateTime.set(Date.now());
  }
}
