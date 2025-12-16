# 02 - Scene Lighting

## Overview

Different light types to illuminate 3D objects realistically.

## Light Types

### 1. Ambient Light

Uniform light affecting all objects equally (no direction).

```javascript
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambientLight);
```

**Use case**: Base illumination, prevents pure black shadows

### 2. Directional Light

Parallel rays like sunlight. Best for main scene lighting.

```javascript
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
directionalLight.position.set(30, 15, 25);
directionalLight.castShadow = true;

// Shadow quality settings
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;

scene.add(directionalLight);
```

**Use case**: Main key light, realistic shadows

### 3. Point Light

Radiates light in all directions from a point (like a light bulb).

```javascript
const pointLight = new THREE.PointLight(0xffffff, 1.3, 15, 2);
pointLight.position.set(10, 5, 5);
pointLight.castShadow = true;
scene.add(pointLight);
```

**Parameters**: color, intensity, distance (falloff), decay (physical=2)

**Use case**: Localized glow effects, planet atmospheres

### 4. Hemisphere Light

Sky + ground colors for outdoor scenes.

```javascript
const hemiLight = new THREE.HemisphereLight(
  0x0088ff, // Sky color (blue)
  0xff8800, // Ground color (orange)
  0.5 // Intensity
);
scene.add(hemiLight);
```

**Use case**: Soft ambient with color variation (top vs bottom)

## Space Scene Lighting Setup

```javascript
// Very low ambient for dark space
const ambient = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambient);

// Directional as "sun" light
const sun = new THREE.DirectionalLight(0xffffff, 0.3);
sun.position.set(30, 15, 25);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
scene.add(sun);

// Point light for planet glow
const planetGlow = new THREE.PointLight(0x00d4ff, 0.2, 20);

planetGlow.position.set(0, 0, 0); // At planet center
scene.add(planetGlow);
```

## Key Principles

- **Space scenes**: Very low ambient (0.05) for darkness
- **Directional**: Primary light source with shadows
- **Point lights**: Localized effects (planet atmospheres, ship engines)
- **Shadow quality**: Higher mapSize = sharper shadows (performance cost)

## Next Steps

See **03-planet-rendering.md** for creating textured sphere planets.
