# 04 - Star Fields (Point Sprites)

## Overview

Render thousands of stars efficiently using THREE.Points with procedural glow textures.

## Required Library

```bash
npm install maath # For random sphere distribution
```

## Star Glow Texture Generation

```javascript
// Create procedural star texture (radial gradient)
function createStarTexture() {
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Radial gradient (bright center → transparent edges)
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}
```

## Star Field with Size Variation

```javascript
import { random } from 'maath';

function createStarField(starCount, radius) {
  // Generate random positions in sphere
  const positions = random.inSphere(new Float32Array(starCount * 3), { radius });

  // Create buffer geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Generate size array (80% small, 15% medium, 4% large, 1% huge)
  const sizes = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    const rand = Math.random();
    if (rand < 0.8) {
      sizes[i] = 0.05 + Math.random() * 0.05; // Tiny
    } else if (rand < 0.95) {
      sizes[i] = 0.1 + Math.random() * 0.1; // Small
    } else if (rand < 0.99) {
      sizes[i] = 0.2 + Math.random() * 0.15; // Medium
    } else {
      sizes[i] = 0.35 + Math.random() * 0.25; // Large
    }
  }
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Generate colors (stellar temperature colors)
  const colors = new Float32Array(starCount * 3);
  const starColors = [
    new THREE.Color(0x9bb0ff), // Blue (hot)
    new THREE.Color(0xaabfff), // Blue-white
    new THREE.Color(0xcad7ff), // White
    new THREE.Color(0xfff4ea), // Yellow-white
    new THREE.Color(0xffd2a1), // Orange
  ];

  for (let i = 0; i < starCount; i++) {
    const color = starColors[Math.floor(Math.random() * starColors.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Create material with glow texture
  const starTexture = createStarTexture();
  const material = new THREE.PointsMaterial({
    size: 1,
    map: starTexture,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true, // Stars get smaller with distance
  });

  const starField = new THREE.Points(geometry, material);
  return starField;
}

// Create multiple layers for depth
const bgStars = createStarField(3000, 50); // Far background
const midStars = createStarField(2000, 40); // Mid-ground
const fgStars = createStarField(2500, 30); // Foreground

scene.add(bgStars, midStars, fgStars);
```

## Twinkle Animation

```javascript
let twinkleTime = 0;

function animate() {
  requestAnimationFrame(animate);

  twinkleTime += 0.01;

  // Animate star sizes for twinkling (only foreground layer)
  const sizes = fgStars.geometry.attributes.size.array;
  for (let i = 0; i < sizes.length; i++) {
    const baseSize = sizes[i];
    const twinkle = Math.sin(twinkleTime + i * 0.1) * 0.3 + 0.7; // 0.4 to 1.0
    sizes[i] = baseSize * twinkle;
  }
  fgStars.geometry.attributes.size.needsUpdate = true;

  renderer.render(scene, camera);
}
```

## Key Concepts

### BufferGeometry

- Efficient way to store vertex data (positions, colors, sizes)
- Use `Float32Array` for performance
- Call `needsUpdate = true` when modifying attributes

### PointsMaterial

- `vertexColors`: Use color attribute from geometry
- `sizeAttenuation`: Stars shrink with distance (realistic)
- `AdditiveBlending`: Stars glow and blend together
- `depthWrite: false`: Prevent z-fighting between layers

### Performance

- 5000-8000 stars across layers: Good performance
- Use `sizeAttenuation: true` for realistic depth
- Only animate one layer for twinkling (reduce CPU load)

## Next Steps

See **05-nebula-effects.md** for volumetric cloud rendering.
