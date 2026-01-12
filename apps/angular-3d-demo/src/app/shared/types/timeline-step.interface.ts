/**
 * TimelineStep Interface
 *
 * Represents a step in the hijacked scroll timeline sections.
 * Used by ChromaDB and Neo4j section components for displaying
 * code walkthroughs and feature demonstrations.
 */
export interface TimelineStep {
  /** Unique identifier for the step */
  id: string;
  /** Step number (1-indexed) */
  step: number;
  /** Title displayed for the step */
  title: string;
  /** Description of what the step demonstrates */
  description: string;
  /** Code content to display */
  code: string;
  /** Language for syntax highlighting */
  language: 'typescript' | 'bash' | 'image';
  /** Layout position of the step content */
  layout: 'left' | 'right' | 'center';
  /** Optional notes displayed below the step */
  notes?: string[];
}
