# 03 - Render Loop & Animation

## Overview

Managing requestAnimationFrame in Angular components with proper zone handling and update cycles.

## The Challenge

Three.js needs continuous rendering (~60fps), but Angular's change detection can cause performance issues. We need to:

1. Run render loop outside Angular zone
2. Update Three.js objects without triggering change detection
3. Integrate GSAP animations
4. Handle pause/resume

## Basic Render Loop Service

```typescript
import { Injectable, NgZone, inject, signal } from '@angular/core';
import * as THREE from 'three';

@Injectable({ providedIn: 'root' })
export class RenderLoopService {
  private ngZone = inject(NgZone);

  private animationFrameId?: number;
  private updateCallbacks = new Set<(delta: number, elapsed: number)>();
  private clock = new THREE.Clock();
  private isRunning = signal(false);

  start(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    if (this.isRunning()) return;

    this.isRunning.set(true);
    this.clock.start();

    // Run outside Angular zone to prevent change detection on every frame
    this.ngZone.runOutsideAngular(() => {
      const render = () => {
        if (!this.isRunning()) return;

        this.animationFrameId = requestAnimationFrame(render);

        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        // Call all registered update callbacks
        this.updateCallbacks.forEach(callback => {
          callback(delta, elapsed);
        });

        // Render the scene
        renderer.render(scene, camera);
      };
      render();
    });
  }

  stop() {
    this.isRunning.set(false);
    this.clock.stop();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  pause() {
    this.clock.stop();
    this.isRunning.set(false);
  }

  resume() {
    this.clock.start();
    this.isRunning.set(true);
  }

  registerUpdateCallback(callback: (delta: number, elapsed: number) => void): () => void {
    this.updateCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }
}
```

## Updated Scene Component

```typescript
import { Component, DestroyRef, inject } from '@angular/core';
import { RenderLoopService } from '../services/render-loop.service';

@Component({
  selector: 'app-scene-3d',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
})
export class Scene3dComponent {
  private renderLoop = inject(RenderLoopService);
  private destroyRef = inject(DestroyRef);

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  ngAfterViewInit() {
    this.initRenderer();
    this.initScene();
    this.initCamera();

    // Start render loop
    this.renderLoop.start(this.renderer, this.scene, this.camera);

    // Stop on destroy
    this.destroyRef.onDestroy(() => {
      this.renderLoop.stop();
    });
  }
}
```

## Component with Animation

```typescript
import { Component, DestroyRef, inject } from '@angular/core';
import { RenderLoopService } from '../services/render-loop.service';

@Component({
  selector: 'app-rotating-cube',
  standalone: true,
  template: '',
})
export class RotatingCubeComponent implements AfterViewInit {
  private renderLoop = inject(RenderLoopService);
  private destroyRef = inject(DestroyRef);
  private sceneService = inject(SceneService);

  private mesh?: THREE.Mesh;
  readonly rotationSpeed = input<number>(1.0);

  ngAfterViewInit() {
    this.createCube();

    // Register update callback
    const cleanup = this.renderLoop.registerUpdateCallback((delta) => {
      if (this.mesh) {
        this.mesh.rotation.y += delta * this.rotationSpeed();
      }
    });

    // Clean up on destroy
    this.destroyRef.onDestroy(cleanup);
  }

  private createCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.sceneService.addToScene(this.mesh);
  }
}
```

## GSAP Integration

### Animation Service

```typescript
import { Injectable } from '@angular/core';
import gsap from 'gsap';
import * as THREE from 'three';

export interface FloatConfig {
  height?: number;
  speed?: number;
  delay?: number;
  ease?: string;
}

@Injectable({ providedIn: 'root' })
export class AnimationService {
  private animations = new Map<string, gsap.core.Tween | gsap.core.Timeline>();

  floatAnimation(object: THREE.Object3D, config: FloatConfig = {}): gsap.core.Tween {
    const { height = 0.3, speed = 2000, delay = 0, ease = 'sine.inOut' } = config;

    const originalY = object.position.y;

    const tween = gsap.to(object.position, {
      y: originalY + height,
      duration: speed / 1000,
      delay: delay / 1000,
      repeat: -1,
      yoyo: true,
      ease,
    });

    this.animations.set(object.uuid, tween);
    return tween;
  }

  rotateAnimation(object: THREE.Object3D, axis: 'x' | 'y' | 'z', speed: number): gsap.core.Tween {
    const duration = 60 / speed; // Convert RPM to seconds

    const tween = gsap.to(object.rotation, {
      [axis]: `+=${Math.PI * 2}`,
      duration,
      repeat: -1,
      ease: 'none',
    });

    this.animations.set(object.uuid, tween);
    return tween;
  }

  flightPath(object: THREE.Object3D, waypoints: Array<{ position: [number, number, number]; duration: number }>, loop = true): gsap.core.Timeline {
    const timeline = gsap.timeline({ repeat: loop ? -1 : 0 });

    waypoints.forEach((waypoint, index) => {
      timeline.to(
        object.position,
        {
          x: waypoint.position[0],
          y: waypoint.position[1],
          z: waypoint.position[2],
          duration: waypoint.duration,
          ease: 'power1.inOut',
        },
        index === 0 ? 0 : '>'
      );
    });

    this.animations.set(object.uuid, timeline);
    return timeline;
  }

  killAnimation(objectId: string) {
    const animation = this.animations.get(objectId);
    if (animation) {
      animation.kill();
      this.animations.delete(objectId);
    }
  }

  killAll() {
    this.animations.forEach((animation) => animation.kill());
    this.animations.clear();
  }

  pauseAnimation(objectId: string) {
    this.animations.get(objectId)?.pause();
  }

  resumeAnimation(objectId: string) {
    this.animations.get(objectId)?.resume();
  }
}
```

### Component Using GSAP

```typescript
@Component({
  selector: 'app-floating-planet',
  standalone: true,
  template: '',
})
export class FloatingPlanetComponent implements AfterViewInit, OnDestroy {
  private animationService = inject(AnimationService);
  private mesh?: THREE.Mesh;

  readonly floatHeight = input<number>(0.5);
  readonly floatSpeed = input<number>(3000);
  readonly rotationSpeed = input<number>(30);

  ngAfterViewInit() {
    this.createPlanet();

    if (this.mesh) {
      // Add float animation
      this.animationService.floatAnimation(this.mesh, {
        height: this.floatHeight(),
        speed: this.floatSpeed(),
      });

      // Add rotation
      this.animationService.rotateAnimation(this.mesh, 'y', this.rotationSpeed());
    }
  }

  ngOnDestroy() {
    if (this.mesh) {
      this.animationService.killAnimation(this.mesh.uuid);
    }
  }
}
```

## AnimationMixer Integration (GLTF Animations)

```typescript
@Component({
  selector: 'app-animated-model',
  standalone: true,
  template: '',
})
export class AnimatedModelComponent implements AfterViewInit, OnDestroy {
  private renderLoop = inject(RenderLoopService);
  private destroyRef = inject(DestroyRef);

  private mixer?: THREE.AnimationMixer;
  private model?: THREE.Group;

  readonly modelPath = input.required<string>();

  ngAfterViewInit() {
    this.loadModel();
  }

  private loadModel() {
    const loader = new GLTFLoader();

    loader.load(this.modelPath(), (gltf) => {
      this.model = gltf.scene;
      this.sceneService.addToScene(this.model);

      // Setup animations
      if (gltf.animations && gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(this.model);

        gltf.animations.forEach((clip) => {
          const action = this.mixer!.clipAction(clip);
          action.play();
        });

        // Register update callback for mixer
        const cleanup = this.renderLoop.registerUpdateCallback((delta) => {
          this.mixer?.update(delta);
        });

        this.destroyRef.onDestroy(() => {
          cleanup();
          this.mixer?.stopAllAction();
        });
      }
    });
  }
}
```

## Performance Monitoring

```typescript
@Injectable({ providedIn: 'root' })
export class PerformanceMonitorService {
  private fpsHistory: number[] = [];
  private frameCount = 0;
  private lastTime = performance.now();

  readonly currentFps = signal<number>(60);
  readonly averageFps = signal<number>(60);

  update() {
    this.frameCount++;
    const currentTime = performance.now();

    // Calculate FPS every second
    if (currentTime >= this.lastTime + 1000) {
      const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));

      this.currentFps.set(fps);
      this.fpsHistory.push(fps);

      // Keep last 60 samples (60 seconds)
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }

      // Calculate average
      const avg = Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
      this.averageFps.set(avg);

      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }
}
```

### Integration with Render Loop

```typescript
export class RenderLoopService {
  private perfMonitor = inject(PerformanceMonitorService);

  private render() {
    // ... existing render code

    // Update performance monitor
    this.perfMonitor.update();

    renderer.render(scene, camera);
  }
}
```

## Conditional Rendering

```typescript
@Injectable({ providedIn: 'root' })
export class RenderLoopService {
  private shouldRender = signal(true);

  // Pause rendering when tab is hidden
  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  // Reduce FPS when low performance detected
  checkPerformance(fps: number) {
    if (fps < 30) {
      this.setTargetFPS(30); // Reduce to 30fps
    } else if (fps < 45) {
      this.setTargetFPS(45); // Moderate reduction
    } else {
      this.setTargetFPS(60); // Full speed
    }
  }
}
```

## Key Concepts

### Zone Management

- **runOutsideAngular**: Prevents change detection on every frame
- **runInsideAngular**: Triggers change detection when needed
- Most Three.js updates should be outside zone

### Update Callbacks

- Register callbacks with `registerUpdateCallback`
- Always return cleanup function
- Clean up in `ngOnDestroy`

### GSAP + Three.js

- GSAP directly mutates Three.js properties
- No need for Angular change detection
- Kill animations on component destroy

### Performance

- Monitor FPS with PerformanceMonitorService
- Pause rendering when tab hidden
- Reduce quality if FPS drops

## Next Steps

See **[04-primitive-components.md](./04-primitive-components.md)** for building reusable Three.js component primitives.
