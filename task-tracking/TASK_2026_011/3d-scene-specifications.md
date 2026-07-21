# 3D Scene Design Specifications - TASK_2026_011

## Angular 3D Library Showcase Application

> **Purpose**: Technical specifications for all 3D scenes in the showcase app  
> **Rendering Engine**: Three.js (via Angular-3D library)  
> **Target Performance**: 60fps on modern devices  
> **Scene Count**: 23+ interactive demos

---

## 🎯 Design Philosophy

### Visual Consistency

**Every 3D scene should**:

1. Use brand-aligned lighting (purple/cyan accent lights)
2. Maintain 60fps performance target
3. Support keyboard + mouse interaction
4. Provide visual feedback on user input
5. Gracefully handle WebGL context loss
6. Dispose resources properly on destroy

**Aesthetic Goals**:

- **Premium feel**: Smooth animations, high-quality materials
- **Technical clarity**: Demonstrate library capabilities clearly
- **Visual harmony**: Consistent lighting, colors match brand palette
- **Interactive delight**: Responsive to user input, satisfying to control

---

## 🔧 Default Scene Configuration

This is the baseline configuration for all demo scenes unless otherwise specified.

### Scene Template

```typescript
export const DEFAULT_SCENE_CONFIG = {
  // Camera
  camera: {
    type: 'PerspectiveCamera',
    fov: 75,
    near: 0.1,
    far: 1000,
    position: [0, 0, 5] as [number, number, number],
  },

  // Lighting
  lighting: {
    ambient: {
      intensity: 0.4,
      color: 0xffffff,
    },
    directional: {
      intensity: 0.8,
      color: 0xffffff,
      position: [5, 10, 7.5] as [number, number, number],
      castShadow: true,
    },
    point1: {
      intensity: 0.3,
      color: 0x6366f1, // Brand purple
      position: [-5, 5, -5] as [number, number, number],
    },
    point2: {
      intensity: 0.2,
      color: 0x06b6d4, // Brand cyan
      position: [5, -3, 5] as [number, number, number],
    },
  },

  // Renderer
  renderer: {
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    shadowMap: {
      enabled: true,
      type: 'PCFSoftShadowMap',
    },
  },

  // Controls
  controls: {
    type: 'OrbitControls',
    enableDamping: true,
    dampingFactor: 0.05,
    minDistance: 2,
    maxDistance: 20,
    maxPolarAngle: Math.PI / 2,
    autoRotate: false,
    autoRotateSpeed: 1,
  },

  // Postprocessing (optional, disabled by default)
  postprocessing: {
    enabled: false,
    bloom: {
      strength: 0.8,
      radius: 0.4,
      threshold: 0.85,
    },
  },
};
```

---

## 📦 Scene Categories & Specifications

### 1. Primitives (5 demos)

Fundamental 3D geometric shapes demonstrating basic library usage.

---

#### 1.1 Box Geometry

**Purpose**: Demonstrate basic cube primitive with material variants

**Scene Configuration**:

```typescript
{
  camera: { position: [3, 2, 5] },
  object: {
    type: 'BoxGeometry',
    args: [2, 2, 2], // width, height, depth
    material: {
      type: 'MeshStandardMaterial',
      color: 0x6366f1, // Brand purple
      metalness: 0.3,
      roughness: 0.4,
    },
    rotation: [0.2, 0.4, 0], // Slight tilt for visual interest
    castShadow: true,
  },
  controls: {
    autoRotate: true,
    autoRotateSpeed: 1,
  },
}
```

**Interactive Controls**:

- Rotation X/Y/Z sliders
- Color picker
- Scale slider (0.5 - 3.0)
- Material metalness (0 - 1)
- Material roughness (0 - 1)

**Angular Component Example**:

```typescript
@Component({
  selector: 'app-box-demo',
  template: `
    <app-scene-container [config]="sceneConfig">
      <app-scene-3d>
        <app-ambient-light [intensity]="0.4" />
        <app-directional-light [position]="[5, 10, 7.5]" [intensity]="0.8" [castShadow]="true" />
        <app-point-light [position]="[-5, 5, -5]" [intensity]="0.3" [color]="0x6366f1" />

        <app-box-geometry
          [size]="[2, 2, 2]"
          [position]="[0, 0, 0]"
          [rotation]="rotation()"
          [material]="{
            color: color(),
            metalness: metalness(),
            roughness: roughness(),
          }"
        />

        <app-orbit-controls [autoRotate]="true" />
      </app-scene-3d>
    </app-scene-container>

    <div class="controls">
      <app-slider label="Rotation X" [(value)]="rotationX" [min]="-Math.PI" [max]="Math.PI" />
      <app-color-picker label="Color" [(value)]="color" />
      <app-slider label="Metalness" [(value)]="metalness" [min]="0" [max]="1" [step]="0.1" />
    </div>
  `,
})
export class BoxDemoComponent {
  rotationX = signal(0.2);
  rotationY = signal(0.4);
  rotationZ = signal(0);

  color = signal(0x6366f1);
  metalness = signal(0.3);
  roughness = signal(0.4);

  rotation = computed(() => [this.rotationX(), this.rotationY(), this.rotationZ()] as [number, number, number]);
}
```

---

#### 1.2 Sphere Geometry

**Purpose**: Demonstrate smooth sphere primitive with reflective materials

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 0, 4] },
  object: {
    type: 'SphereGeometry',
    args: [1.5, 64, 64], // radius, widthSegments, heightSegments
    material: {
      type: 'MeshStandardMaterial',
      color: 0x06b6d4, // Brand cyan
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 1,
    },
    castShadow: true,
  },
  lighting: {
    // Enhanced point lights for reflections
    point1: { intensity: 0.5, color: 0xffffff, position: [5, 5, 5] },
    point2: { intensity: 0.3, color: 0x6366f1, position: [-5, -5, -5] },
  },
  postprocessing: {
    enabled: true,
    bloom: {
      strength: 0.5,
      radius: 0.3,
      threshold: 0.9,
    },
  },
}
```

**Interactive Controls**:

- Segment count (low poly 8x8 → high poly 128x128)
- Material metalness
- Environment map intensity
- Bloom effect toggle

---

#### 1.3 Torus Geometry

**Purpose**: Demonstrate donut-shaped primitive with neon materials

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 0, 6] },
  object: {
    type: 'TorusGeometry',
    args: [2, 0.6, 32, 64], // radius, tube, radialSegments, tubularSegments
    material: {
      type: 'MeshStandardMaterial',
      color: 0xa1ff4f, // Neon green
      emissive: 0xa1ff4f,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.3,
    },
    rotation: [Math.PI / 4, 0, 0],
  },
  controls: {
    autoRotate: true,
    autoRotateSpeed: 0.5,
  },
  postprocessing: {
    enabled: true,
    bloom: {
      strength: 1.2,
      radius: 0.5,
      threshold: 0.7, // Lower threshold to catch neon glow
    },
  },
}
```

**Interactive Controls**:

- Torus radius (1 - 3)
- Tube thickness (0.2 - 1.0)
- Emissive intensity (0 - 1)
- Auto-rotate speed

---

#### 1.4 Cylinder Geometry

**Purpose**: Demonstrate cylindrical shape with gradient material

**Scene Configuration**:

```typescript
{
  camera: { position: [3, 2, 5] },
  object: {
    type: 'CylinderGeometry',
    args: [1, 1, 3, 32], // radiusTop, radiusBottom, height, radialSegments
    material: {
      type: 'MeshStandardMaterial',
      color: 0xd946ef, // Purple gradient
      metalness: 0.4,
      roughness: 0.5,
    },
    rotation: [0, 0, Math.PI / 6],
  },
}
```

**Interactive Controls**:

- Top radius (0.5 - 2)
- Bottom radius (0.5 - 2) - allows cone shape
- Height (1 - 5)
- Segment count (8 - 64)

---

#### 1.5 Plane Geometry

**Purpose**: Demonstrate flat plane with grid overlay

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 5, 5], lookAt: [0, 0, 0] },
  object: {
    type: 'PlaneGeometry',
    args: [10, 10, 10, 10], // width, height, widthSegments, heightSegments
    material: {
      type: 'MeshStandardMaterial',
      color: 0x1c2026,
      wireframe: false,
      side: 'DoubleSide',
    },
    rotation: [-Math.PI / 2, 0, 0], // Lay flat on ground
    receiveShadow: true,
  },
  gridHelper: {
    size: 10,
    divisions: 10,
    color1: 0x6366f1,
    color2: 0x06b6d4,
  },
}
```

**Interactive Controls**:

- Grid divisions (5 - 50)
- Wireframe toggle
- Segment count
- Grid visibility toggle

---

### 2. Particles (3 demos)

Particle systems demonstrating GPU-accelerated effects.

---

#### 2.1 Particle Cloud

**Purpose**: Demonstrate basic particle system with thousands of particles

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 0, 10] },
  particles: {
    count: 10000,
    positions: 'random-sphere', // Distribution pattern
    sphereRadius: 5,
    material: {
      type: 'PointsMaterial',
      size: 0.05,
      color: 0x6366f1,
      transparent: true,
      opacity: 0.8,
      blending: 'AdditiveBlending',
      sizeAttenuation: true,
    },
    animation: {
      type: 'rotation',
      speed: 0.0005,
      axis: [0, 1, 0],
    },
  },
  controls: {
    autoRotate: false, // User-controlled
    enableDamping: true,
  },
}
```

**Interactive Controls**:

- Particle count (1000 - 50000)
- Particle size (0.01 - 0.2)
- Distribution pattern (sphere, cube, random)
- Color gradient
- Animation speed

**Performance**:

- Use BufferGeometry for positions
- Update positions on GPU (shader-based if > 10K particles)
- Target 60fps even at 50K particles

---

#### 2.2 GPU Particles (Advanced)

**Purpose**: Demonstrate GPU-accelerated particle physics

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 0, 15] },
  particles: {
    count: 100000,
    computeShader: {
      positions: 'gpgpu-texture',
      velocities: 'gpgpu-texture',
      physics: {
        gravity: [0, -0.001, 0],
        damping: 0.99,
        noise: 0.01,
      },
    },
    material: {
      type: 'ShaderMaterial',
      vertexShader: `
        uniform float uTime;
        uniform float uSize;
        attribute vec3 velocity;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          gl_FragColor = vec4(uColor, 1.0 - dist * 2.0);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 3.0 },
        uColor: { value: new THREE.Color(0x6366f1) },
      },
      transparent: true,
      blending: 'AdditiveBlending',
    },
  },
}
```

**Interactive Controls**:

- Gravity strength
- Particle count (10K - 200K)
- Noise intensity
- Color scheme
- Reset simulation

**Performance**:

- GPU compute shader for physics
- 60fps target at 100K particles
- Adaptive quality based on FPS

---

#### 2.3 Marble System

**Purpose**: Demonstrate particle instancing with physics

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 5, 15] },
  marbles: {
    count: 500,
    instancedMesh: {
      geometry: 'SphereGeometry',
      args: [0.2, 16, 16],
      material: {
        type: 'MeshStandardMaterial',
        metalness: 0.8,
        roughness: 0.2,
      },
    },
    physics: {
      gravity: -9.8,
      bounce: 0.7,
      friction: 0.95,
      bounds: {
        min: [-10, 0, -10],
        max: [10, 20, 10],
      },
    },
    colors: 'gradient', // Purple → Cyan gradient across marbles
  },
  ground: {
    type: 'PlaneGeometry',
    args: [20, 20],
    rotation: [-Math.PI / 2, 0, 0],
    receiveShadow: true,
  },
}
```

**Interactive Controls**:

- Marble count (100 - 1000)
- Gravity strength
- Bounce factor
- "Drop marbles" button (spawn new batch)
- Reset simulation

---

### 3. Text (1 demo)

3D text rendering with Troika library.

---

#### 3.1 Troika Text 3D

**Purpose**: Demonstrate high-quality 3D text rendering

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 0, 8] },
  text: {
    content: 'Angular 3D',
    font: 'Inter',
    fontSize: 2,
    color: 0xffffff,
    anchorX: 'center',
    anchorY: 'middle',
    material: {
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x6366f1,
      emissiveIntensity: 0.2,
    },
    outlineWidth: 0.05,
    outlineColor: 0x06b6d4,
  },
  controls: {
    autoRotate: true,
    autoRotateSpeed: 0.5,
  },
  postprocessing: {
    enabled: true,
    bloom: {
      strength: 1.0,
      radius: 0.5,
      threshold: 0.8,
    },
  },
}
```

**Interactive Controls**:

- Text input field
- Font size (0.5 - 5)
- Outline width (0 - 0.2)
- Emissive intensity
- Color picker (text + outline)

---

### 4. Lighting (3 demos)

Demonstrate different light types and effects.

---

#### 4.1 Point Light Array

**Purpose**: Multiple colored point lights in a grid

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 5, 10] },
  scene: {
    background: 0x0a0e11,
  },
  pointLights: [
    { position: [-5, 3, -5], color: 0x6366f1, intensity: 2, distance: 10 },
    { position: [5, 3, -5], color: 0x06b6d4, intensity: 2, distance: 10 },
    { position: [-5, 3, 5], color: 0xa1ff4f, intensity: 2, distance: 10 },
    { position: [5, 3, 5], color: 0xd946ef, intensity: 2, distance: 10 },
  ],
  centerSphere: {
    type: 'SphereGeometry',
    args: [1.5, 64, 64],
    material: {
      type: 'MeshStandardMaterial',
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.1,
    },
  },
  ground: {
    type: 'PlaneGeometry',
    args: [20, 20],
    rotation: [-Math.PI / 2, 0, 0],
    receiveShadow: true,
  },
}
```

**Interactive Controls**:

- Light intensity (0 - 5)
- Light distance (5 - 20)
- Light color pickers
- Animate lights (orbit around center)

---

#### 4.2 Spotlight Showcase

**Purpose**: Demonstrate spotlight with shadows

**Scene Configuration**:

```typescript
{
  camera: { position: [5, 5, 10] },
  spotlight: {
    position: [0, 10, 0],
    target: [0, 0, 0],
    color: 0xffffff,
    intensity: 2,
    angle: Math.PI / 6,
    penumbra: 0.3,
    decay: 2,
    distance: 50,
    castShadow: true,
    shadow: {
      mapSize: [1024, 1024],
      camera: {
        near: 0.5,
        far: 50,
      },
    },
  },
  objects: [
    // Multiple objects to cast shadows
    { type: 'BoxGeometry', position: [0, 1, 0] },
    { type: 'SphereGeometry', position: [-3, 1.5, -2] },
    { type: 'TorusGeometry', position: [3, 1.5, 2] },
  ],
  ground: {
    type: 'PlaneGeometry',
    args: [20, 20],
    rotation: [-Math.PI / 2, 0, 0],
    receiveShadow: true,
  },
}
```

**Interactive Controls**:

- Spotlight angle (0 - π/3)
- Penumbra (0 - 1)
- Position X/Y/Z
- Target position
- Intensity

---

#### 4.3 Hemisphere Light

**Purpose**: Demonstrate sky/ground hemisphere lighting

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 2, 5] },
  hemisphereLight: {
    skyColor: 0x06b6d4, // Cyan sky
    groundColor: 0xd946ef, // Purple ground
    intensity: 1,
  },
  directionalLight: {
    position: [5, 10, 7.5],
    intensity: 0.3,
    castShadow: true,
  },
  objects: [
    { type: 'SphereGeometry', position: [0, 1.5, 0], material: { color: 0xffffff } },
  ],
  ground: {
    type: 'PlaneGeometry',
    args: [10, 10],
    rotation: [-Math.PI / 2, 0, 0],
    material: { color: 0x1c2026 },
    receiveShadow: true,
  },
}
```

**Interactive Controls**:

- Sky color picker
- Ground color picker
- Intensity (0 - 3)

---

### 5. Effects (4 demos)

Visual effects demonstrating library capabilities.

---

#### 5.1 Fog Effect

**Purpose**: Demonstrate linear and exponential fog

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 2, 10] },
  fog: {
    type: 'FogExp2',
    color: 0x0a0e11,
    density: 0.05,
  },
  objects: [
    // Grid of cubes at varying distances
    ...Array.from({ length: 50 }, (_, i) => ({
      type: 'BoxGeometry',
      position: [
        Math.random() * 20 - 10,
        Math.random() * 5,
        -i * 2,
      ],
      material: { color: 0x6366f1 },
    })),
  ],
}
```

**Interactive Controls**:

- Fog type (Linear, Exponential, Exponential²)
- Fog density (0 - 0.2)
- Fog color
- Near/far (for linear fog)

---

#### 5.2 Glow Effect (Bloom)

**Purpose**: Demonstrate selective bloom postprocessing

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 0, 8] },
  objects: [
    {
      type: 'SphereGeometry',
      args: [1, 64, 64],
      material: {
        color: 0xa1ff4f,
        emissive: 0xa1ff4f,
        emissiveIntensity: 1,
      },
      position: [0, 0, 0],
    },
  ],
  postprocessing: {
    enabled: true,
    bloom: {
      strength: 1.5,
      radius: 0.8,
      threshold: 0.5,
    },
  },
}
```

**Interactive Controls**:

- Bloom strength (0 - 3)
- Bloom radius (0 - 1)
- Threshold (0 - 1)
- Emissive intensity (0 - 2)

---

#### 5.3 Wireframe Overlay

**Purpose**: Demonstrate wireframe + solid material combination

**Scene Configuration**:

```typescript
{
  camera: { position: [3, 2, 5] },
  object: {
    type: 'TorusKnotGeometry',
    args: [1.5, 0.5, 128, 32],
    materials: [
      {
        type: 'MeshStandardMaterial',
        color: 0x1c2026,
        metalness: 0.5,
        roughness: 0.5,
      },
      {
        type: 'MeshBasicMaterial',
        color: 0x6366f1,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      },
    ],
  },
  controls: {
    autoRotate: true,
    autoRotateSpeed: 1,
  },
}
```

**Interactive Controls**:

- Wireframe opacity (0 - 1)
- Wireframe color
- Solid material color
- Auto-rotate speed

---

#### 5.4 Displacement Map

**Purpose**: Demonstrate vertex displacement with textures

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 0, 5] },
  object: {
    type: 'PlaneGeometry',
    args: [5, 5, 128, 128],
    material: {
      type: 'MeshStandardMaterial',
      color: 0x6366f1,
      displacementMap: 'noise-texture', // Perlin noise
      displacementScale: 0.5,
      wireframe: false,
    },
    animation: {
      type: 'wave',
      speed: 0.001,
    },
  },
}
```

**Interactive Controls**:

- Displacement scale (0 - 2)
- Wireframe toggle
- Wave speed
- Segment count (32 - 256)

---

### 6. Postprocessing (3 demos)

Advanced postprocessing effects.

---

#### 6.1 SSAO (Ambient Occlusion)

**Purpose**: Demonstrate realistic ambient occlusion

**Scene Configuration**:

```typescript
{
  camera: { position: [5, 5, 10] },
  scene: {
    objects: [
      // Complex scene with overlapping geometry
      { type: 'BoxGeometry', position: [0, 1, 0] },
      { type: 'SphereGeometry', position: [-2, 1.5, -1] },
      { type: 'TorusGeometry', position: [2, 1, 1] },
    ],
  },
  postprocessing: {
    enabled: true,
    ssao: {
      kernelRadius: 8,
      minDistance: 0.005,
      maxDistance: 0.1,
    },
  },
}
```

**Interactive Controls**:

- Kernel radius (4 - 32)
- Min/max distance
- SSAO on/off toggle

---

#### 6.2 Depth of Field

**Purpose**: Demonstrate camera focus effect

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 2, 8] },
  objects: [
    // Objects at varying depths
    { type: 'SphereGeometry', position: [0, 1, -5] },
    { type: 'BoxGeometry', position: [0, 1, 0] }, // Focus point
    { type: 'TorusGeometry', position: [0, 1, 5] },
  ],
  postprocessing: {
    enabled: true,
    dof: {
      focusDistance: 8, // Distance to focus point
      focalLength: 50,
      bokehScale: 2,
    },
  },
}
```

**Interactive Controls**:

- Focus distance (2 - 20)
- Bokeh scale (0 - 5)
- Focal length (20 - 100)

---

#### 6.3 Glitch Effect

**Purpose**: Demonstrate digital glitch postprocessing

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 0, 5] },
  object: {
    type: 'TorusKnotGeometry',
    material: { color: 0x6366f1 },
  },
  postprocessing: {
    enabled: true,
    glitch: {
      strength: 0.5,
      frequency: 2, // Glitches per second
    },
  },
}
```

**Interactive Controls**:

- Glitch strength (0 - 1)
- Frequency (0 - 10)
- Trigger manual glitch button

---

### 7. Controls (2 demos)

Different camera control schemes.

---

#### 7.1 Orbit Controls

**Purpose**: Standard orbit/pan/zoom controls (already used in most demos)

**Scene Configuration**: See default template above.

**Interactive Controls**:

- Auto-rotate toggle
- Damping factor
- Min/max distance
- Polar angle limits
- Pan speed

---

#### 7.2 First-Person Controls

**Purpose**: Demonstrate FPS-style camera controls

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 1.6, 5], fov: 90 },
  controls: {
    type: 'FirstPersonControls',
    movementSpeed: 5,
    lookSpeed: 0.1,
    lookVertical: true,
    constrainVertical: true,
    verticalMin: 0,
    verticalMax: Math.PI,
  },
  scene: {
    // Create a simple room to walk around in
    walls: [...],
    floor: { type: 'PlaneGeometry', args: [20, 20] },
  },
}
```

**Interactive Controls**:

- WASD movement
- Mouse look
- Movement speed slider
- Look sensitivity slider

---

### 8. Advanced (2 demos)

Complex demos showcasing library power.

---

#### 8.1 GLTF Model Loader

**Purpose**: Demonstrate 3D model loading and display

**Scene Configuration**:

```typescript
{
  camera: { position: [0, 2, 5] },
  model: {
    type: 'GLTFLoader',
    url: '/assets/models/demo-model.glb',
    scale: [1, 1, 1],
    position: [0, 0, 0],
    animations: 'auto-play', // Play first animation
  },
  lighting: {
    // Enhanced lighting for model showcase
    ambient: { intensity: 0.5 },
    directional: { intensity: 1, position: [5, 10, 7.5] },
    point: [
      { position: [3, 3, 3], intensity: 0.5 },
      { position: [-3, 3, -3], intensity: 0.5 },
    ],
  },
}
```

**Interactive Controls**:

- Model scale
- Animation playback (play/pause)
- Animation speed
- Wireframe overlay toggle

---

#### 8.2 Multi-Scene Composition

**Purpose**: Multiple 3D scenes in one page (picture-in-picture)

**Scene Configuration**:

```typescript
{
  scenes: [
    {
      id: 'main',
      camera: { position: [0, 2, 5] },
      viewport: { x: 0, y: 0, width: '100%', height: '100%' },
      object: { type: 'BoxGeometry' },
    },
    {
      id: 'minimap',
      camera: { position: [0, 10, 0], lookAt: [0, 0, 0] },
      viewport: { x: '80%', y: '80%', width: '20%', height: '20%' },
      object: { type: 'PlaneGeometry', rotation: [-Math.PI / 2, 0, 0] },
    },
  ],
}
```

**Interactive Controls**:

- Toggle minimap
- Minimap zoom level
- Sync camera between scenes

---

## ⚡ Performance Optimization

### Target Metrics

- **60 FPS**: Maintain on mid-range devices (2020+)
- **Load Time**: < 2s for scene initialization
- **Memory**: < 200MB per scene
- **GPU Memory**: < 500MB textures/geometry

---

### Optimization Checklist

**Geometry**:

- [ ] Use BufferGeometry (not legacy Geometry)
- [ ] Merge static geometries
- [ ] Use instanced meshes for repeated objects
- [ ] Limit vertex count (< 100K per object)

**Materials**:

- [ ] Reuse materials across objects
- [ ] Compress textures (WebP, KTX2 for larger files)
- [ ] Use mipmaps for textures
- [ ] Limit total texture memory (< 500MB)

**Lighting**:

- [ ] Limit active lights (< 5 per scene)
- [ ] Disable shadows on distant objects
- [ ] Use baked lightmaps for static scenes
- [ ] Use lower shadow map resolution (512x512 or 1024x1024)

**Rendering**:

- [ ] Enable frustum culling
- [ ] Use renderer.setPixelRatio(window.devicePixelRatio) (capped at 2)
- [ ] Dispose geometries/materials on component destroy
- [ ] Use `requestAnimationFrame` for animation loop

**Postprocessing**:

- [ ] Disable postprocessing on low-end devices
- [ ] Use lower resolution render targets (0.5x scale)
- [ ] Limit to 2-3 passes max

---

### Adaptive Quality

```typescript
export class AdaptiveQualityService {
  private readonly performanceMonitor = inject(PerformanceMonitorService);
  private readonly qualityLevel = signal<'low' | 'medium' | 'high'>('high');

  public monitorPerformance(): void {
    effect(() => {
      const fps = this.performanceMonitor.averageFps();

      if (fps < 30) {
        this.qualityLevel.set('low');
      } else if (fps < 50) {
        this.qualityLevel.set('medium');
      } else {
        this.qualityLevel.set('high');
      }
    });
  }

  public getConfig(): SceneQualityConfig {
    const level = this.qualityLevel();

    return {
      antialias: level !== 'low',
      shadowMapSize: level === 'high' ? 1024 : 512,
      pixelRatio: level === 'high' ? 2 : 1,
      postprocessing: level === 'high',
    };
  }
}
```

---

## ♿ Accessibility

### Keyboard Controls

**Standard Bindings**:

- `Arrow Keys`: Rotate camera (orbit controls)
- `W/A/S/D`: Move camera (first-person controls)
- `+/-`: Zoom in/out
- `Space`: Pause/resume animation
- `R`: Reset camera position
- `H`: Toggle help overlay

**Implementation**:

```typescript
@HostListener('window:keydown', ['$event'])
handleKeyboard(event: KeyboardEvent) {
  switch(event.key) {
    case 'ArrowLeft':
      this.rotateCamera('left');
      break;
    case 'ArrowRight':
      this.rotateCamera('right');
      break;
    case ' ':
      this.toggleAnimation();
      event.preventDefault();
      break;
    case 'r':
      this.resetCamera();
      break;
  }
}
```

---

### Reduced Motion

```typescript
@media (prefers-reduced-motion: reduce) {
  // Disable auto-rotation
  .scene-container {
    --auto-rotate: false;
  }
}
```

```typescript
export class SceneComponent {
  private readonly prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngOnInit() {
    if (this.prefersReducedMotion) {
      this.autoRotate = false;
      this.animationSpeed = 0.1; // Slow down animations
    }
  }
}
```

---

### Screen Reader Announcements

```html
<div class="scene-container" role="img" aria-label="Interactive 3D demonstration of box geometry">
  <canvas #canvas></canvas>

  <!-- Live region for state changes -->
  <div aria-live="polite" aria-atomic="true" class="sr-only">{{ sceneStatus }}</div>
</div>
```

```typescript
sceneStatus = signal('3D scene loaded. Use arrow keys to rotate.');

rotateCamera(direction: string) {
  // ... rotation logic
  this.sceneStatus.set(`Camera rotated ${direction}`);
}
```

---

## 📱 Responsive Behaviors

### Mobile (0-767px)

**Modifications**:

- Reduce particle counts (50%)
- Lower shadow map resolution (512x512)
- Disable postprocessing
- Touch controls (pinch to zoom, swipe to rotate)
- Aspect ratio: 16:9 (portrait-friendly)

```typescript
@media (max-width: 767px) {
  .scene-container {
    aspect-ratio: 16 / 9;
  }
}
```

```typescript
get particleCount(): number {
  return this.isMobile ? 5000 : 10000;
}
```

---

### Tablet (768-1023px)

**Modifications**:

- Moderate particle counts (75%)
- Medium shadow maps (1024x1024)
- Selective postprocessing (bloom only)
- Aspect ratio: 4:3

---

### Desktop (1024px+)

**Full quality**:

- Maximum particle counts
- High shadow maps (2048x2048 on high-end)
- All postprocessing enabled
- Aspect ratio: 4:3

---

## 🧪 Testing Scenarios

### Visual Tests

- [ ] All materials render correctly
- [ ] Shadows appear sharp and realistic
- [ ] Lighting matches brand colors
- [ ] No z-fighting or flickering
- [ ] Smooth animations at 60fps

### Interaction Tests

- [ ] Orbit controls respond smoothly
- [ ] Keyboard controls work
- [ ] Touch controls work on mobile
- [ ] Sliders update scene in real-time
- [ ] Reset button restores default state

### Performance Tests

- [ ] 60fps on target devices
- [ ] < 2s load time
- [ ] No memory leaks (run for 5 minutes)
- [ ] Graceful degradation on low-end devices

---

## 📋 Next Steps

**3D scene design specifications are now complete.**

**Handoff to**: Software Architect (Phase 4)

**Architect will reference**:

1. Visual design specification (UI components, design tokens)
2. Design assets inventory (logos, icons, images)
3. **This 3D scene spec** (lighting, materials, camera configs)
4. Requirements document (functional requirements)

**Developer Implementation**:

1. Create Angular components for each demo scene
2. Implement default scene template
3. Add interactive controls (sliders, color pickers)
4. Integrate performance monitoring
5. Test on mobile/tablet/desktop
6. Verify accessibility (keyboard nav, reduced motion)

---

## Document Metadata

- **Task ID**: TASK_2026_011
- **Phase**: 3 - UI/UX Design
- **Deliverable**: 3D Scene Design Specifications
- **Created**: 2026-01-27
- **Scene Count**: 23+ interactive demos
- **Categories**: 8 (Primitives, Particles, Text, Lighting, Effects, Postprocessing, Controls, Advanced)
- **Performance Target**: 60fps
- **Status**: ✅ Complete
