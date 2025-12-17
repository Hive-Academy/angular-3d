import { TestBed } from '@angular/core/testing';
import { Text3DComponent } from './text-3d.component';
import { NG_3D_PARENT } from '../types/tokens';
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// Mock FontLoader
jest.mock('three/addons/loaders/FontLoader.js', () =&gt; {
  return {
    FontLoader: jest.fn().mockImplementation(() =&gt; {
      return {
        load: jest.fn((url, onLoad, onProgress, onError) =&gt; {
          // Simulate successful font load
          const mockFont = {
            data: {
              glyphs: {},
            },
            generateShapes: jest.fn(),
          };
          onLoad(mockFont);
        }),
      };
    }),
  };
});

describe('Text3DComponent', () =&gt; {
  let mockParent: THREE.Object3D;
  let mockParentFn: () =&gt; THREE.Object3D;

  beforeEach(() =&gt; {
    // Create mock parent
    mockParent = new THREE.Group();
    mockParentFn = jest.fn(() =&gt; mockParent);

    TestBed.configureTestingModule({
      providers: [
        Text3DComponent,
        { provide: NG_3D_PARENT, useValue: mockParentFn },
      ],
    });
  });

  it('should create', () =&gt; {
    const component = TestBed.inject(Text3DComponent);
    expect(component).toBeTruthy();
  });

  it('should inject NG_3D_PARENT', () =&gt; {
    const component = TestBed.inject(Text3DComponent);
    expect(mockParentFn).toBeDefined();
  });

  it('should create material in ngOnInit', () =&gt; {
    const component = TestBed.inject(Text3DComponent);
    component.ngOnInit();
    expect(component['material']).toBeDefined();
    expect(component['material']).toBeInstanceOf(THREE.MeshStandardMaterial);
  });

  it('should load font and create mesh', (done) =&gt; {
    const component = TestBed.inject(Text3DComponent);
    component.ngOnInit();

    // FontLoader mock calls onLoad synchronously
    setTimeout(() =&gt; {
      expect(component['mesh']).toBeDefined();
      expect(component['mesh']).toBeInstanceOf(THREE.Mesh);
      expect(component['geometry']).toBeDefined();
      done();
    }, 10);
  });

  it('should add mesh to parent after font loads', (done) =&gt; {
    const component = TestBed.inject(Text3DComponent);
    component.ngOnInit();

    setTimeout(() =&gt; {
      expect(mockParent.children.length).toBeGreaterThan(0);
      done();
    }, 10);
  });

  it('should dispose geometry and material on destroy', (done) =&gt; {
    const component = TestBed.inject(Text3DComponent);
    component.ngOnInit();

    setTimeout(() =&gt; {
      const geometry = component['geometry'];
      const material = component['material'];

      const geometryDisposeSpy = jest.spyOn(geometry!, 'dispose');
      const materialDisposeSpy = jest.spyOn(material, 'dispose');

      component.ngOnDestroy();

      expect(geometryDisposeSpy).toHaveBeenCalled();
      expect(materialDisposeSpy).toHaveBeenCalled();
      done();
    }, 10);
  });

  it('should remove mesh from parent on destroy', (done) =&gt; {
    const component = TestBed.inject(Text3DComponent);
    component.ngOnInit();

    setTimeout(() =&gt; {
      const childrenCount = mockParent.children.length;
      expect(childrenCount).toBeGreaterThan(0);

      component.ngOnDestroy();

      expect(mockParent.children.length).toBe(0);
      done();
    }, 10);
  });
});
