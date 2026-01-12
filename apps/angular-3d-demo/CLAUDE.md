# Angular 3D Demo

[Back to Main](../../CLAUDE.md)

## Purpose

Showcase application demonstrating `@hive-academy/angular-3d` and `@hive-academy/angular-gsap` libraries. Serves as both a demo site and integration testing ground.

## Boundaries

**Belongs here**:
- Demo pages showcasing library features
- 3D scene compositions using library components
- Scroll animation examples
- Shared UI components (navigation, footer)
- Integration examples combining both libraries

**Does NOT belong**:
- Reusable library code (goes in `libs/`)
- Unit tests for library internals
- Production application features

## Structure

```
src/
├── app/
│   ├── pages/                    # Route components
│   │   ├── home.component.ts     # Landing page
│   │   ├── angular-3d-showcase.component.ts
│   │   └── gsap-showcase.component.ts
│   ├── scenes/                   # 3D scene compositions
│   │   ├── hero-space-scene.component.ts
│   │   ├── cta-scene.component.ts
│   │   └── value-props-3d-scene.component.ts
│   ├── sections/                 # Page sections
│   │   ├── hero-3d-teaser.component.ts
│   │   ├── hero-gsap-teaser.component.ts
│   │   ├── primitives-showcase.component.ts
│   │   └── library-overview.component.ts
│   ├── shared/                   # Shared UI
│   │   ├── navigation.component.ts
│   │   └── footer.component.ts
│   ├── app.ts                    # Root component
│   ├── app.routes.ts             # Route definitions
│   └── app.config.ts             # App configuration
├── public/                       # Static assets (3D models, icons)
└── styles.css                    # Global styles (TailwindCSS)
```

## Key Files

- `app.routes.ts` - Lazy-loaded route definitions
- `app.ts` - Root component with navigation and router outlet
- `scenes/*.component.ts` - Reusable 3D scene compositions
- `sections/*.component.ts` - Landing page sections

## Dependencies

**Internal**:
- [@hive-academy/angular-3d](../../libs/angular-3d/CLAUDE.md) - 3D components
- [@hive-academy/angular-gsap](../../libs/angular-gsap/CLAUDE.md) - Scroll animations

**External**:
- `@angular/router` - Routing
- TailwindCSS - Styling

## Commands

```bash
# Development
npx nx serve angular-3d-demo              # Start dev server (port 4200)
npx nx serve angular-3d-demo --open       # Start and open browser

# Building
npx nx build angular-3d-demo              # Production build
npx nx build angular-3d-demo:development  # Development build

# Testing
npx nx test angular-3d-demo               # Unit tests
npx nx e2e angular-3d-demo-e2e            # E2E tests

# Linting
npx nx lint angular-3d-demo               # Lint
npx nx typecheck angular-3d-demo          # Type check
```

## Guidelines

### Component Structure
```typescript
@Component({
  imports: [Scene3dComponent, BoxComponent, Float3dDirective],
  selector: 'app-my-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 20]">
      <a3d-box a3dFloat3d [position]="[0, 0, 0]" />
    </a3d-scene-3d>
  `,
})
export class MySceneComponent {}
```

### Creating New Pages
1. Create component in `pages/` folder
2. Add lazy-loaded route in `app.routes.ts`
3. Use `ChangeDetectionStrategy.OnPush`

### Creating New 3D Scenes
1. Create component in `scenes/` folder
2. Import required primitives from `@hive-academy/angular-3d`
3. Use `<a3d-scene-3d>` as root container
4. Clean up resources using `DestroyRef`

### Asset Organization
- 3D models: `public/3d/`
- Icons: `public/icons/`
- Images: `public/images/`
- Fonts: `public/fonts/`
