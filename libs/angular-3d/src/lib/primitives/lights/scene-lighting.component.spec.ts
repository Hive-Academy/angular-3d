import { TestBed } from '@angular/core/testing';
import { SceneLightingComponent } from './scene-lighting.component';
import { NG_3D_PARENT } from '../../types/tokens';
import * as THREE from 'three';

describe('SceneLightingComponent', () => {
  let mockParent: THREE.Object3D;
  let mockParentFn: () => THREE.Object3D;

  beforeEach(() => {
    mockParent = new THREE.Group();
    mockParentFn = jest.fn(() => mockParent);

    TestBed.configureTestingModule({
      providers: [
        SceneLightingComponent,
        { provide: NG_3D_PARENT, useValue: mockParentFn },
      ],
    });
  });

  it('should create', () => {
    const component = TestBed.inject(SceneLightingComponent);
    expect(component).toBeTruthy();
  });

  it('should inject NG_3D_PARENT', () => {
    const component = TestBed.inject(SceneLightingComponent);
    expect(mockParentFn).toBeDefined();
  });

  it('should use studio preset by default', () => {
    const component = TestBed.inject(SceneLightingComponent);
    expect(component.preset()).toBe('studio');
  });

  it('should create ambient light for studio preset', () => {
    const component = TestBed.inject(SceneLightingComponent);
    component.ngOnInit();

    const ambientLight = mockParent.children.find(
      (child) => child instanceof THREE.AmbientLight
    );
    expect(ambientLight).toBeDefined();
    expect(ambientLight).toBeInstanceOf(THREE.AmbientLight);
  });

  it('should create 2 directional lights for studio preset', () => {
    const component = TestBed.inject(SceneLightingComponent);
    component.ngOnInit();

    const directionalLights = mockParent.children.filter(
      (child) => child instanceof THREE.DirectionalLight
    );
    expect(directionalLights.length).toBe(2);
  });

  it('should dispose all lights on destroy', () => {
    const component = TestBed.inject(SceneLightingComponent);
    component.ngOnInit();

    const initialChildCount = mockParent.children.length;
    expect(initialChildCount).toBeGreaterThan(0);

    component.ngOnDestroy();

    expect(mockParent.children.length).toBe(0);
  });

  it('should apply ambient intensity override', () => {
    const component = TestBed.inject(SceneLightingComponent);
    component.ngOnInit();

    const ambientLight = mockParent.children.find(
      (child) => child instanceof THREE.AmbientLight
    ) as THREE.AmbientLight;

    expect(ambientLight).toBeDefined();
    // Default studio ambient intensity is 0.4
    expect(ambientLight.intensity).toBe(0.4);
  });
});
