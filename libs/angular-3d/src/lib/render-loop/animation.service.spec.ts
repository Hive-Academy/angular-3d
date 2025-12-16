import { AnimationService } from './animation.service';
import * as THREE from 'three';

// GSAP is mocked globally in test-setup.ts

describe('AnimationService', () => {
  let service: AnimationService;

  beforeEach(() => {
    service = new AnimationService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.killAll();
  });

  describe('initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should have no active animations initially', () => {
      expect(service.getActiveCount()).toBe(0);
    });
  });

  describe('floatAnimation', () => {
    it('should create float animation', () => {
      const gsap = require('gsap');
      const mesh = new THREE.Mesh();

      const result = service.floatAnimation(mesh);

      expect(gsap.to).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should track animation by object uuid', () => {
      const mesh = new THREE.Mesh();

      service.floatAnimation(mesh);

      expect(service.hasAnimation(mesh.uuid)).toBe(true);
    });

    it('should use custom config', () => {
      const gsap = require('gsap');
      const mesh = new THREE.Mesh();
      mesh.position.y = 5;

      service.floatAnimation(mesh, {
        height: 1,
        speed: 3000,
        delay: 500,
        ease: 'power2.inOut',
      });

      expect(gsap.to).toHaveBeenCalledWith(
        mesh.position,
        expect.objectContaining({
          y: 6, // originalY + height
          duration: 3, // speed / 1000
          delay: 0.5, // delay / 1000
          ease: 'power2.inOut',
        })
      );
    });
  });

  describe('rotateAnimation', () => {
    it('should create rotation animation', () => {
      const gsap = require('gsap');
      const mesh = new THREE.Mesh();

      const result = service.rotateAnimation(mesh);

      expect(gsap.to).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should support different axes', () => {
      const gsap = require('gsap');
      const mesh = new THREE.Mesh();

      service.rotateAnimation(mesh, { axis: 'x' });

      expect(gsap.to).toHaveBeenCalledWith(
        mesh.rotation,
        expect.objectContaining({
          x: expect.stringContaining('+='),
        })
      );
    });
  });

  describe('flightPath', () => {
    it('should create flight path timeline', () => {
      const gsap = require('gsap');
      const mesh = new THREE.Mesh();
      const waypoints = [
        { position: [1, 2, 3] as [number, number, number], duration: 2 },
        { position: [4, 5, 6] as [number, number, number], duration: 1 },
      ];

      const result = service.flightPath(mesh, waypoints);

      expect(gsap.timeline).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should track timeline by object uuid', () => {
      const mesh = new THREE.Mesh();
      const waypoints = [
        { position: [0, 0, 0] as [number, number, number], duration: 1 },
      ];

      service.flightPath(mesh, waypoints);

      expect(service.hasAnimation(mesh.uuid)).toBe(true);
    });
  });

  describe('pulseAnimation', () => {
    it('should create pulse animation', () => {
      const gsap = require('gsap');
      const mesh = new THREE.Mesh();

      const result = service.pulseAnimation(mesh);

      expect(gsap.to).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should set initial scale', () => {
      const mesh = new THREE.Mesh();

      service.pulseAnimation(mesh, { minScale: 0.5 });

      expect(mesh.scale.x).toBe(0.5);
      expect(mesh.scale.y).toBe(0.5);
      expect(mesh.scale.z).toBe(0.5);
    });
  });

  describe('animation management', () => {
    it('should kill animation by id', () => {
      const mesh = new THREE.Mesh();
      service.floatAnimation(mesh);

      service.killAnimation(mesh.uuid);

      expect(service.hasAnimation(mesh.uuid)).toBe(false);
    });

    it('should kill all animations', () => {
      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();

      service.floatAnimation(mesh1);
      service.rotateAnimation(mesh2);

      service.killAll();

      expect(service.getActiveCount()).toBe(0);
    });

    it('should pause animation by id', () => {
      const mesh = new THREE.Mesh();
      const tween = service.floatAnimation(mesh);

      service.pauseAnimation(mesh.uuid);

      expect(tween.pause).toHaveBeenCalled();
    });

    it('should resume animation by id', () => {
      const mesh = new THREE.Mesh();
      const tween = service.floatAnimation(mesh);

      service.resumeAnimation(mesh.uuid);

      expect(tween.resume).toHaveBeenCalled();
    });

    it('should pause all animations', () => {
      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();

      const tween1 = service.floatAnimation(mesh1);
      const tween2 = service.rotateAnimation(mesh2);

      service.pauseAll();

      expect(tween1.pause).toHaveBeenCalled();
      expect(tween2.pause).toHaveBeenCalled();
    });

    it('should resume all animations', () => {
      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();

      const tween1 = service.floatAnimation(mesh1);
      const tween2 = service.rotateAnimation(mesh2);

      service.resumeAll();

      expect(tween1.resume).toHaveBeenCalled();
      expect(tween2.resume).toHaveBeenCalled();
    });
  });

  describe('hasAnimation', () => {
    it('should return true for tracked animation', () => {
      const mesh = new THREE.Mesh();
      service.floatAnimation(mesh);

      expect(service.hasAnimation(mesh.uuid)).toBe(true);
    });

    it('should return false for non-tracked animation', () => {
      expect(service.hasAnimation('nonexistent-uuid')).toBe(false);
    });
  });
});
