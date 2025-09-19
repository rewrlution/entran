# Web Application Architecture

## Overview

The ENTRAN web application provides a complete development environment for writing, compiling, and executing English-based troubleshooting programs with a familiar debugger interface.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/JS)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ Markdown    │ │ Transpiled  │ │ Semantic    │ │ Debug   │ │
│  │ Editor      │ │ Code View   │ │ Analysis    │ │ Control │ │
│  │             │ │             │ │ Panel       │ │ Panel   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ Error       │ │ State       │ │ Memory      │ │ Output  │ │
│  │ Display     │ │ Visualizer  │ │ Monitor     │ │ Console │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│                       API Gateway                           │
├─────────────────────────────────────────────────────────────┤
│                   Backend Services (Node.js)                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ Lexer       │ │ Transpiler  │ │ Semantic    │ │ Runtime │ │
│  │ Service     │ │ Service     │ │ Analyzer    │ │ Engine  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ Tool        │ │ Memory      │ │ Session     │ │ LLM     │ │
│  │ Registry    │ │ Manager     │ │ Manager     │ │ Client  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ Session     │ │ Execution   │ │ Tool        │ │ Program │ │
│  │ Store       │ │ State       │ │ Outputs     │ │ Cache   │ │
│  │ (Redis)     │ │ (Memory)    │ │ (Memory)    │ │ (Memory)│ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Components

### Main Application Layout

```javascript
// App.js - Main application component
function App() {
  const [currentStage, setCurrentStage] = useState("edit");
  const [program, setProgram] = useState(null);
  const [executionState, setExecutionState] = useState(null);

  return (
    <div className="app">
      <Header />
      <div className="main-content">
        <div className="left-panel">
          <MarkdownEditor
            onTextChange={handleMarkdownChange}
            stage={currentStage}
          />
          <ErrorDisplay errors={errors} />
        </div>

        <div className="center-panel">
          {currentStage === "transpiled" && (
            <TranspiledCodeView program={program} />
          )}
          {currentStage === "analyzed" && (
            <SemanticAnalysisPanel analysis={analysis} />
          )}
          {currentStage === "debug" && (
            <DebugInterface
              program={program}
              executionState={executionState}
              onDebugCommand={handleDebugCommand}
            />
          )}
        </div>

        <div className="right-panel">
          <StageSelector
            currentStage={currentStage}
            onStageChange={setCurrentStage}
          />
          <StateMonitor state={executionState} />
          <MemoryViewer memory={executionState?.memory} />
          <OutputConsole outputs={toolOutputs} />
        </div>
      </div>
    </div>
  );
}
```

### Markdown Editor Component

```javascript
// components/MarkdownEditor.js
import MonacoEditor from "@monaco-editor/react";

function MarkdownEditor({ onTextChange, stage }) {
  const [value, setValue] = useState("");
  const [annotations, setAnnotations] = useState([]);

  const handleEditorChange = (newValue) => {
    setValue(newValue);
    onTextChange(newValue);

    // Real-time parsing and error checking
    debounce(parseMarkdown, 500)(newValue);
  };

  const parseMarkdown = async (text) => {
    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: text }),
      });
      const result = await response.json();

      if (!result.success) {
        setAnnotations(
          result.errors.map((error) => ({
            startLineNumber: error.line,
            endLineNumber: error.line,
            startColumn: 1,
            endColumn: 100,
            message: error.message,
            severity: monaco.MarkerSeverity.Error,
          }))
        );
      } else {
        setAnnotations([]);
      }
    } catch (error) {
      console.error("Parse error:", error);
    }
  };

  return (
    <MonacoEditor
      height="400px"
      language="markdown"
      value={value}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: false },
        lineNumbers: "on",
        wordWrap: "on",
        automaticLayout: true,
      }}
      beforeMount={(monaco) => {
        // Register custom markdown syntax highlighting
        registerTroubleshootingHighlighting(monaco);
      }}
    />
  );
}
```

### Debug Interface Component

```javascript
// components/DebugInterface.js
function DebugInterface({ program, executionState, onDebugCommand }) {
  const [selectedStep, setSelectedStep] = useState(null);
  const [breakpoints, setBreakpoints] = useState(new Set());

  const handleStepCommand = (command) => {
    onDebugCommand({ type: command, execution_id: executionState.id });
  };

  const toggleBreakpoint = (stepId) => {
    const newBreakpoints = new Set(breakpoints);
    if (newBreakpoints.has(stepId)) {
      newBreakpoints.delete(stepId);
    } else {
      newBreakpoints.add(stepId);
    }
    setBreakpoints(newBreakpoints);

    onDebugCommand({
      type: "breakpoint",
      execution_id: executionState.id,
      step_id: stepId,
      action: newBreakpoints.has(stepId) ? "set" : "remove",
    });
  };

  return (
    <div className="debug-interface">
      <div className="debug-controls">
        <button
          onClick={() => handleStepCommand("step_over")}
          disabled={executionState.status !== "paused"}
          title="Step Over (F10)"
        >
          ⏭️ Step Over
        </button>
        <button
          onClick={() => handleStepCommand("step_into")}
          disabled={executionState.status !== "paused"}
          title="Step Into (F11)"
        >
          ⬇️ Step Into
        </button>
        <button
          onClick={() => handleStepCommand("step_out")}
          disabled={executionState.status !== "paused"}
          title="Step Out (Shift+F11)"
        >
          ⬆️ Step Out
        </button>
        <button
          onClick={() => handleStepCommand("continue")}
          disabled={executionState.status !== "paused"}
          title="Continue (F5)"
        >
          ▶️ Continue
        </button>
        <button onClick={() => handleStepCommand("reset")} title="Reset">
          🔄 Reset
        </button>
      </div>

      <div className="annotated-program">
        <AnnotatedMarkdown
          program={program}
          executionState={executionState}
          breakpoints={breakpoints}
          onBreakpointToggle={toggleBreakpoint}
          onStepSelect={setSelectedStep}
        />
      </div>
    </div>
  );
}
```

## Backend Services

### API Gateway (Express.js)

```javascript
// server/app.js
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const lexerRoutes = require("./routes/lexer");
const transpilerRoutes = require("./routes/transpiler");
const analyzerRoutes = require("./routes/analyzer");
const executionRoutes = require("./routes/execution");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  })
);

// Routes
app.use("/api", lexerRoutes);
app.use("/api", transpilerRoutes);
app.use("/api", analyzerRoutes);
app.use("/api", executionRoutes);

// Error handling
app.use((error, req, res, next) => {
  console.error("API Error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

module.exports = app;
```

### Lexer Service

```javascript
// services/LexerService.js
const marked = require("marked");
const { validateMarkdown } = require("../utils/validation");

class LexerService {
  parse(markdown) {
    try {
      // Configure marked for our specific needs
      const renderer = new marked.Renderer();
      const tokens = marked.lexer(markdown);

      // Validate syntax
      const errors = validateMarkdown(tokens);
      if (errors.length > 0) {
        return { success: false, errors };
      }

      // Build AST
      const ast = this.buildAST(tokens);
      return { success: true, ast };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            line: 1,
            message: `Parse error: ${error.message}`,
            type: "syntax_error",
          },
        ],
      };
    }
  }

  buildAST(tokens) {
    const ast = {
      type: "document",
      children: [],
      metadata: this.extractMetadata(tokens),
    };

    let currentSection = null;

    for (const token of tokens) {
      switch (token.type) {
        case "heading":
          if (token.depth === 1) {
            ast.children.push(this.createHeaderNode(token));
          } else if (token.depth === 2) {
            currentSection = this.createSectionNode(token);
            ast.children.push(currentSection);
          } else {
            if (currentSection) {
              currentSection.children.push(this.createSubsectionNode(token));
            }
          }
          break;
        case "list":
          if (currentSection) {
            currentSection.children.push(this.createListNode(token));
          }
          break;
        case "code":
          if (currentSection) {
            currentSection.children.push(this.createCodeNode(token));
          }
          break;
      }
    }

    return ast;
  }
}

module.exports = LexerService;
```

### Execution Runtime

```javascript
// services/ExecutionRuntime.js
const ToolExecutor = require("./ToolExecutor");
const MemoryManager = require("./MemoryManager");
const StateManager = require("./StateManager");

class ExecutionRuntime {
  constructor() {
    this.sessions = new Map();
    this.toolExecutor = new ToolExecutor();
  }

  async startExecution(program) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      program: program,
      state: new StateManager(),
      memory: new MemoryManager(),
      status: "initialized",
    };

    this.sessions.set(sessionId, session);

    // Initialize execution state
    session.state.initialize(program);

    return {
      execution_id: sessionId,
      state: session.state.getState(),
    };
  }

  async executeStep(sessionId, command) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    try {
      switch (command) {
        case "step_over":
          return await this.stepOver(session);
        case "step_into":
          return await this.stepInto(session);
        case "step_out":
          return await this.stepOut(session);
        case "continue":
          return await this.continue(session);
        case "reset":
          return this.reset(session);
        default:
          throw new Error(`Unknown command: ${command}`);
      }
    } catch (error) {
      session.state.setError(error);
      return { state: session.state.getState() };
    }
  }

  async stepOver(session) {
    const currentStep = session.state.getCurrentStep();

    if (currentStep.type === "command") {
      // Execute tool command
      const result = await this.toolExecutor.execute(
        currentStep.tool,
        currentStep.command,
        currentStep.parameters
      );

      // Store result in heap
      session.memory.storeToolOutput(currentStep.id, result);

      // Update variables if assignment specified
      if (currentStep.assign_to) {
        session.state.setVariable(currentStep.assign_to, result.output);
      }
    } else if (currentStep.type === "conditional") {
      // Evaluate condition
      const conditionResult = this.evaluateCondition(
        currentStep.condition,
        session.state
      );

      // Choose branch
      const nextStep = conditionResult
        ? currentStep.true_branch
        : currentStep.false_branch;

      if (nextStep) {
        session.state.pushStep(nextStep);
      }
    }

    session.state.advanceStep();
    return { state: session.state.getState() };
  }

  evaluateCondition(condition, state) {
    // Simple condition evaluation - can be extended
    const { variable, value } = condition;
    const variableValue = state.getVariable(variable);

    return variableValue === value;
  }
}

module.exports = ExecutionRuntime;
```

## Data Models

### Session Model

```javascript
// models/Session.js
class Session {
  constructor(id, userId = null) {
    this.id = id;
    this.userId = userId;
    this.createdAt = new Date();
    this.lastActivity = new Date();
    this.program = null;
    this.executionState = null;
    this.isActive = true;
  }

  updateActivity() {
    this.lastActivity = new Date();
  }

  serialize() {
    return {
      id: this.id,
      userId: this.userId,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      isActive: this.isActive,
    };
  }
}
```

### Program Model

```javascript
// models/Program.js
class Program {
  constructor(source, ast, transpiled, analyzed) {
    this.source = source;
    this.ast = ast;
    this.transpiled = transpiled;
    this.analyzed = analyzed;
    this.createdAt = new Date();
    this.hash = this.generateHash();
  }

  generateHash() {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(this.source).digest("hex");
  }

  validate() {
    return {
      hasSource: !!this.source,
      hasAST: !!this.ast,
      hasTranspiled: !!this.transpiled,
      hasAnalyzed: !!this.analyzed,
      isExecutable: !!(this.transpiled && this.analyzed),
    };
  }
}
```

## Deployment Configuration

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Environment Configuration

```yaml
# docker-compose.yml
version: "3.8"

services:
  entran-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - LLM_API_KEY=${LLM_API_KEY}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

## Performance Considerations

### Caching Strategy

- **Program Cache**: Cache transpiled and analyzed programs by source hash
- **Session Cache**: Store execution state in Redis for persistence
- **Tool Output Cache**: Cache tool execution results for repeated runs
- **AST Cache**: Cache parsed ASTs for syntax validation

### Scalability

- **Horizontal Scaling**: Stateless API design allows multiple instances
- **Session Affinity**: Use sticky sessions for debugging continuity
- **Resource Limits**: Implement execution timeouts and memory limits
- **Rate Limiting**: Prevent abuse with request rate limiting

### Security

- **Input Validation**: Sanitize all markdown input
- **Tool Sandboxing**: Restrict tool execution to safe commands
- **Session Management**: Secure session tokens and cleanup
- **CORS Configuration**: Restrict cross-origin requests appropriately

## Success Criteria

- Handle 100+ concurrent sessions efficiently
- Response times < 200ms for compilation stages
- Support programs up to 100KB in size
- Maintain 99.9% uptime for production deployment
- Provide real-time debugging experience with minimal latency
