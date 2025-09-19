const { v4: uuidv4 } = require("uuid");
const { exec, spawn } = require("child_process");
const { promisify } = require("util");
const { generateId } = require("../utils/helpers");

const execAsync = promisify(exec);

/**
 * ExecutionService - Stage 4: Execution Engine
 * Provides step-by-step interpretation, shell command execution, and debugging capabilities
 */
class ExecutionService {
  constructor() {
    this.sessions = new Map();
    this.commandTimeout = 30000; // 30 seconds default timeout
    this.maxConcurrentSessions = 10;
  }

  /**
   * Start program execution with full debugging support
   * @param {Object} program - Transpiled program
   * @param {Object} analysis - Semantic analysis results
   * @param {Object} options - Execution options
   * @returns {Object} - Execution session info
   */
  async startExecution(program, analysis, options = {}) {
    try {
      // Check session limits
      if (this.sessions.size >= this.maxConcurrentSessions) {
        throw new Error(
          `Maximum concurrent sessions (${this.maxConcurrentSessions}) reached`
        );
      }

      const {
        debug_mode = true,
        timeout = 30000,
        memory_limit = 10 * 1024 * 1024, // 10MB default
        auto_continue = false,
        risk_level = "medium",
      } = options;

      const sessionId = uuidv4();
      const session = {
        id: sessionId,
        program: program,
        analysis: analysis,
        options: {
          debug_mode,
          timeout,
          memory_limit,
          auto_continue,
          risk_level,
        },
        state: this.createInitialState(program, analysis),
        createdAt: new Date(),
        lastActivity: new Date(),
        commandHistory: [],
        totalStepsExecuted: 0,
      };

      this.sessions.set(sessionId, session);

      // If auto-continue is enabled, start execution immediately
      if (auto_continue) {
        await this.executeStep(sessionId, "continue");
      }

      return {
        success: true,
        execution_id: sessionId,
        state: session.state,
        metadata: {
          procedures: program.procedures.length,
          total_steps: this.countTotalSteps(program),
          estimated_duration: this.estimateTotalDuration(analysis),
          risk_assessment: analysis.risk_assessment,
        },
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            type: "execution_start_error",
            message: error.message,
            details: error.stack,
          },
        ],
      };
    }
  }

  /**
   * Execute a debugging command (step, continue, pause, etc.)
   * @param {string} sessionId - Session ID
   * @param {string} command - Debug command
   * @param {Object} params - Command parameters
   * @returns {Object} - Execution result
   */
  async executeStep(sessionId, command, params = {}) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      session.lastActivity = new Date();
      const result = await this.processDebugCommand(session, command, params);

      // Update session state
      session.commandHistory.push({
        command: command,
        params: params,
        timestamp: new Date().toISOString(),
        result: result.success,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        state: this.sessions.get(sessionId)?.state || null,
      };
    }
  }

  /**
   * Process different debug commands
   * @param {Object} session - Execution session
   * @param {string} command - Debug command
   * @param {Object} params - Parameters
   * @returns {Object} - Command result
   */
  async processDebugCommand(session, command, params) {
    switch (command) {
      case "step_over":
        return await this.stepOver(session);

      case "step_into":
        return await this.stepInto(session);

      case "step_out":
        return await this.stepOut(session);

      case "continue":
        return await this.continue(session);

      case "pause":
        return this.pause(session);

      case "reset":
        return this.reset(session);

      case "evaluate":
        return await this.evaluateExpression(session, params.expression);

      case "inspect":
        return this.inspectVariable(session, params.variable);

      default:
        throw new Error(`Unknown debug command: ${command}`);
    }
  }

  /**
   * Execute single step (step over)
   * @param {Object} session - Execution session
   * @returns {Object} - Step result
   */
  async stepOver(session) {
    if (
      session.state.status === "completed" ||
      session.state.status === "error"
    ) {
      return {
        success: true,
        state: session.state,
        message: `Execution already ${session.state.status}`,
      };
    }

    const currentStep = this.getCurrentStep(session);
    if (!currentStep) {
      return this.completeExecution(session);
    }

    session.state.status = "running";

    try {
      const stepResult = await this.executeCurrentStep(session, currentStep);

      if (stepResult.success) {
        this.advanceToNextStep(session);
        session.totalStepsExecuted++;

        // Check if we've hit a breakpoint
        if (this.isBreakpoint(session, session.state.current_step.step_id)) {
          session.state.status = "paused";
          return {
            success: true,
            state: session.state,
            step_result: stepResult,
            message: "Paused at breakpoint",
          };
        }

        // Check if execution is complete
        if (!this.getCurrentStep(session)) {
          return this.completeExecution(session);
        }

        session.state.status = "paused";
      } else {
        session.state.status = "error";
        session.state.error_state = {
          step_id: currentStep.id,
          error: stepResult.error,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: stepResult.success,
        state: session.state,
        step_result: stepResult,
      };
    } catch (error) {
      session.state.status = "error";
      session.state.error_state = {
        step_id: currentStep.id,
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      return {
        success: false,
        state: session.state,
        error: error.message,
      };
    }
  }

  /**
   * Step into procedure calls
   * @param {Object} session - Execution session
   * @returns {Object} - Step result
   */
  async stepInto(session) {
    // For now, same as step over since we don't have nested procedures yet
    return await this.stepOver(session);
  }

  /**
   * Step out of current procedure
   * @param {Object} session - Execution session
   * @returns {Object} - Step result
   */
  async stepOut(session) {
    // Execute until end of current procedure
    while (
      this.getCurrentStep(session) &&
      this.getCurrentStep(session).procedure_id ===
        session.state.current_step.procedure_id
    ) {
      const result = await this.stepOver(session);
      if (!result.success || session.state.status === "error") {
        return result;
      }
    }

    return {
      success: true,
      state: session.state,
      message: "Stepped out of procedure",
    };
  }

  /**
   * Continue execution until breakpoint or completion
   * @param {Object} session - Execution session
   * @returns {Object} - Execution result
   */
  async continue(session) {
    session.state.status = "running";

    while (this.getCurrentStep(session) && session.state.status === "running") {
      const result = await this.stepOver(session);

      if (!result.success) {
        return result;
      }

      // Check if we hit a breakpoint or were paused
      if (session.state.status === "paused") {
        return {
          success: true,
          state: session.state,
          message: "Execution paused",
        };
      }

      // Prevent infinite loops with a reasonable limit
      if (session.totalStepsExecuted > 1000) {
        session.state.status = "error";
        session.state.error_state = {
          error: "Execution exceeded step limit (1000 steps)",
          timestamp: new Date().toISOString(),
        };
        return {
          success: false,
          state: session.state,
          error: "Step limit exceeded",
        };
      }
    }

    return {
      success: true,
      state: session.state,
      message:
        session.state.status === "completed"
          ? "Execution completed"
          : "Execution stopped",
    };
  }

  /**
   * Pause execution
   * @param {Object} session - Execution session
   * @returns {Object} - Pause result
   */
  pause(session) {
    if (session.state.status === "running") {
      session.state.status = "paused";
    }

    return {
      success: true,
      state: session.state,
      message: "Execution paused",
    };
  }

  /**
   * Reset execution to beginning
   * @param {Object} session - Execution session
   * @returns {Object} - Reset result
   */
  reset(session) {
    session.state = this.createInitialState(session.program, session.analysis);
    session.totalStepsExecuted = 0;
    session.commandHistory = [];

    return {
      success: true,
      state: session.state,
      message: "Execution reset to beginning",
    };
  }

  /**
   * Execute the current step
   * @param {Object} session - Execution session
   * @param {Object} step - Step to execute
   * @returns {Object} - Step execution result
   */
  async executeCurrentStep(session, step) {
    const startTime = Date.now();

    try {
      let result;

      switch (step.type) {
        case "command":
          result = await this.executeCommand(session, step);
          break;

        case "conditional":
          result = await this.executeConditional(session, step);
          break;

        case "assignment":
          result = this.executeAssignment(session, step);
          break;

        case "choice":
          result = await this.executeChoice(session, step);
          break;

        case "analysis":
          result = this.executeAnalysis(session, step);
          break;

        case "note":
          result = this.executeNote(session, step);
          break;

        default:
          result = {
            success: false,
            error: `Unknown step type: ${step.type}`,
          };
      }

      // Record execution in history
      session.state.execution_history.push({
        step_id: step.id,
        type: step.type,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        success: result.success,
        output: result.output || null,
        error: result.error || null,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: null,
      };
    }
  }

  /**
   * Execute shell command
   * @param {Object} session - Execution session
   * @param {Object} step - Command step
   * @returns {Object} - Command result
   */
  async executeCommand(session, step) {
    try {
      // Check if this is a risky command and we're in safe mode
      if (session.options.risk_level === "low") {
        const riskLevel = this.assessCommandRisk(step.command);
        if (riskLevel === "high") {
          return {
            success: false,
            error: "High-risk command blocked in safe mode",
            output: null,
            risk_level: riskLevel,
          };
        }
      }

      // Replace variables in command
      const resolvedCommand = this.resolveVariables(session, step.command);

      // Execute the command
      const { stdout, stderr } = await execAsync(resolvedCommand, {
        timeout: session.options.timeout,
        maxBuffer: 1024 * 1024, // 1MB buffer
      });

      const output = stdout.trim() || stderr.trim();

      // Store output in heap if step has assignment
      if (step.assign_to) {
        session.state.heap.tool_outputs[step.assign_to] = {
          command: resolvedCommand,
          output: output,
          timestamp: new Date().toISOString(),
        };

        // Also store in current stack frame variables
        const currentFrame =
          session.state.stack[session.state.stack.length - 1];
        currentFrame.variables[step.assign_to] = output;
      }

      return {
        success: true,
        output: output,
        command: resolvedCommand,
        stdout: stdout,
        stderr: stderr,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output: error.stdout || error.stderr || null,
        command: step.command,
      };
    }
  }

  /**
   * Execute conditional step
   * @param {Object} session - Execution session
   * @param {Object} step - Conditional step
   * @returns {Object} - Conditional result
   */
  async executeConditional(session, step) {
    try {
      const conditionResult = this.evaluateCondition(session, step.condition);

      if (conditionResult) {
        // Execute true branch
        if (step.true_branch) {
          return await this.executeAction(session, step.true_branch);
        }
      } else {
        // Execute false branch
        if (step.false_branch) {
          return await this.executeAction(session, step.false_branch);
        }
      }

      return {
        success: true,
        output: `Condition evaluated to: ${conditionResult}`,
        condition_result: conditionResult,
      };
    } catch (error) {
      return {
        success: false,
        error: `Condition evaluation failed: ${error.message}`,
        output: null,
      };
    }
  }

  /**
   * Execute assignment step
   * @param {Object} session - Execution session
   * @param {Object} step - Assignment step
   * @returns {Object} - Assignment result
   */
  executeAssignment(session, step) {
    try {
      const value = this.resolveVariables(session, step.value);
      const currentFrame = session.state.stack[session.state.stack.length - 1];

      if (step.assign_to === "memory" || step.assign_to === "global") {
        session.state.memory.persistent_vars[step.variable || "temp"] = value;
      } else {
        currentFrame.variables[step.assign_to] = value;
      }

      return {
        success: true,
        output: `Assigned: ${step.assign_to} = ${value}`,
        variable: step.assign_to,
        value: value,
      };
    } catch (error) {
      return {
        success: false,
        error: `Assignment failed: ${error.message}`,
        output: null,
      };
    }
  }

  /**
   * Execute choice step (user interaction)
   * @param {Object} session - Execution session
   * @param {Object} step - Choice step
   * @returns {Object} - Choice result
   */
  async executeChoice(session, step) {
    // In automated mode, select first option
    // In interactive mode, this would wait for user input
    const selectedOption = step.options[0];

    if (selectedOption && selectedOption.action) {
      const result = await this.executeAction(session, selectedOption.action);
      return {
        success: result.success,
        output: `Selected option: ${selectedOption.description}`,
        selected_option: selectedOption,
        action_result: result,
      };
    }

    return {
      success: true,
      output: `Choice presented: ${step.options.length} options available`,
      options: step.options,
    };
  }

  /**
   * Execute analysis step
   * @param {Object} session - Execution session
   * @param {Object} step - Analysis step
   * @returns {Object} - Analysis result
   */
  executeAnalysis(session, step) {
    const inputs = {};

    // Collect input variables
    if (step.input) {
      step.input.forEach((varName) => {
        inputs[varName] = this.getVariable(session, varName);
      });
    }

    // Extract variables if specified
    const extracted = {};
    if (step.extract) {
      step.extract.forEach((varName) => {
        extracted[varName] = this.extractFromDescription(
          step.description,
          varName
        );
      });
    }

    return {
      success: true,
      output: `Analysis: ${step.description}`,
      inputs: inputs,
      extracted: extracted,
    };
  }

  /**
   * Execute note step
   * @param {Object} session - Execution session
   * @param {Object} step - Note step
   * @returns {Object} - Note result
   */
  executeNote(session, step) {
    return {
      success: true,
      output: `Note (${step.level || "info"}): ${step.message}`,
      level: step.level,
      message: step.message,
    };
  }

  // ==================== SUPPORTING METHODS ====================

  /**
   * Execute an action (from conditional or choice)
   * @param {Object} session - Execution session
   * @param {Object} action - Action to execute
   * @returns {Object} - Action result
   */
  async executeAction(session, action) {
    switch (action.type) {
      case "command":
        return await this.executeCommand(session, action);
      case "log":
        return {
          success: true,
          output: action.message,
          message: action.message,
        };
      default:
        return {
          success: false,
          error: `Unknown action type: ${action.type}`,
        };
    }
  }

  /**
   * Get current step being executed
   * @param {Object} session - Execution session
   * @returns {Object|null} - Current step or null if complete
   */
  getCurrentStep(session) {
    const currentProcedureId = session.state.current_step.procedure_id;
    const currentStepIndex = session.state.current_step.step_index;

    const procedure = session.program.procedures.find(
      (p) => p.id === currentProcedureId
    );
    if (!procedure) return null;

    return procedure.steps[currentStepIndex] || null;
  }

  /**
   * Advance to next step in execution
   * @param {Object} session - Execution session
   */
  advanceToNextStep(session) {
    const currentProcedureId = session.state.current_step.procedure_id;
    const procedure = session.program.procedures.find(
      (p) => p.id === currentProcedureId
    );

    if (!procedure) return;

    session.state.current_step.step_index++;
    session.state.current_step.instruction_pointer++;

    // If we've finished this procedure, move to next one
    if (session.state.current_step.step_index >= procedure.steps.length) {
      const currentProcIndex =
        session.program.execution_order.indexOf(currentProcedureId);
      const nextProcedureId =
        session.program.execution_order[currentProcIndex + 1];

      if (nextProcedureId) {
        session.state.current_step.procedure_id = nextProcedureId;
        session.state.current_step.step_index = 0;

        // Update step_id to first step of next procedure
        const nextProcedure = session.program.procedures.find(
          (p) => p.id === nextProcedureId
        );
        session.state.current_step.step_id =
          nextProcedure?.steps[0]?.id || "unknown";
      }
    } else {
      // Update step_id to current step
      session.state.current_step.step_id =
        procedure.steps[session.state.current_step.step_index]?.id || "unknown";
    }
  }

  /**
   * Complete execution
   * @param {Object} session - Execution session
   * @returns {Object} - Completion result
   */
  completeExecution(session) {
    session.state.status = "completed";
    session.state.completed_at = new Date().toISOString();

    return {
      success: true,
      state: session.state,
      message: "Execution completed successfully",
      summary: {
        total_steps: session.totalStepsExecuted,
        duration: Date.now() - new Date(session.createdAt).getTime(),
        procedures_executed: session.program.procedures.length,
      },
    };
  }

  /**
   * Check if current step is a breakpoint
   * @param {Object} session - Execution session
   * @param {string} stepId - Step ID to check
   * @returns {boolean} - True if breakpoint
   */
  isBreakpoint(session, stepId) {
    return (
      session.state.breakpoints && session.state.breakpoints.includes(stepId)
    );
  }

  /**
   * Resolve variables in a string
   * @param {Object} session - Execution session
   * @param {string} text - Text with variables
   * @returns {string} - Resolved text
   */
  resolveVariables(session, text) {
    if (!text) return text;

    return text.replace(/\$(\w+)/g, (match, varName) => {
      const value = this.getVariable(session, varName);
      return value !== undefined ? value : match;
    });
  }

  /**
   * Get variable value from session
   * @param {Object} session - Execution session
   * @param {string} varName - Variable name
   * @returns {*} - Variable value
   */
  getVariable(session, varName) {
    // Check current stack frame
    const currentFrame = session.state.stack[session.state.stack.length - 1];
    if (currentFrame.variables[varName] !== undefined) {
      return currentFrame.variables[varName];
    }

    // Check persistent memory
    if (session.state.memory.persistent_vars[varName] !== undefined) {
      return session.state.memory.persistent_vars[varName];
    }

    // Check tool outputs
    if (session.state.heap.tool_outputs[varName] !== undefined) {
      return session.state.heap.tool_outputs[varName].output;
    }

    return undefined;
  }

  /**
   * Evaluate condition
   * @param {Object} session - Execution session
   * @param {Object} condition - Condition object
   * @returns {boolean} - Condition result
   */
  evaluateCondition(session, condition) {
    switch (condition.type) {
      case "equality_check":
        const varValue = this.getVariable(session, condition.variable);
        return varValue == condition.value;

      case "contains_check":
        const containerValue = this.getVariable(session, condition.variable);
        return (
          containerValue && containerValue.toString().includes(condition.value)
        );

      case "boolean_check":
        // Simple boolean expression evaluation
        const resolved = this.resolveVariables(session, condition.expression);
        return Boolean(resolved);

      default:
        return false;
    }
  }

  /**
   * Assess command risk level
   * @param {string} command - Command to assess
   * @returns {string} - Risk level: low, medium, high
   */
  assessCommandRisk(command) {
    const cmd = command.toLowerCase();

    // High risk commands
    const highRisk = [
      "rm -rf",
      "format",
      "fdisk",
      "mkfs",
      "dd if=",
      "shutdown",
      "reboot",
    ];
    if (highRisk.some((risk) => cmd.includes(risk))) {
      return "high";
    }

    // Medium risk commands
    const mediumRisk = [
      "rm ",
      "del ",
      "systemctl stop",
      "service stop",
      "iptables",
      "chmod 777",
    ];
    if (mediumRisk.some((risk) => cmd.includes(risk))) {
      return "medium";
    }

    return "low";
  }

  /**
   * Extract value from description text
   * @param {string} description - Description text
   * @param {string} varName - Variable name to extract
   * @returns {string} - Extracted value
   */
  extractFromDescription(description, varName) {
    // Simple pattern matching for common variables
    const patterns = {
      ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
      interface: /\b(?:eth0|eth1|wlan0|lo|docker0)\b/,
      service: /\b(?:apache2|nginx|mysql|ssh|ftp)\b/,
      port: /\bport\s+(\d+)\b/i,
    };

    const pattern = patterns[varName.toLowerCase()];
    if (pattern) {
      const match = description.match(pattern);
      return match ? match[0] : null;
    }

    return null;
  }

  /**
   * Evaluate expression in context
   * @param {Object} session - Execution session
   * @param {string} expression - Expression to evaluate
   * @returns {Object} - Evaluation result
   */
  async evaluateExpression(session, expression) {
    try {
      const resolved = this.resolveVariables(session, expression);

      // If it's a simple variable lookup
      if (expression.startsWith("$")) {
        const varName = expression.substring(1);
        const value = this.getVariable(session, varName);
        return {
          success: true,
          result: value,
          expression: expression,
          resolved: resolved,
        };
      }

      // If it's a command to execute
      if (expression.startsWith("!")) {
        const command = expression.substring(1);
        const result = await this.executeCommand(session, { command: command });
        return {
          success: result.success,
          result: result.output,
          expression: expression,
          error: result.error,
        };
      }

      return {
        success: true,
        result: resolved,
        expression: expression,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        expression: expression,
      };
    }
  }

  /**
   * Inspect variable details
   * @param {Object} session - Execution session
   * @param {string} varName - Variable name
   * @returns {Object} - Variable inspection
   */
  inspectVariable(session, varName) {
    const value = this.getVariable(session, varName);

    if (value === undefined) {
      return {
        success: false,
        error: `Variable '${varName}' not found`,
        variable: varName,
      };
    }

    return {
      success: true,
      variable: varName,
      value: value,
      type: typeof value,
      length: value?.length || 0,
      source: this.findVariableSource(session, varName),
    };
  }

  /**
   * Find where variable was defined
   * @param {Object} session - Execution session
   * @param {string} varName - Variable name
   * @returns {string} - Variable source
   */
  findVariableSource(session, varName) {
    const currentFrame = session.state.stack[session.state.stack.length - 1];
    if (currentFrame.variables[varName] !== undefined) {
      return "local_variable";
    }

    if (session.state.memory.persistent_vars[varName] !== undefined) {
      return "persistent_memory";
    }

    if (session.state.heap.tool_outputs[varName] !== undefined) {
      return "tool_output";
    }

    return "unknown";
  }

  /**
   * Count total steps in program
   * @param {Object} program - Program object
   * @returns {number} - Total steps
   */
  countTotalSteps(program) {
    return program.procedures.reduce(
      (total, proc) => total + proc.steps.length,
      0
    );
  }

  /**
   * Estimate total execution duration
   * @param {Object} analysis - Analysis object
   * @returns {number} - Estimated duration in seconds
   */
  // ==================== SESSION MANAGEMENT ====================

  /**
   * Manage breakpoints (set/remove)
   * @param {string} sessionId - Session ID
   * @param {string} stepId - Step ID for breakpoint
   * @param {string} action - 'set' or 'remove'
   * @returns {Object} - Breakpoint result
   */
  async manageBreakpoint(sessionId, stepId, action) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      const breakpoints = session.state.breakpoints || [];

      if (action === "set" && !breakpoints.includes(stepId)) {
        breakpoints.push(stepId);
      } else if (action === "remove") {
        const index = breakpoints.indexOf(stepId);
        if (index > -1) {
          breakpoints.splice(index, 1);
        }
      }

      session.state.breakpoints = breakpoints;

      return {
        success: true,
        breakpoints: breakpoints,
        action: action,
        step_id: stepId,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get execution state for session
   * @param {string} sessionId - Session ID
   * @returns {Object|null} - Execution state
   */
  async getExecutionState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      success: true,
      state: session.state,
      metadata: {
        session_id: sessionId,
        created_at: session.createdAt.toISOString(),
        last_activity: session.lastActivity.toISOString(),
        total_steps_executed: session.totalStepsExecuted,
        command_history_length: session.commandHistory.length,
      },
    };
  }

  /**
   * Stop execution and cleanup session
   * @param {string} sessionId - Session ID
   * @returns {Object} - Stop result
   */
  async stopExecution(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: "Session not found",
      };
    }

    const deleted = this.sessions.delete(sessionId);

    return {
      success: true,
      stopped: deleted,
      session_id: sessionId,
      final_state: session.state.status,
      steps_executed: session.totalStepsExecuted,
    };
  }

  /**
   * Get list of active sessions
   * @returns {Array} - Active sessions
   */
  getActiveSessions() {
    return Array.from(this.sessions.values()).map((session) => ({
      id: session.id,
      created_at: session.createdAt.toISOString(),
      last_activity: session.lastActivity.toISOString(),
      status: session.state.status,
      program_name: session.program.name,
      current_procedure: session.state.current_step.procedure_id,
      steps_executed: session.totalStepsExecuted,
    }));
  }

  /**
   * Get health status of execution service
   * @returns {Object} - Health status
   */
  getHealthStatus() {
    const memoryUsage = process.memoryUsage();

    return {
      status: "healthy",
      activeSessions: this.sessions.size,
      maxConcurrentSessions: this.maxConcurrentSessions,
      memoryUsage: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      uptime: process.uptime(),
      commandTimeout: this.commandTimeout,
    };
  }

  /**
   * Create initial execution state
   * @param {Object} program - Program object
   * @param {Object} analysis - Analysis object
   * @returns {Object} - Initial state
   */
  createInitialState(program, analysis = null) {
    const firstProcedure = program.procedures[0];
    const firstStep = firstProcedure?.steps[0];

    return {
      status: "initialized",
      current_step: {
        procedure_id: firstProcedure?.id || "main",
        step_id: firstStep?.id || "start",
        step_index: 0,
        instruction_pointer: 0,
      },
      stack: [
        {
          procedure: firstProcedure?.id || "main",
          variables: {},
          return_address: null,
          created_at: new Date().toISOString(),
        },
      ],
      heap: {
        tool_outputs: {},
        temp_objects: {},
      },
      memory: {
        persistent_vars: {},
        token_usage: {
          total_tokens: 0,
          input_tokens: 0,
          output_tokens: 0,
          cost_estimate: "$0.00",
        },
      },
      execution_history: [],
      breakpoints: [],
      error_state: null,
      started_at: new Date().toISOString(),
      analysis_summary: analysis
        ? {
            program_intent: analysis.program_intent,
            confidence: analysis.confidence,
            risk_level: analysis.risk_assessment?.overall_risk || "unknown",
            total_procedures: analysis.procedures?.length || 0,
            total_entities: analysis.global_entities?.length || 0,
          }
        : null,
    };
  }

  /**
   * Cleanup inactive sessions (older than 1 hour)
   */
  cleanupInactiveSessions() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity < oneHourAgo) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Get detailed session information
   * @param {string} sessionId - Session ID
   * @returns {Object|null} - Detailed session info
   */
  getSessionDetails(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      id: session.id,
      program: {
        name: session.program.name,
        version: session.program.version,
        procedures: session.program.procedures.length,
        tools: session.program.tools,
      },
      analysis: session.analysis
        ? {
            program_intent: session.analysis.program_intent,
            confidence: session.analysis.confidence,
            risk_level: session.analysis.risk_assessment?.overall_risk,
          }
        : null,
      state: session.state,
      options: session.options,
      created_at: session.createdAt.toISOString(),
      last_activity: session.lastActivity.toISOString(),
      total_steps_executed: session.totalStepsExecuted,
      command_history: session.commandHistory.slice(-10), // Last 10 commands
    };
  }
}

module.exports = ExecutionService;
