import { TestBed } from '@angular/core/testing';
import { StarFieldComponent } from './star-field.component';
import { NG_3D_PARENT } from '../types/tokens';
import * as THREE from 'three';

describe('StarFieldComponent', () => {
  let mockParent: THREE.Object3D;
  let mockParentFn: () => THREE.Object3D;

  beforeEach(() => {
    // Create mock parent
    mockParent = new THREE.Group();
    mockParentFn = jest.fn(() => mockParent);

    TestBed.configureTestingModule({
      providers: [
        StarFieldComponent,
        { provide: NG_3D_PARENT, useValue: mockParentFn },
      ],
    });
  });

  it('should create', () => {
    const component = TestBed.inject(StarFieldComponent);
    expect(component).toBeTruthy();
  });

  it('should inject NG_3D_PARENT', () => {
    const component = TestBed.inject(StarFieldComponent);
    expect(mockParentFn).toBeDefined();
  });

  it('should create Points object in ngOnInit', () => {
    const component = TestBed.inject(StarFieldComponent);
    component.ngOnInit();

    expect(mockParent.children.length).toBe(1);
    expect(mockParent.children[0]).toBeInstanceOf(THREE.Points);
  });

  it('should create BufferGeometry with position attribute', () => {
    const component = TestBed.inject(StarFieldComponent);
    component.ngOnInit();

    const points = mockParent.children[0] as THREE.Points;
    const geometry = points.geometry as THREE.BufferGeometry;

    expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
    expect(geometry.attributes['position']).toBeDefined();
    expect(geometry.attributes['position'].count).toBe(component.starCount());
  });

  it('should create PointsMaterial with correct properties', () => {
    const component = TestBed.inject(StarFieldComponent);
    component.ngOnInit();

    const points = mockParent.children[0] as THREE.Points;
    const material = points.material as THREE.PointsMaterial;

    expect(material).toBeInstanceOf(THREE.PointsMaterial);
    expect(material.transparent).toBe(true);
    expect(material.sizeAttenuation).toBe(true);
    expect(material.depthWrite).toBe(false);
    expect(material.size).toBe(component.size());
    expect(material.opacity).toBe(component.opacity());
  });

  it('should set frustumCulled to false', () => {
    const component = TestBed.inject(StarFieldComponent);
    component.ngOnInit();

    const points = mockParent.children[0] as THREE.Points;
    expect(points.frustumCulled).toBe(false);
  });

  it('should add Points to parent', () => {
    const component = TestBed.inject(StarFieldComponent);
    component.ngOnInit();

    expect(mockParentFn).toHaveBeenCalled();
    expect(mockParent.children.length).toBe(1);
  });

  it('should dispose geometry and material on destroy', () => {
    const component = TestBed.inject(StarFieldComponent);
    component.ngOnInit();

    const points = mockParent.children[0] as THREE.Points;
    const geometry = points.geometry as THREE.BufferGeometry;
    const material = points.material as THREE.PointsMaterial;

    const disposeSpy = jest.spyOn(geometry, 'dispose');
    const materialDisposeSpy = jest.spyOn(material, 'dispose');

    component.ngOnDestroy();

    expect(disposeSpy).toHaveBeenCalled();
    expect(materialDisposeSpy).toHaveBeenCalled();
    expect(mockParent.children.length).toBe(0);
  });

  it('should generate correct number of star positions', () => {
    const component = TestBed.inject(StarFieldComponent);
    component.ngOnInit();

    const points = mockParent.children[0] as THREE.Points;
    const geometry = points.geometry as THREE.BufferGeometry;
    const positions = geometry.attributes['position'];

    // Each star has 3 coordinates (x, y, z)
    expect(positions.count).toBe(component.starCount());
    expect(positions.array.length).toBe(component.starCount() * 3);
  });
});
