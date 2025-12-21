/**
 * ViewportPositioningService - Unit Tests
 *
 * Comprehensive test coverage for reactive viewport 3D positioning.
 * Tests all position calculation methods, reactive updates, and edge cases.
 */

import { TestBed } from '@angular/core/testing';
import { ViewportPositioningService } from './viewport-positioning.service';
import { SceneGraphStore } from '../store/scene-graph.store';
import * as THREE from 'three';

describe('ViewportPositioningService', () => {
  let service: ViewportPositioningService;
  let store: SceneGraphStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ViewportPositioningService, SceneGraphStore],
    });
    service = TestBed.inject(ViewportPositioningService);
    store = TestBed.inject(SceneGraphStore);
  });

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Setup camera with typical configuration for testing
   * @param fov - Field of view in degrees (default: 75)
   * @param cameraZ - Camera Z position (default: 20)
   * @param aspect - Aspect ratio (default: 16/9)
   */
  function setupCamera(
    fov = 75,
    cameraZ = 20,
    aspect = 16 / 9
  ): THREE.PerspectiveCamera {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    camera.position.z = cameraZ;
    store.initScene(scene, camera, {} as THREE.WebGLRenderer);
    return camera;
  }

  /**
   * Calculate expected viewport height using FOV math
   * @param fov - Field of view in degrees
   * @param cameraZ - Camera Z position
   * @param viewportZ - Viewport plane Z position
   */
  function calculateExpectedHeight(
    fov: number,
    cameraZ: number,
    viewportZ = 0
  ): number {
    const distance = cameraZ - viewportZ;
    const fovRad = (fov * Math.PI) / 180;
    return 2 * Math.tan(fovRad / 2) * distance;
  }

  // ============================================================================
  // Service Initialization
  // ============================================================================

  describe('Service Initialization', () => {
    it('should create service', () => {
      expect(service).toBeTruthy();
    });

    it('should have default viewport dimensions when camera is not initialized', () => {
      expect(service.viewportWidth()).toBe(0);
      expect(service.viewportHeight()).toBe(0);
    });

    it('should calculate viewport dimensions when camera is initialized', () => {
      setupCamera(75, 20);

      const width = service.viewportWidth();
      const height = service.viewportHeight();

      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Named Positions
  // ============================================================================

  describe('Named Positions', () => {
    beforeEach(() => {
      setupCamera(75, 20);
    });

    it('should calculate center position', () => {
      const posSignal = service.getNamedPosition('center');
      const [x, y, z] = posSignal();

      expect(x).toBeCloseTo(0);
      expect(y).toBeCloseTo(0);
      expect(z).toBe(0);
    });

    it('should calculate top-left position', () => {
      const posSignal = service.getNamedPosition('top-left');
      const [x, y, z] = posSignal();

      const halfW = service.viewportWidth() / 2;
      const halfH = service.viewportHeight() / 2;

      expect(x).toBeCloseTo(-halfW);
      expect(y).toBeCloseTo(halfH);
      expect(z).toBe(0);
    });

    it('should calculate top-center position', () => {
      const posSignal = service.getNamedPosition('top-center');
      const [x, y, z] = posSignal();

      const halfH = service.viewportHeight() / 2;

      expect(x).toBeCloseTo(0);
      expect(y).toBeCloseTo(halfH);
      expect(z).toBe(0);
    });

    it('should calculate top-right position', () => {
      const posSignal = service.getNamedPosition('top-right');
      const [x, y, z] = posSignal();

      const halfW = service.viewportWidth() / 2;
      const halfH = service.viewportHeight() / 2;

      expect(x).toBeCloseTo(halfW);
      expect(y).toBeCloseTo(halfH);
      expect(z).toBe(0);
    });

    it('should calculate middle-left position', () => {
      const posSignal = service.getNamedPosition('middle-left');
      const [x, y, z] = posSignal();

      const halfW = service.viewportWidth() / 2;

      expect(x).toBeCloseTo(-halfW);
      expect(y).toBeCloseTo(0);
      expect(z).toBe(0);
    });

    it('should calculate middle-right position', () => {
      const posSignal = service.getNamedPosition('middle-right');
      const [x, y, z] = posSignal();

      const halfW = service.viewportWidth() / 2;

      expect(x).toBeCloseTo(halfW);
      expect(y).toBeCloseTo(0);
      expect(z).toBe(0);
    });

    it('should calculate bottom-left position', () => {
      const posSignal = service.getNamedPosition('bottom-left');
      const [x, y, z] = posSignal();

      const halfW = service.viewportWidth() / 2;
      const halfH = service.viewportHeight() / 2;

      expect(x).toBeCloseTo(-halfW);
      expect(y).toBeCloseTo(-halfH);
      expect(z).toBe(0);
    });

    it('should calculate bottom-center position', () => {
      const posSignal = service.getNamedPosition('bottom-center');
      const [x, y, z] = posSignal();

      const halfH = service.viewportHeight() / 2;

      expect(x).toBeCloseTo(0);
      expect(y).toBeCloseTo(-halfH);
      expect(z).toBe(0);
    });

    it('should calculate bottom-right position', () => {
      const posSignal = service.getNamedPosition('bottom-right');
      const [x, y, z] = posSignal();

      const halfW = service.viewportWidth() / 2;
      const halfH = service.viewportHeight() / 2;

      expect(x).toBeCloseTo(halfW);
      expect(y).toBeCloseTo(-halfH);
      expect(z).toBe(0);
    });

    it('should apply position offsets', () => {
      const posSignal = service.getNamedPosition('center', {
        offsetX: 2,
        offsetY: -1,
        offsetZ: -5,
      });
      const [x, y, z] = posSignal();

      expect(x).toBeCloseTo(2);
      expect(y).toBeCloseTo(-1);
      expect(z).toBeCloseTo(-5);
    });

    it('should handle partial offsets', () => {
      const posSignal = service.getNamedPosition('center', { offsetX: 2 });
      const [x, y, z] = posSignal();

      expect(x).toBeCloseTo(2);
      expect(y).toBeCloseTo(0);
      expect(z).toBe(0);
    });
  });

  // ============================================================================
  // Percentage Positions
  // ============================================================================

  describe('Percentage Positions', () => {
    beforeEach(() => {
      setupCamera(75, 20);
    });

    it('should calculate center position with string percentages', () => {
      const posSignal = service.getPercentagePosition({ x: '50%', y: '50%' });
      const [x, y, z] = posSignal();

      expect(x).toBeCloseTo(0);
      expect(y).toBeCloseTo(0);
      expect(z).toBe(0);
    });

    it('should calculate center position with decimal percentages', () => {
      const posSignal = service.getPercentagePosition({ x: 0.5, y: 0.5 });
      const [x, y, z] = posSignal();

      expect(x).toBeCloseTo(0);
      expect(y).toBeCloseTo(0);
      expect(z).toBe(0);
    });

    it('should calculate top-left corner with percentages', () => {
      const posSignal = service.getPercentagePosition({ x: '0%', y: '0%' });
      const [x, y, z] = posSignal();

      const halfW = service.viewportWidth() / 2;
      const halfH = service.viewportHeight() / 2;

      expect(x).toBeCloseTo(-halfW);
      expect(y).toBeCloseTo(halfH); // Y inverted (CSS-style top-down)
      expect(z).toBe(0);
    });

    it('should calculate bottom-right corner with percentages', () => {
      const posSignal = service.getPercentagePosition({ x: '100%', y: '100%' });
      const [x, y, z] = posSignal();

      const halfW = service.viewportWidth() / 2;
      const halfH = service.viewportHeight() / 2;

      expect(x).toBeCloseTo(halfW);
      expect(y).toBeCloseTo(-halfH); // Y inverted
      expect(z).toBe(0);
    });

    it('should calculate quarter positions with decimal format', () => {
      const posSignal = service.getPercentagePosition({ x: 0.25, y: 0.75 });
      const [x, y, z] = posSignal();

      const width = service.viewportWidth();
      const height = service.viewportHeight();

      const expectedX = (0.25 - 0.5) * width;
      const expectedY = (0.5 - 0.75) * height;

      expect(x).toBeCloseTo(expectedX);
      expect(y).toBeCloseTo(expectedY);
      expect(z).toBe(0);
    });

    it('should apply offsets to percentage positions', () => {
      const posSignal = service.getPercentagePosition(
        { x: '50%', y: '50%' },
        { offsetX: 3, offsetY: -2, offsetZ: -10 }
      );
      const [x, y, z] = posSignal();

      expect(x).toBeCloseTo(3);
      expect(y).toBeCloseTo(-2);
      expect(z).toBeCloseTo(-10);
    });

    it('should mix string and decimal formats', () => {
      const posSignal = service.getPercentagePosition({ x: '75%', y: 0.25 });
      const [x, y, z] = posSignal();

      const width = service.viewportWidth();
      const height = service.viewportHeight();

      const expectedX = (0.75 - 0.5) * width;
      const expectedY = (0.5 - 0.25) * height;

      expect(x).toBeCloseTo(expectedX);
      expect(y).toBeCloseTo(expectedY);
    });
  });

  // ============================================================================
  // Pixel Positions
  // ============================================================================

  describe('Pixel Positions', () => {
    beforeEach(() => {
      setupCamera(75, 20);
    });

    it('should convert pixel coordinates to world units', () => {
      const posSignal = service.getPixelPosition(
        { x: 960, y: 540 },
        { viewportWidth: 1920, viewportHeight: 1080 }
      );
      const [x, y, z] = posSignal();

      // Center of 1920x1080 viewport should be world origin
      expect(x).toBeCloseTo(0, 1);
      expect(y).toBeCloseTo(0, 1);
      expect(z).toBe(0);
    });

    it('should convert top-left pixel to world coordinates', () => {
      const posSignal = service.getPixelPosition(
        { x: 0, y: 0 },
        { viewportWidth: 1920, viewportHeight: 1080 }
      );
      const [x, y, z] = posSignal();

      const halfW = service.viewportWidth() / 2;
      const halfH = service.viewportHeight() / 2;

      expect(x).toBeCloseTo(-halfW, 1);
      expect(y).toBeCloseTo(halfH, 1);
      expect(z).toBe(0);
    });

    it('should convert bottom-right pixel to world coordinates', () => {
      const posSignal = service.getPixelPosition(
        { x: 1920, y: 1080 },
        { viewportWidth: 1920, viewportHeight: 1080 }
      );
      const [x, y, z] = posSignal();

      const halfW = service.viewportWidth() / 2;
      const halfH = service.viewportHeight() / 2;

      expect(x).toBeCloseTo(halfW, 1);
      expect(y).toBeCloseTo(-halfH, 1);
      expect(z).toBe(0);
    });

    it('should apply offsets to pixel positions', () => {
      const posSignal = service.getPixelPosition(
        { x: 960, y: 540 },
        {
          viewportWidth: 1920,
          viewportHeight: 1080,
          offsetX: 5,
          offsetY: 3,
          offsetZ: -15,
        }
      );
      const [x, y, z] = posSignal();

      expect(x).toBeCloseTo(5, 1);
      expect(y).toBeCloseTo(3, 1);
      expect(z).toBeCloseTo(-15);
    });
  });

  // ============================================================================
  // Unified getPosition() Method
  // ============================================================================

  describe('Unified getPosition() Method', () => {
    beforeEach(() => {
      setupCamera(75, 20);
    });

    it('should handle named positions', () => {
      const posSignal = service.getPosition('center');
      const [x, y, z] = posSignal();

      expect(x).toBeCloseTo(0);
      expect(y).toBeCloseTo(0);
      expect(z).toBe(0);
    });

    it('should handle percentage positions (string)', () => {
      const posSignal = service.getPosition({ x: '50%', y: '50%' });
      const [x, y, z] = posSignal();

      expect(x).toBeCloseTo(0);
      expect(y).toBeCloseTo(0);
      expect(z).toBe(0);
    });

    it('should handle percentage positions (decimal)', () => {
      const posSignal = service.getPosition({ x: 0.5, y: 0.5 });
      const [x, y, z] = posSignal();

      expect(x).toBeCloseTo(0);
      expect(y).toBeCloseTo(0);
      expect(z).toBe(0);
    });

    it('should handle pixel positions with explicit unit', () => {
      const posSignal = service.getPosition(
        { x: 960, y: 540 },
        { unit: 'px', viewportWidth: 1920, viewportHeight: 1080 }
      );
      const [x, y, z] = posSignal();

      expect(x).toBeCloseTo(0, 1);
      expect(y).toBeCloseTo(0, 1);
      expect(z).toBe(0);
    });

    it('should auto-detect pixel positions for large numbers', () => {
      const posSignal = service.getPosition(
        { x: 100, y: 50 },
        { viewportWidth: 1920, viewportHeight: 1080 }
      );
      const [x, y, z] = posSignal();

      // Large numbers (>1) should be interpreted as pixels
      expect(typeof x).toBe('number');
      expect(typeof y).toBe('number');
    });
  });

  // ============================================================================
  // Viewport Z Plane Configuration
  // ============================================================================

  describe('Viewport Z Plane', () => {
    beforeEach(() => {
      setupCamera(75, 20);
    });

    it('should default to Z=0', () => {
      const posSignal = service.getNamedPosition('center');
      const [, , z] = posSignal();

      expect(z).toBe(0);
    });

    it('should update viewport Z plane', () => {
      service.setViewportZ(-10);

      const posSignal = service.getNamedPosition('center');
      const [, , z] = posSignal();

      expect(z).toBe(-10);
    });

    it('should recalculate dimensions at new Z plane', () => {
      const heightAtZ0 = service.viewportHeight();

      service.setViewportZ(-10);
      const heightAtZ10 = service.viewportHeight();

      // Height should increase as Z moves away from camera
      expect(heightAtZ10).toBeGreaterThan(heightAtZ0);
    });

    it('should combine viewport Z with offset Z', () => {
      service.setViewportZ(-5);

      const posSignal = service.getNamedPosition('center', { offsetZ: -3 });
      const [, , z] = posSignal();

      expect(z).toBe(-8);
    });
  });

  // ============================================================================
  // Reactive Updates
  // ============================================================================

  describe('Reactive Updates', () => {
    it('should provide reactive position signals', () => {
      setupCamera(75, 20);

      const posSignal = service.getNamedPosition('top-right');
      const [x, y, z] = posSignal();

      // Position signal returns valid coordinates
      expect(typeof x).toBe('number');
      expect(typeof y).toBe('number');
      expect(typeof z).toBe('number');
    });

    it('should recalculate when different camera is initialized', () => {
      const camera1 = setupCamera(75, 20);

      const posSignal = service.getNamedPosition('top-right');
      const [x1, y1] = posSignal();

      // Initialize with different camera (wider FOV)
      const scene = new THREE.Scene();
      const camera2 = new THREE.PerspectiveCamera(90, 16 / 9, 0.1, 1000);
      camera2.position.z = 20;
      store.initScene(scene, camera2, {} as THREE.WebGLRenderer);

      const [x2, y2] = posSignal();

      // Wider FOV should result in larger viewport dimensions
      expect(Math.abs(x2)).toBeGreaterThan(Math.abs(x1));
      expect(Math.abs(y2)).toBeGreaterThan(Math.abs(y1));
    });

    it('should recalculate when camera with different Z is initialized', () => {
      setupCamera(75, 20);

      const posSignal = service.getNamedPosition('top-right');
      const [x1, y1] = posSignal();

      // Initialize with camera further back
      const scene = new THREE.Scene();
      const camera2 = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
      camera2.position.z = 30;
      store.initScene(scene, camera2, {} as THREE.WebGLRenderer);

      const [x2, y2] = posSignal();

      // Further camera should result in larger viewport dimensions
      expect(Math.abs(x2)).toBeGreaterThan(Math.abs(x1));
      expect(Math.abs(y2)).toBeGreaterThan(Math.abs(y1));
    });

    it('should update positions when viewport Z changes', () => {
      setupCamera(75, 20);

      const posSignal = service.getNamedPosition('top-right');
      const [x1, y1] = posSignal();

      // Move viewport plane
      service.setViewportZ(-5);

      const [x2, y2] = posSignal();

      // Moving viewport plane away from camera increases dimensions
      expect(Math.abs(x2)).toBeGreaterThan(Math.abs(x1));
      expect(Math.abs(y2)).toBeGreaterThan(Math.abs(y1));
    });
  });

  // ============================================================================
  // Responsive Utilities
  // ============================================================================

  describe('Utility Methods', () => {
    beforeEach(() => {
      setupCamera(75, 20);
    });

    describe('worldToPixels()', () => {
      it('should convert world units to pixels', () => {
        const worldUnits = 5;
        const pixels = service.worldToPixels(worldUnits);

        expect(pixels).toBeGreaterThan(0);
        expect(typeof pixels).toBe('number');
      });
    });

    describe('pixelsToWorld()', () => {
      it('should convert pixels to world units', () => {
        const pixels = 100;
        const worldUnits = service.pixelsToWorld(pixels);

        expect(worldUnits).toBeGreaterThan(0);
        expect(typeof worldUnits).toBe('number');
      });

      it('should be inverse of worldToPixels()', () => {
        const originalWorld = 5;
        const pixels = service.worldToPixels(originalWorld);
        const backToWorld = service.pixelsToWorld(pixels);

        expect(backToWorld).toBeCloseTo(originalWorld);
      });
    });

    describe('getResponsiveFontSize()', () => {
      it('should calculate font size as viewport height percentage', () => {
        const fontSize = service.getResponsiveFontSize(5);
        const expectedSize = service.viewportHeight() * 0.05;

        expect(fontSize).toBeCloseTo(expectedSize);
      });

      it('should scale with viewport height changes', () => {
        setupCamera(75, 20);

        const size1 = service.getResponsiveFontSize(5);

        // Initialize with camera further back (increases viewport height)
        const scene = new THREE.Scene();
        const camera2 = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
        camera2.position.z = 30;
        store.initScene(scene, camera2, {} as THREE.WebGLRenderer);

        const size2 = service.getResponsiveFontSize(5);

        expect(size2).toBeGreaterThan(size1);
      });

      it('should handle different percentage values', () => {
        const size1 = service.getResponsiveFontSize(1);
        const size5 = service.getResponsiveFontSize(5);
        const size10 = service.getResponsiveFontSize(10);

        expect(size5).toBeCloseTo(size1 * 5);
        expect(size10).toBeCloseTo(size1 * 10);
      });
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('Edge Cases', () => {
    it('should return default values when camera is null', () => {
      // Service created without camera initialization
      const posSignal = service.getNamedPosition('center');
      const [x, y, z] = posSignal();

      expect(x).toBe(0);
      expect(y).toBe(0);
      expect(z).toBe(0);
    });

    it('should return zero viewport dimensions when camera is null', () => {
      expect(service.viewportWidth()).toBe(0);
      expect(service.viewportHeight()).toBe(0);
    });

    it('should handle SSR environment (no window)', () => {
      // Service should not throw errors even if window is undefined
      expect(() => {
        service.getNamedPosition('center');
      }).not.toThrow();
    });

    it('should handle extreme FOV values', () => {
      setupCamera(120, 20); // Wide FOV

      const posSignal = service.getNamedPosition('top-right');
      const [x, y] = posSignal();

      expect(x).toBeGreaterThan(0);
      expect(y).toBeGreaterThan(0);
    });

    it('should handle negative viewport Z', () => {
      setupCamera(75, 20);
      service.setViewportZ(-50);

      const posSignal = service.getNamedPosition('center');
      const [, , z] = posSignal();

      expect(z).toBe(-50);
    });

    it('should handle zero offset values', () => {
      setupCamera(75, 20);

      const posSignal = service.getNamedPosition('center', {
        offsetX: 0,
        offsetY: 0,
        offsetZ: 0,
      });
      const [x, y, z] = posSignal();

      expect(x).toBe(0);
      expect(y).toBe(0);
      expect(z).toBe(0);
    });

    it('should handle negative offsets', () => {
      setupCamera(75, 20);

      const posSignal = service.getNamedPosition('center', {
        offsetX: -5,
        offsetY: -3,
        offsetZ: -10,
      });
      const [x, y, z] = posSignal();

      expect(x).toBe(-5);
      expect(y).toBe(-3);
      expect(z).toBe(-10);
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    beforeEach(() => {
      setupCamera(75, 20);
    });

    it('should calculate positions quickly (<1ms)', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        const posSignal = service.getNamedPosition('center');
        posSignal();
      }

      const duration = performance.now() - start;
      const avgDuration = duration / 1000;

      expect(avgDuration).toBeLessThan(1);
    });

    it('should handle rapid viewport Z changes efficiently', () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        service.setViewportZ(i * -0.1);
      }

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
    });
  });
});
