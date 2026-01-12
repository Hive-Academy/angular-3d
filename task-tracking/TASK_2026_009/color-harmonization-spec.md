# Color Harmonization Specification

## TASK_2026_009 - Visual Consistency Fix

**Date**: 2026-01-08
**Status**: Design Specification
**Author**: UI/UX Designer Agent

---

## Executive Summary

This document defines the exact color values to harmonize the 3D scene elements with the established Tailwind design system. The current implementation uses warm oranges and mismatched pinks that clash with the cool green/cyan/indigo dominant theme.

---

## Design System Reference

### Primary Accent Colors (Priority Order)

| Token         | Hex       | Role                                        |
| ------------- | --------- | ------------------------------------------- |
| `neon-green`  | `#A1FF4F` | **DOMINANT** - Main highlight, CTAs, badges |
| `neon-blue`   | `#4FFFDF` | Secondary highlight, gradients              |
| `primary-500` | `#6366F1` | Tertiary - indigo/purple accents            |
| `neon-purple` | `#D946EF` | Supporting accent                           |
| `neon-pink`   | `#FF6BD4` | Supporting accent                           |

### Background

| Token             | Hex       | Role             |
| ----------------- | --------- | ---------------- |
| `background-dark` | `#0A0E11` | Deep space black |

---

## Section 1: Hero Section (glass-sphere-hero-section.component.ts)

### 1.1 Fire Sphere / Sun Effect

**Current State**: `sunMode=true` (realistic sun colors: white→yellow→orange→red)
**Problem**: Warm orange clashes with cool green/cyan theme

**Solution**: Set `sunMode=false` and use `fireColor` input

| Property    | Current             | Recommended            | Rationale                |
| ----------- | ------------------- | ---------------------- | ------------------------ |
| `sunMode`   | `true`              | `false`                | Enables custom fireColor |
| `fireColor` | `#ff6600` (default) | `#A1FF4F` (neon-green) | Matches dominant accent  |

**Implementation**:

```html
<a3d-fire-sphere [sunMode]="false" [fireColor]="'#A1FF4F'" ... />
```

This transforms the fiery sun into a cool green plasma energy core that matches the design system.

---

### 1.2 Caustics Texture (Marble Sphere)

**Current State**:

```typescript
causticsTexture = tslCausticsTexture({
  color: new THREE.Color('#ff6600'), // Bright orange
  background: new THREE.Color('#1a0a00'), // Dark burnt orange
});
```

**Problem**: Bright orange caustics clash severely with the cool palette

**Recommended Values**:

```typescript
causticsTexture = tslCausticsTexture({
  color: new THREE.Color('#A1FF4F'), // neon-green - matches dominant accent
  background: new THREE.Color('#0A1A0F'), // Very dark green-black
  speed: 0.7,
  scale: 0.4,
  intensity: 1.4,
});
```

**Alternative Option (Cyan Variant)**:

```typescript
causticsTexture = tslCausticsTexture({
  color: new THREE.Color('#4FFFDF'), // neon-blue/cyan
  background: new THREE.Color('#0A1215'), // Very dark cyan-black
  speed: 0.7,
  scale: 0.4,
  intensity: 1.4,
});
```

| Property     | Current                  | Recommended                  | Hex              |
| ------------ | ------------------------ | ---------------------------- | ---------------- |
| `color`      | `#ff6600` (orange)       | `#A1FF4F` (neon-green)       | neon-green token |
| `background` | `#1a0a00` (burnt orange) | `#0A1A0F` (dark green-black) | Custom dark      |

**Rationale**: The caustics effect on the marble sphere should echo the primary accent. Green caustics create an alien/energy aesthetic that fits the "stunning 3D experiences" theme.

---

### 1.3 Nebula Volumetric

**Current State**:

```typescript
primaryColor = SCENE_COLORS.honeyGold; // #ffb03b - warm gold
secondaryColor = SCENE_COLORS.emerald; // #10b981 - green
```

**Problem**: Honey gold is a warm color that doesn't fit the cool-dominant palette

**Recommended Values**:

```typescript
primaryColor = SCENE_COLORS.neonGreen; // #A1FF4F - dominant accent
secondaryColor = SCENE_COLORS.indigo; // #6366F1 - primary-500
```

| Property         | Current     | Current Hex | Recommended | Recommended Hex |
| ---------------- | ----------- | ----------- | ----------- | --------------- |
| `primaryColor`   | `honeyGold` | `#ffb03b`   | `neonGreen` | `#A1FF4F`       |
| `secondaryColor` | `emerald`   | `#10b981`   | `indigo`    | `#6366F1`       |

**Alternative Option (Cyan Blend)**:

```typescript
primaryColor = SCENE_COLORS.mintGreen; // #4FFFDF - neon-blue token
secondaryColor = SCENE_COLORS.neonPurple; // #b24bf3 - purple accent
```

**Rationale**: The nebula should use the brand's signature gradient (green-to-indigo) which appears in the hero title text gradient: `from-neon-green via-primary-500 to-neon-blue`.

---

### 1.4 Thruster Flames

**Current State**:

```typescript
color = '#00ccff';
coreColor = '#ffffff';
```

**Assessment**: These values are GOOD - cyan aligns with the design system.

**No change needed** - the `#00ccff` is close to the neon-blue/cyan family.

---

## Section 2: Claude Skills Section (claude-skills-showcase-section.component.ts)

### 2.1 Floating Spheres

**Current State**:

```typescript
// Bottom-Left Sphere
[color] = // Bottom-Right Sphere
"'#f472b6'"[color] = "'#d946ef'"; // Pink-400 (Tailwind) // neon-purple (matches design system)
```

**Problem**: Pink (`#f472b6`) is not in the primary accent hierarchy

**Recommended Values**:

```typescript
// Bottom-Left Sphere - Use neon-green (dominant)
[color] = // Bottom-Right Sphere - Use neon-blue (secondary)
"'#A1FF4F'"[color] = "'#4FFFDF'"; // neon-green // neon-blue
```

| Sphere       | Current            | Recommended            | Hex              |
| ------------ | ------------------ | ---------------------- | ---------------- |
| Bottom-Left  | `#f472b6` (pink)   | `#A1FF4F` (neon-green) | neon-green token |
| Bottom-Right | `#d946ef` (purple) | `#4FFFDF` (neon-blue)  | neon-blue token  |

**Rationale**: Using the top two accent colors (neon-green and neon-blue) creates visual consistency with the hero section badges and title gradient.

---

### 2.2 Spotlights (Sphere Illumination)

**Current State**:

```typescript
// Left sphere spotlight
[color] = // Right sphere spotlight
"'#f472b6'"[color] = "'#d946ef'"; // Pink // Purple
```

**Recommended Values**:

```typescript
// Left sphere spotlight - match sphere color
[color] = // Right sphere spotlight - match sphere color
"'#A1FF4F'"[color] = "'#4FFFDF'"; // neon-green // neon-blue
```

| Spotlight                    | Current   | Recommended | Hex        |
| ---------------------------- | --------- | ----------- | ---------- |
| Left (targets left sphere)   | `#f472b6` | `#A1FF4F`   | neon-green |
| Right (targets right sphere) | `#d946ef` | `#4FFFDF`   | neon-blue  |

---

### 2.3 Point Lights (Ambient Fill)

**Current State**:

```typescript
// Left point light - purple glow
[color] = // Right point light - pink accent
"'#a855f7'"[color] = "'#f472b6'"; // Purple-500 // Pink-400
```

**Recommended Values**:

```typescript
// Left point light - use primary-500 (indigo)
[color] = // Right point light - use neon-purple
"'#6366F1'"[color] = "'#D946EF'"; // primary-500 // neon-purple
```

| Light       | Current            | Recommended             | Hex         |
| ----------- | ------------------ | ----------------------- | ----------- |
| Left point  | `#a855f7` (purple) | `#6366F1` (indigo)      | primary-500 |
| Right point | `#f472b6` (pink)   | `#D946EF` (neon-purple) | neon-purple |

**Rationale**: Point lights provide ambient color wash. Using primary-500 and neon-purple maintains the cool palette while adding depth variation.

---

### 2.4 Nebula Background

**Current State**:

```typescript
nebulaColors = {
  primary: SCENE_COLORS.neonGreen, // #A1FF4F - CORRECT
  secondary: SCENE_COLORS.cyan, // #06b6d4 - Good
};
```

**Assessment**: These values are GOOD - already aligned with design system.

**No change needed** - the skills section nebula correctly uses neon-green primary.

---

## Color Palette Summary

### Colors to USE (Design System Approved)

| Color           | Hex       | Usage                                 |
| --------------- | --------- | ------------------------------------- |
| Neon Green      | `#A1FF4F` | Primary 3D accents, caustics, spheres |
| Neon Blue       | `#4FFFDF` | Secondary 3D accents, gradients       |
| Primary-500     | `#6366F1` | Tertiary accents, lighting            |
| Neon Purple     | `#D946EF` | Supporting accents                    |
| Background Dark | `#0A0E11` | Scene backgrounds                     |

### Colors to REMOVE (Clashing)

| Color           | Hex       | Reason                          |
| --------------- | --------- | ------------------------------- |
| Orange          | `#ff6600` | Warm, clashes with cool theme   |
| Burnt Orange BG | `#1a0a00` | Warm, incompatible              |
| Honey Gold      | `#ffb03b` | Warm gold, off-brand            |
| Pink-400        | `#f472b6` | Not in primary accent hierarchy |
| Purple-500      | `#a855f7` | Use primary-500 instead         |

---

## Implementation Checklist

### Hero Section Updates

- [ ] Update `causticsTexture` color from `#ff6600` to `#A1FF4F`
- [ ] Update `causticsTexture` background from `#1a0a00` to `#0A1A0F`
- [ ] Update `primaryColor` (nebula) from `honeyGold` to `neonGreen`
- [ ] Update `secondaryColor` (nebula) from `emerald` to `indigo`

### Skills Section Updates

- [ ] Update left floating sphere color from `#f472b6` to `#A1FF4F`
- [ ] Update right floating sphere color from `#d946ef` to `#4FFFDF`
- [ ] Update left spotlight color from `#f472b6` to `#A1FF4F`
- [ ] Update right spotlight color from `#d946ef` to `#4FFFDF`
- [ ] Update left point light color from `#a855f7` to `#6366F1`
- [ ] Update right point light color from `#f472b6` to `#D946EF`

### Shared Colors File Updates

No changes needed to `colors.ts` - all recommended colors already exist in the definitions.

---

## Visual Reference

### Before (Current Clashing Colors)

```
Hero:
  Caustics: Orange (#ff6600) on dark brown (#1a0a00)
  Nebula: Honey gold (#ffb03b) + Emerald (#10b981)

Skills:
  Spheres: Pink (#f472b6) + Magenta (#d946ef)
  Lights: Purple (#a855f7) + Pink (#f472b6)
```

### After (Harmonized Colors)

```
Hero:
  Caustics: Neon Green (#A1FF4F) on dark green-black (#0A1A0F)
  Nebula: Neon Green (#A1FF4F) + Indigo (#6366F1)

Skills:
  Spheres: Neon Green (#A1FF4F) + Neon Blue (#4FFFDF)
  Lights: Indigo (#6366F1) + Neon Purple (#D946EF)
```

---

## Additional Recommendations

### 1. Add Color Constants to colors.ts

Consider adding these dark background variants for consistency:

```typescript
// Add to COLOR_DEFINITIONS
darkGreenBlack: '#0A1A0F',   // For green caustics background
darkCyanBlack: '#0A1215',    // For cyan caustics background
```

### 2. Consider Intensity Adjustments

When changing from warm to cool colors, light intensities may need adjustment:

- Neon green is highly saturated - consider reducing intensity by 10-20%
- Cool colors can appear "colder" - add slight warmth via ambient light if needed

### 3. Bloom Effect Tuning

The bloom effect may need threshold adjustment for the new colors:

- Green/cyan colors may bloom differently than orange
- Test and adjust `threshold` from 0.25 to 0.3 if glow is too intense

---

## Approval Status

- [ ] Design Lead Review
- [ ] Implementation Ready

---

_End of Specification_
