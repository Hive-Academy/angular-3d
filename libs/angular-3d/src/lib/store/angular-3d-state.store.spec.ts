import { TestBed } from '@angular/core/testing';
import {
  Angular3DStateStore,
  SceneState,
  LightState,
  MaterialState,
  AnimationState,
  SceneObjectState,
} from './angular-3d-state.store';

describe('Angular3DStateStore', () => {
  let store: Angular3DStateStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Angular3DStateStore],
    });
    store = TestBed.inject(Angular3DStateStore);
  });

  afterEach(() => {
    store.reset();
  });

  describe('initialization', () => {
    it('should create store instance', () => {
      expect(store).toBeTruthy();
    });

    it('should have default state', () => {
      const state = store.state();
      expect(state.scenes).toEqual({});
      expect(state.activeSceneId).toBeNull();
      expect(state.camera.type).toBe('perspective');
      expect(state.camera.fov).toBe(75);
      expect(state.isDebugMode).toBe(false);
    });

    it('should have null active scene initially', () => {
      expect(store.activeScene()).toBeNull();
    });
  });

  describe('scene management', () => {
    it('should create a scene', () => {
      const scene = store.createScene('scene-1', 'Test Scene');

      expect(scene.id).toBe('scene-1');
      expect(scene.name).toBe('Test Scene');
      expect(store.state().scenes['scene-1']).toBeDefined();
    });

    it('should create a scene with custom config', () => {
      const scene = store.createScene('scene-1', 'Test Scene', {
        backgroundColor: 0xff0000,
        isActive: true,
      });

      expect(scene.backgroundColor).toBe(0xff0000);
      expect(scene.isActive).toBe(true);
    });

    it('should update a scene', () => {
      store.createScene('scene-1', 'Test Scene');
      store.updateScene('scene-1', { backgroundColor: 0x00ff00 });

      expect(store.state().scenes['scene-1'].backgroundColor).toBe(0x00ff00);
    });

    it('should not update non-existent scene', () => {
      const stateBefore = store.state();
      store.updateScene('nonexistent', { backgroundColor: 0x00ff00 });
      expect(store.state()).toBe(stateBefore);
    });

    it('should remove a scene', () => {
      store.createScene('scene-1', 'Test Scene');
      store.removeScene('scene-1');

      expect(store.state().scenes['scene-1']).toBeUndefined();
    });

    it('should clear active scene when removed', () => {
      store.createScene('scene-1', 'Test Scene');
      store.setActiveScene('scene-1');
      store.removeScene('scene-1');

      expect(store.state().activeSceneId).toBeNull();
    });

    it('should set active scene', () => {
      store.createScene('scene-1', 'Test Scene');
      store.setActiveScene('scene-1');

      expect(store.state().activeSceneId).toBe('scene-1');
      expect(store.activeScene()?.id).toBe('scene-1');
    });
  });

  describe('scene object management', () => {
    const testObject: SceneObjectState = {
      id: 'obj-1',
      name: 'Test Object',
      type: 'mesh',
      visible: true,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      children: [],
      userData: {},
    };

    beforeEach(() => {
      store.createScene('scene-1', 'Test Scene');
    });

    it('should add object to scene', () => {
      store.addSceneObject('scene-1', testObject);

      expect(store.state().scenes['scene-1'].objects['obj-1']).toBeDefined();
    });

    it('should not add object to non-existent scene', () => {
      store.addSceneObject('nonexistent', testObject);

      expect(store.state().scenes['scene-1'].objects['obj-1']).toBeUndefined();
    });

    it('should update scene object', () => {
      store.addSceneObject('scene-1', testObject);
      store.updateSceneObject('scene-1', 'obj-1', { visible: false });

      expect(store.state().scenes['scene-1'].objects['obj-1'].visible).toBe(
        false
      );
    });

    it('should remove scene object', () => {
      store.addSceneObject('scene-1', testObject);
      store.removeSceneObject('scene-1', 'obj-1');

      expect(store.state().scenes['scene-1'].objects['obj-1']).toBeUndefined();
    });

    it('should return scene objects via computed signal', () => {
      store.addSceneObject('scene-1', testObject);
      store.setActiveScene('scene-1');

      expect(store.sceneObjects()).toHaveLength(1);
      expect(store.sceneObjects()[0].id).toBe('obj-1');
    });
  });

  describe('camera management', () => {
    it('should update camera position', () => {
      store.updateCamera({ position: [10, 20, 30] });

      expect(store.state().camera.position).toEqual([10, 20, 30]);
    });

    it('should update camera fov', () => {
      store.updateCamera({ fov: 90 });

      expect(store.state().camera.fov).toBe(90);
    });

    it('should preserve other camera properties on update', () => {
      store.updateCamera({ fov: 90 });

      expect(store.state().camera.near).toBe(0.1);
      expect(store.state().camera.far).toBe(1000);
    });
  });

  describe('light management', () => {
    const testLight: LightState = {
      id: 'light-1',
      type: 'directional',
      color: 0xffffff,
      intensity: 1,
      position: [0, 10, 0],
      castShadow: true,
    };

    it('should add a light', () => {
      store.addLight(testLight);

      expect(store.state().lights['light-1']).toBeDefined();
      expect(store.activeLights()).toHaveLength(1);
    });

    it('should update a light', () => {
      store.addLight(testLight);
      store.updateLight('light-1', { intensity: 0.5 });

      expect(store.state().lights['light-1'].intensity).toBe(0.5);
    });

    it('should remove a light', () => {
      store.addLight(testLight);
      store.removeLight('light-1');

      expect(store.state().lights['light-1']).toBeUndefined();
      expect(store.activeLights()).toHaveLength(0);
    });
  });

  describe('material management', () => {
    const testMaterial: MaterialState = {
      id: 'mat-1',
      type: 'standard',
      color: 0xff0000,
      opacity: 1,
      transparent: false,
      wireframe: false,
      roughness: 0.5,
      metalness: 0.5,
    };

    it('should add a material', () => {
      store.addMaterial(testMaterial);

      expect(store.state().materials['mat-1']).toBeDefined();
      expect(store.activeMaterials()).toHaveLength(1);
    });

    it('should update a material', () => {
      store.addMaterial(testMaterial);
      store.updateMaterial('mat-1', { roughness: 0.8 });

      expect(store.state().materials['mat-1'].roughness).toBe(0.8);
    });

    it('should remove a material', () => {
      store.addMaterial(testMaterial);
      store.removeMaterial('mat-1');

      expect(store.state().materials['mat-1']).toBeUndefined();
    });
  });

  describe('animation management', () => {
    const testAnimation: AnimationState = {
      id: 'anim-1',
      target: 'obj-1',
      isPlaying: true,
      duration: 1000,
      currentTime: 0,
      loop: true,
      timeScale: 1,
    };

    it('should add an animation', () => {
      store.addAnimation(testAnimation);

      expect(store.state().animations['anim-1']).toBeDefined();
    });

    it('should report playing animations', () => {
      store.addAnimation(testAnimation);

      expect(store.playingAnimations()).toHaveLength(1);
    });

    it('should update an animation', () => {
      store.addAnimation(testAnimation);
      store.updateAnimation('anim-1', { isPlaying: false });

      expect(store.playingAnimations()).toHaveLength(0);
    });

    it('should remove an animation', () => {
      store.addAnimation(testAnimation);
      store.removeAnimation('anim-1');

      expect(store.state().animations['anim-1']).toBeUndefined();
    });
  });

  describe('performance monitoring', () => {
    it('should have default performance metrics', () => {
      const perf = store.performance();

      expect(perf.fps).toBe(60);
      expect(perf.frameTime).toBe(16.67);
    });

    it('should update performance metrics', () => {
      store.updatePerformance({ fps: 30, frameTime: 33.33 });

      expect(store.performance().fps).toBe(30);
    });

    it('should report healthy status for good fps', () => {
      store.updatePerformance({ fps: 60, frameTime: 16.67 });

      expect(store.performanceStatus().isHealthy).toBe(true);
    });

    it('should report unhealthy status for low fps', () => {
      store.updatePerformance({ fps: 20, frameTime: 50 });

      expect(store.performanceStatus().isHealthy).toBe(false);
    });
  });

  describe('debug mode', () => {
    it('should toggle debug mode', () => {
      expect(store.isDebugMode()).toBe(false);

      store.toggleDebugMode();
      expect(store.isDebugMode()).toBe(true);

      store.toggleDebugMode();
      expect(store.isDebugMode()).toBe(false);
    });

    it('should set debug mode explicitly', () => {
      store.setDebugMode(true);
      expect(store.isDebugMode()).toBe(true);

      store.setDebugMode(false);
      expect(store.isDebugMode()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', () => {
      store.createScene('scene-1', 'Test Scene');
      store.setActiveScene('scene-1');
      store.updateCamera({ fov: 90 });
      store.setDebugMode(true);

      store.reset();

      expect(store.state().scenes).toEqual({});
      expect(store.state().activeSceneId).toBeNull();
      expect(store.state().camera.fov).toBe(75);
      expect(store.isDebugMode()).toBe(false);
    });
  });

  describe('lastUpdateTime', () => {
    it('should update timestamp on state changes', (done) => {
      const initialTime = store.lastUpdateTime();

      setTimeout(() => {
        store.createScene('scene-1', 'Test Scene');
        expect(store.lastUpdateTime()).toBeGreaterThan(initialTime);
        done();
      }, 10);
    });
  });
});
