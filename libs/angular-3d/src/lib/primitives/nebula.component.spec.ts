import { TestBed } from '@angular/core/testing';
import { NebulaComponent } from './nebula.component';
import { NG_3D_PARENT } from '../types/tokens';
import * as THREE from 'three';

describe('NebulaComponent', () => {
  let mockParent: THREE.Object3D;
  let mockParentFn: () => THREE.Object3D;

  beforeEach(() => {
    // Create mock parent
    mockParent = new THREE.Group();
    mockParentFn = jest.fn(() => mockParent);

    TestBed.configureTestingModule({
      providers: [
        NebulaComponent,
        { provide: NG_3D_PARENT, useValue: mockParentFn },
      ],
    });
  });

  it('should create', () => {
    const component = TestBed.inject(NebulaComponent);
    expect(component).toBeTruthy();
  });

  it('should create Group in ngOnInit', () => {
    const component = TestBed.inject(NebulaComponent);
    component.ngOnInit();

    expect(mockParent.children.length).toBe(1);
    expect(mockParent.children[0]).toBeInstanceOf(THREE.Group);
  });

  it('should create sprites based on cloudCount', () => {
    const component = TestBed.inject(NebulaComponent);
    component.ngOnInit();

    const group = mockParent.children[0] as THREE.Group;
    expect(group.children.length).toBe(component.cloudCount());

    // All children should be sprites
    const allSprites = group.children.every(
      (child) => child instanceof THREE.Sprite
    );
    expect(allSprites).toBe(true);
  });

  it('should generate canvas texture', () => {
    const component = TestBed.inject(NebulaComponent);
    component.ngOnInit();

    const group = mockParent.children[0] as THREE.Group;
    const sprite = group.children[0] as THREE.Sprite;
    const material = sprite.material as THREE.SpriteMaterial;

    expect(material.map).toBeDefined();
    expect(material.map).toBeInstanceOf(THREE.CanvasTexture);
  });

  it('should use additive blending', () => {
    const component = TestBed.inject(NebulaComponent);
    component.ngOnInit();

    const group = mockParent.children[0] as THREE.Group;
    const sprite = group.children[0] as THREE.Sprite;
    const material = sprite.material as THREE.SpriteMaterial;

    expect(material.blending).toBe(THREE.AdditiveBlending);
    expect(material.transparent).toBe(true);
    expect(material.depthWrite).toBe(false);
  });

  it('should vary sprite sizes between min and max', () => {
    const component = TestBed.inject(NebulaComponent);
    component.ngOnInit();

    const group = mockParent.children[0] as THREE.Group;
    const minSize = component.minSize();
    const maxSize = component.maxSize();

    // Check that all sprites have sizes in the expected range
    for (const child of group.children) {
      const sprite = child as THREE.Sprite;
      expect(sprite.scale.x).toBeGreaterThanOrEqual(minSize);
      expect(sprite.scale.x).toBeLessThanOrEqual(maxSize);
      expect(sprite.scale.y).toBeGreaterThanOrEqual(minSize);
      expect(sprite.scale.y).toBeLessThanOrEqual(maxSize);
    }
  });

  it('should add group to parent', () => {
    const component = TestBed.inject(NebulaComponent);
    component.ngOnInit();

    expect(mockParentFn).toHaveBeenCalled();
    expect(mockParent.children.length).toBe(1);
  });

  it('should dispose sprites, materials, and texture on destroy', () => {
    const component = TestBed.inject(NebulaComponent);
    component.ngOnInit();

    const group = mockParent.children[0] as THREE.Group;
    const sprite = group.children[0] as THREE.Sprite;
    const material = sprite.material as THREE.SpriteMaterial;
    const texture = material.map as THREE.Texture;

    const materialDisposeSpy = jest.spyOn(material, 'dispose');
    const textureDisposeSpy = jest.spyOn(texture, 'dispose');

    component.ngOnDestroy();

    expect(materialDisposeSpy).toHaveBeenCalled();
    expect(textureDisposeSpy).toHaveBeenCalled();
    expect(mockParent.children.length).toBe(0);
  });
});
