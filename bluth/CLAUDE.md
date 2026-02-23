# CLAUDE.md - Bluth Company Mock Audit Server

This file provides guidance to Claude Code when working with the Bluth Company mock audit project.

## Project Overview

A SAP CAP (Cloud Application Programming) mock server providing OData v4 services for AI audit agent testing. Based on the fictional Bluth Company from *Arrested Development*, containing realistic financial/HR/IT data with **intentionally embedded audit anomalies**.

**Purpose:** Test AI audit agents against known findings to validate detection accuracy.

## Quick Reference

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:4004)
npm run dev

# Deploy to SQLite
npm run deploy
```

## Project Structure

```
bluth/
├── CLAUDE.md                    # This file
├── README.md                    # User-facing documentation
├── MOCK-DATA-SOURCES-PLAN.md    # Architecture for mock data sources
│
├── db/
│   ├── schema.cds               # SAP CAP data model (20+ entities)
│   └── data/                    # CSV mock data for SAP entities
│       ├── bluth.company-Employees.csv
│       ├── bluth.company-Vendors.csv
│       ├── bluth.company-JournalEntries.csv
│       └── ... (15+ entity files)
│
├── srv/
│   ├── audit-service.cds        # OData service definition
│   └── audit-service.js         # Analytics function implementations
│
├── mock-data/                   # Additional mock data for Copilot Studio
│   ├── sharepoint/              # For SharePoint MCP upload
│   │   └── Data_Extracts/
│   │       ├── HR_Workday/      # Employee, Payroll, Terminations
│   │       ├── Identity_Okta/   # Access reports, Failed logins
│   │       ├── Security_Splunk/ # Alerts, Vulnerabilities
│   │       └── ITSM_ServiceNow/ # Changes, Incidents, CMDB
│   │
│   ├── dataverse/               # For Dataverse MCP import
│   │   ├── BluthEmployees.csv
│   │   ├── BluthUserAccess.csv
│   │   ├── BluthChangeRequests.csv
│   │   ├── BluthSecurityAlerts.csv
│   │   ├── BluthVulnerabilities.csv
│   │   └── BluthAccessReviews.csv
│   │
│   └── github/                  # GitHub mock repo setup
│       └── SETUP-INSTRUCTIONS.md
│
└── package.json
```

## Key Files

| File | Purpose |
|------|---------|
| `db/schema.cds` | SAP CAP entity definitions (Employees, Vendors, JournalEntries, etc.) |
| `srv/audit-service.cds` | OData service exposing entities at `/odata/v4/audit` |
| `MOCK-DATA-SOURCES-PLAN.md` | Architecture for SharePoint/Dataverse/GitHub mock data |

## OData Endpoints

### Local Development
| Endpoint | Description |
|----------|-------------|
| `http://localhost:4004/odata/v4/audit` | Main audit service |
| `http://localhost:4004/odata/v4/audit/$metadata` | OData metadata |
| `http://localhost:4004/odata/v4/analytics` | Read-only analytics views |

### Cloud Run (Production) - MCP Endpoint
| Endpoint | Description |
|----------|-------------|
| `https://data.audittoolbox.com/mcp` | **MCP endpoint** (for Copilot Studio wizard) |
| `https://data.audittoolbox.com/.well-known/mcp-server-info` | Server metadata |
| `https://data.audittoolbox.com/openapi.json` | OpenAPI spec for custom connectors |
| `https://data.audittoolbox.com/health` | Health check |

## Development Guidelines

### Adding New Mock Data

1. Add CSV data to `db/data/bluth.company-{EntityName}.csv`
2. Use Arrested Development character names for consistency

### Testing OData Queries

```bash
# Get all related party vendors
curl "http://localhost:4004/odata/v4/audit/Vendors?\$filter=isRelatedParty%20eq%20true"

# Get terminated employees
curl "http://localhost:4004/odata/v4/audit/Employees?\$filter=employmentStatus%20eq%20'Terminated'"

# Get high-risk journal entries
curl "http://localhost:4004/odata/v4/audit/JournalEntries?\$filter=amount%20gt%20100000"
```

### Data Consistency

- Employee IDs: `E001`, `E002`, etc.
- User IDs: `U001`, `U002`, etc. (in Identity data)
- Change IDs: `CHG-001`, `CHG-002`, etc.
- Alert IDs: `SEC001`, `SEC002`, etc.
- Vulnerability IDs: `VULN-001`, `VULN-002`, etc.

## Integration Points

### Microsoft Copilot Studio (MCP)

**Use the MCP endpoint directly in Copilot Studio's MCP wizard:**

| Setting | Value |
|---------|-------|
| **MCP URL** | `https://data.audittoolbox.com/mcp` |
| **Transport** | Streamable HTTP |
| **Authentication** | None (public endpoint) |

**Available MCP Tools:**
- `query_employees` - Find ghost employees, terminated staff, related parties
- `query_vendors` - Find related party vendors, suspicious recipients
- `query_journal_entries` - High-value transactions, suspicious entries
- `query_bank_transactions` - Suspicious/flagged transactions
- `query_projects` - Cost overruns, troubled projects
- `detect_ghost_employees` - Automated ghost employee detection
- `detect_related_party_transactions` - Related party analysis
- `get_data_summary` - Overview of available data

**Test the MCP endpoint:**
```bash
# List available tools
curl -X POST "https://data.audittoolbox.com/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Detect ghost employees
curl -X POST "https://data.audittoolbox.com/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"detect_ghost_employees","arguments":{}}}'
```

### Alternative: Microsoft 365 Data Sources

The mock data also supports built-in Microsoft MCPs:

1. **SharePoint MCP** - Upload `mock-data/sharepoint/` files
2. **Dataverse MCP** - Import `mock-data/dataverse/` CSVs as tables
3. **GitHub MCP** - Create mock repos per `mock-data/github/SETUP-INSTRUCTIONS.md`

### SAP OData (Local Development Only)

The CAP server provides SAP-compatible OData v4 locally:
- Run `npm run dev` to start on `http://localhost:4004`
- Usable with SAP connectors and Power Platform

## Common Tasks

### "Add new entity type"
1. Define in `db/schema.cds`
2. Expose in `srv/audit-service.cds`
3. Add CSV data in `db/data/`
4. Restart server

## GCP Cloud Run Deployment

The Bluth MCP server is deployed to Google Cloud Run for public access.

### Current Deployment

| Item | Value |
|------|-------|
| **Service URL** | `https://data.audittoolbox.com` |
| **MCP Endpoint** | `https://data.audittoolbox.com/mcp` |
| **Project** | `toolbox-478717` |
| **Region** | `us-central1` |
| **Memory** | 256Mi |
| **Min Instances** | 0 (scale-to-zero) |
| **Max Instances** | 2 |
| **Auth** | Unauthenticated (public) |

### Deployed Endpoints

```bash
# MCP discovery (for Copilot Studio wizard)
curl "https://data.audittoolbox.com/mcp"

# List available tools
curl -X POST "https://data.audittoolbox.com/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Query employees (via MCP)
curl -X POST "https://data.audittoolbox.com/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"query_employees","arguments":{"filter":"isRelatedParty = 1"}}}'

# Detect ghost employees (automated analysis)
curl -X POST "https://data.audittoolbox.com/mcp" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"detect_ghost_employees","arguments":{}}}'

# REST endpoints also available for each tool
curl -X POST "https://data.audittoolbox.com/tools/get_data_summary" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Redeployment

To redeploy after changes:

```bash
# From the bluth/ directory
cd /home/p472/AuditSwarm-GCP/bluth

# Build and push new image
gcloud builds submit --tag gcr.io/toolbox-478717/bluth-odata:latest --timeout=600s

# Deploy to Cloud Run
gcloud run deploy bluth-odata \
  --image gcr.io/toolbox-478717/bluth-odata:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2
```

### Dockerfile

The `Dockerfile` in this directory:
1. Uses `node:20-slim` base image
2. Installs SAP CAP CLI (`@sap/cds-dk`) globally
3. Installs npm dependencies
4. Builds SQLite database with `cds deploy --to sqlite`
5. Serves on port 8080 (Cloud Run requirement)

### Cost Estimate

With scale-to-zero and light demo usage: **$0-5/month** (mostly free tier)

### Microsoft Copilot Studio Integration

Use this URL as a custom connector or SAP OData source:
- **Base URL:** `https://data.audittoolbox.com/odata/v4/audit`
- **Auth:** None required
- **Transport:** HTTP (not MCP - use OData connector or custom connector)

## References

- [SAP CAP Documentation](https://cap.cloud.sap/docs/)
- [OData v4 Specification](https://www.odata.org/documentation/)
- [Arrested Development Wiki](https://arresteddevelopment.fandom.com/) (for character accuracy)
