const express = require("express");
const router = express.Router();
const OptimizerService = require("../../services/OptimizerService");
const { validateRequest } = require("../middleware/validation");
const Joi = require("joi");

const optimizerService = new OptimizerService();

/**
 * Schema for optimization requests
 */
const optimizeSchema = Joi.object({
  text: Joi.string()
    .required()
    .max(1024 * 1024)
    .messages({
      "string.empty": "Text content cannot be empty",
      "string.max": "Text content cannot exceed 1MB",
      "any.required": "Text content is required",
    }),
});

/**
 * POST /api/optimizer/optimize
 * Optimize human-friendly markdown for LLM processing
 */
router.post(
  "/optimize",
  validateRequest(optimizeSchema),
  async (req, res, next) => {
    try {
      const { text } = req.body;

      console.log(`🔧 Optimizing text (${text.length} characters)`);

      const result = await optimizerService.optimize(text);

      if (result.success) {
        console.log(
          `✅ Successfully optimized text: ${result.metadata.structure_improvements.length} improvements applied`
        );
        res.json({
          success: true,
          optimizedText: result.optimized_markdown,
          originalText: text,
          transformationsApplied: result.metadata.structure_improvements.length,
          analysis: result.analysis,
          metadata: result.metadata,
        });
      } else {
        console.log(`❌ Optimization failed: ${result.error}`);
        res.status(400).json({
          success: false,
          error: result.error,
          optimized_markdown: result.optimized_markdown,
          metadata: result.metadata,
        });
      }
    } catch (error) {
      console.error("💥 Optimizer route error:", error);
      next(error);
    }
  }
);

/**
 * GET /api/optimizer/patterns
 * Get available optimization patterns and examples
 */
router.get("/patterns", async (req, res) => {
  try {
    res.json({
      success: true,
      patterns: {
        input_examples: [
          "- test networking connectivity by pinging google",
          "- check the dns",
          "and you should be able to see the ping is within 100ms, and returns 200 and returns valid IP",
        ],
        supported_intents: [
          "network_troubleshooting",
          "system_diagnostics",
          "service_verification",
        ],
        recognized_commands: [
          "ping",
          "curl",
          "nslookup",
          "dig",
          "traceroute",
          "netstat",
          "ss",
          "ip",
          "ifconfig",
        ],
      },
    });
  } catch (error) {
    console.error("💥 Patterns route error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve optimization patterns",
    });
  }
});

module.exports = router;
