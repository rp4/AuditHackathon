export const WORKFLOW_GENERATION_PROMPT = `# Audit Workflow Designer Prompt

Generate workflow JSON files for import into OpenAuditSwarms. Focus on **what each step does** and **what context it needs** - positioning and styling are handled automatically by the app.

---

## Core Principle: Context Engineering

**Edges represent data dependencies, not visual sequence.** Each edge means the output of one node becomes required input for another. This is the most critical aspect of workflow design.

When designing a workflow, think about:
1. What does each step produce?
2. What does each step need to consume?
3. How do outputs flow from one step to the next?

---

## Workflow Design Process

### Step 1: Understand the Source Document
Read the audit document and identify:
- The audit standard or framework (IIA GIAS, SOC 2, ISO 27001, etc.)
- The phase (Planning, Fieldwork, Reporting, Monitoring)
- Distinct procedures or deliverables
- Natural dependencies between steps

### Step 2: Define Nodes (Audit Artifacts)
For each distinct step, define:
- **id**: kebab-case identifier (e.g., \`risk-assessment\`)
- **label**: 3-6 word action title using verbs (Assess, Document, Evaluate, Review, Test, Verify)
- **description**: One sentence explaining what the step produces
- **instructions**: Detailed prompt (see instruction templates below)

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

\`\`\`
You are an [role].

**External Inputs Required:**
- [List what documents/data this step needs from the user]

**Task:**
[Specific task to perform]

**Output:**
A [markdown/JSON] file containing [detailed format specification with field names].

Reference [Standard Section] for requirements.
\`\`\`

### Downstream Nodes (With Upstream Context)
These nodes must explicitly reference what they receive from upstream:

\`\`\`
You are a [role].

**Input Context:**
Using the [specific artifact type and format] from the previous step, which contains [describe the fields/structure]...

**Task:**
[Specific task that transforms or builds upon the input]

**Output:**
A [markdown/JSON] file containing [detailed format specification].

Follow [Standard Section] methodology.
\`\`\`

### Merge Nodes (Multiple Upstream Dependencies)
When a node synthesizes multiple inputs:

\`\`\`
You are a [role].

**Input Context:**
1. The [artifact 1] from [Step A] containing [fields/structure]
2. The [artifact 2] from [Step B] containing [fields/structure]

**Task:**
Synthesize these inputs to [specific task]. Cross-reference [artifact 1] with [artifact 2] to [purpose].

**Output:**
A [markdown/JSON] file containing [detailed format specification].
\`\`\`

---

## JSON Schema

### Overall Structure

\`\`\`json
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
          "metadata": {
            "phase": "Planning|Fieldwork|Reporting|Monitoring",
            "standard": "Standard name (e.g., IIA GIAS, SOC 2)",
            "framework": "Framework category (e.g., Internal Audit, Compliance)"
          }
        }
      }
    ]
  }
}
\`\`\`

### Node Schema

\`\`\`json
{
  "id": "kebab-case-unique-id",
  "data": {
    "label": "3-6 Word Action Title",
    "description": "One sentence explaining what this step produces",
    "instructions": "Full prompt with Input Context, Task, and Output sections"
  }
}
\`\`\`

**Do NOT include** \`type\` or \`position\` - these are auto-applied.

### Edge Schema

\`\`\`json
{
  "id": "e-source-id-target-id",
  "source": "source-node-id",
  "target": "target-node-id"
}
\`\`\`

**Do NOT include** \`type\`, \`animated\`, or \`style\` - these are auto-applied.

---

## Complete Example

\`\`\`json
{
  "version": "1.0",
  "data": {
    "workflows": [
      {
        "name": "Planning: Internal Audit Risk Assessment",
        "description": "Risk-based planning workflow for developing the annual audit plan based on IIA Global Internal Audit Standards.",
        "diagramJson": {
          "nodes": [
            {
              "id": "universe-identification",
              "data": {
                "label": "Identify Audit Universe",
                "description": "Compile comprehensive list of all auditable entities and processes",
                "instructions": "You are an internal audit planning specialist.\\n\\n**External Inputs Required:**\\n- Organizational chart and business unit documentation\\n- Prior audit reports and findings\\n\\n**Task:**\\nReview all provided documentation to identify auditable entities across the organization.\\n\\n**Output:**\\nA markdown file containing a table with columns: Entity Name, Owner, Description, Last Audit Date, Initial Risk Notes.\\n\\nReference IIA Standard 2010."
              }
            },
            {
              "id": "risk-assessment",
              "data": {
                "label": "Assess and Prioritize Risks",
                "description": "Evaluate risks for each auditable entity using defined criteria",
                "instructions": "You are a risk assessment specialist.\\n\\n**Input Context:**\\nUsing the audit universe markdown table from the previous step, which contains auditable entities with their owners and initial risk notes.\\n\\n**Task:**\\nEvaluate each entity against risk factors: financial impact, regulatory exposure, operational complexity, strategic importance.\\n\\n**Output:**\\nA JSON file with an array containing: entityId, entityName, inherentRiskScore, residualRiskScore, priorityRank.\\n\\nFollow IIA Standard 2010.A1."
              }
            }
          ],
          "edges": [
            { "id": "e-universe-risk", "source": "universe-identification", "target": "risk-assessment" }
          ],
          "metadata": {
            "phase": "Planning",
            "standard": "IIA Global Internal Audit Standards",
            "framework": "Internal Audit"
          }
        }
      }
    ]
  }
}
\`\`\`

---

## Validation Checklist

Before outputting, verify:

### Structure
- All node IDs are unique and kebab-case
- All edge IDs follow pattern \`e-[source]-[target]\`
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
- No orphan references (instructions don't reference artifacts without corresponding edges)

---

## Quick Reference: Minimal Node

\`\`\`json
{
  "id": "step-id",
  "data": {
    "label": "Action Title",
    "description": "What this produces",
    "instructions": "You are a [role].\\n\\n**Input Context:**\\n[What you receive]\\n\\n**Task:**\\n[What to do]\\n\\n**Output:**\\n[Format and structure]"
  }
}
\`\`\`

## Quick Reference: Minimal Edge

\`\`\`json
{ "id": "e-from-to", "source": "from-node-id", "target": "to-node-id" }
\`\`\`

---

## Output Instructions

Respond with the JSON inside a fenced code block labeled json.
Output ONLY raw JSON. Do not wrap it in quotes, do not escape any characters, do not add backticks, and do not include explanations.`
