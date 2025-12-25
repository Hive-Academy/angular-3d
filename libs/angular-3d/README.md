# @hive-academy/angular-3d

> 🎨 **Declarative Three.js components for Angular**

A modern Angular library providing declarative, type-safe wrappers for Three.js. Build stunning 3D graphics experiences with familiar Angular patterns.

## Installation

```bash
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text
```

**Peer Dependencies**:

- `@angular/core`: ~20.3.0
- `@angular/common`: ~20.3.0
- `three`: ^0.182.0
- `three-stdlib`: ^2.35.0
- `gsap`: ^3.14.2
- `maath`: ^0.10.8
- `troika-three-text`: ^0.52.4
- `rxjs`: ~7.8.0

## Running unit tests

Run `nx test angular-3d` to execute the unit tests.

## Animation Directives

### Float3dDirective

Adds floating/bobbing animation to 3D objects using GSAP.

**Usage**:

```html
<app-sphere
  float3d
  [floatConfig]="{
    height: 0.5,
    speed: 2000,
    delay: 0,
    ease: 'sine.inOut',
    autoStart: true
  }"
/>
```

**Configuration**:

- `height` (number): Vertical displacement in 3D units (default: 0.3)
- `speed` (number): Full cycle duration in milliseconds (default: 2000)
- `delay` (number): Start delay in milliseconds (default: 0)
- `ease` (string): GSAP easing function (default: 'sine.inOut')
- `autoStart` (boolean): Auto-play on init (default: true)

**Public API**:

```typescript
@ViewChild(Float3dDirective) floatDir!: Float3dDirective;

ngAfterViewInit() {
  this.floatDir.play();
  this.floatDir.pause();
  this.floatDir.stop();
  const playing = this.floatDir.isPlaying();
}
```

---

### Rotate3dDirective

Adds continuous rotation animation to 3D objects.

**Usage**:

```html
<!-- Simple Y-axis rotation -->
<app-planet rotate3d [rotateConfig]="{ axis: 'y', speed: 60 }" />

<!-- Multi-axis tumble -->
<app-asteroid
  rotate3d
  [rotateConfig]="{
    axis: 'xyz',
    xSpeed: 10,
    ySpeed: 20,
    zSpeed: 5
  }"
/>
```

**Configuration**:

- `axis` ('x' | 'y' | 'z' | 'xyz'): Rotation axis (default: 'y')
- `speed` (number): Seconds for 360° rotation (default: 60)
- `xSpeed`, `ySpeed`, `zSpeed` (number): Individual axis speeds for multi-axis
- `direction` (1 | -1): Rotation direction (default: 1)
- `autoStart` (boolean): Auto-play on init (default: true)

**Public API**:

```typescript
@ViewChild(Rotate3dDirective) rotateDir!: Rotate3dDirective;

ngAfterViewInit() {
  this.rotateDir.play();
  this.rotateDir.pause();
  this.rotateDir.setSpeed(30); // Adjust speed
  this.rotateDir.reverse(); // Reverse direction
}
```

---

### AnimationService

For programmatic animations, inject `AnimationService`:

```typescript
import { AnimationService } from '@hive-academy/angular-3d';

@Component({...})
export class MyComponent {
  private animationService = inject(AnimationService);

  ngAfterViewInit() {
    const mesh = new THREE.Mesh(geometry, material);

    // Float animation
    this.animationService.floatAnimation(mesh, { height: 0.5 });

    // Rotation animation
    this.animationService.rotateAnimation(mesh, { axis: 'y', speed: 30 });

    // Flight path
    this.animationService.flightPath(mesh, [
      { position: [0, 0, 0], duration: 2 },
      { position: [5, 2, 3], duration: 3 }
    ]);
  }
}
```
