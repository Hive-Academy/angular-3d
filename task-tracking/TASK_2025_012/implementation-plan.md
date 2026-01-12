# Implementation Plan - TASK_2025_012

## Goal

Migrate GSAP section components from `temp/` folder to the demo application's GSAP showcase page, updating all imports to use `@hive-academy/angular-gsap` library, enabling a functional demonstration of the library's capabilities.

---

## Proposed Changes

### Component 1: Shared Helper Components Migration

**Purpose**: Migrate shared UI components required by GSAP sections

#### [CREATE] `apps/angular-3d-demo/src/app/shared/components/code-snippet.component.ts`

**Pattern Reference**: `temp/code-snippet.component.ts` (if exists) / Create new with prism or simple syntax highlighting
**Rationale**: ChromaDB section depends on CodeSnippetComponent for displaying code examples

```typescript
// Pattern: Standalone Angular component with OnPush
@Component({
  selector: 'app-code-snippet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pre class="bg-gray-900 rounded-lg p-4 overflow-x-auto">
      <code [class]="'language-' + language()">{{ code() }}</code>
    </pre>
  `,
})
export class CodeSnippetComponent {
  readonly code = input.required<string>();
  readonly language = input<string>('typescript');
}
```

---

#### [CREATE] `apps/angular-3d-demo/src/app/shared/components/decorative-pattern.component.ts`

**Pattern Reference**: `temp/decorative-patterns.component.ts`
**Rationale**: Both ChromaDB and Neo4j sections use DecorativePatternComponent for visual effects

**Migration Notes**:

- Copy SVG patterns from temp source
- Maintain pattern input signal
- Keep standalone component pattern

---

### Component 2: ChromaDB Section Migration

**Purpose**: Migrate ChromaDB showcase with HijackedScrollTimeline

#### [CREATE] `apps/angular-3d-demo/src/app/pages/gsap-showcase/sections/chromadb-section.component.ts`

**Source**: `temp/chromadb-section.component.ts:1-562`
**Pattern Reference**: Home page sections pattern - `pages/home/sections/angular-gsap-section.component.ts:1-225`

**Changes Required**:

1. **Import Path Updates** (Lines 3-8):

   ```diff
   - import { ScrollAnimationDirective } from '../../../core/angular-3d/directives/scroll-animation.directive';
   - import { HijackedScrollTimelineComponent } from '../../../shared/components/hijacked-scroll-timeline.component';
   - import { HijackedScrollItemDirective } from '../../../core/angular-3d/directives/hijacked-scroll-item.directive';
   + import {
   +   ScrollAnimationDirective,
   +   HijackedScrollTimelineComponent,
   +   HijackedScrollItemDirective
   + } from '@hive-academy/angular-gsap';
   ```

2. **Shared Component Imports**:

   ```diff
   - import { CodeSnippetComponent } from '../../../shared/components/code-snippet.component';
   - import { DecorativePatternComponent } from '../../../shared/components/decorative-patterns.component';
   + import { CodeSnippetComponent } from '../../../shared/components/code-snippet.component';
   + import { DecorativePatternComponent } from '../../../shared/components/decorative-pattern.component';
   ```

3. **TimelineStep Type**: Define locally or in shared types

**Quality Requirements**:

- ✅ Uses `ChangeDetection.OnPush`
- ✅ All GSAP imports from `@hive-academy/angular-gsap`
- ✅ Signal-based state (signal, input, computed)
- ✅ JSDoc documentation preserved

---

### Component 3: Neo4j Section Migration

**Purpose**: Migrate Neo4j showcase with scroll animations

#### [CREATE] `apps/angular-3d-demo/src/app/pages/gsap-showcase/sections/neo4j-section.component.ts`

**Source**: `temp/neo4j-section.component.ts:1-501`
**Pattern Reference**: ChromaDB section migration pattern

**Changes Required**:

1. **Import Path Updates** (Lines 3-8):

   ```diff
   - import { ScrollAnimationDirective } from '../../../core/angular-3d/directives/scroll-animation.directive';
   - import { HijackedScrollTimelineComponent } from '../../../shared/components/hijacked-scroll-timeline.component';
   - import { HijackedScrollItemDirective } from '../../../core/angular-3d/directives/hijacked-scroll-item.directive';
   + import {
   +   ScrollAnimationDirective,
   +   HijackedScrollTimelineComponent,
   +   HijackedScrollItemDirective
   + } from '@hive-academy/angular-gsap';
   ```

2. **Shared Component Imports**:
   ```diff
   - import { DecorativePatternComponent } from '../../../shared/components/decorative-patterns.component';
   + import { DecorativePatternComponent } from '../../../shared/components/decorative-pattern.component';
   ```

**Quality Requirements**:

- ✅ Uses `ChangeDetection.OnPush`
- ✅ All GSAP imports from `@hive-academy/angular-gsap`
- ✅ Signal-based state

---

### Component 4: GSAP Showcase Page Update

**Purpose**: Integrate migrated sections into the showcase page

#### [MODIFY] `apps/angular-3d-demo/src/app/pages/gsap-showcase/gsap-showcase.component.ts`

**Line Range**: 1-85
**Pattern Reference**: Home page component structure

**Changes**:

1. Import migrated section components
2. Replace placeholder content with actual sections
3. Add section composition

```typescript
// Updated imports
import { ChromadbSectionComponent } from './sections/chromadb-section.component';
import { Neo4jSectionComponent } from './sections/neo4j-section.component';

@Component({
  selector: 'app-gsap-showcase',
  imports: [
    ChromadbSectionComponent,
    Neo4jSectionComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- GSAP Hero (keep existing) -->

    <!-- ChromaDB Section -->
    <app-chromadb-section />

    <!-- Neo4j Section -->
    <app-neo4j-section />

    <!-- CTA Section (keep existing) -->
  `
})
```

---

### Component 5: Shared Types (Optional)

#### [CREATE] `apps/angular-3d-demo/src/app/shared/types/timeline-step.interface.ts`

**Purpose**: Shared interface for timeline components

```typescript
export interface TimelineStep {
  id: string;
  step: number;
  title: string;
  description: string;
  code: string;
  language: 'typescript' | 'bash' | 'image';
  layout: 'left' | 'right' | 'center';
  notes?: string[];
}
```

---

## File Summary

| Action | File Path                                                    | Description             |
| ------ | ------------------------------------------------------------ | ----------------------- |
| CREATE | `shared/components/code-snippet.component.ts`                | Code display helper     |
| CREATE | `shared/components/decorative-pattern.component.ts`          | SVG pattern decorations |
| CREATE | `pages/gsap-showcase/sections/chromadb-section.component.ts` | ChromaDB GSAP showcase  |
| CREATE | `pages/gsap-showcase/sections/neo4j-section.component.ts`    | Neo4j GSAP showcase     |
| MODIFY | `pages/gsap-showcase/gsap-showcase.component.ts`             | Integrate sections      |
| CREATE | `shared/types/timeline-step.interface.ts`                    | Shared type definitions |

---

## Verification Plan

### Automated Tests

```bash
# 1. Build verification (ensures imports resolve correctly)
npx nx build angular-3d-demo

# 2. Lint verification
npx nx lint angular-3d-demo

# 3. Type check verification
npx nx typecheck angular-3d-demo

# 4. Unit tests (existing)
npx nx test angular-3d-demo
```

### Manual Verification

1. **Start dev server**:

   ```bash
   npx nx serve angular-3d-demo
   ```

2. **Navigate to GSAP showcase**:

   - Open browser to `http://localhost:4200/angular-gsap`

3. **Verify visual rendering**:

   - [ ] Hero section displays with gradient background
   - [ ] ChromaDB section renders with decorative patterns
   - [ ] Neo4j section renders with decorative patterns

4. **Verify scroll animations**:

   - [ ] Scroll through page - elements fade/slide into view
   - [ ] HijackedScrollTimeline pins correctly
   - [ ] Progress through timeline steps works
   - [ ] No console errors during scroll

5. **Verify responsive behavior**:
   - [ ] Resize viewport - layouts adapt correctly
   - [ ] Mobile view maintains functionality

---

## Team-Leader Handoff

**Developer Type**: frontend-developer
**Complexity**: Simple (migration with import changes)
**Estimated Tasks**: 6-8 atomic tasks
**Batch Strategy**: Layer-based

### Suggested Batches

**Batch 1 - Shared Components** (P1):

- Create CodeSnippetComponent
- Create DecorativePatternComponent
- Create TimelineStep interface

**Batch 2 - Section Migration** (P2 - depends on Batch 1):

- Migrate ChromadbSectionComponent
- Migrate Neo4jSectionComponent

**Batch 3 - Integration & Verification** (P3 - depends on Batch 2):

- Update GsapShowcaseComponent
- Run build/lint/test verification
- Manual browser verification

---

## Risk Mitigation

| Risk                     | Mitigation                                                   |
| ------------------------ | ------------------------------------------------------------ |
| Missing asset files      | Verify `assets/images/` paths exist or update to demo assets |
| Import resolution errors | Verify library is built: `npx nx build angular-gsap`         |
| Template syntax errors   | Run `nx typecheck` before serve                              |
