# Implementation Plan - TASK_2026_010: Interactive Camera Flight Navigation

## 1. Architecture Overview

### 1.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Demo Application                               │
│                    (glass-sphere-hero-section.component.ts)                 │
│                                                                             │
│  ┌─────────────────┐        ┌──────────────────────┐                       │
│  │  Signal State   │        │   Event Handlers     │                       │
│  │ - activeWaypoint│        │ - onFlightStart()    │                       │
│  │ - isFlying      │        │ - onFlightEnd()      │                       │
│  │ - canFlyForward │        │ - onWaypointReached()│                       │
│  │ - canFlyBackward│        │ - onContentReady()   │                       │
│  └────────┬────────┘        └──────────┬───────────┘                       │
│           │                            │                                    │
└───────────┼────────────────────────────┼────────────────────────────────────┘
            │                            │
            │         Signals & Events   │
            ▼                            ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                             @hive-academy/angular-3d                          │
│                                                                               │
│   ┌─────────────────────────┐       ┌─────────────────────────┐              │
│   │  CameraFlightDirective  │       │   WarpLinesComponent    │              │
│   │                         │       │                         │              │
│   │  Inputs:                │       │  Inputs:                │              │
│   │  - waypoints            │       │  - intensity (0-1)      │              │
│   │  - enabled              │       │  - lineCount            │              │
│   │  - holdButton           │       │  - color                │              │
│   │  - backwardKey          │       │  - lineLength           │              │
│   │                         │       │                         │              │
│   │  Outputs:               │       │  Implementation:        │              │
│   │  - flightStart          │       │  - InstancedMesh        │              │
│   │  - flightEnd            │       │  - TSL Material         │              │
│   │  - waypointReached      │       │  - RenderLoop update    │              │
│   │  - progressChange       │       └─────────────────────────┘              │
│   │                         │                                                │
│   │  Services Used:         │                                                │
│   │  - SceneService         │                                                │
│   │  - GSAP (dynamic)       │                                                │
│   └─────────────────────────┘                                                │
│                                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                      OrbitControlsComponent                         │    │
│   │          (CameraFlightDirective applied via host directive)         │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────┐
│                            @hive-academy/angular-gsap                         │
│                                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                   ViewportAnimationDirective                         │    │
│   │              (Existing - no changes required)                        │    │
│   │                                                                       │    │
│   │  Used for text content animations on waypoint arrival.               │    │
│   │  Triggered via Angular @if conditional rendering.                    │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```
User Event                 Directive State              Demo State              UI Update
-----------                ---------------              -----------              ---------

1. RIGHT-CLICK HOLD ──────► flightStart.emit() ───────► isFlying.set(true) ────► WarpLinesComponent
                           │                           │                         intensity = 1
                           │                           │
                           ▼                           ▼
                    GSAP Timeline.play()        Hide current text content


2. MOUSE RELEASE ─────────► timeline.pause() ─────────► (no state change)
                           │
                           │ Camera stays at current position
                           │ User can hold again to continue
                           ▼

3. WAYPOINT REACHED ──────► timeline.pause()
                           │
                           ├──► flightEnd.emit() ─────► isFlying.set(false) ───► WarpLinesComponent
                           │                                                      intensity = 0
                           │
                           └──► waypointReached.emit() ► activeWaypoint.set(N) ─► @if shows new content
                               { index, direction }     │                         ViewportAnimation triggers
                                                        │
                                                        ▼
                                                  Re-enable OrbitControls


4. BACKWARD KEY (Q) ──────► Create reverse timeline
                           │
                           ├──► flightStart.emit() ───► isFlying.set(true)
                           │
                           └──► Fly to waypoint N-1
```

### 1.3 Signal/Event Communication Pattern

The architecture maintains **library decoupling** through:

1. **Output Events** (angular-3d -> demo): Flight events are standard Angular outputs
2. **Input Signals** (demo -> components): WarpLines intensity controlled by demo signal
3. **Conditional Rendering** (@if): Text content rendering triggers ViewportAnimationDirective
4. **No Cross-Library Imports**: angular-3d has zero knowledge of angular-gsap

---

## 2. New Types & Interfaces

### 2.1 CameraWaypoint Interface

**File**: `libs/angular-3d/src/lib/directives/animation/camera-flight.types.ts`

```typescript
/**
 * Defines a camera waypoint for flight navigation.
 * Extends the existing FlightWaypoint concept with camera-specific properties.
 */
export interface CameraWaypoint {
  /**
   * Unique identifier for this waypoint.
   * Used for tracking and event payloads.
   */
  id: string;

  /**
   * Camera position at this waypoint as [x, y, z] tuple.
   * This is where the camera will be positioned when arriving.
   */
  position: [number, number, number];

  /**
   * Camera lookAt target as [x, y, z] tuple.
   * This is what the camera will point at when at this waypoint.
   */
  lookAt: [number, number, number];

  /**
   * Duration in seconds to fly TO this waypoint from the previous one.
   * @default 2
   */
  duration?: number;

  /**
   * GSAP easing for the flight animation to this waypoint.
   * @default 'power2.inOut'
   */
  ease?: string;

  /**
   * Optional FOV override for this waypoint.
   * Useful for zoom effects at destinations.
   * If not specified, camera FOV remains unchanged.
   */
  fov?: number;
}
```

### 2.2 WaypointNavigationState Interface

**File**: `libs/angular-3d/src/lib/directives/animation/camera-flight.types.ts`

```typescript
/**
 * Current state of waypoint navigation.
 * Exposed via directive for external state tracking.
 */
export interface WaypointNavigationState {
  /** Current waypoint index (where camera is or was last) */
  currentIndex: number;

  /** Target waypoint index (where camera is flying to) */
  targetIndex: number;

  /** Direction of current/last flight */
  direction: 'forward' | 'backward' | 'none';

  /** Whether flight is currently in progress */
  isFlying: boolean;

  /** Progress within current flight segment (0-1) */
  progress: number;

  /** Whether forward navigation is available */
  canFlyForward: boolean;

  /** Whether backward navigation is available */
  canFlyBackward: boolean;
}
```

### 2.3 Event Payload Types

**File**: `libs/angular-3d/src/lib/directives/animation/camera-flight.types.ts`

```typescript
/**
 * Payload emitted when a waypoint is reached.
 */
export interface WaypointReachedEvent {
  /** Index of the reached waypoint */
  index: number;

  /** The waypoint data */
  waypoint: CameraWaypoint;

  /** Direction of travel that led to this waypoint */
  direction: 'forward' | 'backward';
}

/**
 * Payload emitted when flight progress changes.
 */
export interface FlightProgressEvent {
  /** Progress within current segment (0-1) */
  progress: number;

  /** Starting waypoint index */
  fromIndex: number;

  /** Target waypoint index */
  toIndex: number;
}
```

### 2.4 CameraFlightConfig Interface

**File**: `libs/angular-3d/src/lib/directives/animation/camera-flight.types.ts`

```typescript
/**
 * Configuration options for CameraFlightDirective.
 */
export interface CameraFlightConfig {
  /**
   * Waypoints defining the flight path.
   * At least 2 waypoints required for navigation.
   */
  waypoints: CameraWaypoint[];

  /**
   * Mouse button for forward flight (hold to fly).
   * 0 = left, 1 = middle, 2 = right
   * @default 2 (right-click)
   */
  holdButton?: number;

  /**
   * Key code for backward navigation.
   * @default 'KeyQ'
   */
  backwardKey?: string;

  /**
   * Whether to start at waypoint 0 on init.
   * If false, camera position is not changed on init.
   * @default true
   */
  initAtFirstWaypoint?: boolean;

  /**
   * Delay in ms after arriving at waypoint before re-enabling OrbitControls.
   * Allows effects to fade out before user interaction.
   * @default 300
   */
  controlsEnableDelay?: number;
}
```

### 2.5 WarpLinesConfig Interface

**File**: `libs/angular-3d/src/lib/primitives/effects/warp-lines.component.ts`

```typescript
/**
 * Configuration for WarpLinesComponent (optional input alternative).
 */
export interface WarpLinesConfig {
  /** Number of speed lines (default: 200) */
  lineCount?: number;

  /** Line color (default: '#ffffff') */
  color?: string;

  /** Base length of lines in units (default: 2) */
  lineLength?: number;

  /** Maximum stretch multiplier at full intensity (default: 5) */
  stretchMultiplier?: number;

  /** Spread radius around camera path (default: 20) */
  spreadRadius?: number;
}
```

---

## 3. Component Specifications

### 3.1 CameraFlightDirective

**File**: `libs/angular-3d/src/lib/directives/animation/camera-flight.directive.ts`

**Selector**: `[a3dCameraFlight]`

#### Inputs

```typescript
/** Array of waypoints defining the flight path */
readonly waypoints = input.required<CameraWaypoint[]>();

/** Enable/disable flight controls */
readonly enabled = input<boolean>(true);

/** Mouse button for forward flight (0=left, 1=middle, 2=right) */
readonly holdButton = input<number>(2);

/** Key code for backward navigation */
readonly backwardKey = input<string>('KeyQ');

/** Starting waypoint index */
readonly startIndex = input<number>(0);

/** Delay before re-enabling OrbitControls after arrival (ms) */
readonly controlsEnableDelay = input<number>(300);
```

#### Outputs

```typescript
/** Emitted when flight begins (mouse down or backward key) */
readonly flightStart = output<void>();

/** Emitted when flight ends (waypoint reached or component destroyed) */
readonly flightEnd = output<void>();

/** Emitted when camera arrives at a waypoint */
readonly waypointReached = output<WaypointReachedEvent>();

/** Emitted during flight with progress updates */
readonly progressChange = output<FlightProgressEvent>();

/** Emitted when navigation state changes (for external state tracking) */
readonly navigationStateChange = output<WaypointNavigationState>();
```

#### Internal State

```typescript
/** Current waypoint index */
private currentWaypointIndex = signal(0);

/** Target waypoint index during flight */
private targetWaypointIndex = signal(0);

/** Flight in progress flag */
private isFlying = signal(false);

/** Current flight direction */
private flightDirection = signal<'forward' | 'backward' | 'none'>('none');

/** Flight progress 0-1 */
private flightProgress = signal(0);

/** GSAP timeline for camera animation */
private timeline: gsap.core.Timeline | null = null;

/** OrbitControls reference */
private orbitControls: OrbitControls | null = null;

/** Original OrbitControls enabled state */
private originalControlsEnabled = true;

/** Flag for destroyed state (async safety) */
private readonly isDestroyed = signal(false);

/** LookAt proxy object for smooth target interpolation */
private lookAtProxy = { x: 0, y: 0, z: 0 };
```

#### Key Methods

```typescript
/**
 * Set OrbitControls reference for coordination.
 * Called from demo component when controls are ready.
 */
public setOrbitControls(controls: OrbitControls): void;

/**
 * Get current navigation state (read-only).
 */
public getNavigationState(): WaypointNavigationState;

/**
 * Programmatically fly to a specific waypoint index.
 * Useful for UI navigation buttons.
 */
public flyToWaypoint(index: number): void;

/**
 * Skip to waypoint without animation (for initial setup or reduced motion).
 */
public jumpToWaypoint(index: number): void;

// --- Private Methods ---

/**
 * Start forward flight from current position toward next waypoint.
 */
private startForwardFlight(): void;

/**
 * Start backward flight from current position toward previous waypoint.
 */
private startBackwardFlight(): void;

/**
 * Pause the current flight (on mouse release).
 */
private pauseFlight(): void;

/**
 * Resume paused flight (on mouse hold again).
 */
private resumeFlight(): void;

/**
 * Create GSAP timeline for flying between two waypoints.
 */
private createFlightTimeline(
  from: CameraWaypoint,
  to: CameraWaypoint,
  direction: 'forward' | 'backward'
): gsap.core.Timeline;

/**
 * Handle arrival at a waypoint.
 */
private onWaypointArrival(index: number, direction: 'forward' | 'backward'): void;

/**
 * Disable OrbitControls during flight.
 */
private disableOrbitControls(): void;

/**
 * Re-enable OrbitControls and sync target.
 */
private enableOrbitControls(lookAt: [number, number, number]): void;

/**
 * Set up mouse and keyboard event listeners.
 */
private setupEventListeners(): void;

/**
 * Clean up event listeners.
 */
private cleanupEventListeners(): void;
```

#### GSAP Timeline Implementation

```typescript
private createFlightTimeline(
  from: CameraWaypoint,
  to: CameraWaypoint,
  direction: 'forward' | 'backward'
): gsap.core.Timeline {
  const camera = this.sceneService.camera();
  if (!camera) throw new Error('Camera not available');

  const duration = to.duration ?? 2;
  const ease = to.ease ?? 'power2.inOut';

  // Initialize lookAt proxy from current camera direction
  this.lookAtProxy.x = from.lookAt[0];
  this.lookAtProxy.y = from.lookAt[1];
  this.lookAtProxy.z = from.lookAt[2];

  const timeline = gsap.timeline({
    paused: true, // Start paused for hold-to-fly control
    onUpdate: () => {
      // Update lookAt while animating
      camera.lookAt(this.lookAtProxy.x, this.lookAtProxy.y, this.lookAtProxy.z);

      // Calculate and emit progress
      const progress = timeline.progress();
      this.flightProgress.set(progress);
      this.progressChange.emit({
        progress,
        fromIndex: this.currentWaypointIndex(),
        toIndex: this.targetWaypointIndex(),
      });

      // Invalidate for demand-based rendering
      this.sceneService.invalidate();
    },
    onComplete: () => {
      const targetIndex = this.targetWaypointIndex();
      this.onWaypointArrival(targetIndex, direction);
    },
  });

  // Animate camera position
  timeline.to(
    camera.position,
    {
      x: to.position[0],
      y: to.position[1],
      z: to.position[2],
      duration,
      ease,
    },
    0
  );

  // Animate lookAt target in parallel
  timeline.to(
    this.lookAtProxy,
    {
      x: to.lookAt[0],
      y: to.lookAt[1],
      z: to.lookAt[2],
      duration,
      ease,
    },
    0
  );

  // Animate FOV if specified
  if (to.fov && camera instanceof THREE.PerspectiveCamera) {
    timeline.to(
      camera,
      {
        fov: to.fov,
        duration,
        ease,
        onUpdate: () => camera.updateProjectionMatrix(),
      },
      0
    );
  }

  return timeline;
}
```

#### Hold-to-Fly Event Handling

```typescript
private setupEventListeners(): void {
  const canvas = this.sceneService.renderer?.domElement;
  if (!canvas) return;

  // Prevent context menu on right-click (scoped to canvas only)
  this.contextMenuHandler = (e: MouseEvent) => {
    e.preventDefault();
  };
  canvas.addEventListener('contextmenu', this.contextMenuHandler);

  // Mouse down - start/resume forward flight
  this.mouseDownHandler = (e: MouseEvent) => {
    if (e.button !== this.holdButton() || !this.enabled()) return;
    e.preventDefault();

    const nav = this.getNavigationState();
    if (!nav.canFlyForward) return;

    if (this.isFlying() && this.timeline?.paused()) {
      // Resume paused flight
      this.resumeFlight();
    } else if (!this.isFlying()) {
      // Start new flight
      this.startForwardFlight();
    }
  };
  canvas.addEventListener('mousedown', this.mouseDownHandler);

  // Mouse up - pause flight (don't stop completely)
  this.mouseUpHandler = (e: MouseEvent) => {
    if (e.button !== this.holdButton()) return;

    if (this.isFlying() && this.timeline && !this.timeline.paused()) {
      this.pauseFlight();
    }
  };
  canvas.addEventListener('mouseup', this.mouseUpHandler);

  // Mouse leave - also pause if mouse leaves canvas
  this.mouseLeaveHandler = () => {
    if (this.isFlying() && this.timeline && !this.timeline.paused()) {
      this.pauseFlight();
    }
  };
  canvas.addEventListener('mouseleave', this.mouseLeaveHandler);

  // Keyboard - backward navigation
  this.keyDownHandler = (e: KeyboardEvent) => {
    if (e.code !== this.backwardKey() || !this.enabled()) return;

    const nav = this.getNavigationState();
    if (!nav.canFlyBackward || this.isFlying()) return;

    this.startBackwardFlight();
  };
  document.addEventListener('keydown', this.keyDownHandler);
}
```

#### OrbitControls Coordination

```typescript
private disableOrbitControls(): void {
  if (this.orbitControls) {
    this.originalControlsEnabled = this.orbitControls.enabled;
    this.orbitControls.enabled = false;
  }
}

private enableOrbitControls(lookAt: [number, number, number]): void {
  if (this.orbitControls && this.originalControlsEnabled) {
    // Sync OrbitControls target to final lookAt position
    this.orbitControls.target.set(lookAt[0], lookAt[1], lookAt[2]);
    this.orbitControls.enabled = true;
    this.orbitControls.update();
  }
}

private onWaypointArrival(index: number, direction: 'forward' | 'backward'): void {
  const waypoint = this.waypoints()[index];

  // Update state
  this.currentWaypointIndex.set(index);
  this.isFlying.set(false);
  this.flightDirection.set('none');
  this.flightProgress.set(0);

  // Clean up timeline
  this.timeline?.kill();
  this.timeline = null;

  // Emit events
  this.flightEnd.emit();
  this.waypointReached.emit({ index, waypoint, direction });
  this.emitNavigationStateChange();

  // Re-enable controls after delay (let effects fade)
  setTimeout(() => {
    if (!this.isDestroyed()) {
      this.enableOrbitControls(waypoint.lookAt);
    }
  }, this.controlsEnableDelay());
}
```

---

### 3.2 WarpLinesComponent

**File**: `libs/angular-3d/src/lib/primitives/effects/warp-lines.component.ts`

**Selector**: `a3d-warp-lines`

#### Inputs

```typescript
/** Effect intensity from 0 (off) to 1 (full). Controls opacity and stretch. */
readonly intensity = input<number>(0);

/** Number of speed lines to render */
readonly lineCount = input<number>(200);

/** Line color (hex string or CSS color) */
readonly color = input<string>('#ffffff');

/** Base length of lines in world units */
readonly lineLength = input<number>(2);

/** Maximum stretch multiplier when intensity is 1 */
readonly stretchMultiplier = input<number>(5);

/** Spread radius around camera path (cylinder radius) */
readonly spreadRadius = input<number>(20);

/** Depth range (lines spawn in this Z range) */
readonly depthRange = input<number>(50);

/** Fade duration when intensity changes (ms) */
readonly transitionDuration = input<number>(300);
```

#### Implementation Pattern

Following the StarFieldComponent pattern with InstancedMesh:

```typescript
@Component({
  selector: 'a3d-warp-lines',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class WarpLinesComponent implements OnDestroy {
  // Inputs (as defined above)

  // Injected services
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // Three.js objects
  private mesh: THREE.InstancedMesh | null = null;
  private geometry: THREE.PlaneGeometry | null = null;
  private material: THREE.MeshBasicNodeMaterial | null = null;

  // Animation state
  private currentIntensity = 0;
  private targetIntensity = 0;
  private updateCleanup: (() => void) | null = null;

  // Instance data
  private baseMatrices: THREE.Matrix4[] = [];
  private lineDepths: number[] = [];

  constructor() {
    // Effect: Create mesh when intensity goes above 0
    effect(() => {
      this.targetIntensity = this.intensity();

      if (this.targetIntensity > 0 && !this.mesh) {
        this.createLines();
      }
    });

    // Register render loop update for animation
    afterNextRender(() => {
      this.setupRenderLoop();
    });
  }
}
```

#### TSL Material Implementation

```typescript
private createMaterial(): THREE.MeshBasicNodeMaterial {
  const material = new THREE.MeshBasicNodeMaterial();
  material.transparent = true;
  material.depthWrite = false;
  material.blending = THREE.AdditiveBlending;
  material.side = THREE.DoubleSide;
  material.color = new THREE.Color(this.color());

  // TSL opacity node: circular falloff on each quad
  // Creates soft-edged lines instead of hard rectangles
  const centeredUV = sub(uv(), vec2(0.5, 0.5));
  const dist = length(centeredUV);
  const edgeFade = sub(float(1.0), smoothstep(float(0.0), float(0.5), dist));

  // Lengthwise fade: stronger at center of line
  const lengthFade = sub(
    float(1.0),
    smoothstep(float(0.3), float(0.5), abs(sub(uv().y, float(0.5))))
  );

  // Combine fades with intensity (will be updated via opacity property)
  const finalOpacity = mul(edgeFade, lengthFade);
  material.opacityNode = finalOpacity;

  return material;
}
```

#### Line Distribution

```typescript
private createLines(): void {
  const count = this.lineCount();
  const radius = this.spreadRadius();
  const depthRange = this.depthRange();

  // Create elongated quad geometry for each line
  this.geometry = new THREE.PlaneGeometry(0.03, this.lineLength());

  // Create TSL material
  this.material = this.createMaterial();

  // Create instanced mesh
  this.mesh = new THREE.InstancedMesh(this.geometry, this.material, count);
  this.mesh.frustumCulled = false; // Lines span entire view

  // Distribute lines in a cylinder around the camera path
  const dummy = new THREE.Object3D();
  this.baseMatrices = [];
  this.lineDepths = [];

  for (let i = 0; i < count; i++) {
    // Random position in cylinder
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius; // sqrt for even distribution
    const z = (Math.random() - 0.5) * depthRange;

    dummy.position.set(
      Math.cos(angle) * r,
      Math.sin(angle) * r,
      z
    );

    // Orient line to point toward camera (along Z-axis)
    dummy.lookAt(dummy.position.x, dummy.position.y, z - 10);

    dummy.updateMatrix();
    this.mesh.setMatrixAt(i, dummy.matrix);

    // Store base matrix for animation
    this.baseMatrices.push(dummy.matrix.clone());
    this.lineDepths.push(z);
  }

  this.mesh.instanceMatrix.needsUpdate = true;

  // Add to parent
  if (this.parentFn) {
    this.parentFn().add(this.mesh);
  }
}
```

#### Render Loop Animation

```typescript
private setupRenderLoop(): void {
  const dummy = new THREE.Object3D();
  const matrix = new THREE.Matrix4();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();

  this.updateCleanup = this.renderLoop.registerUpdateCallback((delta) => {
    if (!this.mesh || !this.material) return;

    // Smooth intensity transition
    const transitionSpeed = delta / (this.transitionDuration() / 1000);
    this.currentIntensity += (this.targetIntensity - this.currentIntensity) *
      Math.min(transitionSpeed, 1);

    // Update material opacity based on intensity
    this.material.opacity = this.currentIntensity;

    // Stretch lines based on intensity
    if (this.currentIntensity > 0.01) {
      const stretchFactor = 1 + (this.stretchMultiplier() - 1) * this.currentIntensity;

      for (let i = 0; i < this.lineCount(); i++) {
        // Get base matrix
        matrix.copy(this.baseMatrices[i]);

        // Decompose
        matrix.decompose(position, quaternion, scale);

        // Apply stretch to Y (line length direction)
        scale.y = stretchFactor;

        // Recompose
        matrix.compose(position, quaternion, scale);

        this.mesh.setMatrixAt(i, matrix);
      }

      this.mesh.instanceMatrix.needsUpdate = true;
    }

    // Remove mesh when fully faded
    if (this.currentIntensity < 0.01 && this.targetIntensity === 0 && this.mesh) {
      this.disposeResources();
    }
  });

  this.destroyRef.onDestroy(() => {
    this.updateCleanup?.();
    this.disposeResources();
  });
}
```

---

### 3.3 Demo Integration (glass-sphere-hero-section.component.ts)

#### Signal State Management

```typescript
// Flight navigation state
protected readonly activeWaypoint = signal(0);
protected readonly isFlying = signal(false);
protected readonly canFlyForward = signal(true);
protected readonly canFlyBackward = signal(false);

// Computed: show content only when not flying
protected readonly showContent = computed(() => !this.isFlying());
```

#### Waypoint Configuration

```typescript
/** Camera waypoints for flight navigation */
protected readonly waypoints: CameraWaypoint[] = [
  {
    id: 'hero-main',
    position: [0, 0, 16],
    lookAt: [0, 0, 0],
    duration: 2,
    ease: 'power2.inOut',
  },
  {
    id: 'gsap-destination',
    position: [-15, 3, 8],
    lookAt: [-20, 2, -5],
    duration: 2.5,
    ease: 'power2.inOut',
  },
];

/** Waypoint content configurations */
protected readonly waypointContent: Record<number, WaypointContent> = {
  0: {
    badge: 'Angular 3D',
    badgeColor: 'neon-green',
    title: ['Build Stunning', '3D Experiences'],
    subtitle: 'Create immersive web experiences with WebGPU-powered 3D graphics and smooth scroll animations.',
    pills: ['WebGPU', 'TSL Shaders', 'Signals'],
    gradient: 'from-neon-green via-primary-500 to-neon-blue',
  },
  1: {
    badge: 'Angular + GSAP ScrollTrigger',
    badgeColor: 'purple-500',
    title: ['Scroll-Driven', 'Animations'],
    subtitle: 'Create stunning scroll-driven animations with declarative directives.',
    pills: ['10+ Built-in Effects', 'SSR-Safe', 'TypeScript-First'],
    gradient: 'from-purple-500 via-pink-500 to-cyan-500',
  },
};
```

#### Event Handlers

```typescript
/** Handle flight start event */
protected onFlightStart(): void {
  this.isFlying.set(true);
}

/** Handle flight end event (pause or arrival) */
protected onFlightEnd(): void {
  // isFlying stays true until waypointReached
  // This prevents content from flashing during pause
}

/** Handle waypoint arrival */
protected onWaypointReached(event: WaypointReachedEvent): void {
  this.activeWaypoint.set(event.index);
  this.isFlying.set(false);

  // Update navigation availability
  this.canFlyForward.set(event.index < this.waypoints.length - 1);
  this.canFlyBackward.set(event.index > 0);
}

/** Handle navigation state changes */
protected onNavigationStateChange(state: WaypointNavigationState): void {
  this.canFlyForward.set(state.canFlyForward);
  this.canFlyBackward.set(state.canFlyBackward);
}
```

#### Template Integration

```html
<!-- 3D Scene with Flight Controls -->
<a3d-scene-3d [cameraPosition]="waypoints[0].position" [cameraFov]="55">
  <!-- OrbitControls with CameraFlightDirective -->
  <a3d-orbit-controls
    a3dCinematicEntrance
    [entranceConfig]="entranceConfig"
    (entranceComplete)="onEntranceComplete()"
    (controlsReady)="onControlsReady($event)"

    a3dCameraFlight
    [waypoints]="waypoints"
    [enabled]="flightEnabled()"
    (flightStart)="onFlightStart()"
    (flightEnd)="onFlightEnd()"
    (waypointReached)="onWaypointReached($event)"
    (navigationStateChange)="onNavigationStateChange($event)"

    [enableDamping]="true"
    [dampingFactor]="0.05"
    [minDistance]="10"
    [maxDistance]="30"
    [enableZoom]="false"
  />

  <!-- Warp Lines Effect (controlled by isFlying signal) -->
  <a3d-warp-lines
    [intensity]="isFlying() ? 1 : 0"
    [lineCount]="250"
    [color]="'#00ffff'"
    [lineLength]="2.5"
    [stretchMultiplier]="6"
    [spreadRadius]="25"
  />

  <!-- Destination Spheres (visible when not at that waypoint) -->
  @for (wp of waypoints; track wp.id; let idx = $index) {
    @if (idx > 0) {
      <!-- Only show destination spheres (not starting point) -->
      <a3d-sphere
        [args]="[1.5, 32, 32]"
        [position]="wp.lookAt"
        [visible]="activeWaypoint() !== idx"
        [color]="'#4a90d9'"
        [emissive]="'#1a3050'"
        [emissiveIntensity]="0.5"
      />
    }
  }

  <!-- ... existing scene content (star fields, nebula, robot, etc.) -->
</a3d-scene-3d>

<!-- Waypoint Content - Conditional Rendering -->
<div class="content-layer ...">
  @if (showContent() && activeWaypoint() === 0) {
    <app-waypoint-content
      [content]="waypointContent[0]"
      [animationConfig]="viewportContentConfig"
    />
  }

  @if (showContent() && activeWaypoint() === 1) {
    <app-waypoint-content
      [content]="waypointContent[1]"
      [animationConfig]="viewportContentConfig"
    />
  }
</div>

<!-- Flight Hint (shown after entrance, before first flight) -->
@if (showFlightHint() && !hasFlownOnce()) {
  <div class="flight-hint absolute bottom-8 left-1/2 -translate-x-1/2 ...">
    <span class="text-sm text-white/60">
      Hold <kbd class="...">Right Click</kbd> to explore
    </span>
  </div>
}
```

#### Waypoint Content Sub-Component (Optional)

To reduce template complexity, create a simple content component:

```typescript
@Component({
  selector: 'app-waypoint-content',
  template: `
    <!-- Badge -->
    <div viewportAnimation [viewportConfig]="animationConfig()">
      <span class="badge ..." [class]="badgeClasses()">
        {{ content().badge }}
      </span>
    </div>

    <!-- Title -->
    <h1 viewportAnimation [viewportConfig]="animationConfig()">
      <span class="block text-white">{{ content().title[0] }}</span>
      <span class="block bg-gradient-to-r {{ content().gradient }} bg-clip-text text-transparent">
        {{ content().title[1] }}
      </span>
    </h1>

    <!-- Subtitle -->
    <p viewportAnimation [viewportConfig]="animationConfig()">
      {{ content().subtitle }}
    </p>

    <!-- Pills -->
    <div viewportAnimation [viewportConfig]="animationConfig()">
      @for (pill of content().pills; track pill) {
        <span class="pill ...">{{ pill }}</span>
      }
    </div>
  `,
})
export class WaypointContentComponent {
  readonly content = input.required<WaypointContent>();
  readonly animationConfig = input.required<ViewportAnimationConfig>();
}
```

---

## 4. File Structure

### 4.1 New Files in angular-3d Library

```
libs/angular-3d/src/lib/
├── directives/
│   └── animation/
│       ├── camera-flight.directive.ts     # NEW - Main flight controller
│       ├── camera-flight.types.ts         # NEW - Type definitions
│       └── index.ts                        # UPDATE - Add exports
│
├── primitives/
│   └── effects/
│       ├── warp-lines.component.ts        # NEW - Speed line effect
│       └── index.ts                        # UPDATE - Add export
```

### 4.2 Updated Files

**libs/angular-3d/src/lib/directives/animation/index.ts**:
```typescript
// Add exports
export {
  CameraFlightDirective,
  type CameraWaypoint,
  type WaypointReachedEvent,
  type FlightProgressEvent,
  type WaypointNavigationState,
  type CameraFlightConfig,
} from './camera-flight.directive';
export * from './camera-flight.types';
```

**libs/angular-3d/src/lib/primitives/effects/index.ts**:
```typescript
// Add export
export * from './warp-lines.component';
```

### 4.3 Demo Application Files

```
apps/angular-3d-demo/src/app/
├── pages/
│   └── home/
│       └── sections/
│           └── glass-sphere-hero-section.component.ts  # UPDATE - Add flight integration
│
└── shared/
    └── waypoint-content.component.ts                    # NEW (optional) - Content template
```

---

## 5. Implementation Phases

### Phase 1: Core Types and CameraFlightDirective (HIGH PRIORITY)

**Duration**: ~4-6 hours

1. **Create type definitions** (`camera-flight.types.ts`)
   - `CameraWaypoint` interface
   - `WaypointNavigationState` interface
   - Event payload types
   - Config types

2. **Implement CameraFlightDirective**
   - Basic structure with inputs/outputs
   - Mouse event handling (hold detection)
   - Keyboard event handling (backward key)
   - GSAP timeline creation
   - OrbitControls coordination (borrow from CinematicEntranceDirective)
   - State management (signals)
   - Event emission

3. **Export from index files**

4. **Unit tests**
   - Event listener setup/cleanup
   - State transitions
   - Timeline creation

### Phase 2: WarpLinesComponent (HIGH PRIORITY)

**Duration**: ~3-4 hours

1. **Create component**
   - InstancedMesh setup (follow StarFieldComponent pattern)
   - Line distribution in cylinder
   - TSL material with opacity node

2. **Implement animation**
   - RenderLoop integration
   - Intensity-based opacity
   - Line stretching

3. **Export from index**

4. **Unit tests**
   - Mesh creation/disposal
   - Intensity transitions

### Phase 3: Demo Integration (HIGH PRIORITY)

**Duration**: ~4-5 hours

1. **Update glass-sphere-hero-section**
   - Add CameraFlightDirective to imports
   - Define waypoints array
   - Add signal state management
   - Implement event handlers
   - Update template with directive and @if blocks

2. **Add WarpLinesComponent**
   - Add to imports
   - Wire up intensity to isFlying signal

3. **Create waypoint content**
   - Content data for each waypoint
   - Conditional rendering
   - ViewportAnimationDirective on each block

4. **Add destination sphere**
   - Second sphere visible when not at that waypoint
   - Position at waypoint 1's lookAt

5. **Visual testing**
   - Test flight forward
   - Test pause/resume
   - Test backward navigation
   - Test content transitions

### Phase 4: Polish and Testing (MEDIUM PRIORITY)

**Duration**: ~3-4 hours

1. **Add flight hint UI**
   - Show hint after entrance completes
   - Hide after first flight
   - Subtle animation

2. **Reduced motion support**
   - Check `prefers-reduced-motion`
   - Skip warp effects, use instant transitions

3. **Performance optimization**
   - Test frame rate with warp effects
   - Adjust line count if needed
   - Test memory stability (start/stop cycles)

4. **Final visual polish**
   - Fine-tune effect colors
   - Adjust timing/easing
   - Test on different screen sizes

---

## 6. Critical Implementation Details

### 6.1 Right-Click Event Handling

```typescript
// CRITICAL: Prevent context menu only on canvas, not entire page
private setupEventListeners(): void {
  const canvas = this.sceneService.renderer?.domElement;
  if (!canvas) return;

  // Scoped context menu prevention
  canvas.addEventListener('contextmenu', (e) => {
    if (this.enabled()) {
      e.preventDefault();
    }
  });

  // Track button state for hold-to-fly
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === this.holdButton() && this.enabled()) {
      e.preventDefault();
      this.onHoldStart();
    }
  });

  // Release ends hold
  canvas.addEventListener('mouseup', (e) => {
    if (e.button === this.holdButton()) {
      this.onHoldEnd();
    }
  });

  // Mouse leaving canvas also ends hold
  canvas.addEventListener('mouseleave', () => {
    this.onHoldEnd();
  });
}
```

### 6.2 GSAP Timeline Progress Control

```typescript
// Hold-to-fly: Timeline is paused by default, plays while holding
private startForwardFlight(): void {
  const currentIndex = this.currentWaypointIndex();
  const nextIndex = currentIndex + 1;

  if (nextIndex >= this.waypoints().length) return;

  const from = this.waypoints()[currentIndex];
  const to = this.waypoints()[nextIndex];

  this.targetWaypointIndex.set(nextIndex);
  this.isFlying.set(true);
  this.flightDirection.set('forward');

  this.disableOrbitControls();
  this.flightStart.emit();

  // Create and play timeline
  this.timeline = this.createFlightTimeline(from, to, 'forward');
  this.timeline.play();
}

private pauseFlight(): void {
  if (this.timeline && !this.timeline.paused()) {
    this.timeline.pause();
    // Note: Don't emit flightEnd here - camera is mid-flight
    // flightEnd only emits on waypoint arrival
  }
}

private resumeFlight(): void {
  if (this.timeline && this.timeline.paused() && this.isFlying()) {
    this.timeline.play();
  }
}
```

### 6.3 Backward Navigation Implementation

```typescript
// Backward uses keypress (not hold) for simpler UX
private onKeyDown(e: KeyboardEvent): void {
  if (e.code !== this.backwardKey() || !this.enabled()) return;

  const currentIndex = this.currentWaypointIndex();
  if (currentIndex === 0 || this.isFlying()) return;

  // Can't go back if already flying
  const prevIndex = currentIndex - 1;
  const from = this.waypoints()[currentIndex];
  const to = this.waypoints()[prevIndex];

  this.targetWaypointIndex.set(prevIndex);
  this.isFlying.set(true);
  this.flightDirection.set('backward');

  this.disableOrbitControls();
  this.flightStart.emit();

  // Backward flight plays automatically (no hold needed)
  this.timeline = this.createFlightTimeline(from, to, 'backward');
  this.timeline.play();
}
```

### 6.4 Text Content Transition Timing

```typescript
// In demo component
protected async onWaypointReached(event: WaypointReachedEvent): Promise<void> {
  // 1. Update waypoint state
  this.activeWaypoint.set(event.index);

  // 2. isFlying is set to false, but showContent computed checks a small delay
  // This allows warp lines to fade out before text appears

  // 3. The @if block shows new content
  // ViewportAnimationDirective triggers automatically on mount

  // 4. Give effects time to fade before enabling orbit
  // (handled in directive via controlsEnableDelay)
}

// Template uses computed for smooth transition
protected readonly showContent = computed(() => {
  // Content shows when not flying
  // The 300ms controlsEnableDelay in directive handles the timing
  return !this.isFlying();
});
```

---

## 7. Testing Strategy

### 7.1 Unit Tests for CameraFlightDirective

**File**: `libs/angular-3d/src/lib/directives/animation/camera-flight.directive.spec.ts`

```typescript
describe('CameraFlightDirective', () => {
  // Setup
  let directive: CameraFlightDirective;
  let mockSceneService: Partial<SceneService>;
  let mockCamera: THREE.PerspectiveCamera;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create mock camera and canvas
    mockCamera = new THREE.PerspectiveCamera();
    mockCanvas = document.createElement('canvas');
    mockSceneService = {
      camera: signal(mockCamera),
      renderer: { domElement: mockCanvas },
      invalidate: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SceneService, useValue: mockSceneService },
      ],
    });
  });

  describe('Event Listeners', () => {
    it('should prevent context menu on canvas when enabled', () => {
      // Test context menu prevention
    });

    it('should NOT prevent context menu when disabled', () => {
      // Test disabled state
    });

    it('should start flight on right-click hold', () => {
      // Test mouse down triggers flight
    });

    it('should pause flight on mouse release', () => {
      // Test mouse up pauses timeline
    });
  });

  describe('Flight State Management', () => {
    it('should emit flightStart when flight begins', () => {
      // Test event emission
    });

    it('should emit waypointReached when arriving', () => {
      // Test waypoint arrival event
    });

    it('should update navigation state correctly', () => {
      // Test canFlyForward/canFlyBackward
    });
  });

  describe('OrbitControls Coordination', () => {
    it('should disable controls when flight starts', () => {
      // Test controls disabled
    });

    it('should re-enable controls with correct target after arrival', () => {
      // Test controls re-enabled and target synced
    });
  });

  describe('GSAP Timeline', () => {
    it('should create timeline with correct duration', () => {
      // Test timeline creation
    });

    it('should animate both position and lookAt', () => {
      // Test parallel animations
    });
  });
});
```

### 7.2 Unit Tests for WarpLinesComponent

**File**: `libs/angular-3d/src/lib/primitives/effects/warp-lines.component.spec.ts`

```typescript
describe('WarpLinesComponent', () => {
  describe('Mesh Creation', () => {
    it('should create InstancedMesh with correct line count', () => {
      // Test mesh creation
    });

    it('should NOT create mesh when intensity is 0', () => {
      // Test lazy initialization
    });
  });

  describe('Animation', () => {
    it('should fade in when intensity increases', () => {
      // Test opacity transition
    });

    it('should stretch lines based on intensity', () => {
      // Test scale animation
    });

    it('should dispose mesh when intensity returns to 0', () => {
      // Test cleanup
    });
  });

  describe('Resource Cleanup', () => {
    it('should dispose geometry and material on destroy', () => {
      // Test cleanup
    });
  });
});
```

### 7.3 Integration Test Scenarios

**File**: `apps/angular-3d-demo-e2e/src/hero-flight.spec.ts` (Playwright)

```typescript
describe('Hero Section Flight Navigation', () => {
  test('should fly forward on right-click hold', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="hero-scene"]');

    // Hold right-click on canvas
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', delay: 2000 }); // hold for 2s

    // Verify camera moved
    // Verify warp effect visible
    // Verify content changed
  });

  test('should pause flight on release', async ({ page }) => {
    // Test release behavior
  });

  test('should fly backward on Q key', async ({ page }) => {
    // Navigate to waypoint 1 first
    // Press Q
    // Verify return to waypoint 0
  });

  test('should show correct content at each waypoint', async ({ page }) => {
    // Test content at waypoint 0
    // Fly to waypoint 1
    // Test content at waypoint 1
  });
});
```

### 7.4 Performance Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| FPS during flight | >= 55fps | Chrome DevTools Performance |
| Warp effect render time | < 2ms/frame | Performance profiler |
| Memory stability | < 5MB variance | Heap snapshots over 50 cycles |
| Time to first flight | < 500ms | Event timing |

---

## 8. Risk Mitigation

### 8.1 Performance Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Warp lines impact FPS | Medium | High | Use InstancedMesh (single draw call), limit line count, adjust quality dynamically |
| Memory leak on flight cycles | Low | High | Proper timeline.kill() on arrival, dispose mesh when intensity=0 |
| Multiple star fields + warp | Medium | Medium | Consider hiding distant star layers during flight |

### 8.2 UX Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Users don't discover right-click | High | High | Add clear visual hint after entrance animation |
| Motion sickness | Medium | Medium | Offer intensity reduction option, respect reduced-motion |
| Confusion about backward nav | Medium | Low | Consider on-screen UI indicator for Q key |

### 8.3 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| OrbitControls conflict | Low | High | Proven pattern from CinematicEntranceDirective |
| GSAP load failure | Very Low | High | Graceful fallback (jump to waypoint, no animation) |
| SSR issues | Low | Medium | All browser code behind afterNextRender() |

---

## 9. Acceptance Criteria Verification

| # | Criterion | Implementation | Verification |
|---|-----------|---------------|--------------|
| 1 | Right-click hold initiates forward flight | CameraFlightDirective.mouseDownHandler | Manual test |
| 2 | Release pauses at current position | CameraFlightDirective.pauseFlight() | Manual test |
| 3 | Resume continues from paused position | CameraFlightDirective.resumeFlight() | Manual test |
| 4 | Waypoint arrival stops flight | timeline.onComplete callback | Manual test |
| 5 | Multiple waypoints navigable | waypoints array config | Manual test with 3+ waypoints |
| 6 | Backward navigation works | CameraFlightDirective.startBackwardFlight() | Manual test |
| 7 | Warp effects appear during flight | WarpLinesComponent intensity binding | Visual test |
| 8 | Text content animates after arrival | @if conditional + ViewportAnimation | Visual test |
| 9 | Libraries remain decoupled | No angular-gsap imports in angular-3d | Code review |
| 10 | 60fps maintained with effects | InstancedMesh optimization | Performance test |

---

## 10. Document References

- **Research Report**: `task-tracking/TASK_2026_010/research-report.md`
- **Task Description**: `task-tracking/TASK_2026_010/task-description.md`
- **CinematicEntranceDirective Pattern**: `libs/angular-3d/src/lib/directives/animation/cinematic-entrance.directive.ts`
- **MouseTracking3dDirective Pattern**: `libs/angular-3d/src/lib/directives/interaction/mouse-tracking-3d.directive.ts`
- **StarFieldComponent Pattern**: `libs/angular-3d/src/lib/primitives/space/star-field.component.ts`

---

**Document Version**: 1.0
**Created**: 2026-01-08
**Author**: Software Architect Agent
**Status**: Ready for Team Leader Decomposition
