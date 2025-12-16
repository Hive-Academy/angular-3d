# 06 - Particle Text Rendering

## Overview

Render text as thousands of particles using canvas sampling and instanced meshes.

## Technique: Canvas Text Sampling

### Step 1: Sample Text Pixels

```javascript
function sampleTextCoordinates(text, fontSize) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Setup canvas
  ctx.font = `bold ${fontSize}px Arial`;
  const metrics = ctx.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(fontSize * 1.2);

  canvas.width = textWidth;
  canvas.height = textHeight;

  // Render text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // Sample pixels
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const positions = [];

  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      const index = (y * canvas.width + x) * 4;
      const alpha = data[index + 3];

      if (alpha > 128) {
        // Normalize to centered coordinates
        const nx = (x - canvas.width / 2) / fontSize;
        const ny = -(y - canvas.height / 2) / fontSize;
        positions.push({ x: nx, y: ny });
      }
    }
  }

  return positions;
}
```

### Step 2: Create Instanced Particle System

```javascript
function createParticleText(text, fontSize, particlesPerPixel) {
  const samples = sampleTextCoordinates(text, fontSize);

  // Geometry for each particle (small plane)
  const particleGeometry = new THREE.PlaneGeometry(0.1, 0.1);

  // Create smoke texture for particles
  const smokeTexture = createSmokeTexture(); // See below

  // Material with alpha map
  const material = new THREE.MeshBasicMaterial({
    map: smokeTexture,
    color: 0x00d4ff,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // Calculate total particles
  const totalParticles = samples.length * particlesPerPixel;

  // Create instanced mesh
  const instancedMesh = new THREE.InstancedMesh(particleGeometry, material, totalParticles);

  // Position each instance
  const dummy = new THREE.Object3D();
  let instanceIndex = 0;

  samples.forEach((sample) => {
    for (let p = 0; p < particlesPerPixel; p++) {
      // Add small random offset for volumetric effect
      const offsetX = (Math.random() - 0.5) * 0.05;
      const offsetY = (Math.random() - 0.5) * 0.05;
      const offsetZ = (Math.random() - 0.5) * 0.1;

      dummy.position.set(sample.x + offsetX, sample.y + offsetY, offsetZ);

      // Random scale variation
      const scale = 0.8 + Math.random() * 0.4;
      dummy.scale.set(scale, scale, 1);

      dummy.updateMatrix();
      instancedMesh.setMatrixAt(instanceIndex, dummy.matrix);
      instanceIndex++;
    }
  });

  instancedMesh.instanceMatrix.needsUpdate = true;
  return instancedMesh;
}
```

### Step 3: Create Smoke Texture

```javascript
function createSmokeTexture() {
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Radial gradient with soft falloff
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}
```

### Step 4: Billboard Rotation (Face Camera)

```javascript
// In render loop, make particles face camera
function animate() {
  requestAnimationFrame(animate);

  // Update each particle to face camera
  const cameraQuaternion = camera.quaternion;
  const dummy = new THREE.Object3D();

  for (let i = 0; i < instancedMesh.count; i++) {
    instancedMesh.getMatrixAt(i, dummy.matrix);
    dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

    // Apply camera rotation
    dummy.quaternion.copy(cameraQuaternion);

    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;

  renderer.render(scene, camera);
}
```

## Usage Example

```javascript
const particleText = createParticleText('HELLO', 60, 3);
particleText.position.set(0, 5, 0);
scene.add(particleText);
```

## Key Concepts

### Instanced Mesh

- Render thousands of identical objects efficiently
- One draw call for all instances
- Update matrices to reposition/rotate instances

### Canvas Sampling

- Render text to 2D canvas
- Read pixel alpha values
- Convert to 3D positions

### Billboard Rotation

- Particles always face camera
- Copy camera's quaternion to each particle
- Creates flat "sprite-like" appearance

## Performance Tips

- **Particle density**: 2-5 particles per pixel is good
- **Font size**: 40-100 for balanced detail/performance
- **Instanced rendering**: 10,000+ particles with minimal performance hit
- **Update frequency**: Only update billboard rotation if camera moves

## Next Steps

See **07-gltf-models.md** for loading 3D models with animations.
