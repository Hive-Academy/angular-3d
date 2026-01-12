import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import * as THREE from 'three/webgpu';
import { GlowTroikaTextComponent } from './glow-troika-text.component';
import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';

// TODO: Fix three/tsl module resolution in Jest - Cannot find module 'three/tsl'
describe.skip('GlowTroikaTextComponent', () => {
  let parentScene: THREE.Scene;
  let mockRenderLoop: jest.Mocked<RenderLoopService>;
  let mockSceneService: jest.Mocked<SceneService>;
  let renderCallbacks: Map<symbol, (delta: number, elapsed: number) => void>;

  @Component({
    selector: 'test-host',
    standalone: true,
    imports: [GlowTroikaTextComponent],
    template: `
      <a3d-glow-troika-text
        [text]="text()"
        [fontSize]="fontSize()"
        [glowColor]="glowColor()"
        [glowIntensity]="glowIntensity()"
        [pulseSpeed]="pulseSpeed()"
        [outlineWidthInput]="outlineWidth()"
        [position]="position()"
      />
    `,
  })
  class TestHostComponent {
    text = signal('GLOW TEXT');
    fontSize = signal(1.0);
    glowColor = signal('#00ffff');
    glowIntensity = signal(3.0);
    pulseSpeed = signal(1.0);
    outlineWidth = signal(0.02);
    position = signal<[number, number, number]>([0, 0, 0]);
  }

  beforeEach(() => {
    parentScene = new THREE.Scene();
    renderCallbacks = new Map();

    mockRenderLoop = {
      registerUpdateCallback: jest.fn((callback) => {
        const id = Symbol('callback');
        renderCallbacks.set(id, callback);
        return () => renderCallbacks.delete(id);
      }),
    } as unknown as jest.Mocked<RenderLoopService>;

    mockSceneService = {
      camera: signal(new THREE.PerspectiveCamera()),
    } as unknown as jest.Mocked<SceneService>;

    TestBed.configureTestingModule({
      imports: [TestHostComponent, GlowTroikaTextComponent],
      providers: [
        {
          provide: NG_3D_PARENT,
          useValue: signal(parentScene),
        },
        {
          provide: RenderLoopService,
          useValue: mockRenderLoop,
        },
        {
          provide: SceneService,
          useValue: mockSceneService,
        },
      ],
    });
  });

  afterEach(() => {
    renderCallbacks.clear();
  });

  it('should create component', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create glow material with toneMapped: false', (done) => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    // Wait for text to sync (async operation)
    setTimeout(() => {
      const textObject = parentScene.children.find(
        (child) => child.type === 'Mesh'
      );
      expect(textObject).toBeDefined();

      const material = (textObject as THREE.Mesh).material;
      expect(material).toBeInstanceOf(THREE.MeshBasicMaterial);

      const basicMaterial = material as THREE.MeshBasicMaterial;
      expect(basicMaterial.toneMapped).toBe(false);

      done();
    }, 100);
  });

  it('should apply glowIntensity > 1.0 to material color', (done) => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.glowIntensity.set(3.0);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = parentScene.children.find(
        (child) => child.type === 'Mesh'
      );
      const material = (textObject as THREE.Mesh)
        .material as THREE.MeshBasicMaterial;

      // Color should be multiplied by intensity (3.0)
      // Base color #00ffff (cyan) has R=0, G=1, B=1
      // After multiply by 3.0: R=0, G=3.0, B=3.0
      expect(material.color.r).toBe(0);
      expect(material.color.g).toBeCloseTo(3.0, 1);
      expect(material.color.b).toBeCloseTo(3.0, 1);

      done();
    }, 100);
  });

  it('should apply outline properties correctly', (done) => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.outlineWidth.set(0.05);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = parentScene.children.find(
        (child) => child.type === 'Mesh'
      );
      // Note: troika Text object has outlineWidth property
      expect((textObject as any).outlineWidth).toBe(0.05);
      expect((textObject as any).outlineColor).toBe('#000000');
      expect((textObject as any).outlineOpacity).toBe(1);

      done();
    }, 100);
  });

  it('should register pulse animation when pulseSpeed > 0', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.pulseSpeed.set(1.5);
    fixture.detectChanges();

    // Should register at least one callback (pulse animation)
    expect(mockRenderLoop.registerUpdateCallback).toHaveBeenCalled();
  });

  it('should not register pulse animation when pulseSpeed = 0', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.pulseSpeed.set(0);
    fixture.detectChanges();

    // May still have billboard callback, but no pulse callback
    // We verify by checking that disabling pulse doesn't add extra callbacks
    const initialCallCount =
      mockRenderLoop.registerUpdateCallback.mock.calls.length;

    fixture.componentInstance.pulseSpeed.set(0);
    fixture.detectChanges();

    // Call count should not increase when setting pulseSpeed to 0
    expect(mockRenderLoop.registerUpdateCallback.mock.calls.length).toBe(
      initialCallCount
    );
  });

  it('should update color intensity per frame during pulse animation', (done) => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.glowIntensity.set(2.0);
    fixture.componentInstance.pulseSpeed.set(1.0);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = parentScene.children.find(
        (child) => child.type === 'Mesh'
      );
      const material = (textObject as THREE.Mesh)
        .material as THREE.MeshBasicMaterial;

      // Get initial color
      const initialG = material.color.g;

      // Simulate frame update at elapsed = 0.25s (quarter cycle)
      renderCallbacks.forEach((callback) => {
        callback(0.016, 0.25);
      });

      // Color should have changed due to pulse
      const newG = material.color.g;
      expect(newG).not.toBe(initialG);

      done();
    }, 100);
  });

  it('should cleanup pulse animation on destroy', (done) => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    setTimeout(() => {
      const callbackCountBefore = renderCallbacks.size;
      expect(callbackCountBefore).toBeGreaterThan(0);

      fixture.destroy();

      // All callbacks should be cleaned up
      expect(renderCallbacks.size).toBe(0);

      done();
    }, 100);
  });

  it('should dispose text object on component destroy', (done) => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = parentScene.children.find(
        (child) => child.type === 'Mesh'
      );
      expect(textObject).toBeDefined();

      const disposeSpy = jest.spyOn(textObject as any, 'dispose');

      fixture.destroy();

      expect(disposeSpy).toHaveBeenCalled();
      expect(parentScene.children).toHaveLength(0);

      done();
    }, 100);
  });

  it('should support billboard mode', () => {
    @Component({
      selector: 'test-billboard-host',
      standalone: true,
      imports: [GlowTroikaTextComponent],
      template: `
        <a3d-glow-troika-text
          text="BILLBOARD"
          [billboard]="true"
          [pulseSpeed]="0"
        />
      `,
    })
    class TestBillboardHostComponent {}

    TestBed.overrideComponent(TestBillboardHostComponent, {
      set: {
        providers: [
          {
            provide: NG_3D_PARENT,
            useValue: signal(parentScene),
          },
          {
            provide: RenderLoopService,
            useValue: mockRenderLoop,
          },
          {
            provide: SceneService,
            useValue: mockSceneService,
          },
        ],
      },
    });

    const fixture = TestBed.createComponent(TestBillboardHostComponent);
    fixture.detectChanges();

    // Should register billboard callback
    expect(mockRenderLoop.registerUpdateCallback).toHaveBeenCalled();
  });

  it('should handle color changes reactively', (done) => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = parentScene.children.find(
        (child) => child.type === 'Mesh'
      );
      const material = (textObject as THREE.Mesh)
        .material as THREE.MeshBasicMaterial;

      // Initial color: #00ffff (cyan)
      expect(material.color.r).toBe(0);
      expect(material.color.g).toBeGreaterThan(0);
      expect(material.color.b).toBeGreaterThan(0);

      // Change to magenta
      fixture.componentInstance.glowColor.set('#ff00ff');
      fixture.detectChanges();

      setTimeout(() => {
        // Color should update to magenta (R and B > 0, G = 0)
        expect(material.color.r).toBeGreaterThan(0);
        expect(material.color.b).toBeGreaterThan(0);

        done();
      }, 100);
    }, 100);
  });
});
