/**
 * PerformanceDebugComponent - Real-time performance metrics overlay
 *
 * Shows FPS, GPU timing, active render loops, and visibility states
 * to help diagnose multi-scene performance issues.
 *
 * Usage:
 * <app-performance-debug /> - Toggle with 'P' key
 */
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
  afterNextRender,
  HostListener,
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { RenderCallbackRegistry } from '@hive-academy/angular-3d';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  jsHeapUsed: number;
  jsHeapTotal: number;
  activeCallbacks: number;
  totalCallbacks: number;
  gpuTime?: number;
}

@Component({
  selector: 'app-performance-debug',
  standalone: true,
  imports: [SlicePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isVisible()) {
    <div class="perf-overlay">
      <div class="perf-header">
        <span>Performance Monitor</span>
        <span class="close-hint">(Press P to close)</span>
      </div>
      <div class="perf-grid">
        <div class="perf-item">
          <span class="perf-label">FPS</span>
          <span
            class="perf-value"
            [class.warning]="metrics().fps < 30"
            [class.good]="metrics().fps >= 55"
          >
            {{ metrics().fps }}
          </span>
        </div>
        <div class="perf-item">
          <span class="perf-label">Frame Time</span>
          <span class="perf-value">{{ metrics().frameTime.toFixed(1) }}ms</span>
        </div>
        <div class="perf-item">
          <span class="perf-label">JS Heap</span>
          <span class="perf-value"
            >{{ (metrics().jsHeapUsed / 1024 / 1024).toFixed(1) }}MB</span
          >
        </div>
        <div class="perf-item">
          <span class="perf-label">Active Callbacks</span>
          <span
            class="perf-value"
            [class.warning]="metrics().activeCallbacks > 10"
          >
            {{ metrics().activeCallbacks }} / {{ metrics().totalCallbacks }}
          </span>
        </div>
      </div>
      <div class="perf-section">
        <span class="perf-label">Callback Registry Details:</span>
        <div class="callback-list">
          @for (cb of callbackDetails(); track cb.id) {
          <div
            class="callback-item"
            [class.active]="cb.active"
            [class.paused]="!cb.active"
          >
            <span class="cb-id">{{ cb.id | slice : 0 : 30 }}...</span>
            <span class="cb-status">{{ cb.active ? 'ACTIVE' : 'PAUSED' }}</span>
          </div>
          }
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .perf-overlay {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 99999;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(100, 255, 100, 0.3);
        border-radius: 8px;
        padding: 12px;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 12px;
        color: #00ff00;
        min-width: 280px;
        backdrop-filter: blur(8px);
      }
      .perf-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(100, 255, 100, 0.2);
      }
      .close-hint {
        font-size: 10px;
        color: rgba(100, 255, 100, 0.5);
      }
      .perf-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }
      .perf-item {
        display: flex;
        flex-direction: column;
      }
      .perf-label {
        font-size: 10px;
        color: rgba(100, 255, 100, 0.6);
        text-transform: uppercase;
      }
      .perf-value {
        font-size: 16px;
        font-weight: bold;
      }
      .perf-value.warning {
        color: #ff6b6b;
      }
      .perf-value.good {
        color: #69db7c;
      }
      .perf-section {
        padding-top: 8px;
        border-top: 1px solid rgba(100, 255, 100, 0.2);
      }
      .callback-list {
        margin-top: 6px;
        max-height: 150px;
        overflow-y: auto;
      }
      .callback-item {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        font-size: 10px;
        border-bottom: 1px solid rgba(100, 255, 100, 0.1);
      }
      .callback-item.active {
        color: #69db7c;
      }
      .callback-item.paused {
        color: #ff6b6b;
        opacity: 0.7;
      }
      .cb-id {
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .cb-status {
        font-weight: bold;
      }
    `,
  ],
})
export class PerformanceDebugComponent {
  private readonly callbackRegistry = inject(RenderCallbackRegistry);
  private readonly destroyRef = inject(DestroyRef);

  public readonly isVisible = signal(false);
  public readonly metrics = signal<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    jsHeapUsed: 0,
    jsHeapTotal: 0,
    activeCallbacks: 0,
    totalCallbacks: 0,
  });
  public readonly callbackDetails = signal<
    { id: string; active: boolean; priority: number }[]
  >([]);

  private lastTime = performance.now();
  private frameCount = 0;
  private animationFrameId: number | null = null;

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 'p' && !event.ctrlKey && !event.metaKey) {
      this.isVisible.set(!this.isVisible());
      if (this.isVisible()) {
        this.startMonitoring();
      } else {
        this.stopMonitoring();
      }
    }
  }

  public constructor() {
    afterNextRender(() => {
      // Check for ?debug=perf query param
      if (
        typeof window !== 'undefined' &&
        window.location.search.includes('debug=perf')
      ) {
        this.isVisible.set(true);
        this.startMonitoring();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.stopMonitoring();
    });
  }

  private startMonitoring(): void {
    if (this.animationFrameId !== null) return;

    const monitor = () => {
      const now = performance.now();
      this.frameCount++;

      // Update FPS every second
      if (now - this.lastTime >= 1000) {
        const fps = Math.round(
          (this.frameCount * 1000) / (now - this.lastTime)
        );
        const frameTime = (now - this.lastTime) / this.frameCount;

        // Get memory info if available
        const memory = (
          performance as unknown as {
            memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
          }
        ).memory;

        this.metrics.set({
          fps,
          frameTime,
          jsHeapUsed: memory?.usedJSHeapSize ?? 0,
          jsHeapTotal: memory?.totalJSHeapSize ?? 0,
          activeCallbacks: this.callbackRegistry.activeCount(),
          totalCallbacks: this.callbackRegistry.totalCount(),
        });

        // Update callback details
        this.callbackDetails.set(this.callbackRegistry.getDebugInfo());

        this.frameCount = 0;
        this.lastTime = now;
      }

      this.animationFrameId = requestAnimationFrame(monitor);
    };

    this.animationFrameId = requestAnimationFrame(monitor);
  }

  private stopMonitoring(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
