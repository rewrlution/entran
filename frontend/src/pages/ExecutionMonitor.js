import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  StepForward,
  Square,
  Terminal,
  AlertTriangle,
  CheckCircle,
  Clock,
  SkipForward,
  Rewind,
  Settings,
  Download,
} from "lucide-react";
import axios from "axios";

function ExecutionMonitor() {
  const [session, setSession] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [executionLog, setExecutionLog] = useState([]);
  const [variables, setVariables] = useState({});
  const [debuggerOutput, setDebuggerOutput] = useState("");
  const terminalRef = useRef(null);

  const sampleProgram = {
    title: "Network Connectivity Troubleshooting",
    procedures: [
      {
        name: "basic_connectivity",
        steps: [
          {
            command: "ping google.com -c 3",
            description: "Test basic internet connectivity",
          },
          {
            command: "nslookup company.com",
            description: "Verify DNS resolution",
          },
          {
            command: "curl -I https://company.com",
            description: "Test HTTP connectivity",
          },
        ],
      },
      {
        name: "network_config",
        steps: [
          { command: "ip addr show", description: "Check IP configuration" },
          { command: "ip route", description: "Verify routing table" },
          {
            command: "sudo netstat -tulpn",
            description: "Check listening ports",
          },
        ],
      },
    ],
  };

  const debuggerCommands = [
    { name: "run", description: "Start execution" },
    { name: "step", description: "Execute next step" },
    { name: "continue", description: "Continue execution" },
    { name: "pause", description: "Pause execution" },
    { name: "stop", description: "Stop execution" },
    { name: "restart", description: "Restart program" },
    { name: "vars", description: "Show variables" },
    { name: "skip", description: "Skip current step" },
  ];

  useEffect(() => {
    // Simulate loading a session
    setSession({
      id: "session_123",
      program: sampleProgram,
      status: "ready",
      created: new Date().toISOString(),
    });

    // Initialize variables
    setVariables({
      $TARGET_HOST: "company.com",
      $TIMEOUT: "30",
      $LOG_FILE: "/tmp/network_test.log",
    });
  }, []);

  const addLogEntry = (type, message, step = null) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type,
      message,
      step,
      stepNumber: currentStep,
    };
    setExecutionLog((prev) => [...prev, entry]);
  };

  const handleStart = async () => {
    if (!session) return;

    setIsExecuting(true);
    setIsPaused(false);
    addLogEntry("info", "Starting program execution");

    try {
      const response = await axios.post("/api/executor/start", {
        program: session.program,
        sessionId: session.id,
      });

      addLogEntry("success", "Execution started successfully");
    } catch (error) {
      addLogEntry("error", "Failed to start execution: " + error.message);
      setIsExecuting(false);
    }
  };

  const handleStep = async () => {
    if (!session || !isExecuting) return;

    try {
      const response = await axios.post("/api/executor/step", {
        sessionId: session.id,
      });

      const currentProcedure =
        session.program.procedures[Math.floor(currentStep / 3)] ||
        session.program.procedures[0];
      const stepIndex = currentStep % 3;
      const step = currentProcedure.steps[stepIndex];

      if (step) {
        addLogEntry("info", `Executing: ${step.command}`, step);
        setDebuggerOutput(
          (prev) => prev + `\n$ ${step.command}\n> ${step.description}\n`
        );
        setCurrentStep((prev) => prev + 1);
      }
    } catch (error) {
      addLogEntry("error", "Step execution failed: " + error.message);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    addLogEntry("warning", "Execution paused");
  };

  const handleStop = () => {
    setIsExecuting(false);
    setIsPaused(false);
    setCurrentStep(0);
    addLogEntry("info", "Execution stopped");
    setDebuggerOutput("");
  };

  const handleContinue = () => {
    setIsPaused(false);
    addLogEntry("info", "Execution resumed");
  };

  const handleSkip = () => {
    setCurrentStep((prev) => prev + 1);
    addLogEntry("warning", "Step skipped");
  };

  const executeDebuggerCommand = (command) => {
    const cmd = command.toLowerCase().trim();

    switch (cmd) {
      case "run":
        handleStart();
        break;
      case "step":
        handleStep();
        break;
      case "continue":
        handleContinue();
        break;
      case "pause":
        handlePause();
        break;
      case "stop":
        handleStop();
        break;
      case "skip":
        handleSkip();
        break;
      case "vars":
        setDebuggerOutput(
          (prev) =>
            prev +
            "\nVariables:\n" +
            Object.entries(variables)
              .map(([k, v]) => `  ${k} = ${v}`)
              .join("\n") +
            "\n"
        );
        break;
      case "restart":
        handleStop();
        setTimeout(handleStart, 100);
        break;
      default:
        setDebuggerOutput((prev) => prev + `\nUnknown command: ${cmd}\n`);
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case "success":
        return "text-green-700 bg-green-50 border-green-200";
      case "error":
        return "text-red-700 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-700 bg-blue-50 border-blue-200";
    }
  };

  const getTotalSteps = () => {
    return (
      session?.program?.procedures?.reduce(
        (total, proc) => total + proc.steps.length,
        0
      ) || 0
    );
  };

  const getCurrentProcedure = () => {
    if (!session?.program?.procedures) return null;
    return (
      session.program.procedures[Math.floor(currentStep / 3)] ||
      session.program.procedures[0]
    );
  };

  const getCurrentStepInfo = () => {
    const procedure = getCurrentProcedure();
    if (!procedure) return null;
    const stepIndex = currentStep % 3;
    return procedure.steps[stepIndex];
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Execution Monitor
            </h1>
            <p className="text-gray-600">Debug and control program execution</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              Session: {session?.id || "None"}
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Execution Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStart}
              disabled={isExecuting}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4 mr-1" />
              Start
            </button>
            <button
              onClick={isPaused ? handleContinue : handlePause}
              disabled={!isExecuting}
              className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {isPaused ? (
                <Play className="h-4 w-4 mr-1" />
              ) : (
                <Pause className="h-4 w-4 mr-1" />
              )}
              {isPaused ? "Continue" : "Pause"}
            </button>
            <button
              onClick={handleStep}
              disabled={!isExecuting || !isPaused}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <StepForward className="h-4 w-4 mr-1" />
              Step
            </button>
            <button
              onClick={handleSkip}
              disabled={!isExecuting}
              className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip
            </button>
            <button
              onClick={handleStop}
              disabled={!isExecuting}
              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <Square className="h-4 w-4 mr-1" />
              Stop
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Step {currentStep} of {getTotalSteps()}
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${(currentStep / getTotalSteps()) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Program & Variables */}
        <div className="w-96 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-6">
            {/* Current Step */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Current Step
              </h3>
              {getCurrentStepInfo() ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-medium text-blue-900">
                    {getCurrentStepInfo().description}
                  </p>
                  <code className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded mt-2 block">
                    {getCurrentStepInfo().command}
                  </code>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No step executing
                </div>
              )}
            </div>

            {/* Variables */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Variables
              </h3>
              <div className="space-y-2">
                {Object.entries(variables).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <code className="text-sm font-medium text-gray-900">
                      {key}
                    </code>
                    <code className="text-sm text-gray-600">{value}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* Debugger Commands */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Quick Commands
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {debuggerCommands.map((cmd) => (
                  <button
                    key={cmd.name}
                    onClick={() => executeDebuggerCommand(cmd.name)}
                    className="text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                    title={cmd.description}
                  >
                    <code>{cmd.name}</code>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Terminal */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Terminal className="h-5 w-5 mr-2" />
              <span className="font-medium">Execution Terminal</span>
            </div>
            <button className="text-gray-400 hover:text-white">
              <Download className="h-4 w-4" />
            </button>
          </div>
          <div
            ref={terminalRef}
            className="flex-1 bg-gray-900 text-green-400 p-4 font-mono text-sm overflow-y-auto"
            style={{ minHeight: "400px" }}
          >
            <div className="whitespace-pre-wrap">
              {debuggerOutput ||
                "ENTRAN Execution Monitor\nType commands or use the control buttons above.\n\n"}
            </div>
          </div>
        </div>

        {/* Right Panel - Execution Log */}
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Execution Log
            </h3>
            <div className="space-y-2">
              {executionLog.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg border ${getLogColor(entry.type)}`}
                >
                  <div className="flex items-start">
                    {getLogIcon(entry.type)}
                    <div className="ml-2 flex-1">
                      <p className="text-sm font-medium">{entry.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                      {entry.step && (
                        <code className="text-xs bg-black bg-opacity-10 px-1 py-0.5 rounded mt-1 block">
                          {entry.step.command}
                        </code>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {executionLog.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No execution events yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExecutionMonitor;
