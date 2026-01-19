# Angular Discord Discussion Post

**Channel:** `#libraries` or `#general`

---

## Copy from here 👇

---

Hey there,

I've just published an Angular library for 3D graphics - a Three.js wrapper with declarative components.

Hold on a minute, before you scroll past—since there are already other libraries that do the "same."

The reason why I built this library is because:

1. **I wanted full IDE support and type safety.** The existing solution (angular-three) uses a custom `Renderer2` implementation with `CUSTOM_ELEMENTS_SCHEMA`, which means no autocomplete, no template type checking, and typos in element names only show up at runtime. I wanted typed signal inputs and standard Angular components that my IDE actually understands.

2. **I wanted to use standard Angular DevTools.** With custom renderers, the component tree looks different and debugging is harder. I wanted my 3D components to show up in Angular DevTools like any other component.

3. **I didn't want to worry about Angular upgrades.** Custom renderers depend on Angular's internal rendering behavior, which can break between major versions. I wanted to use only public APIs - signals, `inject()`, `hostDirectives` - so Angular upgrades don't require library rewrites.

4. **I wanted animation behaviors as composable directives.** Instead of writing imperative animation code, I wanted to just add `float3d` or `rotate3d` to any mesh and have it work.

There are existing Angular Three.js wrappers that work well - angular-three has a great community and react-three-fiber-like API. But their architectural choice (custom renderer) has trade-offs that didn't fit my use case. So I built one using standard Angular patterns:

```typescript
<a3d-scene-3d [cameraPosition]="[0, 0, 5]">
  <a3d-box [color]="'#ff6b6b'" float3d rotate3d />
  <a3d-sphere [position]="[-3, 0, 0]" [metalness]="0.8" />
</a3d-scene-3d>
```

54 components, 24 directives, WebGPU ready, SSR compatible.

- Demo: https://hive-academy.github.io/angular-3d/
- GitHub: https://github.com/Hive-Academy/angular-3d
- npm: https://npmjs.com/package/@hive-academy/angular-3d

**My question for this community:** What matters more to you when choosing a library like this - the flexibility to use any Three.js class instantly (angular-three's approach), or having full type safety and standard Angular tooling (our approach)?

Since this is our first release and I wouldn't consider it stable yet, I'd love to gather feedback. If you try it, let me know what works and what doesn't - either here or on GitHub issues.

Thanks for your time!

---

## End copy ☝️
