# 05 - Volumetric Nebula Effects

## Overview

Two approaches: Sprite-based clouds and shader-based volumetric nebula.

## Approach 1: Sprite-Based Nebula (Simpler)

### Cloud Texture with Fractal Noise

```javascript
import { random } from 'maath';

function createCloudTexture() {
  const canvas = document.createElement('canvas');
  const size = 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  // Generate fractal noise
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size - 0.5;
      const ny = y / size - 0.5;

      // Multi-octave noise (4 layers)
      let noiseValue = 0;
      let amplitude = 1.0;
      let frequency = 2.0;
      let maxValue = 0;

      for (let octave = 0; octave < 4; octave++) {
        noiseValue += amplitude * random.noise.simplex2(nx * frequency, ny * frequency);
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
      }

      noiseValue = (noiseValue / maxValue + 1.0) * 0.5; // Normalize 0-1

      // Radial falloff for cloud shape
      const dist = Math.sqrt(nx * nx + ny * ny);
      const radialMask = Math.max(0, 1.0 - dist * 2.0);

      let alpha = noiseValue * radialMask;
      alpha = Math.pow(alpha, 1.5); // Softer edges

      const idx = (y * size + x) * 4;
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = Math.floor(alpha * 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}
```

### Create Nebula Cloud System

```javascript
function createNebula(cloudCount, radius, colorPalette) {
  const group = new THREE.Group();
  const cloudTexture = createCloudTexture();

  const positions = random.inSphere(new Float32Array(cloudCount * 3), { radius });

  for (let i = 0; i < cloudCount; i++) {
    const idx = i * 3;

    // Random color from palette
    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

    // Random size (large clouds)
    const size = 5 + Math.random() * 10;

    // Create sprite
    const spriteMaterial = new THREE.SpriteMaterial({
      map: cloudTexture,
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.05 + Math.random() * 0.1, // Very low opacity
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(positions[idx], positions[idx + 1], positions[idx + 2]);
    sprite.scale.set(size, size, 1);

    group.add(sprite);
  }

  return group;
}

// Create nebula
const nebula = createNebula(20, 50, ['#ffffff', '#cccccc']);
nebula.position.set(0, 10, -20); // Position far back
scene.add(nebula);
```

## Approach 2: Shader-Based Volumetric Nebula

### Vertex Shader

```glsl
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Fragment Shader

```glsl
uniform float uTime;
uniform float uOpacity;
uniform float uNoiseScale;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;

varying vec2 vUv;
varying vec3 vWorldPosition;

// 3D Simplex noise function (include full implementation from noise library)
// ... (truncated for brevity - use a noise library like lygia or glsl-noise)

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for(int i = 0; i < 5; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  // World-space noise for seamless clouds
  vec3 noiseCoord = vWorldPosition * uNoiseScale + vec3(uTime * 0.01);
  float noise = fbm(noiseCoord);

  // Edge falloff from center
  vec2 centered = vUv * 2.0 - 1.0;
  float distFromCenter = length(centered);
  float edgeFade = 1.0 - smoothstep(0.0, 1.0, distFromCenter);

  // Combine noise with edge fade
  float density = noise * edgeFade;
  density = pow(density, 2.0); // Increase contrast

  // Color mixing
  vec3 color = mix(uPrimaryColor, uSecondaryColor, noise * 0.5 + 0.5);

  gl_FragColor = vec4(color, density * uOpacity);
}
```

### Apply Shader to Plane

```javascript
const nebulaGeometry = new THREE.PlaneGeometry(60, 20, 256, 256);
const nebulaMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShaderCode,
  fragmentShader: fragmentShaderCode,
  uniforms: {
    uTime: { value: 0 },
    uOpacity: { value: 0.6 },
    uNoiseScale: { value: 0.03 },
    uPrimaryColor: { value: new THREE.Color(0x0088ff) },
    uSecondaryColor: { value: new THREE.Color(0x00d4ff) },
  },
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide,
});

const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
nebula.position.set(0, 10, -20);
scene.add(nebula);

// Animate shader
function animate() {
  nebulaMaterial.uniforms.uTime.value += 0.01;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

## Key Concepts

### Additive Blending

- Bright colors add together (creates glow)
- Essential for nebula effects
- Set `depthWrite: false` to prevent layering issues

### Opacity Levels

- Nebula: 0.05-0.15 (very transparent)
- Multiple overlapping clouds create density
- Lower opacity = more realistic wispy look

### Noise Techniques

- **Simplex noise**: Organic, smooth patterns
- **Fractal (FBM)**: Multiple octaves for detail
- **Domain warping**: Distort noise coordinates for tendrils

## Performance Tips

- Sprite-based: Faster, good for 10-30 clouds
- Shader-based: More realistic, higher GPU cost
- Use low poly counts (64-256 segments) for plane geometry

## Next Steps

See **06-particle-text.md** for text rendered as particle clouds.
