const {
  extractTroubleshootingPatterns,
  isCommand,
  extractTool,
} = require("../utils/markdownValidator");
const { generateId } = require("../utils/helpers");

/**
 * TranspilerService - Stage 2: Convert AST to LLM-optimized program format
 * Transforms parsed markdown AST into structured execution format with tool definitions
 */
class TranspilerService {
  constructor() {
    this.toolRegistry = this.initializeToolRegistry();
  }

  /**
   * Main transpilation method - converts AST to executable program format
   * @param {Object} ast - Parsed AST from LexerService
   * @param {Object} options - Transpilation options
   * @returns {Object} - Transpiled program or errors
   */
  async transpile(ast, options = {}) {
    try {
      const {
        optimize = true,
        include_metadata = true,
        tool_validation = true,
      } = options;

      // Extract basic program info
      const programInfo = this.extractProgramInfo(ast);

      // Convert AST nodes to procedures
      const procedures = this.convertToProcedures(ast);

      // Extract and validate tools
      const usedTools = this.extractUsedTools(procedures);
      if (tool_validation) {
        const toolValidation = this.validateTools(usedTools);
        if (!toolValidation.valid) {
          return {
            success: false,
            errors: toolValidation.errors,
          };
        }
      }

      // Build execution order
      const executionOrder = this.buildExecutionOrder(procedures);

      // Create transpiled program
      const program = {
        name: programInfo.name,
        version: "1.0",
        tools: usedTools,
        procedures: procedures,
        execution_order: executionOrder,
        global_memory: {},
        error_handling: {
          on_tool_error: "continue",
          on_condition_error: "abort",
          timeout: 30000,
        },
      };

      if (include_metadata) {
        program.metadata = {
          transpiled_at: new Date().toISOString(),
          ast_sections: ast.children.length,
          total_steps: this.countTotalSteps(procedures),
          optimization_applied: optimize,
        };
      }

      // Apply optimizations if requested
      if (optimize) {
        this.optimizeProgram(program);
      }

      return {
        success: true,
        program: program,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            type: "transpilation_error",
            message: `Transpilation failed: ${error.message}`,
            details: error.stack,
          },
        ],
      };
    }
  }

  /**
   * Extract program information from AST
   * @param {Object} ast - Input AST
   * @returns {Object} - Program info
   */
  extractProgramInfo(ast) {
    // Find H1 heading for program name
    const titleNode = ast.children.find(
      (child) => child.type === "heading" && child.level === 1
    );

    return {
      name: titleNode ? titleNode.text : "Untitled Troubleshooting Program",
      description:
        ast.metadata?.description || "Generated troubleshooting program",
    };
  }

  /**
   * Convert AST sections to structured procedures
   * @param {Object} ast - Input AST
   * @returns {Array} - Array of procedures
   */
  convertToProcedures(ast) {
    const procedures = [];

    // Find all H2 sections (procedures)
    const procedureSections = ast.children.filter(
      (child) => child.type === "heading" && child.level === 2
    );

    for (const section of procedureSections) {
      const procedure = this.convertSectionToProcedure(section);
      if (procedure) {
        procedures.push(procedure);
      }
    }

    return procedures;
  }

  /**
   * Convert individual AST section to procedure
   * @param {Object} section - AST section node
   * @returns {Object} - Procedure object
   */
  convertSectionToProcedure(section) {
    const procedureId = this.generateProcedureId(section.text);

    const procedure = {
      id: procedureId,
      name: section.text,
      scope: "local",
      variables: {},
      steps: [],
      output: {},
    };

    // Process all children of this section
    if (section.children) {
      let stepIndex = 1;

      for (const child of section.children) {
        const steps = this.processContentNode(child, stepIndex, procedureId);
        procedure.steps.push(...steps);
        stepIndex += steps.length;
      }
    }

    return procedure;
  }

  /**
   * Process different types of content nodes into steps
   * @param {Object} node - AST content node
   * @param {number} stepIndex - Current step index
   * @param {string} procedureId - Parent procedure ID
   * @returns {Array} - Array of steps
   */
  processContentNode(node, stepIndex, procedureId) {
    switch (node.type) {
      case "list":
        return this.processListNode(node, stepIndex, procedureId);
      case "paragraph":
        return this.processParagraphNode(node, stepIndex, procedureId);
      case "code":
        return this.processCodeNode(node, stepIndex, procedureId);
      case "blockquote":
        return this.processBlockquoteNode(node, stepIndex, procedureId);
      default:
        return [];
    }
  }

  /**
   * Process list nodes (ordered/unordered) into steps
   * @param {Object} listNode - List AST node
   * @param {number} startIndex - Starting step index
   * @param {string} procedureId - Parent procedure ID
   * @returns {Array} - Array of steps
   */
  processListNode(listNode, startIndex, procedureId) {
    const steps = [];

    if (listNode.ordered) {
      // Ordered list - each item is a step
      listNode.items.forEach((item, index) => {
        const step = this.createStepFromListItem(
          item,
          startIndex + index,
          procedureId
        );
        if (step) {
          steps.push(step);
        }
      });
    } else {
      // Unordered list - treat as alternative options or sub-steps
      const step = this.createChoiceStep(listNode, startIndex, procedureId);
      if (step) {
        steps.push(step);
      }
    }

    return steps;
  }

  /**
   * Create step from ordered list item
   * @param {Object} item - List item
   * @param {number} stepIndex - Step index
   * @param {string} procedureId - Parent procedure ID
   * @returns {Object} - Step object
   */
  createStepFromListItem(item, stepIndex, procedureId) {
    const stepId = `${procedureId}_step_${stepIndex}`;
    const text = item.text.trim();

    // Check if this is a command step
    const commandMatch = text.match(/`([^`]+)`/);
    if (commandMatch) {
      const command = commandMatch[1];
      const tool = extractTool(command);

      return {
        id: stepId,
        type: "command",
        tool: tool,
        command: this.parseCommand(command),
        parameters: this.extractParameters(command),
        expected_output: this.inferOutputType(tool, command),
        assign_to: this.extractAssignment(text),
        description: text.replace(/`[^`]+`/g, "").trim(),
      };
    }

    // Check if this is a conditional step
    const conditionMatch = text.match(
      /\b(if|when|unless)\s+(.+?)[,:]?\s*(then)?\s*(.+)/i
    );
    if (conditionMatch) {
      return {
        id: stepId,
        type: "conditional",
        condition: this.parseCondition(conditionMatch[2]),
        true_branch: this.parseAction(conditionMatch[4]),
        false_branch: null,
        description: text,
      };
    }

    // Default to analysis/text step
    return {
      id: stepId,
      type: "analysis",
      input: this.extractInputReferences(text),
      description: text,
      extract: this.extractVariables(text),
    };
  }

  /**
   * Create choice step from unordered list
   * @param {Object} listNode - List node
   * @param {number} stepIndex - Step index
   * @param {string} procedureId - Parent procedure ID
   * @returns {Object} - Choice step
   */
  createChoiceStep(listNode, stepIndex, procedureId) {
    const stepId = `${procedureId}_choice_${stepIndex}`;

    return {
      id: stepId,
      type: "choice",
      options: listNode.items.map((item, index) => ({
        id: `${stepId}_option_${index + 1}`,
        description: item.text,
        action: this.parseAction(item.text),
      })),
      description: "Choose one of the following options",
    };
  }

  /**
   * Process paragraph nodes for conditional logic and assignments
   * @param {Object} paragraphNode - Paragraph AST node
   * @param {number} stepIndex - Step index
   * @param {string} procedureId - Parent procedure ID
   * @returns {Array} - Array of steps
   */
  processParagraphNode(paragraphNode, stepIndex, procedureId) {
    const text = paragraphNode.text || "";
    const steps = [];

    // Check for conditional statements
    const conditionalMatch = text.match(/\*\*(If .+?):\*\*\s*(.+)/);
    if (conditionalMatch) {
      const stepId = `${procedureId}_conditional_${stepIndex}`;
      steps.push({
        id: stepId,
        type: "conditional",
        condition: this.parseCondition(conditionalMatch[1].replace("If ", "")),
        true_branch: this.parseAction(conditionalMatch[2]),
        description: text,
      });
    }

    // Check for output/assignment statements
    const outputMatch = text.match(/\*\*(Output|Set to memory):\*\*\s*(.+)/i);
    if (outputMatch) {
      const stepId = `${procedureId}_output_${stepIndex}`;
      steps.push({
        id: stepId,
        type: "assignment",
        assign_to: outputMatch[1].toLowerCase().includes("memory")
          ? "memory"
          : "output",
        value: outputMatch[2],
        description: text,
      });
    }

    return steps;
  }

  /**
   * Process code blocks into command steps
   * @param {Object} codeNode - Code AST node
   * @param {number} stepIndex - Step index
   * @param {string} procedureId - Parent procedure ID
   * @returns {Array} - Array of steps
   */
  processCodeNode(codeNode, stepIndex, procedureId) {
    const commands = codeNode.text.split("\n").filter((line) => line.trim());
    const steps = [];

    commands.forEach((command, index) => {
      const stepId = `${procedureId}_cmd_${stepIndex + index}`;
      const tool = extractTool(command);

      steps.push({
        id: stepId,
        type: "command",
        tool: tool,
        command: this.parseCommand(command),
        parameters: this.extractParameters(command),
        expected_output: this.inferOutputType(tool, command),
        description: `Execute: ${command}`,
      });
    });

    return steps;
  }

  /**
   * Process blockquote nodes (typically conditions or warnings)
   * @param {Object} blockquoteNode - Blockquote AST node
   * @param {number} stepIndex - Step index
   * @param {string} procedureId - Parent procedure ID
   * @returns {Array} - Array of steps
   */
  processBlockquoteNode(blockquoteNode, stepIndex, procedureId) {
    const stepId = `${procedureId}_note_${stepIndex}`;

    return [
      {
        id: stepId,
        type: "note",
        level: "warning",
        message: blockquoteNode.text,
        description: blockquoteNode.text,
      },
    ];
  }

  /**
   * Parse command string into structured format
   * @param {string} command - Raw command string
   * @returns {string} - Parsed command
   */
  parseCommand(command) {
    // Remove sudo if present for tool identification
    return command.replace(/^sudo\s+/, "").trim();
  }

  /**
   * Extract parameters from command
   * @param {string} command - Command string
   * @returns {Object} - Parameters object
   */
  extractParameters(command) {
    const parts = command.trim().split(/\s+/);
    const tool = parts[0] === "sudo" ? parts[1] : parts[0];
    const args = parts.slice(parts[0] === "sudo" ? 2 : 1);

    // Basic parameter extraction - can be enhanced
    const parameters = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("-")) {
        // Flag parameter
        const flagName = arg.replace(/^-+/, "");
        const nextArg = args[i + 1];
        if (nextArg && !nextArg.startsWith("-")) {
          parameters[flagName] = nextArg;
          i++; // Skip next argument
        } else {
          parameters[flagName] = true;
        }
      } else {
        // Positional parameter
        if (!parameters.args) parameters.args = [];
        parameters.args.push(arg);
      }
    }

    return parameters;
  }

  /**
   * Parse condition string into structured format
   * @param {string} condition - Condition text
   * @returns {Object} - Condition object
   */
  parseCondition(condition) {
    // Simple condition parsing - can be enhanced with more sophisticated logic
    const equalityMatch = condition.match(/(.+?)\s*(==|equals?|is)\s*(.+)/i);
    if (equalityMatch) {
      return {
        type: "equality_check",
        variable: equalityMatch[1].trim(),
        operator: "==",
        value: equalityMatch[3].trim(),
      };
    }

    const containsMatch = condition.match(
      /(.+?)\s*(contains?|includes?)\s*(.+)/i
    );
    if (containsMatch) {
      return {
        type: "contains_check",
        variable: containsMatch[1].trim(),
        operator: "contains",
        value: containsMatch[3].trim(),
      };
    }

    // Default condition
    return {
      type: "boolean_check",
      expression: condition.trim(),
    };
  }

  /**
   * Parse action string into structured format
   * @param {string} action - Action text
   * @returns {Object} - Action object
   */
  parseAction(action) {
    const commandMatch = action.match(/`([^`]+)`/);
    if (commandMatch) {
      const command = commandMatch[1];
      return {
        type: "command",
        tool: extractTool(command),
        command: this.parseCommand(command),
        parameters: this.extractParameters(command),
      };
    }

    return {
      type: "log",
      message: action.trim(),
    };
  }

  /**
   * Extract variable assignments from text
   * @param {string} text - Input text
   * @returns {string|null} - Variable name or null
   */
  extractAssignment(text) {
    const assignMatch = text.match(
      /assign\s+to\s+(\w+)|store\s+in\s+(\w+)|save\s+as\s+(\w+)/i
    );
    if (assignMatch) {
      return assignMatch[1] || assignMatch[2] || assignMatch[3];
    }
    return null;
  }

  /**
   * Extract variable references from text
   * @param {string} text - Input text
   * @returns {Array} - Array of variable names
   */
  extractInputReferences(text) {
    const varMatches = text.match(/\$(\w+)/g);
    return varMatches ? varMatches.map((match) => match.substring(1)) : [];
  }

  /**
   * Extract variables from emphasized text
   * @param {string} text - Input text
   * @returns {Array} - Array of variable names
   */
  extractVariables(text) {
    const emphasisMatches = text.match(/\*\*([^*]+)\*\*/g);
    return emphasisMatches
      ? emphasisMatches.map((match) =>
          match.slice(2, -2).toLowerCase().replace(/\s+/g, "_")
        )
      : [];
  }

  /**
   * Infer output type based on tool and command
   * @param {string} tool - Tool name
   * @param {string} command - Command string
   * @returns {string} - Output type
   */
  inferOutputType(tool, command) {
    const toolInfo = this.toolRegistry[tool];
    if (toolInfo) {
      // Match command pattern to registered commands
      for (const [cmdName, cmdInfo] of Object.entries(toolInfo.commands)) {
        if (command.includes(cmdName.replace("_", " "))) {
          return cmdInfo.output_type;
        }
      }
    }

    // Default output types based on common patterns
    if (
      command.includes("show") ||
      command.includes("list") ||
      command.includes("addr")
    ) {
      return "text_output";
    }
    if (command.includes("ping")) {
      return "ping_result";
    }
    if (command.includes("nslookup") || command.includes("dig")) {
      return "dns_record";
    }

    return "text_output";
  }

  /**
   * Extract all tools used in procedures
   * @param {Array} procedures - Array of procedures
   * @returns {Array} - Array of unique tool names
   */
  extractUsedTools(procedures) {
    const tools = new Set();

    for (const procedure of procedures) {
      for (const step of procedure.steps) {
        if (step.tool) {
          tools.add(step.tool);
        }
        if (step.true_branch && step.true_branch.tool) {
          tools.add(step.true_branch.tool);
        }
      }
    }

    return Array.from(tools);
  }

  /**
   * Validate that all used tools are in registry
   * @param {Array} usedTools - Array of tool names
   * @returns {Object} - Validation result
   */
  validateTools(usedTools) {
    const errors = [];

    for (const tool of usedTools) {
      if (!this.toolRegistry[tool]) {
        errors.push({
          type: "unknown_tool",
          message: `Tool '${tool}' is not registered`,
          suggestion: `Add ${tool} to the tool registry or use a registered tool`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Build execution order based on procedure dependencies
   * @param {Array} procedures - Array of procedures
   * @returns {Array} - Ordered array of procedure IDs
   */
  buildExecutionOrder(procedures) {
    // Simple sequential order for now - can be enhanced with dependency analysis
    return procedures.map((proc) => proc.id);
  }

  /**
   * Count total steps across all procedures
   * @param {Array} procedures - Array of procedures
   * @returns {number} - Total step count
   */
  countTotalSteps(procedures) {
    return procedures.reduce((total, proc) => total + proc.steps.length, 0);
  }

  /**
   * Apply optimizations to program
   * @param {Object} program - Program object to optimize
   */
  optimizeProgram(program) {
    // Remove duplicate tool definitions
    program.tools = [...new Set(program.tools)];

    // Optimize step sequences
    for (const procedure of program.procedures) {
      this.optimizeStepSequence(procedure.steps);
    }
  }

  /**
   * Optimize step sequences within a procedure
   * @param {Array} steps - Array of steps
   */
  optimizeStepSequence(steps) {
    // Combine consecutive command steps where possible
    // Remove redundant analysis steps
    // This is a placeholder for more sophisticated optimizations
  }

  /**
   * Generate unique procedure ID from name
   * @param {string} name - Procedure name
   * @returns {string} - Unique ID
   */
  generateProcedureId(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 32);
  }

  /**
   * Get tool registry
   * @returns {Object} - Tool registry
   */
  getToolRegistry() {
    return this.toolRegistry;
  }

  /**
   * Validate program structure
   * @param {Object} program - Program to validate
   * @returns {Object} - Validation result
   */
  validateProgram(program) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!program.name) {
      errors.push({
        type: "missing_name",
        message: "Program must have a name",
      });
    }
    if (!program.procedures || program.procedures.length === 0) {
      errors.push({
        type: "no_procedures",
        message: "Program must have at least one procedure",
      });
    }
    if (!program.tools || program.tools.length === 0) {
      warnings.push({
        type: "no_tools",
        message: "Program has no tools defined",
      });
    }

    // Validate procedures
    for (const procedure of program.procedures || []) {
      if (!procedure.steps || procedure.steps.length === 0) {
        warnings.push({
          type: "empty_procedure",
          message: `Procedure '${procedure.name}' has no steps`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
    };
  }

  /**
   * Initialize comprehensive tool registry
   * @returns {Object} - Tool registry
   */
  initializeToolRegistry() {
    return {
      ip: {
        name: "ip",
        description: "Show/manipulate routing, network devices, interfaces",
        category: "network",
        commands: {
          addr_show: {
            syntax: "ip addr show [interface]",
            output_type: "interface_list",
            parameters: ["interface?"],
          },
          link_set: {
            syntax: "ip link set <interface> <state>",
            output_type: "status",
            parameters: ["interface", "state"],
          },
          route_show: {
            syntax: "ip route show",
            output_type: "route_table",
            parameters: [],
          },
        },
      },
      nslookup: {
        name: "nslookup",
        description: "DNS lookup utility",
        category: "network",
        commands: {
          lookup: {
            syntax: "nslookup <hostname> [dns_server]",
            output_type: "dns_record",
            parameters: ["hostname", "dns_server?"],
          },
        },
      },
      ping: {
        name: "ping",
        description: "Send ICMP echo requests",
        category: "network",
        commands: {
          test: {
            syntax: "ping [-c count] <host>",
            output_type: "ping_result",
            parameters: ["host", "count?"],
          },
        },
      },
      cat: {
        name: "cat",
        description: "Display file contents",
        category: "file",
        commands: {
          display: {
            syntax: "cat <file>",
            output_type: "file_content",
            parameters: ["file"],
          },
        },
      },
      grep: {
        name: "grep",
        description: "Search text patterns",
        category: "text",
        commands: {
          search: {
            syntax: "grep <pattern> <file>",
            output_type: "text_matches",
            parameters: ["pattern", "file"],
          },
        },
      },
      curl: {
        name: "curl",
        description: "Transfer data from/to servers",
        category: "network",
        commands: {
          get: {
            syntax: "curl [-I] <url>",
            output_type: "http_response",
            parameters: ["url", "headers_only?"],
          },
        },
      },
      systemctl: {
        name: "systemctl",
        description: "Control systemd services",
        category: "system",
        commands: {
          status: {
            syntax: "systemctl status <service>",
            output_type: "service_status",
            parameters: ["service"],
          },
          restart: {
            syntax: "systemctl restart <service>",
            output_type: "action_result",
            parameters: ["service"],
          },
        },
      },
      netstat: {
        name: "netstat",
        description: "Display network connections",
        category: "network",
        commands: {
          list_ports: {
            syntax: "netstat -tlnp",
            output_type: "port_list",
            parameters: [],
          },
        },
      },
    };
  }
}

module.exports = TranspilerService;
