# 11 - Viewport 3D Positioning

## Overview

Position 3D objects using CSS-like coordinates (%, pixels, named positions) instead of arbitrary 3D coordinates.

## Concept: Viewport Plane

```
Camera (Z=20)
     |
     |  FOV cone
     | /
     |/
Viewport Plane (Z=0) ← visible screen area mapped to 3D space
     |\
     | \
     |  Objects at Z<0 appear behind viewport
```

## Calculate Viewport Dimensions

```javascript
class ViewportPositioner {
  constructor(fov, cameraZ, viewportZ = 0, aspect = window.innerWidth / window.innerHeight) {
    this.fov = fov;
    this.cameraZ = cameraZ;
    this.viewportZ = viewportZ;
    this.aspect = aspect;

    // Calculate visible dimensions at viewport plane
    this.viewportHeight = this.calculateViewportHeight();
    this.viewportWidth = this.viewportHeight * this.aspect;
  }

  calculateViewportHeight() {
    const distance = this.cameraZ - this.viewportZ;
    const fovRad = (this.fov * Math.PI) / 180;
    return 2 * Math.tan(fovRad / 2) * distance;
  }
}

// Usage
const positioner = new ViewportPositioner(75, 20, 0);
console.log('Viewport width:', positioner.viewportWidth); // ~35.5 units
console.log('Viewport height:', positioner.viewportHeight); // ~20 units
```

## Named Positions

```javascript
class ViewportPositioner {
  // ... constructor above ...

  getNamedPosition(name, offsetX = 0, offsetY = 0, offsetZ = 0) {
    const halfW = this.viewportWidth / 2;
    const halfH = this.viewportHeight / 2;

    const positions = {
      center: [0, 0],
      'top-left': [-halfW, halfH],
      'top-center': [0, halfH],
      'top-right': [halfW, halfH],
      'middle-left': [-halfW, 0],
      'middle-right': [halfW, 0],
      'bottom-left': [-halfW, -halfH],
      'bottom-center': [0, -halfH],
      'bottom-right': [halfW, -halfH],
    };

    const [x, y] = positions[name];
    return [x + offsetX, y + offsetY, this.viewportZ + offsetZ];
  }
}

// Usage
const pos = positioner.getNamedPosition('top-right', -2, -1, 0);
// Returns: [16.75, 9, 0] (near top-right corner with small offset)
```

## Percentage Positions

```javascript
class ViewportPositioner {
  // ... previous methods ...

  getPercentagePosition(xPercent, yPercent, offsetX = 0, offsetY = 0, offsetZ = 0) {
    // xPercent, yPercent: 0-1 or '0%'-'100%'
    const parsePercent = (val) => {
      if (typeof val === 'string') {
        return parseFloat(val) / 100;
      }
      return val;
    };

    const x = parsePercent(xPercent);
    const y = parsePercent(yPercent);

    // Convert to world coordinates (center = 0, edges = ±half dimension)
    const worldX = (x - 0.5) * this.viewportWidth;
    const worldY = (0.5 - y) * this.viewportHeight; // Invert Y (CSS is top-down)

    return [worldX + offsetX, worldY + offsetY, this.viewportZ + offsetZ];
  }
}

// Usage
const centerPos = positioner.getPercentagePosition(0.5, 0.5); // Center
const topLeftPos = positioner.getPercentagePosition(0.2, 0.15); // 20% from left, 15% from top
```

## Pixel Positions

```javascript
class ViewportPositioner {
  // ... previous methods ...

  getPixelPosition(xPx, yPx, offsetX = 0, offsetY = 0, offsetZ = 0) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Convert pixels to percentage
    const xPercent = xPx / screenWidth;
    const yPercent = yPx / screenHeight;

    return this.getPercentagePosition(xPercent, yPercent, offsetX, offsetY, offsetZ);
  }
}

// Usage
const pos = positioner.getPixelPosition(100, 50); // 100px from left, 50px from top
```

## Complete Helper Class

```javascript
class ViewportPositioner {
  constructor(options = {}) {
    this.fov = options.fov || 75;
    this.cameraZ = options.cameraZ || 20;
    this.viewportZ = options.viewportZ || 0;
    this.aspect = options.aspect || window.innerWidth / window.innerHeight;

    this.viewportHeight = this.calculateViewportHeight();
    this.viewportWidth = this.viewportHeight * this.aspect;
  }

  calculateViewportHeight() {
    const distance = this.cameraZ - this.viewportZ;
    const fovRad = (this.fov * Math.PI) / 180;
    return 2 * Math.tan(fovRad / 2) * distance;
  }

  getPosition(input, options = {}) {
    const { offsetX = 0, offsetY = 0, offsetZ = 0 } = options;

    // Named position (string)
    if (typeof input === 'string') {
      return this.getNamedPosition(input, offsetX, offsetY, offsetZ);
    }

    // Percentage/pixel object
    if (typeof input === 'object' && 'x' in input && 'y' in input) {
      return this.getPercentagePosition(input.x, input.y, offsetX, offsetY, offsetZ);
    }

    throw new Error('Invalid position input');
  }

  getNamedPosition(name, offsetX, offsetY, offsetZ) {
    const halfW = this.viewportWidth / 2;
    const halfH = this.viewportHeight / 2;
    const positions = {
      center: [0, 0],
      'top-left': [-halfW, halfH],
      'top-center': [0, halfH],
      'top-right': [halfW, halfH],
      'middle-left': [-halfW, 0],
      'middle-right': [halfW, 0],
      'bottom-left': [-halfW, -halfH],
      'bottom-center': [0, -halfH],
      'bottom-right': [halfW, -halfH],
    };
    const [x, y] = positions[name] || [0, 0];
    return [x + offsetX, y + offsetY, this.viewportZ + offsetZ];
  }

  getPercentagePosition(xPercent, yPercent, offsetX, offsetY, offsetZ) {
    const parsePercent = (val) => {
      if (typeof val === 'string') return parseFloat(val) / 100;
      return val;
    };
    const x = parsePercent(xPercent);
    const y = parsePercent(yPercent);
    const worldX = (x - 0.5) * this.viewportWidth;
    const worldY = (0.5 - y) * this.viewportHeight;
    return [worldX + offsetX, worldY + offsetY, this.viewportZ + offsetZ];
  }
}
```

## Usage Examples

```javascript
const positioner = new ViewportPositioner({ fov: 75, cameraZ: 20, viewportZ: 0 });

// Position text at top of viewport
const topTextPos = positioner.getPosition({ x: '50%', y: '38%' });
particleText.position.set(...topTextPos);

// Position logo at bottom-right corner with offset
const logoPos = positioner.getPosition('bottom-right', { offsetX: -2, offsetY: 2 });
logo.position.set(...logoPos);

// Position planet at center, behind viewport
const planetPos = positioner.getPosition('center', { offsetZ: -9 });
planet.position.set(...planetPos);

// Circular logo layout
const radius = 8;
const logoPositions = [positioner.getPosition({ x: '50%', y: '20%' }, { offsetZ: -15 }), positioner.getPosition({ x: '20%', y: '50%' }, { offsetZ: -15 }), positioner.getPosition({ x: '50%', y: '80%' }, { offsetZ: -15 }), positioner.getPosition({ x: '80%', y: '50%' }, { offsetZ: -15 })];
```

## Responsive Positioning

```javascript
let positioner = new ViewportPositioner({ fov: 75, cameraZ: 20 });

window.addEventListener('resize', () => {
  // Recreate positioner with new aspect ratio
  positioner = new ViewportPositioner({
    fov: 75,
    cameraZ: 20,
    aspect: window.innerWidth / window.innerHeight,
  });

  // Update all positioned objects
  topText.position.set(...positioner.getPosition({ x: '50%', y: '38%' }));
  logo.position.set(...positioner.getPosition('top-right', { offsetX: -2, offsetY: -1 }));
  // ... update other objects
});
```

## Key Concepts

### Viewport Plane

- 2D plane in 3D space at Z=viewportZ
- Matches visible screen area
- Objects at this Z distance don't change size on zoom

### Coordinate Mapping

- **X**: Left edge = -width/2, Right edge = +width/2
- **Y**: Top edge = +height/2, Bottom edge = -height/2 (inverted from CSS)
- **Z**: viewportZ = 0 (screen surface), negative = behind, positive = in front

### FOV Calculation

- Larger FOV = wider view cone = larger viewport dimensions
- Typical: 50-75° FOV
- Distance matters: farther camera = larger viewport at same FOV

## Advanced: Multiple Viewport Planes

```javascript
// Foreground plane (in front of camera)
const fgPositioner = new ViewportPositioner({ fov: 75, cameraZ: 20, viewportZ: 5 });

// Main viewport plane
const mainPositioner = new ViewportPositioner({ fov: 75, cameraZ: 20, viewportZ: 0 });

// Background plane (far back)
const bgPositioner = new ViewportPositioner({ fov: 75, cameraZ: 20, viewportZ: -30 });

// Position objects at different depths
const fgLogo = positioner.getPosition('top-left'); // Z=5 (close)
const mainText = mainPositioner.getPosition('center'); // Z=0 (screen)
const bgNebula = bgPositioner.getPosition('top-right'); // Z=-30 (far)
```

## Summary

- **Named positions**: Quick placement (top-left, center, etc.)
- **Percentages**: CSS-like positioning (50% = center)
- **Pixels**: Absolute screen coordinates
- **Offsets**: Fine-tune positions in world units
- **Depth (Z)**: Control layering (negative = behind viewport)

This system makes it easy to position 3D objects like you would with CSS, perfect for UI overlays, text, and logo layouts in 3D space.
