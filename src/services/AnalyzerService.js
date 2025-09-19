/**
 * Temporary placeholder for AnalyzerService
 * Will be implemented in stage 3
 */
class AnalyzerService {
  constructor() {
    this.colorScheme = this.initializeColorScheme();
  }

  async analyze(program) {
    // Placeholder implementation
    return {
      success: true,
      analysis: {
        program_intent: "network_troubleshooting",
        confidence: 0.95,
        procedures: program.procedures.map((proc) => ({
          id: proc.id,
          intent: "diagnostic",
          entities: [],
          relationships: [],
          steps: [],
        })),
        global_entities: [],
        memory_requirements: {
          variables: [],
          estimated_size: "1KB",
          persistence: "session",
        },
        execution_graph: {
          nodes: program.procedures.map((p) => p.id),
          edges: [],
        },
      },
    };
  }

  generateAnnotations(markdown, analysis) {
    // Simple placeholder - just return original markdown with basic annotation
    const annotated = `<span class="assign">assign: sample_variable</span>\n${markdown}`;
    return annotated;
  }

  extractEntities(program) {
    return [];
  }

  getColorScheme() {
    return this.colorScheme;
  }

  initializeColorScheme() {
    return {
      assign: "#4CAF50", // Green
      set_memo: "#FF9800", // Orange
      var: "#2196F3", // Blue
      loop: "#9C27B0", // Purple
      condition: "#FFC107", // Amber
      action: "#F44336", // Red
      analysis: "#607D8B", // Blue Grey
    };
  }
}

module.exports = AnalyzerService;
