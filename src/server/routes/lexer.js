const express = require("express");
const router = express.Router();
const LexerService = require("../../services/LexerService");
const { validateRequest } = require("../middleware/validation");
const { markdownSchema } = require("../middleware/schemas");

const lexerService = new LexerService();

/**
 * POST /api/lexer/parse
 * Parse markdown input and return AST or syntax errors
 */
router.post(
  "/parse",
  validateRequest(markdownSchema),
  async (req, res, next) => {
    try {
      const { markdown } = req.body;

      console.log(`📝 Parsing markdown (${markdown.length} characters)`);

      const result = await lexerService.parse(markdown);

      if (result.success) {
        console.log(
          `✅ Successfully parsed markdown with ${result.ast.children.length} sections`
        );
        res.json({
          success: true,
          ast: result.ast,
          metadata: {
            sections: result.ast.children.length,
            size: markdown.length,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        console.log(`❌ Parse errors found: ${result.errors.length} errors`);
        res.status(400).json({
          success: false,
          errors: result.errors,
          metadata: {
            error_count: result.errors.length,
            size: markdown.length,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error("Lexer parse error:", error);
      next(error);
    }
  }
);

/**
 * POST /api/lexer/validate
 * Validate markdown syntax without full parsing
 */
router.post(
  "/validate",
  validateRequest(markdownSchema),
  async (req, res, next) => {
    try {
      const { markdown } = req.body;

      const isValid = lexerService.validateSyntax(markdown);

      res.json({
        success: true,
        valid: isValid.valid,
        errors: isValid.errors || [],
        metadata: {
          size: markdown.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Lexer validation error:", error);
      next(error);
    }
  }
);

/**
 * GET /api/lexer/health
 * Health check for lexer service
 */
router.get("/health", (req, res) => {
  res.json({
    service: "lexer",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
