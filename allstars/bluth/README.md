# Bluth Company SAP Mock Server

**"There's always money in the banana stand"** - George Bluth Sr.

A SAP CAP (Cloud Application Programming) mock server providing OData v4 services for AI audit testing. Based on the fictional Bluth Company from *Arrested Development*, this mock server contains realistic financial data with embedded audit anomalies for testing AI-powered audit workflows.

## Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Server runs at http://localhost:4004
```

## OData Endpoints

| Endpoint | Description |
|----------|-------------|
| `/odata/v4/audit` | Main audit service with all entities |
| `/odata/v4/audit/$metadata` | OData metadata document |
| `/odata/v4/analytics` | Read-only analytics views |

## Available Entities

### Organization
- `CompanyCodes` - Bluth Company organizational units (US HQ, Mexico, Iraq)
- `CostCenters` - Departments (Executive, Construction, Banana Stand, Magic, etc.)

### Financial
- `GLAccounts` - General Ledger chart of accounts
- `JournalEntries` - All financial transactions with anomaly flags
- `BankStatements` - Monthly bank statements
- `BankTransactions` - Bank activity with suspicious flags

### Accounts Payable
- `Vendors` - Vendor master (including related parties like Sitwell, Austero)
- `VendorInvoices` - AP invoices with approval details

### Accounts Receivable
- `Customers` - Customer master
- `CustomerInvoices` - AR invoices

### Human Resources
- `Employees` - All Bluth family and staff
- `PayrollTransactions` - Salary payments
- `ExpenseReports` - Employee expense claims

### Assets & Projects
- `FixedAssets` - Company assets (Stair Car, Yacht Seaward, Model Homes)
- `Projects` - Development projects (Sudden Valley, Iraq Model Home, Fakeblock)
- `Inventory` - Stock items (Frozen Bananas, Cornballer, Bees)

### Compliance
- `RelatedPartyTransactions` - Related party transaction log

## Example Queries

### Get all high-value journal entries
```
GET /odata/v4/audit/JournalEntries?$filter=amount gt 100000&$orderby=amount desc
```

### Find related party vendors
```
GET /odata/v4/audit/Vendors?$filter=isRelatedParty eq true
```

### Get suspicious bank transactions
```
GET /odata/v4/audit/BankTransactions?$filter=suspiciousFlag eq true
```

### Find employees with duplicate bank accounts
```
GET /odata/v4/audit/Employees?$orderby=bankAccount
```

### Get project cost overruns
```
GET /odata/v4/audit/Projects?$filter=costVariance gt 0
```

## Copilot Studio Integration

### Power Platform Custom Connector

1. Create a new Custom Connector in Power Platform
2. Import the OpenAPI spec: `GET /odata/v4/audit/$metadata`
3. Configure authentication (none for local development)
4. Create actions for each entity query

### SAP Connector (Simulated)

This server provides SAP-compatible OData v4 responses, enabling:
- Testing SAP connector configurations
- Validating OData query patterns
- Developing audit AI agent workflows

## Project Structure

```
bluth/
├── db/
│   ├── schema.cds         # Data model definitions
│   └── data/              # CSV mock data files
│       ├── bluth.company-Employees.csv
│       ├── bluth.company-Vendors.csv
│       ├── bluth.company-JournalEntries.csv
│       └── ... (15+ entity data files)
├── srv/
│   ├── audit-service.cds  # OData service definition
│   └── audit-service.js   # Analytics function implementations
└── package.json
```

## Characters & Employees

| Character | Role | Notable Issues |
|-----------|------|----------------|
| George Bluth Sr | CEO (Incarcerated) | SEC fraud, Iraq construction |
| Lucille Bluth | Chairwoman | Personal expenses, yacht |
| Michael Bluth | President/COO | Actually trying to fix things |
| GOB Bluth | VP Sales/Magic | Bees, Segways, Franklin payroll |
| Lindsay Bluth Funke | VP Charitable Affairs | Hot Cops, GWLSE expenses |
| Tobias Funke | Consultant | Mrs Featherbottom duplicate |
| George Michael Bluth | Developer | Fakeblock vaporware |
| Maeby Funke | Studio Liaison | Expense fraud |
| Buster Bluth | VP Cartography | Limited involvement |
| Barry Zuckerkorn | General Counsel | Excessive fees, incompetent |

## Development

```bash
# Watch mode with auto-reload
npm run dev

# Deploy to SQLite (creates db.sqlite)
npm run deploy

# Production build
npm run build
```

## License

MIT - For educational and audit testing purposes only.

*"I've made a huge mistake."* - GOB Bluth
