const { generateId } = require("../utils/helpers");

/**
 * AnalyzerService - Stage 3: Semantic Analysis Engine
 * Performs intent recognition, entity extraction, dependency analysis, and memory planning
 */
class AnalyzerService {
  constructor() {
    this.colorScheme = this.initializeColorScheme();
    this.intentPatterns = this.initializeIntentPatterns();
    this.entityPatterns = this.initializeEntityPatterns();
    this.relationshipTypes = this.initializeRelationshipTypes();
  }

  /**
   * Main analysis method - performs comprehensive semantic analysis
   * @param {Object} program - Transpiled program from Stage 2
   * @param {Object} options - Analysis options
   * @returns {Object} - Analysis results or errors
   */
  async analyze(program, options = {}) {
    try {
      const {
        intent_recognition = true,
        entity_extraction = true,
        dependency_analysis = true,
        memory_planning = true,
        generate_graph = true,
      } = options;

      // 1. Program-level intent recognition
      const programIntent = intent_recognition
        ? this.recognizeProgramIntent(program)
        : { intent: "unknown", confidence: 0.5 };

      // 2. Procedure-level analysis
      const procedureAnalysis = [];
      for (const procedure of program.procedures) {
        const procAnalysis = await this.analyzeProcedure(procedure, {
          intent_recognition,
          entity_extraction,
          dependency_analysis,
        });
        procedureAnalysis.push(procAnalysis);
      }

      // 3. Global entity extraction
      const globalEntities = entity_extraction
        ? this.extractGlobalEntities(program, procedureAnalysis)
        : [];

      // 4. Memory requirements planning
      const memoryRequirements = memory_planning
        ? this.planMemoryRequirements(program, procedureAnalysis)
        : { variables: [], estimated_size: "unknown", persistence: "session" };

      // 5. Execution graph generation
      const executionGraph = generate_graph
        ? this.generateExecutionGraph(program, procedureAnalysis)
        : { nodes: [], edges: [] };

      // 6. Cross-procedure relationship analysis
      const relationships = dependency_analysis
        ? this.analyzeGlobalRelationships(procedureAnalysis)
        : [];

      const analysis = {
        program_intent: programIntent.intent,
        confidence: programIntent.confidence,
        intent_details: programIntent.details,
        procedures: procedureAnalysis,
        global_entities: globalEntities,
        global_relationships: relationships,
        memory_requirements: memoryRequirements,
        execution_graph: executionGraph,
        optimization_suggestions: this.generateOptimizationSuggestions(
          program,
          procedureAnalysis
        ),
        risk_assessment: this.assessRisks(program, procedureAnalysis),
      };

      return {
        success: true,
        analysis: analysis,
        metadata: {
          analyzed_at: new Date().toISOString(),
          procedures_analyzed: procedureAnalysis.length,
          entities_found: globalEntities.length,
          relationships_found: relationships.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            type: "analysis_error",
            message: `Semantic analysis failed: ${error.message}`,
            details: error.stack,
          },
        ],
      };
    }
  }

  /**
   * Analyze individual procedure for intent, entities, and relationships
   * @param {Object} procedure - Procedure object
   * @param {Object} options - Analysis options
   * @returns {Object} - Procedure analysis
   */
  async analyzeProcedure(procedure, options = {}) {
    const {
      intent_recognition = true,
      entity_extraction = true,
      dependency_analysis = true,
    } = options;

    const procedureAnalysis = {
      id: procedure.id,
      name: procedure.name,
      intent: intent_recognition
        ? this.recognizeProcedureIntent(procedure)
        : "unknown",
      entities: entity_extraction
        ? this.extractProcedureEntities(procedure)
        : [],
      relationships: dependency_analysis
        ? this.analyzeProcedureRelationships(procedure)
        : [],
      steps: [],
      risk_level: this.assessProcedureRisk(procedure),
      estimated_duration: this.estimateProcedureDuration(procedure),
    };

    // Analyze each step
    for (const step of procedure.steps) {
      const stepAnalysis = this.analyzeStep(step, procedure);
      procedureAnalysis.steps.push(stepAnalysis);
    }

    return procedureAnalysis;
  }

  /**
   * Recognize program-level intent from procedures and tools
   * @param {Object} program - Program object
   * @returns {Object} - Intent recognition result
   */
  recognizeProgramIntent(program) {
    const toolCategories = this.categorizeTools(program.tools);
    const procedureIntents = program.procedures.map((proc) =>
      this.recognizeProcedureIntent(proc)
    );

    // Scoring system for different intent types
    const intentScores = {
      network_troubleshooting: 0,
      system_diagnostics: 0,
      security_analysis: 0,
      performance_tuning: 0,
      configuration_management: 0,
      data_recovery: 0,
      general_maintenance: 0,
    };

    // Score based on tools used
    if (toolCategories.network > 0) intentScores.network_troubleshooting += 0.3;
    if (toolCategories.system > 0) intentScores.system_diagnostics += 0.2;
    if (toolCategories.security > 0) intentScores.security_analysis += 0.2;

    // Score based on procedure intents
    procedureIntents.forEach((intent) => {
      if (intentScores[intent]) {
        intentScores[intent] += 0.1;
      }
    });

    // Score based on program name and description
    const programText = (
      program.name +
      " " +
      (program.description || "")
    ).toLowerCase();
    Object.keys(this.intentPatterns).forEach((intent) => {
      this.intentPatterns[intent].keywords.forEach((keyword) => {
        if (programText.includes(keyword)) {
          intentScores[intent] += 0.1;
        }
      });
    });

    // Find highest scoring intent
    const topIntent = Object.keys(intentScores).reduce((a, b) =>
      intentScores[a] > intentScores[b] ? a : b
    );

    return {
      intent: topIntent,
      confidence: Math.min(intentScores[topIntent], 1.0),
      details: {
        tool_categories: toolCategories,
        procedure_intents: procedureIntents,
        scores: intentScores,
      },
    };
  }

  /**
   * Recognize intent of individual procedure
   * @param {Object} procedure - Procedure object
   * @returns {string} - Recognized intent
   */
  recognizeProcedureIntent(procedure) {
    const text = (
      procedure.name +
      " " +
      procedure.steps.map((s) => s.description || "").join(" ")
    ).toLowerCase();

    let bestMatch = "unknown";
    let highestScore = 0;

    Object.keys(this.intentPatterns).forEach((intent) => {
      let score = 0;
      this.intentPatterns[intent].keywords.forEach((keyword) => {
        if (text.includes(keyword)) {
          score += 1;
        }
      });

      if (score > highestScore) {
        highestScore = score;
        bestMatch = intent;
      }
    });

    return bestMatch;
  }

  /**
   * Extract entities from procedure (variables, files, services, etc.)
   * @param {Object} procedure - Procedure object
   * @returns {Array} - Extracted entities
   */
  extractProcedureEntities(procedure) {
    const entities = [];
    const text =
      procedure.name +
      " " +
      procedure.steps.map((s) => s.description || "").join(" ");

    // Extract different types of entities
    Object.keys(this.entityPatterns).forEach((entityType) => {
      const pattern = this.entityPatterns[entityType];
      const matches = text.match(pattern.regex) || [];

      matches.forEach((match) => {
        entities.push({
          id: generateId(),
          type: entityType,
          value: match,
          confidence: pattern.confidence,
          source: procedure.id,
        });
      });
    });

    // Extract entities from step parameters
    procedure.steps.forEach((step) => {
      if (step.parameters && step.parameters.args) {
        step.parameters.args.forEach((arg) => {
          if (this.isEntity(arg)) {
            entities.push({
              id: generateId(),
              type: this.classifyEntity(arg),
              value: arg,
              confidence: 0.8,
              source: step.id,
            });
          }
        });
      }
    });

    return entities;
  }

  /**
   * Analyze relationships between steps in a procedure
   * @param {Object} procedure - Procedure object
   * @returns {Array} - Relationships
   */
  analyzeProcedureRelationships(procedure) {
    const relationships = [];

    for (let i = 0; i < procedure.steps.length; i++) {
      const step = procedure.steps[i];

      // Sequential dependency
      if (i > 0) {
        relationships.push({
          type: "sequential",
          source: procedure.steps[i - 1].id,
          target: step.id,
          description: "Sequential execution dependency",
        });
      }

      // Data dependency (output of one step used in another)
      if (step.assign_to) {
        for (let j = i + 1; j < procedure.steps.length; j++) {
          const laterStep = procedure.steps[j];
          if (this.stepUsesVariable(laterStep, step.assign_to)) {
            relationships.push({
              type: "data_dependency",
              source: step.id,
              target: laterStep.id,
              variable: step.assign_to,
              description: `Step depends on variable ${step.assign_to}`,
            });
          }
        }
      }

      // Conditional dependency
      if (step.type === "conditional") {
        if (step.true_branch) {
          relationships.push({
            type: "conditional",
            source: step.id,
            target: step.true_branch.id || "next_step",
            condition: "true",
            description: "Conditional execution path",
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Analyze individual step for semantic information
   * @param {Object} step - Step object
   * @param {Object} procedure - Parent procedure
   * @returns {Object} - Step analysis
   */
  analyzeStep(step, procedure) {
    return {
      id: step.id,
      type: step.type,
      intent: this.recognizeStepIntent(step),
      entities: this.extractStepEntities(step),
      risk_factors: this.identifyStepRisks(step),
      dependencies: this.identifyStepDependencies(step, procedure),
      estimated_duration: this.estimateStepDuration(step),
      rollback_possible: this.canRollback(step),
    };
  }

  /**
   * Extract global entities that span multiple procedures
   * @param {Object} program - Program object
   * @param {Array} procedureAnalysis - Analyzed procedures
   * @returns {Array} - Global entities
   */
  extractGlobalEntities(program, procedureAnalysis) {
    const entityMap = new Map();

    // Collect all entities from procedures
    procedureAnalysis.forEach((proc) => {
      proc.entities.forEach((entity) => {
        const key = `${entity.type}:${entity.value}`;
        if (entityMap.has(key)) {
          entityMap.get(key).sources.push(entity.source);
          entityMap.get(key).confidence = Math.max(
            entityMap.get(key).confidence,
            entity.confidence
          );
        } else {
          entityMap.set(key, {
            ...entity,
            sources: [entity.source],
            scope: "global",
          });
        }
      });
    });

    return Array.from(entityMap.values());
  }

  /**
   * Plan memory requirements for program execution
   * @param {Object} program - Program object
   * @param {Array} procedureAnalysis - Analyzed procedures
   * @returns {Object} - Memory requirements
   */
  planMemoryRequirements(program, procedureAnalysis) {
    const variables = [];
    let estimatedSize = 0;

    // Collect all variables from procedure steps
    procedureAnalysis.forEach((proc) => {
      proc.steps.forEach((stepAnalysis) => {
        stepAnalysis.entities.forEach((entity) => {
          if (entity.type === "variable") {
            variables.push({
              name: entity.value,
              type: this.inferVariableType(entity),
              size: this.estimateVariableSize(entity),
              scope: proc.id,
              source: stepAnalysis.id,
            });
            estimatedSize += this.estimateVariableSize(entity);
          }
        });
      });
    });

    // Add global memory from program
    Object.keys(program.global_memory || {}).forEach((key) => {
      variables.push({
        name: key,
        type: "global",
        size: 100, // Default size
        scope: "global",
        source: "program",
      });
      estimatedSize += 100;
    });

    return {
      variables: variables,
      estimated_size: this.formatSize(estimatedSize),
      persistence: "session",
      peak_usage: this.estimatePeakMemoryUsage(variables),
    };
  }

  /**
   * Generate execution graph showing procedure and step dependencies
   * @param {Object} program - Program object
   * @param {Array} procedureAnalysis - Analyzed procedures
   * @returns {Object} - Execution graph
   */
  generateExecutionGraph(program, procedureAnalysis) {
    const nodes = [];
    const edges = [];

    // Add procedure nodes
    procedureAnalysis.forEach((proc) => {
      nodes.push({
        id: proc.id,
        type: "procedure",
        label: proc.name,
        intent: proc.intent,
        risk_level: proc.risk_level,
      });

      // Add step nodes
      proc.steps.forEach((step) => {
        nodes.push({
          id: step.id,
          type: "step",
          label: step.type,
          parent: proc.id,
          intent: step.intent,
          risk_factors: step.risk_factors,
        });
      });
    });

    // Add edges from relationships
    procedureAnalysis.forEach((proc) => {
      proc.relationships.forEach((rel) => {
        edges.push({
          source: rel.source,
          target: rel.target,
          type: rel.type,
          label: rel.description,
        });
      });
    });

    // Add procedure-level dependencies from execution order
    for (let i = 1; i < program.execution_order.length; i++) {
      edges.push({
        source: program.execution_order[i - 1],
        target: program.execution_order[i],
        type: "execution_order",
        label: "Sequential execution",
      });
    }

    return {
      nodes: nodes,
      edges: edges,
      layout: "hierarchical",
    };
  }

  /**
   * Generate annotations for markdown with semantic highlighting
   * @param {string} markdown - Original markdown
   * @param {Object} analysis - Analysis results
   * @returns {string} - Annotated markdown
   */
  generateAnnotations(markdown, analysis) {
    let annotated = markdown;

    // Annotate entities
    analysis.global_entities.forEach((entity) => {
      const pattern = new RegExp(
        `\\b${this.escapeRegex(entity.value)}\\b`,
        "g"
      );
      const annotation = `<span class="${entity.type}" title="${entity.type}: ${entity.confidence}">${entity.value}</span>`;
      annotated = annotated.replace(pattern, annotation);
    });

    // Annotate commands
    const commandPattern = /`([^`]+)`/g;
    annotated = annotated.replace(commandPattern, (match, command) => {
      return `<span class="command" title="Command: ${command}">${match}</span>`;
    });

    // Annotate conditions
    const conditionPattern = /\*\*(If .+?):\*\*/g;
    annotated = annotated.replace(conditionPattern, (match, condition) => {
      return `<span class="condition" title="Condition">${match}</span>`;
    });

    return annotated;
  }

  /**
   * Extract entities from program
   * @param {Object} program - Program object
   * @returns {Array} - Extracted entities
   */
  extractEntities(program) {
    const entities = [];

    program.procedures.forEach((procedure) => {
      const procEntities = this.extractProcedureEntities(procedure);
      entities.push(...procEntities);
    });

    return entities;
  }

  /**
   * Get color scheme for UI highlighting
   * @returns {Object} - Color scheme
   */
  getColorScheme() {
    return this.colorScheme;
  }

  // ==================== SUPPORTING METHODS ====================

  /**
   * Categorize tools by their primary function
   * @param {Array} tools - Array of tool names
   * @returns {Object} - Tool categories with counts
   */
  categorizeTools(tools) {
    const categories = {
      network: 0,
      system: 0,
      file: 0,
      text: 0,
      security: 0,
    };

    const toolCategories = {
      network: [
        "ip",
        "ping",
        "nslookup",
        "dig",
        "curl",
        "wget",
        "netstat",
        "ss",
        "iptables",
      ],
      system: ["systemctl", "ps", "top", "htop", "free", "df", "lsof", "mount"],
      file: ["ls", "cat", "less", "head", "tail", "find", "chmod", "chown"],
      text: ["grep", "awk", "sed", "sort", "uniq", "wc"],
      security: ["sudo", "ssh", "scp", "gpg", "openssl"],
    };

    tools.forEach((tool) => {
      Object.keys(toolCategories).forEach((category) => {
        if (toolCategories[category].includes(tool)) {
          categories[category]++;
        }
      });
    });

    return categories;
  }

  /**
   * Check if step uses a specific variable
   * @param {Object} step - Step object
   * @param {string} variable - Variable name
   * @returns {boolean} - True if step uses variable
   */
  stepUsesVariable(step, variable) {
    const stepText = JSON.stringify(step).toLowerCase();
    return (
      stepText.includes(`$${variable}`) ||
      stepText.includes(variable.toLowerCase())
    );
  }

  /**
   * Recognize intent of individual step
   * @param {Object} step - Step object
   * @returns {string} - Step intent
   */
  recognizeStepIntent(step) {
    const stepText = (step.description || "").toLowerCase();

    if (step.type === "command") {
      if (step.tool === "ip") return "network_diagnosis";
      if (step.tool === "ping") return "connectivity_test";
      if (step.tool === "nslookup") return "dns_resolution";
      if (step.tool === "systemctl") return "service_management";
      return "command_execution";
    }

    if (step.type === "conditional") return "condition_check";
    if (step.type === "assignment") return "data_storage";
    if (step.type === "choice") return "user_interaction";

    return "unknown";
  }

  /**
   * Extract entities from individual step
   * @param {Object} step - Step object
   * @returns {Array} - Step entities
   */
  extractStepEntities(step) {
    const entities = [];
    const text = step.description || "";

    // Extract entities using patterns
    Object.keys(this.entityPatterns).forEach((entityType) => {
      const pattern = this.entityPatterns[entityType];
      const matches = text.match(pattern.regex) || [];

      matches.forEach((match) => {
        entities.push({
          id: generateId(),
          type: entityType,
          value: match,
          confidence: pattern.confidence,
          source: step.id,
        });
      });
    });

    return entities;
  }

  /**
   * Identify risk factors for a step
   * @param {Object} step - Step object
   * @returns {Array} - Risk factors
   */
  identifyStepRisks(step) {
    const risks = [];

    if (step.type === "command") {
      // Check for potentially dangerous commands
      const dangerousCommands = ["rm", "del", "format", "fdisk", "mkfs"];
      if (dangerousCommands.some((cmd) => step.command.includes(cmd))) {
        risks.push({
          type: "data_loss",
          level: "high",
          description: "Command may cause data loss",
        });
      }

      // Check for network-affecting commands
      const networkCommands = ["iptables", "ip route", "ifconfig"];
      if (networkCommands.some((cmd) => step.command.includes(cmd))) {
        risks.push({
          type: "network_disruption",
          level: "medium",
          description: "Command may affect network connectivity",
        });
      }

      // Check for service-affecting commands
      if (
        step.command.includes("systemctl stop") ||
        step.command.includes("service stop")
      ) {
        risks.push({
          type: "service_disruption",
          level: "medium",
          description: "Command will stop a service",
        });
      }
    }

    return risks;
  }

  /**
   * Identify dependencies for a step
   * @param {Object} step - Step object
   * @param {Object} procedure - Parent procedure
   * @returns {Array} - Dependencies
   */
  identifyStepDependencies(step, procedure) {
    const dependencies = [];

    // Check for tool dependencies
    if (step.tool) {
      dependencies.push({
        type: "tool",
        value: step.tool,
        description: `Requires ${step.tool} tool to be available`,
      });
    }

    // Check for variable dependencies
    if (step.description) {
      const variableMatches = step.description.match(/\$(\w+)/g) || [];
      variableMatches.forEach((match) => {
        dependencies.push({
          type: "variable",
          value: match.substring(1),
          description: `Requires variable ${match}`,
        });
      });
    }

    // Check for file dependencies
    if (step.parameters && step.parameters.args) {
      step.parameters.args.forEach((arg) => {
        if (arg.startsWith("/") || arg.includes(".")) {
          dependencies.push({
            type: "file",
            value: arg,
            description: `Requires access to file ${arg}`,
          });
        }
      });
    }

    return dependencies;
  }

  /**
   * Estimate duration for a step
   * @param {Object} step - Step object
   * @returns {number} - Estimated duration in seconds
   */
  estimateStepDuration(step) {
    const baseDurations = {
      command: 2,
      conditional: 1,
      assignment: 0.5,
      choice: 10, // User interaction time
      analysis: 1,
      note: 0.1,
    };

    let duration = baseDurations[step.type] || 1;

    // Adjust based on specific tools
    if (step.tool === "ping") duration = 5;
    if (step.tool === "nslookup") duration = 3;
    if (step.tool === "curl") duration = 4;

    return duration;
  }

  /**
   * Check if step can be rolled back
   * @param {Object} step - Step object
   * @returns {boolean} - True if rollback is possible
   */
  canRollback(step) {
    if (step.type !== "command") return true;

    // Commands that can't be easily rolled back
    const irreversibleCommands = ["rm", "del", "format", "mkfs", "dd"];
    return !irreversibleCommands.some((cmd) => step.command.includes(cmd));
  }

  /**
   * Assess risk level for entire procedure
   * @param {Object} procedure - Procedure object
   * @returns {string} - Risk level
   */
  assessProcedureRisk(procedure) {
    const stepRisks = procedure.steps.map((step) =>
      this.identifyStepRisks(step)
    );
    const highRisks = stepRisks
      .flat()
      .filter((risk) => risk.level === "high").length;
    const mediumRisks = stepRisks
      .flat()
      .filter((risk) => risk.level === "medium").length;

    if (highRisks > 0) return "high";
    if (mediumRisks > 2) return "medium";
    return "low";
  }

  /**
   * Estimate procedure duration
   * @param {Object} procedure - Procedure object
   * @returns {number} - Estimated duration in seconds
   */
  estimateProcedureDuration(procedure) {
    return procedure.steps.reduce(
      (total, step) => total + this.estimateStepDuration(step),
      0
    );
  }

  /**
   * Check if a string represents an entity
   * @param {string} value - Value to check
   * @returns {boolean} - True if value is an entity
   */
  isEntity(value) {
    // Check if value matches any entity pattern
    return Object.values(this.entityPatterns).some((pattern) =>
      pattern.regex.test(value)
    );
  }

  /**
   * Classify entity type
   * @param {string} value - Entity value
   * @returns {string} - Entity type
   */
  classifyEntity(value) {
    for (const [type, pattern] of Object.entries(this.entityPatterns)) {
      if (pattern.regex.test(value)) {
        return type;
      }
    }
    return "unknown";
  }

  /**
   * Analyze relationships between procedures
   * @param {Array} procedureAnalysis - Analyzed procedures
   * @returns {Array} - Global relationships
   */
  analyzeGlobalRelationships(procedureAnalysis) {
    const relationships = [];

    // Find procedures that share entities
    for (let i = 0; i < procedureAnalysis.length; i++) {
      for (let j = i + 1; j < procedureAnalysis.length; j++) {
        const proc1 = procedureAnalysis[i];
        const proc2 = procedureAnalysis[j];

        const sharedEntities = proc1.entities.filter((e1) =>
          proc2.entities.some(
            (e2) => e1.value === e2.value && e1.type === e2.type
          )
        );

        if (sharedEntities.length > 0) {
          relationships.push({
            type: "shared_entities",
            source: proc1.id,
            target: proc2.id,
            entities: sharedEntities.map((e) => e.value),
            description: `Procedures share ${sharedEntities.length} entities`,
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Generate optimization suggestions
   * @param {Object} program - Program object
   * @param {Array} procedureAnalysis - Analyzed procedures
   * @returns {Array} - Optimization suggestions
   */
  generateOptimizationSuggestions(program, procedureAnalysis) {
    const suggestions = [];

    // Check for duplicate steps
    const allSteps = procedureAnalysis.flatMap((proc) => proc.steps);
    const stepCommands = allSteps
      .filter((step) => step.type === "command")
      .map((step) => step.command);
    const duplicates = stepCommands.filter(
      (cmd, index) => stepCommands.indexOf(cmd) !== index
    );

    if (duplicates.length > 0) {
      suggestions.push({
        type: "duplicate_elimination",
        severity: "medium",
        description: `Found ${duplicates.length} duplicate commands that could be consolidated`,
        affected_steps: duplicates,
      });
    }

    // Check for parallelizable procedures
    const independentProcedures = procedureAnalysis.filter(
      (proc) => proc.relationships.length === 0
    );

    if (independentProcedures.length > 1) {
      suggestions.push({
        type: "parallelization",
        severity: "low",
        description: `${independentProcedures.length} procedures could be run in parallel`,
        affected_procedures: independentProcedures.map((p) => p.id),
      });
    }

    return suggestions;
  }

  /**
   * Assess overall program risks
   * @param {Object} program - Program object
   * @param {Array} procedureAnalysis - Analyzed procedures
   * @returns {Object} - Risk assessment
   */
  assessRisks(program, procedureAnalysis) {
    const allRisks = procedureAnalysis.flatMap((proc) =>
      proc.steps.flatMap((step) => step.risk_factors || [])
    );

    const riskCounts = {
      high: allRisks.filter((r) => r.level === "high").length,
      medium: allRisks.filter((r) => r.level === "medium").length,
      low: allRisks.filter((r) => r.level === "low").length,
    };

    let overallRisk = "low";
    if (riskCounts.high > 0) overallRisk = "high";
    else if (riskCounts.medium > 3) overallRisk = "medium";

    return {
      overall_risk: overallRisk,
      risk_counts: riskCounts,
      critical_risks: allRisks.filter((r) => r.level === "high"),
      recommendations: this.generateRiskRecommendations(allRisks),
    };
  }

  /**
   * Generate risk mitigation recommendations
   * @param {Array} risks - Array of risks
   * @returns {Array} - Recommendations
   */
  generateRiskRecommendations(risks) {
    const recommendations = [];

    const dataLossRisks = risks.filter((r) => r.type === "data_loss");
    if (dataLossRisks.length > 0) {
      recommendations.push({
        type: "backup",
        priority: "high",
        description:
          "Create backup before executing commands that may cause data loss",
      });
    }

    const networkRisks = risks.filter((r) => r.type === "network_disruption");
    if (networkRisks.length > 0) {
      recommendations.push({
        type: "network_safety",
        priority: "medium",
        description:
          "Ensure alternative access method before modifying network configuration",
      });
    }

    return recommendations;
  }

  /**
   * Infer variable type from entity
   * @param {Object} entity - Entity object
   * @returns {string} - Variable type
   */
  inferVariableType(entity) {
    if (entity.value.match(/^\d+$/)) return "integer";
    if (entity.value.match(/^\d+\.\d+$/)) return "float";
    if (entity.value.match(/^(true|false)$/i)) return "boolean";
    if (entity.value.startsWith("/")) return "path";
    return "string";
  }

  /**
   * Estimate variable memory size
   * @param {Object} entity - Entity object
   * @returns {number} - Size in bytes
   */
  estimateVariableSize(entity) {
    const type = this.inferVariableType(entity);
    const sizemap = {
      integer: 8,
      float: 8,
      boolean: 1,
      path: entity.value.length * 2,
      string: entity.value.length * 2,
    };
    return sizemap[type] || 50;
  }

  /**
   * Format size in human readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} - Formatted size
   */
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  /**
   * Estimate peak memory usage
   * @param {Array} variables - Array of variables
   * @returns {string} - Peak memory estimate
   */
  estimatePeakMemoryUsage(variables) {
    const totalSize = variables.reduce((sum, v) => sum + v.size, 0);
    return this.formatSize(totalSize * 1.5); // 50% overhead
  }

  /**
   * Escape regex special characters
   * @param {string} string - String to escape
   * @returns {string} - Escaped string
   */
  /**
   * Escape regex special characters
   * @param {string} string - String to escape
   * @returns {string} - Escaped string
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // ==================== INITIALIZATION METHODS ====================

  /**
   * Initialize color scheme for UI highlighting
   * @returns {Object} - Color scheme
   */
  initializeColorScheme() {
    return {
      assign: "#4CAF50", // Green
      set_memo: "#FF9800", // Orange
      var: "#2196F3", // Blue
      loop: "#9C27B0", // Purple
      condition: "#FFC107", // Amber
      action: "#F44336", // Red
      analysis: "#607D8B", // Blue Grey
      command: "#795548", // Brown
      file_path: "#009688", // Teal
      ip_address: "#E91E63", // Pink
      service_name: "#673AB7", // Deep Purple
      variable: "#FF5722", // Deep Orange
    };
  }

  /**
   * Initialize intent recognition patterns
   * @returns {Object} - Intent patterns
   */
  initializeIntentPatterns() {
    return {
      network_troubleshooting: {
        keywords: [
          "network",
          "connectivity",
          "connection",
          "ping",
          "dns",
          "route",
          "interface",
          "ip",
        ],
        confidence: 0.8,
      },
      system_diagnostics: {
        keywords: [
          "system",
          "performance",
          "memory",
          "cpu",
          "disk",
          "process",
          "status",
          "health",
        ],
        confidence: 0.8,
      },
      security_analysis: {
        keywords: [
          "security",
          "vulnerability",
          "access",
          "permission",
          "firewall",
          "authentication",
        ],
        confidence: 0.8,
      },
      performance_tuning: {
        keywords: [
          "performance",
          "optimization",
          "tuning",
          "speed",
          "latency",
          "throughput",
        ],
        confidence: 0.7,
      },
      configuration_management: {
        keywords: [
          "config",
          "configuration",
          "setup",
          "install",
          "deploy",
          "settings",
        ],
        confidence: 0.7,
      },
      data_recovery: {
        keywords: [
          "recovery",
          "restore",
          "backup",
          "lost",
          "corrupt",
          "repair",
        ],
        confidence: 0.8,
      },
      general_maintenance: {
        keywords: [
          "maintenance",
          "cleanup",
          "update",
          "patch",
          "upgrade",
          "housekeeping",
        ],
        confidence: 0.6,
      },
    };
  }

  /**
   * Initialize entity extraction patterns
   * @returns {Object} - Entity patterns
   */
  initializeEntityPatterns() {
    return {
      ip_address: {
        regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        confidence: 0.95,
      },
      file_path: {
        regex: /(?:\/[\w.-]+)+\/?|\w+\.[\w]+/g,
        confidence: 0.8,
      },
      service_name: {
        regex: /\b(?:apache2|nginx|mysql|postgresql|redis|docker|ssh|ftp)\b/gi,
        confidence: 0.9,
      },
      interface_name: {
        regex: /\b(?:eth0|eth1|wlan0|lo|docker0|br-\w+)\b/g,
        confidence: 0.9,
      },
      domain_name: {
        regex: /\b(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b/g,
        confidence: 0.8,
      },
      port_number: {
        regex: /\b(?:port\s+)?(\d{1,5})\b/gi,
        confidence: 0.7,
      },
      variable: {
        regex: /\$(\w+)|\b[A-Z_]+\b/g,
        confidence: 0.6,
      },
      user_name: {
        regex: /\b(?:user|username):\s*(\w+)/gi,
        confidence: 0.8,
      },
      process_id: {
        regex: /\bpid\s*:?\s*(\d+)/gi,
        confidence: 0.9,
      },
      memory_size: {
        regex: /\b\d+(?:\.\d+)?\s*(?:KB|MB|GB|TB)\b/gi,
        confidence: 0.9,
      },
    };
  }

  /**
   * Initialize relationship types
   * @returns {Object} - Relationship types
   */
  initializeRelationshipTypes() {
    return {
      sequential: {
        description: "Steps must execute in order",
        strength: "strong",
      },
      data_dependency: {
        description: "Step depends on output from another step",
        strength: "strong",
      },
      conditional: {
        description: "Step execution depends on condition",
        strength: "medium",
      },
      shared_entities: {
        description: "Procedures work with same entities",
        strength: "weak",
      },
      tool_dependency: {
        description: "Step requires specific tool",
        strength: "strong",
      },
      file_dependency: {
        description: "Step requires file access",
        strength: "medium",
      },
    };
  }
}

module.exports = AnalyzerService;
