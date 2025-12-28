You are an expert audit workflow designer. Your task is to analyze the provided document and create a comprehensive workflow JSON file that can be imported into OpenAuditSwarms.

## Output Requirements

Generate a JSON file with the following structure. Create **multiple workflows** if the document covers different phases (Planning, Fieldwork, Reporting) or distinct topic areas.

### JSON Structure

```json
{
  "version": "1.0",
  "data": {
    "workflows": [
      {
        "name": "[Phase]: [Descriptive Workflow Name]",
        "description": "[2-3 sentence description explaining the workflow purpose and source standard]",
        "diagramJson": {
          "nodes": [...],
          "edges": [...],
          "metadata": {
            "phase": "[Planning|Fieldwork|Reporting|Monitoring]",
            "standard": "[Standard name, e.g., IIA GIAS, SOC 2, ISO 27001]",
            "framework": "[Framework category, e.g., Internal Audit, Compliance, IT Audit]"
          }
        }
      }
    ]
  }
}
```

### Node Structure

Each node represents an audit artifact or procedure step:

```json
{
  "id": "[kebab-case-unique-id]",
  "type": "artifact",
  "position": {
    "x": [calculated using dagre layout - see positioning rules],
    "y": [calculated using dagre layout - see positioning rules]
  },
  "data": {
    "label": "[Short action-oriented title, 3-6 words]",
    "description": "[One sentence explaining what this step produces or accomplishes]",
    "instructions": "[Instructions formatted as a Claude skill prompt. Structure as: (1) Role/context setting, (2) Specific task to perform, (3) Input requirements, (4) Output format specification. The output should be a markdown file (.md) or JSON file (.json). Include reference to relevant standard sections. 75-200 words.]"
  }
}
```

### Edge Structure

Edges represent **data flow and context dependencies** between nodes—not just visual sequence. Each edge means "the output of the source node is required as input for the target node."

```json
{
  "id": "e-[source-id]-[target-id]",
  "source": "[source-node-id]",
  "target": "[target-node-id]",
  "type": "deletable",
  "animated": true,
  "style": {
    "stroke": "#6366f1",
    "strokeWidth": 2,
    "strokeDasharray": "5,5"
  }
}
```

## Context Engineering via Edges

**Critical Concept**: Edges are the mechanism for context engineering. When designing workflows, you must ensure:

1. **Upstream outputs feed downstream inputs**: Each node's instructions must reference the specific outputs from its upstream (source) nodes. The edge represents that this context will be provided.

2. **No orphan dependencies**: If a node's instructions reference a document or artifact, there must be an upstream node that produces it, connected by an edge.

3. **Explicit context references**: In downstream node instructions, explicitly state what upstream output is being used (e.g., "Using the audit universe table from the previous step..." or "Review the risk assessment JSON produced upstream...").

4. **Context accumulation**: Nodes later in the workflow may need outputs from multiple upstream nodes. Use merge patterns (multiple edges pointing to one node) when a step requires synthesizing multiple prior outputs.

### Context Flow Examples

**Good - Clear context dependency:**
```
Node A instructions: "...Output a markdown file containing an audit universe table..."
Edge: A → B
Node B instructions: "Using the audit universe table from the previous step, evaluate each entity against risk factors..."
```

**Bad - Missing context reference:**
```
Node A instructions: "...Output a markdown file containing an audit universe table..."
Edge: A → B
Node B instructions: "Evaluate entities against risk factors..."
← Does not reference what it receives from Node A
```

**Good - Multiple upstream contexts (merge pattern):**
```
Node A → Node C (provides risk scores)
Node B → Node C (provides staff roster)
Node C instructions: "Using the prioritized risk scores from the risk assessment step AND the staff roster with certifications, allocate resources..."
```

### Designing Context-Aware Workflows

When creating edges, ask:
- What **specific output** does the source node produce?
- Does the target node's instructions **explicitly reference** this output?
- Is the output **necessary** for the target to complete its task?
- Would removing this edge break the target node's ability to execute?

If an edge is purely decorative (showing logical sequence but no data dependency), reconsider whether the workflow structure accurately represents the actual data flow.

## Positioning Rules (Dagre-style Layout)

Use these spacing rules for node positions to create a clean left-to-right flow:

1. **Horizontal spacing**: 350px between columns (x: 100, 450, 800, 1150, 1500, 1850...)
2. **Vertical spacing**: 150px between rows (y: 100, 250, 400, 550...)
3. **Start position**: First node at x: 100, y: 200
4. **Parallel nodes**: Same x position, different y positions
5. **Sequential nodes**: Increasing x position, same y position
6. **Maximum 5-7 nodes per workflow** for readability (create multiple workflows if needed)

### Layout Patterns

**Linear Flow (5 sequential steps):**
```
Node1(100,200) → Node2(450,200) → Node3(800,200) → Node4(1150,200) → Node5(1500,200)
```

**Fork Pattern (1 input, 2 parallel outputs):**
```
                    → Node2(450,100)
Node1(100,200) →
                    → Node3(450,300)
```

**Merge Pattern (2 inputs, 1 output):**
```
Node1(100,100) →
                    → Node3(450,200)
Node2(100,300) →
```

**Diamond Pattern (decision with parallel paths merging):**
```
                    → Node2(450,100) →
Node1(100,200) →                        → Node4(800,200)
                    → Node3(450,300) →
```

## Content Guidelines

### Workflow Naming Convention
- Format: `"[Phase]: [Specific Topic or Standard Section]"`
- Examples:
  - "Planning: IIA GIAS Risk Assessment"
  - "Fieldwork: SOC 2 Security Controls Testing"
  - "Reporting: GDPR Data Subject Rights Audit"

### Node Labeling
- Use action verbs: "Assess", "Document", "Evaluate", "Review", "Test", "Verify"
- Be specific: "Evaluate Access Controls" not "Review Controls"
- Keep to 3-6 words

### Instructions Content (Prompt Engineering)

Instructions are where **prompt engineering** happens—crafting the specific guidance for AI agent execution. Meanwhile, **context engineering** is handled by the workflow edges, which determine what upstream outputs are provided to each node.

**The distinction:**
- **Prompt Engineering** (instructions field): What the agent should do, how to do it, and what to output
- **Context Engineering** (edges): What prior outputs/artifacts the agent will receive as input

Instructions should be written as **Claude skill prompts** that an AI agent can execute. Each instruction should produce a **markdown file (.md)** or **JSON file (.json)** as output.

**Structure each instruction as:**
1. **Role/Context**: Set the expertise context (e.g., "You are an internal audit specialist...")
2. **Task**: Clear directive of what to accomplish
3. **Upstream Context Reference**: Explicitly state what outputs from upstream nodes will be used (these correspond to incoming edges). Use phrases like "Using the [artifact] from the previous step..." or "Review the [output] produced upstream..."
4. **Additional Inputs**: Any external documents/information the agent needs beyond upstream outputs
5. **Output Format**: Specify the deliverable format:
   - Use markdown (.md) for narrative documents, memos, reports, checklists
   - Use JSON (.json) for structured data, matrices, control mappings
6. **Standard Reference**: Cite specific sections (e.g., "per IIA Standard 2201")

**Example instruction (first node - no upstream context):**
```
You are an internal audit planning specialist. Review the provided organizational chart and process documentation to identify all auditable entities. For each entity, document the owner, description, and risk factors. Output a markdown file with a table listing each auditable entity, including columns: Entity Name, Owner, Description, Last Audit Date, and Initial Risk Notes. Reference IIA Standard 2010 for planning requirements.
```

**Example instruction (downstream node - references upstream context):**
```
You are a risk assessment specialist. Using the audit universe table produced in the previous step, evaluate each auditable entity against the following risk factors: financial impact, regulatory exposure, operational complexity, and strategic importance. Apply the risk criteria matrix provided to calculate weighted risk scores. Rank all entities by residual risk level. Output a JSON file containing an array of objects with: entityId, entityName, inherentRiskScore, controlMaturity, residualRiskScore, and priorityRank. Follow IIA Standard 2010.A1 methodology.
```

Note how the second example explicitly references "the audit universe table produced in the previous step"—this corresponds to the incoming edge from the first node.

### Creating Multiple Workflows
Split into separate workflows when:
- Document covers distinct phases (Planning vs Fieldwork vs Reporting)
- Topics are independent and can be performed separately
- Workflow would exceed 7 nodes

## Example Output

Here's a complete example for a simple 4-node workflow:

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
              "type": "artifact",
              "position": { "x": 100, "y": 200 },
              "data": {
                "label": "Identify Audit Universe",
                "description": "Compile comprehensive list of all auditable entities and processes",
                "instructions": "You are an internal audit planning specialist. Review the organizational chart, business unit documentation, and prior audit reports provided. Identify all auditable entities including business units, key processes, IT systems, and third-party relationships. Output a markdown file containing a table with columns: Entity Name, Owner, Description, Last Audit Date, and Initial Risk Notes. Consult IIA Standard 2010 for planning requirements."
              }
            },
            {
              "id": "risk-assessment",
              "type": "artifact",
              "position": { "x": 450, "y": 200 },
              "data": {
                "label": "Assess and Prioritize Risks",
                "description": "Evaluate risks for each auditable entity using defined criteria",
                "instructions": "You are a risk assessment specialist. Using the audit universe markdown table produced in the previous step, evaluate each auditable entity against the following risk factors: financial impact, regulatory exposure, operational complexity, and strategic importance. Apply the organization's risk criteria matrix to calculate weighted risk scores for each entity. Rank all entities by their residual risk level to determine audit prioritization. Output a JSON file with an array of objects containing: entityId, entityName, inherentRiskScore, controlMaturity, residualRiskScore, and priorityRank. Follow IIA Standard 2010.A1 methodology."
              }
            },
            {
              "id": "resource-allocation",
              "type": "artifact",
              "position": { "x": 800, "y": 200 },
              "data": {
                "label": "Allocate Audit Resources",
                "description": "Match available resources to prioritized audit needs",
                "instructions": "You are an audit resource planning specialist. Using the prioritized risk assessment JSON from the previous step, match high-priority audit engagements to available audit staff. Review the staff roster with skills/certifications and annual calendar to ensure proper expertise alignment and capacity planning. Consider timing constraints and skill requirements when making assignments. Output a markdown file with a resource allocation table showing: Engagement, Assigned Staff, Estimated Hours, Skill Requirements, and Timeline. Include a section noting co-sourcing needs for specialized areas and contingency allocation (15-20% of total hours). Reference IIA Standard 2030."
              }
            },
            {
              "id": "plan-approval",
              "type": "artifact",
              "position": { "x": 1150, "y": 200 },
              "data": {
                "label": "Obtain Plan Approval",
                "description": "Present audit plan to stakeholders for review and approval",
                "instructions": "You are an audit communications specialist. Using both the resource allocation markdown table and the risk assessment summary from the previous steps, prepare comprehensive stakeholder presentation materials for audit plan approval. Synthesize the risk-based prioritization rationale with the resource commitments to tell a cohesive story. Output a markdown file containing: an executive summary memo explaining the risk-based approach, key highlights formatted for Audit Committee presentation, and a stakeholder communication plan. Include sections for documenting approval signatures and tracking any requested modifications to the plan. Follow IIA Standard 2020 communication requirements."
              }
            }
          ],
          "edges": [
            {
              "id": "e-universe-risk",
              "source": "universe-identification",
              "target": "risk-assessment",
              "type": "deletable",
              "animated": true,
              "style": { "stroke": "#6366f1", "strokeWidth": 2, "strokeDasharray": "5,5" }
            },
            {
              "id": "e-risk-resource",
              "source": "risk-assessment",
              "target": "resource-allocation",
              "type": "deletable",
              "animated": true,
              "style": { "stroke": "#6366f1", "strokeWidth": 2, "strokeDasharray": "5,5" }
            },
            {
              "id": "e-resource-approval",
              "source": "resource-allocation",
              "target": "plan-approval",
              "type": "deletable",
              "animated": true,
              "style": { "stroke": "#6366f1", "strokeWidth": 2, "strokeDasharray": "5,5" }
            }
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

## Final Checklist

Before outputting, verify:

### Structure
- [ ] All node IDs are unique and kebab-case
- [ ] All edge IDs follow pattern `e-[source]-[target]`
- [ ] All edges reference valid source and target node IDs
- [ ] Node positions follow dagre spacing (350px horizontal, 150px vertical)
- [ ] Each workflow has 4-7 nodes (split if more needed)
- [ ] All edges have `animated: true` and the indigo style
- [ ] JSON is valid (no trailing commas, proper quotes)

### Prompt Engineering (Instructions)
- [ ] Instructions follow Claude skill format (role, task, inputs, output format)
- [ ] Instructions specify output as markdown (.md) or JSON (.json) file
- [ ] Instructions are detailed (75-200 words each)
- [ ] Workflow names include phase prefix

### Context Engineering (Edges)
- [ ] Each edge represents a real data dependency (not just visual sequence)
- [ ] Downstream nodes explicitly reference outputs from their upstream nodes
- [ ] First/root nodes clearly state what external inputs they require
- [ ] No "orphan references" (instructions referencing artifacts without corresponding incoming edges)
- [ ] Merge patterns used when a node synthesizes outputs from multiple upstream nodes
- [ ] Instructions use clear phrases like "Using the [X] from the previous step..." for upstream context

---

Now analyze the document I provided and generate the complete workflow JSON.
