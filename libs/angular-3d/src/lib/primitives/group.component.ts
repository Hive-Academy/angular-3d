import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  input,
  effect,
  forwardRef,
} from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../types/tokens';

/**
 * Group Component - Container for 3D objects
 *
 * Wraps THREE.Group to allow grouping and transforming children together.
 * Provides itself as the NG_3D_PARENT for its content children.
 *
 * Usage:
 * ```html
 * <a3d-group [position]="[10, 0, 0]">
 *   <a3d-box />
 * </a3d-group>
 * ```
 */
@Component({
  selector: 'a3d-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  providers: [
    {
      provide: NG_3D_PARENT,
      useFactory: (group: GroupComponent) => () => group.group,
      deps: [forwardRef(() => GroupComponent)],
    },
  ],
  template: `<ng-content />`,
})
export class GroupComponent implements OnInit, OnDestroy {
  // Inputs
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);

  // Three.js object
  public readonly group = new THREE.Group();

  // Parent injection
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  public constructor() {
    // React to inputs
    effect(() => {
      this.group.position.set(...this.position());
    });
    effect(() => {
      this.group.rotation.set(...this.rotation());
    });
    effect(() => {
      this.group.scale.set(...this.scale());
    });
  }

  public ngOnInit(): void {
    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.group);
      } else {
        console.warn('GroupComponent: Parent not ready during init');
      }
    } else {
      console.warn(
        'GroupComponent: No parent found (NG_3D_PARENT not provided)'
      );
    }
  }

  public ngOnDestroy(): void {
    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.remove(this.group);
    }
    // Groups don't have geometry/material to dispose, but we clear children
    this.group.clear();
  }
}
