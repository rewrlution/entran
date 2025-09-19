const Joi = require("joi");

/**
 * Schema for markdown parsing requests
 */
const markdownSchema = Joi.object({
  markdown: Joi.string()
    .required()
    .max(1024 * 1024)
    .messages({
      "string.empty": "Markdown content cannot be empty",
      "string.max": "Markdown content cannot exceed 1MB",
      "any.required": "Markdown content is required",
    }),
});

/**
 * Schema for AST objects
 */
const astSchema = Joi.object({
  type: Joi.string().required(),
  children: Joi.array().items(Joi.object()).default([]),
  metadata: Joi.object().default({}),
}).unknown(true);

/**
 * Schema for transpilation requests
 */
const transpileSchema = Joi.object({
  ast: astSchema.required(),
  options: Joi.object({
    optimize: Joi.boolean().default(true),
    include_metadata: Joi.boolean().default(true),
    tool_validation: Joi.boolean().default(true),
  }).default({}),
});

/**
 * Schema for program objects
 */
const programSchema = Joi.object({
  name: Joi.string().required(),
  version: Joi.string().default("1.0"),
  tools: Joi.array().items(Joi.string()).required(),
  procedures: Joi.array().items(Joi.object()).required(),
  execution_order: Joi.array().items(Joi.string()).required(),
  global_memory: Joi.object().default({}),
  error_handling: Joi.object().default({}),
}).unknown(true);

/**
 * Schema for semantic analysis requests
 */
const analyzeSchema = Joi.object({
  program: programSchema.required(),
  markdown: Joi.string().when("annotate", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  analysis: Joi.object().when("annotate", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  options: Joi.object({
    include_confidence: Joi.boolean().default(true),
    extract_entities: Joi.boolean().default(true),
    generate_graph: Joi.boolean().default(true),
  }).default({}),
});

/**
 * Schemas for execution requests
 */
const executionSchema = {
  start: Joi.object({
    program: programSchema.required(),
    analysis: Joi.object().required(),
    options: Joi.object({
      debug_mode: Joi.boolean().default(true),
      timeout: Joi.number().integer().min(1000).max(300000).default(30000),
      memory_limit: Joi.number()
        .integer()
        .min(1024)
        .max(1024 * 1024 * 100)
        .default(1024 * 1024 * 10),
    }).default({}),
  }),

  step: Joi.object({
    execution_id: Joi.string().uuid().required(),
    command: Joi.string()
      .valid("step_over", "step_into", "step_out", "continue", "pause", "reset")
      .required(),
  }),

  breakpoint: Joi.object({
    execution_id: Joi.string().uuid().required(),
    step_id: Joi.string().required(),
    action: Joi.string().valid("set", "remove").required(),
  }),
};

/**
 * Schema for execution state updates
 */
const executionStateSchema = Joi.object({
  status: Joi.string()
    .valid("initialized", "running", "paused", "completed", "error")
    .required(),
  current_step: Joi.object({
    procedure_id: Joi.string().required(),
    step_id: Joi.string().required(),
    step_index: Joi.number().integer().min(0).required(),
    instruction_pointer: Joi.number().integer().min(0).required(),
  }).required(),
  stack: Joi.array()
    .items(
      Joi.object({
        procedure: Joi.string().required(),
        variables: Joi.object().required(),
        return_address: Joi.string().allow(null).required(),
        created_at: Joi.string().isoDate().required(),
      })
    )
    .required(),
  heap: Joi.object({
    tool_outputs: Joi.object().required(),
    temp_objects: Joi.object().required(),
  }).required(),
  memory: Joi.object({
    persistent_vars: Joi.object().required(),
    token_usage: Joi.object({
      total_tokens: Joi.number().integer().min(0).required(),
      input_tokens: Joi.number().integer().min(0).required(),
      output_tokens: Joi.number().integer().min(0).required(),
      cost_estimate: Joi.string().required(),
    }).required(),
  }).required(),
}).unknown(true);

/**
 * Common parameter schemas
 */
const parameterSchemas = {
  executionId: Joi.object({
    execution_id: Joi.string().uuid().required(),
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string()
      .valid("created_at", "updated_at", "name")
      .default("created_at"),
    order: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

module.exports = {
  markdownSchema,
  astSchema,
  transpileSchema,
  programSchema,
  analyzeSchema,
  executionSchema,
  executionStateSchema,
  parameterSchemas,
};
