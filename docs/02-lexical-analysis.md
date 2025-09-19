# Stage 1: Lexical Analysis and Parsing

## Overview

The first stage of the compilation process validates and parses markdown syntax from troubleshooting guides, ensuring the input document is well-formed before proceeding to transpilation.

## Functional Requirements

### FR-1.1: Markdown Input Validation

- **Description**: Accept markdown input via textarea and validate syntax
- **Input**: Raw markdown text from user
- **Output**: Parsed AST or syntax error messages
- **Behavior**:
  - Parse markdown using standard markdown parser (marked.js)
  - Identify syntax errors (malformed headers, lists, code blocks, etc.)
  - Provide line-by-line error reporting with suggestions

### FR-1.2: Document Structure Analysis

- **Description**: Analyze the hierarchical structure of the document
- **Requirements**:
  - Identify header levels (H1, H2, H3, etc.)
  - Map document sections and subsections
  - Validate logical structure (no orphaned subsections)
  - Extract metadata from frontmatter if present

### FR-1.3: Content Type Recognition

- **Description**: Recognize different types of content blocks
- **Content Types**:
  - Headers (procedure/method definitions)
  - Code blocks (tool commands)
  - Lists (step sequences)
  - Links (references)
  - Emphasis/bold text (important values)
  - Blockquotes (conditions or warnings)

### FR-1.4: Error Reporting Interface

- **Description**: Provide user-friendly error messages and fix suggestions
- **Features**:
  - Line number highlighting
  - Error type classification
  - Suggested fixes
  - Real-time validation as user types

## Technical Specifications

### Input Format

```markdown
# Troubleshooting Network Connectivity

## Check Network Interface Status

1. Run `ip addr show`
2. Look for interface state
3. If DOWN, bring interface up with `ip link set eth0 up`

## Verify DNS Resolution

- Test with `nslookup google.com`
- If fails, check `/etc/resolv.conf`
```

### Output Format (AST)

```json
{
  "type": "document",
  "children": [
    {
      "type": "heading",
      "level": 1,
      "text": "Troubleshooting Network Connectivity",
      "line": 1
    },
    {
      "type": "heading",
      "level": 2,
      "text": "Check Network Interface Status",
      "line": 3,
      "children": [
        {
          "type": "list",
          "ordered": true,
          "items": [
            { "text": "Run `ip addr show`", "line": 4 },
            { "text": "Look for interface state", "line": 5 },
            {
              "text": "If DOWN, bring interface up with `ip link set eth0 up`",
              "line": 6
            }
          ]
        }
      ]
    }
  ]
}
```

### Error Format

````json
{
  "errors": [
    {
      "line": 5,
      "column": 12,
      "type": "syntax_error",
      "message": "Unclosed code block",
      "suggestion": "Add closing ``` on line 7"
    }
  ]
}
````

## API Endpoints

### POST /api/parse

- **Purpose**: Parse markdown input and return AST or errors
- **Request Body**: `{ "markdown": "string" }`
- **Response**: `{ "success": boolean, "data": AST | errors }`

## UI Components

### Markdown Editor

- Monaco Editor with markdown syntax highlighting
- Real-time error highlighting
- Line numbers
- Auto-completion for common troubleshooting patterns

### Error Panel

- List of syntax errors with line numbers
- Click to jump to error location
- Suggested fixes with one-click apply

## Validation Rules

1. **Headers**: Must follow logical hierarchy (no H3 without H2)
2. **Code Blocks**: Must be properly closed
3. **Lists**: Consistent indentation and numbering
4. **Links**: Valid URL or reference format
5. **Special Patterns**: Recognize troubleshooting-specific patterns:
   - Conditional statements ("If X, then Y")
   - Command sequences
   - Variable references

## Success Criteria

- Parse valid markdown without errors
- Identify and report all syntax errors with helpful messages
- Generate complete AST for valid documents
- Handle large documents (>10KB) efficiently
- Provide real-time feedback (parsing within 500ms)
