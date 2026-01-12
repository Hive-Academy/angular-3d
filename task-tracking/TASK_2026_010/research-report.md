# Research Report - TASK_2026_010: Interactive Camera Flight Navigation

## Executive Intelligence Brief

**Research Classification**: STRATEGIC_ANALYSIS
**Confidence Level**: 90% (based on extensive codebase analysis)
**Key Insight**: The existing codebase provides excellent foundational patterns (MouseTracking3dDirective, CinematicEntranceDirective, AnimationService) that can be adapted for camera flight navigation. A decoupled architecture using event-based communication between angular-3d (camera/effects) and angular-gsap (text transitions) is the cleanest approach.

---

## 1. Camera Flight Mechanics

### 1.1 Current State Analysis

**Existing Patterns Found:**

1. **CinematicEntranceDirective** (`libs/angular-3d/src/lib/directives/animation/cinematic-entrance.directive.ts`)

   - Uses GSAP for smooth camera animation
   - Coordinates with OrbitControls (disables during animation)
   - Emits `entranceComplete` event when finished
   - Stores original controls state and restores after animation

2. **AnimationService** (`libs/angular-3d/src/lib/render-loop/animation.service.ts`)

   - Has `animateCamera()` method for position/lookAt animation
   - Has `flightPath()` method for waypoint-based animation (already defined!)
   - Tracks animations by object UUID for cleanup

3. **MouseTracking3dDirective** (`libs/angular-3d/src/lib/directives/interaction/mouse-tracking-3d.directive.ts`)
   - Shows mouse input handling pattern
   - Uses RAF for smooth per-frame updates
   - Tracks visibility state
   - Cleanup via DestroyRef

### 1.2 Recommended Approach: GSAP Timeline with Manual Control

**Why GSAP over custom RAF:**

- CinematicEntranceDirective already uses GSAP successfully
- GSAP's timeline provides `progress()` control for hold-to-fly
- Built-in easing, pausing, reversing
- Easy coordination with OrbitControls

**Hold-to-Fly Implementation:**

```typescript
// Pseudocode for CameraFlightDirective
private timeline: gsap.core.Timeline;
private flightProgress = 0;

// On right-click hold
onFlightStart() {
  this.disableOrbitControls();
  this.showFlightEffects();
  this.timeline.play();
}

// On release
onFlightStop() {
  this.timeline.pause();
  // Keep current position (don't reset)
}

// On reaching waypoint
onWaypointReached(waypointIndex: number) {
  this.waypointReached.emit({ index: waypointIndex, waypoint: this.waypoints[waypointIndex] });
  this.hideFlightEffects();
  // Wait for effects to fade
  setTimeout(() => this.enableOrbitControls(), 500);
}
```

### 1.3 OrbitControls Coordination

**Pattern from CinematicEntranceDirective:**

```typescript
// Store original state
private originalControlsEnabled = false;

disableOrbitControls() {
  if (this.orbitControls) {
    this.originalControlsEnabled = this.orbitControls.enabled;
    this.orbitControls.enabled = false;
  }
}

enableOrbitControls() {
  if (this.orbitControls && this.originalControlsEnabled) {
    this.orbitControls.enabled = true;
    this.orbitControls.update();
  }
}
```

---

## 2. Waypoint System Design

### 2.1 Existing Pattern: FlightWaypoint Interface

The AnimationService already defines a waypoint interface:

```typescript
// From animation.service.ts
export interface FlightWaypoint {
  position: [number, number, number];
  duration: number;
  ease?: string;
}
```

### 2.2 Extended Waypoint Interface for Camera Flight

```typescript
// Recommended extension for camera flight
export interface CameraWaypoint {
  /** Unique identifier for this waypoint */
  id: string;

  /** Camera position at this waypoint */
  position: [number, number, number];

  /** Camera lookAt target (what the camera points at) */
  lookAt: [number, number, number];

  /** Duration to fly TO this waypoint (seconds) */
  duration: number;

  /** GSAP easing for flight segment */
  ease?: string;

  /** Associated content identifier (for GSAP text transitions) */
  contentId?: string;

  /** Optional FOV at this waypoint (for zoom effects) */
  fov?: number;
}
```

### 2.3 Waypoint Manager Pattern

```typescript
export interface WaypointNavigationState {
  currentIndex: number;
  targetIndex: number;
  direction: 'forward' | 'backward';
  isFlying: boolean;
  progress: number; // 0-1 within current segment
}

// CameraFlightService (or directive) manages:
// - Current waypoint index
// - Navigation direction
// - Flight state
// - Event emission (waypointReached, flightStart, flightEnd)
```

### 2.4 Bidirectional Navigation Logic

```typescript
// Forward navigation
flyToNext() {
  if (this.currentIndex < this.waypoints.length - 1) {
    this.flyTo(this.currentIndex + 1, 'forward');
  }
}

// Backward navigation
flyToPrevious() {
  if (this.currentIndex > 0) {
    this.flyTo(this.currentIndex - 1, 'backward');
  }
}

// Direction-aware flight
flyTo(targetIndex: number, direction: 'forward' | 'backward') {
  const start = this.waypoints[this.currentIndex];
  const end = this.waypoints[targetIndex];

  this.timeline.clear();
  this.timeline.to(this.camera.position, {
    x: end.position[0],
    y: end.position[1],
    z: end.position[2],
    duration: end.duration,
    ease: end.ease ?? 'power2.inOut',
    onComplete: () => this.onWaypointReached(targetIndex)
  });

  // Animate lookAt target separately for smooth rotation
  this.timeline.to(this.lookAtTarget, {
    x: end.lookAt[0],
    y: end.lookAt[1],
    z: end.lookAt[2],
    duration: end.duration,
    ease: end.ease ?? 'power2.inOut'
  }, '<'); // Start at same time
}
```

---

## 3. Visual Effects During Flight

### 3.1 Approach Comparison

| Effect Type                | Implementation                   | Performance | Visual Impact | Complexity |
| -------------------------- | -------------------------------- | ----------- | ------------- | ---------- |
| Speed Lines (Particles)    | GPU particles stretched          | High        | Strong        | Medium     |
| Star Streak (Shader)       | TSL elongation on existing stars | Very High   | Natural       | Low        |
| Motion Blur (Post-process) | Custom TSL effect pass           | Medium      | Cinematic     | High       |
| Radial Blur (Post-process) | TSL blur from center             | Medium      | Warp feel     | Medium     |

### 3.2 Recommended: Star Streak + Speed Lines Combo

**Option A: Modify StarFieldComponent During Flight**

The existing StarFieldComponent can be enhanced with a "warp mode":

```typescript
// New inputs for StarFieldComponent
public readonly enableWarp = input<boolean>(false);
public readonly warpIntensity = input<number>(1.0);
public readonly warpDirection = input<[number, number, number]>([0, 0, -1]);

// In render loop when warp enabled:
// - Stretch star quads in flight direction
// - Increase brightness/size
// - Add motion trail
```

**Option B: Dedicated WarpEffectComponent (Recommended)**

A new component that creates speed lines/warp effect as a separate layer:

```typescript
// New component: WarpLinesComponent
@Component({
  selector: 'a3d-warp-lines',
  template: '',
})
export class WarpLinesComponent {
  readonly intensity = input<number>(0); // 0 = off, 1 = full
  readonly lineCount = input<number>(200);
  readonly color = input<string>('#ffffff');
  readonly direction = input<[number, number, number]>([0, 0, -1]);

  // Uses InstancedMesh with stretched quads
  // Lines spawn at camera edges, streak toward center
  // Intensity controls length and opacity
}
```

### 3.3 TSL Implementation for Warp Effect

```typescript
// tsl-warp-lines.ts - TSL-based speed line material
import { Fn, float, vec3, uv, smoothstep, time, uniform } from 'three/tsl';

export const tslWarpLines = Fn(([intensity, direction]: [TSLNode, TSLNode]) => {
  // Line stretching based on UV
  const lineUV = uv();
  const stretch = lineUV.y.mul(intensity).mul(float(10.0));

  // Fade at edges
  const edgeFade = smoothstep(float(0.0), float(0.2), lineUV.y).mul(smoothstep(float(1.0), float(0.8), lineUV.y));

  // Color with glow
  const lineColor = vec3(1.0, 1.0, 1.0).mul(edgeFade).mul(intensity);

  return lineColor;
});
```

### 3.4 Post-Processing Option: Radial Blur

The EffectComposerService supports custom TSL effects:

```typescript
// Add radial motion blur during flight
effectComposer.addEffect('radialBlur', radialBlurNode);

// TSL Radial Blur Node
const radialBlurNode = Fn(() => {
  const center = vec2(0.5, 0.5);
  const uv = uvNode();
  const dir = uv.sub(center).normalize();
  const dist = uv.sub(center).length();

  // Sample along radial direction
  let color = sceneColor;
  const samples = 8;
  for (let i = 1; i <= samples; i++) {
    const offset = dir
      .mul(dist)
      .mul(intensity)
      .mul(float(i / samples));
    color = color.add(sampleTexture(sceneColor, uv.add(offset)));
  }
  return color.div(float(samples + 1));
});
```

---

## 4. Library Decoupling Architecture

### 4.1 Component Distribution

**angular-3d Library:**

```
libs/angular-3d/src/lib/
  directives/
    animation/
      camera-flight.directive.ts    # Main flight controller
  primitives/
    effects/
      warp-lines.component.ts       # Speed line effect
  services/
    camera-flight.service.ts        # Waypoint management (optional)
  types/
    camera-waypoint.ts              # Waypoint interfaces
```

**angular-gsap Library:**

```
libs/angular-gsap/src/lib/
  directives/
    waypoint-content.directive.ts   # Content transitions
  services/
    waypoint-animation.service.ts   # Animation sequencing (optional)
```

### 4.2 Communication Pattern: Event-Based

**No Hard Coupling - Libraries communicate via:**

1. **Output Events** (angular-3d emits, demo listens):

```typescript
// In CameraFlightDirective
@Output() flightStart = new EventEmitter<void>();
@Output() flightEnd = new EventEmitter<void>();
@Output() waypointReached = new EventEmitter<{
  index: number;
  waypoint: CameraWaypoint;
  direction: 'forward' | 'backward';
}>();
```

2. **Input Signals** (demo controls both):

```typescript
// In demo component template
<a3d-orbit-controls
  a3dCameraFlight
  [waypoints]="waypoints"
  [activeWaypointIndex]="activeWaypoint()"
  (waypointReached)="onWaypointReached($event)"
/>

<!-- Text content reacts to waypoint changes -->
<div
  *ngIf="activeWaypoint() === 0"
  viewportAnimation
  [viewportConfig]="textConfig"
>
  Content for waypoint 0
</div>
```

3. **Signal-Based State** (demo manages shared state):

```typescript
// Demo component manages synchronization
export class HeroSectionComponent {
  activeWaypoint = signal(0);
  isFlying = signal(false);

  onWaypointReached(event: WaypointEvent) {
    this.activeWaypoint.set(event.index);
    this.isFlying.set(false);
    // GSAP text animations triggered by signal change
  }
}
```

### 4.3 Integration Pattern in Demo

```typescript
// Demo combines both libraries
@Component({
  imports: [
    // angular-3d
    Scene3dComponent,
    OrbitControlsComponent,
    CameraFlightDirective,
    WarpLinesComponent,

    // angular-gsap
    ViewportAnimationDirective,
  ],
  template: `
    <a3d-scene-3d>
      <a3d-orbit-controls
        a3dCameraFlight
        [waypoints]="waypoints"
        (flightStart)="onFlightStart()"
        (flightEnd)="onFlightEnd()"
        (waypointReached)="onWaypointReached($event)"
      />

      <!-- Warp effect during flight -->
      <a3d-warp-lines
        [intensity]="isFlying() ? 1 : 0"
        [color]="'#00ffff'"
      />

      <!-- Destination spheres -->
      @for (wp of waypoints; track wp.id) {
        <a3d-sphere
          [position]="wp.lookAt"
          [visible]="activeWaypoint() !== $index"
        />
      }
    </a3d-scene-3d>

    <!-- Text content - controlled by signals, animated by GSAP -->
    @if (showContent() && activeWaypoint() === 0) {
      <div viewportAnimation [viewportConfig]="waypoint0Config">
        <!-- Waypoint 0 content -->
      </div>
    }
  `
})
```

---

## 5. Integration with GSAP Text Animations

### 5.1 Timing Coordination

**Key Insight**: Text animations should start AFTER camera arrives, not during flight.

```typescript
// In demo component
async onWaypointReached(event: WaypointEvent) {
  // 1. Camera has arrived
  this.activeWaypoint.set(event.index);

  // 2. Wait for effects to fade (warp lines)
  await this.fadeOutFlightEffects();

  // 3. Show content area
  this.showContent.set(true);

  // 4. ViewportAnimationDirective triggers automatically
  //    because element becomes visible in DOM
}
```

### 5.2 ViewportAnimationDirective Enhancement

The existing `ViewportAnimationDirective` can work as-is with conditional rendering:

```typescript
// No changes needed to angular-gsap
// Demo controls visibility via @if, directive animates on mount

// In template
@if (activeWaypoint() === 1) {
  <div
    viewportAnimation
    [viewportConfig]="{
      animation: 'slideUp',
      duration: 0.8,
      delay: 0.2
    }"
  >
    Waypoint 1 Content
  </div>
}
```

### 5.3 Alternative: Custom Trigger Directive

If more control is needed, a new directive could be added to angular-gsap:

```typescript
// Potential addition to angular-gsap
@Directive({
  selector: '[triggerAnimation]'
})
export class TriggerAnimationDirective {
  readonly trigger = input<boolean>(false);
  readonly config = input<AnimationConfig>();

  constructor() {
    effect(() => {
      if (this.trigger()) {
        this.playAnimation();
      }
    });
  }
}

// Usage
<div
  triggerAnimation
  [trigger]="activeWaypoint() === 1"
  [config]="{animation: 'slideUp'}"
>
```

---

## 6. Recommended Implementation Components

### 6.1 New Components/Directives for angular-3d

| Component/Directive          | Purpose                                 | Priority |
| ---------------------------- | --------------------------------------- | -------- |
| `CameraFlightDirective`      | Main flight controller with hold-to-fly | HIGH     |
| `WarpLinesComponent`         | Speed line visual effect                | HIGH     |
| `CameraWaypoint` (interface) | Waypoint data structure                 | HIGH     |
| `CameraFlightService`        | Optional service for complex scenarios  | LOW      |

### 6.2 New Components/Directives for angular-gsap

| Component/Directive                    | Purpose                                   | Priority |
| -------------------------------------- | ----------------------------------------- | -------- |
| None required                          | Existing ViewportAnimationDirective works | -        |
| `TriggerAnimationDirective` (optional) | Manual trigger control                    | LOW      |

### 6.3 Demo Integration

| Location                                 | Changes                               | Priority |
| ---------------------------------------- | ------------------------------------- | -------- |
| `glass-sphere-hero-section.component.ts` | Add flight, effects, waypoint spheres | HIGH     |
| New content sections                     | Design text content for each waypoint | HIGH     |

---

## 7. Risks and Considerations

### 7.1 Performance Risks

| Risk                     | Mitigation                                   |
| ------------------------ | -------------------------------------------- |
| Warp effect GPU cost     | Use InstancedMesh, limit line count          |
| Multiple star fields     | Consider hiding distant layers during flight |
| Post-processing overhead | Use TSL for native WebGPU optimization       |

### 7.2 UX Risks

| Risk                          | Mitigation                             |
| ----------------------------- | -------------------------------------- |
| User confusion about controls | Clear visual indicator for right-click |
| Motion sickness               | Add option to reduce effect intensity  |
| Lost progress on release      | Save current progress, allow resume    |

### 7.3 Technical Risks

| Risk                   | Mitigation                                     |
| ---------------------- | ---------------------------------------------- |
| OrbitControls conflict | Proven pattern from CinematicEntranceDirective |
| GSAP/RAF coordination  | Use GSAP for all camera animation              |
| SSR compatibility      | All browser-only code behind `afterNextRender` |

---

## 8. Code Snippets for Critical Pieces

### 8.1 CameraFlightDirective Core

```typescript
@Directive({
  selector: '[a3dCameraFlight]',
  standalone: true,
})
export class CameraFlightDirective implements OnDestroy {
  // Inputs
  readonly waypoints = input.required<CameraWaypoint[]>();
  readonly enabled = input<boolean>(true);
  readonly holdButton = input<number>(2); // 2 = right click

  // Outputs
  readonly flightStart = output<void>();
  readonly flightEnd = output<void>();
  readonly waypointReached = output<WaypointEvent>();

  // State
  private currentIndex = signal(0);
  private isFlying = signal(false);
  private timeline: gsap.core.Timeline | null = null;
  private orbitControls: OrbitControls | null = null;

  // Camera and scene access
  private readonly sceneService = inject(SceneService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.setupEventListeners();
      this.createTimeline();
    });
  }

  private setupEventListeners(): void {
    const canvas = this.sceneService.renderer?.domElement;
    if (!canvas) return;

    // Prevent context menu on right-click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Right-click hold detection
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === this.holdButton() && this.enabled()) {
        this.startFlight();
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === this.holdButton()) {
        this.pauseFlight();
      }
    });
  }

  private startFlight(): void {
    if (this.isFlying()) return;

    this.isFlying.set(true);
    this.flightStart.emit();

    // Disable orbit controls
    if (this.orbitControls) {
      this.orbitControls.enabled = false;
    }

    // Resume or start timeline
    this.timeline?.play();
  }

  private pauseFlight(): void {
    this.timeline?.pause();
    // Note: Don't re-enable orbit controls yet
    // Wait until we reach a waypoint or user explicitly cancels
  }

  private onReachWaypoint(index: number): void {
    this.currentIndex.set(index);
    this.isFlying.set(false);
    this.flightEnd.emit();

    this.waypointReached.emit({
      index,
      waypoint: this.waypoints()[index],
      direction: index > this.currentIndex() ? 'forward' : 'backward',
    });

    // Re-enable orbit controls
    if (this.orbitControls) {
      this.orbitControls.enabled = true;
      this.orbitControls.update();
    }
  }
}
```

### 8.2 WarpLinesComponent Core

```typescript
@Component({
  selector: 'a3d-warp-lines',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class WarpLinesComponent implements OnDestroy {
  readonly intensity = input<number>(0);
  readonly lineCount = input<number>(200);
  readonly color = input<string>('#ffffff');
  readonly lineLength = input<number>(2);

  private readonly parentFn = inject(NG_3D_PARENT);
  private readonly renderLoop = inject(RenderLoopService);
  private mesh: THREE.InstancedMesh | null = null;

  constructor() {
    effect(() => {
      const intensity = this.intensity();
      if (intensity > 0 && !this.mesh) {
        this.createLines();
      }
      this.updateIntensity(intensity);
    });
  }

  private createLines(): void {
    // Create elongated quad geometry
    const geometry = new THREE.PlaneGeometry(0.02, this.lineLength());

    // TSL material for glow effect
    const material = new THREE.MeshBasicNodeMaterial();
    material.transparent = true;
    material.blending = THREE.AdditiveBlending;
    material.depthWrite = false;
    material.color = new THREE.Color(this.color());

    // Create instanced mesh
    this.mesh = new THREE.InstancedMesh(geometry, material, this.lineCount());

    // Position lines in a cylinder around camera
    this.distributeLines();

    // Add to scene
    this.parentFn().add(this.mesh);
  }

  private distributeLines(): void {
    const dummy = new THREE.Object3D();
    const count = this.lineCount();

    for (let i = 0; i < count; i++) {
      // Random position in cylinder around camera path
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 15;
      const z = (Math.random() - 0.5) * 50;

      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z);

      // Point toward camera (z-axis aligned)
      dummy.lookAt(0, 0, z - 1);

      dummy.updateMatrix();
      this.mesh!.setMatrixAt(i, dummy.matrix);
    }

    this.mesh!.instanceMatrix.needsUpdate = true;
  }

  private updateIntensity(intensity: number): void {
    if (!this.mesh) return;

    // Scale lines based on intensity (stretch effect)
    // Update material opacity
    (this.mesh.material as THREE.MeshBasicNodeMaterial).opacity = intensity;
  }
}
```

---

## 9. Recommended Development Sequence

### Phase 1: Core Flight System

1. Create `CameraWaypoint` interface
2. Implement `CameraFlightDirective` with basic hold-to-fly
3. Add OrbitControls coordination
4. Test with simple waypoints

### Phase 2: Visual Effects

1. Create `WarpLinesComponent`
2. Integrate with flight start/end events
3. Fine-tune intensity transitions

### Phase 3: Demo Integration

1. Add waypoint spheres to hero section
2. Design text content for each waypoint
3. Wire up GSAP text animations with waypoint events
4. Add destination sphere visuals

### Phase 4: Polish

1. Add visual indicator for right-click hint
2. Test bidirectional navigation
3. Performance optimization
4. Mobile touch support (optional)

---

## 10. Conclusion

The existing codebase provides excellent patterns to build upon:

1. **CinematicEntranceDirective** proves GSAP + OrbitControls coordination works
2. **AnimationService** already has FlightWaypoint concept
3. **StarFieldComponent** shows InstancedMesh + TSL material patterns for effects
4. **ViewportAnimationDirective** can be used as-is for text transitions

**Recommended Architecture:**

- **angular-3d**: CameraFlightDirective + WarpLinesComponent (event outputs)
- **angular-gsap**: Use existing ViewportAnimationDirective (no changes needed)
- **Demo**: Signal-based state management connecting both libraries

**Key Success Factors:**

1. Use GSAP timeline with `progress()` for hold-to-fly control
2. Event-based communication (no hard coupling)
3. TSL shaders for WebGPU-optimized effects
4. Proven patterns from CinematicEntranceDirective

---

**Output Location**: `task-tracking/TASK_2026_010/research-report.md`
**Next Agent**: software-architect
**Architect Focus**: Design detailed component APIs, define exact interfaces, plan implementation phases
