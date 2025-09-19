const express = require("express");
const router = express.Router();
const ExecutionService = require("../../services/ExecutionService");
const { validateRequest } = require("../middleware/validation");
const { executionSchema } = require("../middleware/schemas");

const executionService = new ExecutionService();

/**
 * POST /api/execution/start
 * Initialize program execution
 */
router.post(
  "/start",
  validateRequest(executionSchema.start),
  async (req, res, next) => {
    try {
      const { program, analysis } = req.body;

      console.log("🚀 Starting program execution");

      const result = await executionService.startExecution(program, analysis);

      console.log(`✅ Execution started with ID: ${result.execution_id}`);
      res.json({
        success: true,
        execution_id: result.execution_id,
        state: result.state,
        metadata: {
          procedures: program.procedures.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Execution start error:", error);
      next(error);
    }
  }
);

/**
 * POST /api/execution/step
 * Execute single step or debugging command
 */
router.post(
  "/step",
  validateRequest(executionSchema.step),
  async (req, res, next) => {
    try {
      const { execution_id, command } = req.body;

      console.log(
        `🔧 Executing command: ${command} for session ${execution_id}`
      );

      const result = await executionService.executeStep(execution_id, command);

      res.json({
        success: true,
        state: result.state,
        metadata: {
          command_executed: command,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Execution step error:", error);
      next(error);
    }
  }
);

/**
 * POST /api/execution/breakpoint
 * Set or remove breakpoints
 */
router.post(
  "/breakpoint",
  validateRequest(executionSchema.breakpoint),
  async (req, res, next) => {
    try {
      const { execution_id, step_id, action } = req.body;

      console.log(
        `🔴 ${action} breakpoint at ${step_id} for session ${execution_id}`
      );

      const result = await executionService.manageBreakpoint(
        execution_id,
        step_id,
        action
      );

      res.json({
        success: true,
        breakpoints: result.breakpoints,
        metadata: {
          action_performed: action,
          step_id: step_id,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Breakpoint management error:", error);
      next(error);
    }
  }
);

/**
 * GET /api/execution/state/:execution_id
 * Get current execution state
 */
router.get("/state/:execution_id", async (req, res, next) => {
  try {
    const { execution_id } = req.params;

    const state = await executionService.getExecutionState(execution_id);

    if (!state) {
      return res.status(404).json({
        success: false,
        error: "Execution session not found",
        execution_id: execution_id,
      });
    }

    res.json({
      success: true,
      state: state,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get execution state error:", error);
    next(error);
  }
});

/**
 * DELETE /api/execution/:execution_id
 * Stop and cleanup execution session
 */
router.delete("/:execution_id", async (req, res, next) => {
  try {
    const { execution_id } = req.params;

    console.log(`🛑 Stopping execution session: ${execution_id}`);

    const result = await executionService.stopExecution(execution_id);

    res.json({
      success: true,
      message: "Execution session stopped and cleaned up",
      execution_id: execution_id,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Stop execution error:", error);
    next(error);
  }
});

/**
 * GET /api/execution/sessions
 * Get all active execution sessions (for debugging)
 */
router.get("/sessions", async (req, res, next) => {
  try {
    const sessions = executionService.getActiveSessions();

    res.json({
      success: true,
      sessions: sessions,
      metadata: {
        session_count: sessions.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    next(error);
  }
});

/**
 * GET /api/execution/health
 * Health check for execution service
 */
router.get("/health", (req, res) => {
  const healthStatus = executionService.getHealthStatus();

  res.json({
    service: "execution",
    status: healthStatus.status,
    active_sessions: healthStatus.activeSessions,
    memory_usage: healthStatus.memoryUsage,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
