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
