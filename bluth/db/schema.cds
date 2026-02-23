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
