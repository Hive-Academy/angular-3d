import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SectionContainerComponent } from '../shared/section-container.component';
import { CodeSnippetComponent } from '../shared/code-snippet.component';

/**
 * ServicesDocumentationComponent
 *
 * Documentation for all 6 core services in @hive-academy/angular-3d.
 * Provides usage examples, method signatures, and integration patterns.
 *
 * Services documented:
 * - SceneService: Access to Three.js Scene, Camera, Renderer
 * - RenderLoopService: requestAnimationFrame management and per-frame callbacks
 * - GltfLoaderService: GLTF/GLB model loading with caching
 * - TextureLoaderService: Texture loading with caching
 * - FontPreloadService: Font preloading for Troika text components
 * - AdvancedPerformanceOptimizerService: Performance optimization utilities
 */
@Component({
  selector: 'app-services-documentation',
  imports: [SectionContainerComponent, CodeSnippetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="3" background="light">
      <span heading>Core <span class="text-primary-500">Services</span></span>
      <span description
        >6 injectable services for scene management, rendering, and asset
        loading</span
      >

      <!-- Full-width container for 2-column service grid -->
      <div class="col-span-full">
        <div class="grid md:grid-cols-2 gap-8x">
          <!-- SceneService -->
          <div class="bg-white rounded-card shadow-card p-6x">
            <h3 class="text-headline-lg font-bold mb-3x">SceneService</h3>
            <p class="text-body-md text-text-secondary mb-4x">
              Provides access to Three.js Scene, Camera, and Renderer instances.
              Essential for direct Three.js API manipulation.
            </p>
            <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
            <ul
              class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1"
            >
              <li><code>getScene(): THREE.Scene</code> - Get current scene</li>
              <li>
                <code>getCamera(): THREE.Camera</code> - Get active camera
              </li>
              <li>
                <code>getRenderer(): THREE.WebGLRenderer</code> - Get renderer
              </li>
            </ul>
            <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
            <app-code-snippet
              language="typescript"
              [code]="sceneServiceExample"
            />
          </div>

          <!-- RenderLoopService -->
          <div class="bg-white rounded-card shadow-card p-6x">
            <h3 class="text-headline-lg font-bold mb-3x">RenderLoopService</h3>
            <p class="text-body-md text-text-secondary mb-4x">
              Manages the requestAnimationFrame render loop and per-frame
              callbacks. Use for custom animations and updates.
            </p>
            <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
            <ul
              class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1"
            >
              <li>
                <code
                  >registerUpdateCallback(callback: UpdateCallback): () =>
                  void</code
                >
              </li>
              <li><code>start(): void</code> - Start render loop</li>
              <li><code>stop(): void</code> - Stop render loop</li>
            </ul>
            <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
            <app-code-snippet
              language="typescript"
              [code]="renderLoopServiceExample"
            />
          </div>

          <!-- GltfLoaderService -->
          <div class="bg-white rounded-card shadow-card p-6x">
            <h3 class="text-headline-lg font-bold mb-3x">GltfLoaderService</h3>
            <p class="text-body-md text-text-secondary mb-4x">
              Loads GLTF/GLB 3D models with caching and progress callbacks.
              Supports animations and complex model hierarchies.
            </p>
            <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
            <ul
              class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1"
            >
              <li>
                <code
                  >load(url: string, onProgress?: (progress: number) => void):
                  Promise&lt;GLTF&gt;</code
                >
              </li>
            </ul>
            <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
            <app-code-snippet
              language="typescript"
              [code]="gltfLoaderServiceExample"
            />
          </div>

          <!-- TextureLoaderService -->
          <div class="bg-white rounded-card shadow-card p-6x">
            <h3 class="text-headline-lg font-bold mb-3x">
              TextureLoaderService
            </h3>
            <p class="text-body-md text-text-secondary mb-4x">
              Loads textures with caching support. Automatically handles image
              formats and optimizes repeated texture usage.
            </p>
            <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
            <ul
              class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1"
            >
              <li>
                <code>load(url: string): Promise&lt;THREE.Texture&gt;</code>
              </li>
            </ul>
            <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
            <app-code-snippet
              language="typescript"
              [code]="textureLoaderServiceExample"
            />
          </div>

          <!-- FontPreloadService -->
          <div class="bg-white rounded-card shadow-card p-6x">
            <h3 class="text-headline-lg font-bold mb-3x">FontPreloadService</h3>
            <p class="text-body-md text-text-secondary mb-4x">
              Preloads fonts for Troika text components to prevent race
              conditions and ensure fonts are ready before rendering.
            </p>
            <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
            <ul
              class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1"
            >
              <li>
                <code>preloadFont(url: string): Promise&lt;void&gt;</code>
              </li>
            </ul>
            <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
            <app-code-snippet
              language="typescript"
              [code]="fontPreloadServiceExample"
            />
          </div>

          <!-- AdvancedPerformanceOptimizerService -->
          <div class="bg-white rounded-card shadow-card p-6x">
            <h3 class="text-headline-lg font-bold mb-3x">
              AdvancedPerformanceOptimizerService
            </h3>
            <p class="text-body-md text-text-secondary mb-4x">
              Provides performance optimization utilities for complex scenes.
              Includes frustum culling, LOD management, and render
              optimizations.
            </p>
            <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
            <ul
              class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1"
            >
              <li>
                <code>optimizeScene(scene: THREE.Scene): void</code>
              </li>
              <li><code>enableFrustumCulling(): void</code></li>
            </ul>
            <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
            <app-code-snippet
              language="typescript"
              [code]="performanceOptimizerServiceExample"
            />
          </div>
        </div>
      </div>
    </app-section-container>
  `,
})
export class ServicesDocumentationComponent {
  // Code examples for each service (using modern inject() pattern)
  public readonly sceneServiceExample = `import { inject } from '@angular/core';
import { SceneService } from '@hive-academy/angular-3d';

export class MyComponent {
  private sceneService = inject(SceneService);

  ngAfterViewInit() {
    const scene = this.sceneService.getScene();
    const camera = this.sceneService.getCamera();
    // Manipulate scene directly with Three.js API
  }
}`;

  public readonly renderLoopServiceExample = `import { inject, DestroyRef } from '@angular/core';
import { RenderLoopService } from '@hive-academy/angular-3d';

export class MyComponent {
  private renderLoop = inject(RenderLoopService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    const cleanup = this.renderLoop.registerUpdateCallback((delta, elapsed) => {
      // Per-frame animation logic
      this.mesh.rotation.y += delta;
    });

    this.destroyRef.onDestroy(cleanup);
  }
}`;

  public readonly gltfLoaderServiceExample = `import { inject } from '@angular/core';
import { GltfLoaderService } from '@hive-academy/angular-3d';

export class MyComponent {
  private gltfLoader = inject(GltfLoaderService);

  async loadModel() {
    const gltf = await this.gltfLoader.load(
      '/3d/model.gltf',
      (progress) => console.log(\`\${progress}% loaded\`)
    );
    scene.add(gltf.scene);
  }
}`;

  public readonly textureLoaderServiceExample = `import { inject } from '@angular/core';
import { TextureLoaderService } from '@hive-academy/angular-3d';

export class MyComponent {
  private textureLoader = inject(TextureLoaderService);

  async loadTexture() {
    const texture = await this.textureLoader.load('/textures/diffuse.jpg');
    material.map = texture;
  }
}`;

  public readonly fontPreloadServiceExample = `import { inject } from '@angular/core';
import { FontPreloadService } from '@hive-academy/angular-3d';

export class MyComponent {
  private fontPreload = inject(FontPreloadService);

  async preloadFonts() {
    await this.fontPreload.preloadFont('/fonts/roboto.woff');
    // Now safe to use TroikaTextComponent
  }
}`;

  public readonly performanceOptimizerServiceExample = `import { inject } from '@angular/core';
import { AdvancedPerformanceOptimizerService, SceneService } from '@hive-academy/angular-3d';

export class MyComponent {
  private optimizer = inject(AdvancedPerformanceOptimizerService);
  private sceneService = inject(SceneService);

  optimizeMyScene() {
    const scene = this.sceneService.getScene();
    this.optimizer.optimizeScene(scene);
    this.optimizer.enableFrustumCulling();
  }
}`;
}
