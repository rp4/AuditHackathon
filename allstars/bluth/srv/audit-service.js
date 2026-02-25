/**
 * BLUTH COMPANY AUDIT SERVICE
 * OData service implementation for AI agent audit testing
 */

const cds = require('@sap/cds');

module.exports = class AuditService extends cds.ApplicationService {
  
  init() {
    const { 
      JournalEntries, 
      Vendors, 
      Employees, 
      Projects, 
      BankTransactions,
      PayrollTransactions 
    } = this.entities;
    
    // Get high-value transactions above threshold
    this.on('getHighValueTransactions', async (req) => {
      const { threshold } = req.data;
      return await SELECT.from(JournalEntries)
        .where({ amount: { '>=': threshold || 100000 } })
        .orderBy({ amount: 'desc' });
    });
    
    // Get related party transactions summary
    this.on('getRelatedPartyTransactionsSummary', async () => {
      const vendors = await SELECT.from(Vendors)
        .where({ isRelatedParty: true });
      
      const totalAmount = vendors.reduce((sum, v) => sum + (v.balance || 0), 0);
      const partyTypes = [...new Set(vendors.map(v => v.relatedPartyType).filter(Boolean))];
      
      return {
        totalAmount,
        transactionCount: vendors.length,
        partyTypes
      };
    });
    
    // Get vendor payment analysis
    this.on('getVendorPaymentAnalysis', async (req) => {
      const { vendorId } = req.data;
      
      const entries = await SELECT.from(JournalEntries)
        .where({ vendor_ID: vendorId, debitCredit: 'D' });
      
      const totalPayments = entries.reduce((sum, e) => sum + Number(e.amount), 0);
      
      return {
        totalPayments,
        invoiceCount: entries.length,
        averagePaymentDays: 30 // Simplified
      };
    });
    
    // Get payroll anomalies - detects ghost employees and duplicates
    this.on('getPayrollAnomalies', async () => {
      const employees = await SELECT.from(Employees);
      const anomalies = [];
      
      // Find duplicate bank accounts
      const bankAccountMap = new Map();
      for (const emp of employees) {
        if (emp.bankAccount) {
          if (bankAccountMap.has(emp.bankAccount)) {
            const other = bankAccountMap.get(emp.bankAccount);
            anomalies.push({
              employeeId: emp.employeeNumber,
              employeeName: emp.fullName,
              anomalyType: 'DUPLICATE_BANK_ACCOUNT',
              amount: emp.salary || 0,
              description: `Same bank account (${emp.bankAccount}) as ${other.fullName}`
            });
          }
          bankAccountMap.set(emp.bankAccount, emp);
        }
      }
      
      // Find ghost employees (terminated but still active)
      for (const emp of employees) {
        if (emp.terminationDate && emp.employmentStatus === 'Active') {
          anomalies.push({
            employeeId: emp.employeeNumber,
            employeeName: emp.fullName,
            anomalyType: 'GHOST_EMPLOYEE',
            amount: emp.salary || 0,
            description: `Terminated on ${emp.terminationDate} but status is Active`
          });
        }
      }
      
      // Find puppets and fake employees
      const suspiciousNames = ['Franklin', 'Featherbottom'];
      for (const emp of employees) {
        if (suspiciousNames.some(name => emp.fullName?.includes(name))) {
          anomalies.push({
            employeeId: emp.employeeNumber,
            employeeName: emp.fullName,
            anomalyType: 'SUSPICIOUS_EMPLOYEE',
            amount: emp.salary || 0,
            description: `Employee name suggests potential fraud: ${emp.fullName}`
          });
        }
      }
      
      return anomalies;
    });
    
    // Get project cost overruns
    this.on('getProjectCostOverruns', async () => {
      return await SELECT.from(Projects)
        .where({ costVariance: { '>': 0 } })
        .orderBy({ costVariance: 'desc' });
    });
    
    // Get suspicious bank transactions
    this.on('getSuspiciousBankTransactions', async () => {
      return await SELECT.from(BankTransactions)
        .where({ suspiciousFlag: true })
        .orderBy({ amount: 'desc' });
    });
    
    return super.init();
  }
};
