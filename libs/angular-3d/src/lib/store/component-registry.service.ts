/**
 * Component Registry Service
 *
 * Manages component registration and cross-component event communication.
 * Enables coordination between Angular components in the 3D scene graph.
 *
 * @example
 * ```typescript
 * @Component({ ... })
 * export class MySceneNode implements OnInit, OnDestroy {
 *   private registry = inject(ComponentRegistryService);
 *   private componentId = `my-node-${crypto.randomUUID()}`;
 *
 *   ngOnInit() {
 *     this.registry.registerComponent({
 *       componentId: this.componentId,
 *       componentType: 'scene-node',
 *       isActive: true,
 *       dependencies: []
 *     });
 *   }
 *
 *   ngOnDestroy() {
 *     this.registry.unregisterComponent(this.componentId);
 *   }
 * }
 * ```
 */

import { Injectable, signal, computed } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Registration details for a component in the scene graph
 */
export interface ComponentRegistration {
  readonly componentId: string;
  readonly componentType:
    | 'scene-node'
    | 'hybrid-scene'
    | 'animation-demo'
    | 'primitive'
    | 'directive';
  readonly sceneObjectId?: string;
  readonly isActive: boolean;
  readonly dependencies: readonly string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Event emitted for scene graph changes
 */
export interface SceneGraphEvent {
  readonly type:
    | 'node-added'
    | 'node-removed'
    | 'node-updated'
    | 'animation-started'
    | 'animation-stopped'
    | 'custom';
  readonly source: string;
  readonly target?: string;
  readonly data: unknown;
  readonly timestamp: number;
}

/**
 * Message for cross-component communication
 */
export interface CrossComponentMessage {
  readonly from: string;
  readonly to: string;
  readonly action: string;
  readonly payload: unknown;
}

// ============================================================================
// Component Registry Service
// ============================================================================

/**
 * Service for managing component registration and event communication.
 *
 * Provides:
 * - Component lifecycle tracking
 * - Scene graph event broadcasting
 * - Cross-component messaging
 */
@Injectable({
  providedIn: 'root',
})
export class ComponentRegistryService {
  // Component registry (Map wrapped in signal for reactivity)
  private readonly _registry = signal<Map<string, ComponentRegistration>>(
    new Map()
  );

  // Event streams
  private readonly _eventBus = new Subject<SceneGraphEvent>();
  private readonly _messageBus = new Subject<CrossComponentMessage>();

  // ============================================================================
  // Public Computed Signals
  // ============================================================================

  /** All registered components */
  public readonly components = computed(() => {
    return Array.from(this._registry().values());
  });

  /** Only active components */
  public readonly activeComponents = computed(() => {
    return this.components().filter((comp) => comp.isActive);
  });

  /** Components grouped by type */
  public readonly componentsByType = computed(() => {
    const result: Record<string, ComponentRegistration[]> = {};
    for (const comp of this.components()) {
      if (!result[comp.componentType]) {
        result[comp.componentType] = [];
      }
      result[comp.componentType].push(comp);
    }
    return result;
  });

  /** Total count of registered components */
  public readonly componentCount = computed(() => this._registry().size);

  // ============================================================================
  // Public Observables
  // ============================================================================

  /** Stream of all scene graph events */
  public readonly events$: Observable<SceneGraphEvent> =
    this._eventBus.asObservable();

  /** Stream of all cross-component messages */
  public readonly messages$: Observable<CrossComponentMessage> =
    this._messageBus.asObservable();

  // ============================================================================
  // Component Registration
  // ============================================================================

  /**
   * Register a component in the registry
   */
  public registerComponent(registration: ComponentRegistration): void {
    this._registry.update((registry) => {
      const newRegistry = new Map(registry);
      newRegistry.set(registration.componentId, registration);
      return newRegistry;
    });

    this.emitEvent({
      type: 'node-added',
      source: registration.componentId,
      data: registration,
    });
  }

  /**
   * Unregister a component from the registry
   */
  public unregisterComponent(componentId: string): void {
    const registration = this._registry().get(componentId);

    if (registration) {
      this._registry.update((registry) => {
        const newRegistry = new Map(registry);
        newRegistry.delete(componentId);
        return newRegistry;
      });

      this.emitEvent({
        type: 'node-removed',
        source: componentId,
        data: registration,
      });
    }
  }

  /**
   * Update a component's registration
   */
  public updateComponent(
    componentId: string,
    updates: Partial<ComponentRegistration>
  ): void {
    this._registry.update((registry) => {
      const existing = registry.get(componentId);
      if (!existing) return registry;

      const newRegistry = new Map(registry);
      newRegistry.set(componentId, { ...existing, ...updates, componentId });
      return newRegistry;
    });

    this.emitEvent({
      type: 'node-updated',
      source: componentId,
      data: updates,
    });
  }

  /**
   * Check if a component is registered
   */
  public hasComponent(componentId: string): boolean {
    return this._registry().has(componentId);
  }

  /**
   * Get a specific component's registration
   */
  public getComponent(componentId: string): ComponentRegistration | undefined {
    return this._registry().get(componentId);
  }

  // ============================================================================
  // Component Queries
  // ============================================================================

  /**
   * Get components by type
   */
  public getComponentsByType(
    type: ComponentRegistration['componentType']
  ): ComponentRegistration[] {
    return this.components().filter((comp) => comp.componentType === type);
  }

  /**
   * Get a component's dependencies
   */
  public getComponentDependencies(
    componentId: string
  ): ComponentRegistration[] {
    const component = this._registry().get(componentId);
    if (!component) return [];

    return component.dependencies
      .map((depId) => this._registry().get(depId))
      .filter((comp): comp is ComponentRegistration => comp !== undefined);
  }

  /**
   * Get components that depend on a given component
   */
  public getComponentDependents(componentId: string): ComponentRegistration[] {
    return this.components().filter((comp) =>
      comp.dependencies.includes(componentId)
    );
  }

  // ============================================================================
  // Event Communication
  // ============================================================================

  /**
   * Emit a scene graph event
   */
  public emitEvent(event: Omit<SceneGraphEvent, 'timestamp'>): void {
    this._eventBus.next({
      ...event,
      timestamp: Date.now(),
    });
  }

  /**
   * Create an observable for events from a specific source
   */
  public eventsFrom(sourceId: string): Observable<SceneGraphEvent> {
    return this.events$.pipe(filter((event) => event.source === sourceId));
  }

  /**
   * Create an observable for events of a specific type
   */
  public eventsOfType(
    type: SceneGraphEvent['type']
  ): Observable<SceneGraphEvent> {
    return this.events$.pipe(filter((event) => event.type === type));
  }

  // ============================================================================
  // Cross-Component Messaging
  // ============================================================================

  /**
   * Send a message to a specific component or broadcast to all ('*')
   */
  public sendMessage(message: CrossComponentMessage): void {
    this._messageBus.next(message);
  }

  /**
   * Create an observable for messages to a specific component
   */
  public messagesFor(componentId: string): Observable<CrossComponentMessage> {
    return this.messages$.pipe(
      filter((msg) => msg.to === componentId || msg.to === '*')
    );
  }

  /**
   * Create an observable for messages from a specific component
   */
  public messagesFrom(componentId: string): Observable<CrossComponentMessage> {
    return this.messages$.pipe(filter((msg) => msg.from === componentId));
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Clear all registrations (for testing or reset scenarios)
   */
  public clear(): void {
    this._registry.set(new Map());
  }

  /**
   * Complete all event streams (call on application destroy)
   */
  public destroy(): void {
    this._eventBus.complete();
    this._messageBus.complete();
  }
}
