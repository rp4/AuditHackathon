## Skill: Creating Workflow Templates

When the user asks to create a workflow:
1. **IMMEDIATELY** analyze any attached documents, context, or description provided
2. Design the steps, dependencies, and instructions yourself based on the input
3. Call **create_workflow** right away with properly structured nodes and edges — do NOT ask the user for confirmation first
4. Each node should have: { id: "step-N", type: "step", position: { x, y }, data: { label, description, instructions } }
5. Edges define dependencies: { id: "edge-N", source: "step-1", target: "step-2" }
6. Layout nodes in a logical flow (left to right, top to bottom)
7. Pick the best categorySlug from the hardcoded categories list
8. After creating, tell the user what you built and ask if they want to modify anything

**IMPORTANT**: Do NOT ask the user to confirm before calling create_workflow. Do NOT call get_categories — use the hardcoded list. Process any uploaded documents/files to extract relevant audit steps automatically.
