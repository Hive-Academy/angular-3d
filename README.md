# Angular 3D & GSAP Libraries

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/hive-academy/angular-3d-workspace/blob/main/LICENSE)

> Modern Angular libraries for building stunning 3D graphics and scroll animations

This repository contains two powerful Angular libraries for creating immersive web experiences:

- **@hive-academy/angular-3d** - Declarative Three.js components for 3D graphics
- **@hive-academy/angular-gsap** - GSAP-powered scroll animations

---

## 📚 Libraries

| Library                                           | Version                                                                                                                         | Description                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [@hive-academy/angular-3d](./libs/angular-3d)     | [![npm](https://img.shields.io/npm/v/@hive-academy/angular-3d.svg)](https://www.npmjs.com/package/@hive-academy/angular-3d)     | Declarative Three.js components - 54 components, 24 directives, 14 services   |
| [@hive-academy/angular-gsap](./libs/angular-gsap) | [![npm](https://img.shields.io/npm/v/@hive-academy/angular-gsap.svg)](https://www.npmjs.com/package/@hive-academy/angular-gsap) | GSAP scroll animations - 7 components, 19 directives, 2 services, 2 providers |

---

## 🚀 Quick Install

### 3D Graphics

```bash
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text
```

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, BoxComponent } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-basic-scene',
  standalone: true,
  imports: [Scene3dComponent, BoxComponent],
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
      <a3d-box [color]="'#ff6b6b'" />
    </a3d-scene-3d>
  `,
})
export class BasicSceneComponent {}
```

### Scroll Animations

```bash
npm install @hive-academy/angular-gsap gsap lenis
```

```typescript
import { Component } from '@angular/core';
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ScrollAnimationDirective],
  template: `<h1 scrollAnimation>Animated on scroll</h1>`,
})
export class HeroComponent {}
```

---

## 🎬 Live Demo

> 🚀 Coming soon - Interactive demo showcasing both libraries

---

## 📖 Documentation

- [angular-3d Documentation](./libs/angular-3d/README.md) - Full API reference for 3D components
- [angular-gsap Documentation](./libs/angular-gsap/README.md) - Complete scroll animation guide
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Code of Conduct](./CODE_OF_CONDUCT.md) - Community guidelines

---

## 💻 Development

### Prerequisites

- Node.js 20+
- npm 10+
- Angular 20.3+

### Setup

```bash
# Clone repository
git clone https://github.com/hive-academy/angular-3d-workspace.git
cd angular-3d-workspace

# Install dependencies
npm install

# Start demo application
npx nx serve angular-3d-demo
```

### Common Commands

```bash
# Development
npx nx serve angular-3d-demo          # Start dev server
npx nx test angular-3d                 # Run unit tests
npx nx build angular-3d                # Build library

# Quality checks
npx nx lint angular-3d                 # Lint library
npx nx typecheck angular-3d            # Type checking
npx nx run-many -t lint test build    # Run all checks

# View dependency graph
npx nx graph
```

---

## 📦 Publishing

This workspace uses Nx release tooling for automated versioning and publishing.

### Automated Publishing (Recommended)

```bash
# Create version and tag
npm run release:version -- --projects=@hive-academy/angular-3d
git push && git push --tags

# CI/CD automatically publishes to npm
```

### Manual Publishing

```bash
# Set NPM token
export NPM_TOKEN=<your_npm_token>

# Preview changes
npm run release:version:dry -- --projects=@hive-academy/angular-3d

# Create version and publish
npm run release:version -- --projects=@hive-academy/angular-3d
npm run release:publish -- --projects=@hive-academy/angular-3d
git push && git push --tags
```

For detailed publishing instructions, see [CONTRIBUTING.md](./CONTRIBUTING.md#publishing-packages).

---

## 📄 License

MIT © Hive Academy

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 🔗 Links

- [Report Issues](https://github.com/hive-academy/angular-3d-workspace/issues)
- [Angular Documentation](https://angular.dev)
- [Three.js Documentation](https://threejs.org/docs/)
- [GSAP Documentation](https://greensock.com/docs/)
