# Stage 4: Interpreter and Execution Engine

## Overview

Execute the semantically analyzed program with debugger-like controls, maintaining execution state through stack, heap, and memory management. Provide step-by-step execution with interactive debugging capabilities.

## Functional Requirements

### FR-4.1: Execution Engine

- **Description**: Execute the program step-by-step with full state management
- **Requirements**:
  - Step-by-step execution with pause/resume capability
  - Breakpoint support at procedure and step levels
  - Variable state tracking and modification
  - Tool invocation with result capture
  - Error handling and recovery

### FR-4.2: Memory Management

- **Description**: Manage program state using stack, heap, and persistent memory
- **Memory Types**:
  - **Stack**: Current execution context and local variables
  - **Heap**: Dynamic objects and intermediate results
  - **Memory**: Persistent variables marked with `set_memo`
  - **Token Usage**: Track LLM token consumption

### FR-4.3: Debugger Interface

- **Description**: Provide familiar debugging controls and visualization
- **Controls**:
  - `Step Over`: Execute current step and move to next
  - `Step Into`: Enter procedure calls for detailed execution
  - `Step Out`: Complete current procedure and return
  - `Continue`: Run until next breakpoint or completion
  - `Reset`: Restart program execution from beginning

### FR-4.4: State Visualization

- **Description**: Real-time visualization of program execution state
- **Components**:
  - Execution pointer showing current step
  - Variable values and type information
  - Memory usage and token consumption
  - Tool output and error messages
  - Execution timeline and history

## Execution State Model

```json
{
  "execution_state": {
    "status": "paused|running|completed|error",
    "current_step": {
      "procedure_id": "check_network_interface",
      "step_id": "step_2",
      "step_index": 1,
      "instruction_pointer": 15
    },
    "stack": [
      {
        "procedure": "main",
        "variables": {},
        "return_address": null
      },
      {
        "procedure": "check_network_interface",
        "variables": {
          "interface_list": {
            "type": "interface_list",
            "value": "eth0: UP, lo: UP",
            "created_at": "2025-09-19T10:30:00Z"
          },
          "interface_name": {
            "type": "string",
            "value": "eth0",
            "created_at": "2025-09-19T10:30:05Z"
          }
        },
        "return_address": "main:1"
      }
    ],
    "heap": {
      "tool_outputs": {
        "cmd_1": {
          "command": "ip addr show",
          "output": "1: lo: <LOOPBACK,UP,LOWER_UP>...",
          "timestamp": "2025-09-19T10:30:00Z",
          "exit_code": 0
        }
      },
      "temp_objects": {}
    },
    "memory": {
      "persistent_vars": {
        "network_status": "checking",
        "last_execution": "2025-09-19T10:29:00Z"
      },
      "token_usage": {
        "total_tokens": 1250,
        "input_tokens": 800,
        "output_tokens": 450,
        "cost_estimate": "$0.002"
      }
    },
    "execution_history": [
      {
        "step": "main:start",
        "timestamp": "2025-09-19T10:29:00Z",
        "action": "program_start"
      },
      {
        "step": "check_network_interface:step_1",
        "timestamp": "2025-09-19T10:30:00Z",
        "action": "command_executed",
        "result": "success"
      }
    ],
    "breakpoints": ["verify_dns:step_1"],
    "error_state": null
  }
}
```

## Debugger Controls Implementation

### Step Execution Functions

```javascript
class ProgramInterpreter {
  async stepOver() {
    // Execute current step and advance to next
    const currentStep = this.getCurrentStep();
    const result = await this.executeStep(currentStep);
    this.advanceInstructionPointer();
    return result;
  }

  async stepInto() {
    // If current step is procedure call, enter it
    const currentStep = this.getCurrentStep();
    if (currentStep.type === "procedure_call") {
      this.pushStackFrame(currentStep.procedure);
    } else {
      return this.stepOver();
    }
  }

  async stepOut() {
    // Complete current procedure and return to caller
    const currentFrame = this.getCurrentStackFrame();
    while (this.hasMoreSteps(currentFrame)) {
      await this.stepOver();
    }
    this.popStackFrame();
  }

  async continue() {
    // Run until breakpoint or completion
    while (!this.isAtBreakpoint() && !this.isComplete()) {
      await this.stepOver();
    }
  }

  reset() {
    // Reset to initial state
    this.stack = [{ procedure: "main", variables: {}, return_address: null }];
    this.heap = { tool_outputs: {}, temp_objects: {} };
    this.current_step = {
      procedure_id: "main",
      step_id: "start",
      step_index: 0,
    };
  }
}
```

### Tool Execution Integration

```javascript
class ToolExecutor {
  async executeCommand(tool, command, parameters) {
    const startTime = Date.now();

    try {
      // Simulate tool execution (in real implementation, use actual tools)
      const result = await this.simulateToolExecution(
        tool,
        command,
        parameters
      );

      // Store in heap
      const outputId = `cmd_${this.generateId()}`;
      this.heap.tool_outputs[outputId] = {
        command: `${tool} ${command}`,
        parameters: parameters,
        output: result.output,
        exit_code: result.exit_code,
        timestamp: new Date().toISOString(),
        execution_time: Date.now() - startTime,
      };

      // Update token usage if LLM was involved
      if (result.tokens_used) {
        this.memory.token_usage.total_tokens += result.tokens_used;
      }

      return { success: true, output_id: outputId, result: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

## UI Components

### Debugger Interface Layout

```html
<div class="debugger-interface">
  <!-- Code Panel -->
  <div class="code-panel">
    <div class="annotated-code">
      <!-- Color-coded markdown with execution pointer -->
    </div>
  </div>

  <!-- Control Panel -->
  <div class="control-panel">
    <button class="step-over">Step Over (F10)</button>
    <button class="step-into">Step Into (F11)</button>
    <button class="step-out">Step Out (Shift+F11)</button>
    <button class="continue">Continue (F5)</button>
    <button class="reset">Reset</button>
  </div>

  <!-- State Panel -->
  <div class="state-panel">
    <div class="stack-view">
      <h3>Call Stack</h3>
      <!-- Stack frames with variables -->
    </div>

    <div class="memory-view">
      <h3>Memory</h3>
      <!-- Persistent variables -->
    </div>

    <div class="heap-view">
      <h3>Tool Outputs</h3>
      <!-- Command results and temporary objects -->
    </div>

    <div class="token-usage">
      <h3>Token Usage</h3>
      <!-- LLM token consumption tracking -->
    </div>
  </div>
</div>
```

### Execution Pointer Visualization

```css
.execution-pointer {
  position: absolute;
  left: -20px;
  color: #ff4444;
  font-size: 16px;
}

.current-line {
  background-color: #fff3cd;
  border-left: 3px solid #ffc107;
}

.breakpoint-line {
  background-color: #f8d7da;
  border-left: 3px solid #dc3545;
}

.completed-line {
  background-color: #d4edda;
  border-left: 3px solid #28a745;
  opacity: 0.7;
}
```

## Memory Management

### Stack Frame Management

```javascript
class StackManager {
  pushFrame(procedure, parameters = {}) {
    const frame = {
      procedure: procedure,
      variables: { ...parameters },
      return_address: this.getCurrentAddress(),
      created_at: new Date().toISOString(),
    };
    this.stack.push(frame);
  }

  popFrame() {
    if (this.stack.length <= 1) {
      throw new Error("Cannot pop main frame");
    }
    return this.stack.pop();
  }

  setVariable(name, value, type) {
    const currentFrame = this.getCurrentFrame();
    currentFrame.variables[name] = {
      type: type,
      value: value,
      created_at: new Date().toISOString(),
    };
  }

  getVariable(name) {
    // Search from current frame up the stack
    for (let i = this.stack.length - 1; i >= 0; i--) {
      if (this.stack[i].variables[name]) {
        return this.stack[i].variables[name];
      }
    }
    return null;
  }
}
```

### Token Usage Tracking

```javascript
class TokenTracker {
  trackUsage(operation, inputTokens, outputTokens) {
    const usage = {
      operation: operation,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      timestamp: new Date().toISOString(),
      cost: this.calculateCost(inputTokens, outputTokens),
    };

    this.memory.token_usage.total_tokens += inputTokens + outputTokens;
    this.memory.token_usage.input_tokens += inputTokens;
    this.memory.token_usage.output_tokens += outputTokens;
    this.memory.token_usage.operations.push(usage);
  }

  calculateCost(inputTokens, outputTokens) {
    // GPT-4 pricing example
    const inputCostPer1k = 0.03;
    const outputCostPer1k = 0.06;
    return (
      (inputTokens / 1000) * inputCostPer1k +
      (outputTokens / 1000) * outputCostPer1k
    );
  }
}
```

## API Endpoints

### POST /api/execute/start

- **Purpose**: Initialize program execution
- **Request Body**: `{ "program": analyzed_program }`
- **Response**: `{ "execution_id": string, "state": execution_state }`

### POST /api/execute/step

- **Purpose**: Execute single step
- **Request Body**: `{ "execution_id": string, "command": "step_over|step_into|step_out|continue" }`
- **Response**: `{ "state": updated_execution_state }`

### POST /api/execute/breakpoint

- **Purpose**: Set or remove breakpoints
- **Request Body**: `{ "execution_id": string, "step_id": string, "action": "set|remove" }`
- **Response**: `{ "breakpoints": current_breakpoints }`

### GET /api/execute/state/:execution_id

- **Purpose**: Get current execution state
- **Response**: `{ "state": execution_state }`

## Error Handling

### Error Types

1. **Tool Execution Errors**: Command failures, timeouts
2. **Variable Errors**: Undefined variables, type mismatches
3. **Logic Errors**: Invalid conditions, unreachable code
4. **System Errors**: Resource exhaustion, permission issues

### Error Recovery Strategies

```javascript
class ErrorHandler {
  handleToolError(error, step) {
    // Log error and provide fallback options
    this.logError(error, step);

    // Offer user choices:
    return {
      options: [
        { action: "retry", description: "Retry the command" },
        { action: "skip", description: "Skip this step and continue" },
        { action: "abort", description: "Stop execution" },
        { action: "manual", description: "Provide manual input" },
      ],
    };
  }
}
```

## Success Criteria

- Execute programs step-by-step with full state tracking
- Provide responsive debugger controls (< 100ms response)
- Accurately track memory usage and token consumption
- Handle errors gracefully with recovery options
- Maintain execution history for analysis and replay
- Support concurrent executions for multiple users
