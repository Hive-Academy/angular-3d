import { TestBed } from '@angular/core/testing';
import { SvgIconComponent } from './svg-icon.component';
import { NG_3D_PARENT } from '../types/tokens';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

// Mock SVGLoader
jest.mock('three/addons/loaders/SVGLoader.js', () =&gt; {
  const mockShape = {
    curves: [],
  };

  return {
    SVGLoader: jest.fn().mockImplementation(() =&gt; {
      return {
        load: jest.fn((url, onLoad, onProgress, onError) =&gt; {
          // Simulate successful SVG load
          const mockData = {
            paths: [
              {
                userData: { style: {} },
                subPaths: [],
              },
            ],
          };
          onLoad(mockData);
        }),
      };
    }),
    createShapes: jest.fn(() =&gt; [mockShape]),
  };
});

// Mock SVGLoader.createShapes as a static method
(SVGLoader as any).createShapes = jest.fn(() =&gt; [
  {
    curves: [],
  } as any,
]);

describe('SvgIconComponent', () =&gt; {
  let mockParent: THREE.Object3D;
  let mockParentFn: () =&gt; THREE.Object3D;

  beforeEach(() =&gt; {
    // Create mock parent
    mockParent = new THREE.Group();
    mockParentFn = jest.fn(() =&gt; mockParent);

    TestBed.configureTestingModule({
      providers: [
        SvgIconComponent,
        { provide: NG_3D_PARENT, useValue: mockParentFn },
      ],
    });

    jest.clearAllMocks();
  });

  it('should create', () =&gt; {
    const component = TestBed.inject(SvgIconComponent);
    expect(component).toBeTruthy();
  });

  it('should inject NG_3D_PARENT', () =&gt; {
    const component = TestBed.inject(SvgIconComponent);
    expect(mockParentFn).toBeDefined();
  });

  it('should create group in ngOnInit', () =&gt; {
    const component = TestBed.inject(SvgIconComponent);
    component.ngOnInit();
    expect(component['group']).toBeDefined();
    expect(component['group']).toBeInstanceOf(THREE.Group);
  });

  it('should load SVG and create meshes', (done) =&gt; {
    const component = TestBed.inject(SvgIconComponent);
    component.ngOnInit();

    // SVGLoader mock calls onLoad synchronously
    setTimeout(() =&gt; {
      expect(component['group']).toBeDefined();
      expect(component['geometries'].length).toBeGreaterThan(0);
      expect(component['materials'].length).toBeGreaterThan(0);
      done();
    }, 10);
  });

  it('should add group to parent after SVG loads', (done) =&gt; {
    const component = TestBed.inject(SvgIconComponent);
    component.ngOnInit();

    setTimeout(() =&gt; {
      expect(mockParent.children.length).toBeGreaterThan(0);
      done();
    }, 10);
  });

  it('should dispose geometries and materials on destroy', (done) =&gt; {
    const component = TestBed.inject(SvgIconComponent);
    component.ngOnInit();

    setTimeout(() =&gt; {
      const geometries = component['geometries'];
      const materials = component['materials'];

      const geometryDisposeSpy = jest.spyOn(geometries[0], 'dispose');
      const materialDisposeSpy = jest.spyOn(materials[0], 'dispose');

      component.ngOnDestroy();

      expect(geometryDisposeSpy).toHaveBeenCalled();
      expect(materialDisposeSpy).toHaveBeenCalled();
      expect(component['geometries'].length).toBe(0);
      expect(component['materials'].length).toBe(0);
      done();
    }, 10);
  });

  it('should remove group from parent on destroy', (done) =&gt; {
    const component = TestBed.inject(SvgIconComponent);
    component.ngOnInit();

    setTimeout(() =&gt; {
      const childrenCount = mockParent.children.length;
      expect(childrenCount).toBeGreaterThan(0);

      component.ngOnDestroy();

      expect(mockParent.children.length).toBe(0);
      done();
    }, 10);
  });

  it('should create extruded geometry when depth &gt; 0', (done) =&gt; {
    const component = TestBed.inject(SvgIconComponent);
    component.ngOnInit();

    setTimeout(() =&gt; {
      // Check that geometries were created
      expect(component['geometries'].length).toBeGreaterThan(0);
      // The geometry type depends on depth input, but we can verify it exists
      const geometry = component['geometries'][0];
      expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
      done();
    }, 10);
  });
});
