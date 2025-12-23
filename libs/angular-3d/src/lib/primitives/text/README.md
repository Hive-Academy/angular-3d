# Troika Text Components

Production-quality 3D text rendering using troika-three-text SDF technology.

## Overview

These components provide sharp, scalable text at any zoom level with full Unicode support.
Text is rendered using SDF (Signed Distance Field) technique, ensuring crisp quality
regardless of camera distance or zoom level.

### Why Troika Text?

- **Sharp at any scale**: SDF rendering prevents pixelation
- **Full Unicode**: Supports all languages, including emoji
- **Web worker optimization**: Non-blocking font parsing
- **Bloom integration**: Works with post-processing effects
- **Responsive sizing**: Viewport and distance-based scaling

## Components

### TroikaTextComponent

The base component for all 3D text rendering.

#### Basic Usage

```html
<a3d-troika-text text="Hello Three.js!" [fontSize]="0.5" color="#00ffff" [position]="[0, 0, 0]" anchorX="center" anchorY="middle" />
```

#### Multi-line Text

```html
<a3d-troika-text text="Line 1\nLine 2\nLine 3" [fontSize]="0.3" [maxWidth]="5" textAlign="center" [lineHeight]="1.5" />
```

#### Text with Outline

```html
<a3d-troika-text text="OUTLINED" [fontSize]="0.8" color="#ffffff" [outlineWidth]="0.05" outlineColor="#000000" />
```

#### Custom Font

```html
<a3d-troika-text text="Custom Font" font="/assets/fonts/Roboto-Bold.ttf" [fontSize]="0.5" />
```

#### Billboard Mode (Faces Camera)

```html
<a3d-troika-text text="BILLBOARD" [billboard]="true" [position]="[0, 2, 0]" />
```

### ResponsiveTroikaTextComponent

Text that automatically scales based on camera position.

#### Viewport Mode (Like CSS vw Units)

```html
<a3d-responsive-troika-text text="Responsive Heading" responsiveMode="viewport" [viewportScale]="0.08" [minFontSize]="0.2" [maxFontSize]="2.0" />
```

#### Distance Mode (Scales with Camera Distance)

```html
<a3d-responsive-troika-text text="Distance Label" responsiveMode="distance" [fontSize]="0.5" [minFontSize]="0.1" [maxFontSize]="5.0" />
```

### GlowTroikaTextComponent

Text with animated glow effect for bloom post-processing.

#### Static Glow

```html
<a3d-glow-troika-text text="GLOW EFFECT" [fontSize]="1.0" glowColor="#00ffff" [glowIntensity]="3.0" [pulseSpeed]="0" />
```

#### Pulsing Glow

```html
<a3d-glow-troika-text text="PULSE" [fontSize]="0.8" glowColor="#ff00ff" [glowIntensity]="2.5" [pulseSpeed]="0.5" [outlineWidth]="0.02" />
```

**Note**: Requires `BloomEffectComponent` in the scene to see glow effects.

## FontPreloadService

Preload fonts during application initialization to prevent loading delays.

### Basic Usage

```typescript
import { FontPreloadService } from '@hive-academy/angular-3d';

@Component({...})
export class MyComponent {
  private fontPreload = inject(FontPreloadService);

  async ngOnInit() {
    await this.fontPreload.preload({
      font: '/assets/fonts/Roboto-Regular.ttf'
    });
  }
}
```

### APP_INITIALIZER Pattern

```typescript
export function initializeApp(fontPreload: FontPreloadService) {
  return () =>
    fontPreload.preload({
      font: '/assets/fonts/Roboto-Regular.ttf',
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [FontPreloadService],
      multi: true,
    },
  ],
};
```

### Preload Multiple Fonts

```typescript
await fontPreload.preloadMultiple([{ font: '/assets/fonts/Roboto-Regular.ttf' }, { font: '/assets/fonts/Roboto-Bold.ttf' }, { font: '/assets/fonts/Roboto-Italic.ttf' }]);
```

## API Reference

### TroikaTextComponent Inputs

| Input          | Type                                       | Default   | Description              |
| -------------- | ------------------------------------------ | --------- | ------------------------ |
| text           | string                                     | required  | Text content to render   |
| fontSize       | number                                     | 0.1       | Font size in world units |
| color          | string \| number                           | '#ffffff' | Text color               |
| font           | string \| null                             | null      | Custom font URL          |
| position       | [number, number, number]                   | [0,0,0]   | 3D position              |
| rotation       | [number, number, number]                   | [0,0,0]   | Rotation in radians      |
| scale          | number \| [number, number, number]         | 1         | Scale factor             |
| maxWidth       | number                                     | Infinity  | Max width for text wrap  |
| textAlign      | 'left' \| 'right' \| 'center' \| 'justify' | 'left'    | Text alignment           |
| anchorX        | number \| string                           | 'left'    | Horizontal anchor        |
| anchorY        | number \| string                           | 'top'     | Vertical anchor          |
| lineHeight     | number \| string                           | 1.2       | Line height              |
| letterSpacing  | number                                     | 0         | Letter spacing           |
| outlineWidth   | number \| string                           | 0         | Outline width            |
| outlineColor   | string \| number                           | '#000000' | Outline color            |
| fillOpacity    | number                                     | 1         | Fill opacity (0-1)       |
| billboard      | boolean                                    | false     | Face camera              |
| customMaterial | THREE.Material \| null                     | null      | Custom material          |

### ResponsiveTroikaTextComponent Additional Inputs

| Input          | Type                     | Default    | Description         |
| -------------- | ------------------------ | ---------- | ------------------- |
| responsiveMode | 'viewport' \| 'distance' | 'viewport' | Scaling mode        |
| viewportScale  | number                   | 0.05       | % of viewport width |
| minFontSize    | number                   | 0.05       | Minimum font size   |
| maxFontSize    | number                   | 2.0        | Maximum font size   |
| syncDebounceMs | number                   | 100        | Debounce delay      |

### GlowTroikaTextComponent Additional Inputs

| Input         | Type             | Default   | Description                   |
| ------------- | ---------------- | --------- | ----------------------------- |
| glowColor     | string \| number | '#00ffff' | Glow color                    |
| glowIntensity | number           | 2.5       | Glow intensity (>1 for bloom) |
| pulseSpeed    | number           | 1.0       | Pulse speed (0 = no pulse)    |
| outlineWidth  | number           | 0.02      | Outline width                 |

## With Animation Directives

Text components work with animation directives:

```html
<a3d-troika-text text="Floating Text" [fontSize]="0.3" a3dFloat3d [floatSpeed]="1.5" [floatIntensity]="0.2" />
```

```html
<a3d-troika-text text="Rotating Text" rotate3d [rotateConfig]="{ axis: 'y', speed: 60 }" />
```

## Performance Best Practices

1. **Limit instances**: Target 50 text instances for 60 FPS
2. **Preload fonts**: Use FontPreloadService in APP_INITIALIZER
3. **Debounce updates**: ResponsiveTroikaTextComponent debounces by default
4. **Use simpler text**: Fewer glyphs = better performance
5. **Lower sdfGlyphSize**: Use 32 instead of 64 for small text

## Migration from Particle Text

When to use Troika vs Particle text:

| Use Troika       | Use Particle Text  |
| ---------------- | ------------------ |
| Readable content | Artistic effects   |
| Headings, labels | Smoke, explosions  |
| UI elements      | Animated particles |
| Production text  | Visual effects     |

### Migration Example

Before (Particle):

```html
<a3d-instanced-particle-text text="Hello" [fontSize]="45" [particleColor]="colors.white" [opacity]="0.5" />
```

After (Troika):

```html
<a3d-troika-text text="Hello" [fontSize]="1.0" [color]="colors.white" [fillOpacity]="0.8" />
```

Note: fontSize units are different (troika uses world units, particle uses pixels).

## Troubleshooting

### Font Loading Issues

- Ensure font path is correct
- Check CORS settings for external fonts
- Use FontPreloadService to preload fonts

### Text Not Visible

- Check position (may be behind camera)
- Check fillOpacity (must be > 0)
- Verify parent scene exists

### Bloom Not Working

- Ensure BloomEffectComponent is in scene
- Use GlowTroikaTextComponent
- Set glowIntensity > 1.0

### Performance Issues

- Reduce text instances
- Lower sdfGlyphSize
- Use syncDebounceMs for responsive text

## See Also

- [troika-three-text docs](https://protectwise.github.io/troika/troika-three-text/)
- [Three.js documentation](https://threejs.org/docs/)
