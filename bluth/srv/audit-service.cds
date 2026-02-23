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
