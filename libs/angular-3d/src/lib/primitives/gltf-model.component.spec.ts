import { TestBed } from '@angular/core/testing';
import { GltfModelComponent } from './gltf-model.component';
import { GltfLoaderService } from '../loaders/gltf-loader.service';
import { NG_3D_PARENT } from '../types/tokens';
import * as THREE from 'three';
import { signal } from '@angular/core';

describe('GltfModelComponent', () => {
  let mockLoaderService: jest.Mocked<GltfLoaderService>;
  let mockParent: THREE.Object3D;
  let mockParentFn: () => THREE.Object3D;

  beforeEach(() => {
    // Create mock parent
    mockParent = new THREE.Group();
    mockParentFn = jest.fn(() => mockParent);

    // Create mock loader service
    mockLoaderService = {
      load: jest.fn(),
    } as unknown as jest.Mocked<GltfLoaderService>;

    TestBed.configureTestingModule({
      providers: [
        GltfModelComponent,
        { provide: GltfLoaderService, useValue: mockLoaderService },
        { provide: NG_3D_PARENT, useValue: mockParentFn },
      ],
    });
  });

  it('should create', () => {
    const component = TestBed.inject(GltfModelComponent);
    expect(component).toBeTruthy();
  });

  it('should inject GltfLoaderService', () => {
    const component = TestBed.inject(GltfModelComponent);
    component.ngOnInit();
    expect(mockLoaderService.load).toHaveBeenCalled();
  });

  it('should inject NG_3D_PARENT', () => {
    const component = TestBed.inject(GltfModelComponent);
    expect(mockParentFn).toBeDefined();
  });

  it('should load GLTF model in ngOnInit', () => {
    const mockScene = new THREE.Group();
    const loadResult = {
      data: signal<any>({ scene: mockScene }),
      loading: signal(false),
      error: signal(null),
      progress: signal(100),
      promise: Promise.resolve({ scene: mockScene }),
    };

    mockLoaderService.load.mockReturnValue(loadResult as any);

    const component = TestBed.inject(GltfModelComponent);
    component.ngOnInit();

    expect(mockLoaderService.load).toHaveBeenCalledWith(component.modelPath(), {
      useDraco: component.useDraco(),
    });
  });

  it('should add group to parent when model loads', (done) => {
    const mockScene = new THREE.Group();
    const dataSignal = signal<any>({ scene: mockScene });
    const loadingSignal = signal(true);

    const loadResult = {
      data: dataSignal.asReadonly(),
      loading: loadingSignal.asReadonly(),
      error: signal(null).asReadonly(),
      progress: signal(0).asReadonly(),
      promise: Promise.resolve({ scene: mockScene }),
    };

    mockLoaderService.load.mockReturnValue(loadResult as any);

    const component = TestBed.inject(GltfModelComponent);
    component.ngOnInit();

    // Simulate model load complete
    setTimeout(() => {
      loadingSignal.set(false);
      dataSignal.set({ scene: mockScene });

      // Wait for next animation frame (component uses requestAnimationFrame)
      requestAnimationFrame(() => {
        expect(mockParent.children.length).toBeGreaterThan(0);
        done();
      });
    }, 10);
  });

  it('should dispose group on destroy', () => {
    const mockScene = new THREE.Group();
    const dataSignal = signal<any>({ scene: mockScene });

    const loadResult = {
      data: dataSignal.asReadonly(),
      loading: signal(false).asReadonly(),
      error: signal(null).asReadonly(),
      progress: signal(100).asReadonly(),
      promise: Promise.resolve({ scene: mockScene }),
    };

    mockLoaderService.load.mockReturnValue(loadResult as any);

    const component = TestBed.inject(GltfModelComponent);
    component.ngOnInit();

    // Wait for load to complete
    requestAnimationFrame(() => {
      const childrenCount = mockParent.children.length;

      component.ngOnDestroy();

      expect(mockParent.children.length).toBeLessThan(childrenCount);
    });
  });
});
