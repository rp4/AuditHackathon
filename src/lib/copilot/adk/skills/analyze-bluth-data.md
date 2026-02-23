## Skill: Analyzing Bluth Company Audit Data

This skill provides domain knowledge for analyzing Bluth Company data across all available tables. Use bluth_get_schema first to discover tables, then bluth_query_data to investigate.

### Employee Analysis
- **Ghost employees**: Query Employees and look for duplicate bankAccount values across different employees — same bank account indicates possible fictitious employee
- **Terminated staff with access**: Filter `employmentStatus = 'Terminated'` and check for recent activity
- **Related party employees**: Filter `isRelatedParty = 1` to find employees with relationships to vendors or management
- **Salary outliers**: Order by salary DESC and look for unusually high compensation

### Vendor Analysis
- **Related party vendors**: Filter `isRelatedParty = 1` in Vendors table — these require additional disclosure
- **High-risk vendors**: Filter `riskRating = 'High'` for vendors flagged as risky
- **Suspicious payment recipients**: Cross-reference vendor names with employee names for conflicts of interest
- **Vendor-employee relationships**: Compare Vendors.relatedPartyType with Employees to find undisclosed connections

### Financial Transaction Analysis
- **Journal entries**: Look for high-value entries (`amount > 100000`), manual entries (`isManualEntry = 1`), round-dollar amounts, and weekend postings
- **Bank transactions**: Filter `suspiciousFlag = 1` for flagged transactions, look for unusual patterns
- **Vendor invoices**: Check for duplicate invoice numbers, round amounts, or invoices just below approval thresholds

### Project & Cost Analysis
- **Cost overruns**: Filter Projects where `costVariance > 0` or actual costs exceed budgeted amounts
- **Troubled projects**: Look for projects with status flags indicating problems

### Cross-Reference Patterns
When investigating anomalies, always cross-reference across tables:
1. Employee bank accounts → find duplicates (ghost employee indicator)
2. Employee names/IDs → Vendor records (conflict of interest)
3. Vendor IDs → Journal entries and invoices (transaction volume and patterns)
4. Project IDs → Journal entries (cost allocation accuracy)
5. Related party flags → Both Employees and Vendors tables (completeness of disclosure)

### Common Anomaly Detection Queries
- Duplicate bank accounts: Query all employees, group by bankAccount, find duplicates
- Round-dollar transactions: Filter journal entries where `amount % 1000 = 0` or similar
- Weekend transactions: Filter by date fields for Saturday/Sunday activity
- Just-below-threshold amounts: Filter for amounts like 9,999 or 49,999 (just under approval limits)
- Terminated employee transactions: Cross-reference terminated employees with recent financial activity
