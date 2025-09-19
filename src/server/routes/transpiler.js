const express = require("express");
const router = express.Router();
const TranspilerService = require("../../services/TranspilerService");
const { validateRequest } = require("../middleware/validation");
const { transpileSchema } = require("../middleware/schemas");

const transpilerService = new TranspilerService();

/**
 * POST /api/transpiler/transpile
 * Convert parsed AST to transpiled program format
 */
router.post(
  "/transpile",
  validateRequest(transpileSchema),
  async (req, res, next) => {
    try {
      const { ast, options = {} } = req.body;

      console.log("🔄 Transpiling AST to program format");

      const result = await transpilerService.transpile(ast, options);

      if (result.success) {
        console.log(
          `✅ Successfully transpiled to program with ${result.program.procedures.length} procedures`
        );
        res.json({
          success: true,
          program: result.program,
          metadata: {
            procedures: result.program.procedures.length,
            tools_used: result.program.tools.length,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        console.log(`❌ Transpilation errors: ${result.errors.length} errors`);
        res.status(400).json({
          success: false,
          errors: result.errors,
          metadata: {
            error_count: result.errors.length,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Transpiler error:", error);
      next(error);
    }
  }
);

/**
 * GET /api/transpiler/tools
 * Get available tool registry
 */
router.get("/tools", (req, res, next) => {
  try {
    const toolRegistry = transpilerService.getToolRegistry();

    res.json({
      success: true,
      tools: toolRegistry,
      metadata: {
        tool_count: Object.keys(toolRegistry).length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Tool registry error:", error);
    next(error);
  }
});

/**
 * POST /api/transpiler/validate
 * Validate transpiled program format
 */
router.post(
  "/validate",
  validateRequest(transpileSchema),
  async (req, res, next) => {
    try {
      const { program } = req.body;

      const validation = transpilerService.validateProgram(program);

      res.json({
        success: true,
        valid: validation.valid,
        errors: validation.errors || [],
        warnings: validation.warnings || [],
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Program validation error:", error);
      next(error);
    }
  }
);

/**
 * GET /api/transpiler/health
 * Health check for transpiler service
 */
router.get("/health", (req, res) => {
  res.json({
    service: "transpiler",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
