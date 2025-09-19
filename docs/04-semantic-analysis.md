# Stage 3: Semantic Analysis

## Overview

Perform deep semantic analysis on the transpiled program to extract intent, entities, relationships, and scope information. This stage adds semantic annotations and metadata to enable intelligent execution.

## Functional Requirements

### FR-3.1: Intent Recognition

- **Description**: Identify the semantic intent of each step and procedure
- **Intent Types**:
  - `condition`: Conditional checks and branching logic
  - `action`: Commands that modify system state
  - `definition`: Variable or constant definitions
  - `reference`: References to previously defined entities
  - `assignment`: Variable assignments and memory updates
  - `loop`: Iterative operations
  - `validation`: Verification and testing steps

### FR-3.2: Entity Extraction

- **Description**: Extract and categorize entities (values, variables, constants)
- **Entity Types**:
  - `variable`: Dynamic values that change during execution
  - `constant`: Fixed values (IP addresses, file paths, hostnames)
  - `command`: Tool invocations and their parameters
  - `file`: File system references
  - `network`: Network-related entities (IPs, ports, URLs)
  - `system`: System resources (interfaces, processes, services)

### FR-3.3: Relationship Mapping

- **Description**: Map dependencies and relationships between entities
- **Relationship Types**:
  - `depends_on`: Step B requires output from Step A
  - `modifies`: Step changes the value of an entity
  - `references`: Step uses but doesn't modify an entity
  - `validates`: Step checks the state of an entity
  - `creates`: Step creates a new entity
  - `deletes`: Step removes an entity

### FR-3.4: Scope Analysis

- **Description**: Analyze variable scope and lifetime within procedures
- **Scope Rules**:
  - **Local Scope**: Variables within H2 sections
  - **Global Scope**: Variables marked for memory persistence
  - **Procedure Scope**: Variables passed between procedures
  - **Step Scope**: Temporary variables within individual steps

## Semantic Annotation Format

```json
{
  "semantic_analysis": {
    "program_intent": "network_troubleshooting",
    "confidence": 0.95,
    "procedures": [
      {
        "id": "check_network_interface",
        "intent": "diagnostic",
        "entities": [
          {
            "name": "interface_name",
            "type": "variable",
            "data_type": "string",
            "scope": "local",
            "lifetime": "procedure",
            "source": "step_2",
            "usage": ["step_3"]
          },
          {
            "name": "interface_state",
            "type": "variable",
            "data_type": "enum",
            "possible_values": ["UP", "DOWN", "UNKNOWN"],
            "scope": "local",
            "lifetime": "procedure",
            "source": "step_2",
            "usage": ["step_3"]
          },
          {
            "name": "ip",
            "type": "command",
            "tool_category": "network",
            "risk_level": "low"
          }
        ],
        "relationships": [
          {
            "type": "depends_on",
            "source": "step_2",
            "target": "step_1",
            "reason": "Requires interface list output"
          },
          {
            "type": "depends_on",
            "source": "step_3",
            "target": "step_2",
            "reason": "Requires interface state analysis"
          }
        ],
        "steps": [
          {
            "id": "step_1",
            "intent": "action",
            "semantic_tags": ["data_collection", "network_query"],
            "entities_created": ["interface_list"],
            "risk_assessment": "safe"
          },
          {
            "id": "step_2",
            "intent": "analysis",
            "semantic_tags": ["data_parsing", "condition_check"],
            "entities_extracted": ["interface_name", "interface_state"],
            "entities_referenced": ["interface_list"]
          },
          {
            "id": "step_3",
            "intent": "conditional",
            "semantic_tags": ["state_modification", "system_change"],
            "condition": {
              "type": "equality_check",
              "variable": "interface_state",
              "value": "DOWN",
              "confidence": 0.9
            },
            "true_branch": {
              "intent": "action",
              "risk_assessment": "medium",
              "entities_modified": ["interface_state"]
            }
          }
        ]
      }
    ],
    "global_entities": [],
    "memory_requirements": {
      "variables": ["interface_status", "dns_working"],
      "estimated_size": "1KB",
      "persistence": "session"
    },
    "execution_graph": {
      "nodes": ["check_network_interface", "verify_dns"],
      "edges": [
        {
          "from": "check_network_interface",
          "to": "verify_dns",
          "type": "sequence",
          "condition": "always"
        }
      ]
    }
  }
}
```

## Semantic Annotation Rules

### Intent Classification Patterns

```yaml
condition_patterns:
  - "if {condition} then {action}"
  - "when {event} occurs"
  - "check if {property} is {value}"

action_patterns:
  - "run {command}"
  - "execute {tool}"
  - "set {variable} to {value}"
  - "modify {entity}"

definition_patterns:
  - "define {variable} as {value}"
  - "let {variable} = {value}"
  - "{variable} := {value}"

reference_patterns:
  - "use {variable}"
  - "refer to {entity}"
  - "based on {previous_result}"
```

### Entity Recognition Rules

```yaml
variable_patterns:
  - text_within_emphasis: "**variable_name**"
  - command_output_assignment: "assign_to"
  - parameter_references: "$variable_name"

constant_patterns:
  - ip_addresses: "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}"
  - file_paths: "/[\\w/.-]+"
  - hostnames: "[\\w.-]+\\.[a-z]{2,}"
  - ports: ":\\d{1,5}"

command_patterns:
  - code_blocks: "`command params`"
  - tool_invocations: "tool_name command_name"
```

### Scope Analysis Rules

1. **H2 Boundary**: New procedure creates new local scope
2. **Variable Inheritance**: Child scopes can access parent variables
3. **Memory Persistence**: Variables marked with `set_memo:` go to global scope
4. **Output Variables**: Procedure outputs become available to subsequent procedures

## Color Scheme Annotations

The semantic analysis will prefix the markdown with color-coded annotations:

```markdown
<span class="assign">assign: interface_list</span>

# Check Network Interface Status

<span class="action">action: network_query</span>

1. Run `ip addr show`

<span class="analysis">var: interface_name, interface_state</span> 2. Look for interface state

<span class="condition">condition: interface_state == DOWN</span>
<span class="action">action: state_modification</span> 3. If DOWN, bring interface up with `ip link set eth0 up`

<span class="set_memo">set_memo: interface_status</span>
**Output**: Interface status and action taken
```

### Color Scheme Definitions

- **assign**: `#4CAF50` (Green) - Variable assignments
- **set_memo**: `#FF9800` (Orange) - Memory persistence
- **var**: `#2196F3` (Blue) - Variable usage
- **loop**: `#9C27B0` (Purple) - Iterative operations
- **condition**: `#FFC107` (Amber) - Conditional logic
- **action**: `#F44336` (Red) - State-modifying actions
- **analysis**: `#607D8B` (Blue Grey) - Data analysis steps

## API Endpoints

### POST /api/analyze

- **Purpose**: Perform semantic analysis on transpiled program
- **Request Body**: `{ "program": transpiled_program }`
- **Response**: `{ "success": boolean, "analysis": semantic_analysis }`

### POST /api/annotate

- **Purpose**: Generate color-coded markdown with semantic annotations
- **Request Body**: `{ "markdown": string, "analysis": semantic_analysis }`
- **Response**: `{ "annotated_markdown": string }`

## UI Components

### Semantic Analysis Panel

- Entity list with types and relationships
- Dependency graph visualization
- Scope hierarchy display
- Intent confidence scores

### Annotated Code Viewer

- Color-coded markdown display
- Hover tooltips for semantic information
- Interactive entity highlighting
- Scope boundaries visualization

## Machine Learning Integration

### Intent Classification Model

- **Input**: Step text and context
- **Output**: Intent type with confidence score
- **Training Data**: Labeled troubleshooting procedures
- **Model Type**: BERT-based classifier

### Entity Recognition Model

- **Input**: Text tokens and context
- **Output**: Entity type and boundaries
- **Model Type**: Named Entity Recognition (NER) model
- **Pre-trained Base**: spaCy or transformers

### Relationship Extraction

- **Input**: Entity pairs and surrounding context
- **Output**: Relationship type and confidence
- **Model Type**: Relation extraction transformer

## Validation Rules

1. **Intent Consistency**: Step intents must align with procedure intent
2. **Entity Validity**: All referenced entities must be defined
3. **Scope Compliance**: Variable access must respect scope rules
4. **Dependency Completeness**: All dependencies must be resolvable
5. **Type Consistency**: Entity types must be consistent across usage

## Success Criteria

- Achieve >90% accuracy in intent classification
- Successfully extract all relevant entities
- Generate complete dependency graphs
- Provide meaningful semantic annotations
- Enable intelligent program execution based on semantic understanding
