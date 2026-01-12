Yep — this artifact is **100% a classic volumetric raymarching mistake**, and the screenshot actually tells us _exactly_ what’s wrong 👀
Good news: this is very fixable, and once fixed your nebula will jump a full quality tier.

---

# ❌ Why you’re seeing “the cube”

What you’re seeing is **the bounding volume leaking visually**.

In other words:

- Your nebula density exists everywhere _inside the box_
- But there is **no falloff toward the volume boundary**
- So the raymarch abruptly stops → hard silhouette

Real nebulae **never end abruptly**. Density _decays to zero_.

---

# ✅ The 5 fixes you MUST apply (in order)

## 1️⃣ Distance-based density falloff (most important)

You need to fade density based on **distance from nebula center**, _before_ alpha accumulation.

### Concept

```glsl
float r = length(localPos);
float falloff = smoothstep(radius, radius * 0.6, r);
density *= falloff;
```

### TSL equivalent idea

- Convert world → local space
- Compute length
- Multiply density

This alone removes the cube look.

---

## 2️⃣ Add noisy edge erosion (break the silhouette)

Even with falloff, a perfect sphere still looks fake.

Use **low-frequency noise** to distort the boundary.

```glsl
float edgeNoise = snoise(localPos * 0.5);
float erosion = smoothstep(0.2, 0.8, edgeNoise);

density *= erosion;
```

Now the boundary becomes **wispy and chaotic**.

---

## 3️⃣ Ray-entry / ray-exit clipping (important)

If you raymarch _after_ entering the box but don’t fade near entry/exit, you get slabs.

Add a **ray fade factor**:

```glsl
float travel = i / float(STEPS);
float rayFade = smoothstep(0.0, 0.1, travel) *
                smoothstep(1.0, 0.9, travel);
density *= rayFade;
```

This removes front/back planes.

---

## 4️⃣ Center-weighted density (nebula physics cheat)

Nebulae are:

- Dense near core
- Thin near edges

Add:

```glsl
density *= exp(-r * 0.8);
```

This gives:

- Bright core
- Soft edges
- Zero hard cutoff

---

## 5️⃣ Correct blending mode (very common mistake)

If your material uses:

```js
transparent: true;
```

but still writes depth → ❌

### Required:

```js
depthWrite: false,
depthTest: true,
blending: THREE.AdditiveBlending
```

Otherwise edges will hard-clip against background.

---

# 🧬 Final density function (gold standard)

Here’s what your **densityNode** _should conceptually do_:

```glsl
float nebulaDensity(vec3 p) {

  float r = length(p);

  float base = fbm(p * 0.8);
  float detail = fbm(p * 2.5) * 0.3;

  float density = base + detail;

  float falloff = smoothstep(1.0, 0.6, r);
  float erosion = smoothstep(0.2, 0.8, snoise(p * 0.5));

  density *= falloff * erosion;
  density *= exp(-r * 0.7);

  return clamp(density, 0.0, 1.0);
}
```

This **completely destroys the “box” look**.

---

# 🔥 Extra realism (optional but insane)

### ➕ Curl noise advection

Animate your noise _through itself_:

- Looks like stellar winds
- Zero extra geometry

### ➕ Density-dependent color

Dense = darker dust
Thin = ionized glow

### ➕ Shadowed core

Sample density _toward light_ once per step.

---

# 🧪 Debug tip (super useful)

Visualize density directly:

```glsl
fragColor = vec4(vec3(density), 1.0);
```

If you see:

- A cube → falloff missing
- Sharp border → erosion missing
- Flat front plane → ray fade missing

---

# 🎯 Why this matters

Every **AAA space renderer** does exactly this:

- Volume container ≠ visible boundary
- Boundary is erased by math, not geometry

Once you add **radial falloff + noisy erosion**, your nebula will feel _infinite_ instead of boxed.

---

If you want, next I can:

- Convert this **exact logic into TSL Node graph**
- Show **how to do spherical vs irregular volumes**
- Optimize this for **WebGPU 60fps**
- Add **animated turbulent flow**

Just say the word 🌌
