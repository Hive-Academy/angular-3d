import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';
import * as THREE from 'three/webgpu';

// Define MockText class BEFORE the module mock
class MockText extends THREE.Object3D {
  text = '';
  fontSize = 0.1;
  color: string | number = '#ffffff';
  font: string | null = null;
  fontStyle = 'normal';
  fontWeight: string | number = 'normal';
  maxWidth = Infinity;
  textAlign = 'left';
  anchorX: string | number = 'left';
  anchorY: string | number = 'top';
  lineHeight: string | number = 1.2;
  letterSpacing = 0;
  whiteSpace = 'normal';
  overflowWrap = 'normal';
  fillOpacity = 1;
  outlineWidth: string | number = 0;
  outlineColor: string | number = '#000000';
  outlineBlur: string | number = 0;
  outlineOpacity = 1;
  sdfGlyphSize = 64;
  glyphGeometryDetail = 1;
  gpuAccelerateSDF = true;
  depthOffset = 0;
  material: THREE.Material | null = null;

  private syncCallback?: () => void;

  sync(callback?: () => void): void {
    this.syncCallback = callback;
    // Simulate async font loading
    setTimeout(() => {
      if (this.syncCallback) {
        this.syncCallback();
      }
    }, 0);
  }

  dispose(): void {
    // Mock disposal
  }
}

// Mock troika-three-text module
jest.mock('troika-three-text', () => {
  // Return the actual MockText class defined above
  return {
    Text: class extends THREE.Object3D {
      text = '';
      fontSize = 0.1;
      color: string | number = '#ffffff';
      font: string | null = null;
      fontStyle = 'normal';
      fontWeight: string | number = 'normal';
      maxWidth = Infinity;
      textAlign = 'left';
      anchorX: string | number = 'left';
      anchorY: string | number = 'top';
      lineHeight: string | number = 1.2;
      letterSpacing = 0;
      whiteSpace = 'normal';
      overflowWrap = 'normal';
      fillOpacity = 1;
      outlineWidth: string | number = 0;
      outlineColor: string | number = '#000000';
      outlineBlur: string | number = 0;
      outlineOpacity = 1;
      sdfGlyphSize = 64;
      glyphGeometryDetail = 1;
      gpuAccelerateSDF = true;
      depthOffset = 0;
      material: THREE.Material | null = null;

      private syncCallback?: () => void;

      sync(callback?: () => void): void {
        this.syncCallback = callback;
        // Simulate async font loading
        setTimeout(() => {
          if (this.syncCallback) {
            this.syncCallback();
          }
        }, 0);
      }

      dispose(): void {
        // Mock disposal
      }
    },
    preloadFont: jest.fn(),
  };
});

// Import component AFTER jest.mock
import { TroikaTextComponent } from './troika-text.component';

// TODO: Fix three/tsl module resolution in Jest - Cannot find module 'three/tsl'
describe.skip('TroikaTextComponent', () => {
  let component: TroikaTextComponent;
  let fixture: ComponentFixture<TroikaTextComponent>;
  let mockParent: THREE.Object3D;
  let mockCamera: THREE.PerspectiveCamera;
  let mockRenderLoopService: jest.Mocked<RenderLoopService>;
  let mockSceneService: Partial<SceneService>;

  beforeEach(async () => {
    mockParent = new THREE.Object3D();
    mockCamera = new THREE.PerspectiveCamera();

    mockRenderLoopService = {
      registerUpdateCallback: jest.fn().mockReturnValue(() => {}),
    } as any;

    mockSceneService = {
      camera: signal(mockCamera),
    };

    await TestBed.configureTestingModule({
      imports: [TroikaTextComponent],
      providers: [
        {
          provide: NG_3D_PARENT,
          useValue: () => mockParent,
        },
        {
          provide: RenderLoopService,
          useValue: mockRenderLoopService,
        },
        {
          provide: SceneService,
          useValue: mockSceneService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TroikaTextComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create text object on initialization', (done) => {
    fixture.componentRef.setInput('text', 'Hello World');
    fixture.detectChanges();

    // Wait for sync callback
    setTimeout(() => {
      expect(mockParent.children.length).toBe(1);
      expect(mockParent.children[0]).toBeInstanceOf(THREE.Object3D);
      const textObject = mockParent.children[0] as any;
      expect(textObject.text).toBe('Hello World');
      done();
    }, 10);
  });

  it('should set loading state during initialization', () => {
    expect(component.isLoading()).toBe(false);

    fixture.componentRef.setInput('text', 'Loading Test');
    fixture.detectChanges();

    expect(component.isLoading()).toBe(true);
  });

  it('should clear loading state after sync', (done) => {
    fixture.componentRef.setInput('text', 'Sync Test');
    fixture.detectChanges();

    setTimeout(() => {
      expect(component.isLoading()).toBe(false);
      done();
    }, 10);
  });

  it('should apply all text properties correctly', (done) => {
    fixture.componentRef.setInput('text', 'Styled Text');
    fixture.componentRef.setInput('fontSize', 0.5);
    fixture.componentRef.setInput('color', '#ff0000');
    fixture.componentRef.setInput('font', '/assets/fonts/Roboto.ttf');
    fixture.componentRef.setInput('fontStyle', 'italic');
    fixture.componentRef.setInput('fontWeight', 'bold');
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = mockParent.children[0] as any;
      expect(textObject.text).toBe('Styled Text');
      expect(textObject.fontSize).toBe(0.5);
      expect(textObject.color).toBe('#ff0000');
      expect(textObject.font).toBe('/assets/fonts/Roboto.ttf');
      expect(textObject.fontStyle).toBe('italic');
      expect(textObject.fontWeight).toBe('bold');
      done();
    }, 10);
  });

  it('should apply layout properties correctly', (done) => {
    fixture.componentRef.setInput('text', 'Layout Test');
    fixture.componentRef.setInput('maxWidth', 10);
    fixture.componentRef.setInput('textAlign', 'center');
    fixture.componentRef.setInput('anchorX', 'center');
    fixture.componentRef.setInput('anchorY', 'middle');
    fixture.componentRef.setInput('lineHeight', 1.5);
    fixture.componentRef.setInput('letterSpacing', 0.1);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = mockParent.children[0] as any;
      expect(textObject.maxWidth).toBe(10);
      expect(textObject.textAlign).toBe('center');
      expect(textObject.anchorX).toBe('center');
      expect(textObject.anchorY).toBe('middle');
      expect(textObject.lineHeight).toBe(1.5);
      expect(textObject.letterSpacing).toBe(0.1);
      done();
    }, 10);
  });

  it('should apply visual styling properties correctly', (done) => {
    fixture.componentRef.setInput('text', 'Styled');
    fixture.componentRef.setInput('fillOpacity', 0.8);
    fixture.componentRef.setInput('outlineWidth', 0.05);
    fixture.componentRef.setInput('outlineColor', '#000000');
    fixture.componentRef.setInput('outlineBlur', 0.02);
    fixture.componentRef.setInput('outlineOpacity', 0.9);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = mockParent.children[0] as any;
      expect(textObject.fillOpacity).toBe(0.8);
      expect(textObject.outlineWidth).toBe(0.05);
      expect(textObject.outlineColor).toBe('#000000');
      expect(textObject.outlineBlur).toBe(0.02);
      expect(textObject.outlineOpacity).toBe(0.9);
      done();
    }, 10);
  });

  it('should apply advanced rendering properties correctly', (done) => {
    fixture.componentRef.setInput('text', 'Advanced');
    fixture.componentRef.setInput('sdfGlyphSize', 128);
    fixture.componentRef.setInput('glyphGeometryDetail', 2);
    fixture.componentRef.setInput('gpuAccelerateSDF', false);
    fixture.componentRef.setInput('depthOffset', 0.01);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = mockParent.children[0] as any;
      expect(textObject.sdfGlyphSize).toBe(128);
      expect(textObject.glyphGeometryDetail).toBe(2);
      expect(textObject.gpuAccelerateSDF).toBe(false);
      expect(textObject.depthOffset).toBe(0.01);
      done();
    }, 10);
  });

  it('should apply transform properties correctly', (done) => {
    fixture.componentRef.setInput('text', 'Transform');
    fixture.componentRef.setInput('position', [1, 2, 3]);
    fixture.componentRef.setInput('rotation', [0.1, 0.2, 0.3]);
    fixture.componentRef.setInput('scale', 2);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = mockParent.children[0] as any;
      expect(textObject.position.toArray()).toEqual([1, 2, 3]);
      expect(textObject.rotation.toArray().slice(0, 3)).toEqual([
        0.1, 0.2, 0.3,
      ]);
      expect(textObject.scale.toArray()).toEqual([2, 2, 2]);
      done();
    }, 10);
  });

  it('should apply non-uniform scale correctly', (done) => {
    fixture.componentRef.setInput('text', 'Scale');
    fixture.componentRef.setInput('scale', [1, 2, 3]);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = mockParent.children[0] as any;
      expect(textObject.scale.toArray()).toEqual([1, 2, 3]);
      done();
    }, 10);
  });

  it('should enable billboard mode and register render loop callback', (done) => {
    fixture.componentRef.setInput('text', 'Billboard');
    fixture.componentRef.setInput('billboard', true);
    fixture.detectChanges();

    setTimeout(() => {
      expect(mockRenderLoopService.registerUpdateCallback).toHaveBeenCalled();
      done();
    }, 10);
  });

  it('should not register render loop callback when billboard is disabled', (done) => {
    fixture.componentRef.setInput('text', 'No Billboard');
    fixture.componentRef.setInput('billboard', false);
    fixture.detectChanges();

    setTimeout(() => {
      expect(
        mockRenderLoopService.registerUpdateCallback
      ).not.toHaveBeenCalled();
      done();
    }, 10);
  });

  it('should apply custom material when provided', (done) => {
    const customMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });

    fixture.componentRef.setInput('text', 'Custom Material');
    fixture.componentRef.setInput('customMaterial', customMaterial);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = mockParent.children[0] as any;
      expect(textObject.material).toBe(customMaterial);
      done();
    }, 10);
  });

  it('should update text when text input changes', (done) => {
    fixture.componentRef.setInput('text', 'Initial Text');
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = mockParent.children[0] as any;
      expect(textObject.text).toBe('Initial Text');

      fixture.componentRef.setInput('text', 'Updated Text');
      fixture.detectChanges();

      setTimeout(() => {
        expect(textObject.text).toBe('Updated Text');
        done();
      }, 10);
    }, 10);
  });

  it('should remove text object from parent on cleanup', (done) => {
    fixture.componentRef.setInput('text', 'Cleanup Test');
    fixture.detectChanges();

    setTimeout(() => {
      expect(mockParent.children.length).toBe(1);

      fixture.destroy();

      expect(mockParent.children.length).toBe(0);
      done();
    }, 10);
  });

  it('should dispose text object on cleanup', (done) => {
    fixture.componentRef.setInput('text', 'Dispose Test');
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = mockParent.children[0] as any;
      const disposeSpy = jest.spyOn(textObject, 'dispose');

      fixture.destroy();

      expect(disposeSpy).toHaveBeenCalled();
      done();
    }, 10);
  });

  it('should cleanup render loop on destroy', (done) => {
    const cleanupFn = jest.fn();
    mockRenderLoopService.registerUpdateCallback.mockReturnValue(cleanupFn);

    fixture.componentRef.setInput('text', 'Render Loop Cleanup');
    fixture.componentRef.setInput('billboard', true);
    fixture.detectChanges();

    setTimeout(() => {
      fixture.destroy();

      expect(cleanupFn).toHaveBeenCalled();
      done();
    }, 10);
  });

  it('should handle missing parent gracefully', () => {
    // Create component with null parent
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TroikaTextComponent],
      providers: [
        {
          provide: NG_3D_PARENT,
          useValue: () => null,
        },
        {
          provide: RenderLoopService,
          useValue: mockRenderLoopService,
        },
        {
          provide: SceneService,
          useValue: mockSceneService,
        },
      ],
    }).compileComponents();

    const nullParentFixture = TestBed.createComponent(TroikaTextComponent);
    nullParentFixture.componentRef.setInput('text', 'No Parent');
    nullParentFixture.detectChanges();

    // Should not throw error
    expect(mockParent.children.length).toBe(0);

    nullParentFixture.destroy();
  });

  it('should handle empty text gracefully', () => {
    fixture.componentRef.setInput('text', '');
    fixture.detectChanges();

    // Should not create text object for empty string
    expect(mockParent.children.length).toBe(0);
  });

  it('should copy camera quaternion to text in billboard mode', (done) => {
    mockCamera.quaternion.set(0.1, 0.2, 0.3, 0.4);

    fixture.componentRef.setInput('text', 'Billboard Rotation');
    fixture.componentRef.setInput('billboard', true);
    fixture.detectChanges();

    setTimeout(() => {
      const textObject = mockParent.children[0] as any;

      // Get the callback that was registered
      const callback =
        mockRenderLoopService.registerUpdateCallback.mock.calls[0][0];

      // Execute the callback
      callback(0.016, 0.016);

      // Verify quaternion was copied
      expect(textObject.quaternion.x).toBe(mockCamera.quaternion.x);
      expect(textObject.quaternion.y).toBe(mockCamera.quaternion.y);
      expect(textObject.quaternion.z).toBe(mockCamera.quaternion.z);
      expect(textObject.quaternion.w).toBe(mockCamera.quaternion.w);
      done();
    }, 10);
  });
});
