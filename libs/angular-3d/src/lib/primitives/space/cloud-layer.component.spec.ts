import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CloudLayerComponent } from './cloud-layer.component';
import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import * as THREE from 'three/webgpu';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

/**
 * Test host component to provide required input
 */
@Component({
  template: `<a3d-cloud-layer [textureUrl]="'/test-cloud.png'" />`,
  imports: [CloudLayerComponent],
})
class TestHostComponent {}

// TODO: Fix three/tsl module resolution in Jest - Cannot find module 'three/tsl'
describe.skip('CloudLayerComponent', () => {
  let mockParent: THREE.Object3D;
  let mockRenderLoopService: { registerUpdateCallback: jest.Mock };
  let hostFixture: ComponentFixture<TestHostComponent>;
  let cloudLayerDebug: DebugElement;
  let cloudLayerComponent: CloudLayerComponent;

  beforeEach(async () => {
    mockParent = new THREE.Object3D();
    mockRenderLoopService = {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      registerUpdateCallback: jest.fn().mockReturnValue(() => {}),
    };

    await TestBed.configureTestingModule({
      imports: [TestHostComponent, CloudLayerComponent],
      providers: [
        {
          provide: NG_3D_PARENT,
          useValue: () => mockParent,
        },
        {
          provide: RenderLoopService,
          useValue: mockRenderLoopService,
        },
      ],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostFixture.detectChanges();
    cloudLayerDebug = hostFixture.debugElement.query(
      By.directive(CloudLayerComponent)
    );
    cloudLayerComponent = cloudLayerDebug.componentInstance;
  });

  afterEach(() => {
    hostFixture?.destroy();
  });

  it('should create', () => {
    expect(cloudLayerComponent).toBeTruthy();
  });

  it('should have default configuration values', () => {
    expect(cloudLayerComponent.cloudCount()).toBe(4000);
    expect(cloudLayerComponent.planeSize()).toBe(64);
    expect(cloudLayerComponent.fogColor()).toBe('#4584b4');
    expect(cloudLayerComponent.speed()).toBe(0.03);
    expect(cloudLayerComponent.mouseParallax()).toBe(true);
  });

  it('should have required textureUrl input set', () => {
    expect(cloudLayerComponent.textureUrl()).toBe('/test-cloud.png');
  });
});
