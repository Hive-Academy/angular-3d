# Task Description - TASK_2025_014

**Task ID**: TASK_2025_014  
**Title**: Comprehensive Library Documentation  
**Type**: Documentation  
**Priority**: P2-Medium  
**Estimated Effort**: 6-8 hours  
**Created**: 2025-12-18  
**Status**: 📋 PENDING

---

## Business Context

The `@hive-academy/angular-3d` library is feature-complete but lacks comprehensive documentation. While inline JSDoc is excellent, developers need a complete guide covering installation, usage patterns, all features, and migration from `angular-three`. This documentation is critical for library adoption and developer productivity.

**Business Value**:

- Reduces onboarding time for new developers
- Provides searchable reference for all library features
- Demonstrates best practices and usage patterns
- Facilitates migration from `angular-three`
- Improves library discoverability and adoption

---

## Objective

Create comprehensive README documentation for the `@hive-academy/angular-3d` library that covers:

1. Installation and quick start
2. All library features with examples
3. Advanced topics and best practices
4. API reference with links to JSDoc
5. Migration guide from `angular-three`

---

## Scope

### In Scope

**1. Getting Started Section**:

- Installation instructions (npm/yarn)
- Peer dependencies (Three.js, GSAP)
- Minimal working example
- Project setup requirements

**2. Core Features Documentation**:

- **Scene Container**: `Scene3dComponent` configuration
- **Canvas Host**: Renderer setup, camera configuration
- **Render Loop**: Frame callbacks, performance monitoring

**3. Primitives Documentation**:

- **Geometric Primitives**: Box, Sphere, Cylinder, Torus, Cone, Plane, Polyhedron
- **Lights**: Ambient, Point, Directional, Spot
- **Helpers**: Fog, Group
- **Advanced**: GLTF models, Text3D, ParticleSystem, StarField, Nebula, Planet, SVGIcon

**4. Animation Documentation** (already exists, integrate):

- Float3dDirective usage
- Rotate3dDirective usage
- AnimationService programmatic API
- SpaceFlight3dDirective (future)

**5. Controls Documentation**:

- OrbitControls setup
- Camera control patterns

**6. Loaders Documentation**:

- Texture loading (TextureLoader)
- GLTF loading with caching
- Error handling patterns

**7. Postprocessing Documentation**:

- EffectComposer setup
- Bloom effect configuration
- Custom postprocessing passes

**8. State Management Documentation**:

- Angular3DStateStore usage
- Component registry patterns
- Cross-component communication

**9. Advanced Topics**:

- Performance optimization
- Memory management
- SSR considerations (Angular Universal)
- Custom geometries and materials
- Integration with @hive-academy/angular-gsap
- **Multi-Scene Architecture** (CRITICAL - see Batch 9.1 below)

**10. Migration Guide**:

- From `angular-three` to `@hive-academy/angular-3d`
- Breaking changes and API differences
- Template migration (`ngt-*` to Angular components)
- Common patterns and equivalents

**11. API Reference**:

- Links to inline JSDoc for detailed API docs
- Component/directive/service index
- Type exports index

**12. Troubleshooting & FAQ**:

- Common issues and solutions
- Performance tips
- Debug patterns

### Out of Scope

- Interactive documentation website (future enhancement)
- Video tutorials (future enhancement)
- Stackblitz examples (future enhancement)
- Translated documentation (English only for MVP)

---

## Acceptance Criteria

### Functional Requirements

1. **README Structure**:

   - [ ] Table of contents with anchor links
   - [ ] Clear section hierarchy (H2 → H3 → H4)
   - [ ] Consistent formatting (code blocks, lists, tables)
   - [ ] All code examples are runnable and tested

2. **Getting Started**:

   - [ ] Installation command provided
   - [ ] Peer dependencies listed
   - [ ] Minimal example (< 30 lines) that renders a scene
   - [ ] Angular version compatibility noted

3. **Feature Coverage**:

   - [ ] All exported components documented
   - [ ] All exported directives documented
   - [ ] All exported services documented
   - [ ] All exported interfaces/types listed

4. **Code Examples**:

   - [ ] Each feature has at least 1 code example
   - [ ] Examples show TypeScript + HTML
   - [ ] Examples include imports
   - [ ] Complex features have multiple examples

5. **Migration Guide**:

   - [ ] Mapping table: `angular-three` → `@hive-academy/angular-3d`
   - [ ] Template conversion examples
   - [ ] Breaking changes documented
   - [ ] Common migration issues addressed

6. **API Reference**:
   - [ ] Component index with links to JSDoc
   - [ ] Directive index with links to JSDoc
   - [ ] Service index with links to JSDoc
   - [ ] Type exports listed

### Non-Functional Requirements

1. **Readability**:

   - [ ] Uses clear, concise language
   - [ ] Avoids jargon where possible
   - [ ] Consistent terminology throughout

2. **Maintainability**:

   - [ ] Modular structure (sections can be updated independently)
   - [ ] Version-agnostic where possible
   - [ ] Links to external docs (Three.js, GSAP) for reference

3. **Accessibility**:

   - [ ] Proper heading hierarchy
   - [ ] Alt text for any images/diagrams
   - [ ] Code blocks have language identifiers

4. **Completeness**:
   - [ ] No "TODO" placeholders
   - [ ] All features implemented in library are documented
   - [ ] Cross-references between related features

---

## Technical Details

### Documentation Structure

```markdown
# @hive-academy/angular-3d

Brief library description (1-2 sentences)

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Scene Container](#scene-container)
- [Primitives](#primitives)
  - [Geometric Shapes](#geometric-shapes)
  - [Lights](#lights)
  - [Advanced Primitives](#advanced-primitives)
- [Animation](#animation)
  - [Directives](#animation-directives)
  - [Service](#animation-service)
- [Controls](#controls)
- [Loaders](#loaders)
- [Postprocessing](#postprocessing)
- [State Management](#state-management)
- [Advanced Topics](#advanced-topics)
- [Migration from angular-three](#migration-guide)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Installation

...

## Quick Start

Minimal working example

## Scene Container

Scene3dComponent configuration

## Primitives

### Geometric Shapes

Box, Sphere, Cylinder, etc.

### Lights

Ambient, Point, Directional, Spot

### Advanced Primitives

GLTF, Text3D, ParticleSystem, etc.

## Animation

(Integrate existing animation docs)

## Controls

OrbitControls usage

## Loaders

Texture and GLTF loading

## Postprocessing

EffectComposer, Bloom

## State Management

Store and component registry

## Advanced Topics

Performance, SSR, custom materials

## Migration Guide

From angular-three

## API Reference

Links to JSDoc

## Troubleshooting

Common issues

## Contributing

How to contribute

## License

MIT
```

### Example Code Patterns

**Minimal Scene Example**:

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, SphereComponent } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Scene3dComponent, SphereComponent],
  template: `
    <scene-3d [cameraPosition]="[0, 0, 5]">
      <app-sphere [position]="[0, 0, 0]" [radius]="1" [color]="0xff0000" />
    </scene-3d>
  `,
})
export class AppComponent {}
```

**Complex Feature Example** (GLTF + Animation):

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, GltfModelComponent, Float3dDirective } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-animated-model',
  standalone: true,
  imports: [Scene3dComponent, GltfModelComponent, Float3dDirective],
  template: `
    <scene-3d [cameraPosition]="[0, 2, 5]">
      <app-gltf-model [modelPath]="'/assets/models/spaceship.glb'" [position]="[0, 0, 0]" [scale]="[0.5, 0.5, 0.5]" float3d [floatConfig]="{ height: 0.3, speed: 3000 }" />
    </scene-3d>
  `,
})
export class AnimatedModelComponent {}
```

### Migration Table Example

| angular-three          | @hive-academy/angular-3d                | Notes                             |
| ---------------------- | --------------------------------------- | --------------------------------- |
| `<ngt-canvas>`         | `<scene-3d>`                            | Renamed, similar API              |
| `<ngt-mesh>`           | Not needed                              | Use primitive components directly |
| `injectBeforeRender()` | `RenderLoopService.addUpdateCallback()` | Injectable service pattern        |
| `injectStore()`        | `inject(Angular3DStateStore)`           | Signal-based store                |
| `injectGLTF()`         | `GltfLoaderService.load()`              | Returns Observable                |

---

## Dependencies

**Blocks**: N/A (can run in parallel with other tasks)  
**Blocked By**: TASK_2025_011 (Testing & Validation) - Should validate examples work before documenting

**Related**:

- TASK_2025_010 (Demo App) - Demo examples can inform documentation
- TASK_2025_013 (Animation Directives) - Animation docs already exist, need integration

---

## Implementation Notes

### Documentation Best Practices

1. **Code Examples**:

   - All examples should be complete and runnable
   - Include imports at the top
   - Use realistic component names
   - Show both template and TypeScript where relevant

2. **Cross-References**:

   - Link between related features (e.g., Loaders → GLTF component)
   - Reference JSDoc for detailed API documentation
   - Link to Three.js docs for underlying concepts

3. **Progressive Disclosure**:

   - Start simple (minimal example)
   - Build complexity gradually
   - Provide "Advanced" sections for power users

4. **Versioning**:
   - Note Angular version requirements
   - Note Three.js version compatibility
   - Note GSAP version (peer dependency)

---

## Verification Plan

### Documentation Quality Checks

1. **Completeness Check**:

   ```bash
   # Verify all exports are documented
   grep -r "^export" libs/angular-3d/src/index.ts
   # Compare against README sections
   ```

2. **Example Validation**:

   - Create test components from each code example
   - Run `npx nx build angular-3d` to verify imports
   - Visual inspection in demo app

3. **Link Validation**:

   - Verify all internal anchor links work
   - Check external links (Three.js, GSAP docs)
   - Validate JSDoc links

4. **Readability Check**:
   - Spell check
   - Grammar check
   - Consistent terminology

### Acceptance Testing

- [ ] Developer can install and run minimal example in < 5 minutes
- [ ] Each feature section has runnable code
- [ ] Migration guide covers all breaking changes
- [ ] API reference is complete and accurate
- [ ] No broken links or TODOs

---

## Deliverables

1. **Updated README.md** (`libs/angular-3d/README.md`):

   - Complete documentation as specified
   - Table of contents with working anchor links
   - All code examples tested
   - Migration guide from angular-three

2. **Optional Supporting Files**:
   - `docs/MIGRATION.md` (if README becomes too long)
   - `docs/API-REFERENCE.md` (if needed for organization)
   - Example diagrams (architecture, component hierarchy)

---

## Out of Scope (Future Enhancements)

- Interactive documentation website (Docusaurus/VitePress)
- Video tutorials
- Stackblitz/CodeSandbox embedded examples
- Multiple language translations
- Auto-generated API docs from TypeScript
- Changelog/release notes generation

---

## Notes

**Documentation Philosophy**:

- **Examples over explanations**: Show working code first
- **Progressive enhancement**: Start simple, add complexity
- **Audience awareness**: Target Angular developers with Three.js interest
- **Maintenance mindset**: Structure for easy updates as library evolves

**Key Documentation Audiences**:

1. **New users**: Need quick start and basic examples
2. **Migrators**: Need migration guide from angular-three
3. **Power users**: Need advanced topics and optimization tips
4. **Contributors**: Need architecture understanding (separate CONTRIBUTING.md)

---

## Estimated Timeline

- **Planning & Structure**: 1 hour
- **Getting Started & Quick Start**: 1 hour
- **Feature Documentation** (8 sections): 4 hours
- **Migration Guide**: 1.5 hours
- **API Reference**: 0.5 hours
- **Review & Polish**: 1 hour

**Total**: 6-8 hours

---

## Batch 9.1: Multi-Scene Architecture Documentation

**Added**: 2025-12-22
**Priority**: HIGH
**Reason**: Bug fix revealed critical architectural pattern that MUST be documented

### Background

A multi-scene bug was discovered and fixed (commit `b70923e`) where 3D objects were registering with the wrong scene when multiple `<a3d-scene-3d>` components existed on the same page. The root cause was services using `providedIn: 'root'` instead of per-scene providers.

### Documentation Requirements

**1. Multi-Scene Support Section** (in Advanced Topics):

````markdown
## Multi-Scene Support

@hive-academy/angular-3d fully supports multiple 3D scenes on the same page.
Each `<a3d-scene-3d>` component creates isolated instances of:

- `SceneService` - Scene, camera, renderer access
- `RenderLoopService` - Independent render loops
- `SceneGraphStore` - Object registry per scene
- `ViewportPositioningService` - Camera-specific positioning
- `EffectComposerService` - Per-scene postprocessing

### Example: Two Independent Scenes

```html
<!-- Hero scene -->
<a3d-scene-3d [cameraPosition]="[0, 0, 20]">
  <a3d-star-field [starCount]="5000" />
  <a3d-gltf-model [modelPath]="'/models/earth.glb'" />
</a3d-scene-3d>

<!-- CTA scene (completely independent) -->
<a3d-scene-3d [cameraPosition]="[0, 5, 10]">
  <a3d-box [position]="[0, 0, 0]" />
</a3d-scene-3d>
```
````

Each scene renders independently with its own camera, objects, and effects.

````

**2. Architecture Warning** (in State Management section):

```markdown
### Per-Scene vs Root Services

**IMPORTANT**: The following services are intentionally NOT provided at root level:

| Service | Scope | Why |
|---------|-------|-----|
| `SceneGraphStore` | Per-scene | Objects must register with correct scene |
| `ViewportPositioningService` | Per-scene | Viewport calculations need correct camera |

**Do NOT inject these services outside of `<a3d-scene-3d>` hierarchy.**
They will throw `NullInjectorError` if injected at application level.

```typescript
// ❌ WRONG - Will fail with NullInjectorError
@Component({ ... })
class AppComponent {
  private readonly store = inject(SceneGraphStore); // Error!
}

// ✅ CORRECT - Component is within scene hierarchy
@Component({
  template: `<a3d-scene-3d><my-3d-object /></a3d-scene-3d>`
})
class AppComponent { }

// ✅ CORRECT - Component rendered inside scene
@Component({ selector: 'my-3d-object' })
class My3DObjectComponent {
  private readonly store = inject(SceneGraphStore); // Works!
}
````

````

**3. Troubleshooting Entry**:

```markdown
### Objects Appearing in Wrong Scene

**Symptom**: When using multiple `<a3d-scene-3d>` components, objects from one scene appear in another.

**Cause**: This was a bug in versions prior to 1.x.x where `SceneGraphStore` was a root singleton.

**Solution**: Update to latest version. If you're building a custom service that needs scene access, ensure it's provided at `Scene3dComponent` level, not root:

```typescript
// ❌ WRONG
@Injectable({ providedIn: 'root' })
export class MySceneService { }

// ✅ CORRECT
@Injectable() // No providedIn
export class MySceneService { }

// Then in Scene3dComponent providers or your component
@Component({
  providers: [MySceneService] // Per-scene instance
})
````

```

### Acceptance Criteria for Batch 9.1

- [ ] Multi-scene support documented in Advanced Topics
- [ ] Per-scene vs root service table in State Management
- [ ] Troubleshooting entry for wrong-scene bug
- [ ] Code examples showing correct injection patterns
- [ ] Warning callout about NullInjectorError for root injection
```
