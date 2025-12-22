import {
  Directive,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  afterNextRender,
  effect,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';
import type { Object3D } from 'three';
import { Vector2, Euler, Vector3 } from 'three';

export interface MouseTrackingConfig {
  /** Movement sensitivity (default: 0.5) */
  sensitivity?: number;
  /** Damping factor 0-1 (default: 0.1) */
  damping?: number;
  /** Max rotation in radians (default: Math.PI / 4) */
  limit?: number;
  /** Invert X axis (default: false) */
  invertX?: boolean;
  /** Invert Y axis (default: false) */
  invertY?: boolean;
  /** Translation range [x, y] in units (default: [0, 0] / disabled) */
  translationRange?: [number, number];
  /** Invert X axis position (default: false) */
  invertPosX?: boolean;
  /** Invert Y axis position (default: false) */
  invertPosY?: boolean;
}

@Directive({
  selector: '[mouseTracking3d]',
  standalone: true,
})
export class MouseTracking3dDirective implements OnDestroy {
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly ngZone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef); // The host DOM element (likely a comment if on a component)

  public readonly trackingConfig = input<MouseTrackingConfig | undefined>(
    undefined
  );

  // Optional container to track mouse within (defaults to window/document)
  // We'll use document for global tracking as requested

  private object3D: Object3D | null = null;
  private mouse = new Vector2();
  private targetRotation = new Euler();
  private currentRotation = new Euler();
  private basePosition: Vector3 | null = null;
  private rafId: number | null = null;
  private observer: IntersectionObserver | null = null;
  private isVisible = false;

  public constructor() {
    effect(() => {
      if (this.objectId) {
        this.object3D = this.sceneStore.getObject<Object3D>(this.objectId);
        if (this.object3D) {
          // Store initial rotation as base
          this.currentRotation.copy(this.object3D.rotation);
          this.targetRotation.copy(this.object3D.rotation);
          // Store initial position as base (eagerly if available, otherwise latently in tick)
          this.basePosition = this.object3D.position.clone();
        }
      }
    });

    afterNextRender(() => {
      this.setupIntersectionObserver();
      this.startTracking();
    });
  }

  public ngOnDestroy(): void {
    this.stopTracking();
    this.observer?.disconnect();
  }

  private setupIntersectionObserver(): void {
    // We try to observe the parent element since this directive might be on a virtual element (component)
    // or the canvas container. We'll try to find a relevant parent.
    const targetElement =
      this.elementRef.nativeElement.parentElement || this.document.body;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
          if (!this.isVisible) {
            // Reset to center/base when out of view? Or just stop updating?
            // Let's stop updating to save perf
          }
        });
      },
      { threshold: 0 }
    );

    this.observer.observe(targetElement);
  }

  private startTracking(): void {
    this.ngZone.runOutsideAngular(() => {
      this.document.addEventListener('mousemove', this.onMouseMove);
      this.tick();
    });
  }

  private stopTracking(): void {
    this.document.removeEventListener('mousemove', this.onMouseMove);
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isVisible) return;

    // Normalize mouse position -1 to 1
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.mouse.x = (event.clientX / width) * 2 - 1;
    this.mouse.y = -(event.clientY / height) * 2 + 1;
  };

  private tick = () => {
    if (this.object3D && this.isVisible) {
      const config = this.trackingConfig() || {};
      const sensitivity = config.sensitivity ?? 0.5;
      const damping = config.damping ?? 0.1;

      // --- ROTATION LOGIC ---
      const limit = config.limit ?? Math.PI / 4;
      const invertX = config.invertX ?? false;
      const invertY = config.invertY ?? false;

      const targetRotY =
        this.mouse.x * limit * sensitivity * (invertX ? -1 : 1);
      const targetRotX =
        this.mouse.y * limit * sensitivity * (invertY ? -1 : 1);

      const obj = this.object3D;

      const nextRotX = obj.rotation.x + (targetRotX - obj.rotation.x) * damping;
      const nextRotY = obj.rotation.y + (targetRotY - obj.rotation.y) * damping;

      obj.rotation.x = nextRotX;
      obj.rotation.y = nextRotY;

      // --- POSITION LOGIC ---
      const translationRange = config.translationRange ?? [0, 0]; // [xRange, yRange]
      const invertPosX = config.invertPosX ?? false;
      const invertPosY = config.invertPosY ?? false;

      // Lazy init base position (double check if not caught in constructor effect)
      if (!this.basePosition) {
        this.basePosition = obj.position.clone();
      }

      const xRange = translationRange[0];
      const yRange = translationRange[1];

      if (xRange > 0 || yRange > 0) {
        const targetPosX =
          this.basePosition.x + this.mouse.x * xRange * (invertPosX ? -1 : 1);
        const targetPosY =
          this.basePosition.y + this.mouse.y * yRange * (invertPosY ? -1 : 1);

        const nextPosX =
          obj.position.x + (targetPosX - obj.position.x) * damping;
        const nextPosY =
          obj.position.y + (targetPosY - obj.position.y) * damping;

        obj.position.x = nextPosX;
        obj.position.y = nextPosY;
      }
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}
