# Audit Workflow Designer Prompt

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
- **id**: kebab-case identifier (e.g., `risk-assessment`)
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
These nodes must explicitly reference what they receive from upstream:

```
You are a [role].

**Input Context:**
Using the [specific artifact type and format] from the previous step, which contains [describe the fields/structure]...

**Task:**
[Specific task that transforms or builds upon the input]

**Output:**
A [markdown/JSON] file containing [detailed format specification].

Follow [Standard Section] methodology.
```

### Merge Nodes (Multiple Upstream Dependencies)
When a node synthesizes multiple inputs:

```
You are a [role].

**Input Context:**
1. The [artifact 1] from [Step A] containing [fields/structure]
2. The [artifact 2] from [Step B] containing [fields/structure]

**Task:**
Synthesize these inputs to [specific task]. Cross-reference [artifact 1] with [artifact 2] to [purpose].

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

## Complete Example

```json
{
  "version": "1.0",
  "data": {
    "workflows": [
      {
        "name": "Planning: Internal Audit Risk Assessment",
        "description": "Risk-based planning workflow for developing the annual audit plan based on IIA Global Internal Audit Standards. Covers risk identification, prioritization, and resource allocation.",
        "diagramJson": {
          "nodes": [
            {
              "id": "universe-identification",
              "data": {
                "label": "Identify Audit Universe",
                "description": "Compile comprehensive list of all auditable entities and processes",
                "instructions": "You are an internal audit planning specialist.\n\n**External Inputs Required:**\n- Organizational chart and business unit documentation\n- Prior audit reports and findings\n- Strategic plans and risk registers\n\n**Task:**\nReview all provided documentation to identify auditable entities across the organization. Include business units, key processes, IT systems, and third-party relationships. Assess each entity's audit history and note any red flags.\n\n**Output:**\nA markdown file containing a table with columns:\n- Entity Name\n- Owner/Responsible Party\n- Description\n- Last Audit Date\n- Initial Risk Notes\n\nReference IIA Standard 2010 for planning requirements."
              }
            },
            {
              "id": "risk-assessment",
              "data": {
                "label": "Assess and Prioritize Risks",
                "description": "Evaluate risks for each auditable entity using defined criteria",
                "instructions": "You are a risk assessment specialist.\n\n**Input Context:**\nUsing the audit universe markdown table from the previous step, which contains a comprehensive list of auditable entities with their owners, descriptions, last audit dates, and initial risk notes.\n\n**Task:**\nEvaluate each auditable entity against these risk factors:\n1. Financial impact (potential monetary loss)\n2. Regulatory exposure (compliance requirements)\n3. Operational complexity (process dependencies)\n4. Strategic importance (alignment with objectives)\n5. Time since last audit\n\nApply weighted scoring (1-5 scale) and calculate residual risk considering existing controls.\n\n**Output:**\nA JSON file with an array of objects containing:\n- entityId\n- entityName\n- inherentRiskScore (1-25)\n- controlMaturity (1-5)\n- residualRiskScore (calculated)\n- priorityRank (1 = highest priority)\n\nFollow IIA Standard 2010.A1 risk-based planning methodology."
              }
            },
            {
              "id": "resource-allocation",
              "data": {
                "label": "Allocate Audit Resources",
                "description": "Match available resources to prioritized audit needs",
                "instructions": "You are an audit resource planning specialist.\n\n**Input Context:**\nUsing the prioritized risk assessment JSON from the previous step, which contains risk-scored entities ranked by priority with their inherent risk, control maturity, and residual risk scores.\n\n**Additional Inputs:**\n- Staff roster with skills, certifications, and availability\n- Annual calendar with blackout periods\n- Budget constraints\n\n**Task:**\nMatch high-priority audit engagements to available audit staff based on:\n1. Required expertise and certifications\n2. Staff availability and capacity\n3. Engagement timing requirements\n4. Budget allocation\n\nEnsure 15-20% contingency allocation for ad-hoc requests.\n\n**Output:**\nA markdown file containing:\n1. Resource allocation table with columns: Engagement, Assigned Staff, Estimated Hours, Skill Requirements, Planned Timeline\n2. Co-sourcing needs section for specialized areas\n3. Contingency reserve allocation\n4. Capacity utilization summary\n\nReference IIA Standard 2030 for resource management."
              }
            },
            {
              "id": "plan-approval",
              "data": {
                "label": "Obtain Plan Approval",
                "description": "Present audit plan to stakeholders for review and approval",
                "instructions": "You are an audit communications specialist.\n\n**Input Context:**\n1. The resource allocation markdown from the previous step, containing staff assignments, timelines, and capacity analysis\n2. The risk assessment JSON from the earlier step, containing the risk-based prioritization rationale\n\n**Task:**\nSynthesize both inputs to prepare comprehensive stakeholder materials that:\n1. Explain the risk-based approach and methodology\n2. Present the prioritized engagement list with justification\n3. Show resource commitments and timeline\n4. Identify any resource gaps or constraints\n\n**Output:**\nA markdown file containing:\n1. Executive summary memo (1 page) for senior leadership\n2. Audit Committee presentation highlights (bullet points)\n3. Detailed audit plan schedule\n4. Stakeholder communication plan\n5. Approval signature section with modification tracking\n\nFollow IIA Standard 2020 communication and approval requirements."
              }
            }
          ],
          "edges": [
            { "id": "e-universe-risk", "source": "universe-identification", "target": "risk-assessment" },
            { "id": "e-risk-resource", "source": "risk-assessment", "target": "resource-allocation" },
            { "id": "e-resource-approval", "source": "resource-allocation", "target": "plan-approval" },
            { "id": "e-risk-approval", "source": "risk-assessment", "target": "plan-approval" }
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
```

---

## Validation Checklist

Before outputting, verify:

### Structure
- [ ] All node IDs are unique and kebab-case
- [ ] All edge IDs follow pattern `e-[source]-[target]`
- [ ] All edges reference valid source and target node IDs
- [ ] JSON is valid (no trailing commas, proper quotes)

### Instructions Quality
- [ ] Each instruction sets a clear role
- [ ] Root nodes specify what external inputs they need
- [ ] Downstream nodes explicitly reference upstream outputs by name and format
- [ ] Merge nodes list all upstream dependencies
- [ ] Output format is specified (.md or .json) with structure details
- [ ] Relevant standard is referenced

### Context Engineering (Edges)
- [ ] Each edge represents a real data dependency
- [ ] Every edge corresponds to an explicit reference in the target node's instructions
- [ ] Merge patterns used when a node needs multiple upstream outputs
- [ ] No orphan references (instructions don't reference artifacts without corresponding edges)

---

## Quick Reference: Minimal Node

```json
{
  "id": "step-id",
  "data": {
    "label": "Action Title",
    "description": "What this produces",
    "instructions": "You are a [role].\n\n**Input Context:**\n[What you receive from upstream]\n\n**Task:**\n[What to do]\n\n**Output:**\n[Format and structure]"
  }
}
```

## Quick Reference: Minimal Edge

```json
{ "id": "e-from-to", "source": "from-node-id", "target": "to-node-id" }
```

---

## Output Instructions

Respond with the JSON inside a fenced code block labeled json.
Output ONLY raw JSON. Do not wrap it in quotes, do not escape any characters, do not add backticks, and do not include explanations.
