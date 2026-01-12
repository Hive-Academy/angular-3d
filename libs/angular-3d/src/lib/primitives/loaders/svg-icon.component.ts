import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
  afterNextRender,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { NG_3D_PARENT } from '../../types/tokens';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { SceneGraphStore } from '../../store/scene-graph.store';

@Component({
  selector: 'a3d-svg-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `svg-icon-${crypto.randomUUID()}`,
    },
  ],
})
export class SvgIconComponent implements OnDestroy {
  // Transformation inputs
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<number | [number, number, number]>(1);

  // SVG inputs
  public readonly svgPath = input.required<string>();
  public readonly depth = input<number>(0.1);
  public readonly center = input<boolean>(true);
  public readonly flipY = input<boolean>(true);

  // Bevel options for extrusion
  public readonly bevelEnabled = input<boolean>(false);
  public readonly bevelThickness = input<number>(0.02);
  public readonly bevelSize = input<number>(0.01);

  // Material inputs
  public readonly color = input<string | number | undefined>(undefined);
  public readonly useNativeColors = input<boolean>(true);
  public readonly metalness = input<number>(0.7);
  public readonly roughness = input<number>(0.2);
  public readonly emissive = input<string | number>(0x000000);
  public readonly emissiveIntensity = input<number>(0);

  // Three.js objects
  private group: THREE.Group | null = null;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.MeshStandardNodeMaterial[] = [];

  // Parent injection
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID, { optional: true });

  // SVG loader
  private readonly svgLoader = new SVGLoader();

  public constructor() {
    // Reactive effects for transforms
    effect(() => {
      if (this.group) {
        this.group.position.set(...this.position());
      }
    });
    effect(() => {
      if (this.group) {
        this.group.rotation.set(...this.rotation());
      }
    });
    effect(() => {
      if (this.group) {
        this.updateGroupScale();
      }
    });
    // Material update effect
    effect(() => {
      if (this.materials.length > 0) {
        const metalness = this.metalness();
        const roughness = this.roughness();
        const emissive = this.emissive();
        const emissiveIntensity = this.emissiveIntensity();

        this.materials.forEach((material) => {
          material.metalness = metalness;
          material.roughness = roughness;
          material.emissive = new THREE.Color(emissive);
          material.emissiveIntensity = emissiveIntensity;
          material.needsUpdate = true;
        });
      }
    });

    // Initialize group after first render
    afterNextRender(() => {
      this.group = new THREE.Group();
      this.group.position.set(...this.position());
      this.group.rotation.set(...this.rotation());
      const s = this.scale();
      const scale: [number, number, number] =
        typeof s === 'number' ? [s, s, s] : s;
      this.group.scale.set(scale[0], scale[1], scale[2]);

      // Register with SceneGraphStore for directive access (e.g., MouseTracking3dDirective)
      if (this.objectId) {
        this.sceneStore.register(this.objectId, this.group, 'group');
      }

      // Add to parent
      if (this.parentFn) {
        const parent = this.parentFn();
        if (parent) {
          parent.add(this.group);
        } else {
          console.warn('SvgIconComponent: Parent not ready');
        }
      } else {
        console.warn('SvgIconComponent: No parent found');
      }
    });

    // Reactive effect for SVG loading and processor
    effect((onCleanup) => {
      const svgPath = this.svgPath();
      const options = {
        depth: this.depth(),
        center: this.center(),
        flipY: this.flipY(),
        bevelEnabled: this.bevelEnabled(),
        bevelThickness: this.bevelThickness(),
        bevelSize: this.bevelSize(),
      };

      this.loadAndProcessSvg(svgPath, options);

      onCleanup(() => {
        this.disposeGroupResources();
      });
    });
  }

  private loadAndProcessSvg(
    svgPath: string,
    options: {
      depth: number;
      center: boolean;
      flipY: boolean;
      bevelEnabled: boolean;
      bevelThickness: number;
      bevelSize: number;
    }
  ): void {
    this.svgLoader.load(
      svgPath,
      (data) => {
        // Clear previous children and resources first (though onCleanup handles disposal, we need to clear children)
        this.disposeGroupResources(); // Ensure clean slate
        this.group?.clear(); // Remove children from group

        // Create extrude settings
        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
          depth: options.depth,
          bevelEnabled: options.bevelEnabled,
          bevelThickness: options.bevelThickness,
          bevelSize: options.bevelSize,
        };

        // Process SVG paths
        data.paths.forEach((path) => {
          const shapes = SVGLoader.createShapes(path);

          // Get fill color from SVG path (if useNativeColors is enabled)
          const nativeFillColor = path.userData?.['style']?.['fill'];
          const useNative =
            this.useNativeColors() &&
            nativeFillColor &&
            nativeFillColor !== 'none';
          const colorToUse = useNative
            ? nativeFillColor
            : this.color() ?? 0xffd700; // Default gold if no color specified

          shapes.forEach((shape) => {
            let geometry: THREE.BufferGeometry;

            if (options.depth > 0) {
              geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            } else {
              geometry = new THREE.ShapeGeometry(shape);
            }

            // Create material with NodeMaterial pattern (direct property assignment)
            const material = new THREE.MeshStandardNodeMaterial();
            material.color = new THREE.Color(colorToUse);
            material.metalness = this.metalness();
            material.roughness = this.roughness();
            material.emissive = new THREE.Color(this.emissive());
            material.emissiveIntensity = this.emissiveIntensity();

            const mesh = new THREE.Mesh(geometry, material);
            if (this.group) {
              this.group.add(mesh);
            }

            // Store for disposal
            this.geometries.push(geometry);
            this.materials.push(material);
          });
        });

        // Center the group if requested
        if (options.center) {
          this.centerGroup();
        }

        // Flip Y-axis (SVG coordinate system is inverted)
        // Note: We apply this to the group scale which is already managed by transform effect.
        // To avoid conflict, we should probably apply this inside the geometry or a wrapper.
        // However, sticking to current logic: we modify the local Y scale multiplier.
        // BUT, since we have a transform effect watching this.scale(), modifying group.scale here will be overwritten.
        // FIX: The transform effect sets the base scale. We need to multiply Y by -1 if flipY is true.
        // Let's rely on the transform effect to handle the flip logic if we can, OR simply update it here
        // and acknowledge it might glitch if scale changes rapidly.
        // BETTER: Update the transform effect to include flipY logic. Let's do that in a separate fix.
        // For now, since effects run after this, let's keep the existing logic but knowing 'flipY' is watched by effect in refactor?
        // Actually, the transform effect in constructor watches 'flipY' via 'this.scale()' logic? No, it watches this.scale().
        // We should update the scale effect to account for flipY.
        this.updateGroupScale();
      },
      undefined,
      (error) => {
        console.error('SvgIconComponent: SVG loading error:', error);
      }
    );
  }

  // Update scale effect logic helper
  private updateGroupScale(): void {
    if (this.group) {
      const s = this.scale();
      const scale: [number, number, number] =
        typeof s === 'number' ? [s, s, s] : s;
      const flipMult = this.flipY() ? -1 : 1;
      this.group.scale.set(scale[0], scale[1] * flipMult, scale[2]);
    }
  }

  private centerGroup(): void {
    if (!this.group) return;

    const box = new THREE.Box3().setFromObject(this.group);
    const center = box.getCenter(new THREE.Vector3());

    // Offset all children
    this.group.children.forEach((child) => {
      child.position.sub(center);
    });
  }

  private disposeGroupResources(): void {
    // Dispose geometries and materials
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());

    // Clear arrays
    this.geometries = [];
    this.materials = [];
  }

  public ngOnDestroy(): void {
    if (this.parentFn && this.group) {
      const parent = this.parentFn();
      parent?.remove(this.group);
    }
    this.disposeGroupResources();
  }
}
