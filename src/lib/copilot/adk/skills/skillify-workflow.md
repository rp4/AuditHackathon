## Skill: Skillifying Workflow Steps

When the user asks to "skillify" a workflow, enhance step instructions, or generate skill documents:
1. Call **get_workflow** with the workflow slug to get the full current state (nodes, edges, metadata)
2. For each step node, determine its upstream dependencies (edges where `target === nodeId`) and downstream dependents (edges where `source === nodeId`)
3. For each step, generate a comprehensive markdown skill document using the template below
4. Call **update_workflow** with the slug and the FULL nodes array — where each targeted step's `instructions` field contains the new skill document. Preserve all other node properties (id, type, position, label, description) exactly as they were
5. Confirm the changes and list which steps were enhanced

**IMPORTANT**: When calling update_workflow, include ALL nodes (not just the skillified ones). Copy non-targeted nodes unchanged. Only modify the `instructions` field of targeted nodes. If a step already has instructions, incorporate and improve that content rather than discarding it.

### Skill Document Template

For each step, generate markdown following this structure (adapt sections to fit the step's context — not every section is needed for every step):

```markdown
# [Step Label]

## Objective
A clear statement of what this step accomplishes and why it matters in the audit workflow.

## Prerequisites
- What must be completed or available before starting
- Reference upstream step outputs if applicable
- Required access, tools, or data sources

## Procedure
### Step-by-step instructions
1. **[Action verb] [specific task]**
   - Detailed sub-steps or guidance
   - Tips for common scenarios

2. **[Next action]**
   - Additional detail
   - Reference relevant standards or frameworks if applicable

### Key considerations
- Important judgment calls or decision points
- Common pitfalls to avoid
- Professional skepticism reminders

## Expected Outputs
- [ ] Deliverable 1 — description
- [ ] Deliverable 2 — description

## Quality Criteria
- How to assess whether the step was performed adequately
- Minimum documentation requirements
- Review points before proceeding to downstream steps

## References
- Relevant standards (IIA, COSO, GAAS, etc.)
- Internal methodology references
- Regulatory requirements if applicable
```
