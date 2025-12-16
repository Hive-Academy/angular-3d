# 08 - SVG 3D Icons (Extruded Logos)

## Overview

Load SVG files and convert them to 3D extruded meshes for logo displays.

## Required Libraries

```bash
npm install three-stdlib # For SVGLoader
```

## Basic SVG Loading

```javascript
import { SVGLoader } from 'three-stdlib';

const svgLoader = new SVGLoader();

svgLoader.load('/assets/images/logos/nestjs.svg', (data) => {
  const paths = data.paths;
  const group = new THREE.Group();

  paths.forEach((path) => {
    const shapes = SVGLoader.createShapes(path);

    shapes.forEach((shape) => {
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshStandardMaterial({
        color: 0xe0234e, // NestJS red
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
    });
  });

  // Center and scale the group
  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  group.position.sub(center);

  // Scale to appropriate size
  const size = box.getSize(new THREE.Vector3());
  const scale = 10 / Math.max(size.x, size.y, size.z);
  group.scale.setScalar(scale);

  // Flip Y (SVG coordinates are inverted)
  group.scale.y *= -1;

  scene.add(group);
});
```

## Extruded 3D SVG

```javascript
function loadExtrudedSVG(svgPath, options = {}) {
  const { position = [0, 0, 0], scale = 0.05, extrudeDepth = 0.5, color = 0xffffff, emissive = 0x000000, emissiveIntensity = 0.3, metalness = 0.2, roughness = 0.6 } = options;

  svgLoader.load(svgPath, (data) => {
    const paths = data.paths;
    const group = new THREE.Group();

    // Extrude settings
    const extrudeSettings = {
      depth: extrudeDepth,
      bevelEnabled: false,
    };

    paths.forEach((path) => {
      const shapes = SVGLoader.createShapes(path);

      shapes.forEach((shape) => {
        // Use ExtrudeGeometry for 3D depth
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Use SVG color or override
        const fillColor = path.userData?.style?.fill || color;

        const material = new THREE.MeshStandardMaterial({
          color: fillColor,
          emissive: emissive,
          emissiveIntensity: emissiveIntensity,
          metalness: metalness,
          roughness: roughness,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      });
    });

    // Center the group
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.sub(center);

    // Scale uniformly
    const size = box.getSize(new THREE.Vector3());
    const scaleFactor = scale / Math.max(size.x, size.y, size.z);
    group.scale.set(scaleFactor, -scaleFactor, scaleFactor); // Flip Y

    // Position
    group.position.set(...position);

    // Rotate to face camera (optional)
    group.rotation.x = Math.PI; // Flip to face forward

    scene.add(group);
  });
}
```

## Color Override for SVG

```javascript
function loadSVGWithColorOverride(svgPath, colorOverride, emissiveColor) {
  svgLoader.load(svgPath, (data) => {
    const paths = data.paths;
    const group = new THREE.Group();

    const extrudeSettings = { depth: 0.5, bevelEnabled: false };

    paths.forEach((path) => {
      const shapes = SVGLoader.createShapes(path);

      shapes.forEach((shape) => {
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        const material = new THREE.MeshStandardMaterial({
          color: colorOverride, // Force specific color
          emissive: emissiveColor, // Glow color
          emissiveIntensity: 0.4,
          metalness: 0.2,
          roughness: 0.6,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      });
    });

    // Center, scale, position...
    centerAndScaleGroup(group);
    scene.add(group);
  });
}

// Usage - LangChain logo with green override
loadSVGWithColorOverride(
  '/assets/images/logos/langchain.svg',
  0x1c3c3c, // Dark green
  0x10b981 // Emerald glow
);
```

## Tech Stack Logo Layout

```javascript
import gsap from 'gsap';

// Position logos in circular pattern
const logoData = [
  { svg: '/assets/logos/nestjs.svg', color: 0xe0234e, position: [-8, 3, -15] },
  { svg: '/assets/logos/langchain.svg', color: 0x1c3c3c, position: [-8, -3, -15] },
  { svg: '/assets/logos/chroma.svg', color: null, position: [8, -3, -15] }, // Multi-color
  { svg: '/assets/logos/neo4j.svg', color: 0x008cc1, position: [8, 3, -15] },
];

logoData.forEach((logo) => {
  loadExtrudedSVG(logo.svg, {
    position: logo.position,
    scale: 0.2,
    extrudeDepth: 0.5,
    color: logo.color,
    emissive: logo.color,
    emissiveIntensity: 0.3,
  });
});
```

## Float Animation for Logos

```javascript
function addFloatToSVG(group, height = 0.2, speed = 2000) {
  gsap.to(group.position, {
    y: `+=${height}`,
    duration: speed / 1000,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
}

svgLoader.load('/assets/logos/logo.svg', (data) => {
  const group = createSVGGroup(data);
  scene.add(group);
  addFloatToSVG(group, 0.2, 2000);
});
```

## Key Concepts

### SVG Coordinate System

- **Origin**: Top-left (different from Three.js)
- **Y-axis**: Inverted (down is positive)
- **Solution**: Scale Y by -1 and rotate X by π

### ShapeGeometry vs ExtrudeGeometry

- **ShapeGeometry**: Flat 2D shapes (no depth)
- **ExtrudeGeometry**: 3D with depth parameter

### Centering

- Use `Box3` to calculate bounding box
- Subtract center position to center at origin
- Scale uniformly based on max dimension

### Multi-Color SVGs

- ChromaDB logo has multiple colors
- Don't override color to preserve original palette
- Access `path.userData.style.fill` for SVG colors

## Performance Tips

- **Merge geometries**: Combine multiple shapes into one mesh
- **Simplify SVG**: Remove unnecessary paths before exporting
- **Scale appropriately**: Keep SVG scale < 1 for fewer vertices
- **Static logos**: Don't animate all logos (select 1-2 for motion)

## Next Steps

See **09-post-processing.md** for bloom and glow effects.
