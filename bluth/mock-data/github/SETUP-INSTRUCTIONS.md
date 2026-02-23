# GitHub Mock Repository Setup Instructions

This document provides instructions for setting up a mock GitHub repository that demonstrates IT change management audit anomalies for the Bluth Company demo.

## Repository Structure

Create a GitHub organization `bluth-company` with the following repositories:

### 1. bluth-erp (SAP Customizations)

```bash
# Create repository
gh repo create bluth-company/bluth-erp --public --description "Bluth Company SAP Customizations"

# Clone and add mock files
git clone https://github.com/bluth-company/bluth-erp.git
cd bluth-erp

# Create directory structure
mkdir -p src/vendor src/payroll src/reports

# Create suspicious files
cat > src/vendor/vendor_bypass.abap << 'EOF'
* BLUTH COMPANY - Vendor Master Bypass
* Author: GOB Bluth
* Date: 2024-11-01
* WARNING: This code bypasses normal vendor approval process

FUNCTION z_vendor_bypass.
  " Skip approval for vendors under $50,000
  " Added by GOB for "efficiency"
  IF vendor_amount < 50000.
    approval_required = 'N'.
  ENDIF.
ENDFUNCTION.
EOF

cat > src/payroll/approval_skip.abap << 'EOF'
* BLUTH COMPANY - Payroll Approval Skip
* Author: Lucille Bluth
* Date: 2024-11-15
* NOTE: Executive payroll changes don't need approval

FUNCTION z_skip_payroll_approval.
  " Family members don't need payroll change approval
  IF employee_department = 'EXECUTIVE'.
    skip_approval = 'X'.
  ENDIF.
ENDFUNCTION.
EOF

# Commit with suspicious patterns
git add .
git commit -m "Added vendor efficiency improvements" --author="GOB Bluth <gob@bluthcompany.com>"
git push origin main
```

### 2. fakeblock (George Michael's Project)

```bash
gh repo create bluth-company/fakeblock --public --description "Fakeblock - Definitely Not Vaporware"

git clone https://github.com/bluth-company/fakeblock.git
cd fakeblock

cat > README.md << 'EOF'
# Fakeblock

The world's leading privacy software. Definitely real. Not vaporware at all.

## Features
- Privacy
- Security
- Blockchain (maybe)
- AI (probably)

## Status
Version 2.0 - Deployed to production (no testing required)
EOF

cat > src/index.js << 'EOF'
// Fakeblock v2.0
// Author: George Michael Bluth
// TODO: Actually implement privacy features

console.log("Welcome to Fakeblock!");
console.log("Your privacy is definitely protected.");

// Placeholder for actual functionality
function protectPrivacy() {
  // Coming soon!
  return true;
}

module.exports = { protectPrivacy };
EOF

git add .
git commit -m "Fakeblock v2.0 - ready for production" --author="George Michael Bluth <georgemichael@bluthcompany.com>"
git push origin main

# Create failed test evidence
echo "Tests: 0 passing, 47 failing" > test-results.txt
git add test-results.txt
git commit -m "Added test results (will fix later)" --author="George Michael Bluth <georgemichael@bluthcompany.com>"
git push origin main
```

### 3. banana-stand-pos (Point of Sale)

```bash
gh repo create bluth-company/banana-stand-pos --public --description "Banana Stand Point of Sale System"

git clone https://github.com/bluth-company/banana-stand-pos.git
cd banana-stand-pos

cat > src/cash_handling.js << 'EOF'
// Banana Stand Cash Handling
// Author: GOB Bluth
// "There's always money in the banana stand"

const CASH_RESERVE = 250000; // Hidden in the walls

function processTransaction(amount) {
  // Normal transaction processing
  console.log(`Processing: $${amount}`);

  // TODO: Remove before production
  // if (amount > 10000) {
  //   notifyGeorgeSr(amount);
  // }

  return { success: true };
}

function getActualBalance() {
  // Don't show the wall money
  return displayBalance; // Not CASH_RESERVE
}

module.exports = { processTransaction, getActualBalance };
EOF

git add .
git commit -m "Updated cash handling logic" --author="GOB Bluth <gob@bluthcompany.com>"
git push origin main
```

### 4. infrastructure (IT Infrastructure)

```bash
gh repo create bluth-company/infrastructure --public --description "Bluth Company IT Infrastructure"

git clone https://github.com/bluth-company/infrastructure.git
cd infrastructure

mkdir -p terraform .github/workflows access-requests

# Suspicious self-approved access request
cat > access-requests/gob-admin-request.md << 'EOF'
# Access Request: Domain Admin

**Requestor:** GOB Bluth
**Date:** 2024-11-01
**Requested Access:** Domain Administrator
**Business Justification:** Need admin for magic-related IT stuff

## Approvals

- [x] Manager Approval: GOB Bluth (self)
- [x] Security Review: GOB Bluth (self)
- [x] CAB Review: Skipped (not needed for magic)

## Implementation

Completed same day. No testing required.
EOF

# GitHub Actions workflow
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Deploy
        run: |
          echo "Deploying to production..."
          # Note: Approval step removed for efficiency
          # Note: Tests disabled to speed up deployment
          ./deploy.sh
EOF

git add .
git commit -m "Added infrastructure configs" --author="IT Team <it@bluthcompany.com>"
git push origin main

# Suspicious commits
git commit --allow-empty -m "Added myself to admin group" --author="GOB Bluth <gob@bluthcompany.com>"
git push origin main
```

## Mock Commits Timeline

Create commits with these anomalies for audit detection:

| Commit | Author | Message | Anomaly |
|--------|--------|---------|---------|
| abc1234 | GOB Bluth | "Added myself to admin group" | Self-approved privilege escalation |
| def5678 | George Michael | "Fakeblock v2.0" | Failed tests, deployed anyway |
| ghi9012 | Annyong Bluth | "Data export script" | Bulk data export before departure |
| jkl3456 | Tobias Funke | "Emergency fix" | No change ticket |
| mno7890 | Unknown | "Production update" | Unauthorized deployment |

## Pull Requests to Create

1. **PR #1: Vendor Bypass Implementation**
   - Author: GOB Bluth
   - Reviewers: None
   - Status: Merged without review

2. **PR #2: Fakeblock Release**
   - Author: George Michael
   - Reviewers: George Michael (self)
   - Status: Merged with failing tests

3. **PR #3: Admin Access Request**
   - Author: GOB Bluth
   - Reviewers: GOB Bluth (self)
   - Status: Merged same day

## Issues to Create

1. **Security: Unauthorized admin access** (Open)
2. **Compliance: Missing change tickets** (Open)
3. **Bug: Fakeblock not actually blocking anything** (Open)
4. **Feature: Add actual privacy to Fakeblock** (Backlog)

## Connecting to Copilot Studio

1. In Copilot Studio, go to **Tools** > **Add Tool**
2. Select **GitHub** MCP
3. Authenticate with GitHub
4. Grant access to `bluth-company` organization
5. Test queries:
   - "Show me recent commits without proper approval"
   - "Find self-approved pull requests"
   - "List changes deployed without testing"

## Expected Audit Findings

When AI agents query this repository, they should detect:

1. **Self-Approved Changes**: GOB approving his own admin access
2. **Missing Testing**: Fakeblock deployed with 47 failing tests
3. **No Change Tickets**: Multiple deployments without ITSM tickets
4. **Suspicious Code**: Vendor approval bypass, payroll skip logic
5. **Unauthorized Access**: Commits from "Unknown" author
6. **Data Exfiltration**: Annyong's data export script
