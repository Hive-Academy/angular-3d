/**
 * NewpassiveNetworkArcsComponent - Glowing network connection arcs over the Earth
 *
 * Scene composition component (demo app) following the library's NG_3D_PARENT
 * pattern. Builds glowing bezier arcs between random points on the visible cap
 * of the Earth sphere, with node markers at endpoints and particles that travel
 * along each arc (additive blending so they feed the bloom pass).
 */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { NG_3D_PARENT, RenderLoopService } from '@hive-academy/angular-3d';
import * as THREE from 'three/webgpu';

interface ArcParticle {
  sprite: THREE.Sprite;
  curveIndex: number;
  offset: number;
  speed: number;
}

@Component({
  selector: 'app-newpassive-network-arcs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class NewpassiveNetworkArcsComponent {
  /** Center of the Earth sphere the arcs wrap over */
  public readonly earthCenter = input<[number, number, number]>([0, 0, 0]);

  /** Radius of the Earth sphere */
  public readonly earthRadius = input<number>(14);

  /** Number of connection arcs */
  public readonly arcCount = input<number>(8);

  /** Neon palette used for arcs/particles */
  public readonly colors = input<string[]>(['#a855f7', '#38bdf8', '#ec4899']);

  /** Travelling particles per arc */
  public readonly particlesPerArc = input<number>(2);

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly group = new THREE.Group();
  private curves: THREE.QuadraticBezierCurve3[] = [];
  private particles: ArcParticle[] = [];
  private glowTexture: THREE.CanvasTexture | null = null;
  private elapsed = 0;

  public constructor() {
    afterNextRender(() => {
      const parent = this.parentFn?.();
      if (!parent) {
        return;
      }

      this.build();
      parent.add(this.group);

      const cleanup = this.renderLoop.registerUpdateCallback((delta) => {
        this.elapsed += delta;
        for (const p of this.particles) {
          const t = (p.offset + this.elapsed * p.speed) % 1;
          p.sprite.position.copy(this.curves[p.curveIndex].getPoint(t));
          // Fade in/out at endpoints so particles don't pop
          const edgeFade = Math.min(1, Math.min(t, 1 - t) * 6);
          (p.sprite.material as THREE.SpriteNodeMaterial).opacity =
            0.9 * edgeFade;
        }
      });

      this.destroyRef.onDestroy(() => {
        cleanup();
        parent.remove(this.group);
        this.dispose();
      });
    });
  }

  private build(): void {
    const center = new THREE.Vector3(...this.earthCenter());
    const radius = this.earthRadius();
    const palette = this.colors();
    this.glowTexture = this.createGlowTexture();

    for (let i = 0; i < this.arcCount(); i++) {
      const color = new THREE.Color(palette[i % palette.length]);
      const a = this.randomCapPoint(center, radius);
      const b = this.randomCapPoint(center, radius);

      // Elevated midpoint pushes the arc above the surface
      const mid = a
        .clone()
        .add(b)
        .multiplyScalar(0.5)
        .sub(center)
        .normalize()
        .multiplyScalar(radius * (1.12 + Math.random() * 0.18))
        .add(center);

      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      this.curves.push(curve);

      // Arc tube with additive glow material
      const tube = new THREE.TubeGeometry(curve, 48, 0.028, 8, false);
      const tubeMaterial = new THREE.MeshBasicNodeMaterial();
      tubeMaterial.color = color;
      tubeMaterial.transparent = true;
      tubeMaterial.opacity = 0.55;
      tubeMaterial.blending = THREE.AdditiveBlending;
      tubeMaterial.depthWrite = false;
      this.group.add(new THREE.Mesh(tube, tubeMaterial));

      // Node markers at both endpoints
      for (const point of [a, b]) {
        const node = this.createSprite(color, 0.9);
        node.position.copy(point);
        node.scale.setScalar(0.45);
        this.group.add(node);
      }

      // Travelling particles
      for (let j = 0; j < this.particlesPerArc(); j++) {
        const sprite = this.createSprite(color, 0.9);
        sprite.scale.setScalar(0.32);
        sprite.position.copy(a);
        this.group.add(sprite);
        this.particles.push({
          sprite,
          curveIndex: this.curves.length - 1,
          offset: Math.random(),
          speed: 0.06 + Math.random() * 0.08,
        });
      }
    }
  }

  /** Random point on the camera-facing upper cap of the Earth sphere */
  private randomCapPoint(center: THREE.Vector3, radius: number): THREE.Vector3 {
    const phi = 0.12 + Math.random() * 0.55; // polar angle from +Y (top cap)
    const theta = Math.random() * Math.PI * 2;
    const direction = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      // Bias toward camera (+Z) so arcs stay on the visible hemisphere
      Math.abs(Math.sin(phi) * Math.sin(theta)) * 0.9 + 0.1
    ).normalize();
    return direction.multiplyScalar(radius * 1.004).add(center);
  }

  private createSprite(color: THREE.Color, opacity: number): THREE.Sprite {
    const material = new THREE.SpriteNodeMaterial();
    material.map = this.glowTexture;
    material.color = color;
    material.opacity = opacity;
    material.transparent = true;
    material.blending = THREE.AdditiveBlending;
    material.depthWrite = false;
    return new THREE.Sprite(material);
  }

  private createGlowTexture(): THREE.CanvasTexture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.35, 'rgba(255,255,255,0.5)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    return new THREE.CanvasTexture(canvas);
  }

  private dispose(): void {
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        try {
          (object.material as THREE.Material)?.dispose();
        } catch {
          // Material may already be disposed
        }
      }
      if (object instanceof THREE.Sprite) {
        try {
          object.material?.dispose();
        } catch {
          // Material may already be disposed
        }
      }
    });
    this.group.clear();
    this.glowTexture?.dispose();
    this.glowTexture = null;
    this.curves = [];
    this.particles = [];
  }
}
