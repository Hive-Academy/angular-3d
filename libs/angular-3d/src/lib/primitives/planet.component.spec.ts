import { TestBed } from '@angular/core/testing';
import { PlanetComponent } from './planet.component';
import { NG_3D_PARENT } from '../types/tokens';
import * as THREE from 'three';

// Mock injectTextureLoader
jest.mock('../loaders/inject-texture-loader', () => ({
  injectTextureLoader: jest.fn(() => ({
    data: () => null,
    loading: () => false,
    error: () => null,
    progress: () => 100,
  })),
}));

describe('PlanetComponent', () => {
  let mockParent: THREE.Object3D;
  let mockParentFn: () => THREE.Object3D;

  beforeEach(() => {
    // Create mock parent
    mockParent = new THREE.Group();
    mockParentFn = jest.fn(() => mockParent);

    TestBed.configureTestingModule({
      providers: [
        PlanetComponent,
        { provide: NG_3D_PARENT, useValue: mockParentFn },
      ],
    });
  });

  it('should create', () => {
    const component = TestBed.inject(PlanetComponent);
    expect(component).toBeTruthy();
  });

  it('should create SphereGeometry in ngOnInit', () => {
    const component = TestBed.inject(PlanetComponent);
    component.ngOnInit();

    const mesh = mockParent.children.find(
      (child) => child instanceof THREE.Mesh
    ) as THREE.Mesh;
    expect(mesh).toBeDefined();
    expect(mesh.geometry).toBeInstanceOf(THREE.SphereGeometry);
  });

  it('should create MeshStandardMaterial', () => {
    const component = TestBed.inject(PlanetComponent);
    component.ngOnInit();

    const mesh = mockParent.children.find(
      (child) => child instanceof THREE.Mesh
    ) as THREE.Mesh;
    expect(mesh.material).toBeInstanceOf(THREE.MeshStandardMaterial);
  });

  it('should enable shadow casting and receiving', () => {
    const component = TestBed.inject(PlanetComponent);
    component.ngOnInit();

    const mesh = mockParent.children.find(
      (child) => child instanceof THREE.Mesh
    ) as THREE.Mesh;
    expect(mesh.castShadow).toBe(true);
    expect(mesh.receiveShadow).toBe(true);
  });

  it('should create PointLight when glowIntensity > 0', () => {
    TestBed.overrideProvider(PlanetComponent, {
      useFactory: () => {
        const component = new PlanetComponent();
        // Set glow intensity before init
        Object.defineProperty(component, 'glowIntensity', {
          value: () => 1.5,
        });
        return component;
      },
    });

    const component = TestBed.inject(PlanetComponent);
    component.ngOnInit();

    const light = mockParent.children.find(
      (child) => child instanceof THREE.PointLight
    );
    expect(light).toBeDefined();
  });

  it('should not create PointLight when glowIntensity = 0', () => {
    const component = TestBed.inject(PlanetComponent);
    component.ngOnInit();

    const light = mockParent.children.find(
      (child) => child instanceof THREE.PointLight
    );
    expect(light).toBeUndefined();
  });

  it('should add mesh to parent', () => {
    const component = TestBed.inject(PlanetComponent);
    component.ngOnInit();

    expect(mockParentFn).toHaveBeenCalled();
    const meshCount = mockParent.children.filter(
      (child) => child instanceof THREE.Mesh
    ).length;
    expect(meshCount).toBe(1);
  });

  it('should dispose geometry, material, and light on destroy', () => {
    const component = TestBed.inject(PlanetComponent);
    component.ngOnInit();

    const mesh = mockParent.children.find(
      (child) => child instanceof THREE.Mesh
    ) as THREE.Mesh;
    const geometry = mesh.geometry;
    const material = mesh.material as THREE.Material;

    const geometryDisposeSpy = jest.spyOn(geometry, 'dispose');
    const materialDisposeSpy = jest.spyOn(material, 'dispose');

    component.ngOnDestroy();

    expect(geometryDisposeSpy).toHaveBeenCalled();
    expect(materialDisposeSpy).toHaveBeenCalled();
    expect(mockParent.children.length).toBe(0);
  });
});
