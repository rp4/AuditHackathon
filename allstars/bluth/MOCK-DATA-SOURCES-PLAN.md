# Mock Data Sources Plan for Bluth Company Audit Demo

## Simplified Approach

Use **only built-in Copilot Studio MCPs** with data extracts uploaded to SharePoint or Dataverse. This mirrors real audit workflows where auditors receive system exports rather than direct system access.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Microsoft Copilot Studio                      │
│                    (AI Audit Agent)                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│   SharePoint    │ │  Dataverse  │ │     GitHub      │
│   (Documents    │ │ (Structured │ │  (IT Changes)   │
│   & Extracts)   │ │    Data)    │ │                 │
└────────┬────────┘ └──────┬──────┘ └────────┬────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    Mock Data Categories                      │
├─────────────────────────────────────────────────────────────┤
│  📄 Documents     │  📊 Data Extracts   │  💻 IT Changes    │
│  • Contracts      │  • HR/Payroll       │  • Code commits   │
│  • Policies       │  • Access logs      │  • Deployments    │
│  • Evidence       │  • Security events  │  • Approvals      │
│  • Workpapers     │  • Vendor data      │  • Change tickets │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Sources (Built-in MCPs Only)

### 1. SharePoint/OneDrive MCP

**Purpose:** Document repository + data extract storage

**Site Structure:**
```
Bluth Company Audit/
│
├── 📁 Contracts/
│   ├── Sitwell_Real_Estate_Agreement.pdf
│   ├── Saddam_Hussein_Construction_Iraq.pdf
│   ├── Cornballer_Mexico_Distribution.pdf
│   └── Tantamount_Studios_Film_Deal.pdf
│
├── 📁 Policies/
│   ├── Code_of_Conduct.docx
│   ├── Related_Party_Policy.docx
│   ├── Expense_Policy.docx
│   ├── IT_Security_Policy.docx
│   └── Change_Management_Policy.docx
│
├── 📁 Data_Extracts/
│   │
│   ├── 📁 HR_Workday/
│   │   ├── Employee_Master.csv
│   │   ├── Terminations_Last_90_Days.csv
│   │   ├── Org_Chart.csv
│   │   └── Payroll_Register.csv
│   │
│   ├── 📁 Identity_Okta/
│   │   ├── User_Access_Report.csv
│   │   ├── Failed_Logins.csv
│   │   ├── Privileged_Accounts.csv
│   │   └── Access_Review_Status.csv
│   │
│   ├── 📁 Security_Splunk/
│   │   ├── Security_Alerts.csv
│   │   ├── Login_Anomalies.csv
│   │   ├── Data_Exfiltration_Alerts.csv
│   │   └── Vulnerability_Scan.csv
│   │
│   ├── 📁 ITSM_ServiceNow/
│   │   ├── Change_Requests.csv
│   │   ├── Incidents.csv
│   │   ├── Problems.csv
│   │   └── CMDB_Assets.csv
│   │
│   └── 📁 Finance_SAP/
│       ├── (Links to OData service)
│       └── README.md
│
├── 📁 Audit_Evidence/
│   ├── 📁 SOX_2024/
│   ├── 📁 Access_Reviews/
│   └── 📁 Control_Testing/
│
└── 📁 Prior_Findings/
    ├── 2023_Audit_Findings.xlsx
    └── SEC_Investigation_Notes.docx
```

---

### 2. Dataverse MCP

**Purpose:** Queryable structured data for agent analysis

**Tables:**

```
┌─────────────────────────────────────────────────────────────┐
│                     DATAVERSE TABLES                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │ BluthEmployees      │    │ BluthUserAccess     │        │
│  ├─────────────────────┤    ├─────────────────────┤        │
│  │ EmployeeID          │    │ UserID              │        │
│  │ Name                │    │ SystemName          │        │
│  │ Department          │    │ AccessLevel         │        │
│  │ Manager             │    │ GrantedDate         │        │
│  │ HireDate            │    │ LastReviewDate      │        │
│  │ TerminationDate     │    │ ApprovedBy          │        │
│  │ Status              │    │ BusinessJustification│       │
│  │ IsRelatedParty      │    │ Status              │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │ BluthChangeRequests │    │ BluthSecurityAlerts │        │
│  ├─────────────────────┤    ├─────────────────────┤        │
│  │ ChangeID            │    │ AlertID             │        │
│  │ Title               │    │ AlertType           │        │
│  │ Requestor           │    │ Severity            │        │
│  │ Approver            │    │ Timestamp           │        │
│  │ RiskLevel           │    │ User                │        │
│  │ Status              │    │ Description         │        │
│  │ TestEvidence        │    │ Status              │        │
│  │ DeploymentDate      │    │ IPAddress           │        │
│  │ IsSelfApproved      │    │ Location            │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │ BluthVulnerabilities│    │ BluthAccessReviews  │        │
│  ├─────────────────────┤    ├─────────────────────┤        │
│  │ VulnID              │    │ ReviewID            │        │
│  │ Severity            │    │ User                │        │
│  │ System              │    │ Reviewer            │        │
│  │ Description         │    │ DueDate             │        │
│  │ DiscoveredDate      │    │ CompletionDate      │        │
│  │ DaysOpen            │    │ Decision            │        │
│  │ Status              │    │ IsRubberStamped     │        │
│  │ Owner               │    │ ReviewTimeSeconds   │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. GitHub MCP

**Purpose:** IT change management evidence

**Repository:** `bluth-company/bluth-systems`

```
bluth-company/
│
├── bluth-erp/                    # SAP customizations
│   ├── src/
│   │   ├── vendor_bypass.abap    # 🚨 Suspicious code
│   │   └── approval_skip.abap    # 🚨 Control override
│   └── CHANGELOG.md
│
├── fakeblock/                    # George Michael's project
│   ├── src/
│   └── README.md                 # "Definitely not vaporware"
│
├── banana-stand-pos/             # Point of sale
│   ├── src/
│   │   └── cash_handling.js      # 🚨 "There's always money..."
│   └── deploy.log
│
└── infrastructure/               # IT infrastructure
    ├── terraform/
    ├── .github/workflows/
    │   └── deploy.yml            # Check for approvals
    └── access-requests/
        └── gob-admin-request.md  # 🚨 Self-approved
```

**Mock Commits with Anomalies:**
```
abc1234 - GOB: "Added myself to admin group" (no PR review)
def5678 - George Michael: "Fakeblock v2.0" (failed tests, deployed anyway)
ghi9012 - Annyong: "Data export script" (suspicious bulk export)
jkl3456 - Tobias: "Emergency fix" (no change ticket)
```

---

## Mock Data Files (CSV Templates)

### HR_Workday/Employee_Master.csv
```csv
EmployeeID,Name,Department,JobTitle,HireDate,TerminationDate,Status,Manager,IsRelatedParty,RelatedPartyType
E001,George Bluth Sr,Executive,CEO,1973-01-15,,Active,,TRUE,Founder
E002,Lucille Bluth,Executive,Chairwoman,1973-01-15,,Active,E001,TRUE,Spouse of Founder
E003,Michael Bluth,Executive,President,1992-06-01,,Active,E001,TRUE,Son of Founder
E004,GOB Bluth,Sales,VP Sales,1995-03-15,,Active,E003,TRUE,Son of Founder
E005,Lindsay Funke,Marketing,VP Charity,1998-09-01,,Active,E003,TRUE,Daughter of Founder
E006,Tobias Funke,Marketing,Consultant,2002-01-10,,Active,E005,TRUE,Son-in-Law
E007,George Michael Bluth,Technology,Developer,2012-06-15,,Active,E003,TRUE,Grandson
E008,Maeby Funke,Entertainment,Executive,2010-09-01,,Active,E005,TRUE,Granddaughter
E009,Buster Bluth,Research,VP Cartography,1999-08-01,,Active,E002,TRUE,Son of Founder
E010,Bob Loblaw,Legal,Counsel,2006-03-01,2007-08-31,Terminated,E012,FALSE,
E011,Franklin Bluth,Entertainment,Performer,2003-09-15,,Active,E004,FALSE,GHOST EMPLOYEE - PUPPET
E012,Barry Zuckerkorn,Legal,General Counsel,1985-02-01,,Active,,FALSE,
E013,Annyong Bluth,Finance,Intern,2003-11-15,,Active,E002,TRUE,Adopted Son - SPY
```

### Identity_Okta/User_Access_Report.csv
```csv
UserID,EmployeeID,SystemName,AccessLevel,GrantedDate,LastReviewDate,ApprovedBy,Status,Notes
U001,E001,SAP_PROD,Admin,2000-01-01,2020-01-01,Self,Active,CEO - INCARCERATED but still has access
U002,E001,VPN,Full,2000-01-01,2020-01-01,Self,Active,Accessed from Mexico (prison)
U003,E003,SAP_PROD,Admin,2000-01-01,2024-01-01,E001,Active,
U004,E004,Domain_Admin,Admin,2024-06-01,Never,E004,Active,SELF-APPROVED
U005,E010,SAP_PROD,User,2006-03-01,Never,E012,Active,TERMINATED - ACCESS NOT REMOVED
U006,E010,Email,Full,2006-03-01,Never,E012,Active,TERMINATED - ACCESS NOT REMOVED
U007,E011,Badge_System,Employee,2003-09-15,Never,E004,Active,PUPPET HAS BADGE ACCESS
U008,E013,SAP_PROD,ReadAll,2023-01-01,Never,E002,Active,Exported all data before leaving
```

### Identity_Okta/Failed_Logins.csv
```csv
Timestamp,UserID,EmployeeID,System,IPAddress,Location,FailureReason
2024-12-01 03:45:00,U001,E001,VPN,187.45.23.101,Mexico,Account Locked - Prison IP Block
2024-12-01 03:46:00,U001,E001,VPN,187.45.23.101,Mexico,Account Locked - Prison IP Block
2024-12-01 03:47:00,U001,E001,VPN,187.45.23.102,Mexico,Account Locked - Prison IP Block
2024-12-05 14:22:00,U012,E012,SAP_PROD,192.168.1.50,Office,Wrong Password (attempt 1)
2024-12-05 14:22:30,U012,E012,SAP_PROD,192.168.1.50,Office,Wrong Password (attempt 2)
2024-12-05 14:23:00,U012,E012,SAP_PROD,192.168.1.50,Office,Wrong Password (attempt 3)
2024-12-05 14:23:30,U012,E012,SAP_PROD,192.168.1.50,Office,Account Locked
2024-12-10 02:15:00,U004,E004,Domain_Admin,10.0.0.55,Unknown,After-Hours Access Attempt
```

### Security_Splunk/Security_Alerts.csv
```csv
AlertID,Timestamp,Severity,AlertType,User,Description,SourceIP,DestinationIP,Status,Notes
SEC001,2024-11-15 09:30:00,Critical,Geo_Anomaly,george.sr@bluth.com,Login from blocked country (Mexico),187.45.23.101,,Open,User is incarcerated in Mexico
SEC002,2024-11-20 14:45:00,High,Data_Exfil,annyong@bluth.com,Large data export (10GB),192.168.1.100,8.8.8.8,Investigating,Export to external IP before resignation
SEC003,2024-11-22 03:15:00,High,After_Hours,gob@bluth.com,Admin access at 3:15 AM,10.0.0.55,,Open,No business justification
SEC004,2024-11-25 11:00:00,Medium,Privilege_Escalation,gob@bluth.com,Added to Domain Admins group,10.0.0.55,,Closed,Self-approved per ticket CHG-004
SEC005,2024-12-01 08:00:00,Critical,Malware,fakeblock-srv,Ransomware detected on Fakeblock server,,,Open,George Michael's project compromised
SEC006,2024-12-05 16:30:00,High,Brute_Force,barry.zuckerkorn@bluth.com,10 failed login attempts in 2 minutes,192.168.1.50,,Closed,User forgot password
SEC007,2024-12-10 23:45:00,Medium,VPN_Anomaly,tobias@bluth.com,VPN from unusual location (Reno),64.233.160.1,,Open,Claims he was at audition
```

### ITSM_ServiceNow/Change_Requests.csv
```csv
ChangeID,Title,Requestor,Approver,RequestDate,ApprovalDate,RiskLevel,Status,TestEvidence,DeploymentDate,IsSelfApproved,Notes
CHG-001,Update SAP vendor master security,Michael Bluth,Barry Zuckerkorn,2024-10-01,2024-10-02,Low,Closed,Yes,2024-10-05,FALSE,Standard change
CHG-002,Deploy Fakeblock v2.0 to production,George Michael,George Michael,2024-10-15,,High,Implemented,No,2024-10-15,TRUE,NO APPROVAL - Deployed anyway
CHG-003,Add GOB to Domain Admins,GOB Bluth,GOB Bluth,2024-11-01,2024-11-01,High,Implemented,No,2024-11-01,TRUE,SELF-APPROVED
CHG-004,Emergency fix - Cornballer website,Tobias Funke,,2024-11-10,,Critical,Implemented,No,2024-11-10,FALSE,NO TICKET - Emergency claimed
CHG-005,Disable audit logging on payroll system,Lucille Bluth,,2024-11-15,,Critical,Rejected,No,,FALSE,REJECTED - Obvious control bypass
CHG-006,Remove Bob Loblaw system access,Michael Bluth,Barry Zuckerkorn,2024-08-31,2024-09-01,Low,Open,N/A,,FALSE,STILL OPEN - 90+ days
CHG-007,Quarterly security patches,IT Team,Michael Bluth,2024-09-01,2024-09-05,Medium,Closed,Yes,2024-09-15,FALSE,Standard patching
CHG-008,Install Annyong data export tool,Annyong Bluth,Lucille Bluth,2024-11-01,2024-11-01,High,Implemented,No,2024-11-02,FALSE,Approved by related party
```

### Security_Splunk/Vulnerability_Scan.csv
```csv
VulnID,Severity,CVE,System,Description,DiscoveredDate,DueDate,Status,DaysOpen,Owner,Notes
VULN-001,Critical,CVE-2024-1234,SAP_PROD,Remote Code Execution,2024-06-01,2024-06-15,Open,180+,IT Team,CRITICAL - 6 months unpatched
VULN-002,Critical,CVE-2024-5678,Fakeblock-DB,SQL Injection,2024-09-01,2024-09-15,Open,90+,George Michael,Owner says "it's fine"
VULN-003,High,CVE-2024-9012,VPN_Gateway,Authentication Bypass,2024-10-01,2024-10-15,Open,60+,IT Team,Allows access from blocked IPs
VULN-004,Medium,CVE-2024-3456,Email_Server,Information Disclosure,2024-11-01,2024-11-30,Remediated,0,IT Team,Patched on time
VULN-005,Critical,CVE-2024-7890,Domain_Controller,Privilege Escalation,2024-07-01,2024-07-15,Open,150+,IT Team,How GOB got admin access
```

---

## Audit Scenarios Enabled

### Scenario 1: IT Access Review
**Agent Query:** "Identify users who have system access but have been terminated"
**Data Sources:** SharePoint (Terminations CSV) + Dataverse (BluthUserAccess)

### Scenario 2: Privileged Access
**Agent Query:** "Find privileged accounts without proper approval"
**Data Sources:** Dataverse (BluthUserAccess) + SharePoint (Change_Requests.csv)

### Scenario 3: Ghost Employees
**Agent Query:** "Identify potential ghost employees in HR and access systems"
**Data Sources:** SharePoint (Employee_Master.csv) + Dataverse (BluthUserAccess)

### Scenario 4: Security Alerts
**Agent Query:** "List critical security alerts that haven't been resolved"
**Data Sources:** Dataverse (BluthSecurityAlerts)

### Scenario 5: Change Management
**Agent Query:** "Find changes deployed without proper approval or testing"
**Data Sources:** SharePoint (Change_Requests.csv) + GitHub (commit history)

### Scenario 6: Vulnerability Management
**Agent Query:** "Identify critical vulnerabilities open beyond SLA"
**Data Sources:** SharePoint (Vulnerability_Scan.csv)

### Scenario 7: Related Party Transactions
**Agent Query:** "Cross-reference employees marked as related parties with financial transactions"
**Data Sources:** SAP OData + SharePoint (Employee_Master.csv)

### Scenario 8: Data Exfiltration
**Agent Query:** "Investigate users who exported large amounts of data"
**Data Sources:** Dataverse (BluthSecurityAlerts) + SharePoint (Employee_Master.csv)

---

## Implementation Steps

### Step 1: Create SharePoint Site (30 min)
```
1. Create new SharePoint site "Bluth Company Audit"
2. Create folder structure per diagram above
3. Upload mock CSV files
4. Upload mock contract PDFs (can be placeholder docs)
```

### Step 2: Create Dataverse Tables (1 hour)
```
1. Go to Power Apps > Dataverse > Tables
2. Create tables per schema above
3. Import data from CSVs
4. Set up relationships between tables
```

### Step 3: Create GitHub Repository (30 min)
```
1. Create GitHub org "bluth-company"
2. Create repos with mock code and commits
3. Create mock PRs and issues
```

### Step 4: Enable MCPs in Copilot Studio (15 min)
```
1. Go to Copilot Studio > Tools > Add Tool
2. Enable SharePoint & OneDrive MCP
3. Enable Dataverse MCP
4. Enable GitHub MCP
5. Configure authentication
```

### Step 5: Test Agent Queries (30 min)
```
1. Run each audit scenario
2. Verify agent finds expected anomalies
3. Adjust data if needed
```

---

## File Manifest

Create these files in `bluth/mock-data/`:

```
bluth/mock-data/
├── sharepoint/
│   ├── Data_Extracts/
│   │   ├── HR_Workday/
│   │   │   ├── Employee_Master.csv
│   │   │   ├── Terminations_Last_90_Days.csv
│   │   │   └── Org_Chart.csv
│   │   ├── Identity_Okta/
│   │   │   ├── User_Access_Report.csv
│   │   │   ├── Failed_Logins.csv
│   │   │   └── Privileged_Accounts.csv
│   │   ├── Security_Splunk/
│   │   │   ├── Security_Alerts.csv
│   │   │   ├── Vulnerability_Scan.csv
│   │   │   └── Login_Anomalies.csv
│   │   └── ITSM_ServiceNow/
│   │       ├── Change_Requests.csv
│   │       ├── Incidents.csv
│   │       └── CMDB_Assets.csv
│   ├── Contracts/
│   │   └── (placeholder PDFs)
│   └── Policies/
│       └── (placeholder DOCXs)
│
├── dataverse/
│   ├── BluthEmployees.csv
│   ├── BluthUserAccess.csv
│   ├── BluthChangeRequests.csv
│   ├── BluthSecurityAlerts.csv
│   └── BluthVulnerabilities.csv
│
└── github/
    └── (instructions for mock repo setup)
```

---

## Summary

| Component | MCP | Data Type | Setup Time |
|-----------|-----|-----------|------------|
| SharePoint | Built-in | Documents + CSV extracts | 30 min |
| Dataverse | Built-in | Structured queryable data | 1 hour |
| GitHub | Built-in | IT change evidence | 30 min |
| SAP (existing) | OData | Financial transactions | Done |

**Total Setup Time:** ~2.5 hours

**Cost:** $0 (all built-in to Microsoft 365 / Power Platform)
