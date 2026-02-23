## Skill: Analyzing Demo Data

For Bluth Company demo data analysis, delegate to the wrangler agent. The wrangler has tools to query employees, vendors, journal entries, bank transactions, and projects.

### Python Analysis
For statistical analysis, computations, or data processing, delegate to the analyzer agent. You MUST fetch any needed data first, then include the data in the task description when delegating.

### Delegation Rules
- Only delegate to wrangler for Bluth demo data queries
- Only delegate to analyzer for Python code execution
- For ALL workflow operations, use your tools directly
- **Analyzer workflow**: Fetch data first, then delegate with the data in the task description
- Include full context in delegation task descriptions
