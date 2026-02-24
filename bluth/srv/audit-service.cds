using bluth.company from '../db/schema';

// ============================================================
// BLUTH COMPANY AUDIT SERVICE
// OData v4 compliant service for AI agent audit testing
// ============================================================

@path: '/odata/v4/audit'
service AuditService {
  
  // Organization
  entity CompanyCodes as projection on company.CompanyCodes;
  entity CostCenters as projection on company.CostCenters;
  
  // General Ledger
  entity GLAccounts as projection on company.GLAccounts;
  entity JournalEntries as projection on company.JournalEntries;
  
  // Accounts Payable
  entity Vendors as projection on company.Vendors;
  entity VendorInvoices as projection on company.VendorInvoices;
  
  // Accounts Receivable
  entity Customers as projection on company.Customers;
  entity CustomerInvoices as projection on company.CustomerInvoices;
  
  // Human Resources / Payroll
  entity Employees as projection on company.Employees;
  entity PayrollTransactions as projection on company.PayrollTransactions;
  entity ExpenseReports as projection on company.ExpenseReports;
  entity ExpenseItems as projection on company.ExpenseItems;
  
  // Fixed Assets
  entity FixedAssets as projection on company.FixedAssets;
  
  // Projects
  entity Projects as projection on company.Projects;
  
  // Inventory
  entity Inventory as projection on company.Inventory;
  entity InventoryTransactions as projection on company.InventoryTransactions;
  
  // Banking
  entity BankStatements as projection on company.BankStatements;
  entity BankTransactions as projection on company.BankTransactions;
  
  // Compliance
  entity RelatedPartyTransactions as projection on company.RelatedPartyTransactions;

  // Vendor Master File Review
  entity VendorChangeLog as projection on company.VendorChangeLog;
  entity DelegationOfAuthority as projection on company.DelegationOfAuthority;

  // Bank Reconciliations
  entity BankReconciliations as projection on company.BankReconciliations;
  entity ReconcilingItems as projection on company.ReconcilingItems;

  // Access Appropriateness
  entity SystemUsers as projection on company.SystemUsers;
  entity UserAccessReviews as projection on company.UserAccessReviews;
  entity EntitlementValidations as projection on company.EntitlementValidations;
  entity TransactionLog as projection on company.TransactionLog;

  // Key System Configuration
  entity SystemConfigurations as projection on company.SystemConfigurations;
  entity ConfigurationChangeHistory as projection on company.ConfigurationChangeHistory;
  entity ApprovalWorkflows as projection on company.ApprovalWorkflows;

  // Accounts Payable Audit
  entity SupplierStatements as projection on company.SupplierStatements;
  entity AccrualsProvisions as projection on company.AccrualsProvisions;

  // Accounts Receivable Audit
  entity BadDebtProvisions as projection on company.BadDebtProvisions;
  entity ARConfirmations as projection on company.ARConfirmations;

  // Cash Audit
  entity CashConfirmations as projection on company.CashConfirmations;
  entity PettyCashCounts as projection on company.PettyCashCounts;

  // Vendor Shadow AI Detection
  entity VendorSoftwareInventory as projection on company.VendorSoftwareInventory;
  entity VendorAIIntelligence as projection on company.VendorAIIntelligence;

  // Root Cause Analysis
  entity AuditFindings as projection on company.AuditFindings;

  // Audit Report Storytelling
  entity AuditEngagements as projection on company.AuditEngagements;

  // Regulatory Compliance
  entity RegulatoryEnforcementActions as projection on company.RegulatoryEnforcementActions;

  // Business Continuity / Disaster Recovery
  entity BCPDocuments as projection on company.BCPDocuments;
  entity BusinessImpactAnalysis as projection on company.BusinessImpactAnalysis;
  entity BCPExerciseResults as projection on company.BCPExerciseResults;

  // ============================================================
  // AUDIT ANALYTICS FUNCTIONS
  // ============================================================
  
  // Get high-value transactions above threshold
  function getHighValueTransactions(threshold: Decimal) returns array of JournalEntries;
  
  // Get related party transactions summary
  function getRelatedPartyTransactionsSummary() returns {
    totalAmount: Decimal;
    transactionCount: Integer;
    partyTypes: array of String;
  };
  
  // Get vendor payment analysis
  function getVendorPaymentAnalysis(vendorId: String) returns {
    totalPayments: Decimal;
    invoiceCount: Integer;
    averagePaymentDays: Decimal;
  };
  
  // Get payroll anomalies
  function getPayrollAnomalies() returns array of {
    employeeId: String;
    employeeName: String;
    anomalyType: String;
    amount: Decimal;
    description: String;
  };
  
  // Get project cost overruns
  function getProjectCostOverruns() returns array of Projects;
  
  // Get suspicious bank transactions
  function getSuspiciousBankTransactions() returns array of BankTransactions;
}

// Analytics-focused read-only service
@path: '/odata/v4/analytics'
@readonly
service AnalyticsService {
  
  // Summary views for dashboards
  @readonly entity VendorSummary as select from company.Vendors {
    key ID,
    vendorNumber,
    name,
    category,
    isRelatedParty,
    riskRating
  };
  
  @readonly entity EmployeeSummary as select from company.Employees {
    key ID,
    employeeNumber,
    fullName,
    department,
    jobTitle,
    employmentStatus,
    isRelatedParty
  };
  
  @readonly entity ProjectSummary as select from company.Projects {
    key ID,
    projectNumber,
    name,
    status,
    budget,
    actualCost,
    costVariance,
    riskLevel
  };
}
