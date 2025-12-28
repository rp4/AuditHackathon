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

Connect nodes to show workflow sequence:

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

### Instructions Content (Claude Skill Format)

Instructions should be written as **Claude skill prompts** that an AI agent can execute. Each instruction should produce a **markdown file (.md)** or **JSON file (.json)** as output.

**Structure each instruction as:**
1. **Role/Context**: Set the expertise context (e.g., "You are an internal audit specialist...")
2. **Task**: Clear directive of what to accomplish
3. **Inputs**: What information/documents the agent needs to review
4. **Output Format**: Specify the deliverable format:
   - Use markdown (.md) for narrative documents, memos, reports, checklists
   - Use JSON (.json) for structured data, matrices, control mappings
5. **Standard Reference**: Cite specific sections (e.g., "per IIA Standard 2201")

**Example instruction:**
```
You are an internal audit specialist. Review the provided organizational chart and process documentation to identify all auditable entities. For each entity, document the owner, description, and risk factors. Output a markdown file with a table listing each auditable entity. Reference IIA Standard 2010 for planning requirements.
```

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
                "instructions": "You are a risk assessment specialist. Using the audit universe list and risk criteria matrix provided, evaluate each auditable entity against risk factors: financial impact, regulatory exposure, operational complexity, and strategic importance. Calculate weighted risk scores and rank entities by residual risk. Output a JSON file with an array of objects containing: entityId, inherentRiskScore, controlMaturity, residualRiskScore, and priorityRank. Follow IIA Standard 2010.A1 methodology."
              }
            },
            {
              "id": "resource-allocation",
              "type": "artifact",
              "position": { "x": 800, "y": 200 },
              "data": {
                "label": "Allocate Audit Resources",
                "description": "Match available resources to prioritized audit needs",
                "instructions": "You are an audit resource planning specialist. Review the prioritized risk assessment, staff roster with skills/certifications, and annual calendar provided. Match audit engagements to available resources based on expertise requirements and capacity. Output a markdown file with a resource allocation table showing: Engagement, Assigned Staff, Estimated Hours, Skill Requirements, and Timeline. Include a section noting co-sourcing needs and contingency allocation (15-20%). Reference IIA Standard 2030."
              }
            },
            {
              "id": "plan-approval",
              "type": "artifact",
              "position": { "x": 1150, "y": 200 },
              "data": {
                "label": "Obtain Plan Approval",
                "description": "Present audit plan to stakeholders for review and approval",
                "instructions": "You are an audit communications specialist. Using the completed resource allocation plan and risk assessment summary, prepare stakeholder presentation materials. Output a markdown file containing: an executive summary memo with risk-based rationale, key highlights for Audit Committee presentation, and a communication plan for stakeholders. Include sections for documenting approval signatures and any requested modifications. Follow IIA Standard 2020 communication requirements."
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
- [ ] All node IDs are unique and kebab-case
- [ ] All edge IDs follow pattern `e-[source]-[target]`
- [ ] All edges reference valid source and target node IDs
- [ ] Node positions follow dagre spacing (350px horizontal, 150px vertical)
- [ ] Each workflow has 4-7 nodes (split if more needed)
- [ ] Instructions follow Claude skill format (role, task, inputs, output format)
- [ ] Instructions specify output as markdown (.md) or JSON (.json) file
- [ ] Instructions are detailed (75-200 words each)
- [ ] Workflow names include phase prefix
- [ ] All edges have `animated: true` and the indigo style
- [ ] JSON is valid (no trailing commas, proper quotes)

---

Now analyze the document I provided and generate the complete workflow JSON.
