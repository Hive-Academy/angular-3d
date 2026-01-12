/**
 * Stagger Group Service - Coordinated reveal animations across multiple directives
 *
 * Manages groups of SceneRevealDirective instances for synchronized staggered animations.
 * Enables "cascade reveal" effects where multiple 3D objects appear in sequence with
 * configurable delays between each.
 *
 * Features:
 * - Named stagger groups for independent coordination
 * - Index-based ordering within groups
 * - Configurable stagger delay between items
 * - Async reveal/hide operations with Promise-based completion
 * - Automatic cleanup when directives unregister
 *
 * @example
 * ```typescript
 * // In a component orchestrating reveals
 * @Component({...})
 * export class HeroSectionComponent {
 *   private staggerService = inject(StaggerGroupService);
 *
 *   async onEntranceComplete(): Promise<void> {
 *     // Reveal all objects in 'hero-items' group with 150ms stagger
 *     await this.staggerService.revealGroup('hero-items', 150);
 *   }
 * }
 *
 * // In template, SceneRevealDirective instances register themselves
 * <a3d-box
 *   a3dSceneReveal
 *   [revealConfig]="{ animation: 'fade-in', staggerGroup: 'hero-items', staggerIndex: 0 }"
 * />
 * <a3d-sphere
 *   a3dSceneReveal
 *   [revealConfig]="{ animation: 'scale-pop', staggerGroup: 'hero-items', staggerIndex: 1 }"
 * />
 * ```
 */

import { Injectable } from '@angular/core';

/**
 * Interface for directives that can be revealed as part of a stagger group.
 *
 * This uses a minimal interface to avoid circular dependencies with SceneRevealDirective.
 * The actual SceneRevealDirective will implement these methods.
 */
export interface RevealableDirective {
  /** Trigger the reveal animation */
  reveal(): Promise<void>;
  /** Hide the object (reverse of reveal) */
  hide(): Promise<void>;
}

/**
 * Service for coordinating staggered reveal animations across multiple directives.
 *
 * Directives register themselves with a named group and stagger index.
 * When revealGroup() is called, all directives in the group are revealed
 * in index order with configurable delays between each.
 */
@Injectable({ providedIn: 'root' })
export class StaggerGroupService {
  /**
   * Map of group name to registered directives with their indices.
   *
   * Structure: Map<groupName, Map<directive, staggerIndex>>
   *
   * Note: Using Map instead of WeakMap because we need iteration capabilities.
   * Directives MUST call unregister() in their cleanup to prevent memory leaks.
   */
  private readonly groups = new Map<string, Map<RevealableDirective, number>>();

  /** Default stagger delay between items in milliseconds */
  private readonly defaultStaggerDelay = 150;

  /**
   * Register a directive with a stagger group
   *
   * Called by SceneRevealDirective during initialization when staggerGroup is configured.
   *
   * @param groupName - Name of the stagger group
   * @param directive - The directive instance to register
   * @param index - Stagger index for ordering (lower indices reveal first)
   *
   * @example
   * ```typescript
   * // Called internally by SceneRevealDirective
   * this.staggerService.register('hero-items', this, 0);
   * ```
   */
  public register(
    groupName: string,
    directive: RevealableDirective,
    index: number
  ): void {
    if (!this.groups.has(groupName)) {
      this.groups.set(groupName, new Map());
    }
    this.groups.get(groupName)!.set(directive, index);
  }

  /**
   * Unregister a directive from a stagger group
   *
   * Called by SceneRevealDirective during cleanup. MUST be called to prevent memory leaks.
   *
   * @param groupName - Name of the stagger group
   * @param directive - The directive instance to unregister
   *
   * @example
   * ```typescript
   * // Called internally by SceneRevealDirective in cleanup
   * this.staggerService.unregister('hero-items', this);
   * ```
   */
  public unregister(groupName: string, directive: RevealableDirective): void {
    const group = this.groups.get(groupName);
    if (group) {
      group.delete(directive);
      // Clean up empty groups to prevent memory accumulation
      if (group.size === 0) {
        this.groups.delete(groupName);
      }
    }
  }

  /**
   * Trigger reveal animation for all directives in a stagger group
   *
   * Directives are revealed in stagger index order with configurable delay between each.
   * Returns a Promise that resolves when all reveals have started (not completed).
   *
   * @param groupName - Name of the stagger group to reveal
   * @param staggerDelay - Delay in milliseconds between each item (default: 150ms)
   * @returns Promise that resolves when all reveal animations have been triggered
   *
   * @example
   * ```typescript
   * // Reveal with default 150ms stagger
   * await staggerService.revealGroup('hero-items');
   *
   * // Reveal with custom 200ms stagger
   * await staggerService.revealGroup('hero-items', 200);
   *
   * // Reveal with no stagger (all at once)
   * await staggerService.revealGroup('hero-items', 0);
   * ```
   */
  public async revealGroup(
    groupName: string,
    staggerDelay: number = this.defaultStaggerDelay
  ): Promise<void> {
    const group = this.groups.get(groupName);
    if (!group || group.size === 0) {
      // No group or empty group - resolve immediately
      return;
    }

    // Sort directives by stagger index (ascending)
    const sortedDirectives = [...group.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([directive]) => directive);

    // Create promises for staggered reveals
    const promises = sortedDirectives.map((directive, i) => {
      return new Promise<void>((resolve) => {
        const delay = i * staggerDelay;

        if (delay === 0) {
          // No delay - reveal immediately
          directive.reveal().then(resolve).catch(resolve);
        } else {
          // Schedule reveal after delay
          setTimeout(() => {
            directive.reveal().then(resolve).catch(resolve);
          }, delay);
        }
      });
    });

    // Wait for all reveals to complete
    await Promise.all(promises);
  }

  /**
   * Hide all directives in a stagger group
   *
   * Unlike revealGroup, hideGroup hides all directives simultaneously without stagger.
   * Useful for resetting a scene or preparing for re-reveal.
   *
   * @param groupName - Name of the stagger group to hide
   * @returns Promise that resolves when all hide animations complete
   *
   * @example
   * ```typescript
   * await staggerService.hideGroup('hero-items');
   * ```
   */
  public async hideGroup(groupName: string): Promise<void> {
    const group = this.groups.get(groupName);
    if (!group || group.size === 0) {
      return;
    }

    // Hide all directives simultaneously
    const promises = [...group.keys()].map((directive) =>
      directive.hide().catch(() => {
        // Swallow errors to ensure all hide operations are attempted
      })
    );

    await Promise.all(promises);
  }

  /**
   * Check if a stagger group exists and has registered directives
   *
   * @param groupName - Name of the group to check
   * @returns True if the group exists and has at least one directive
   *
   * @example
   * ```typescript
   * if (staggerService.hasGroup('hero-items')) {
   *   await staggerService.revealGroup('hero-items');
   * }
   * ```
   */
  public hasGroup(groupName: string): boolean {
    const group = this.groups.get(groupName);
    return group !== undefined && group.size > 0;
  }

  /**
   * Get the number of directives registered in a stagger group
   *
   * @param groupName - Name of the group
   * @returns Number of directives in the group (0 if group doesn't exist)
   *
   * @example
   * ```typescript
   * const count = staggerService.getGroupSize('hero-items');
   * console.log(`${count} items to reveal`);
   * ```
   */
  public getGroupSize(groupName: string): number {
    return this.groups.get(groupName)?.size ?? 0;
  }

  /**
   * Get all registered group names
   *
   * Useful for debugging or managing multiple groups.
   *
   * @returns Array of group names
   */
  public getGroupNames(): string[] {
    return [...this.groups.keys()];
  }

  /**
   * Clear all directives from a specific group
   *
   * Removes all registrations without calling hide(). Use with caution.
   *
   * @param groupName - Name of the group to clear
   */
  public clearGroup(groupName: string): void {
    this.groups.delete(groupName);
  }

  /**
   * Clear all stagger groups
   *
   * Removes all registrations without calling hide(). Use with caution.
   * Typically only needed for testing or complete scene reset.
   */
  public clearAllGroups(): void {
    this.groups.clear();
  }
}
