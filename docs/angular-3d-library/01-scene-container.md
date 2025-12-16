# 01 - Scene Container Component

## Overview

The root component that manages WebGL renderer, camera, and render loop. This is the foundation of your Angular 3D library.

## Architecture

```
Scene3dComponent (container)
├── WebGLRenderer (Three.js)
├── Scene (Three.js)
├── Camera (Three.js)
├── Render Loop (requestAnimationFrame)
└── Child Components (planets, stars, etc.)
    └── Add objects to scene via injection
```

## Implementation

### Basic Scene Container

```typescript
import { Component, ElementRef, OnInit, OnDestroy, AfterViewInit, input, signal, effect } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-scene-3d',
  standalone: true,
  template: `
    <div class="scene-container">
      <canvas #canvas></canvas>
      <div class="scene-content">
        <ng-content />
        <!-- Child components rendered here -->
      </div>
    </div>
  `,
  styles: [
    `
      .scene-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
      }

      canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .scene-content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none; /* Allow canvas interaction */
      }
    `,
  ],
})
export class Scene3dComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  // Inputs
  readonly cameraPosition = input<[number, number, number]>([0, 0, 20]);
  readonly cameraFov = input<number>(75);
  readonly backgroundColor = input<number>(0x000011);
  readonly enableShadows = input<boolean>(true);
  readonly enableAntialiasing = input<boolean>(true);

  // Three.js objects
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationFrameId?: number;

  // Signals for child components
  readonly sceneInstance = signal<THREE.Scene | null>(null);
  readonly rendererInstance = signal<THREE.WebGLRenderer | null>(null);
  readonly cameraInstance = signal<THREE.PerspectiveCamera | null>(null);

  ngOnInit() {
    this.initRenderer();
    this.initScene();
    this.initCamera();
  }

  ngAfterViewInit() {
    this.startRenderLoop();
    this.setupResizeHandler();

    // Expose instances to child components
    this.sceneInstance.set(this.scene);
    this.rendererInstance.set(this.renderer);
    this.cameraInstance.set(this.camera);
  }

  ngOnDestroy() {
    this.stopRenderLoop();
    this.dispose();
  }

  private initRenderer() {
    const canvas = this.canvasRef.nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.enableAntialiasing(),
      alpha: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (this.enableShadows()) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.backgroundColor());
  }

  private initCamera() {
    this.camera = new THREE.PerspectiveCamera(this.cameraFov(), window.innerWidth / window.innerHeight, 0.1, 1000);

    const [x, y, z] = this.cameraPosition();
    this.camera.position.set(x, y, z);
  }

  private startRenderLoop() {
    const render = () => {
      this.animationFrameId = requestAnimationFrame(render);
      this.renderer.render(this.scene, this.camera);
    };
    render();
  }

  private stopRenderLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private setupResizeHandler() {
    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private dispose() {
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    this.scene.clear();
  }

  // Public API for child components
  getScene(): THREE.Scene {
    return this.scene;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
```

## Dependency Injection Pattern

### Scene Service (Alternative Approach)

```typescript
import { Injectable, signal } from '@angular/core';
import * as THREE from 'three';

@Injectable()
export class SceneService {
  readonly scene = signal<THREE.Scene | null>(null);
  readonly renderer = signal<THREE.WebGLRenderer | null>(null);
  readonly camera = signal<THREE.PerspectiveCamera | null>(null);

  setScene(scene: THREE.Scene) {
    this.scene.set(scene);
  }

  setRenderer(renderer: THREE.WebGLRenderer) {
    this.renderer.set(renderer);
  }

  setCamera(camera: THREE.PerspectiveCamera) {
    this.camera.set(camera);
  }

  addToScene(object: THREE.Object3D) {
    const sceneInstance = this.scene();
    if (sceneInstance) {
      sceneInstance.add(object);
    }
  }

  removeFromScene(object: THREE.Object3D) {
    const sceneInstance = this.scene();
    if (sceneInstance) {
      sceneInstance.remove(object);
    }
  }
}
```

### Updated Scene Component (with service)

```typescript
@Component({
  selector: 'app-scene-3d',
  providers: [SceneService], // Provide at component level
  // ... rest of component
})
export class Scene3dComponent {
  private sceneService = inject(SceneService);

  ngAfterViewInit() {
    // Expose to children via service
    this.sceneService.setScene(this.scene);
    this.sceneService.setRenderer(this.renderer);
    this.sceneService.setCamera(this.camera);

    this.startRenderLoop();
  }
}
```

## Advanced Features

### Post-Processing Support

```typescript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

export class Scene3dComponent {
  readonly enablePostProcessing = input<boolean>(false);
  private composer?: EffectComposer;
  private renderPass?: RenderPass;

  ngAfterViewInit() {
    if (this.enablePostProcessing()) {
      this.setupPostProcessing();
    }
    this.startRenderLoop();
  }

  private setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
  }

  private startRenderLoop() {
    const render = () => {
      this.animationFrameId = requestAnimationFrame(render);

      if (this.composer) {
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    };
    render();
  }

  // Public API for effects
  addPostProcessingPass(pass: any) {
    if (this.composer) {
      this.composer.addPass(pass);
    }
  }
}
```

### Reactive Background Color

```typescript
export class Scene3dComponent {
  readonly backgroundColor = input<number>(0x000011);

  constructor() {
    // React to background color changes
    effect(() => {
      const color = this.backgroundColor();
      if (this.scene) {
        this.scene.background = new THREE.Color(color);
      }
    });
  }
}
```

### Camera Animation Support

```typescript
import gsap from 'gsap';

export class Scene3dComponent {
  animateCameraTo(position: [number, number, number], target: [number, number, number], duration = 2) {
    gsap.to(this.camera.position, {
      x: position[0],
      y: position[1],
      z: position[2],
      duration,
      ease: 'power2.inOut',
    });
  }
}
```

## Usage Examples

### Basic Scene

```typescript
@Component({
  template: `
    <app-scene-3d
      [cameraPosition]="[0, 0, 20]"
      [backgroundColor]="0x000011">
      <!-- Child components here -->
    </app-scene-3d>
  `
})
```

### Scene with Post-Processing

```typescript
@Component({
  template: `
    <app-scene-3d
      [enablePostProcessing]="true"
      [enableShadows]="true"
      [enableAntialiasing]="true">

      <app-planet />
      <app-bloom-effect />

    </app-scene-3d>
  `
})
```

### Dynamic Scene Configuration

```typescript
@Component({
  template: `
    <app-scene-3d [cameraPosition]="cameraPos()" [backgroundColor]="bgColor()" [cameraFov]="fov()">
      <!-- ... -->
    </app-scene-3d>
  `,
})
export class DynamicSceneComponent {
  readonly cameraPos = signal<[number, number, number]>([0, 0, 20]);
  readonly bgColor = signal<number>(0x000011);
  readonly fov = signal<number>(75);

  // Methods to update scene
  zoomIn() {
    this.cameraPos.update((pos) => [pos[0], pos[1], pos[2] - 5]);
  }

  changeTheme() {
    this.bgColor.set(0x001122);
  }
}
```

## Key Concepts

### 1. Component Hierarchy

- **Scene3dComponent** = root container
- Child components inject `SceneService` to add objects
- All Three.js objects managed by Angular lifecycle

### 2. Signal-Based State

- Use signals for reactive Three.js properties
- Child components can read scene/renderer/camera signals
- Effects automatically update Three.js when signals change

### 3. Lifecycle Integration

- `ngOnInit`: Create Three.js objects
- `ngAfterViewInit`: Start render loop
- `ngOnDestroy`: Clean up (stop loop, dispose objects)

### 4. Provider Scope

- Provide `SceneService` at Scene3dComponent level
- All child components share same service instance
- Multiple scenes = isolated service instances

## Performance Tips

### Reduce Change Detection

```typescript
// Run render loop outside Angular zone
import { NgZone } from '@angular/core';

export class Scene3dComponent {
  private ngZone = inject(NgZone);

  private startRenderLoop() {
    this.ngZone.runOutsideAngular(() => {
      const render = () => {
        this.animationFrameId = requestAnimationFrame(render);
        this.renderer.render(this.scene, this.camera);
      };
      render();
    });
  }
}
```

### Optimize Renderer Settings

```typescript
this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x
this.renderer.powerPreference = 'high-performance';
this.renderer.physicallyCorrectLights = false; // Faster but less accurate
```

## Next Steps

See **[02-lifecycle-management.md](./02-lifecycle-management.md)** for managing Three.js object lifecycle in Angular components.
