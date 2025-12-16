# 01 - Basic Three.js Scene Setup

## Overview

Foundation for any Three.js scene with renderer, camera, and render loop.

## Required Libraries

```bash
npm install three
```

## Basic Scene Code

```javascript
import * as THREE from 'three';

// Scene container
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011); // Dark blue space

// Camera (Perspective)
const camera = new THREE.PerspectiveCamera(
  75, // FOV in degrees
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);
camera.position.set(0, 0, 20); // Position camera 20 units back

// WebGL Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2x for performance
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

## Key Concepts

### Camera FOV & Positioning

- **FOV 75°**: Wide enough for immersive 3D, not too distorted
- **Camera Z=20**: All objects positioned between Z=-10 and Z=10 will be visible
- Objects at Z=0 are at the "viewport plane" (screen surface)

### Renderer Settings

- **antialias**: Smooth edges (GPU intensive)
- **shadowMap**: Enable for realistic shadows from lights
- **pixelRatio**: Cap at 2x to prevent performance issues on high-DPI displays

### Render Loop

- `requestAnimationFrame`: Syncs with browser refresh (60fps)
- Call `renderer.render(scene, camera)` each frame
- Update animations/physics before rendering

## Next Steps

See **02-lighting.md** for adding lights to illuminate objects.
