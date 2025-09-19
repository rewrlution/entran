const { v4: uuidv4 } = require("uuid");

/**
 * Utility functions for the ENTRAN application
 */

/**
 * Generate a unique ID using UUID v4
 * @returns {string} - Unique identifier
 */
function generateId() {
  return uuidv4();
}

/**
 * Generate a short ID for use in procedures and steps
 * @returns {string} - Short unique identifier
 */
function generateShortId() {
  return uuidv4().substring(0, 8);
}

/**
 * Sanitize text for use in IDs (remove special characters, spaces)
 * @param {string} text - Input text
 * @returns {string} - Sanitized text suitable for IDs
 */
function sanitizeForId(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 32);
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} - True if empty
 */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Capitalize first letter of a string
 * @param {string} str - Input string
 * @returns {string} - Capitalized string
 */
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert camelCase to snake_case
 * @param {string} str - CamelCase string
 * @returns {string} - snake_case string
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase
 * @param {string} str - snake_case string
 * @returns {string} - camelCase string
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Format timestamp for display
 * @param {Date} date - Date object
 * @returns {string} - Formatted timestamp
 */
function formatTimestamp(date = new Date()) {
  return date.toISOString().replace("T", " ").substring(0, 19);
}

/**
 * Parse command line arguments into object
 * @param {string} command - Command string
 * @returns {Object} - Parsed arguments object
 */
function parseCommandArgs(command) {
  const parts = command.trim().split(/\s+/);
  const result = {
    tool: parts[0],
    args: [],
    flags: {},
  };

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith("-")) {
      const flagName = part.replace(/^-+/, "");
      const nextPart = parts[i + 1];

      if (nextPart && !nextPart.startsWith("-")) {
        result.flags[flagName] = nextPart;
        i++; // Skip next part
      } else {
        result.flags[flagName] = true;
      }
    } else {
      result.args.push(part);
    }
  }

  return result;
}

/**
 * Validate email format
 * @param {string} email - Email string
 * @returns {boolean} - True if valid email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sleep for specified milliseconds (for async operations)
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} - Promise with result or throws last error
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Safely parse JSON string
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} - Parsed object or default value
 */
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Truncate string to specified length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated string
 */
function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

/**
 * Extract file extension from filename
 * @param {string} filename - Filename
 * @returns {string} - File extension (without dot)
 */
function getFileExtension(filename) {
  if (!filename) return "";
  const lastDot = filename.lastIndexOf(".");
  return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : "";
}

/**
 * Check if a string is a valid URL
 * @param {string} str - String to check
 * @returns {boolean} - True if valid URL
 */
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Merge objects deeply
 * @param {Object} target - Target object
 * @param {...Object} sources - Source objects to merge
 * @returns {Object} - Merged object
 */
function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Check if value is an object (not array or null)
 * @param {*} item - Value to check
 * @returns {boolean} - True if object
 */
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

module.exports = {
  generateId,
  generateShortId,
  sanitizeForId,
  deepClone,
  isEmpty,
  capitalize,
  camelToSnake,
  snakeToCamel,
  formatTimestamp,
  parseCommandArgs,
  isValidEmail,
  sleep,
  retryWithBackoff,
  safeJsonParse,
  truncate,
  getFileExtension,
  isValidUrl,
  deepMerge,
  isObject,
};
