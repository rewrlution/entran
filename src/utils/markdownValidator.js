/**
 * Markdown validation utilities
 */

/**
 * Validate markdown syntax for common issues
 * @param {string} markdown - Raw markdown content
 * @returns {Object} - Validation result with errors
 */
function validateMarkdownSyntax(markdown) {
  const errors = [];
  const lines = markdown.split("\n");

  // Track state
  let inCodeBlock = false;
  let codeBlockStart = -1;
  let headerLevels = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Check code blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        codeBlockStart = -1;
      } else {
        inCodeBlock = true;
        codeBlockStart = lineNum;
      }
    }

    // Check headers
    const headerMatch = line.match(/^(#{1,6})\s*(.*)$/);
    if (headerMatch && !inCodeBlock) {
      const level = headerMatch[1].length;
      const text = headerMatch[2].trim();

      if (!text) {
        errors.push({
          line: lineNum,
          type: "empty_header",
          message: "Header text cannot be empty",
          suggestion: "Add descriptive text after the # symbols",
        });
      }

      // Check header hierarchy
      if (headerLevels.length > 0) {
        const lastLevel = headerLevels[headerLevels.length - 1];
        if (level > lastLevel + 1) {
          errors.push({
            line: lineNum,
            type: "header_skip",
            message: `Header level ${level} skips intermediate levels`,
            suggestion: `Use H${
              lastLevel + 1
            } instead of H${level} for proper hierarchy`,
          });
        }
      }

      headerLevels.push(level);
    }

    // Check list items
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s*(.*)$/);
    if (listMatch && !inCodeBlock) {
      const content = listMatch[3].trim();
      if (!content) {
        errors.push({
          line: lineNum,
          type: "empty_list_item",
          message: "List item cannot be empty",
          suggestion: "Add content to the list item",
        });
      }
    }

    // Check links
    const linkMatches = line.match(/\[([^\]]*)\]\(([^)]*)\)/g);
    if (linkMatches && !inCodeBlock) {
      linkMatches.forEach((match) => {
        const parts = match.match(/\[([^\]]*)\]\(([^)]*)\)/);
        if (parts) {
          const text = parts[1];
          const url = parts[2];

          if (!text.trim()) {
            errors.push({
              line: lineNum,
              type: "empty_link_text",
              message: "Link text cannot be empty",
              suggestion: "Add descriptive text between the square brackets",
            });
          }

          if (!url.trim()) {
            errors.push({
              line: lineNum,
              type: "empty_link_url",
              message: "Link URL cannot be empty",
              suggestion: "Add a valid URL between the parentheses",
            });
          }
        }
      });
    }

    // Check for unmatched emphasis
    const emphasisMatches = line.match(/(\*\*?|__?)/g);
    if (emphasisMatches && !inCodeBlock) {
      let boldCount = 0;
      let italicCount = 0;

      emphasisMatches.forEach((match) => {
        if (match === "**" || match === "__") {
          boldCount++;
        } else if (match === "*" || match === "_") {
          italicCount++;
        }
      });

      if (boldCount % 2 !== 0) {
        errors.push({
          line: lineNum,
          type: "unmatched_bold",
          message: "Unmatched bold emphasis markers",
          suggestion: "Ensure ** or __ markers are properly paired",
        });
      }

      if (italicCount % 2 !== 0) {
        errors.push({
          line: lineNum,
          type: "unmatched_italic",
          message: "Unmatched italic emphasis markers",
          suggestion: "Ensure * or _ markers are properly paired",
        });
      }
    }
  });

  // Check for unclosed code blocks
  if (inCodeBlock) {
    errors.push({
      line: codeBlockStart,
      type: "unclosed_code_block",
      message: "Code block is not properly closed",
      suggestion: "Add closing ``` to end the code block",
    });
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

/**
 * Extract troubleshooting-specific patterns
 * @param {string} markdown - Raw markdown content
 * @returns {Object} - Extracted patterns
 */
function extractTroubleshootingPatterns(markdown) {
  const patterns = {
    commands: [],
    conditions: [],
    variables: [],
    tools: [],
  };

  const lines = markdown.split("\n");
  let inCodeBlock = false;

  lines.forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (!inCodeBlock) {
      // Extract commands from inline code
      const codeMatches = line.match(/`([^`]+)`/g);
      if (codeMatches) {
        codeMatches.forEach((match) => {
          const command = match.slice(1, -1); // Remove backticks
          if (isCommand(command)) {
            patterns.commands.push({
              command: command,
              line: index + 1,
              tool: extractTool(command),
            });
          }
        });
      }

      // Extract conditional patterns
      const conditionMatch = line.match(
        /\b(if|when|unless)\s+(.+?)\s*[,:]?\s*(then)?\s*(.+)?/i
      );
      if (conditionMatch) {
        patterns.conditions.push({
          condition: conditionMatch[2],
          action: conditionMatch[4] || "",
          line: index + 1,
        });
      }

      // Extract emphasized text as potential variables
      const variableMatches = line.match(/\*\*([^*]+)\*\*/g);
      if (variableMatches) {
        variableMatches.forEach((match) => {
          const variable = match.slice(2, -2); // Remove **
          patterns.variables.push({
            name: variable,
            line: index + 1,
          });
        });
      }
    } else {
      // Extract commands from code blocks
      const trimmed = line.trim();
      if (trimmed && isCommand(trimmed)) {
        patterns.commands.push({
          command: trimmed,
          line: index + 1,
          tool: extractTool(trimmed),
        });
      }
    }
  });

  return patterns;
}

/**
 * Check if a string looks like a command
 * @param {string} text - Text to check
 * @returns {boolean} - True if looks like a command
 */
function isCommand(text) {
  const commandPatterns = [
    /^[a-z][a-z0-9_-]*(\s+.+)?$/i, // Basic command pattern
    /^[a-z][a-z0-9_-]*\s+[a-z][a-z0-9_-]*(\s+.+)?$/i, // command subcommand
    /^sudo\s+/i, // sudo commands
    /^\w+\s+--?\w+/i, // commands with flags
  ];

  return commandPatterns.some((pattern) => pattern.test(text.trim()));
}

/**
 * Extract tool name from command
 * @param {string} command - Command string
 * @returns {string} - Tool name
 */
function extractTool(command) {
  const parts = command.trim().split(/\s+/);
  let tool = parts[0];

  // Handle sudo
  if (tool === "sudo" && parts.length > 1) {
    tool = parts[1];
  }

  return tool;
}

/**
 * Validate troubleshooting document structure
 * @param {Object} ast - Parsed AST
 * @returns {Object} - Validation result
 */
function validateTroubleshootingStructure(ast) {
  const errors = [];
  const warnings = [];

  // Check for document title (H1)
  const titles = ast.children.filter(
    (child) => child.type === "heading" && child.level === 1
  );

  if (titles.length === 0) {
    warnings.push({
      type: "missing_title",
      message: "Document should have an H1 title",
      suggestion: "Add a descriptive title using # at the beginning",
    });
  } else if (titles.length > 1) {
    warnings.push({
      type: "multiple_titles",
      message: "Document has multiple H1 titles",
      suggestion: "Use only one H1 for the main title",
    });
  }

  // Check for procedures (H2)
  const procedures = ast.children.filter(
    (child) => child.type === "heading" && child.level === 2
  );

  if (procedures.length === 0) {
    errors.push({
      type: "no_procedures",
      message: "Document must contain at least one procedure (H2 section)",
      suggestion: "Add H2 headers to define troubleshooting procedures",
    });
  }

  // Validate each procedure
  procedures.forEach((procedure) => {
    const procedureErrors = validateProcedure(procedure);
    errors.push(...procedureErrors);
  });

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
  };
}

/**
 * Validate individual procedure structure
 * @param {Object} procedure - Procedure AST node
 * @returns {Array} - Array of errors
 */
function validateProcedure(procedure) {
  const errors = [];

  // Check for steps (ordered lists)
  const hasSteps = procedure.children.some(
    (child) => child.type === "list" && child.ordered
  );

  if (!hasSteps) {
    errors.push({
      line: procedure.line,
      type: "no_steps",
      message: `Procedure "${procedure.text}" has no numbered steps`,
      suggestion: "Add numbered list items to define procedure steps",
    });
  }

  // Check for commands in steps
  const hasCommands = procedure.children.some((child) => {
    if (child.type === "list") {
      return child.items.some(
        (item) => item.text.includes("`") || item.raw.includes("```")
      );
    }
    return false;
  });

  if (!hasCommands) {
    errors.push({
      line: procedure.line,
      type: "no_commands",
      message: `Procedure "${procedure.text}" contains no executable commands`,
      suggestion: "Add commands in backticks or code blocks",
    });
  }

  return errors;
}

module.exports = {
  validateMarkdownSyntax,
  extractTroubleshootingPatterns,
  validateTroubleshootingStructure,
  isCommand,
  extractTool,
};
