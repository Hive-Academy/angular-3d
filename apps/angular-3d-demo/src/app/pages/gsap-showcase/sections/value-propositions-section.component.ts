import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import {
  ScrollAnimationDirective,
  SectionStickyDirective,
} from '@hive-academy/angular-gsap';
import type { ValueProposition } from '../../../shared/types/value-proposition.interface';

/**
 * Value Propositions Section Component - Scroll-Driven Showcase
 *
 * REDESIGNED: Inspired by Design-4 (threejs.journey) - Sticky sidebar + scroll-reveal
 *
 * Features:
 * - Sticky numbered sidebar (01-10) for navigation
 * - Full-viewport sections for each library
 * - Scroll-triggered content animations
 * - Active section tracking with IntersectionObserver
 * - Click-to-navigate from sidebar
 *
 * Note: 3D scene integration commented out - requires Scene3DComponent migration
 */
@Component({
  selector: 'app-value-propositions-section',
  imports: [CommonModule, ScrollAnimationDirective, SectionStickyDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      sectionSticky
      [stickyRootMargin]="'-300px'"
      class="relative bg-gradient-to-b from-gray-900 to-black text-white"
    >
      <!-- Sidebar - Sticky only when section is in viewport -->
      <nav class="section-sticky-target left-8 top-32 z-20 hidden lg:block">
        <div class="space-y-3">
          @for (valueProposition of valuePropositions; track $index) {
          <button
            (click)="scrollToLibrary($index)"
            [class]="getSidebarItemClass($index)"
            class="group relative flex items-center gap-4 transition-all duration-300"
          >
            <!-- Number Badge -->
            <div
              class="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300"
              [class.bg-accent-primary]="activeIndex() === $index"
              [class.text-white]="activeIndex() === $index"
              [class.bg-gray-800]="activeIndex() !== $index"
              [class.text-gray-500]="activeIndex() !== $index"
              [class.ring-2]="activeIndex() === $index"
              [class.ring-accent-primary]="activeIndex() === $index"
            >
              <span class="text-xs font-bold">{{
                ($index + 1).toString().padStart(2, '0')
              }}</span>
            </div>

            <!-- Active Indicator Bar (Left edge) -->
            @if (activeIndex() === $index) {
            <div
              class="absolute -left-6 w-1 h-10 bg-accent-primary rounded-r-full"
            ></div>
            }
          </button>
          }
        </div>
      </nav>

      <!-- Main Content Area with left margin for sidebar -->
      <div class="lg:ml-32 pl-8 pr-8">
        @for (valueProposition of valuePropositions; track $index) {
        <article
          [id]="'library-' + $index"
          class="min-h-screen flex items-center py-16"
          [class.border-b]="$index < valuePropositions.length - 1"
          [class.border-gray-800]="$index < valuePropositions.length - 1"
        >
          <!-- Two-column layout: Placeholder (left) + Content (right) -->
          <div class="grid lg:grid-cols-2 gap-12 w-full max-w-7xl mx-auto">
            <!-- LEFT: 3D Scene Placeholder -->
            <div
              class="flex items-center justify-center bg-gray-800/30 rounded-2xl border border-gray-700/50 min-h-[500px]"
            >
              <div class="text-center text-gray-600 p-8">
                <div
                  class="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 flex items-center justify-center"
                >
                  <span class="text-4xl">🎯</span>
                </div>
                <p class="text-sm font-semibold text-gray-500 uppercase">
                  {{
                    valueProposition.packageName.replace('@hive-academy/', '')
                  }}
                </p>
                <p class="text-xs text-gray-600 mt-2">3D Scene Coming Soon</p>
              </div>
            </div>

            <!-- RIGHT: Content -->
            <div class="flex flex-col justify-center">
              <!-- Section Title -->
              <div
                class="mb-6"
                scrollAnimation
                [scrollConfig]="{
                  animation: 'fadeIn',
                  start: 'top 80%',
                  duration: 0.6,
                  once: false
                }"
              >
                <div class="flex items-center gap-3 mb-3">
                  <span class="text-2xl font-bold text-accent-primary/60">
                    {{ ($index + 1).toString().padStart(2, '0') }}
                  </span>
                  <div
                    class="h-px flex-1 bg-gradient-to-r from-accent-primary/30 to-transparent"
                  ></div>
                </div>
                <h3
                  class="text-xs font-mono text-accent-primary/80 uppercase tracking-wide"
                >
                  {{
                    valueProposition.packageName.replace('@hive-academy/', '')
                  }}
                </h3>
              </div>

              <!-- Business Headline -->
              <h2
                class="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
                scrollAnimation
                [scrollConfig]="{
                  animation: 'slideUp',
                  start: 'top 75%',
                  duration: 0.8,
                  once: false
                }"
              >
                {{ valueProposition.businessHeadline }}
              </h2>

              <!-- Lesson/Feature Count Badge -->
              <div
                class="flex items-center gap-2 text-xs text-gray-400 mb-6"
                scrollAnimation
                [scrollConfig]="{
                  animation: 'fadeIn',
                  start: 'top 75%',
                  duration: 0.6,
                  delay: 0.2,
                  once: false
                }"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span
                  >{{ valueProposition.capabilities.length }} key
                  capabilities</span
                >
              </div>

              <!-- Description/Solution -->
              <p
                class="text-sm text-gray-300 leading-relaxed mb-6"
                scrollAnimation
                [scrollConfig]="{
                  animation: 'fadeIn',
                  start: 'top 70%',
                  duration: 0.8,
                  delay: 0.3,
                  once: false
                }"
              >
                {{ valueProposition.solution }}
              </p>

              <!-- Capabilities List (Styled like lessons) -->
              <div
                class="space-y-2 mb-8"
                scrollAnimation
                [scrollConfig]="{
                  animation: 'slideUp',
                  start: 'top 75%',
                  duration: 0.6,
                  delay: 0.4,
                  once: false
                }"
              >
                @for (capability of valueProposition.capabilities; track
                capability; let capIdx = $index) {
                <div
                  class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/30 border border-gray-700/30 hover:border-accent-primary/30 transition-colors group"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-accent-primary/60 text-xs font-mono">
                      {{ (capIdx + 1).toString().padStart(2, '0') }}
                    </span>
                    <span
                      class="text-sm text-gray-200 group-hover:text-white transition-colors"
                    >
                      {{ capability }}
                    </span>
                  </div>
                  <span class="text-xs text-gray-600">Feature</span>
                </div>
                }
              </div>

              <!-- Metric Badge -->
              <div
                class="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 rounded-xl border border-accent-primary/30"
                scrollAnimation
                [scrollConfig]="{
                  animation: 'scaleIn',
                  start: 'top 80%',
                  duration: 0.6,
                  delay: 0.6,
                  ease: 'back.out',
                  once: false
                }"
              >
                <div
                  class="text-3xl font-bold bg-gradient-to-br from-accent-primary to-accent-secondary bg-clip-text text-transparent"
                >
                  {{ valueProposition.metricValue }}
                </div>
                <div>
                  <div class="text-sm font-bold text-white">
                    {{ valueProposition.metricLabel }}
                  </div>
                  <div class="text-xs text-gray-500">
                    vs traditional approach
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
        }
      </div>
    </section>
  `,
  styles: [
    `
      /* Sidebar is hidden by default */
      .section-sticky-target {
        position: absolute !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.3s ease !important;
      }

      /* When section is in viewport, sidebar becomes fixed and visible */
      section[data-section-in-view='true'] .section-sticky-target,
      section.section-in-view .section-sticky-target {
        position: fixed !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
    `,
  ],
})
export class ValuePropositionsSectionComponent implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  // Active section tracking
  public readonly activeIndex = signal(0);
  // Scroll progress within active section (0-1)
  public readonly scrollProgress = signal(0);

  private observer?: IntersectionObserver;

  public ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.setupIntersectionObserver();
      this.setupScrollListener();
    }
  }

  public ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  /**
   * Setup scroll listener for progress tracking
   */
  private setupScrollListener(): void {
    const onScroll = (): void => {
      const activeElement = this.document.getElementById(
        `library-${this.activeIndex()}`
      );
      if (!activeElement) return;

      const rect = activeElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const sectionHeight = rect.height;
      const scrolledIntoView = viewportHeight - rect.top;
      const totalScrollDistance = sectionHeight + viewportHeight;

      const progress = Math.max(
        0,
        Math.min(1, scrolledIntoView / totalScrollDistance)
      );

      this.scrollProgress.set(progress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
    });
  }

  /**
   * Setup IntersectionObserver to track which library is in view
   */
  private setupIntersectionObserver(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0,
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const index = parseInt(id.replace('library-', ''), 10);
          if (!isNaN(index)) {
            this.activeIndex.set(index);
          }
        }
      });
    }, options);

    // Observe all library sections
    setTimeout(() => {
      const sections =
        this.elementRef.nativeElement.querySelectorAll('[id^="library-"]');
      sections.forEach((section: Element) => {
        this.observer?.observe(section);
      });
    }, 100);
  }

  /**
   * Scroll to specific library section
   */
  public scrollToLibrary(index: number): void {
    const element = this.document.getElementById(`library-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Get sidebar item classes based on active state
   */
  public getSidebarItemClass(index: number): string {
    return this.activeIndex() === index ? 'active' : '';
  }

  /**
   * All 10 Value Propositions
   * Reference: research-report.md (TASK_2025_026), design-handoff.md:844-923
   */
  public readonly valuePropositions: ValueProposition[] = [
    {
      packageName: '@hive-academy/nestjs-chromadb',
      businessHeadline: 'Build RAG Applications in Minutes',
      painPoint:
        '50+ lines of manual ChromaDB client setup, embedding generation, error handling, retry logic, tenant isolation...',
      solution:
        'TypeORM-style repository pattern with automatic embeddings, tenant isolation, and caching via decorators',
      capabilities: [
        'Multi-provider embeddings (OpenAI, Cohere, local)',
        'Multi-tenant database-per-tenant isolation',
        'Intelligent caching with @Cached decorator',
        'Auto-chunking for large documents',
      ],
      metricValue: '90%',
      metricLabel: 'Less Code',
    },
    {
      packageName: '@hive-academy/nestjs-neo4j',
      businessHeadline: 'Graph Queries Without Cypher Boilerplate',
      painPoint:
        'Raw Cypher queries with manual parameter binding, connection pooling, and transaction management for every graph operation',
      solution:
        'Specialized repository pattern for graphs with type-safe query builder and automatic relationship mapping',
      capabilities: [
        'GraphRepository pattern for nodes and relationships',
        'Type-safe Cypher query builder',
        'Multi-tenant graph isolation',
        'Built-in dependency injection',
      ],
      metricValue: '85%',
      metricLabel: 'Less Boilerplate',
    },
    {
      packageName: '@hive-academy/langgraph-memory',
      businessHeadline: 'Contextual AI Without Memory Management Hell',
      painPoint:
        'Manual context retrieval from multiple sources, token limit calculations, relevance scoring, and memory persistence',
      solution:
        'Unified memory facade coordinating vector search, graph relationships, and conversation history with automatic context assembly',
      capabilities: [
        'Auto-context assembly from ChromaDB + Neo4j + history',
        'Token-aware context windowing',
        'Relevance scoring and pruning',
        'Multi-session memory isolation',
      ],
      metricValue: '75%',
      metricLabel: 'Faster Context Retrieval',
    },
    {
      packageName: '@hive-academy/langgraph-functional-api',
      businessHeadline: 'Declarative Workflows with NestJS Decorators',
      painPoint:
        'Manual StateGraph construction with verbose addNode, addEdge, and compile calls for every workflow definition',
      solution:
        'NestJS-style decorators (@Workflow, @Node, @Edge) that compile to executable StateGraphs via metadata processing',
      capabilities: [
        'Task-based workflows with @Entrypoint/@Task',
        'Node-based graphs with @Node/@Edge',
        'Automatic metadata compilation',
        'Full TypeScript type safety',
      ],
      metricValue: '70%',
      metricLabel: 'Less Workflow Code',
    },
    {
      packageName: '@hive-academy/langgraph-multi-agent',
      businessHeadline: 'Agent Coordination Without Manual Orchestration',
      painPoint:
        'Manual agent message routing, state aggregation, retry logic, and error recovery for every multi-agent workflow',
      solution:
        '5 declarative topology patterns (Supervisor, Swarm, Hierarchical, Sequential, Network) with 16+ specialized coordination services',
      capabilities: [
        'LLM-powered supervisor routing',
        'Autonomous swarm collaboration',
        'Command pattern for retry/skip/error recovery',
        'HITL integration for human approval',
      ],
      metricValue: '65%',
      metricLabel: 'Less Coordination Code',
    },
    {
      packageName: '@hive-academy/langgraph-platform',
      businessHeadline: 'LangGraph Cloud Integration Without HTTP Boilerplate',
      painPoint:
        'Manual HTTP client setup for LangGraph Platform API with retry logic, webhook handling, and thread management',
      solution:
        'Production-ready Platform client with automatic retry policies, hybrid local/cloud deployment, and managed state persistence',
      capabilities: [
        'Full Platform API support (assistants, threads, runs)',
        'Exponential backoff retry policy',
        'Webhook integration for async workflows',
        'Cron-scheduled workflow execution',
      ],
      metricValue: '75%',
      metricLabel: 'Less Platform Integration Code',
    },
    {
      packageName: '@hive-academy/langgraph-time-travel',
      businessHeadline:
        'Production Debugging with Temporal Workflow Navigation',
      painPoint:
        'No way to replay production workflows, branch timelines, or modify state for debugging without affecting live users',
      solution:
        'Time-travel debugging system with workflow replay, branch management, and state restoration for production issue investigation',
      capabilities: [
        'Replay workflows from any checkpoint',
        'Create alternate timelines for A/B testing',
        'Modify state for debugging sessions',
        'Production-safe debugging mode',
      ],
      metricValue: '90%',
      metricLabel: 'Faster Production Debugging',
    },
    {
      packageName: '@hive-academy/langgraph-monitoring',
      businessHeadline:
        'Ecosystem-Wide Observability Without Manual Instrumentation',
      painPoint:
        'Manual metric collection, alerting setup, dashboard creation, and performance tracking for each workflow and service',
      solution:
        'Facade pattern coordinating 5 monitoring services with automatic Prometheus instrumentation across all 13 libraries',
      capabilities: [
        'Automatic instrumentation of all ecosystem libraries',
        'Prometheus backend for production metrics',
        'Rule-based alerting with webhook/email/Slack',
        'Performance tracking for latency and throughput',
      ],
      metricValue: '85%',
      metricLabel: 'Less Monitoring Code',
    },
    {
      packageName: '@hive-academy/langgraph-hitl',
      businessHeadline:
        'Enterprise Approval Workflows with ML Confidence Scoring',
      painPoint:
        'Manual approval request creation, timeout management, notification sending, and confidence scoring for every human decision point',
      solution:
        '16 specialized services with ML-powered confidence scoring reducing approval overhead by 60% through intelligent auto-approval',
      capabilities: [
        'ML confidence scoring for auto-approval',
        'Multi-level approval chains',
        'Timeout management with fallback strategies',
        'Audit logging of all approval decisions',
      ],
      metricValue: '60%',
      metricLabel: 'Less Approval Overhead',
    },
    {
      packageName: '@hive-academy/langgraph-streaming',
      businessHeadline:
        'Real-Time Workflow Streaming Without WebSocket Complexity',
      painPoint:
        'Manual WebSocket gateway setup, stream coordination, backpressure handling, and event broadcasting for every real-time workflow',
      solution:
        'WorkflowStreamingOrchestrator replacing 75+ lines of manual orchestration with production-ready WebSocket gateway and RxJS observables',
      capabilities: [
        'One-liner workflow execution + streaming setup',
        'Token/event/progress streaming decorators',
        'Production WebSocket with auth and rate limiting',
        'Automatic backpressure and reconnection',
      ],
      metricValue: '75%',
      metricLabel: 'Less Streaming Code',
    },
  ];
}
