# 07 - GLTF Model Loading & Animation

## Overview

Load 3D models in GLTF/GLB format and animate them using GSAP.

## Required Libraries

```bash
npm install three gsap
npm install three-stdlib # For GLTFLoader
```

## Basic GLTF Loading

```javascript
import { GLTFLoader } from 'three-stdlib';

const loader = new GLTFLoader();

loader.load(
  '/assets/3d/mini_robot.glb',
  (gltf) => {
    const model = gltf.scene;

    // Position and scale
    model.position.set(3, 6, -8);
    model.scale.set(0.05, 0.05, 0.05);
    model.rotation.set(0, 0, 0);

    // Enable shadows
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(model);
  },
  (progress) => {
    console.log('Loading:', (progress.loaded / progress.total) * 100 + '%');
  },
  (error) => {
    console.error('Error loading model:', error);
  }
);
```

## Material Customization

```javascript
loader.load('/assets/3d/robo_head/scene.gltf', (gltf) => {
  const model = gltf.scene;

  // Customize materials
  model.traverse((child) => {
    if (child.isMesh) {
      const material = child.material;

      if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
        // Enhance metallic properties
        material.emissiveIntensity = 0.3;
        material.metalness = 0.5;
        material.roughness = 0.5;

        // Add emissive glow
        if (material.emissive) {
          material.emissive.setHex(0x0088ff);
        }
      }

      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  model.position.set(4, 6, -6);
  model.scale.setScalar(1);
  scene.add(model);
});
```

## Draco Compression Support

```javascript
import { DRACOLoader } from 'three-stdlib';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/'); // Path to Draco decoder

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load('/assets/3d/compressed_model.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

## Animation with GSAP

### Simple Rotation

```javascript
import gsap from 'gsap';

loader.load('/assets/3d/planet_earth/scene.gltf', (gltf) => {
  const model = gltf.scene;
  model.position.set(0, 0, -9);
  model.scale.setScalar(2.3);
  scene.add(model);

  // Continuous rotation
  gsap.to(model.rotation, {
    y: Math.PI * 2,
    duration: 60,
    repeat: -1,
    ease: 'none',
  });
});
```

### Float Animation

```javascript
function addFloatAnimation(object, height = 0.2, speed = 2000) {
  const originalY = object.position.y;

  gsap.to(object.position, {
    y: originalY + height,
    duration: speed / 1000,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
}

loader.load('/assets/3d/model.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);
  addFloatAnimation(model, 0.3, 2000);
});
```

### Space Flight Animation

```javascript
function createSpaceFlightPath(object, waypoints, rotations = 4, loop = true) {
  const timeline = gsap.timeline({ repeat: loop ? -1 : 0 });

  waypoints.forEach((waypoint, index) => {
    timeline.to(
      object.position,
      {
        x: waypoint.position[0],
        y: waypoint.position[1],
        z: waypoint.position[2],
        duration: waypoint.duration,
        ease: waypoint.ease || 'power1.inOut',
      },
      index === 0 ? 0 : '>'
    );
  });

  // Add continuous rotation
  const totalDuration = waypoints.reduce((sum, wp) => sum + wp.duration, 0);
  gsap.to(object.rotation, {
    y: Math.PI * 2 * rotations,
    duration: totalDuration,
    repeat: loop ? -1 : 0,
    ease: 'none',
  });

  return timeline;
}

// Usage
const flightPath = [
  { position: [-12, 8, -8], duration: 10, ease: 'power2.inOut' },
  { position: [10, 12, -5], duration: 8, ease: 'power1.inOut' },
  { position: [-6, 4, 10], duration: 9, ease: 'power2.in' },
  { position: [8, 10, -12], duration: 11, ease: 'power2.out' },
];

loader.load('/assets/3d/spaceship.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.setScalar(0.05);
  scene.add(model);
  createSpaceFlightPath(model, flightPath, 4, true);
});
```

## Model Built-in Animations

```javascript
loader.load('/assets/3d/animated_model.glb', (gltf) => {
  const model = gltf.scene;
  scene.add(model);

  // Access animations
  if (gltf.animations && gltf.animations.length) {
    const mixer = new THREE.AnimationMixer(model);

    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
    });

    // Update mixer in render loop
    const clock = new THREE.Clock();
    function animate() {
      const delta = clock.getDelta();
      mixer.update(delta);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  }
});
```

## Key Concepts

### GLTF vs GLB

- **GLTF**: JSON + external files (textures, bin)
- **GLB**: Binary, single file (recommended)

### Material Types

- `MeshStandardMaterial`: PBR materials (most common)
- `MeshPhysicalMaterial`: Advanced PBR (clearcoat, transmission)
- Modify `emissive`, `metalness`, `roughness` for glow effects

### GSAP Timeline

- Chain animations sequentially
- Use `>` to start after previous animation
- `repeat: -1` for infinite loops
- `yoyo: true` for back-and-forth motion

## Performance Tips

- **LOD**: Use lower poly models for distant objects
- **Compression**: Use Draco for 50-90% file size reduction
- **Texture resolution**: 1024x1024 is good balance
- **Shadow casting**: Only enable on hero objects

## Next Steps

See **08-svg-3d-icons.md** for loading SVG files as extruded 3D objects.
