import { TestBed } from '@angular/core/testing';
import { firstValueFrom, take, toArray } from 'rxjs';
import {
  ComponentRegistryService,
  ComponentRegistration,
  SceneGraphEvent,
} from './component-registry.service';

describe('ComponentRegistryService', () => {
  let service: ComponentRegistryService;

  const testRegistration: ComponentRegistration = {
    componentId: 'comp-1',
    componentType: 'scene-node',
    isActive: true,
    dependencies: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ComponentRegistryService],
    });
    service = TestBed.inject(ComponentRegistryService);
  });

  afterEach(() => {
    service.clear();
  });

  describe('initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should have empty registry initially', () => {
      expect(service.components()).toHaveLength(0);
      expect(service.componentCount()).toBe(0);
    });
  });

  describe('component registration', () => {
    it('should register a component', () => {
      service.registerComponent(testRegistration);

      expect(service.componentCount()).toBe(1);
      expect(service.hasComponent('comp-1')).toBe(true);
    });

    it('should emit node-added event on registration', (done) => {
      service.events$.pipe(take(1)).subscribe((event) => {
        expect(event.type).toBe('node-added');
        expect(event.source).toBe('comp-1');
        done();
      });

      service.registerComponent(testRegistration);
    });

    it('should return registered component via getComponent', () => {
      service.registerComponent(testRegistration);

      const comp = service.getComponent('comp-1');
      expect(comp?.componentId).toBe('comp-1');
      expect(comp?.componentType).toBe('scene-node');
    });

    it('should return undefined for non-existent component', () => {
      expect(service.getComponent('nonexistent')).toBeUndefined();
    });
  });

  describe('component unregistration', () => {
    it('should unregister a component', () => {
      service.registerComponent(testRegistration);
      service.unregisterComponent('comp-1');

      expect(service.componentCount()).toBe(0);
      expect(service.hasComponent('comp-1')).toBe(false);
    });

    it('should emit node-removed event on unregistration', (done) => {
      service.registerComponent(testRegistration);

      service.events$.pipe(take(2)).subscribe((event) => {
        if (event.type === 'node-removed') {
          expect(event.source).toBe('comp-1');
          done();
        }
      });

      service.unregisterComponent('comp-1');
    });

    it('should not emit event for non-existent component', async () => {
      const events: SceneGraphEvent[] = [];
      const sub = service.events$.subscribe((e) => events.push(e));

      service.unregisterComponent('nonexistent');

      // Give time for any async events
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(events).toHaveLength(0);
      sub.unsubscribe();
    });
  });

  describe('component update', () => {
    it('should update component registration', () => {
      service.registerComponent(testRegistration);
      service.updateComponent('comp-1', { isActive: false });

      expect(service.getComponent('comp-1')?.isActive).toBe(false);
    });

    it('should emit node-updated event on update', (done) => {
      service.registerComponent(testRegistration);

      service.events$.pipe(take(2)).subscribe((event) => {
        if (event.type === 'node-updated') {
          expect(event.source).toBe('comp-1');
          done();
        }
      });

      service.updateComponent('comp-1', { isActive: false });
    });

    it('should not update non-existent component', () => {
      service.updateComponent('nonexistent', { isActive: false });

      expect(service.componentCount()).toBe(0);
    });
  });

  describe('computed signals', () => {
    it('should return all components via components signal', () => {
      service.registerComponent(testRegistration);
      service.registerComponent({ ...testRegistration, componentId: 'comp-2' });

      expect(service.components()).toHaveLength(2);
    });

    it('should return only active components', () => {
      service.registerComponent(testRegistration);
      service.registerComponent({
        ...testRegistration,
        componentId: 'comp-2',
        isActive: false,
      });

      expect(service.activeComponents()).toHaveLength(1);
      expect(service.activeComponents()[0].componentId).toBe('comp-1');
    });

    it('should group components by type', () => {
      service.registerComponent(testRegistration);
      service.registerComponent({
        ...testRegistration,
        componentId: 'comp-2',
        componentType: 'primitive',
      });

      const byType = service.componentsByType();
      expect(byType['scene-node']).toHaveLength(1);
      expect(byType['primitive']).toHaveLength(1);
    });
  });

  describe('component queries', () => {
    beforeEach(() => {
      service.registerComponent(testRegistration);
      service.registerComponent({
        ...testRegistration,
        componentId: 'comp-2',
        componentType: 'primitive',
      });
    });

    it('should get components by type', () => {
      const primitives = service.getComponentsByType('primitive');

      expect(primitives).toHaveLength(1);
      expect(primitives[0].componentId).toBe('comp-2');
    });

    it('should get component dependencies', () => {
      service.registerComponent({
        componentId: 'comp-3',
        componentType: 'scene-node',
        isActive: true,
        dependencies: ['comp-1'],
      });

      const deps = service.getComponentDependencies('comp-3');
      expect(deps).toHaveLength(1);
      expect(deps[0].componentId).toBe('comp-1');
    });

    it('should get component dependents', () => {
      service.registerComponent({
        componentId: 'comp-3',
        componentType: 'scene-node',
        isActive: true,
        dependencies: ['comp-1'],
      });

      const dependents = service.getComponentDependents('comp-1');
      expect(dependents).toHaveLength(1);
      expect(dependents[0].componentId).toBe('comp-3');
    });
  });

  describe('event communication', () => {
    it('should emit custom events', (done) => {
      service.events$.pipe(take(1)).subscribe((event) => {
        expect(event.type).toBe('custom');
        expect(event.source).toBe('test');
        expect(event.data).toBe('test-data');
        expect(event.timestamp).toBeDefined();
        done();
      });

      service.emitEvent({
        type: 'custom',
        source: 'test',
        data: 'test-data',
      });
    });

    it('should filter events by source', (done) => {
      service
        .eventsFrom('source-1')
        .pipe(take(1))
        .subscribe((event) => {
          expect(event.source).toBe('source-1');
          done();
        });

      service.emitEvent({ type: 'custom', source: 'source-2', data: null });
      service.emitEvent({ type: 'custom', source: 'source-1', data: null });
    });

    it('should filter events by type', (done) => {
      service
        .eventsOfType('animation-started')
        .pipe(take(1))
        .subscribe((event) => {
          expect(event.type).toBe('animation-started');
          done();
        });

      service.emitEvent({ type: 'node-added', source: 'test', data: null });
      service.emitEvent({
        type: 'animation-started',
        source: 'test',
        data: null,
      });
    });
  });

  describe('cross-component messaging', () => {
    it('should send messages', (done) => {
      service.messages$.pipe(take(1)).subscribe((msg) => {
        expect(msg.from).toBe('comp-1');
        expect(msg.to).toBe('comp-2');
        expect(msg.action).toBe('update');
        expect(msg.payload).toEqual({ value: 42 });
        done();
      });

      service.sendMessage({
        from: 'comp-1',
        to: 'comp-2',
        action: 'update',
        payload: { value: 42 },
      });
    });

    it('should filter messages for specific component', (done) => {
      service
        .messagesFor('comp-2')
        .pipe(take(1))
        .subscribe((msg) => {
          expect(msg.to).toBe('comp-2');
          done();
        });

      service.sendMessage({
        from: 'x',
        to: 'comp-1',
        action: 'a',
        payload: null,
      });
      service.sendMessage({
        from: 'x',
        to: 'comp-2',
        action: 'b',
        payload: null,
      });
    });

    it('should receive broadcast messages (*)', (done) => {
      service
        .messagesFor('comp-1')
        .pipe(take(1))
        .subscribe((msg) => {
          expect(msg.to).toBe('*');
          done();
        });

      service.sendMessage({
        from: 'x',
        to: '*',
        action: 'broadcast',
        payload: null,
      });
    });

    it('should filter messages from specific component', (done) => {
      service
        .messagesFrom('comp-1')
        .pipe(take(1))
        .subscribe((msg) => {
          expect(msg.from).toBe('comp-1');
          done();
        });

      service.sendMessage({
        from: 'comp-2',
        to: 'x',
        action: 'a',
        payload: null,
      });
      service.sendMessage({
        from: 'comp-1',
        to: 'x',
        action: 'b',
        payload: null,
      });
    });
  });

  describe('cleanup', () => {
    it('should clear all registrations', () => {
      service.registerComponent(testRegistration);
      service.registerComponent({ ...testRegistration, componentId: 'comp-2' });

      service.clear();

      expect(service.componentCount()).toBe(0);
    });
  });
});
