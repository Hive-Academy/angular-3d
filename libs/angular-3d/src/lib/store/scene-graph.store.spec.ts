import { TestBed } from '@angular/core/testing';
import * as THREE from 'three/webgpu';
import { SceneGraphStore } from './scene-graph.store';

describe('SceneGraphStore', () => {
  let store: SceneGraphStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SceneGraphStore],
    });
    store = TestBed.inject(SceneGraphStore);
  });

  describe('update() before register() (late-registration race)', () => {
    it('applies a transform queued BEFORE a group registers (a3d-group race)', () => {
      const id = 'group-1';

      // Transform arrives before the THREE.Group exists (TransformDirective
      // effect runs before GroupDirective's afterNextRender registration)
      store.update(id, {
        position: [1, 2, 3],
        rotation: [0.1, 0.2, 0.3],
        scale: [2, 2, 2],
      });

      const group = new THREE.Group();
      expect(store.hasObject(id)).toBe(false);

      store.register(id, group, 'group');

      expect(group.position.toArray()).toEqual([1, 2, 3]);
      expect(group.rotation.x).toBeCloseTo(0.1);
      expect(group.rotation.y).toBeCloseTo(0.2);
      expect(group.rotation.z).toBeCloseTo(0.3);
      expect(group.scale.toArray()).toEqual([2, 2, 2]);
    });

    it('applies a transform queued BEFORE a mesh registers', () => {
      const id = 'mesh-1';
      store.update(id, { position: [5, 0, -10] });

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );
      store.register(id, mesh, 'mesh');

      expect(mesh.position.toArray()).toEqual([5, 0, -10]);
    });

    it('merges multiple queued updates, last write wins per property', () => {
      const id = 'group-2';
      store.update(id, { position: [1, 1, 1], scale: [3, 3, 3] });
      store.update(id, { position: [9, 9, 9] });

      const group = new THREE.Group();
      store.register(id, group, 'group');

      expect(group.position.toArray()).toEqual([9, 9, 9]);
      // scale from the first update must survive the merge
      expect(group.scale.toArray()).toEqual([3, 3, 3]);
    });

    it('queues material props alongside transforms', () => {
      const id = 'mesh-2';
      store.update(
        id,
        { position: [0, 4, 0] },
        { opacity: 0.5, transparent: true }
      );

      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material);
      store.register(id, mesh, 'mesh');

      expect(mesh.position.toArray()).toEqual([0, 4, 0]);
      expect(material.opacity).toBe(0.5);
      expect(material.transparent).toBe(true);
    });

    it('does NOT leak queued updates to a re-registration after remove()', () => {
      const id = 'group-3';
      store.update(id, { position: [7, 7, 7] });
      store.remove(id); // removal clears pending updates

      const group = new THREE.Group();
      store.register(id, group, 'group');

      expect(group.position.toArray()).toEqual([0, 0, 0]);
    });
  });

  describe('update() after register() (regression)', () => {
    it('applies transforms immediately to registered objects', () => {
      const id = 'mesh-3';
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );
      store.register(id, mesh, 'mesh');

      store.update(id, { position: [1, 2, 3], scale: [0.5, 0.5, 0.5] });

      expect(mesh.position.toArray()).toEqual([1, 2, 3]);
      expect(mesh.scale.toArray()).toEqual([0.5, 0.5, 0.5]);
    });

    it('applies later input changes after a queued initial transform', () => {
      const id = 'group-4';
      // initial value queued pre-registration
      store.update(id, { position: [1, 1, 1] });

      const group = new THREE.Group();
      store.register(id, group, 'group');
      expect(group.position.toArray()).toEqual([1, 1, 1]);

      // later input change applies directly
      store.update(id, { position: [-4, 8, 2] });
      expect(group.position.toArray()).toEqual([-4, 8, 2]);
    });
  });

  describe('registration basics', () => {
    it('registers objects into the registry even before scene init', () => {
      const id = 'mesh-4';
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );

      expect(store.register(id, mesh, 'mesh')).toBe(true);
      expect(store.hasObject(id)).toBe(true);
      expect(store.getObject(id)).toBe(mesh);
    });
  });
});
