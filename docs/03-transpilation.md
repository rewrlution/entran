# Stage 2: Transpilation to LLM-Optimized Format

## Overview

Transform the parsed markdown AST into a format optimized for LLM understanding, including tool definitions, step sequences, and contextual information.

## Functional Requirements

### FR-2.1: Tool Definition Extraction

- **Description**: Identify and catalog available tools from the document
- **Requirements**:
  - Extract command-line tools from code blocks
  - Map tool capabilities and parameters
  - Define tool usage patterns
  - Create tool registry for the execution environment

### FR-2.2: Step Sequence Transformation

- **Description**: Convert procedural steps into structured execution format
- **Requirements**:
  - Transform numbered/bulleted lists into step objects
  - Identify dependencies between steps
  - Extract conditions and branching logic
  - Map input/output relationships

### FR-2.3: Context Enrichment

- **Description**: Add metadata and context for better LLM understanding
- **Requirements**:
  - Add execution context to each step
  - Define variable scope and lifetime
  - Identify shared state and memory requirements
  - Add timing and dependency constraints

### FR-2.4: Format Optimization

- **Description**: Structure output for optimal LLM processing
- **Requirements**:
  - Use clear, consistent naming conventions
  - Add explicit type information
  - Include execution hints and constraints
  - Provide fallback and error handling information

## Tool Registry Format

### Available Tools

```json
{
  "tools": {
    "ip": {
      "name": "ip",
      "description": "Show/manipulate routing, network devices, interfaces",
      "commands": {
        "addr_show": {
          "syntax": "ip addr show [interface]",
          "output_type": "interface_list",
          "parameters": ["interface?"]
        },
        "link_set": {
          "syntax": "ip link set <interface> <state>",
          "output_type": "status",
          "parameters": ["interface", "state"]
        }
      }
    },
    "nslookup": {
      "name": "nslookup",
      "description": "DNS lookup utility",
      "commands": {
        "lookup": {
          "syntax": "nslookup <hostname>",
          "output_type": "dns_record",
          "parameters": ["hostname"]
        }
      }
    },
    "grep": {
      "name": "grep",
      "description": "Search text patterns",
      "commands": {
        "search": {
          "syntax": "grep <pattern> <file>",
          "output_type": "text_matches",
          "parameters": ["pattern", "file"]
        }
      }
    },
    "cat": {
      "name": "cat",
      "description": "Display file contents",
      "commands": {
        "display": {
          "syntax": "cat <file>",
          "output_type": "file_content",
          "parameters": ["file"]
        }
      }
    }
  }
}
```

## Transpiled Program Format

```json
{
  "program": {
    "name": "Troubleshooting Network Connectivity",
    "version": "1.0",
    "tools": ["ip", "nslookup", "grep", "cat"],
    "procedures": [
      {
        "id": "check_network_interface",
        "name": "Check Network Interface Status",
        "scope": "local",
        "variables": {
          "interface_name": "string",
          "interface_state": "string"
        },
        "steps": [
          {
            "id": "step_1",
            "type": "command",
            "tool": "ip",
            "command": "addr_show",
            "parameters": {},
            "expected_output": "interface_list",
            "assign_to": "interface_list",
            "description": "Get all network interfaces"
          },
          {
            "id": "step_2",
            "type": "analysis",
            "input": "interface_list",
            "condition": "look for interface state",
            "extract": ["interface_name", "interface_state"],
            "description": "Parse interface status from output"
          },
          {
            "id": "step_3",
            "type": "conditional",
            "condition": "interface_state == 'DOWN'",
            "true_branch": {
              "type": "command",
              "tool": "ip",
              "command": "link_set",
              "parameters": {
                "interface": "$interface_name",
                "state": "up"
              },
              "description": "Bring interface up"
            },
            "false_branch": {
              "type": "log",
              "message": "Interface is already up"
            }
          }
        ],
        "output": {
          "interface_status": "$interface_state",
          "action_taken": "boolean"
        }
      },
      {
        "id": "verify_dns",
        "name": "Verify DNS Resolution",
        "scope": "local",
        "variables": {
          "dns_result": "dns_record",
          "resolv_conf": "file_content"
        },
        "steps": [
          {
            "id": "step_1",
            "type": "command",
            "tool": "nslookup",
            "command": "lookup",
            "parameters": {
              "hostname": "google.com"
            },
            "expected_output": "dns_record",
            "assign_to": "dns_result",
            "description": "Test DNS resolution"
          },
          {
            "id": "step_2",
            "type": "conditional",
            "condition": "dns_result.status == 'failed'",
            "true_branch": {
              "type": "command",
              "tool": "cat",
              "command": "display",
              "parameters": {
                "file": "/etc/resolv.conf"
              },
              "assign_to": "resolv_conf",
              "description": "Check DNS configuration"
            }
          }
        ],
        "output": {
          "dns_working": "boolean",
          "dns_config": "$resolv_conf"
        }
      }
    ],
    "execution_order": ["check_network_interface", "verify_dns"],
    "global_memory": {},
    "error_handling": {
      "on_tool_error": "continue",
      "on_condition_error": "abort",
      "timeout": 30000
    }
  }
}
```

## Transpilation Rules

### Header Mapping

- **H1**: Program name
- **H2**: Procedure/method definition
- **H3**: Sub-procedure or step group
- **H4+**: Comments or detailed descriptions

### Content Pattern Recognition

1. **Commands**: Text in backticks → tool invocation
2. **Conditions**: "If X, then Y" → conditional logic
3. **Variables**: Emphasized text → variable references
4. **Sequences**: Numbered lists → ordered steps
5. **Options**: Bulleted lists → alternative paths
6. **Assignments**: "Set X to Y" → variable assignment

### Variable Scope Rules

- **Local**: Variables within H2 sections (default)
- **Global**: Variables marked with `memory:` prefix
- **Shared**: Variables passed between procedures
- **Temporary**: Variables that exist only within a step

## API Endpoints

### POST /api/transpile

- **Purpose**: Convert parsed AST to transpiled program format
- **Request Body**: `{ "ast": AST_object, "options": transpilation_options }`
- **Response**: `{ "success": boolean, "program": transpiled_program }`

### GET /api/tools

- **Purpose**: Get available tool registry
- **Response**: `{ "tools": tool_registry }`

## UI Components

### Transpiled Code Viewer

- JSON syntax highlighting for transpiled output
- Expandable sections for procedures and steps
- Tool usage highlighting
- Variable flow visualization

### Tool Registry Panel

- List of detected tools with descriptions
- Command syntax examples
- Parameter validation

## Validation Rules

1. **Tool Validation**: All referenced tools must exist in registry
2. **Variable Consistency**: Variable types must be consistent
3. **Dependency Validation**: Step dependencies must be resolvable
4. **Scope Validation**: Variable access must respect scope rules
5. **Parameter Validation**: Tool parameters must match expected types

## Success Criteria

- Successfully transpile common troubleshooting patterns
- Generate executable program format
- Maintain semantic meaning from original document
- Optimize for LLM understanding and execution
- Handle complex conditional logic and variable flow
