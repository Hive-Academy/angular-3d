# Angular & TypeScript Best Practices Guide

> Retrieved from Angular CLI MCP Server for Angular v20+

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

---

## TypeScript Best Practices

### Type Safety

- Use strict type checking (`strict: true` in tsconfig)
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Use explicit return types for public methods
- Prefer `readonly` for properties that shouldn't change

### Naming Conventions

- Use PascalCase for classes, interfaces, types, enums
- Use camelCase for variables, functions, methods
- Use UPPER_SNAKE_CASE for constants
- Prefix interfaces with `I` only when necessary to avoid ambiguity
- Use descriptive names that convey purpose

### Code Organization

- One class/interface per file
- Group related files in feature folders
- Use barrel exports (`index.ts`) for clean imports
- Keep functions small and focused (single responsibility)

### Modern TypeScript Features

```typescript
// Use nullish coalescing
const value = data ?? defaultValue;

// Use optional chaining
const name = user?.profile?.name;

// Use satisfies for type-safe object literals
const config = {
  port: 3000,
  host: 'localhost',
} satisfies ServerConfig;

// Use const assertions for literal types
const actions = ['add', 'remove', 'update'] as const;
```

### Explicit Member Accessibility

Always use explicit accessibility modifiers:

```typescript
export class MyService {
  private readonly _state = signal<State>(initialState);
  public readonly state = this._state.asReadonly();

  public constructor() {}

  public doSomething(): void {}

  private helperMethod(): void {}
}
```

---

## Angular Best Practices

### Component Architecture

- Always use standalone components (default in Angular v20+)
- Must NOT set `standalone: true` inside Angular decorators - it's the default
- Set `changeDetection: ChangeDetectionStrategy.OnPush` always
- Keep components small and focused on a single responsibility
- Prefer inline templates for small components

### Signals & Reactivity

- Use `input()` and `output()` functions instead of decorators
- Use `viewChild()` and `contentChild()` signal functions
- Use `computed()` for derived state
- Use signals for local component state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

```typescript
// Modern Angular 20+ patterns
export class MyComponent {
  // Signal-based inputs
  public readonly name = input.required<string>();
  public readonly count = input<number>(0);

  // Signal-based outputs
  public readonly clicked = output<void>();

  // Signal-based view queries
  private readonly buttonRef = viewChild<ElementRef>('button');

  // Computed derived state
  public readonly displayName = computed(() => `Hello, ${this.name()}`);
}
```

### Host Bindings

- Do NOT use `@HostBinding` and `@HostListener` decorators
- Put host bindings inside the `host` object of the decorator:

```typescript
@Component({
  selector: 'app-button',
  host: {
    '[class.active]': 'isActive()',
    '(click)': 'onClick($event)',
  },
})
export class ButtonComponent {}
```

### Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do not write arrow functions in templates (not supported)

```html
<!-- Modern Angular control flow -->
@if (isLoading()) {
<app-spinner />
} @else { @for (item of items(); track item.id) {
<app-item [data]="item" />
} }
```

### Services

- Design services around a single responsibility
- Use `providedIn: 'root'` for singleton services
- Use `inject()` function instead of constructor injection
- Component-scoped services should use `providers: []` array

```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);

  public getData(): Observable<Data[]> {
    return this.http.get<Data[]>('/api/data');
  }
}
```

### Forms

- Prefer Reactive forms over Template-driven forms
- Use typed form controls (`FormControl<string>`)
- Validate on blur or submit, not on every keystroke

### Images

- Use `NgOptimizedImage` for all static images
- Note: `NgOptimizedImage` does not work for inline base64 images

---

## Accessibility Requirements

- It MUST pass all AXE checks
- It MUST follow all WCAG AA minimums:
  - Focus management
  - Color contrast (4.5:1 for normal text, 3:1 for large text)
  - ARIA attributes
  - Keyboard navigation
- Use semantic HTML elements
- Provide alt text for images
- Ensure interactive elements are focusable

---

## Performance

- Implement lazy loading for feature routes
- Use `OnPush` change detection
- Track items in `@for` loops with `track`
- Avoid function calls in templates (use computed signals)
- Use `NgOptimizedImage` for optimized image loading
