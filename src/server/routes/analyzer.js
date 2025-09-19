const express = require("express");
const router = express.Router();
const AnalyzerService = require("../../services/AnalyzerService");
const { validateRequest } = require("../middleware/validation");
const { analyzeSchema } = require("../middleware/schemas");

const analyzerService = new AnalyzerService();

/**
 * POST /api/analyzer/analyze
 * Perform semantic analysis on transpiled program
 */
router.post(
  "/analyze",
  validateRequest(analyzeSchema),
  async (req, res, next) => {
    try {
      const { program } = req.body;

      console.log("🧠 Performing semantic analysis");

      const result = await analyzerService.analyze(program);

      if (result.success) {
        console.log(
          `✅ Analysis complete with ${result.analysis.procedures.length} procedures analyzed`
        );
        res.json({
          success: true,
          analysis: result.analysis,
          metadata: {
            procedures_analyzed: result.analysis.procedures.length,
            entities_found: result.analysis.global_entities.length,
            confidence: result.analysis.confidence || 0.9,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        console.log(`❌ Analysis errors: ${result.errors.length} errors`);
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
      console.error("Analyzer error:", error);
      next(error);
    }
  }
);

/**
 * POST /api/analyzer/annotate
 * Generate color-coded markdown with semantic annotations
 */
router.post(
  "/annotate",
  validateRequest(analyzeSchema),
  async (req, res, next) => {
    try {
      const { markdown, analysis } = req.body;

      console.log("🎨 Generating semantic annotations");

      const annotatedMarkdown = analyzerService.generateAnnotations(
        markdown,
        analysis
      );

      res.json({
        success: true,
        annotated_markdown: annotatedMarkdown,
        metadata: {
          annotation_count: analysis.procedures.reduce(
            (acc, proc) => acc + proc.steps.length,
            0
          ),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Annotation error:", error);
      next(error);
    }
  }
);

/**
 * POST /api/analyzer/extract-entities
 * Extract entities from program text
 */
router.post(
  "/extract-entities",
  validateRequest(analyzeSchema),
  async (req, res, next) => {
    try {
      const { program } = req.body;

      const entities = analyzerService.extractEntities(program);

      res.json({
        success: true,
        entities: entities,
        metadata: {
          entity_count: entities.length,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Entity extraction error:", error);
      next(error);
    }
  }
);

/**
 * GET /api/analyzer/color-scheme
 * Get semantic annotation color scheme
 */
router.get("/color-scheme", (req, res) => {
  const colorScheme = analyzerService.getColorScheme();

  res.json({
    success: true,
    color_scheme: colorScheme,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/analyzer/health
 * Health check for analyzer service
 */
router.get("/health", (req, res) => {
  res.json({
    service: "analyzer",
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
