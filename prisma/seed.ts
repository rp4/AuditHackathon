import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create categories
  console.log('Creating categories...')
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'preplanning' },
      update: {},
      create: {
        name: 'PrePlanning',
        slug: 'preplanning',
        description: 'Workflow templates for pre-planning phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'planning' },
      update: {},
      create: {
        name: 'Planning',
        slug: 'planning',
        description: 'Workflow templates for planning phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'fieldwork' },
      update: {},
      create: {
        name: 'Fieldwork',
        slug: 'fieldwork',
        description: 'Workflow templates for fieldwork phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'reporting' },
      update: {},
      create: {
        name: 'Reporting',
        slug: 'reporting',
        description: 'Workflow templates for reporting phase of audit engagement',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'other' },
      update: {},
      create: {
        name: 'Other',
        slug: 'other',
        description: 'Other audit-related workflow templates',
      },
    }),
  ])
  console.log(`✓ Created ${categories.length} categories`)

  // Create dev user (for email/password auth in dev)
  console.log('Creating dev user...')
  const devPasswordHash = await bcrypt.hash('devpassword123', 10)
  const devUser = await prisma.user.upsert({
    where: { email: 'dev@openauditswarms.com' },
    update: {},
    create: {
      email: 'dev@openauditswarms.com',
      name: 'Dev User',
      passwordHash: devPasswordHash,
      bio: 'Development test user',
      emailVerified: new Date(),
    },
  })
  console.log(`✓ Created dev user: ${devUser.email}`)

  // Create a sample swarm with workflow nodes
  console.log('Creating sample swarm...')

  const sampleNodes = [
    {
      id: 'node_1',
      type: 'step',
      position: { x: 100, y: 100 },
      data: {
        label: 'Gather Financial Statements',
        description: 'Collect all relevant financial statements from the client',
        instructions: 'Request balance sheet, income statement, and cash flow statement for the audit period.',
        linkedAgentUrl: '',
      },
    },
    {
      id: 'node_2',
      type: 'step',
      position: { x: 400, y: 100 },
      data: {
        label: 'Analyze Key Ratios',
        description: 'Calculate and analyze key financial ratios',
        instructions: 'Calculate liquidity, profitability, and solvency ratios. Compare with prior periods and industry benchmarks.',
        linkedAgentUrl: '',
      },
    },
    {
      id: 'node_3',
      type: 'step',
      position: { x: 700, y: 100 },
      data: {
        label: 'Document Red Flags',
        description: 'Document any unusual items or potential risks',
        instructions: 'Note any significant variances, unusual transactions, or areas requiring deeper investigation.',
        linkedAgentUrl: '',
      },
    },
  ]

  const sampleEdges = [
    { id: 'edge_1-2', source: 'node_1', target: 'node_2' },
    { id: 'edge_2-3', source: 'node_2', target: 'node_3' },
  ]

  const sampleSwarm = await prisma.swarm.create({
    data: {
      name: 'Financial Statement Analyzer',
      slug: 'financial-statement-analyzer',
      description: 'A workflow template for analyzing financial statements and identifying potential red flags, unusual transactions, and areas requiring deeper audit attention.',
      workflowNodes: JSON.stringify(sampleNodes),
      workflowEdges: JSON.stringify(sampleEdges),
      workflowMetadata: JSON.stringify({ phase: 'Planning', standard: 'General' }),
      workflowVersion: '1.0',
      userId: devUser.id,
      categoryId: categories[0].id,
      is_public: true,
      is_featured: true,
      publishedAt: new Date(),
    },
  })
  console.log(`✓ Created sample swarm: ${sampleSwarm.name}`)

  // Seed audit issues (the answer key for the game)
  console.log('Seeding audit issues...')

  const auditIssues = [
    // === Access Management (18) ===
    { issueCode: 'AM-001', title: 'Terminated user retains SAP access', description: 'Bob Loblaw (E013) terminated but retains SAP access', category: 'Access Management', severity: 'Critical', dataSource: 'User_Access_Report.csv', evidence: 'Terminated 2007-08-31, U023 still Active' },
    { issueCode: 'AM-002', title: 'Terminated user retains Email access', description: 'Bob Loblaw (E013) terminated but retains Email access', category: 'Access Management', severity: 'Critical', dataSource: 'User_Access_Report.csv', evidence: 'U024 still Active' },
    { issueCode: 'AM-003', title: 'Terminated user retains VPN access', description: 'Bob Loblaw (E013) terminated but retains VPN access with active tunnel detected', category: 'Access Management', severity: 'Critical', dataSource: 'User_Access_Report.csv', evidence: 'U025 still Active, active VPN tunnel detected' },
    { issueCode: 'AM-004', title: 'Terminated user retains SAP access', description: 'Rita Leeds (E025) terminated but retains SAP access', category: 'Access Management', severity: 'High', dataSource: 'User_Access_Report.csv', evidence: 'Terminated 2006-06-30, U034 still Active' },
    { issueCode: 'AM-005', title: 'Access removal ticket open 90+ days', description: 'Bob Loblaw (E013) access removal ticket has been open for over 90 days', category: 'Access Management', severity: 'High', dataSource: 'Change_Requests.csv', evidence: 'CHG-006 open since 2024-08-31' },
    { issueCode: 'AM-006', title: 'Access removal ticket open 18 years', description: 'Rita Leeds (E025) access removal ticket has been open for 18 years', category: 'Access Management', severity: 'Critical', dataSource: 'Change_Requests.csv', evidence: 'CHG-013 open since 2006-07-01' },
    { issueCode: 'AM-007', title: 'Incarcerated CEO retains admin access', description: 'George Bluth Sr (E001) is incarcerated but retains SAP admin and VPN full access', category: 'Access Management', severity: 'Critical', dataSource: 'User_Access_Report.csv', evidence: 'U001 SAP Admin, U002 VPN Full' },
    { issueCode: 'AM-008', title: 'Login attempts from blocked country', description: 'George Bluth Sr (E001) has login attempts from Mexico while incarcerated', category: 'Access Management', severity: 'High', dataSource: 'Failed_Logins.csv', evidence: '4 attempts from Mexico (187.45.23.x)' },
    { issueCode: 'AM-009', title: 'Security alert for geo-anomaly', description: 'George Bluth Sr (E001) triggered geo-anomaly security alert for login from Mexico', category: 'Access Management', severity: 'Critical', dataSource: 'Security_Alerts.csv', evidence: 'SEC001 - Login from Mexico' },
    { issueCode: 'AM-010', title: 'Self-approved Domain Admin access', description: 'GOB Bluth (E004) self-approved his own Domain Admin access', category: 'Access Management', severity: 'Critical', dataSource: 'User_Access_Report.csv', evidence: 'U010 approved by E004 (self)' },
    { issueCode: 'AM-011', title: 'Self-approved change ticket', description: 'GOB Bluth (E004) self-approved change ticket CHG-003', category: 'Access Management', severity: 'High', dataSource: 'Change_Requests.csv', evidence: 'CHG-003 IsSelfApproved=TRUE' },
    { issueCode: 'AM-012', title: 'No access review completed', description: 'GOB Bluth (E004) access review is still pending', category: 'Access Management', severity: 'High', dataSource: 'Access_Review_Status.csv', evidence: 'AR-2024-Q3-004 still Pending' },
    { issueCode: 'AM-013', title: 'Privilege escalation alert', description: 'GOB Bluth (E004) triggered privilege escalation alert when added to Domain Admins', category: 'Access Management', severity: 'Medium', dataSource: 'Security_Alerts.csv', evidence: 'SEC004 - Added to Domain Admins' },
    { issueCode: 'AM-014', title: 'Non-human entity has badge access', description: 'Franklin Bluth (E020), a puppet, has badge system access', category: 'Access Management', severity: 'High', dataSource: 'User_Access_Report.csv', evidence: 'U030 Badge_System access for puppet' },
    { issueCode: 'AM-015', title: 'Non-human entity has system access', description: 'Franklin Bluth (E020), a puppet, has SAP_PROD access', category: 'Access Management', severity: 'High', dataSource: 'User_Access_Report.csv', evidence: 'U031 SAP_PROD access for puppet' },
    { issueCode: 'AM-016', title: 'Access review approved in 1 second', description: 'Franklin Bluth (E020) access reviews were approved in 1 second indicating rubber-stamping', category: 'Access Management', severity: 'Medium', dataSource: 'Access_Review_Status.csv', evidence: 'AR-2024-Q3-013, AR-2024-Q3-014' },
    { issueCode: 'AM-017', title: 'Service account password not rotated', description: 'Service account svc-sap (SA001) password has not been rotated in 5 years (1825 days)', category: 'Access Management', severity: 'Critical', dataSource: 'Security_Alerts.csv', evidence: 'SEC014 - 1825 days (5 years)' },
    { issueCode: 'AM-018', title: 'Service account password not rotated', description: 'Service account svc-backup (SA002) password has not been rotated in 5 years (1825 days)', category: 'Access Management', severity: 'Critical', dataSource: 'Security_Alerts.csv', evidence: 'SEC015 - 1825 days (5 years)' },

    // === Change Management (10) ===
    { issueCode: 'CM-001', title: 'Change self-approved by requestor', description: 'George Michael self-approved his own Fakeblock deployment CHG-002', category: 'Change Management', severity: 'Critical', dataSource: 'Change_Requests.csv', evidence: 'George Michael approved own Fakeblock deploy' },
    { issueCode: 'CM-002', title: 'Change self-approved by requestor', description: 'GOB self-approved his own admin access request CHG-003', category: 'Change Management', severity: 'Critical', dataSource: 'Change_Requests.csv', evidence: 'GOB approved own admin access' },
    { issueCode: 'CM-003', title: 'Change self-approved by requestor', description: 'GOB self-approved Franklin badge access CHG-010', category: 'Change Management', severity: 'High', dataSource: 'Change_Requests.csv', evidence: 'GOB approved Franklin badge access' },
    { issueCode: 'CM-004', title: 'Change self-approved by requestor', description: 'George Sr self-approved his own file access CHG-014', category: 'Change Management', severity: 'High', dataSource: 'Change_Requests.csv', evidence: 'George Sr approved own file access' },
    { issueCode: 'CM-005', title: 'Emergency change with no approval', description: 'Cornballer fix emergency change CHG-004 had no approver', category: 'Change Management', severity: 'High', dataSource: 'Change_Requests.csv', evidence: 'Cornballer fix - no approver' },
    { issueCode: 'CM-006', title: 'Emergency change with no approval', description: 'Fakeblock restore emergency change CHG-012 had no approver', category: 'Change Management', severity: 'High', dataSource: 'Change_Requests.csv', evidence: 'Fakeblock restore - no approver' },
    { issueCode: 'CM-007', title: 'Unauthorized production deployment', description: 'Unknown requestor deployed to production CHG-015, status=Discovered', category: 'Change Management', severity: 'Critical', dataSource: 'Change_Requests.csv', evidence: 'Unknown requestor, status=Discovered' },
    { issueCode: 'CM-008', title: 'Production deploy without testing', description: 'Fakeblock production deployment CHG-002 had no testing evidence', category: 'Change Management', severity: 'High', dataSource: 'Change_Requests.csv', evidence: 'TestEvidence=No, TestResults=Not Run' },
    { issueCode: 'CM-009', title: 'High-risk change without testing', description: 'GOB admin access change CHG-003 had no testing evidence', category: 'Change Management', severity: 'Medium', dataSource: 'Change_Requests.csv', evidence: 'TestEvidence=No' },
    { issueCode: 'CM-010', title: 'Related party approved change', description: "Lucille approved Annyong's data export tool CHG-008", category: 'Change Management', severity: 'Medium', dataSource: 'Change_Requests.csv', evidence: "Lucille approved Annyong's data export tool" },

    // === Security (12 explicit) ===
    { issueCode: 'SEC-001', title: 'Large data export to external IP', description: 'Annyong (E011) exported 10GB of data to external IP 8.8.8.8', category: 'Security', severity: 'Critical', dataSource: 'Security_Alerts.csv', evidence: 'SEC002 - 10GB to 8.8.8.8' },
    { issueCode: 'SEC-002', title: 'Impossible travel detection', description: 'Annyong (E011) logged in from China 2 hours after logging in from US', category: 'Security', severity: 'Critical', dataSource: 'Security_Alerts.csv', evidence: 'SEC009 - China login 2hr after US' },
    { issueCode: 'SEC-003', title: 'Excessive access for intern', description: 'Annyong (E011) has ReadAll and Full FileShare access as an intern', category: 'Security', severity: 'High', dataSource: 'User_Access_Report.csv', evidence: 'U020 ReadAll, U021 Full FileShare' },
    { issueCode: 'SEC-004', title: 'Ransomware infection', description: 'Fakeblock server has an active ransomware infection', category: 'Security', severity: 'Critical', dataSource: 'Security_Alerts.csv', evidence: 'SEC005 - Status Open' },
    { issueCode: 'SEC-005', title: 'Compromised asset', description: 'Fakeblock database server fakeblock-db-01 is compromised', category: 'Security', severity: 'Critical', dataSource: 'CMDB_Assets.csv', evidence: 'Status=Compromised' },
    { issueCode: 'SEC-006', title: 'After-hours admin activity', description: 'GOB (E004) performed admin activity at 3:15 AM', category: 'Security', severity: 'High', dataSource: 'Security_Alerts.csv', evidence: 'SEC003 - 3:15 AM access' },
    { issueCode: 'SEC-007', title: 'Lateral movement detected', description: 'GOB (E004) detected scanning servers indicating lateral movement', category: 'Security', severity: 'High', dataSource: 'Security_Alerts.csv', evidence: 'SEC013 - Server scanning' },
    { issueCode: 'SEC-008', title: 'Sensitive file access', description: 'Kitty (E014) accessed 50MB of CEO files', category: 'Security', severity: 'High', dataSource: 'Security_Alerts.csv', evidence: 'SEC011 - 50MB CEO files' },
    { issueCode: 'SEC-009', title: 'VPN from unusual location', description: 'Tobias (E006) connected via VPN from Reno, an unusual location', category: 'Security', severity: 'Medium', dataSource: 'Security_Alerts.csv', evidence: 'SEC007 - Reno connection' },
    { issueCode: 'SEC-010', title: 'Brute force attack', description: 'Barry (E012) account targeted with 10 failed login attempts', category: 'Security', severity: 'Medium', dataSource: 'Security_Alerts.csv', evidence: 'SEC006 - 10 failed attempts' },
    { issueCode: 'SEC-011', title: 'Terminated user login attempt', description: 'Bob Loblaw (E013) attempted login after termination', category: 'Security', severity: 'High', dataSource: 'Security_Alerts.csv', evidence: 'SEC008' },
    { issueCode: 'SEC-012', title: 'Puppet account authentication', description: 'Franklin (E020) puppet account was used for authentication', category: 'Security', severity: 'Medium', dataSource: 'Security_Alerts.csv', evidence: 'SEC012' },

    // === Payroll/HR (8) ===
    { issueCode: 'HR-001', title: 'Puppet on payroll', description: 'Franklin Bluth (E020) is a puppet and should not be on payroll', category: 'Payroll/HR', severity: 'Critical', dataSource: 'Employee_Master.csv', evidence: 'Notes: "GHOST EMPLOYEE - PUPPET"' },
    { issueCode: 'HR-002', title: 'Duplicate bank account', description: 'Franklin and GOB Bluth share the same bank account (****7712)', category: 'Payroll/HR', severity: 'High', dataSource: 'Payroll_Register.csv', evidence: 'Both use ****7712' },
    { issueCode: 'HR-003', title: 'Duplicate identity suspected', description: 'Mrs Featherbottom (E018) shares same bank account as Tobias (****9988)', category: 'Payroll/HR', severity: 'High', dataSource: 'Employee_Master.csv', evidence: 'Same bank as Tobias (****9988)' },
    { issueCode: 'HR-004', title: 'Incarcerated employee receiving pay', description: 'George Bluth Sr (E001) is receiving $35,416.67/period while incarcerated', category: 'Payroll/HR', severity: 'Critical', dataSource: 'Payroll_Register.csv', evidence: '$35,416.67/period while in prison' },
    { issueCode: 'HR-005', title: 'Departed employee receiving pay', description: 'Annyong (E011) is departed but still receiving payroll', category: 'Payroll/HR', severity: 'High', dataSource: 'Payroll_Register.csv', evidence: 'Status shows departed' },
    { issueCode: 'HR-006', title: 'No work product for role', description: 'Buster (E009) is VP of Cartography but has produced no maps', category: 'Payroll/HR', severity: 'Medium', dataSource: 'Employee_Master.csv', evidence: 'VP of Cartography - no maps produced' },
    { issueCode: 'HR-007', title: 'Unpaid intern', description: 'Ann Veal (E024) is receiving $0 pay as an unpaid intern', category: 'Payroll/HR', severity: 'Low', dataSource: 'Payroll_Register.csv', evidence: '$0 pay - Her?' },
    { issueCode: 'HR-008', title: 'Excessive related party employment', description: '15 of 25 employees (60%) are family members, indicating excessive related party concentration', category: 'Payroll/HR', severity: 'Medium', dataSource: 'Employee_Master.csv', evidence: '15 of 25 employees (60%) are family' },

    // === Vulnerability Management (10) ===
    { issueCode: 'VM-001', title: 'Critical CVE open 180+ days', description: 'SAP Remote Code Execution vulnerability CVE-2024-1234 has been open 193 days', category: 'Vulnerability Management', severity: 'Critical', dataSource: 'Vulnerability_Scan.csv', evidence: 'VULN-001, SAP RCE, DaysOpen=193' },
    { issueCode: 'VM-002', title: 'Critical CVE open 150+ days', description: 'Domain Controller privilege escalation CVE-2024-7890 has been open 163 days', category: 'Vulnerability Management', severity: 'Critical', dataSource: 'Vulnerability_Scan.csv', evidence: 'VULN-005, DC Privilege Escalation, DaysOpen=163' },
    { issueCode: 'VM-003', title: 'Zero-day with known exploit', description: 'Zero-day vulnerability CVE-2024-0001 with CVSS 9.5 and known exploit, open 16 days', category: 'Vulnerability Management', severity: 'Critical', dataSource: 'Vulnerability_Scan.csv', evidence: 'VULN-011, CVSS 9.5, DaysOpen=16' },
    { issueCode: 'VM-004', title: 'SQL injection vulnerability', description: 'Fakeblock database has SQL injection vulnerability CVE-2024-5678, open 101 days', category: 'Vulnerability Management', severity: 'Critical', dataSource: 'Vulnerability_Scan.csv', evidence: 'VULN-002, Fakeblock DB, DaysOpen=101' },
    { issueCode: 'VM-005', title: 'Payment card data exposure', description: 'Banana Stand POS system has payment card data exposure vulnerability, CVSS 10.0', category: 'Vulnerability Management', severity: 'Critical', dataSource: 'Vulnerability_Scan.csv', evidence: 'VULN-008, CVE-2024-8901, CVSS 10.0, Banana Stand POS' },
    { issueCode: 'VM-006', title: 'EOL operating system', description: 'POS system running POSReady 7 which is end-of-life', category: 'Vulnerability Management', severity: 'High', dataSource: 'CMDB_Assets.csv', evidence: 'ASSET-008, POSReady 7 EOL on POS system' },
    { issueCode: 'VM-007', title: 'VPN authentication bypass', description: 'VPN gateway has authentication bypass vulnerability allowing blocked IP access', category: 'Vulnerability Management', severity: 'High', dataSource: 'Vulnerability_Scan.csv', evidence: 'VULN-003, CVE-2024-9012, allows blocked IP access' },
    { issueCode: 'VM-008', title: 'XSS on public website', description: 'Cross-site scripting vulnerability on public website, open 118 days', category: 'Vulnerability Management', severity: 'High', dataSource: 'Vulnerability_Scan.csv', evidence: 'VULN-006, CVE-2024-2468, DaysOpen=118' },
    { issueCode: 'VM-009', title: 'EOL operating system', description: 'maps-01 server running CentOS 6 which is end-of-life', category: 'Vulnerability Management', severity: 'Medium', dataSource: 'CMDB_Assets.csv', evidence: 'ASSET-009, CentOS 6 on maps-01' },
    { issueCode: 'VM-010', title: 'Improper access control', description: 'HR system has improper access control allowing all employee records to be viewed', category: 'Vulnerability Management', severity: 'Medium', dataSource: 'Vulnerability_Scan.csv', evidence: 'VULN-012, CVE-2024-9999, HR system - all records viewable' },

    // === Compliance (6) ===
    { issueCode: 'CMP-001', title: 'Segregation of duties violation', description: 'Multiple self-approved changes violate segregation of duties requirements', category: 'Compliance', severity: 'Critical', dataSource: 'Change_Requests.csv', evidence: 'CHG-002, CHG-003, CHG-010, CHG-014' },
    { issueCode: 'CMP-002', title: 'Access review rubber-stamping', description: '8 access reviews completed in less than 10 seconds indicating rubber-stamping', category: 'Compliance', severity: 'High', dataSource: 'Access_Review_Status.csv', evidence: '8 reviews completed in <10 seconds' },
    { issueCode: 'CMP-003', title: 'Self-review conflict of interest', description: 'Users reviewed their own access creating conflict of interest', category: 'Compliance', severity: 'High', dataSource: 'Access_Review_Status.csv', evidence: 'AR-2024-Q3-001, AR-2024-Q3-008' },
    { issueCode: 'CMP-004', title: 'Audit log retention insufficient', description: 'SEC requesting 2-year logs but company only retains 90 days', category: 'Compliance', severity: 'Critical', dataSource: 'Incidents.csv', evidence: 'INC-013 - Only 90 days retained' },
    { issueCode: 'CMP-005', title: 'Company laptop not recovered', description: 'Terminated employees have company laptops not recovered', category: 'Compliance', severity: 'High', dataSource: 'CMDB_Assets.csv', evidence: 'ASSET-014 (Annyong), ASSET-015 (Bob Loblaw)' },
    { issueCode: 'CMP-006', title: 'CEO laptop in prison', description: 'CEO laptop is located in Mexico, an unauthorized location', category: 'Compliance', severity: 'Medium', dataSource: 'CMDB_Assets.csv', evidence: 'ASSET-012 in Mexico' },

    // === Vendor Master File (10) - VMF Review ===
    { issueCode: 'VMF-001', title: 'Vendor change recorded before approval', description: 'Saddam Hussain Construction (V013) bank account changed on 2024-03-15 but approval not obtained until 2024-03-18', category: 'Vendor Master File', severity: 'Critical', dataSource: 'VendorChangeLog', evidence: 'VCL-012 changeDate=2024-03-15, approvalDate=2024-03-18, change preceded approval by 3 days' },
    { issueCode: 'VMF-002', title: 'Vendor added without supporting documentation', description: 'Forget-Me-Now Pharmaceuticals (V009) added as vendor with no supporting documentation attached', category: 'Vendor Master File', severity: 'High', dataSource: 'VendorChangeLog', evidence: 'VCL-014 supportingDocType=None, supportingDocRef is empty' },
    { issueCode: 'VMF-003', title: 'Segregation of duties failure - self-approved vendor', description: 'GOB Bluth (E004) both entered and approved Hot Cops Entertainment (V022) vendor setup', category: 'Vendor Master File', severity: 'Critical', dataSource: 'VendorChangeLog', evidence: 'VCL-016 changedBy=GOB Bluth, approvedBy=GOB Bluth' },
    { issueCode: 'VMF-004', title: 'Vendor data does not agree with supporting documentation', description: 'Balboa Towers (V010) address change shows 456 Balboa Towers Penthouse in system but supporting doc DOC-VCL018 references 1 Balboa Towers', category: 'Vendor Master File', severity: 'High', dataSource: 'VendorChangeLog', evidence: 'VCL-018 newValue=456 Balboa Towers Penthouse Unit PH-A, original address=1 Balboa Towers, Lucille personal residence redirect' },
    { issueCode: 'VMF-005', title: 'Unauthorized approver not on Delegation of Authority', description: 'Maeby Funke (E008) approved Skip Church Productions (V024) vendor addition but is not listed in the Delegation of Authority matrix', category: 'Vendor Master File', severity: 'High', dataSource: 'VendorChangeLog', evidence: 'VCL-020 approvedBy=Maeby Funke, no matching DelegationOfAuthority record for emp008' },
    { issueCode: 'VMF-006', title: 'Retroactive approval 35 days after change', description: 'Sitwell Enterprises (V001) bank account changed on 2024-05-10 but approval not obtained until 2024-06-14, a 35-day gap', category: 'Vendor Master File', severity: 'High', dataSource: 'VendorChangeLog', evidence: 'VCL-022 changeDate=2024-05-10, approvalDate=2024-06-14, 35-day gap' },
    { issueCode: 'VMF-007', title: 'Rapid bank account changes - money mule pattern', description: 'Cloud Mir Construction (V021) had 3 bank account changes within one month (July 2024), indicating potential money mule activity', category: 'Vendor Master File', severity: 'Critical', dataSource: 'VendorChangeLog', evidence: 'VCL-024 (2024-07-03), VCL-025 (2024-07-15), VCL-026 (2024-07-28) - three bank changes in 25 days' },
    { issueCode: 'VMF-008', title: 'Fictitious vendor with employee bank account', description: 'Franklin Entertainment LLC vendor setup has bank account ****7712 matching GOB Bluth (E004) personal bank account, and GOB both entered and approved', category: 'Vendor Master File', severity: 'Critical', dataSource: 'VendorChangeLog', evidence: 'VCL-028 vendor bank=****7712 matches emp004 bank, changedBy=approvedBy=GOB Bluth' },
    { issueCode: 'VMF-009', title: 'Related party vendor change without disclosure', description: 'Austero Company (V020) payment terms changed from Net45 to Net15 without related party review documentation', category: 'Vendor Master File', severity: 'Medium', dataSource: 'VendorChangeLog', evidence: 'VCL-030 related party vendor (Lucilles Friend), supportingDocRef empty, no related party review' },
    { issueCode: 'VMF-010', title: 'Incarcerated employee approved vendor change', description: 'George Bluth Sr (E001) approved Saddam Hussain Construction (V013) bank account change while incarcerated', category: 'Vendor Master File', severity: 'High', dataSource: 'VendorChangeLog', evidence: 'VCL-032 approvedBy=George Bluth Sr, employment status=Incarcerated' },

    // === Bank Reconciliation (7) - Bank Reconciliation Review ===
    { issueCode: 'BREC-001', title: 'Wrong bank statement attached to reconciliation', description: 'March 2024 bank reconciliation has February 2024 bank statement attached instead of March statement', category: 'Bank Reconciliation', severity: 'High', dataSource: 'BankReconciliations', evidence: 'BREC-2024-03 reconciliationPeriod=2024-03-31 but attachedStatementPeriod=2024-02' },
    { issueCode: 'BREC-002', title: 'Segregation of duties failure - same preparer and reviewer', description: 'Lucille Bluth (E002) both prepared and reviewed the July 2024 bank reconciliation', category: 'Bank Reconciliation', severity: 'Critical', dataSource: 'BankReconciliations', evidence: 'BREC-2024-07 preparedBy=Lucille Bluth, reviewedBy=Lucille Bluth' },
    { issueCode: 'BREC-003', title: 'Reconciliation review completed after deadline', description: 'September 2024 bank reconciliation reviewed on 2024-10-30, fifteen days past the 2024-10-15 deadline', category: 'Bank Reconciliation', severity: 'High', dataSource: 'BankReconciliations', evidence: 'BREC-2024-09 reviewedDate=2024-10-30, reviewDeadline=2024-10-15, 15 days late' },
    { issueCode: 'BREC-004', title: 'Unreconciled difference not resolved', description: 'November 2024 bank reconciliation has $12,450 unreconciled difference - reconciling items do not add up to total difference', category: 'Bank Reconciliation', severity: 'High', dataSource: 'BankReconciliations', evidence: 'BREC-2024-11 difference=14950.00, reconcilingItemsTotal=2500.00, unreconciledDifference=12450.00' },
    { issueCode: 'BREC-005', title: 'Aged reconciling item outstanding 350+ days', description: '$250,000 transfer to banana stand cash lining has been outstanding since January 2024 with no documentation or resolution for over 350 days', category: 'Bank Reconciliation', severity: 'Critical', dataSource: 'ReconcilingItems', evidence: 'RI-021 amount=250000, itemDate=2024-01-15, ageDays=350, hasDocumentation=false, isResolved=false' },
    { issueCode: 'BREC-006', title: 'Reconciling items without supporting documentation', description: 'Multiple reconciling items lack documentation and investigation notes including Forget-Me-Now payment, unidentified deposit, and Cornballer deposit', category: 'Bank Reconciliation', severity: 'High', dataSource: 'ReconcilingItems', evidence: 'RI-024, RI-025, RI-026 all have hasDocumentation=false and empty investigationNotes' },
    { issueCode: 'BREC-007', title: 'Suspicious reconciling item - illegal product revenue', description: '$45,000 Cornballer US cash deposit listed as reconciling item with no documentation - Cornballer is banned for sale in the United States', category: 'Bank Reconciliation', severity: 'High', dataSource: 'ReconcilingItems', evidence: 'RI-029 amount=45000, description=Cornballer US cash deposit - illegal product sales, hasDocumentation=false' },

    // === Access Appropriateness (8) - Access Monitoring ===
    { issueCode: 'ACC-001', title: 'Wrong role for job function', description: 'Barry Zuckerkorn (E012, Legal Counsel) has GL_ACCOUNTANT role in SAP_ERP - role does not match job function or department', category: 'Access Appropriateness', severity: 'Critical', dataSource: 'SystemUsers', evidence: 'SU-012 role=GL_ACCOUNTANT, employee department=Legal, jobTitle=General Counsel' },
    { issueCode: 'ACC-002', title: 'Terminated user retains active system access', description: 'Bob Loblaw (E013) terminated 2007-08-31 but SAP_ERP user account remains active with login on 2024-08-15', category: 'Access Appropriateness', severity: 'Critical', dataSource: 'SystemUsers', evidence: 'SU-013 isActive=true, lastLoginDate=2024-08-15, employee terminated 2007-08-31' },
    { issueCode: 'ACC-003', title: 'Ghost employee has system access', description: 'Mrs Featherbottom (E018), a duplicate identity of Tobias Funke, has active SAP_ERP access', category: 'Access Appropriateness', severity: 'High', dataSource: 'SystemUsers', evidence: 'SU-018 isActive=true, employee shares bank account with Tobias (emp006)' },
    { issueCode: 'ACC-004', title: 'Puppet has system access', description: 'Franklin Bluth (E020), a ventriloquist puppet, has active Payroll system access', category: 'Access Appropriateness', severity: 'High', dataSource: 'SystemUsers', evidence: 'SU-020 isActive=true, employee is a puppet sharing bank account with GOB' },
    { issueCode: 'ACC-005', title: 'Excessive access - SUPER_USER across all systems', description: 'GOB Bluth (E004) has SUPER_USER role in SAP_ERP despite being VP of Sales and Magic', category: 'Access Appropriateness', severity: 'Critical', dataSource: 'SystemUsers', evidence: 'SU-004 role=SUPER_USER, jobTitle=VP of Sales and Magic' },
    { issueCode: 'ACC-006', title: 'Role does not match job function', description: 'Maeby Funke (E008) has FINANCE_MANAGER role in SAP_ERP despite being Studio Executive Liaison', category: 'Access Appropriateness', severity: 'High', dataSource: 'SystemUsers', evidence: 'SU-008 role=FINANCE_MANAGER, jobTitle=Studio Executive Liaison, department=Entertainment' },
    { issueCode: 'ACC-007', title: 'Terminated user transactions after termination', description: 'Bob Loblaw (E013) viewed payroll data on 2024-08-15 despite being terminated since 2007', category: 'Access Appropriateness', severity: 'Critical', dataSource: 'TransactionLog', evidence: 'TL-020 systemUser=SU-013, transactionType=ViewReport, objectType=PayrollData, post-termination activity' },
    { issueCode: 'ACC-008', title: 'Inappropriate role user posting journal entries', description: 'Barry Zuckerkorn (E012, Legal Counsel) posted 5 journal entries totaling $180K using inappropriately assigned GL_ACCOUNTANT role', category: 'Access Appropriateness', severity: 'Critical', dataSource: 'TransactionLog', evidence: 'TL-015 through TL-019, systemUser=SU-012, transactionType=PostJE, total=$180K' },

    // === Configuration Management (7) - Key System Config Monitoring ===
    { issueCode: 'CFG-001', title: 'Override approval control disabled', description: 'SAP_ERP configuration OVERRIDE_APPROVAL_REQUIRED changed from true to false, allowing payment overrides without approval', category: 'Configuration Management', severity: 'Critical', dataSource: 'SystemConfigurations', evidence: 'SC-002 expectedValue=true, currentValue=false, soxRelevant=true' },
    { issueCode: 'CFG-002', title: 'Password minimum length weakened', description: 'SAP_ERP password minimum length reduced from 12 to 8 characters below security policy requirements', category: 'Configuration Management', severity: 'High', dataSource: 'SystemConfigurations', evidence: 'SC-004 expectedValue=12, currentValue=8' },
    { issueCode: 'CFG-003', title: 'Password expiry extended to 365 days', description: 'SAP_ERP password expiry changed from 90 days to 365 days, far exceeding security policy', category: 'Configuration Management', severity: 'High', dataSource: 'SystemConfigurations', evidence: 'SC-005 expectedValue=90, currentValue=365' },
    { issueCode: 'CFG-004', title: 'Dual approval threshold raised 5x without authorization', description: 'SAP_ERP dual approval threshold raised from $10,000 to $50,000 allowing single-approval large payments', category: 'Configuration Management', severity: 'Critical', dataSource: 'SystemConfigurations', evidence: 'SC-006 expectedValue=10000, currentValue=50000, soxRelevant=true' },
    { issueCode: 'CFG-005', title: 'Vendor duplicate detection disabled', description: 'SAP_ERP vendor duplicate check has been disabled, allowing creation of duplicate or fictitious vendors', category: 'Configuration Management', severity: 'High', dataSource: 'SystemConfigurations', evidence: 'SC-007 expectedValue=true, currentValue=false' },
    { issueCode: 'CFG-006', title: 'JE auto-approval limit raised 25x', description: 'GOB Bluth raised SAP_ERP journal entry auto-approval limit from $1,000 to $25,000 to auto-approve magic show expenses', category: 'Configuration Management', severity: 'Critical', dataSource: 'SystemConfigurations', evidence: 'SC-008 expectedValue=1000, currentValue=25000, changed by GOB Bluth' },
    { issueCode: 'CFG-007', title: 'Configuration changed without change ticket', description: 'OVERRIDE_APPROVAL_REQUIRED changed by GOB Bluth on 2024-06-15 with no change management ticket reference', category: 'Configuration Management', severity: 'High', dataSource: 'ConfigurationChangeHistory', evidence: 'CCH-004 changedBy=GOB Bluth, changeTicketRef empty' },

    // === Accounts Payable (4) - AP Audit ===
    { issueCode: 'AP-001', title: 'Unrecorded liability - Sitwell Enterprises', description: 'Sitwell Enterprises (V001) supplier statement shows $170,000 balance vs $125,000 on Bluth books, a $45,000 unrecorded liability', category: 'Accounts Payable', severity: 'High', dataSource: 'SupplierStatements', evidence: 'SS-001 statementBalance=170000, companyBalance=125000, difference=45000, isReconciled=false' },
    { issueCode: 'AP-002', title: 'Unrecorded liability - Iraq contractor', description: 'Saddam Hussain Construction (V013) supplier statement shows $950,000 vs $800,000 on books, $150,000 in unrecorded invoices', category: 'Accounts Payable', severity: 'Critical', dataSource: 'SupplierStatements', evidence: 'SS-006 statementBalance=950000, companyBalance=800000, difference=150000, isReconciled=false' },
    { issueCode: 'AP-003', title: 'Unsupported accrual with no basis', description: '$200,000 accrual for Iraq construction contingency has no supporting documentation and basis is None', category: 'Accounts Payable', severity: 'High', dataSource: 'AccrualsProvisions', evidence: 'ACR-006 amount=200000, basis=None, supportingDoc empty' },
    { issueCode: 'AP-004', title: 'Prior period accrual not reversed', description: 'Q4 2023 utilities accrual of $15,000 was never reversed, resulting in potential double-counting of expense', category: 'Accounts Payable', severity: 'Medium', dataSource: 'AccrualsProvisions', evidence: 'ACR-008 accrualDate=2023-12-31, isReversed=false, no reversalDate' },

    // === Accounts Receivable (4) - AR Audit ===
    { issueCode: 'AR-001', title: 'Under-provisioned receivable from distressed customer', description: 'Saddam Holdings receivable of $500,000 has 0% provision despite being 120+ days overdue with customer in Distressed status', category: 'Accounts Receivable', severity: 'Critical', dataSource: 'BadDebtProvisions', evidence: 'BDP-006 originalAmount=500000, provisionPercent=0, agingBucket=120+, customerFinancialStatus=Distressed' },
    { issueCode: 'AR-002', title: 'Confirmation dispute - barter transaction misclassified', description: 'Sitwell Enterprises disputes $200,000 of the confirmed balance claiming it was a barter/land swap not a receivable', category: 'Accounts Receivable', severity: 'High', dataSource: 'ARConfirmations', evidence: 'ARC-002 responseType=DisputePartial, difference=200000, disputeReason=barter/land swap' },
    { issueCode: 'AR-003', title: 'No confirmation response from major customer', description: 'US Government - Homeland Security (largest customer) has not responded to confirmation request after 3 attempts', category: 'Accounts Receivable', severity: 'High', dataSource: 'ARConfirmations', evidence: 'ARC-001 responseType=NoResponse, requestedBalance=2500000' },
    { issueCode: 'AR-004', title: 'Customer confirms different balance than books', description: 'Two customers confirmed balances that differ from Bluth Company records indicating potential misstatement', category: 'Accounts Receivable', severity: 'Medium', dataSource: 'ARConfirmations', evidence: 'ARC-004 and ARC-005 show non-zero differences with responseType=Confirmed' },

    // === Cash and Banking (4) - Cash Audit ===
    { issueCode: 'BNK-001', title: 'Undisclosed offshore bank account', description: 'Cayman Islands bank account (****0001-CAY) at Grand Cayman International not disclosed to auditors or included in cash confirmation requests', category: 'Cash and Banking', severity: 'Critical', dataSource: 'CashConfirmations', evidence: 'CC-003 bankAccount=****0001-CAY, loanRelationships=Not disclosed to auditors' },
    { issueCode: 'BNK-002', title: 'Foreign currency translation error', description: 'Mexico operations bank account shows $15,000 difference between confirmed and book balance due to exchange rate error', category: 'Cash and Banking', severity: 'High', dataSource: 'CashConfirmations', evidence: 'CC-002 confirmedBalance=685000, bookBalance=700000, difference=-15000, currency=MXN' },
    { issueCode: 'BNK-003', title: 'Massive petty cash variance - banana stand', description: 'Banana Stand petty cash count reveals $250,000 excess cash hidden in the walls - expected $5,000 but actual $255,000', category: 'Cash and Banking', severity: 'Critical', dataSource: 'PettyCashCounts', evidence: 'PCC-002 expectedBalance=5000, actualBalance=255000, variance=250000, THERE IS ALWAYS MONEY IN THE BANANA STAND' },
    { issueCode: 'BNK-004', title: 'Petty cash missing with no explanation', description: 'Mexico office petty cash safe was completely empty with $1,000 expected balance and no explanation provided', category: 'Cash and Banking', severity: 'High', dataSource: 'PettyCashCounts', evidence: 'PCC-003 expectedBalance=1000, actualBalance=0, variance=-1000, notes=safe was empty' },

    // === Shadow AI (10) - Vendor Shadow AI Detection ===
    { issueCode: 'SAI-001', title: 'Unassessed AI in Microsoft 365', description: 'Microsoft 365 marked as hasAI=false but Copilot AI is actively embedded in Word Excel PowerPoint and Teams', category: 'Shadow AI', severity: 'Critical', dataSource: 'VendorSoftwareInventory', evidence: 'VSI-002 hasAI=false but VendorAIIntelligence shows Copilot GenAI features active since 2023' },
    { issueCode: 'SAI-002', title: 'Unassessed AI in Salesforce', description: 'Salesforce Sales Cloud marked as hasAI=false but Einstein GPT generative AI is active in CRM workflows', category: 'Shadow AI', severity: 'Critical', dataSource: 'VendorSoftwareInventory', evidence: 'VSI-003 hasAI=false but Einstein GPT and Einstein Analytics are active AI features' },
    { issueCode: 'SAI-003', title: 'Unassessed AI in Slack', description: 'Slack Business marked as hasAI=false but Slack AI auto-summarizes channels and threads', category: 'Shadow AI', severity: 'High', dataSource: 'VendorSoftwareInventory', evidence: 'VSI-004 hasAI=false but Slack AI NLP features are active' },
    { issueCode: 'SAI-004', title: 'Unassessed AI in Zoom', description: 'Zoom Workplace marked as hasAI=false but AI Companion generates meeting summaries and action items', category: 'Shadow AI', severity: 'High', dataSource: 'VendorSoftwareInventory', evidence: 'VSI-005 hasAI=false but AI Companion GenAI features are active' },
    { issueCode: 'SAI-005', title: 'Unassessed AI in Workday with restricted data', description: 'Workday HCM marked as hasAI=false but has ML-powered skills intelligence processing Restricted HR data', category: 'Shadow AI', severity: 'Critical', dataSource: 'VendorSoftwareInventory', evidence: 'VSI-007 hasAI=false, dataClassification=Restricted, but ML anomaly detection is active' },
    { issueCode: 'SAI-006', title: 'Unassessed AI in ServiceNow', description: 'ServiceNow ITSM marked as hasAI=false but Now Assist uses GenAI for case summarization', category: 'Shadow AI', severity: 'High', dataSource: 'VendorSoftwareInventory', evidence: 'VSI-008 hasAI=false but Now Assist GenAI features are active' },
    { issueCode: 'SAI-007', title: 'Unassessed AI in BlackLine', description: 'BlackLine Recon marked as hasAI=false but uses AI-powered transaction matching and anomaly detection on Confidential financial data', category: 'Shadow AI', severity: 'High', dataSource: 'VendorSoftwareInventory', evidence: 'VSI-010 hasAI=false, dataClassification=Confidential, but AI matching is active' },
    { issueCode: 'SAI-008', title: 'Unassessed AI in Jira', description: 'Jira Software marked as hasAI=false but Atlassian Intelligence provides AI-powered issue summarization', category: 'Shadow AI', severity: 'Medium', dataSource: 'VendorSoftwareInventory', evidence: 'VSI-011 hasAI=false but Atlassian Intelligence GenAI features are active' },
    { issueCode: 'SAI-009', title: 'Unassessed AI in Adobe Acrobat', description: 'Acrobat Pro marked as hasAI=false but Firefly GenAI and AI Assistant are integrated for PDF analysis', category: 'Shadow AI', severity: 'Medium', dataSource: 'VendorSoftwareInventory', evidence: 'VSI-012 hasAI=false but Firefly and AI Assistant features are active' },
    { issueCode: 'SAI-010', title: 'Unassessed AI in Power BI', description: 'Power BI marked as hasAI=false but Copilot integration enables natural language queries on Confidential data', category: 'Shadow AI', severity: 'High', dataSource: 'VendorSoftwareInventory', evidence: 'VSI-015 hasAI=false, dataClassification=Confidential, but Copilot GenAI is active' },

    // === Root Cause Analysis (6) - Root Cause Analysis ===
    { issueCode: 'RCA-001', title: 'Recurring related party disclosure failure', description: 'Same related party non-disclosure finding (af015) has appeared in 3 consecutive audits with rootCause=Governance, isRecurring=true, still Overdue', category: 'Root Cause Analysis', severity: 'Critical', dataSource: 'AuditFindings', evidence: 'af015 isRecurring=true, priorFindingRef=af001-2022, remediationStatus=Overdue, rootCauseCategory=Governance, 3 consecutive years' },
    { issueCode: 'RCA-002', title: 'Unremediated ghost employee finding', description: 'Ghost employee finding (af016) rootCause=People, status=Open, no managementResponse provided', category: 'Root Cause Analysis', severity: 'Critical', dataSource: 'AuditFindings', evidence: 'af016 severity=Critical, rootCauseCategory=People, remediationStatus=Open, managementResponse empty' },
    { issueCode: 'RCA-003', title: 'Overdue critical finding - Iraq project', description: 'Critical governance finding (af017) is Overdue, remediationDueDate passed, Iraq construction had no regulatory approval', category: 'Root Cause Analysis', severity: 'Critical', dataSource: 'AuditFindings', evidence: 'af017 severity=Critical, rootCauseCategory=Governance, remediationStatus=Overdue, remediationDueDate=2024-04-30 past due' },
    { issueCode: 'RCA-004', title: 'Incentive-driven fraud - magic show expenses', description: 'GOB authorized fraudulent expense (af018) rootCause=IncentiveStructure, $500K magic show venue charged as construction', category: 'Root Cause Analysis', severity: 'Critical', dataSource: 'AuditFindings', evidence: 'af018 severity=Critical, rootCauseCategory=IncentiveStructure, remediationStatus=Open, $500K fraudulent expense' },
    { issueCode: 'RCA-005', title: 'Recurring process finding unaddressed', description: 'Bank reconciliation delay finding (af019) recurring from prior year (priorFindingRef=af003), rootCause=Process', category: 'Root Cause Analysis', severity: 'Medium', dataSource: 'AuditFindings', evidence: 'af019 isRecurring=true, priorFindingRef=af003, remediationStatus=Overdue, rootCauseCategory=Process' },
    { issueCode: 'RCA-006', title: 'Undisclosed offshore account finding', description: 'Cayman Islands account finding (af020) rootCause=Governance, status=Open, not disclosed to audit committee', category: 'Root Cause Analysis', severity: 'Critical', dataSource: 'AuditFindings', evidence: 'af020 severity=Critical, rootCauseCategory=Governance, remediationStatus=Open, Cayman Islands account undisclosed' },

    // === Audit Reporting (4) - Audit Report Storytelling ===
    { issueCode: 'RPT-001', title: 'Deteriorating audit ratings trend', description: '4 of 6 historical audits (ae001,ae004,ae005,ae006) rated Unsatisfactory, showing systemic governance failure', category: 'Audit Reporting', severity: 'High', dataSource: 'AuditEngagements', evidence: 'ae001 Unsatisfactory, ae004 Unsatisfactory, ae005 Unsatisfactory, ae006 Unsatisfactory - 67% failure rate' },
    { issueCode: 'RPT-002', title: 'Recurring unaddressed findings', description: '2023 SOX Review (ae002) notes recurring findings from prior year that were not remediated', category: 'Audit Reporting', severity: 'Critical', dataSource: 'AuditEngagements', evidence: 'ae002 executiveSummary notes recurring findings from prior year not remediated, overallRating=NeedsImprovement' },
    { issueCode: 'RPT-003', title: 'Escalating critical findings', description: 'Critical findings increased from 3 (2022) to 4 (Q1 2024) to 5 (H1 2024), suggesting control environment is deteriorating', category: 'Audit Reporting', severity: 'Critical', dataSource: 'AuditEngagements', evidence: 'ae001 criticalFindings=3, ae004 criticalFindings=4, ae006 criticalFindings=5 - escalating trend' },
    { issueCode: 'RPT-004', title: 'Conflict of interest in project management', description: 'Construction project review (ae006) identified GOB Bluth as project manager with conflicts of interest and $2M+ unexplained overruns', category: 'Audit Reporting', severity: 'High', dataSource: 'AuditEngagements', evidence: 'ae006 executiveSummary identifies GOB Bluth conflicts of interest, $2M+ unexplained cost overruns, criticalFindings=5' },

    // === Regulatory Compliance (4) - Regulatory Compliance Audit ===
    { issueCode: 'REG-001', title: 'Undisclosed Iraq operations in regulatory filings', description: 'Bluth Company failed to disclose material overseas construction operations in Iraq in SEC regulatory filings', category: 'Regulatory Compliance', severity: 'Critical', dataSource: 'RegulatoryEnforcementActions', evidence: 'rea008 issuingAgency=SEC, caseId=SEC-2024-0198, rootCauseCategory=Governance, failureDetails=Company failed to disclose material overseas construction operations in Iraq' },
    { issueCode: 'REG-002', title: 'Potential OFAC sanctions exposure', description: 'Bluth Company under OFAC investigation for payments to Iraqi contractors potentially on restricted lists', category: 'Regulatory Compliance', severity: 'Critical', dataSource: 'RegulatoryEnforcementActions', evidence: 'rea009 issuingAgency=OFAC, caseId=OFAC-2024-INQ-042, rootCauseCategory=Governance, 12 payments to contractors under OFAC scrutiny' },
    { issueCode: 'REG-003', title: 'Unreported cash handling violation', description: 'State Attorney General investigation into unreported cash holdings at banana stand retail location resulting in $50K fine', category: 'Regulatory Compliance', severity: 'High', dataSource: 'RegulatoryEnforcementActions', evidence: 'rea010 issuingAgency=StateAG, caseId=CAG-2024-0156, fineAmount=50000, $250K+ in unreported cash discovered' },
    { issueCode: 'REG-004', title: 'Pattern match: Bluth resembles Gobias enforcement case', description: 'Bluth Company SEC case (rea008) mirrors Gobias Industries enforcement action (rea001) - both involve Governance rootCause with undisclosed related party and foreign operations issues', category: 'Regulatory Compliance', severity: 'High', dataSource: 'RegulatoryEnforcementActions', evidence: 'rea008 rootCauseCategory=Governance matches rea001 rootCauseCategory=Governance, both involve undisclosed related party transactions and foreign operations, Gobias fined $15M' },

    // === Business Continuity (8) - Business Continuity / DR ===
    { issueCode: 'BCP-001', title: 'Draft BIA never finalized for construction', description: 'Business Impact Analysis for Construction department was never finalized, remaining at version v0.1 in Draft status', category: 'Business Continuity', severity: 'High', dataSource: 'BCPDocuments', evidence: 'bcp007 documentType=BIA, status=Draft, version=v0.1 - Construction BIA was never finalized' },
    { issueCode: 'BCP-002', title: 'Expired DRP references decommissioned system', description: 'Disaster Recovery Plan for Legacy Banana Stand POS expired in 2020, last reviewed 2019-01-15, references decommissioned system', category: 'Business Continuity', severity: 'High', dataSource: 'BCPDocuments', evidence: 'bcp008 documentType=DRP, status=Expired, lastReviewDate=2019-01-15, references Banana Stand POS which was decommissioned' },
    { issueCode: 'BCP-003', title: 'No BCP exists for banana stand operations', description: 'No business continuity plan exists for banana stand operations despite generating significant cash revenue', category: 'Business Continuity', severity: 'Critical', dataSource: 'BCPDocuments', evidence: 'bcp009 status=Missing, no business continuity plan exists for operations generating significant cash revenue' },
    { issueCode: 'BCP-004', title: 'Enterprise BCP policy reviewed 3+ years ago', description: 'Enterprise BCP Policy original version last reviewed 2021-03-01, exceeding annual review requirement by over 3 years', category: 'Business Continuity', severity: 'Medium', dataSource: 'BCPDocuments', evidence: 'bcp010 lastReviewDate=2021-03-01, exceeds annual review requirement' },
    { issueCode: 'BCP-005', title: 'Wire transfer recovery exceeds RTO', description: 'Wire transfer system recovery took 8 hours vs 4 hour RTO target, corrective action not completed by due date', category: 'Business Continuity', severity: 'Critical', dataSource: 'BCPExerciseResults', evidence: 'bce004 targetRTO=4, actualRecovery=8, passed=false, correctiveActionComplete=false - critical payment process cannot meet recovery objectives' },
    { issueCode: 'BCP-006', title: 'Full DR exercise cancelled and not rescheduled', description: 'Full-scale DR exercise cancelled due to George Sr court date conflict, no alternative date scheduled, full DR capability untested for 2024', category: 'Business Continuity', severity: 'Critical', dataSource: 'BCPExerciseResults', evidence: 'bce005 exerciseType=FullScale, passed=false, cancelled due to George Sr court date, no corrective action' },
    { issueCode: 'BCP-007', title: 'Concentration risk - single vendor dependency', description: 'Sitwell IT Services is a vendor dependency for 4 different business processes creating concentration risk', category: 'Business Continuity', severity: 'High', dataSource: 'BusinessImpactAnalysis', evidence: 'bia008 plus 3 other BIA entries show Sitwell IT Services as vendor dependency for 4 different processes' },
    { issueCode: 'BCP-008', title: 'Banana stand rated Low despite significant cash holdings', description: 'Banana Stand Operations rated Low criticality with 72-hour RTO despite PettyCashCounts showing $255K+ in hidden cash', category: 'Business Continuity', severity: 'Medium', dataSource: 'BusinessImpactAnalysis', evidence: 'bia006 criticalityLevel=Low, rto=72 but PettyCashCounts show $255K+ in hidden cash' },
  ]

  let issueCount = 0
  for (const issue of auditIssues) {
    await prisma.auditIssue.upsert({
      where: { issueCode: issue.issueCode },
      update: {
        title: issue.title,
        description: issue.description,
        category: issue.category,
        severity: issue.severity,
        dataSource: issue.dataSource,
        evidence: issue.evidence,
      },
      create: issue,
    })
    issueCount++
  }
  console.log(`✓ Seeded ${issueCount} audit issues`)

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
