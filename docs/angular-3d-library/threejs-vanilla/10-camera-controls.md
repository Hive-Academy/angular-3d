# 10 - Camera Controls (OrbitControls)

## Overview

Enable user interaction: rotate, zoom, and pan the camera around a target.

## Required Library

```bash
npm install three-stdlib # OrbitControls
```

## Basic OrbitControls

```javascript
import { OrbitControls } from 'three-stdlib';

// Create controls
const controls = new OrbitControls(camera, renderer.domElement);

// Basic configuration
controls.target.set(0, 0, 0); // Look at origin
controls.enableDamping = true; // Smooth motion
controls.dampingFactor = 0.05; // Damping strength

// Update in render loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Required when damping is enabled
  renderer.render(scene, camera);
}
animate();
```

## Full Configuration

```javascript
const controls = new OrbitControls(camera, renderer.domElement);

// Target (look-at point)
controls.target.set(0, 0, 0);

// Damping (smooth, inertial movement)
controls.enableDamping = true;
controls.dampingFactor = 0.05; // 0.05 = smooth, 0.2 = snappy

// Zoom
controls.enableZoom = true;
controls.zoomSpeed = 1.0;
controls.minDistance = 5; // Closest zoom
controls.maxDistance = 50; // Farthest zoom

// Pan (right-click drag)
controls.enablePan = false; // Usually disabled for orbital scenes

// Rotation
controls.enableRotate = true;
controls.rotateSpeed = 0.5; // Sensitivity

// Auto-rotate
controls.autoRotate = false;
controls.autoRotateSpeed = 2.0; // Degrees per second

// Angle constraints
controls.minPolarAngle = 0; // Min vertical angle (0 = straight down)
controls.maxPolarAngle = Math.PI; // Max vertical angle (π = straight up)
controls.minAzimuthAngle = -Infinity; // Min horizontal angle
controls.maxAzimuthAngle = Infinity; // Max horizontal angle
```

## Space Scene Configuration

```javascript
// Typical space scene controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0); // Center on planet/origin
controls.enableDamping = true;
controls.dampingFactor = 0.05; // Smooth rotation
controls.enableZoom = true;
controls.minDistance = 5; // Don't go inside planet
controls.maxDistance = 50; // Max zoom out
controls.rotateSpeed = 0.5; // Gentle rotation
controls.enablePan = false; // No panning in space
controls.maxPolarAngle = Math.PI; // Allow full vertical rotation
```

## Mouse/Touch Events

```javascript
// Listen to control events
controls.addEventListener('change', () => {
  // Camera moved
  console.log('Camera distance:', controls.object.position.distanceTo(controls.target));
});

controls.addEventListener('start', () => {
  // User started interaction
  console.log('Interaction started');
});

controls.addEventListener('end', () => {
  // User stopped interaction
  console.log('Interaction ended');
});
```

## Scroll-to-Zoom with Page Scroll Coordination

```javascript
let isZooming = false;
let scrollTimeout;

// Track zoom state
controls.addEventListener('change', () => {
  const distance = camera.position.distanceTo(controls.target);

  // At max zoom distance
  if (distance >= controls.maxDistance - 0.1) {
    controls.enableZoom = false; // Disable further zoom
    isZooming = false;
  } else if (distance <= controls.minDistance + 0.1) {
    controls.enableZoom = false; // At min zoom
    isZooming = false;
  } else {
    controls.enableZoom = true;
    isZooming = true;
  }
});

// Scroll event handler
window.addEventListener(
  'wheel',
  (event) => {
    const distance = camera.position.distanceTo(controls.target);

    // If at zoom limits, allow page scroll
    if (distance >= controls.maxDistance - 0.1 || distance <= controls.minDistance + 0.1) {
      return; // Don't prevent default - allow page scroll
    }

    // Otherwise, zoom in 3D scene
    event.preventDefault();

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isZooming = false;
    }, 150);
  },
  { passive: false }
);
```

## Keyboard Controls

```javascript
// Add keyboard rotation
const keyState = {};

window.addEventListener('keydown', (e) => {
  keyState[e.key] = true;
});

window.addEventListener('keyup', (e) => {
  keyState[e.key] = false;
});

function animate() {
  requestAnimationFrame(animate);

  // Rotate with arrow keys
  if (keyState['ArrowLeft']) {
    controls.object.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.02);
  }
  if (keyState['ArrowRight']) {
    controls.object.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.02);
  }

  controls.update();
  renderer.render(scene, camera);
}
```

## Camera Position Presets

```javascript
import gsap from 'gsap';

function moveCameraTo(position, target, duration = 2) {
  gsap.to(camera.position, {
    x: position[0],
    y: position[1],
    z: position[2],
    duration: duration,
    onUpdate: () => controls.update(),
  });

  gsap.to(controls.target, {
    x: target[0],
    y: target[1],
    z: target[2],
    duration: duration,
  });
}

// Usage - Switch between views
document.getElementById('btn-front').addEventListener('click', () => {
  moveCameraTo([0, 0, 20], [0, 0, 0], 1.5);
});

document.getElementById('btn-top').addEventListener('click', () => {
  moveCameraTo([0, 20, 5], [0, 0, 0], 1.5);
});
```

## Limit Rotation (Prevent Upside-Down)

```javascript
// Prevent camera from going below ground
controls.minPolarAngle = Math.PI / 6; // 30° from top
controls.maxPolarAngle = Math.PI * 0.8; // 144° (not quite bottom)

// Prevent full 360° horizontal rotation
controls.minAzimuthAngle = -Math.PI / 2; // -90°
controls.maxAzimuthAngle = Math.PI / 2; // +90°
```

## Save/Restore Camera State

```javascript
// Save camera state
function saveCameraState() {
  return {
    position: camera.position.clone(),
    target: controls.target.clone(),
    zoom: camera.zoom,
  };
}

// Restore camera state
function restoreCameraState(state) {
  camera.position.copy(state.position);
  controls.target.copy(state.target);
  camera.zoom = state.zoom;
  camera.updateProjectionMatrix();
  controls.update();
}

// Usage
const savedState = saveCameraState();
// ... later
restoreCameraState(savedState);
```

## Key Concepts

### Damping

- **enableDamping = true**: Smooth, inertial motion
- **dampingFactor**: Lower = smoother, higher = snappier
- **Must call `controls.update()` in render loop**

### Distance Constraints

- **minDistance**: Prevent camera from going inside objects
- **maxDistance**: Limit how far user can zoom out

### Polar Angle (Vertical)

- 0 = Looking straight down
- π/2 = Looking horizontally
- π = Looking straight up

### Azimuth Angle (Horizontal)

- 0 = Facing forward (relative to initial position)
- Positive = Rotate counterclockwise
- Negative = Rotate clockwise

## Performance Tips

- Disable features you don't need (`enablePan`, `autoRotate`)
- Use higher `dampingFactor` (0.1-0.2) for better performance
- Avoid excessive `addEventListener` handlers

## Next Steps

See **11-viewport-positioning.md** for CSS-like 3D positioning system.
