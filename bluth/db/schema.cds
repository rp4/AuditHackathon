namespace bluth.company;

using { Currency, managed, cuid } from '@sap/cds/common';

// ============================================================
// BLUTH COMPANY - SAP Mock Data Model
// Based on Arrested Development for audit testing
// ============================================================

// Company Codes / Organizational Units
entity CompanyCodes : cuid, managed {
  code        : String(4);
  name        : String(100);
  currency    : Currency;
  country     : String(2);
  city        : String(50);
  isActive    : Boolean default true;
}

// Cost Centers (Departments)
entity CostCenters : cuid, managed {
  code        : String(10);
  name        : String(100);
  companyCode : Association to CompanyCodes;
  manager     : Association to Employees;
  budget      : Decimal(15,2);
  isActive    : Boolean default true;
}

// General Ledger Accounts
entity GLAccounts : cuid, managed {
  accountNumber : String(10);
  name          : String(100);
  accountType   : String(20); // Asset, Liability, Equity, Revenue, Expense
  category      : String(50);
  isActive      : Boolean default true;
  balance       : Decimal(15,2);
}

// Journal Entries - Core transaction record
entity JournalEntries : cuid, managed {
  documentNumber  : String(20);
  postingDate     : Date;
  documentDate    : Date;
  companyCode     : Association to CompanyCodes;
  glAccount       : Association to GLAccounts;
  costCenter      : Association to CostCenters;
  amount          : Decimal(15,2);
  currency        : Currency;
  debitCredit     : String(1); // D or C
  description     : String(500);
  reference       : String(100);
  vendor          : Association to Vendors;
  customer        : Association to Customers;
  employee        : Association to Employees;
  project         : Association to Projects;
  reversalFlag    : Boolean default false;
  reversedEntry   : String(20);
  postedBy        : String(50);
  approvedBy      : String(50);
  sourceSystem    : String(20);
}

// Vendors (Accounts Payable)
entity Vendors : cuid, managed {
  vendorNumber    : String(10);
  name            : String(200);
  category        : String(50);
  taxId           : String(20);
  address         : String(500);
  city            : String(50);
  country         : String(2);
  phone           : String(30);
  email           : String(100);
  bankAccount     : String(50);
  bankRoutingNumber : String(20);
  paymentTerms    : String(10);
  isRelatedParty  : Boolean default false;
  relatedPartyType : String(50);
  isActive        : Boolean default true;
  riskRating      : String(10);
  notes           : String(1000);
}

// Vendor Invoices
entity VendorInvoices : cuid, managed {
  invoiceNumber   : String(20);
  vendor          : Association to Vendors;
  invoiceDate     : Date;
  dueDate         : Date;
  postingDate     : Date;
  companyCode     : Association to CompanyCodes;
  glAccount       : Association to GLAccounts;
  costCenter      : Association to CostCenters;
  project         : Association to Projects;
  amount          : Decimal(15,2);
  currency        : Currency;
  taxAmount       : Decimal(15,2);
  description     : String(500);
  paymentStatus   : String(20);
  paymentDate     : Date;
  paymentMethod   : String(20);
  approvedBy      : String(50);
  threeWayMatch   : Boolean;
  poNumber        : String(20);
  receiptNumber   : String(20);
}

// Customers (Accounts Receivable)
entity Customers : cuid, managed {
  customerNumber  : String(10);
  name            : String(200);
  category        : String(50);
  taxId           : String(20);
  address         : String(500);
  city            : String(50);
  country         : String(2);
  phone           : String(30);
  email           : String(100);
  creditLimit     : Decimal(15,2);
  paymentTerms    : String(10);
  isRelatedParty  : Boolean default false;
  isActive        : Boolean default true;
}

// Customer Invoices (AR)
entity CustomerInvoices : cuid, managed {
  invoiceNumber   : String(20);
  customer        : Association to Customers;
  invoiceDate     : Date;
  dueDate         : Date;
  companyCode     : Association to CompanyCodes;
  glAccount       : Association to GLAccounts;
  costCenter      : Association to CostCenters;
  project         : Association to Projects;
  amount          : Decimal(15,2);
  currency        : Currency;
  taxAmount       : Decimal(15,2);
  description     : String(500);
  paymentStatus   : String(20);
  paymentDate     : Date;
  daysSalesOutstanding : Integer;
}

// Employees
entity Employees : cuid, managed {
  employeeNumber  : String(10);
  firstName       : String(50);
  lastName        : String(50);
  fullName        : String(100);
  department      : String(50);
  jobTitle        : String(100);
  hireDate        : Date;
  terminationDate : Date;
  employmentStatus : String(20);
  salary          : Decimal(15,2);
  salaryFrequency : String(20);
  bankAccount     : String(50);
  bankRoutingNumber : String(20);
  email           : String(100);
  phone           : String(30);
  address         : String(500);
  reportsTo       : Association to Employees;
  isExecutive     : Boolean default false;
  isRelatedParty  : Boolean default false;
  relatedPartyType : String(100);
}

// Payroll Transactions
entity PayrollTransactions : cuid, managed {
  transactionId   : String(20);
  employee        : Association to Employees;
  payPeriodStart  : Date;
  payPeriodEnd    : Date;
  paymentDate     : Date;
  grossPay        : Decimal(15,2);
  netPay          : Decimal(15,2);
  federalTax      : Decimal(15,2);
  stateTax        : Decimal(15,2);
  socialSecurity  : Decimal(15,2);
  medicare        : Decimal(15,2);
  otherDeductions : Decimal(15,2);
  bonusAmount     : Decimal(15,2);
  overtimeHours   : Decimal(5,2);
  overtimePay     : Decimal(15,2);
  expenseReimbursement : Decimal(15,2);
  costCenter      : Association to CostCenters;
  glAccount       : Association to GLAccounts;
  approvedBy      : String(50);
}

// Expense Reports
entity ExpenseReports : cuid, managed {
  reportNumber    : String(20);
  employee        : Association to Employees;
  submissionDate  : Date;
  approvalDate    : Date;
  paymentDate     : Date;
  status          : String(20);
  totalAmount     : Decimal(15,2);
  currency        : Currency;
  approvedBy      : String(50);
  costCenter      : Association to CostCenters;
  project         : Association to Projects;
  description     : String(500);
  receiptsAttached : Boolean;
  items           : Composition of many ExpenseItems on items.expenseReport = $self;
}

// Expense Line Items
entity ExpenseItems : cuid {
  expenseReport   : Association to ExpenseReports;
  lineNumber      : Integer;
  expenseDate     : Date;
  category        : String(50);
  merchant        : String(100);
  amount          : Decimal(15,2);
  description     : String(500);
  hasReceipt      : Boolean;
  glAccount       : Association to GLAccounts;
}

// Fixed Assets
entity FixedAssets : cuid, managed {
  assetNumber     : String(20);
  description     : String(200);
  category        : String(50);
  acquisitionDate : Date;
  acquisitionCost : Decimal(15,2);
  accumulatedDepreciation : Decimal(15,2);
  netBookValue    : Decimal(15,2);
  usefulLife      : Integer;
  depreciationMethod : String(20);
  location        : String(100);
  costCenter      : Association to CostCenters;
  assignedTo      : Association to Employees;
  serialNumber    : String(50);
  status          : String(20);
  disposalDate    : Date;
  disposalAmount  : Decimal(15,2);
  vendor          : Association to Vendors;
}

// Projects
entity Projects : cuid, managed {
  projectNumber   : String(20);
  name            : String(100);
  description     : String(500);
  projectType     : String(50);
  status          : String(20);
  startDate       : Date;
  plannedEndDate  : Date;
  actualEndDate   : Date;
  budget          : Decimal(15,2);
  actualCost      : Decimal(15,2);
  costVariance    : Decimal(15,2);
  projectManager  : Association to Employees;
  companyCode     : Association to CompanyCodes;
  costCenter      : Association to CostCenters;
  location        : String(100);
  country         : String(2);
  riskLevel       : String(10);
}

// Inventory
entity Inventory : cuid, managed {
  itemNumber      : String(20);
  description     : String(200);
  category        : String(50);
  location        : String(50);
  quantityOnHand  : Integer;
  unitCost        : Decimal(15,2);
  totalValue      : Decimal(15,2);
  reorderPoint    : Integer;
  lastCountDate   : Date;
  lastCountQty    : Integer;
  varianceQty     : Integer;
  status          : String(20);
}

// Inventory Transactions
entity InventoryTransactions : cuid, managed {
  transactionId   : String(20);
  item            : Association to Inventory;
  transactionDate : Date;
  transactionType : String(20);
  quantity        : Integer;
  unitCost        : Decimal(15,2);
  totalValue      : Decimal(15,2);
  reference       : String(100);
  location        : String(50);
  reason          : String(200);
}

// Bank Statements
entity BankStatements : cuid, managed {
  statementId     : String(20);
  bankAccount     : String(50);
  statementDate   : Date;
  openingBalance  : Decimal(15,2);
  closingBalance  : Decimal(15,2);
  totalDebits     : Decimal(15,2);
  totalCredits    : Decimal(15,2);
}

// Bank Transactions
entity BankTransactions : cuid, managed {
  transactionId   : String(20);
  statement       : Association to BankStatements;
  transactionDate : Date;
  valueDate       : Date;
  amount          : Decimal(15,2);
  debitCredit     : String(1);
  description     : String(500);
  reference       : String(100);
  counterparty    : String(200);
  matchedEntry    : String(20);
  isReconciled    : Boolean default false;
  suspiciousFlag  : Boolean default false;
  flagReason      : String(200);
}

// Related Party Transactions Log
entity RelatedPartyTransactions : cuid, managed {
  transactionId   : String(20);
  transactionDate : Date;
  transactionType : String(50);
  partyType       : String(50);
  partyName       : String(200);
  amount          : Decimal(15,2);
  description     : String(500);
  disclosureStatus : String(20);
  approvedBy      : String(50);
  relatedEntity   : String(100);
}

// ============================================================
// VENDOR MASTER FILE REVIEW - VMF change log and DoA matrix
// ============================================================

// Vendor Change Log - tracks all additions/modifications to vendor master
entity VendorChangeLog : cuid, managed {
  changeId          : String(20);
  vendor            : Association to Vendors;
  changeDate        : Date;
  changeType        : String(20);    // New, Update, Deactivate
  fieldChanged      : String(50);
  oldValue          : String(500);
  newValue          : String(500);
  changedBy         : String(50);
  approvedBy        : String(50);
  approvalDate      : Date;
  supportingDocRef  : String(100);
  supportingDocType : String(30);    // W9, ChangeRequestForm, Email, PurchaseOrder, None
}

// Delegation of Authority - who can approve what
entity DelegationOfAuthority : cuid, managed {
  doaId           : String(20);
  employee        : Association to Employees;
  approvalType    : String(30);      // VendorMaster, Payment, JournalEntry, Expense
  maxAmount       : Decimal(15,2);
  effectiveFrom   : Date;
  effectiveTo     : Date;
  isActive        : Boolean default true;
}

// ============================================================
// BANK RECONCILIATIONS - Monthly cash account reconciliations
// ============================================================

// Bank Reconciliation records
entity BankReconciliations : cuid, managed {
  reconciliationId      : String(20);
  bankStatement         : Association to BankStatements;
  glAccount             : Association to GLAccounts;
  reconciliationPeriod  : Date;
  bankBalance           : Decimal(15,2);
  glBalance             : Decimal(15,2);
  difference            : Decimal(15,2);
  reconcilingItemsTotal : Decimal(15,2);
  unreconciledDifference : Decimal(15,2);
  preparedBy            : String(50);
  preparedDate          : Date;
  reviewedBy            : String(50);
  reviewedDate          : Date;
  reviewDeadline        : Date;
  status                : String(20);    // Draft, Reviewed, Approved
  attachedStatementPeriod : String(20);
}

// Individual reconciling items
entity ReconcilingItems : cuid, managed {
  itemId              : String(20);
  reconciliation      : Association to BankReconciliations;
  itemType            : String(30);      // OutstandingCheck, DepositInTransit, BankCharge, InterestEarned, Error, Other
  description         : String(500);
  amount              : Decimal(15,2);
  itemDate            : Date;
  ageDays             : Integer;
  supportingDocRef    : String(100);
  hasDocumentation    : Boolean default true;
  investigationNotes  : String(500);
  isResolved          : Boolean default false;
  resolvedDate        : Date;
}

// ============================================================
// ACCESS APPROPRIATENESS - User access monitoring
// ============================================================

// System user accounts mapped to employees
entity SystemUsers : cuid, managed {
  userId            : String(20);
  employee          : Association to Employees;
  systemName        : String(30);      // SAP_ERP, Banking, Payroll, ExpenseSystem
  role              : String(50);
  roleDescription   : String(200);
  isHighRisk        : Boolean default false;
  provisionedBy     : String(50);
  provisionedDate   : Date;
  lastLoginDate     : Date;
  isActive          : Boolean default true;
  deactivationDate  : Date;
}

// Historical access review certifications
entity UserAccessReviews : cuid, managed {
  reviewId          : String(20);
  reviewDate        : Date;
  reviewedBy        : String(50);
  systemUser        : Association to SystemUsers;
  accessAppropriate : Boolean;
  comments          : String(500);
  actionTaken       : String(20);      // Certified, Revoked, Modified, NoAction
}

// Which roles are high risk
entity EntitlementValidations : cuid, managed {
  validationId      : String(20);
  role              : String(50);
  systemName        : String(30);
  riskLevel         : String(10);      // High, Medium, Low
  description       : String(200);
  incompatibleRoles : String(200);
}

// Transaction audit log
entity TransactionLog : cuid, managed {
  logId             : String(20);
  systemUser        : Association to SystemUsers;
  transactionDate   : Date;
  transactionTime   : String(10);
  transactionType   : String(30);      // PostJE, ApprovePayment, ModifyVendor, ViewReport, ChangeConfig
  objectId          : String(50);
  objectType        : String(30);
  amount            : Decimal(15,2);
  ipAddress         : String(50);
  result            : String(20);      // Success, Failed, Denied
}

// ============================================================
// KEY SYSTEM CONFIGURATION - Configuration monitoring
// ============================================================

// Gold-standard baseline configurations
entity SystemConfigurations : cuid, managed {
  configId          : String(20);
  systemName        : String(30);      // SAP_ERP
  configKey         : String(50);
  configCategory    : String(30);      // PaymentControls, SecuritySettings, ApprovalWorkflows, PasswordPolicy
  expectedValue     : String(100);
  currentValue      : String(100);
  lastCheckedDate   : Date;
  isCompliant       : Boolean default true;
  description       : String(200);
  soxRelevant       : Boolean default false;
  riskLevel         : String(10);
}

// Configuration change audit trail
entity ConfigurationChangeHistory : cuid, managed {
  changeId          : String(20);
  config            : Association to SystemConfigurations;
  changeDate        : Date;
  oldValue          : String(100);
  newValue          : String(100);
  changedBy         : String(50);
  changeTicketRef   : String(50);
  approvedBy        : String(50);
  reason            : String(200);
}

// JE approval workflow definitions
entity ApprovalWorkflows : cuid, managed {
  workflowId        : String(20);
  workflowName      : String(100);
  systemName        : String(30);
  creatorRole       : String(50);
  approverRole      : String(50);
  approvalThreshold : Decimal(15,2);
  isActive          : Boolean default true;
  lastModifiedDate  : Date;
  lastModifiedBy    : String(50);
}

// ============================================================
// ACCOUNTS PAYABLE AUDIT - Supplier statements and accruals
// ============================================================

// Vendor-provided account statements for reconciliation
entity SupplierStatements : cuid, managed {
  statementId       : String(20);
  vendor            : Association to Vendors;
  statementDate     : Date;
  statementBalance  : Decimal(15,2);
  companyBalance    : Decimal(15,2);
  difference        : Decimal(15,2);
  isReconciled      : Boolean default false;
  reconciledDate    : Date;
  reconciledBy      : String(50);
}

// Period-end AP accruals
entity AccrualsProvisions : cuid, managed {
  accrualId         : String(20);
  description       : String(200);
  vendor            : Association to Vendors;
  glAccount         : Association to GLAccounts;
  amount            : Decimal(15,2);
  accrualDate       : Date;
  reversalDate      : Date;
  isReversed        : Boolean default false;
  supportingDoc     : String(100);
  basis             : String(20);      // Invoice, Estimate, Contract, None
}

// ============================================================
// ACCOUNTS RECEIVABLE AUDIT - Bad debt provisions and confirmations
// ============================================================

// Allowance for doubtful accounts
entity BadDebtProvisions : cuid, managed {
  provisionId             : String(20);
  customer                : Association to Customers;
  invoiceRef              : String(20);
  originalAmount          : Decimal(15,2);
  provisionAmount         : Decimal(15,2);
  provisionPercent        : Decimal(5,2);
  agingBucket             : String(20);    // Current, 30-60, 60-90, 90-120, 120+
  provisionDate           : Date;
  reviewedBy              : String(50);
  customerFinancialStatus : String(20);    // Good, Watchlist, Distressed, Bankrupt
  writeOffDate            : Date;
  writeOffApprovedBy      : String(50);
  recoveryAmount          : Decimal(15,2);
}

// External confirmation responses
entity ARConfirmations : cuid, managed {
  confirmationId    : String(20);
  customer          : Association to Customers;
  confirmationDate  : Date;
  requestedBalance  : Decimal(15,2);
  confirmedBalance  : Decimal(15,2);
  difference        : Decimal(15,2);
  responseType      : String(20);      // Confirmed, DisputePartial, DisputeFull, NoResponse
  disputeReason     : String(500);
  followUpAction    : String(200);
}

// ============================================================
// CASH AUDIT - Bank confirmations and petty cash counts
// ============================================================

// Bank confirmation responses
entity CashConfirmations : cuid, managed {
  confirmationId          : String(20);
  bankAccount             : String(50);
  bankName                : String(100);
  confirmationDate        : Date;
  confirmedBalance        : Decimal(15,2);
  bookBalance             : Decimal(15,2);
  difference              : Decimal(15,2);
  currency                : String(3);
  hasRestrictions         : Boolean default false;
  restrictionDetails      : String(200);
  hasCompensatingBalances : Boolean default false;
  loanRelationships       : String(200);
}

// Physical cash counts
entity PettyCashCounts : cuid, managed {
  countId           : String(20);
  location          : String(100);
  countDate         : Date;
  expectedBalance   : Decimal(15,2);
  actualBalance     : Decimal(15,2);
  variance          : Decimal(15,2);
  countedBy         : String(50);
  witnessedBy       : String(50);
  notes             : String(500);
}

// ============================================================
// VENDOR SHADOW AI - Software inventory and AI intelligence
// ============================================================

// Internal register of sanctioned software tools
entity VendorSoftwareInventory : cuid, managed {
  inventoryId           : String(20);
  vendorName            : String(100);
  productName           : String(100);
  version               : String(20);
  ownerDepartment       : String(50);
  hasAICapability       : Boolean default false;
  aiAssessmentDate      : Date;
  riskAssessmentComplete : Boolean default false;
  contractRef           : String(50);
  annualCost            : Decimal(15,2);
  userCount             : Integer;
  dataClassification    : String(20);    // Public, Internal, Confidential, Restricted
}

// Simulated web intelligence about vendor AI features
entity VendorAIIntelligence : cuid, managed {
  intelId               : String(20);
  vendorName            : String(100);
  productName           : String(100);
  sourceType            : String(20);    // ProductPage, ReleaseNotes, TechPress, Blog
  sourceUrl             : String(200);
  publishDate           : Date;
  aiFeatureName         : String(100);
  aiFeatureDescription  : String(500);
  featureType           : String(20);    // GenAI, ML, Predictive, NLP, ComputerVision
  isActive              : Boolean default true;
}

// ============================================================
// ROOT CAUSE ANALYSIS - Historical audit findings
// ============================================================

entity AuditFindings : cuid, managed {
  findingId             : String(20);
  auditEngagement       : String(50);
  findingDate           : Date;
  title                 : String(200);
  description           : String(500);
  severity              : String(10);     // Critical, High, Medium, Low
  rootCauseCategory     : String(30);     // People, Process, Technology, Governance, IncentiveStructure
  processArea           : String(50);
  controlOwner          : String(50);
  managementResponse    : String(500);
  remediationStatus     : String(20);     // Open, InProgress, Closed, Overdue
  remediationDueDate    : Date;
  isRecurring           : Boolean default false;
  priorFindingRef       : String(20);
}

// ============================================================
// AUDIT REPORT STORYTELLING - Historical audit engagements
// ============================================================

entity AuditEngagements : cuid, managed {
  engagementId          : String(20);
  auditTitle            : String(200);
  auditType             : String(20);     // Financial, Operational, Compliance, IT
  auditPeriod           : String(50);
  overallRating         : String(20);     // Satisfactory, NeedsImprovement, Unsatisfactory
  executiveSummary      : String(2000);
  keyThemes             : String(1000);
  findingsCount         : Integer;
  criticalFindings      : Integer;
  reportDate            : Date;
  auditLead             : String(50);
  stakeholderFeedback   : String(1000);
}

// ============================================================
// REGULATORY COMPLIANCE - Enforcement actions reference data
// ============================================================

entity RegulatoryEnforcementActions : cuid, managed {
  actionId              : String(20);
  issuingAgency         : String(10);     // SEC, OCC, FRB, StateAG, OFAC
  enforcementTitle      : String(200);
  caseId                : String(30);
  rootCauseCategory     : String(30);
  failureDetails        : String(500);
  quantitativeFindings  : String(200);
  fineAmount            : Decimal(15,2);
  actionDate            : Date;
  regulatoryFocus       : String(50);
  industryBenchmark     : String(200);
}

// ============================================================
// BUSINESS CONTINUITY / DR - BCP documents, BIA, exercise results
// ============================================================

entity BCPDocuments : cuid, managed {
  documentId            : String(20);
  documentType          : String(20);     // Policy, BIA, BCP, DRP, ExerciseReport, ExerciseCalendar
  title                 : String(200);
  department            : String(50);
  version               : String(10);
  lastReviewDate        : Date;
  nextReviewDate        : Date;
  approvedBy            : String(50);
  status                : String(20);     // Current, Draft, Expired, Missing
}

entity BusinessImpactAnalysis : cuid, managed {
  biaId                 : String(20);
  businessProcess       : String(100);
  department            : String(50);
  criticalityLevel      : String(10);     // Critical, High, Medium, Low
  rto                   : Integer;        // Recovery Time Objective in hours
  rpo                   : Integer;        // Recovery Point Objective in hours
  itDependencies        : String(200);
  vendorDependencies    : String(200);
  manualWorkaround      : Boolean default false;
}

entity BCPExerciseResults : cuid, managed {
  exerciseId            : String(20);
  exerciseType          : String(20);     // Tabletop, Functional, FullScale
  exerciseDate          : Date;
  scenario              : String(200);
  targetProcess         : String(100);
  targetRTO             : Integer;
  actualRecovery        : Integer;
  passed                : Boolean default false;
  deficienciesNoted     : String(500);
  correctiveActionPlan  : String(500);
  correctiveActionDue   : Date;
  correctiveActionComplete : Boolean default false;
  retestDate            : Date;
  retestPassed          : Boolean default false;
}
