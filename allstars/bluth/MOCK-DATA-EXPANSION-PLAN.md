# Bluth Mock Data Expansion Plan

## Overview

This plan maps each hackathon use case to the mock data needed in the Bluth server. For each use case we identify: what already exists, what new entities/tables are needed, what new rows to add to existing tables, and what embedded anomalies to plant for the AI to detect.

The Bluth Company (Arrested Development) theme should be maintained throughout -- all anomalies should feel like something George Sr., GOB, or Lucille would actually do.

---

## Use Case 1: Vendor Master File (VMF) Review
**Owner:** Marina Tieman
**Category:** Analysis, Testing & Documentation

### What Exists
- `Vendors` (24 rows) with names, addresses, bank accounts, risk ratings
- `VendorInvoices` (30 rows) with approval info

### New Entity: `VendorChangeLog`
A change log tracking every addition/modification to the vendor master file. This is the **core** data source for this use case.

| Field | Type | Description |
|-------|------|-------------|
| changeId | String | Unique change identifier |
| vendor | Association to Vendors | |
| changeDate | Date | When change was recorded in system |
| changeType | String | `New`, `Update`, `Deactivate` |
| fieldChanged | String | Which field was modified |
| oldValue | String | Previous value |
| newValue | String | New value |
| changedBy | String | Employee who entered the change |
| approvedBy | String | Employee who approved the change |
| approvalDate | Date | When approval was granted |
| supportingDocRef | String | Reference to supporting documentation |
| supportingDocType | String | `W9`, `ChangeRequestForm`, `Email`, `PurchaseOrder`, `None` |

### New Entity: `DelegationOfAuthority`
Who is authorized to approve what, and up to what dollar threshold.

| Field | Type | Description |
|-------|------|-------------|
| doaId | String | Unique identifier |
| employee | Association to Employees | Authorized approver |
| approvalType | String | `VendorMaster`, `Payment`, `JournalEntry`, `Expense` |
| maxAmount | Decimal | Dollar threshold |
| effectiveFrom | Date | |
| effectiveTo | Date | |
| isActive | Boolean | |

### Mock Data Rows (~40 VendorChangeLog rows)

**Clean records (25 rows):**
- Normal vendor additions with proper W-9, approval before entry, different approver/enterer
- Bank account updates with supporting documentation
- Address changes with change request forms

**Exception records (15 rows):**
1. **Pre-dated approval**: Saddam Hussain Construction bank account changed on 2024-03-15, approval dated 2024-03-18 (change before approval)
2. **No supporting docs**: Forget-Me-Now Pharmaceuticals added with `supportingDocType = 'None'`
3. **Same person approved and entered**: GOB both entered and approved Hot Cops Entertainment vendor setup
4. **Data mismatch**: Balboa Towers address change -- supporting doc shows "123 Balboa Ave" but system shows "456 Balboa Towers Penthouse" (Lucille's actual apartment)
5. **Unauthorized approver**: Maeby Funke (not on DoA matrix) approving a vendor addition
6. **Retroactive approval**: Multiple changes to Sitwell Enterprises banking info with approval 30+ days after change
7. **Rapid bank account changes**: 3 bank account changes to a single vendor (T.I. Construction) in one month -- money mule pattern

### DoA Matrix (~8 rows)
Map Michael, George Sr, Lucille, and Finance Controller as authorized approvers with different thresholds. Notably exclude GOB, Lindsay, Maeby, and Tobias.

---

## Use Case 2: Bank Reconciliations
**Owner:** Marina Tieman
**Category:** Analysis, Testing & Documentation

### What Exists
- `BankStatements` (12 rows) -- monthly statements for 2024
- `BankTransactions` (27 rows) -- individual bank transactions
- `GLAccounts` (57 rows) -- includes cash accounts
- `JournalEntries` (71 rows) -- GL postings

### New Entity: `BankReconciliations`
The actual reconciliation records connecting bank statements to GL.

| Field | Type | Description |
|-------|------|-------------|
| reconciliationId | String | Unique identifier |
| bankStatement | Association to BankStatements | |
| glAccount | Association to GLAccounts | Cash GL account |
| reconciliationPeriod | Date | Month being reconciled |
| bankBalance | Decimal | Per bank statement |
| glBalance | Decimal | Per general ledger |
| difference | Decimal | bankBalance - glBalance |
| reconcilingItemsTotal | Decimal | Sum of reconciling items |
| unreconciledDifference | Decimal | difference - reconcilingItemsTotal (should be 0) |
| preparedBy | String | |
| preparedDate | Date | |
| reviewedBy | String | |
| reviewedDate | Date | |
| reviewDeadline | Date | Company policy deadline |
| status | String | `Draft`, `Reviewed`, `Approved` |
| attachedStatementPeriod | String | Period of the attached bank statement (to catch wrong-period attachment) |

### New Entity: `ReconcilingItems`
Individual reconciling items on each reconciliation.

| Field | Type | Description |
|-------|------|-------------|
| itemId | String | Unique identifier |
| reconciliation | Association to BankReconciliations | |
| itemType | String | `OutstandingCheck`, `DepositInTransit`, `BankCharge`, `InterestEarned`, `Error`, `Other` |
| description | String | |
| amount | Decimal | |
| itemDate | Date | Original transaction date |
| ageDays | Integer | Days outstanding |
| supportingDocRef | String | Reference to documentation |
| hasDocumentation | Boolean | |
| investigationNotes | String | |
| isResolved | Boolean | |
| resolvedDate | Date | |

### Mock Data Rows

**BankReconciliations (12 rows -- one per month):**

**Clean records (8 months):**
- Different preparer/reviewer, completed before deadline, correct statement attached, difference = 0

**Exception records (4 months):**
1. **March**: Wrong bank statement attached -- `attachedStatementPeriod = '2024-02'` on the March reconciliation
2. **July**: `preparedBy = reviewedBy = 'Lucille Bluth'` (same person prepared and reviewed, SoD failure)
3. **September**: `reviewedDate` is 15 days past `reviewDeadline` (late review)
4. **November**: `unreconciledDifference = 12,450.00` -- reconciling items don't add up to the total difference

**ReconcilingItems (~30 rows):**
- Normal outstanding checks and deposits in transit
- **Aged item**: $250,000 "transfer to banana stand" outstanding since January, never resolved (>330 days)
- **Unsupported items**: 3 reconciling items with `hasDocumentation = false` and no investigation notes
- **Suspicious**: $45,000 Cornballer cash deposit with no supporting documentation

---

## Use Case 3: Access Appropriateness / Continuous Monitoring
**Owner:** Wesley Raider
**Category:** Cyber Risk & IT Controls, Continuous Monitoring

### What Exists
- `Employees` (25 rows) with department, job title, hire/termination dates

### New Entity: `SystemUsers`
User accounts mapped to employees.

| Field | Type | Description |
|-------|------|-------------|
| userId | String | System username |
| employee | Association to Employees | |
| systemName | String | `SAP_ERP`, `Banking`, `Payroll`, `ExpenseSystem` |
| role | String | System role assigned |
| roleDescription | String | |
| isHighRisk | Boolean | |
| provisionedBy | String | Who granted access |
| provisionedDate | Date | |
| lastLoginDate | Date | |
| isActive | Boolean | |
| deactivationDate | Date | |

### New Entity: `UserAccessReviews`
Historical access review certifications.

| Field | Type | Description |
|-------|------|-------------|
| reviewId | String | |
| reviewDate | Date | |
| reviewedBy | String | Manager who certified |
| userId | Association to SystemUsers | |
| accessAppropriate | Boolean | Reviewer's determination |
| comments | String | |
| actionTaken | String | `Certified`, `Revoked`, `Modified`, `NoAction` |

### New Entity: `EntitlementValidations`
Which roles are high risk.

| Field | Type | Description |
|-------|------|-------------|
| validationId | String | |
| role | String | |
| systemName | String | |
| riskLevel | String | `High`, `Medium`, `Low` |
| description | String | |
| incompatibleRoles | String | Roles that conflict (SoD) |

### New Entity: `TransactionLog`
Record of what users actually did in the system, timestamped.

| Field | Type | Description |
|-------|------|-------------|
| logId | String | |
| userId | Association to SystemUsers | |
| transactionDate | DateTime | |
| transactionType | String | `PostJE`, `ApprovePayment`, `ModifyVendor`, `ViewReport`, `ChangeConfig` |
| objectId | String | What was acted upon |
| objectType | String | |
| amount | Decimal | If financial |
| ipAddress | String | |
| result | String | `Success`, `Failed`, `Denied` |

### Mock Data Rows

**SystemUsers (~35 rows):**
Map all 25 employees to system access. Key anomalies:
1. **IT person with GL role**: Barry Zuckerkorn (Legal Counsel) assigned `GL_ACCOUNTANT` role in SAP -- wrong department, wrong job function
2. **Terminated user with active access**: Bob Loblaw (terminated 2006) still has active SAP user, `lastLoginDate = '2024-08-15'` -- logged in 18 years after termination
3. **Ghost employees**: Mrs Featherbottom and Franklin Bluth have system access
4. **Excessive access**: GOB has `SUPER_USER` role across all systems despite being VP Sales/Magic
5. **Maeby**: Has `FINANCE_MANAGER` role despite being "Studio Liaison" (age 16)

**TransactionLog (~50 rows):**
1. Barry (IT/Legal in GL role) posting 5 journal entries totaling $180K
2. Bob Loblaw logging in and viewing payroll data post-termination
3. GOB using SUPER_USER to approve his own expense reports
4. Normal transaction activity for clean comparison

**UserAccessReviews (~20 rows):**
- Previous reviews where Bob Loblaw's access was certified as "appropriate" (reviewer didn't know him)
- Barry's GL access certified by George Sr. who was incarcerated at the time

**EntitlementValidations (~12 rows):**
- Define which roles are high risk: `GL_ACCOUNTANT`, `AP_MANAGER`, `SUPER_USER`, `PAYROLL_ADMIN`
- Define SoD conflicts: `GL_ACCOUNTANT` + `AP_MANAGER`, `PAYROLL_ADMIN` + `HR_MANAGER`

---

## Use Case 4: Key System Configuration Monitoring
**Owner:** Wesley Raider
**Category:** Cyber Risk & IT Controls, Continuous Monitoring

### What Exists
Nothing directly -- this requires new entities.

### New Entity: `SystemConfigurations`
Gold-standard baseline configurations.

| Field | Type | Description |
|-------|------|-------------|
| configId | String | |
| systemName | String | `SAP_ERP` |
| configKey | String | e.g., `THREE_WAY_MATCH_ENABLED` |
| configCategory | String | `PaymentControls`, `SecuritySettings`, `ApprovalWorkflows`, `PasswordPolicy` |
| expectedValue | String | Gold standard value |
| currentValue | String | Current system value |
| lastCheckedDate | Date | |
| isCompliant | Boolean | |
| description | String | What this config controls |
| soxRelevant | Boolean | |
| riskLevel | String | |

### New Entity: `ConfigurationChangeHistory`
Audit trail of configuration changes.

| Field | Type | Description |
|-------|------|-------------|
| changeId | String | |
| configId | Association to SystemConfigurations | |
| changeDate | Date | |
| oldValue | String | |
| newValue | String | |
| changedBy | String | |
| changeTicketRef | String | Change management ticket |
| approvedBy | String | |
| reason | String | |

### New Entity: `ApprovalWorkflows`
JE approval workflow definitions (who can create, who can approve, DoA thresholds).

| Field | Type | Description |
|-------|------|-------------|
| workflowId | String | |
| workflowName | String | |
| systemName | String | |
| creatorRole | String | Who can create |
| approverRole | String | Who can approve |
| approvalThreshold | Decimal | Dollar amount requiring approval |
| isActive | Boolean | |
| lastModifiedDate | Date | |
| lastModifiedBy | String | |

### Mock Data Rows

**SystemConfigurations (~15 rows):**
Gold standard configs including:
- `THREE_WAY_MATCH_ENABLED`: expected `true`, current `true` (compliant)
- `OVERRIDE_APPROVAL_REQUIRED`: expected `true`, current `false` (NON-COMPLIANT -- changed since gold standard)
- `PASSWORD_MIN_LENGTH`: expected `12`, current `8` (weakened)
- `PASSWORD_EXPIRY_DAYS`: expected `90`, current `365` (weakened)
- `DUAL_APPROVAL_THRESHOLD`: expected `10000`, current `50000` (raised without authorization)
- `VENDOR_DUPLICATE_CHECK`: expected `true`, current `false` (disabled)
- `JE_AUTO_APPROVAL_LIMIT`: expected `1000`, current `25000` (GOB raised it to auto-approve his magic show expenses)

**ConfigurationChangeHistory (~10 rows):**
- `OVERRIDE_APPROVAL_REQUIRED` changed by GOB on 2024-06-15 with no change ticket
- `PASSWORD_MIN_LENGTH` changed by unknown admin with ticket referencing "user convenience request"
- `JE_AUTO_APPROVAL_LIMIT` changed by GOB, approved by George Sr (incarcerated, suspicious approval)

**ApprovalWorkflows (~5 rows):**
- Manual JE: created by `GL_ACCOUNTANT`, approved by `FINANCE_MANAGER` if >$10K
- Vendor payment: created by `AP_CLERK`, approved by `AP_MANAGER` if >$5K
- One workflow with `approverRole = creatorRole` (SoD violation in workflow design)

---

## Use Case 5: Auditing Accounts Payable
**Owner:** Jamie Ontiveros
**Category:** Analysis, Testing & Documentation

### What Exists
- `Vendors` (24 rows)
- `VendorInvoices` (30 rows) -- has 3-way match, PO number, approval
- `JournalEntries` (71 rows) -- AP postings
- `GLAccounts` -- AP-related accounts

### Additional Rows Needed in Existing Tables

**More VendorInvoices (~20 new rows to reach ~50 total):**
Increase volume for meaningful sample testing. Add:
1. **Duplicate invoices**: Same vendor, same amount, same date, different invoice numbers (Sitwell Enterprises)
2. **Extended payment terms**: Vendor with Net-180 terms (Saddam Hussain Construction) -- stale payable
3. **Post-period credit notes**: 3 credit notes dated in January 2025 reversing December 2024 invoices (cutoff issue)
4. **Suspense account postings**: 2 invoices posted to a suspense GL account instead of proper expense
5. **Three-way match failures**: More invoices where PO qty/price doesn't match invoice
6. **Round-number invoices**: $50,000.00, $100,000.00 (indicator of estimates, not actual services)
7. **Weekend/holiday postings**: Invoices posted on Christmas Day and Sundays

### New Entity: `SupplierStatements`
Vendor-provided account statements for reconciliation.

| Field | Type | Description |
|-------|------|-------------|
| statementId | String | |
| vendor | Association to Vendors | |
| statementDate | Date | |
| statementBalance | Decimal | Balance per vendor |
| companyBalance | Decimal | Balance per Bluth books |
| difference | Decimal | |
| isReconciled | Boolean | |
| reconciledDate | Date | |
| reconciledBy | String | |

### New Entity: `AccrualsProvisions`
Period-end AP accruals.

| Field | Type | Description |
|-------|------|-------------|
| accrualId | String | |
| description | String | |
| vendor | Association to Vendors | |
| glAccount | Association to GLAccounts | |
| amount | Decimal | |
| accrualDate | Date | |
| reversalDate | Date | |
| isReversed | Boolean | |
| supportingDoc | String | |
| basis | String | `Invoice`, `Estimate`, `Contract`, `None` |

### Mock Data Rows

**SupplierStatements (~10 rows):**
- Most reconciled, but Sitwell Enterprises shows $45K difference (unrecorded liability)
- Iraq contractor statement shows invoices Bluth hasn't recorded

**AccrualsProvisions (~8 rows):**
- Normal accruals for utilities, rent
- $200K accrual for "Iraq construction contingency" with `basis = 'None'` -- no supporting documentation
- Accrual that was never reversed from prior period (double-counted)

---

## Use Case 6: Auditing Accounts Receivable
**Owner:** Jamie Ontiveros
**Category:** Analysis, Testing & Documentation

### What Exists
- `Customers` (14 rows)
- `CustomerInvoices` (16 rows) with DSO, payment status
- `GLAccounts` -- AR-related accounts

### Additional Rows Needed in Existing Tables

**More CustomerInvoices (~20 new rows to reach ~36 total):**
1. **Deteriorating aging**: Series of invoices to same customer getting progressively more overdue
2. **Post-period credit notes**: Credit notes dated Jan 2025 reversing Dec 2024 revenue (channel stuffing reversal)
3. **Write-offs**: 2 invoices written off without proper bad debt review documentation
4. **Foreign currency**: Invoices to Mexico subsidiary in MXN with translation errors
5. **Extended payment terms**: Customer with Net-360 (basically never paying)
6. **Factored receivables**: Invoices sold to a factoring company but still on books (double-counting)
7. **Contingent revenue**: Invoice for "Sudden Valley lot options" that are contingent on zoning approval

### New Entity: `BadDebtProvisions`
Allowance for doubtful accounts analysis.

| Field | Type | Description |
|-------|------|-------------|
| provisionId | String | |
| customer | Association to Customers | |
| invoiceRef | String | |
| originalAmount | Decimal | |
| provisionAmount | Decimal | |
| provisionPercent | Decimal | |
| agingBucket | String | `Current`, `30-60`, `60-90`, `90-120`, `120+` |
| provisionDate | Date | |
| reviewedBy | String | |
| customerFinancialStatus | String | `Good`, `Watchlist`, `Distressed`, `Bankrupt` |
| writeOffDate | Date | |
| writeOffApprovedBy | String | |
| recoveryAmount | Decimal | |

### New Entity: `ARConfirmations`
External confirmation responses for AR substantive testing.

| Field | Type | Description |
|-------|------|-------------|
| confirmationId | String | |
| customer | Association to Customers | |
| confirmationDate | Date | |
| requestedBalance | Decimal | Per Bluth books |
| confirmedBalance | Decimal | Per customer response |
| difference | Decimal | |
| responseType | String | `Confirmed`, `DisputePartial`, `DisputeFull`, `NoResponse` |
| disputeReason | String | |
| followUpAction | String | |

### Mock Data Rows

**BadDebtProvisions (~12 rows):**
- Saddam Holdings: $500K invoice with 0% provision despite being 180+ days overdue and customer in "Distressed" status
- Sudden Valley homebuyers: Under-provisioned given project cancellation
- Properly provisioned clean records for comparison

**ARConfirmations (~10 rows):**
- Sitwell: Disputes $200K balance (they say it was a barter/land swap, not a receivable)
- US Government: No response to confirmation request (3 attempts)
- 2 customers confirm different amounts than books show

---

## Use Case 7: Auditing Cash and Cash Equivalents
**Owner:** Jamie Ontiveros
**Category:** Analysis, Testing & Documentation

### What Exists
- `BankStatements` (12 rows) -- single account, 2024
- `BankTransactions` (27 rows)
- `GLAccounts` -- cash accounts

### Additional Rows Needed

**More BankStatements (~12 new rows):**
Add a second bank account (perhaps the Mexico peso account and the "hidden" Cayman Islands account):
- `****7890-MEX` -- Mexico operations account in MXN
- `****0001-CAY` -- Cayman Islands account (undisclosed offshore)

**More BankTransactions (~20 new rows):**
1. **Inter-account transfers**: Transfers between US and Cayman accounts with no business purpose
2. **Negative balance**: Mexico account goes negative in October (overdraft)
3. **Uncleared checks**: Checks outstanding 90+ days
4. **Foreign currency**: MXN transactions with incorrect exchange rates used in GL
5. **Cash on hand**: Petty cash transactions that don't match physical count
6. **Kiting**: Rapid transfers between accounts near month-end to inflate balances

### New Entity: `CashConfirmations`
Bank confirmation responses.

| Field | Type | Description |
|-------|------|-------------|
| confirmationId | String | |
| bankAccount | String | |
| bankName | String | |
| confirmationDate | Date | |
| confirmedBalance | Decimal | Per bank |
| bookBalance | Decimal | Per GL |
| difference | Decimal | |
| currency | String | |
| hasRestrictions | Boolean | |
| restrictionDetails | String | |
| hasCompensatingBalances | Boolean | |
| loanRelationships | String | |

### New Entity: `PettyCashCounts`

| Field | Type | Description |
|-------|------|-------------|
| countId | String | |
| location | String | |
| countDate | Date | |
| expectedBalance | Decimal | |
| actualBalance | Decimal | |
| variance | Decimal | |
| countedBy | String | |
| witnessedBy | String | |
| notes | String | |

### Mock Data Rows

**CashConfirmations (~4 rows):**
- US operating account: confirmed, matches
- Mexico account: confirmed balance differs by $15K (translation error)
- Cayman account: **not disclosed to auditors** -- this is the hidden account George Sr maintains
- Banana Stand petty cash: bank confirms $0 (it's all physical cash in the walls)

**PettyCashCounts (~3 rows):**
- HQ petty cash: $500 expected, $485 actual (minor variance, OK)
- Banana Stand: $5,000 expected, $255,000 actual (THE MONEY IS IN THE BANANA STAND)
- Mexico office: $1,000 expected, $0 actual, notes: "safe was empty, no explanation"

---

## Use Case 8: Vendor Shadow AI Detection
**Owner:** Kaine Kenerly
**Category:** Analysis, Testing & Documentation

### What Exists
Nothing -- this is entirely new and not traditional financial data.

### New Entity: `VendorSoftwareInventory`
Internal register of sanctioned software tools.

| Field | Type | Description |
|-------|------|-------------|
| inventoryId | String | |
| vendorName | String | Software vendor |
| productName | String | |
| version | String | |
| ownerDepartment | String | |
| hasAICapability | Boolean | Org's current assessment |
| aiAssessmentDate | Date | When AI capability was last assessed |
| riskAssessmentComplete | Boolean | |
| contractRef | String | |
| annualCost | Decimal | |
| userCount | Integer | |
| dataClassification | String | `Public`, `Internal`, `Confidential`, `Restricted` |

### New Entity: `VendorAIIntelligence`
Simulated web intelligence about vendor AI features (what a web scrape would find).

| Field | Type | Description |
|-------|------|-------------|
| intelId | String | |
| vendorName | String | |
| productName | String | |
| sourceType | String | `ProductPage`, `ReleaseNotes`, `TechPress`, `Blog` |
| sourceUrl | String | Simulated URL |
| publishDate | Date | |
| aiFeatureName | String | |
| aiFeatureDescription | String | |
| featureType | String | `GenAI`, `ML`, `Predictive`, `NLP`, `ComputerVision` |
| isActive | Boolean | Feature is live, not beta |

### Mock Data Rows

**VendorSoftwareInventory (~15 rows):**
Tools a company like Bluth would use:
- `SAP S/4HANA` -- hasAI: Yes (Joule AI known and assessed)
- `Microsoft 365` -- hasAI: No (Copilot NOT yet assessed -- shadow AI!)
- `Salesforce` -- hasAI: No (Einstein AI not assessed)
- `Slack` -- hasAI: No (Slack AI not assessed)
- `Zoom` -- hasAI: No (AI Companion not assessed)
- `DocuSign` -- hasAI: Yes (properly assessed)
- `Workday` -- hasAI: No (ML features not assessed)
- `ServiceNow` -- hasAI: No (Now Assist not assessed)
- `Concur` -- hasAI: Yes (properly assessed)
- `BlackLine` -- hasAI: No (AI features not assessed)
- `Jira` -- hasAI: No (Atlassian Intelligence not assessed)
- `Adobe Acrobat` -- hasAI: No (Firefly/AI Assistant not assessed)
- Internal custom tool -- hasAI: No
- `Banana Stand POS` -- hasAI: No (custom, genuinely no AI)
- `Cornballer.com` -- hasAI: No (custom e-commerce, genuinely no AI)

**VendorAIIntelligence (~25 rows):**
Simulated findings from web scraping:
- Microsoft 365: "Copilot AI now embedded in Word, Excel, PowerPoint" (2024 release notes)
- Salesforce: "Einstein GPT brings generative AI to every CRM workflow"
- Slack: "Slack AI summarizes channels and threads automatically"
- Zoom: "AI Companion generates meeting summaries and action items"
- Workday: "ML-powered skills intelligence and anomaly detection"
- ServiceNow: "Now Assist uses GenAI for case summarization"
- BlackLine: "AI-powered transaction matching and anomaly detection"
- Jira: "Atlassian Intelligence uses AI for issue summarization"
- Adobe: "Firefly generative AI integrated into Acrobat"

**Expected exceptions:** 10 tools marked `hasAI: No` internally but with active AI features found in web intelligence.

---

## Use Case 9: Key System Configuration Monitoring
**Owner:** Wesley Raider
**See Use Case 4 above** (already covered under "Key System Configuration Monitoring")

---

## Use Case 10: ITAC Configuration Changes Monitoring
**Owner:** Marina Tieman
**Note:** Marked as duplicative of Wesley's use case. Data from Use Case 4 (`SystemConfigurations`, `ConfigurationChangeHistory`) covers this. No additional entities needed.

---

## Use Case 11: Sample Selection (Risk-Based)
**Owner:** Jon Taber

### What Exists
Existing transaction data (JournalEntries, VendorInvoices, etc.) can be used directly. The AI needs to score and sample.

### Additional Fields on Existing Entities

**Add to `JournalEntries`:**
- `isManualOverride` (Boolean) -- was normal workflow bypassed?
- `postingTime` (Time) -- time of day (to detect after-hours postings)
- `vendorRiskScore` (Integer) -- 1-100 composite risk score

### Additional Rows in JournalEntries (~15 new rows)
Add entries with risk indicators:
1. **After-hours postings**: 5 JEs posted between 11pm-4am by GOB
2. **Manual overrides**: 3 JEs where `isManualOverride = true` and amount > $100K
3. **Round amounts**: JEs for exactly $100,000, $250,000, $500,000
4. **Just-below-threshold**: JEs at $9,999 (just under $10K approval threshold)
5. **Reversal chains**: JE posted, reversed, re-posted with different amount

---

## Use Case 12: Root Cause Analysis
**Owner:** Jon Taber

### New Entity: `AuditFindings`
Historical audit findings for root cause classification.

| Field | Type | Description |
|-------|------|-------------|
| findingId | String | |
| auditEngagement | String | |
| findingDate | Date | |
| title | String | |
| description | String | |
| severity | String | `Critical`, `High`, `Medium`, `Low` |
| rootCauseCategory | String | `People`, `Process`, `Technology`, `Governance`, `IncentiveStructure` |
| processArea | String | |
| controlOwner | String | |
| managementResponse | String | |
| remediationStatus | String | `Open`, `InProgress`, `Closed`, `Overdue` |
| remediationDueDate | Date | |
| isRecurring | Boolean | |
| priorFindingRef | String | Link to prior similar finding |

### Mock Data Rows (~20 rows)
Mix of findings across all categories:
1. **People**: "Accounts payable clerk posted entries without required training certification"
2. **Process**: "Three-way match process bypassed for 12% of invoices -- no exception workflow"
3. **Technology**: "Automated duplicate detection disabled after system upgrade in March"
4. **Governance**: "Delegation of Authority matrix not updated after org restructure"
5. **Incentive Structure**: "Sales team bonus tied to revenue recognition timing, incentivizing premature booking"
6. **Recurring**: 3 findings marked `isRecurring = true` with references to prior year findings

---

## Use Case 13: Audit Report Storytelling
**Owner:** Kaine

### New Entity: `AuditEngagements`
Historical audit reports and conclusions.

| Field | Type | Description |
|-------|------|-------------|
| engagementId | String | |
| auditTitle | String | |
| auditType | String | `Financial`, `Operational`, `Compliance`, `IT` |
| auditPeriod | String | |
| overallRating | String | `Satisfactory`, `NeedsImprovement`, `Unsatisfactory` |
| executiveSummary | String(2000) | |
| keyThemes | String(1000) | |
| findingsCount | Integer | |
| criticalFindings | Integer | |
| reportDate | Date | |
| auditLead | String | |
| stakeholderFeedback | String(1000) | |

### Mock Data Rows (~6 rows)
Historical Bluth Company audits:
1. "2022 Annual Financial Audit" -- Unsatisfactory, 3 critical findings (SEC fraud, related party)
2. "2023 SOX Compliance Review" -- Needs Improvement, recurring findings
3. "2023 IT General Controls Audit" -- Needs Improvement, access management issues
4. "2024 Q1 Vendor Management Review" -- Unsatisfactory, related party transactions
5. "2024 Q2 Payroll Audit" -- Unsatisfactory, ghost employees discovered
6. "2024 Construction Project Review" -- Unsatisfactory, Iraq project concerns

---

## Use Case 14: Regulatory Compliance Audit
**Owner:** Kaine Kenerly

### New Entity: `RegulatoryEnforcementActions`

| Field | Type | Description |
|-------|------|-------------|
| actionId | String | |
| issuingAgency | String | `SEC`, `OCC`, `FRB`, `StateAG` |
| enforcementTitle | String | |
| caseId | String | |
| rootCauseCategory | String | |
| failureDetails | String | |
| quantitativeFindings | String | |
| fineAmount | Decimal | |
| actionDate | Date | |
| regulatoryFocus | String | |
| industryBenchmark | String | |

### Mock Data Rows (~10 rows)
Simulated enforcement actions (not Bluth-specific, but industry examples the AI would use for risk mapping):
1. SEC action against "Gobias Industries" for undisclosed related party transactions ($15M fine)
2. OCC action for weak vendor due diligence leading to data breach
3. State AG action for consumer protection violations in real estate sales
4. FRB supervisory letter on IT change management deficiencies

---

## Use Case 15: Business Continuity / Disaster Recovery
**Owner:** Kaine Kenerly

### New Entity: `BCPDocuments`
Mock BCP/DRP documents as structured data.

| Field | Type | Description |
|-------|------|-------------|
| documentId | String | |
| documentType | String | `Policy`, `BIA`, `BCP`, `DRP`, `ExerciseReport`, `ExerciseCalendar` |
| title | String | |
| department | String | |
| version | String | |
| lastReviewDate | Date | |
| nextReviewDate | Date | |
| approvedBy | String | |
| status | String | `Current`, `Draft`, `Expired`, `Missing` |

### New Entity: `BusinessImpactAnalysis`

| Field | Type | Description |
|-------|------|-------------|
| biaId | String | |
| businessProcess | String | |
| department | String | |
| criticalityLevel | String | `Critical`, `High`, `Medium`, `Low` |
| rto | Integer | Recovery Time Objective (hours) |
| rpo | Integer | Recovery Point Objective (hours) |
| itDependencies | String | Systems this process depends on |
| vendorDependencies | String | Third parties this process depends on |
| manualWorkaround | Boolean | Can this process run manually? |

### New Entity: `BCPExerciseResults`

| Field | Type | Description |
|-------|------|-------------|
| exerciseId | String | |
| exerciseType | String | `Tabletop`, `Functional`, `FullScale` |
| exerciseDate | Date | |
| scenario | String | |
| targetProcess | String | |
| targetRTO | Integer | Expected recovery (hours) |
| actualRecovery | Integer | Actual recovery time (hours) |
| passed | Boolean | |
| deficienciesNoted | String | |
| correctiveActionPlan | String | |
| correctiveActionDue | Date | |
| correctiveActionComplete | Boolean | |
| retestDate | Date | |
| retestPassed | Boolean | |

### Mock Data Rows

**BCPDocuments (~10 rows):**
- Policy: Current but last reviewed 3 years ago
- BIA: Draft status (never finalized)
- DRP for ERP: Expired, references a system that was decommissioned
- BCP for Banana Stand: Missing entirely

**BusinessImpactAnalysis (~8 rows):**
- Wire transfers: Critical, RTO=4hrs, RPO=1hr
- Construction project management: High, RTO=24hrs
- Banana Stand operations: Low, RTO=72hrs (but generates significant cash revenue)
- **Concentration risk**: 4 different processes list "Sitwell IT Services" as vendor dependency

**BCPExerciseResults (~6 rows):**
1. Wire transfer recovery test: RTO target 4hrs, actual 8hrs, `passed = false`, **no corrective action documented**
2. ERP failover test: Passed
3. Email recovery: Passed
4. Tabletop for office evacuation: Passed but noted "no plan for Buster's hook hand equipment"
5. Full-scale DR test: Cancelled due to "George Sr.'s court date conflict"

---

## Use Case 16: Audit Reviews (Quality Assurance)
**Owner:** Jon Taber

This use case is about checking audit workpaper quality, not adding financial data. It would use `AuditFindings` and `AuditEngagements` from Use Cases 12-13. No additional data entities needed beyond what's already planned.

---

## Summary: New Entities Required

| # | Entity | Primary Use Case | Est. Rows |
|---|--------|-----------------|-----------|
| 1 | VendorChangeLog | VMF Review | ~40 |
| 2 | DelegationOfAuthority | VMF Review, Config | ~8 |
| 3 | BankReconciliations | Bank Recon | ~12 |
| 4 | ReconcilingItems | Bank Recon | ~30 |
| 5 | SystemUsers | Access Appropriateness | ~35 |
| 6 | UserAccessReviews | Access Appropriateness | ~20 |
| 7 | EntitlementValidations | Access Appropriateness | ~12 |
| 8 | TransactionLog | Access Appropriateness | ~50 |
| 9 | SystemConfigurations | Config Monitoring | ~15 |
| 10 | ConfigurationChangeHistory | Config Monitoring | ~10 |
| 11 | ApprovalWorkflows | Config Monitoring | ~5 |
| 12 | SupplierStatements | AP Audit | ~10 |
| 13 | AccrualsProvisions | AP Audit | ~8 |
| 14 | BadDebtProvisions | AR Audit | ~12 |
| 15 | ARConfirmations | AR Audit | ~10 |
| 16 | CashConfirmations | Cash Audit | ~4 |
| 17 | PettyCashCounts | Cash Audit | ~3 |
| 18 | VendorSoftwareInventory | Shadow AI | ~15 |
| 19 | VendorAIIntelligence | Shadow AI | ~25 |
| 20 | AuditFindings | Root Cause | ~20 |
| 21 | AuditEngagements | Report Storytelling | ~6 |
| 22 | RegulatoryEnforcementActions | Regulatory Compliance | ~10 |
| 23 | BCPDocuments | BCP/DR | ~10 |
| 24 | BusinessImpactAnalysis | BCP/DR | ~8 |
| 25 | BCPExerciseResults | BCP/DR | ~6 |
| **TOTAL** | | | **~404 new rows** |

## Additions to Existing Entities

| Entity | Current Rows | New Rows | New Total |
|--------|-------------|----------|-----------|
| VendorInvoices | 30 | ~20 | ~50 |
| CustomerInvoices | 16 | ~20 | ~36 |
| JournalEntries | 71 | ~15 | ~86 |
| BankStatements | 12 | ~12 | ~24 |
| BankTransactions | 27 | ~20 | ~47 |
| **TOTAL additions** | | **~87** | |

## Grand Total: ~491 new data rows + 25 new CDS entity definitions

Estimated CSV file size increase: ~150-200KB (well within GitHub comfort zone).
