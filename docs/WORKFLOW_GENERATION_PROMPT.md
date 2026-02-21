# Audit Workflow Designer Prompt

Generate workflow JSON files for import into OpenAuditSwarms. Focus on **what each step does** and **what context it needs**.

---

## Core Principle: Context Engineering

**Edges represent data dependencies, not visual sequence.** Each edge means the output of one node becomes required input for another. This is the most critical aspect of workflow design.

When designing a workflow, think about:
1. What does each step produce?
2. What does each step need to consume?
3. How do outputs flow from one step to the next?
4. Are there any upstream data required for this step (there may not be any pertinent upstream context)


Core Principle: Quality + Quantity
1. Include as many nodes/steps as needed (do not limit the number)
2. Make sure the quality (context and prompts) of the each of the steps is expertly designed

---

## Workflow Design Process

### Step 1: Understand the Source Document
Read the audit document and identify:
- The phase (Planning, Fieldwork, Reporting, Monitoring) - if not clear ask the user to specify
- Distinct procedures or deliverables
- Natural dependencies between steps

### Step 2: Define Nodes (Audit Steps)
For each distinct step in the given phase, define:
- **id**: kebab-case identifier (e.g., `risk-assessment`)
- **label**: 3-6 word action title using verbs (Assess, Document, Evaluate, Review, Test, Verify)
- **description**: One sentence explaining what the step produces
- **instructions**: Detailed prompt (see instruction templates below)

Note, the steps the step types in each phase:
• Pre-planning (Internal Audit Plan Development): Include only steps related to the organization-wide risk assessment, defining the audit universe, and establishing the annual or multiyear internal audit plan. This phase focuses on prioritizing risks at the organizational level to determine which engagements to perform.
• Planning (Engagement Planning): Include only steps related to understanding the specific activity under review, performing an engagement-level risk assessment, and establishing the engagement's objectives and scope. This phase must culminate in a documented engagement work program that identifies tasks and internal auditors assigned.
• Fieldwork (Conducting Engagement Work): Include only steps involved in implementing the work program, such as gathering information, performing analyses, and evaluating evidence. This phase is restricted to identifying potential findings, determining their causes and effects, and developing initial conclusions.
• Reporting (Communicating Results): Include only steps for developing and disseminating the final engagement communication, which must include objectives, scope, findings, and conclusions. This phase also includes obtaining management action plans and conducting follow-up to confirm implementation.
• Quality Assurance (QA): Include only steps regarding the Quality Assurance and Improvement Program (QAIP), such as ongoing monitoring through supervisory reviews, periodic internal self-assessments, and external assessments. These steps verify conformance with the Standards and the achievement of performance objectives across all other phases.

### Step 3: Map Data Dependencies (Edges)
This is the most important step. For each node, ask:
- "What outputs from prior steps does this node need?"
- "What specific artifacts must be referenced in the instructions?"

Create edges only where real data dependencies exist. Every edge should correspond to an explicit reference in the downstream node's instructions.

### Step 4: Generate JSON
Output the workflow JSON following the schema below.

---

## Writing Effective Instructions

### First/Root Nodes (No Upstream Dependencies)
These nodes receive external inputs (documents, data, user context):

```
You are an [role].

**External Inputs Required:**
- [List what documents/data this step needs from the user]

**Task:**
[Specific task to perform]

**Output:**
A [markdown/JSON] file containing [detailed format specification with field names].

Reference [Standard Section] for requirements.
```

### Downstream Nodes (With Upstream Context)
```
You are a [role].

**Input Context:**
1. The [result 1] from [Step A] containing [fields/structure]
2. The [result 2] from [Step B] containing [fields/structure]

**Task:**
Synthesize these inputs to [specific task]. Cross-reference [result 1] with [result 2] to [purpose].

**Output:**
A [markdown/JSON] file containing [detailed format specification].
```

---

## JSON Schema

### Overall Structure

```json
{
  "version": "1.0",
  "data": {
    "workflows": [
      {
        "name": "[Phase]: [Descriptive Workflow Name]",
        "description": "[2-3 sentence description of purpose and source standard]",
        "diagramJson": {
          "nodes": [...],
          "edges": [...],
        }
      }
    ]
  }
}
```

### Node Schema

```json
{
  "id": "kebab-case-unique-id",
  "data": {
    "label": "3-6 Word Action Title",
    "description": "One sentence explaining what this step produces",
    "instructions": "Full prompt with Input Context, Task, and Output sections"
  }
}
```

**Do NOT include** `type` or `position` - these are auto-applied.

### Edge Schema

```json
{
  "id": "e-source-id-target-id",
  "source": "source-node-id",
  "target": "target-node-id"
}
```

**Do NOT include** `type`, `animated`, or `style` - these are auto-applied.

---

## Validation Checklist

Before outputting, verify:

### Structure
- All node IDs are unique and kebab-case
- All edge IDs follow pattern `e-[source]-[target]`
- All edges reference valid source and target node IDs
- JSON is valid (no trailing commas, proper quotes)

### Instructions Quality
- Each instruction sets a clear role
- Root nodes specify what external inputs they need
- Downstream nodes explicitly reference upstream outputs by name and format
- Output format is specified (.md or .json) with structure details

### Context Engineering (Edges)
- Each edge represents a real data dependency
- Every edge corresponds to an explicit reference in the target node's instructions
- No orphan references (instructions don't reference results without corresponding edges)

---

## Quick Reference: Minimal Node

```json
{
  "id": "step-id",
  "data": {
    "label": "Action Title",
    "description": "What this produces",
    "instructions": "You are a [role].\n\n**Input Context:**\n[What you receive]\n\n**Task:**\n[What to do]\n\n**Output:**\n[Format and structure]"
  }
}
```

## Quick Reference: Minimal Edge

```json
{ "id": "e-from-to", "source": "from-node-id", "target": "to-node-id" }
```

---

## Output Instructions

Output ONLY raw JSON. Do not wrap it in quotes, do not escape any characters, do not add backticks, and do not include explanations.
THE OUTPUT SHOULD ONLY BE A JSON CODEBLOCK.
