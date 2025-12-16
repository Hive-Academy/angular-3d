# Requirements Document - TASK_2025_004

## Introduction

This task implements the **Loader Utilities** module for `@hive-academy/angular-3d`, replacing `injectLoader` and `injectGLTF` from angular-three with native Angular solutions. Loaders are essential for loading external assets (textures, 3D models) into Three.js scenes, and form a critical dependency for higher-level components like planets, GLTF models, and environments.

## Task Classification

- **Type**: FEATURE
- **Priority**: P1-High (blocks primitive components)
- **Complexity**: Medium (2-6h)
- **Estimated Effort**: 4-6 hours

## Workflow Dependencies

- **Research Needed**: No (patterns are clear from angular-three reference)
- **UI/UX Design Needed**: No (service/utility layer only)

---

## Requirements

### Requirement 1: Texture Loader Service

**User Story**: As a component developer using `@hive-academy/angular-3d`, I want a typed texture loading utility, so that I can load textures reactively for materials without depending on angular-three.

#### Acceptance Criteria

1. WHEN `textureLoader.load(url)` is called THEN the system SHALL return a signal containing the loaded `THREE.Texture`
2. WHEN the URL input signal changes THEN the previous request SHALL be cancelled or marked stale
3. WHEN a texture is successfully loaded THEN the texture SHALL be cached by URL to avoid duplicate network requests
4. WHEN loading fails THEN the error SHALL be captured in a typed error signal
5. WHEN the consuming component is destroyed THEN cleanup SHALL occur automatically via `DestroyRef`

### Requirement 2: GLTF Loader Service

**User Story**: As a component developer using `@hive-academy/angular-3d`, I want a typed GLTF loading utility with Draco support, so that I can load 3D models reactively without depending on angular-three-soba.

#### Acceptance Criteria

1. WHEN `gltfLoader.load(url, options)` is called THEN the system SHALL return a signal containing the loaded `GLTF` object
2. WHEN `useDraco: true` option is provided THEN the system SHALL use `DRACOLoader` for decompression
3. WHEN `useMeshOpt: true` option is provided THEN the system SHALL use `MeshoptDecoder` for decompression
4. WHEN the URL changes THEN the previous load operation SHALL be cancelled/stale-protected
5. WHEN loading succeeds THEN the result SHALL be cached by URL + options hash
6. WHEN loading fails THEN a typed error signal SHALL expose the failure reason
7. WHEN the consuming component is destroyed THEN cleanup SHALL occur automatically

### Requirement 3: Injectable API Pattern

**User Story**: As a component developer, I want function-based loader utilities that integrate with Angular's injection system, so that I can use them declaratively in components.

#### Acceptance Criteria

1. WHEN importing from `@hive-academy/angular-3d/loaders` THEN `injectTextureLoader` and `injectGltfLoader` functions SHALL be available
2. WHEN called within an injection context THEN each function SHALL return a typed loader signal
3. WHEN called outside injection context THEN an appropriate error SHALL be thrown

---

## Non-Functional Requirements

### Performance

- **Loading Time**: Texture/GLTF loading SHALL not add >10ms overhead beyond native Three.js loaders
- **Caching**: Subsequent requests for same URL SHALL resolve from cache in <1ms
- **Memory**: Loaders SHALL not hold references to disposed textures/scenes

### Reliability

- **Error Handling**: All loader errors SHALL be caught and exposed via typed signals
- **Cancellation**: URL changes SHALL prevent stale data from being committed to signals
- **Cleanup**: All Three.js resources SHALL be properly disposed on component destroy

### Maintainability

- **Type Safety**: No `any` types; full TypeScript coverage
- **Documentation**: JSDoc for all public APIs
- **Testing**: >80% code coverage with unit tests

---

## Stakeholder Analysis

- **End Users**: Component developers building 3D scenes with textures and models
- **Business Owners**: Library consumers who need reliable asset loading
- **Development Team**: Must follow signal-based, OnPush-compatible patterns

---

## Risk Analysis

### Technical Risks

**Risk 1**: Draco/MeshOpt decoder loading complexity

- Probability: Medium
- Impact: Medium
- Mitigation: Follow three-stdlib patterns; use CDN-hosted decoders as fallback
- Contingency: Document manual decoder configuration

**Risk 2**: Cancellation edge cases with rapid URL changes

- Probability: Medium
- Impact: Low
- Mitigation: Use AbortController pattern; implement stale-request guards
- Contingency: Add debounce option for URL inputs

---

## Dependencies

- **Technical**: `three` (TextureLoader, Texture), `three-stdlib` (GLTFLoader, DRACOLoader)
- **Internal**: `libs/angular-3d/src/lib/store` (state management integration)
- **Predecessor Tasks**: TASK_2025_002 (Canvas), TASK_2025_003 (Store)

---

## Success Metrics

- All unit tests pass (`npx nx test angular-3d`)
- Library builds successfully (`npx nx build angular-3d`)
- Lint passes (`npx nx lint angular-3d`)
- Texture loading works (verified by planet component integration)
- GLTF loading works (verified by model loading test)

---

## Reference Implementations

### Current Usage (to be replaced)

```typescript
// planet.component.ts - uses injectLoader
readonly moonTexture = injectLoader(
  () => TextureLoader,
  () => this.textureUrl() ?? 'assets/earth.jpg'
);

// gltf-model.component.ts - uses injectGLTF
private readonly _gltf = injectGLTF(() => this.modelPath(), {
  useDraco: this.useDraco(),
  useMeshOpt: this.useMeshOpt(),
  onLoad: (data) => { ... }
});
```

### Target API Design

```typescript
// Texture loader - signal-based
readonly texture = injectTextureLoader(() => this.textureUrl());

// GLTF loader - signal-based with options
readonly gltf = injectGltfLoader(() => this.modelPath(), {
  useDraco: this.useDraco,  // signal or value
  useMeshOpt: this.useMeshOpt  // signal or value
});

// Access loaded data
const textureValue = this.texture.data();  // THREE.Texture | null
const gltfScene = this.gltf.data()?.scene;  // THREE.Group | undefined
const isLoading = this.gltf.loading();  // boolean
const error = this.gltf.error();  // Error | null
```
