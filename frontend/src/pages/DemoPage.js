import React, { useState } from "react";
import {
  FileText,
  Code2,
  Brain,
  Zap,
  ChevronDown,
  ChevronRight,
  StepForward,
  RotateCcw,
} from "lucide-react";
import AceEditor from "react-ace";
import axios from "axios";

// Import ace modes and themes
import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/theme-github";

function DemoPage() {
  const [markdown, setMarkdown] = useState("");
  const [currentStage, setCurrentStage] = useState(0);
  const [stageResults, setStageResults] = useState({
    optimize: null,
    compile: null,
    transpile: null,
    analyze: null,
    execute: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionStep, setExecutionStep] = useState(0);
  const [executionLog, setExecutionLog] = useState([]);
  const [expandedStages, setExpandedStages] = useState({});

  const sampleMarkdown = `- test networking connectivity by pinging google
- check the dns resolution works properly  
- also verify http response times

and you should be able to see the ping is within 100ms, and http returns 200 status and dns resolves to valid IP address.

also make sure to check if the server is actually reachable and responding.`;

  const stages = [
    {
      id: "optimize",
      name: "Stage 1: Optimize",
      description: "Transform human notes to structured markdown",
      icon: RotateCcw,
      color: "indigo",
      endpoint: "http://localhost:3001/api/optimizer/optimize",
    },
    {
      id: "compile",
      name: "Stage 2: Compile",
      description: "Parse markdown into AST",
      icon: FileText,
      color: "blue",
      endpoint: "http://localhost:3001/api/lexer/compile",
    },
    {
      id: "transpile",
      name: "Stage 3: Transpile",
      description: "Convert AST to executable program",
      icon: Code2,
      color: "green",
      endpoint: "http://localhost:3001/api/transpiler/transpile",
    },
    {
      id: "analyze",
      name: "Stage 4: Analyze",
      description: "Extract semantic meaning",
      icon: Brain,
      color: "purple",
      endpoint: "http://localhost:3001/api/analyzer/analyze",
    },
    {
      id: "execute",
      name: "Stage 5: Execute",
      description: "Run program step-by-step",
      icon: Zap,
      color: "orange",
      endpoint: "http://localhost:3001/api/execution/start",
    },
  ];

  const handleLoadSample = () => {
    setMarkdown(sampleMarkdown);
    setStageResults({
      optimize: null,
      compile: null,
      transpile: null,
      analyze: null,
      execute: null,
    });
    setCurrentStage(0);
    setExecutionStep(0);
    setExecutionLog([]);
  };

  const handleRunStage = async (stageIndex) => {
    const stage = stages[stageIndex];
    setIsProcessing(true);

    try {
      let requestData;

      switch (stage.id) {
        case "optimize":
          requestData = { text: markdown };
          break;
        case "compile":
          // Use optimized text if available, otherwise original markdown
          const inputText = stageResults.optimize?.optimizedText || markdown;
          requestData = { markdown: inputText };
          break;
        case "transpile":
          if (!stageResults.compile) {
            throw new Error("Must compile first");
          }
          requestData = { ast: stageResults.compile.ast };
          break;
        case "analyze":
          if (!stageResults.transpile) {
            throw new Error("Must transpile first");
          }
          requestData = { program: stageResults.transpile.program };
          break;
        case "execute":
          if (!stageResults.analyze) {
            throw new Error("Must analyze first");
          }
          requestData = {
            program: stageResults.transpile.program,
            analysis: stageResults.analyze.analysis,
          };
          break;
        default:
          throw new Error(`Unknown stage: ${stage.id}`);
      }

      const response = await axios.post(stage.endpoint, requestData);

      setStageResults((prev) => ({
        ...prev,
        [stage.id]: response.data,
      }));

      setCurrentStage(stageIndex + 1);
      setExpandedStages((prev) => ({ ...prev, [stage.id]: true }));
    } catch (error) {
      console.error(`Stage ${stage.name} failed:`, error);
      alert(
        `Error in ${stage.name}: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteStep = () => {
    if (!stageResults.transpile?.program?.procedures) return;

    const program = stageResults.transpile.program;
    const allSteps = [];

    // Flatten all steps from all procedures
    program.procedures.forEach((proc) => {
      proc.steps?.forEach((step) => {
        allSteps.push({
          procedure: proc.name,
          ...step,
        });
      });
    });

    if (executionStep < allSteps.length) {
      const step = allSteps[executionStep];
      const logEntry = {
        step: executionStep + 1,
        procedure: step.procedure,
        command: step.command || step.description,
        type: step.type,
        timestamp: new Date().toLocaleTimeString(),
      };

      setExecutionLog((prev) => [...prev, logEntry]);
      setExecutionStep((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setStageResults({
      optimize: null,
      compile: null,
      transpile: null,
      analyze: null,
      execute: null,
    });
    setCurrentStage(0);
    setExecutionStep(0);
    setExecutionLog([]);
    setExpandedStages({});
  };

  const toggleStageExpansion = (stageId) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  const renderStageContent = (stage, result) => {
    if (!result) return null;

    switch (stage.id) {
      case "optimize":
        return (
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p>
              <strong>Transformations Applied:</strong>{" "}
              {result.transformationsApplied || 0}
            </p>
            <p>
              <strong>Structured Sections:</strong>{" "}
              {result.metadata?.sections || 0}
            </p>
            <div className="mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">
                    Original Input:
                  </h4>
                  <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32 border">
                    {result.originalText || "N/A"}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">
                    Optimized Output:
                  </h4>
                  <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32 border">
                    {result.optimizedText || "N/A"}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        );

      case "compile":
        return (
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p>
              <strong>AST Nodes:</strong> {result.ast?.children?.length || 0}
            </p>
            <p>
              <strong>Sections:</strong> {result.metadata?.sections || 0}
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-blue-600">
                View AST Structure
              </summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(result.ast, null, 2)}
              </pre>
            </details>
          </div>
        );

      case "transpile":
        return (
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p>
              <strong>Procedures:</strong>{" "}
              {result.program?.procedures?.length || 0}
            </p>
            <p>
              <strong>Tools:</strong>{" "}
              {result.program?.tools?.join(", ") || "None"}
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-green-600">
                View Program Structure
              </summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(result.program, null, 2)}
              </pre>
            </details>
          </div>
        );

      case "analyze":
        return (
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p>
              <strong>Intent:</strong>{" "}
              {result.analysis?.program_intent || "Unknown"}
            </p>
            <p>
              <strong>Confidence:</strong>{" "}
              {(result.analysis?.confidence * 100)?.toFixed(1) || 0}%
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-purple-600">
                View Analysis Details
              </summary>
              <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(result.analysis, null, 2)}
              </pre>
            </details>
          </div>
        );

      case "execute":
        return (
          <div className="bg-gray-50 p-3 rounded text-sm">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handleExecuteStep}
                disabled={!stageResults.transpile?.program}
                className="flex items-center px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 disabled:opacity-50"
              >
                <StepForward className="h-3 w-3 mr-1" />
                Step
              </button>
              <span className="text-xs text-gray-600">
                Step {executionStep} of{" "}
                {stageResults.transpile?.program?.procedures?.reduce(
                  (total, proc) => total + (proc.steps?.length || 0),
                  0
                ) || 0}
              </span>
            </div>

            <div className="bg-white rounded p-2 max-h-32 overflow-y-auto">
              {executionLog.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Click "Step" to execute program line by line
                </p>
              ) : (
                executionLog.map((log, i) => (
                  <div key={i} className="text-xs mb-1 p-1 bg-gray-50 rounded">
                    <span className="font-mono text-blue-600">
                      [{log.step}]
                    </span>
                    <span className="ml-2 text-gray-700">{log.command}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      ({log.timestamp})
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ENTRAN Demo - 5-Stage Pipeline
            </h1>
            <p className="text-gray-600">
              Transform human notes into executable programs through 5
              intelligent stages
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLoadSample}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Load Sample
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Editor */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h3 className="font-medium text-gray-900">Markdown Input</h3>
          </div>
          <div className="flex-1 p-4">
            <AceEditor
              mode="markdown"
              theme="github"
              value={markdown}
              onChange={setMarkdown}
              name="markdown-editor"
              width="100%"
              height="100%"
              fontSize={14}
              showPrintMargin={false}
              showGutter={true}
              highlightActiveLine={true}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: false,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 2,
                wrap: true,
              }}
              placeholder="Enter your troubleshooting markdown here...

# Title
## Problem Description  
## Diagnostic Steps
1. Step one
2. Step two
## Implementation
### Step 1
```bash
command here
```"
            />
          </div>
        </div>

        {/* Right Panel - Pipeline Stages */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-gray-100 px-4 py-2 border-b">
            <h3 className="font-medium text-gray-900">4-Stage Pipeline</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isCompleted = stageResults[stage.id] !== null;
              const isActive = currentStage === index;
              const canRun =
                index === 0 || stageResults[stages[index - 1].id] !== null;
              const isExpanded = expandedStages[stage.id];

              return (
                <div
                  key={stage.id}
                  className={`border rounded-lg ${
                    isCompleted
                      ? "border-green-300 bg-green-50"
                      : isActive
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Icon
                          className={`h-5 w-5 mr-3 ${
                            isCompleted
                              ? "text-green-600"
                              : isActive
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {stage.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {stage.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted && (
                          <button
                            onClick={() => toggleStageExpansion(stage.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleRunStage(index)}
                          disabled={!canRun || isProcessing || !markdown.trim()}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            isCompleted
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : canRun
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-300 text-gray-500"
                          } disabled:opacity-50`}
                        >
                          {isCompleted ? "Re-run" : "Run"}
                        </button>
                      </div>
                    </div>

                    {isCompleted && isExpanded && (
                      <div className="mt-4">
                        {renderStageContent(stage, stageResults[stage.id])}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoPage;
