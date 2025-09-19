const Joi = require("joi");

/**
 * Request validation middleware using Joi schemas
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const validationError = new Error("Request validation failed");
      validationError.name = "ValidationError";
      validationError.statusCode = 400;
      validationError.details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return next(validationError);
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Validate query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationError = new Error("Query validation failed");
      validationError.name = "ValidationError";
      validationError.statusCode = 400;
      validationError.details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return next(validationError);
    }

    req.query = value;
    next();
  };
};

/**
 * Validate URL parameters
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const validationError = new Error("Parameter validation failed");
      validationError.name = "ValidationError";
      validationError.statusCode = 400;
      validationError.details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        value: detail.context?.value,
      }));

      return next(validationError);
    }

    req.params = value;
    next();
  };
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
};
