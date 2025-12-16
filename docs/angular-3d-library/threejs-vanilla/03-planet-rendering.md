# 03 - Planet Rendering

## Overview

Create realistic planets using sphere geometry, textures, and material properties.

## Basic Planet (Procedural Material)

```javascript
// Create sphere geometry
const planetGeometry = new THREE.SphereGeometry(
  3.0, // Radius
  150, // Width segments (higher = smoother)
  150 // Height segments
);

// Standard material with properties
const planetMaterial = new THREE.MeshStandardMaterial({
  color: 0xcccccc, // Base color
  metalness: 0.3, // How metallic (0-1)
  roughness: 0.7, // Surface roughness (0-1)
  emissive: 0x333333, // Self-illumination color
  emissiveIntensity: 0.2, // Glow strength
});

const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(0, 0, -9);
planet.castShadow = true;
planet.receiveShadow = true;
scene.add(planet);
```

## Textured Planet (Earth/Moon)

```javascript
import { TextureLoader } from 'three';

const textureLoader = new TextureLoader();

// Load textures
const earthTexture = textureLoader.load('/assets/earth.jpg');
const earthBump = textureLoader.load('/assets/earth.jpg'); // Reuse for bump

const planetGeometry = new THREE.SphereGeometry(2.3, 150, 150);
const planetMaterial = new THREE.MeshStandardMaterial({
  map: earthTexture, // Color texture
  bumpMap: earthBump, // Height variation
  bumpScale: 1, // Bump intensity
  metalness: 0.2,
  roughness: 0.8,
  emissive: 0x001122,
  emissiveIntensity: 0.05,
});

const earth = new THREE.Mesh(planetGeometry, planetMaterial);
earth.position.set(0, 0, -9);
scene.add(earth);
```

## Rotation Animation

```javascript
// In render loop
function animate() {
  requestAnimationFrame(animate);

  // Rotate planet
  planet.rotation.y += 0.001; // Slow rotation

  renderer.render(scene, camera);
}
```

## Atmospheric Glow Effect

```javascript
// Add point light at planet center
const atmosphereGlow = new THREE.PointLight(
  0x00d4ff, // Cyan glow color
  0.2, // Low intensity
  20, // Distance
  2 // Decay
);
atmosphereGlow.position.copy(planet.position);
scene.add(atmosphereGlow);
```

## Moon/Dark Planet

```javascript
const moonTexture = textureLoader.load('/assets/moon.jpg');
const moonGeometry = new THREE.SphereGeometry(3.0, 150, 150);
const moonMaterial = new THREE.MeshStandardMaterial({
  map: moonTexture,
  bumpMap: moonTexture,
  bumpScale: 1,
  metalness: 0.1,
  roughness: 0.9,
  emissive: 0x8b00ff, // Purple emissive
  emissiveIntensity: 0.3,
});

const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.set(10, -5, 0);
scene.add(moon);

// Add purple glow
const moonGlow = new THREE.PointLight(0x8b00ff, 0.2, 20);
moonGlow.position.copy(moon.position);
scene.add(moonGlow);
```

## Key Material Properties

- **metalness** (0-1): Non-metal (0) → Pure metal (1)
- **roughness** (0-1): Mirror smooth (0) → Rough matte (1)
- **emissive**: Self-illumination color (unaffected by lights)
- **emissiveIntensity**: Glow strength
- **bumpMap**: Creates surface detail without geometry

## Performance Tips

- **Segments**: 64-150 is good balance (higher = more polygons)
- **Textures**: Power of 2 sizes (512, 1024, 2048) for best performance
- **Shadows**: Only enable if object is lit and needs shadows

## Next Steps

See **04-star-fields.md** for creating thousands of background stars.
