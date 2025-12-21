/**
 * ValueProposition Interface
 *
 * Represents a value proposition for showcase sections.
 * Used by ValuePropositionsSectionComponent to display library features.
 */
export interface ValueProposition {
  /** Package name (e.g., '@hive-academy/nestjs-chromadb') */
  packageName: string;
  /** Business headline (e.g., 'Build RAG Applications in Minutes') */
  businessHeadline: string;
  /** Pain point description */
  painPoint: string;
  /** Solution description */
  solution: string;
  /** List of capabilities */
  capabilities: string[];
  /** Metric value (e.g., '90%') */
  metricValue: string;
  /** Metric label (e.g., 'Less Code') */
  metricLabel: string;
}
