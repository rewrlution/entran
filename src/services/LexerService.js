const marked = require("marked");
const { validateMarkdownSyntax } = require("../utils/markdownValidator");

class LexerService {
  constructor() {
    this.configureRenderer();
  }

  /**
   * Configure marked.js renderer for our specific needs
   */
  configureRenderer() {
    this.renderer = new marked.Renderer();

    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: true,
      headerPrefix: "entran-",
      langPrefix: "language-",
      pedantic: false,
      sanitize: false,
      silent: false,
      smartLists: true,
      smartypants: false,
      xhtml: false,
    });
  }

  /**
   * Parse markdown input and return AST or syntax errors
   * @param {string} markdown - Raw markdown content
   * @returns {Object} - Result with success flag, AST or errors
   */
  async parse(markdown) {
    try {
      // First, validate basic syntax
      const validation = this.validateSyntax(markdown);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Parse tokens using marked lexer
      const tokens = marked.lexer(markdown);

      // Build structured AST
      const ast = this.buildAST(tokens, markdown);

      // Validate AST structure
      const astValidation = this.validateAST(ast);
      if (!astValidation.valid) {
        return {
          success: false,
          errors: astValidation.errors,
        };
      }

      return {
        success: true,
        ast: ast,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            line: 1,
            column: 1,
            type: "parse_error",
            message: `Parse error: ${error.message}`,
            suggestion: "Check markdown syntax for errors",
          },
        ],
      };
    }
  }

  /**
   * Validate markdown syntax without full parsing
   * @param {string} markdown - Raw markdown content
   * @returns {Object} - Validation result
   */
  validateSyntax(markdown) {
    try {
      const errors = [];
      const lines = markdown.split("\n");

      // Check for common syntax errors
      this.validateHeaders(lines, errors);
      this.validateCodeBlocks(lines, errors);
      this.validateLists(lines, errors);
      this.validateLinks(lines, errors);

      return {
        valid: errors.length === 0,
        errors: errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          {
            line: 1,
            type: "validation_error",
            message: `Validation error: ${error.message}`,
          },
        ],
      };
    }
  }

  /**
   * Build structured AST from marked tokens
   * @param {Array} tokens - Marked.js tokens
   * @param {string} originalMarkdown - Original markdown for line mapping
   * @returns {Object} - Structured AST
   */
  buildAST(tokens, originalMarkdown) {
    const ast = {
      type: "document",
      children: [],
      metadata: this.extractMetadata(tokens, originalMarkdown),
    };

    let currentSection = null;
    let currentSubsection = null;
    let lineNumber = 1;

    for (const token of tokens) {
      const astNode = this.tokenToASTNode(token, lineNumber);

      if (token.type === "heading") {
        if (token.depth === 1) {
          // Document title
          ast.children.push(astNode);
        } else if (token.depth === 2) {
          // New section (procedure)
          currentSection = {
            ...astNode,
            children: [],
          };
          ast.children.push(currentSection);
          currentSubsection = null;
        } else if (token.depth === 3) {
          // Subsection
          if (currentSection) {
            currentSubsection = {
              ...astNode,
              children: [],
            };
            currentSection.children.push(currentSubsection);
          }
        } else {
          // Deeper headers treated as content
          const target = currentSubsection || currentSection;
          if (target) {
            target.children.push(astNode);
          }
        }
      } else {
        // Regular content
        const target = currentSubsection || currentSection;
        if (target) {
          target.children.push(astNode);
        } else if (currentSection === null) {
          // Content before any H2 section
          ast.children.push(astNode);
        }
      }

      // Update line number based on token content
      if (token.raw) {
        lineNumber += (token.raw.match(/\n/g) || []).length;
      }
    }

    return ast;
  }

  /**
   * Convert marked token to AST node
   * @param {Object} token - Marked.js token
   * @param {number} lineNumber - Current line number
   * @returns {Object} - AST node
   */
  tokenToASTNode(token, lineNumber) {
    const baseNode = {
      type: token.type,
      line: lineNumber,
      raw: token.raw,
    };

    switch (token.type) {
      case "heading":
        return {
          ...baseNode,
          level: token.depth,
          text: token.text,
          id: this.generateHeaderId(token.text),
        };

      case "list":
        return {
          ...baseNode,
          ordered: token.ordered,
          start: token.start,
          items: token.items.map((item, index) => ({
            text: item.text,
            index: index + 1,
            raw: item.raw,
            tokens: item.tokens,
          })),
        };

      case "code":
        return {
          ...baseNode,
          lang: token.lang || "text",
          text: token.text,
          escaped: token.escaped,
        };

      case "blockquote":
        return {
          ...baseNode,
          text: token.text,
          tokens: token.tokens,
        };

      case "paragraph":
        return {
          ...baseNode,
          text: token.text,
          tokens: token.tokens,
        };

      case "text":
        return {
          ...baseNode,
          text: token.text,
        };

      default:
        return baseNode;
    }
  }

  /**
   * Generate header ID for linking
   * @param {string} text - Header text
   * @returns {string} - Generated ID
   */
  generateHeaderId(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
  }

  /**
   * Extract metadata from tokens and markdown
   * @param {Array} tokens - Marked.js tokens
   * @param {string} markdown - Original markdown
   * @returns {Object} - Metadata object
   */
  extractMetadata(tokens, markdown) {
    const metadata = {
      created_at: new Date().toISOString(),
      size: markdown.length,
      line_count: markdown.split("\n").length,
      sections: 0,
      procedures: 0,
      code_blocks: 0,
      lists: 0,
    };

    // Count different elements
    for (const token of tokens) {
      switch (token.type) {
        case "heading":
          if (token.depth === 1) metadata.sections++;
          if (token.depth === 2) metadata.procedures++;
          break;
        case "code":
          metadata.code_blocks++;
          break;
        case "list":
          metadata.lists++;
          break;
      }
    }

    return metadata;
  }

  /**
   * Validate AST structure for troubleshooting patterns
   * @param {Object} ast - Generated AST
   * @returns {Object} - Validation result
   */
  validateAST(ast) {
    const errors = [];

    // Check for at least one H2 section (procedure)
    const procedures = ast.children.filter(
      (child) => child.type === "heading" && child.level === 2
    );

    if (procedures.length === 0) {
      errors.push({
        line: 1,
        type: "structure_error",
        message: "Document must contain at least one H2 section (procedure)",
        suggestion: "Add H2 headers to define troubleshooting procedures",
      });
    }

    // Validate procedure structure
    for (const procedure of procedures) {
      this.validateProcedureStructure(procedure, errors);
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Validate individual procedure structure
   * @param {Object} procedure - Procedure AST node
   * @param {Array} errors - Errors array to append to
   */
  validateProcedureStructure(procedure, errors) {
    const hasSteps = procedure.children.some(
      (child) => child.type === "list" && child.ordered
    );

    if (!hasSteps) {
      errors.push({
        line: procedure.line,
        type: "procedure_error",
        message: `Procedure "${procedure.text}" should contain numbered steps`,
        suggestion: "Add numbered lists to define procedure steps",
      });
    }
  }

  /**
   * Validate header hierarchy
   * @param {Array} lines - Markdown lines
   * @param {Array} errors - Errors array
   */
  validateHeaders(lines, errors) {
    let lastHeaderLevel = 0;

    lines.forEach((line, index) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = headerMatch[2].trim();

        if (!text) {
          errors.push({
            line: index + 1,
            type: "header_error",
            message: "Header cannot be empty",
            suggestion: "Add text after the header markers",
          });
        }

        if (level > lastHeaderLevel + 1 && lastHeaderLevel > 0) {
          errors.push({
            line: index + 1,
            type: "header_hierarchy_error",
            message: `Header level ${level} follows level ${lastHeaderLevel} without intermediate levels`,
            suggestion: "Use proper header hierarchy (H1 -> H2 -> H3, etc.)",
          });
        }

        lastHeaderLevel = level;
      }
    });
  }

  /**
   * Validate code block syntax
   * @param {Array} lines - Markdown lines
   * @param {Array} errors - Errors array
   */
  validateCodeBlocks(lines, errors) {
    let inCodeBlock = false;
    let codeBlockStart = -1;

    lines.forEach((line, index) => {
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeBlockStart = index + 1;
        }
      }
    });

    if (inCodeBlock) {
      errors.push({
        line: codeBlockStart,
        type: "code_block_error",
        message: "Unclosed code block",
        suggestion: "Add closing ``` to end the code block",
      });
    }
  }

  /**
   * Validate list syntax
   * @param {Array} lines - Markdown lines
   * @param {Array} errors - Errors array
   */
  validateLists(lines, errors) {
    lines.forEach((line, index) => {
      const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      const unorderedMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);

      if (orderedMatch) {
        const indent = orderedMatch[1];
        const number = parseInt(orderedMatch[2]);
        const text = orderedMatch[3];

        if (!text.trim()) {
          errors.push({
            line: index + 1,
            type: "list_error",
            message: "List item cannot be empty",
            suggestion: "Add content to the list item",
          });
        }
      }

      if (unorderedMatch) {
        const text = unorderedMatch[2];

        if (!text.trim()) {
          errors.push({
            line: index + 1,
            type: "list_error",
            message: "List item cannot be empty",
            suggestion: "Add content to the list item",
          });
        }
      }
    });
  }

  /**
   * Validate link syntax
   * @param {Array} lines - Markdown lines
   * @param {Array} errors - Errors array
   */
  validateLinks(lines, errors) {
    lines.forEach((line, index) => {
      const linkMatches = line.match(/\[([^\]]*)\]\(([^)]*)\)/g);

      if (linkMatches) {
        linkMatches.forEach((match) => {
          const linkParts = match.match(/\[([^\]]*)\]\(([^)]*)\)/);
          const text = linkParts[1];
          const url = linkParts[2];

          if (!text.trim()) {
            errors.push({
              line: index + 1,
              type: "link_error",
              message: "Link text cannot be empty",
              suggestion: "Add descriptive text for the link",
            });
          }

          if (!url.trim()) {
            errors.push({
              line: index + 1,
              type: "link_error",
              message: "Link URL cannot be empty",
              suggestion: "Add a valid URL for the link",
            });
          }
        });
      }
    });
  }
}

module.exports = LexerService;
