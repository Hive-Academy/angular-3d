# 09 - Post-Processing (Bloom Effects)

## Overview

Add realistic glow/bloom to bright scene elements using EffectComposer.

## Required Library

```bash
npm install three
```

## Basic Bloom Setup

```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

// Create composer
const composer = new EffectComposer(renderer);

// Add render pass (renders the scene)
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add bloom pass
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), // Resolution
  0.5, // Strength (intensity)
  0.5, // Radius (glow size)
  0.8 // Threshold (brightness cutoff 0-1)
);
composer.addPass(bloomPass);

// Render with composer instead of renderer
function animate() {
  requestAnimationFrame(animate);
  composer.render(); // Use composer.render() instead of renderer.render()
}
animate();
```

## Space Scene Bloom Configuration

```javascript
// Very subtle bloom for space scenes
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5, // Intensity: 0.3-0.8 (subtle glow)
  0.5, // Radius: 0.4-0.6 (soft spread)
  0.8 // Threshold: 0.7-0.9 (only bright objects glow)
);

composer.addPass(bloomPass);
```

## SMAA Anti-Aliasing

```javascript
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';

// Add SMAA for better edge quality (after bloom)
const smaaPass = new SMAAPass(window.innerWidth * renderer.getPixelRatio(), window.innerHeight * renderer.getPixelRatio());
composer.addPass(smaaPass);
```

## Selective Bloom (Only Some Objects Glow)

### Setup Layers

```javascript
// Create bloom layer
const BLOOM_LAYER = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_LAYER);

// Configure camera to see all layers
camera.layers.enable(BLOOM_LAYER);

// Mark objects for bloom
const glowingStar = new THREE.Mesh(geometry, material);
glowingStar.layers.enable(BLOOM_LAYER);
scene.add(glowingStar);

// Regular objects (no bloom)
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
// Don't add to bloom layer
scene.add(planet);
```

### Render with Two Passes

```javascript
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Selective bloom rendering
const materials = {};

function darkenNonBloomed(obj) {
  if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
    materials[obj.uuid] = obj.material;
    obj.material = new THREE.MeshBasicMaterial({ color: 0x000000 });
  }
}

function restoreMaterial(obj) {
  if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Darken non-bloomed objects
  scene.traverse(darkenNonBloomed);

  // Render bloom
  bloomComposer.render();

  // Restore materials
  scene.traverse(restoreMaterial);

  // Render final scene
  finalComposer.render();
}
```

## Adjust Bloom Dynamically

```javascript
// Create controls (e.g., dat.gui)
const bloomParams = {
  strength: 0.5,
  radius: 0.5,
  threshold: 0.8,
};

// Update bloom parameters
function updateBloom() {
  bloomPass.strength = bloomParams.strength;
  bloomPass.radius = bloomParams.radius;
  bloomPass.threshold = bloomParams.threshold;
}

// Example: Increase bloom on hover
function onMouseOver() {
  bloomParams.strength = 1.5;
  updateBloom();
}
```

## Common Bloom Settings

### Subtle Glow (Space Scenes)

```javascript
strength: 0.3 - 0.5;
radius: 0.4 - 0.6;
threshold: 0.7 - 0.9;
```

### Dramatic Glow (Neon Scenes)

```javascript
strength: 1.5 - 2.5;
radius: 0.8 - 1.0;
threshold: 0.3 - 0.5;
```

### Minimal Bloom (Realistic)

```javascript
strength: 0.2 - 0.3;
radius: 0.3 - 0.4;
threshold: 0.9 - 0.95;
```

## Performance Optimization

```javascript
// Reduce bloom resolution for better performance
const bloomResolution = new THREE.Vector2(
  window.innerWidth / 2, // Half resolution
  window.innerHeight / 2
);

const bloomPass = new UnrealBloomPass(bloomResolution, 0.5, 0.5, 0.8);

// Update on resize
window.addEventListener('resize', () => {
  bloomResolution.set(window.innerWidth / 2, window.innerHeight / 2);
  composer.setSize(window.innerWidth, window.innerHeight);
});
```

## Handle Window Resize

```javascript
window.addEventListener('resize', () => {
  // Update camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Update composer
  composer.setSize(window.innerWidth, window.innerHeight);

  // Update bloom pass resolution
  bloomPass.resolution.set(window.innerWidth, window.innerHeight);
});
```

## Key Concepts

### Threshold

- Controls which objects glow
- 0 = everything glows, 1 = only pure white glows
- Space scenes: 0.7-0.9 (only bright stars/lights)

### Strength

- Bloom intensity multiplier
- Higher = stronger glow
- Too high = washed out, eye strain

### Radius

- Size of glow spread
- Higher = larger, softer glow
- Lower = tighter, sharper glow

### Performance Impact

- Bloom is GPU-intensive (fragment shader)
- Use lower resolution (half or quarter)
- Combine with SMAA for better quality

## Next Steps

See **10-camera-controls.md** for OrbitControls implementation.
