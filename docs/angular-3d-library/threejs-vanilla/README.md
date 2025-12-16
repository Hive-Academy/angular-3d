# Three.js Space Scene - Complete Implementation Guide

## Overview

This documentation covers recreating the hero space scene using vanilla Three.js (no Angular). All techniques are framework-agnostic and use standard Three.js APIs with GSAP for animations.

## Document Structure

Each document focuses on a specific technique with complete, runnable code examples:

### 🚀 **[01 - Scene Setup](./01-scene-setup.md)**

Foundation: renderer, camera, render loop, window resize handling

- WebGL renderer configuration
- Perspective camera setup
- Animation loop with requestAnimationFrame
- Responsive canvas sizing

### 💡 **[02 - Lighting](./02-lighting.md)**

Illumination: ambient, directional, point, and hemisphere lights

- Light types and use cases
- Shadow configuration
- Space scene lighting recipe
- Performance considerations

### 🌍 **[03 - Planet Rendering](./03-planet-rendering.md)**

Textured spheres: procedural materials, texture mapping, rotation

- Sphere geometry with segments
- MeshStandardMaterial properties
- Texture loading (Earth, Moon)
- Atmospheric glow effects
- GSAP rotation animations

### ✨ **[04 - Star Fields](./04-star-fields.md)**

Thousands of stars: point sprites, glow textures, size variation

- BufferGeometry with attributes
- Procedural star texture generation
- Multi-layer depth (background, midground, foreground)
- Twinkle animation
- Stellar color temperatures

### ☁️ **[05 - Nebula Effects](./05-nebula-effects.md)**

Volumetric clouds: sprite-based and shader-based approaches

- **Approach 1**: Sprite clouds with fractal noise texture
- **Approach 2**: Shader-based volumetric nebula
- 3D Simplex noise (GLSL)
- Additive blending for glow
- Domain warping techniques

### 📝 **[06 - Particle Text](./06-particle-text.md)**

Text as particles: canvas sampling, instanced meshes, billboard rotation

- Canvas text pixel sampling
- InstancedMesh for performance
- Smoke texture generation
- Billboard rotation (face camera)
- Volumetric particle distribution

### 🤖 **[07 - GLTF Models](./07-gltf-models.md)**

3D model loading: GLTF/GLB files, material customization, animations

- GLTFLoader with Draco compression
- Material property overrides
- GSAP animations (rotation, float, flight paths)
- Built-in model animations (AnimationMixer)
- Shadow configuration

### 🎨 **[08 - SVG 3D Icons](./08-svg-3d-icons.md)**

Logos as 3D objects: SVG loading, extrusion, float animations

- SVGLoader and shape extraction
- ExtrudeGeometry for 3D depth
- Centering and Y-axis flipping
- Color override vs. preserving SVG colors
- Float animation with GSAP

### ✨ **[09 - Post-Processing](./09-post-processing.md)**

Bloom and glow: EffectComposer, UnrealBloomPass, SMAA

- EffectComposer setup
- Bloom parameters (strength, radius, threshold)
- Selective bloom (layer-based)
- SMAA anti-aliasing
- Performance optimization

### 🎮 **[10 - Camera Controls](./10-camera-controls.md)**

User interaction: OrbitControls, zoom, rotate, pan

- OrbitControls configuration
- Damping for smooth motion
- Distance and angle constraints
- Scroll-to-zoom coordination
- Camera animation with GSAP

### 📐 **[11 - Viewport Positioning](./11-viewport-positioning.md)**

CSS-like 3D positioning: percentages, named positions, offsets

- ViewportPositioner utility class
- Named positions (top-left, center, etc.)
- Percentage-based positioning (50% = center)
- Pixel-to-3D coordinate conversion
- Responsive repositioning
- Multiple viewport planes (depth layers)

## Technology Stack

### Core Libraries

```bash
npm install three          # Three.js 3D engine
npm install gsap          # Animation library
npm install three-stdlib  # Loaders and controls
npm install maath         # Math utilities (random sphere distribution)
```

### Module Imports

```javascript
// Core Three.js
import * as THREE from 'three';

// Loaders
import { GLTFLoader } from 'three-stdlib';
import { DRACOLoader } from 'three-stdlib';
import { SVGLoader } from 'three-stdlib';

// Controls
import { OrbitControls } from 'three-stdlib';

// Post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';

// Animation
import gsap from 'gsap';

// Math utilities
import { random } from 'maath';
```

## Scene Architecture

### Layer Structure (Front to Back)

1. **Foreground** (Z = 5 to 10): Particle text, close stars
2. **Viewport Plane** (Z = 0): Main content, logos, UI elements
3. **Midground** (Z = -5 to -10): Planets, models
4. **Background** (Z = -15 to -30): Nebula, star fields
5. **Far Background** (Z = -40 to -50): Distant stars

### Camera Configuration

```javascript
FOV: 75°
Position: [0, 0, 20]
Near plane: 0.1
Far plane: 1000
```

### Performance Budget

- **Stars**: 5,000-8,000 total (across 3 layers)
- **Nebula particles**: 20-60 sprites or 1-2 shader planes
- **Models**: 2-4 GLTF models
- **Particle text**: 5,000-15,000 instanced particles
- **Target**: 60fps on mid-range hardware

## Implementation Order

### Phase 1: Foundation (Day 1)

1. Scene setup (renderer, camera, render loop)
2. Basic lighting
3. Simple planet with rotation

### Phase 2: Environment (Day 2)

4. Star fields (multi-layer)
5. Nebula effects (sprite or shader)
6. Post-processing bloom

### Phase 3: Content (Day 3)

7. Particle text rendering
8. GLTF model loading
9. SVG logo extrusion

### Phase 4: Interaction (Day 4)

10. OrbitControls setup
11. Viewport positioning system
12. GSAP animations (float, flight paths)

### Phase 5: Polish (Day 5)

- Performance optimization
- Responsive design
- Loading states
- Error handling
- Browser compatibility testing

## Key Techniques Summary

### Rendering Efficiency

- **BufferGeometry**: Store vertex data efficiently
- **InstancedMesh**: Render thousands of identical objects
- **Additive blending**: Glow effects without overdraw issues
- **depthWrite: false**: Prevent z-fighting on transparent objects

### Animation Patterns

- **GSAP timelines**: Sequential and simultaneous animations
- **requestAnimationFrame**: 60fps render loop
- **Damping**: Smooth, inertial motion (OrbitControls)
- **Easing**: Natural acceleration/deceleration

### Material Properties

- **emissive + emissiveIntensity**: Self-illumination
- **metalness + roughness**: PBR surface properties
- **transparent + opacity**: Alpha blending
- **blending modes**: Normal, Additive, Multiply

### Shader Techniques

- **Simplex noise**: Organic, smooth patterns
- **Fractal noise (FBM)**: Multi-octave detail
- **Domain warping**: Distorted noise for tendrils
- **Radial gradients**: Soft falloff masks

## Common Pitfalls

### Performance

- ❌ Too many geometries with high segment counts
- ✅ Use LOD (Level of Detail) for distant objects
- ❌ Updating all particle matrices every frame
- ✅ Only update when camera moves or animation required

### Rendering

- ❌ Forgetting `material.needsUpdate = true` after changes
- ✅ Set flag when modifying material properties
- ❌ Z-fighting on overlapping transparent objects
- ✅ Use `renderOrder` and `depthWrite: false`

### Coordinates

- ❌ Confusing SVG coordinate system (Y-inverted)
- ✅ Scale Y by -1 and rotate X by π
- ❌ Arbitrary 3D positions without spatial meaning
- ✅ Use viewport positioning system for consistency

### Memory

- ❌ Not disposing geometries/materials on removal
- ✅ Call `.dispose()` on cleanup
- ❌ Loading full-resolution textures unnecessarily
- ✅ Use appropriate texture sizes (1024x1024 is often enough)

## Browser Compatibility

### Required Features

- WebGL 1.0 (widely supported)
- ES6 modules
- requestAnimationFrame
- Canvas 2D context (for texture generation)

### Fallbacks

- Detect WebGL support
- Provide static image fallback
- Graceful degradation on low-end devices

### Tested Browsers

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ Mobile browsers (reduce particle counts)

## Resources

### Official Documentation

- [Three.js Docs](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
- [GSAP Docs](https://greensock.com/docs/)

### Learning Resources

- [Three.js Journey](https://threejs-journey.com/)
- [Discover Three.js](https://discoverthreejs.com/)
- [The Book of Shaders](https://thebookofshaders.com/)

### Tools

- [Spector.js](https://spector.babylonjs.com/) - WebGL debugging
- [Stats.js](https://github.com/mrdoob/stats.js/) - Performance monitoring
- [dat.GUI](https://github.com/dataarts/dat.gui) - Runtime parameter tweaking

## Next Steps

1. **Start with [01-scene-setup.md](./01-scene-setup.md)** for basic Three.js initialization
2. **Follow documents in order** for incremental feature addition
3. **Experiment with parameters** using dat.GUI or custom controls
4. **Profile performance** using browser DevTools
5. **Optimize for target devices** based on performance metrics

---

**Note**: All code examples are complete and runnable. Copy/paste them into your project and adjust parameters to match your design requirements.
