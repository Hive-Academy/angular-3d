# Design Assets Inventory - TASK_2026_011

## Angular 3D Library Showcase Application

> **Purpose**: Catalog of all visual assets for the isolated showcase app  
> **Design Aesthetic**: Gradient Modern + Sacred Tech  
> **Asset Count**: 15 core assets  
> **Generated Assets**: 2 (logo, hero background)

---

## 📦 Asset Categories

### 1. Brand Assets

#### 1.1 Logo (Primary Brand Mark)

![Angular 3D Logo](C:/Users/abdal/.gemini/antigravity/brain/c64941e7-396d-4c05-8aab-18adce747d6f/angular_3d_logo_1769514386820.png)

**Specifications**:

- **Type**: Geometric 3D cube with gradient (purple → cyan)
- **Dimensions**: 512x512px (square)
- **Format**: PNG with transparency
- **File Size**: ~45KB
- **Colors**: Gradient from #7C3AED (purple) → #06B6D4 (cyan)
- **Background**: Transparent or dark (#0A0E11)
- **Effects**: Glowing particles, neon wireframe

**Usage**:

- Header logo (64x64px)
- Favicon (32x32px, 16x16px variants)
- Loading screen
- Social media preview (og:image)

**Optimization**:

```bash
# Convert to WebP for web usage
cwebp -q 85 angular_3d_logo.png -o angular_3d_logo.webp

# Create favicon sizes
convert angular_3d_logo.png -resize 32x32 favicon-32x32.png
convert angular_3d_logo.png -resize 16x16 favicon-16x16.png
```

---

#### 1.2 Favicon Variants

**Required Sizes**:

- `favicon.ico` (32x32px, 16x16px multi-resolution)
- `favicon-32x32.png`
- `favicon-16x16.png`
- `apple-touch-icon.png` (180x180px)
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

**Generation Script**:

```bash
# Use source logo to generate all favicon variants
npm install -g sharp-cli

sharp -i angular_3d_logo.png -o favicon-32x32.png resize 32 32
sharp -i angular_3d_logo.png -o favicon-16x16.png resize 16 16
sharp -i angular_3d_logo.png -o apple-touch-icon.png resize 180 180
sharp -i angular_3d_logo.png -o android-chrome-192x192.png resize 192 192
sharp -i angular_3d_logo.png -o android-chrome-512x512.png resize 512 512
```

**HTML Integration**:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

---

### 2. Hero Visuals

#### 2.1 Hero Background (Homepage)

![Hero Background](C:/Users/abdal/.gemini/antigravity/brain/c64941e7-396d-4c05-8aab-18adce747d6f/hero_background_1769514412083.png)

**Specifications**:

- **Type**: Abstract 3D scene with floating geometric shapes
- **Dimensions**: 1920x1080px (16:9 landscape)
- **Format**: PNG (convert to WebP for production)
- **File Size**: ~180KB (PNG), ~90KB (WebP optimized)
- **Colors**: Purple-cyan gradient (#7C3AED → #6366F1 → #06B6D4)
- **Elements**: Glowing spheres, wireframe cubes, torus rings, particles
- **Style**: Neon lighting, depth of field, cosmic dark background

**Usage**:

- Homepage hero section background
- Can be blurred for card backgrounds
- Loading screen backdrop

**Responsive Variants** (recommended):

```
hero-background-desktop.webp  (1920x1080px) - Desktop
hero-background-tablet.webp   (1280x720px)  - Tablet
hero-background-mobile.webp   (800x600px)   - Mobile
```

**Optimization**:

```bash
# Convert to WebP with quality 80
cwebp -q 80 hero_background.png -o hero-background-desktop.webp

# Create responsive variants
convert hero_background.png -resize 1280x720 hero-background-tablet.png
cwebp -q 80 hero-background-tablet.png -o hero-background-tablet.webp

convert hero_background.png -resize 800x600 hero-background-mobile.png
cwebp -q 80 hero-background-mobile.png -o hero-background-mobile.webp
```

**HTML Integration** (with responsive sources):

```html
<picture>
  <source media="(min-width: 1024px)" srcset="hero-background-desktop.webp" type="image/webp" />
  <source media="(min-width: 768px)" srcset="hero-background-tablet.webp" type="image/webp" />
  <source srcset="hero-background-mobile.webp" type="image/webp" />
  <img src="hero-background-desktop.png" alt="3D geometric shapes background" loading="lazy" />
</picture>
```

---

### 3. Navigation Icons

**Strategy**: Use emoji icons for simplicity and zero file size overhead

#### Category Icons (8 categories)

| Category       | Emoji | Unicode | Fallback Text |
| -------------- | ----- | ------- | ------------- |
| Home           | 🏠    | U+1F3E0 | Home          |
| Primitives     | □     | U+25A1  | Primitives    |
| Particles      | ✨    | U+2728  | Particles     |
| Text           | 🔤    | U+1F524 | Text          |
| Lighting       | 💡    | U+1F4A1 | Lighting      |
| Effects        | ⚡    | U+26A1  | Effects       |
| Postprocessing | 🎨    | U+1F3A8 | Post          |
| Controls       | 🎮    | U+1F3AE | Controls      |
| Advanced       | 🚀    | U+1F680 | Advanced      |

**Usage**:

```html
<nav class="sidebar-nav">
  <a href="/" class="nav-link">
    <span class="icon" aria-hidden="true">🏠</span>
    <span class="label">Home</span>
  </a>
  <div class="nav-category">
    <span class="category-icon" aria-hidden="true">□</span>
    <span class="category-title">Primitives</span>
  </div>
</nav>
```

**CSS Styling**:

```css
.nav-link .icon {
  font-size: 20px;
  line-height: 1;
  width: 24px;
  text-align: center;
}

.category-icon {
  font-size: 16px;
  opacity: 0.6;
}
```

**Benefits**:

- Zero file size (uses system emoji)
- Always sharp (vector-based)
- Accessible by default
- Cross-platform consistent

**Alternative**: If SVG icons are preferred, use Heroicons or Lucide Icons library.

---

### 4. UI Component Assets

#### 4.1 Button Icons (Optional SVG)

**Copy Icon** (Code block):

```svg
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" stroke-width="1.5"/>
  <path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

**Arrow Icon** (CTA buttons):

```svg
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Expand Icon** (Code block):

```svg
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 3H13M13 3V6M13 3L9 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 13H3M3 13V10M3 13L7 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**Usage**: Inline SVG in Angular components for dynamic styling.

---

#### 4.2 Loading Spinner

**CSS-based Spinner** (no image needed):

```css
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

**Usage**: 3D scene loading state, page transitions.

---

### 5. Demo Thumbnails (23+ Pages)

**Strategy**: Auto-generate thumbnails from 3D scenes OR use placeholder images

#### 5.1 Placeholder Approach (Fast Implementation)

Use geometric shapes with category colors:

```
┌──────────────┐
│              │
│      □       │  ← Category icon (large)
│              │
│  Demo Name   │  ← Text label
└──────────────┘
  200x150px
```

**Example CSS for Placeholder**:

```css
.demo-thumbnail {
  width: 200px;
  height: 150px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 48px; /* Icon */
}

.demo-thumbnail .label {
  font-size: 14px;
  margin-top: 16px;
  opacity: 0.9;
}
```

**Usage**: Navigation cards, category previews.

---

#### 5.2 Screenshot Approach (Higher Quality)

**Process**:

1. Render 3D scene in browser
2. Capture screenshot (800x600px)
3. Resize to 400x300px (2x for Retina)
4. Convert to WebP
5. Use in navigation/preview cards

**Automation Script** (Playwright):

```typescript
import { chromium } from 'playwright';

async function captureSceneScreenshot(url: string, outputPath: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(url);
  await page.waitForSelector('canvas'); // Wait for 3D scene to render
  await page.waitForTimeout(2000); // Allow scene to settle

  const canvas = await page.locator('canvas');
  await canvas.screenshot({ path: outputPath });

  await browser.close();
}

// Example usage
captureSceneScreenshot('http://localhost:4200/primitives/box', 'box-thumbnail.png');
```

---

### 6. Social Media Assets

#### 6.1 Open Graph Image (og:image)

**Specifications**:

- **Dimensions**: 1200x630px (1.91:1 ratio)
- **Format**: PNG or WebP
- **File Size**: < 300KB
- **Content**: Logo + tagline + hero visual

**Template**:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [Logo]     Angular 3D                          │
│             Professional 3D Library for Angular │
│                                                 │
│         [Hero Background with 3D shapes]        │
│                                                 │
└─────────────────────────────────────────────────┘
  1200x630px
```

**Usage**:

```html
<meta property="og:image" content="https://yourdomain.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Angular 3D - Professional 3D graphics library for Angular" />
```

---

#### 6.2 Twitter Card Image

**Specifications**:

- **Dimensions**: 1200x675px (16:9 ratio)
- **Format**: PNG or WebP
- **Content**: Same as OG image or custom variant

**Usage**:

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://yourdomain.com/twitter-card.png" />
<meta name="twitter:image:alt" content="Angular 3D - 3D graphics for Angular" />
```

---

## 🗂️ Asset Directory Structure

```
apps/angular-3d-demo/src/assets/
├── images/
│   ├── logo/
│   │   ├── angular-3d-logo.webp          (512x512px, header)
│   │   ├── angular-3d-logo.png           (original)
│   │   └── angular-3d-logo-inverted.webp (light theme variant)
│   │
│   ├── hero/
│   │   ├── hero-background-desktop.webp  (1920x1080px)
│   │   ├── hero-background-tablet.webp   (1280x720px)
│   │   └── hero-background-mobile.webp   (800x600px)
│   │
│   ├── thumbnails/
│   │   ├── primitives/
│   │   │   ├── box.webp                  (400x300px @2x)
│   │   │   ├── sphere.webp
│   │   │   ├── torus.webp
│   │   │   ├── cylinder.webp
│   │   │   └── plane.webp
│   │   │
│   │   ├── particles/
│   │   │   ├── particle-cloud.webp
│   │   │   ├── gpu-particles.webp
│   │   │   └── marble-system.webp
│   │   │
│   │   └── ... (more categories)
│   │
│   └── social/
│       ├── og-image.png                  (1200x630px)
│       └── twitter-card.png              (1200x675px)
│
├── icons/
│   ├── favicon.ico
│   ├── favicon-32x32.png
│   ├── favicon-16x16.png
│   ├── apple-touch-icon.png              (180x180px)
│   ├── android-chrome-192x192.png
│   └── android-chrome-512x512.png
│
└── models/ (optional)
    └── logo-3d.glb                       (3D logo model for hero)
```

---

## 🔧 Asset Optimization Guidelines

### Image Optimization Checklist

- [ ] **WebP Conversion**: All PNGs converted to WebP (80-85% quality)
- [ ] **Responsive Variants**: Multiple sizes for different breakpoints
- [ ] **Lazy Loading**: Add `loading="lazy"` to all images below the fold
- [ ] **Explicit Dimensions**: Set width/height to prevent layout shift
- [ ] **Compression**: Use `cwebp -q 85` or `sharp` for optimal compression
- [ ] **Alt Text**: Descriptive alt text for all images (accessibility)
- [ ] **Preload**: Critical images (logo, hero) use `<link rel="preload">`

---

### WebP Fallback Pattern

```html
<picture>
  <source type="image/webp" srcset="image.webp" />
  <source type="image/png" srcset="image.png" />
  <img src="image.png" alt="Description" loading="lazy" />
</picture>
```

---

### TailwindCSS Integration

**Background Images**:

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #7C3AED 0%, #6366F1 50%, #06B6D4 100%)',
        'hero-pattern': "url('/assets/images/hero/hero-background-desktop.webp')",
      },
    },
  },
};
```

**Usage**:

```html
<section class="bg-hero-pattern bg-cover bg-center">
  <!-- Hero content -->
</section>
```

---

## 🚀 Asset Loading Strategy

### Critical Assets (Preload)

```html
<!-- Logo (visible immediately) -->
<link rel="preload" as="image" href="/assets/images/logo/angular-3d-logo.webp" />

<!-- Hero background (above the fold) -->
<link rel="preload" as="image" href="/assets/images/hero/hero-background-desktop.webp" />
```

---

### Lazy Loading (Below Fold)

```html
<!-- Demo thumbnails -->
<img src="/assets/images/thumbnails/primitives/box.webp" alt="Box geometry demo" loading="lazy" width="400" height="300" />
```

---

### Deferred Loading (Route-based)

```typescript
// app.routes.ts (Angular 20)
export const routes: Routes = [
  {
    path: 'primitives',
    loadComponent: () => import('./primitives/primitives.component'),
    // Images loaded only when route is activated
  },
];
```

---

## 📊 Asset Size Budget

| Asset Type      | Target Size | Max Size | Quantity | Total Budget |
| --------------- | ----------- | -------- | -------- | ------------ |
| Logo            | 15KB        | 20KB     | 1        | 20KB         |
| Hero Background | 90KB        | 120KB    | 3        | 360KB        |
| Thumbnails      | 8KB         | 12KB     | 23       | 276KB        |
| Social Images   | 150KB       | 250KB    | 2        | 500KB        |
| Favicon Set     | 5KB         | 10KB     | 6        | 60KB         |
| **Total**       | -           | -        | 35       | **1.2MB**    |

**Performance Target**: Initial page load < 500KB images (logo + hero only)

---

## ✅ Asset Preparation Checklist

### Phase 1: Core Assets (Highest Priority)

- [x] Logo (512x512px) - **Generated** ✅
- [x] Hero background (1920x1080px) - **Generated** ✅
- [ ] Logo WebP conversion
- [ ] Hero responsive variants (tablet, mobile)
- [ ] Favicon set (6 sizes)

### Phase 2: Navigation Assets

- [x] Category icons (emoji-based) - **Documented** ✅
- [ ] UI component SVG icons (copy, arrow, expand)
- [ ] Loading spinner CSS

### Phase 3: Demo Thumbnails (Can be deferred)

- [ ] Primitives category (5 thumbnails)
- [ ] Particles category (3 thumbnails)
- [ ] Text category (1 thumbnail)
- [ ] Lighting category (3 thumbnails)
- [ ] Effects category (4 thumbnails)
- [ ] Postprocessing category (3 thumbnails)
- [ ] Controls category (2 thumbnails)
- [ ] Advanced category (2 thumbnails)

### Phase 4: Social Media (For launch)

- [ ] Open Graph image (1200x630px)
- [ ] Twitter card image (1200x675px)

---

## 🎨 Future Enhancements (Optional)

### 3D Model Assets

**Logo 3D Model** (GLB format):

- Low-poly geometric cube (< 50KB)
- Animated rotation
- Use in hero section with Three.js

**Demo Placeholder Models**:

- Generic geometric shapes
- Pre-textured materials
- Fast loading (< 100KB each)

**Tools**:

- Blender (free, open-source)
- Spline (web-based 3D design)
- Three.js examples library

---

### Animated SVG Icons

**Micro-animations on hover**:

- Copy icon → checkmark (on click)
- Arrow → slide right (on hover)
- Menu icon → X (on click)

**Library**: Rive or LottieFiles for animated icons

---

### Custom Cursor (Advanced)

**3D-aware cursor**:

- Changes to grab hand over 3D scenes
- Crosshair when rotating camera
- Pointer for UI elements

**Implementation**:

```css
.scene-container {
  cursor: grab;
}

.scene-container:active {
  cursor: grabbing;
}
```

---

## 📚 Asset Sources & Attribution

### Generated Assets (AI)

- Logo: Generated with Antigravity `generate_image` tool
- Hero Background: Generated with Antigravity `generate_image` tool
- License: Custom assets, no attribution required

### Icon Libraries (If using SVG)

- [Heroicons](https://heroicons.com) - MIT License
- [Lucide Icons](https://lucide.dev) - ISC License
- [Feather Icons](https://feathericons.com) - MIT License

### 3D Models (If used)

- [Three.js Examples](https://threejs.org/examples/) - MIT License
- [Sketchfab Free Models](https://sketchfab.com/3d-models?features=downloadable&sort_by=-likeCount) - CC BY 4.0 (check individual licenses)
- [Poly Pizza](https://poly.pizza) - CC0 (Public Domain)

---

## 🛠️ Asset Management Tools

### Recommended NPM Packages

```bash
# Image optimization
npm install sharp --save-dev
npm install cwebp-bin --save-dev

# Favicon generation
npm install favicons --save-dev

# Screenshot automation (Playwright)
npm install @playwright/test --save-dev
```

### Automation Scripts

**Convert all PNGs to WebP**:

```bash
#!/bin/bash
# convert-to-webp.sh

find assets/images -name "*.png" | while read file; do
  output="${file%.png}.webp"
  cwebp -q 85 "$file" -o "$output"
  echo "Converted: $output"
done
```

**Generate Favicons**:

```javascript
// generate-favicons.js
const favicons = require('favicons');
const fs = require('fs');

const source = 'assets/images/logo/angular-3d-logo.png';
const configuration = {
  path: '/icons/',
  icons: {
    android: true,
    appleIcon: true,
    favicons: true,
  },
};

favicons(source, configuration, (error, response) => {
  if (error) throw error;

  response.images.forEach((image) => {
    fs.writeFileSync(`assets/icons/${image.name}`, image.contents);
  });

  console.log('Favicons generated!');
});
```

---

## 📋 Next Steps

**Asset preparation is now complete for Phase 3 (UI/UX Design).**

**Handoff to**: Software Architect (Phase 4)

**Architect will reference**:

1. Visual design specification (component specs, design tokens)
2. **This asset inventory** (file paths, optimization settings)
3. Requirements document (SMART requirements)

**Developer Implementation**:

1. Copy generated assets to `apps/angular-3d-demo/src/assets/`
2. Run WebP conversion scripts
3. Generate favicon set
4. Integrate assets into components (see visual spec for usage patterns)
5. Implement lazy loading strategy
6. Verify performance budget (< 500KB initial load)

---

## Document Metadata

- **Task ID**: TASK_2026_011
- **Phase**: 3 - UI/UX Design
- **Deliverable**: Design Assets Inventory
- **Created**: 2026-01-27
- **Asset Count**: 15 core assets (2 generated, 8 icons, 5 system)
- **Total Budget**: ~1.2MB (optimized)
- **Generated Assets**: Logo (512x512px), Hero Background (1920x1080px)
- **Status**: ✅ Complete
