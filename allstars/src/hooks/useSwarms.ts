'use client'

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'PrePlanning', slug: 'preplanning', swarmCount: 3 },
  { id: 'cat-2', name: 'Planning', slug: 'planning', swarmCount: 2 },
  { id: 'cat-3', name: 'Fieldwork', slug: 'fieldwork', swarmCount: 3 },
  { id: 'cat-4', name: 'Reporting', slug: 'reporting', swarmCount: 2 },
  { id: 'cat-5', name: 'Other', slug: 'other', swarmCount: 1 },
]

const MOCK_SWARMS = [
  {
    id: 's1',
    name: 'SOX Compliance Testing',
    slug: 'sox-compliance-testing',
    description: 'Comprehensive workflow for SOX compliance testing including control identification, walkthroughs, and testing procedures.',
    is_featured: true,
    rating_avg: 4.7,
    rating_count: 12,
    favorites_count: 23,
    workflowNodes: JSON.stringify([
      { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Identify Controls', description: 'Map key controls' } },
      { id: 'n2', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Perform Walkthroughs', description: 'Walk through each control' } },
      { id: 'n3', type: 'step', position: { x: 800, y: 0 }, data: { label: 'Test Effectiveness', description: 'Test operating effectiveness' } },
    ]),
    category: { id: 'cat-3', name: 'Fieldwork' },
    user: { id: 'u1', name: 'Sarah Chen', email: 'sarah@example.com' },
  },
  {
    id: 's2',
    name: 'Risk Assessment Framework',
    slug: 'risk-assessment-framework',
    description: 'Enterprise risk assessment workflow covering risk identification, scoring, and mitigation planning.',
    is_featured: true,
    rating_avg: 4.5,
    rating_count: 8,
    favorites_count: 18,
    workflowNodes: JSON.stringify([
      { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Risk Universe', description: 'Define risk universe' } },
      { id: 'n2', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Score Risks', description: 'Likelihood and impact' } },
    ]),
    category: { id: 'cat-1', name: 'PrePlanning' },
    user: { id: 'u2', name: 'Marcus Johnson', email: 'marcus@example.com' },
  },
  {
    id: 's3',
    name: 'IT General Controls Review',
    slug: 'it-general-controls-review',
    description: 'ITGC audit workflow for access management, change management, and IT operations.',
    is_featured: false,
    rating_avg: 4.3,
    rating_count: 6,
    favorites_count: 15,
    workflowNodes: JSON.stringify([
      { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Access Controls', description: 'Review access provisioning' } },
      { id: 'n2', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Change Management', description: 'Review change procedures' } },
      { id: 'n3', type: 'step', position: { x: 800, y: 0 }, data: { label: 'Operations', description: 'Review IT operations' } },
      { id: 'n4', type: 'step', position: { x: 1200, y: 0 }, data: { label: 'Report Findings', description: 'Document and report' } },
    ]),
    category: { id: 'cat-3', name: 'Fieldwork' },
    user: { id: 'u3', name: 'Priya Patel', email: 'priya@example.com' },
  },
  {
    id: 's4',
    name: 'Audit Planning Checklist',
    slug: 'audit-planning-checklist',
    description: 'Standardized audit planning checklist covering scope, objectives, resource allocation, and timeline.',
    is_featured: false,
    rating_avg: 4.1,
    rating_count: 10,
    favorites_count: 21,
    workflowNodes: JSON.stringify([
      { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Define Scope', description: 'Scope the engagement' } },
      { id: 'n2', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Set Objectives', description: 'Define audit objectives' } },
    ]),
    category: { id: 'cat-2', name: 'Planning' },
    user: { id: 'u4', name: 'James Williams', email: 'james@example.com' },
  },
  {
    id: 's5',
    name: 'Vendor Risk Assessment',
    slug: 'vendor-risk-assessment',
    description: 'Third-party vendor risk assessment workflow including due diligence, contract review, and ongoing monitoring.',
    is_featured: false,
    rating_avg: 4.6,
    rating_count: 5,
    favorites_count: 12,
    workflowNodes: JSON.stringify([
      { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Due Diligence', description: 'Initial vendor assessment' } },
      { id: 'n2', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Contract Review', description: 'Review contract terms' } },
      { id: 'n3', type: 'step', position: { x: 800, y: 0 }, data: { label: 'Ongoing Monitoring', description: 'Set up monitoring' } },
    ]),
    category: { id: 'cat-1', name: 'PrePlanning' },
    user: { id: 'u1', name: 'Sarah Chen', email: 'sarah@example.com' },
  },
  {
    id: 's6',
    name: 'Fraud Investigation Protocol',
    slug: 'fraud-investigation-protocol',
    description: 'Step-by-step workflow for investigating suspected fraud, from initial tip to final report.',
    is_featured: true,
    rating_avg: 4.8,
    rating_count: 14,
    favorites_count: 31,
    workflowNodes: JSON.stringify([
      { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Receive Tip', description: 'Document the allegation' } },
      { id: 'n2', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Preserve Evidence', description: 'Secure relevant data' } },
      { id: 'n3', type: 'step', position: { x: 800, y: 0 }, data: { label: 'Investigate', description: 'Conduct investigation' } },
    ]),
    category: { id: 'cat-3', name: 'Fieldwork' },
    user: { id: 'u5', name: 'Elena Rodriguez', email: 'elena@example.com' },
  },
  {
    id: 's7',
    name: 'Audit Report Template',
    slug: 'audit-report-template',
    description: 'Standard audit report writing workflow including executive summary, findings, and recommendations.',
    is_featured: false,
    rating_avg: 4.0,
    rating_count: 7,
    favorites_count: 9,
    workflowNodes: JSON.stringify([
      { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Executive Summary', description: 'Draft executive summary' } },
      { id: 'n2', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Detail Findings', description: 'Write up findings' } },
    ]),
    category: { id: 'cat-4', name: 'Reporting' },
    user: { id: 'u2', name: 'Marcus Johnson', email: 'marcus@example.com' },
  },
  {
    id: 's8',
    name: 'Annual Audit Plan',
    slug: 'annual-audit-plan',
    description: 'Workflow for developing the annual audit plan based on risk assessment and stakeholder input.',
    is_featured: false,
    rating_avg: 4.4,
    rating_count: 9,
    favorites_count: 16,
    workflowNodes: JSON.stringify([
      { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Stakeholder Input', description: 'Gather requirements' } },
      { id: 'n2', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Risk Priorities', description: 'Prioritize by risk' } },
      { id: 'n3', type: 'step', position: { x: 800, y: 0 }, data: { label: 'Resource Plan', description: 'Allocate resources' } },
    ]),
    category: { id: 'cat-2', name: 'Planning' },
    user: { id: 'u3', name: 'Priya Patel', email: 'priya@example.com' },
  },
  {
    id: 's9',
    name: 'Data Analytics Audit',
    slug: 'data-analytics-audit',
    description: 'Modern data-driven audit workflow using analytics to identify anomalies and focus testing.',
    is_featured: false,
    rating_avg: 4.2,
    rating_count: 4,
    favorites_count: 11,
    workflowNodes: JSON.stringify([
      { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Extract Data', description: 'Pull relevant datasets' } },
      { id: 'n2', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Run Analytics', description: 'Analyze for anomalies' } },
    ]),
    category: { id: 'cat-1', name: 'PrePlanning' },
    user: { id: 'u4', name: 'James Williams', email: 'james@example.com' },
  },
  {
    id: 's10',
    name: 'Issue Tracking & Follow-Up',
    slug: 'issue-tracking-follow-up',
    description: 'Post-audit issue management workflow for tracking remediation progress and follow-up testing.',
    is_featured: false,
    rating_avg: 3.9,
    rating_count: 6,
    favorites_count: 8,
    workflowNodes: JSON.stringify([
      { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Log Issues', description: 'Record audit findings' } },
      { id: 'n2', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Track Remediation', description: 'Monitor management responses' } },
    ]),
    category: { id: 'cat-4', name: 'Reporting' },
    user: { id: 'u5', name: 'Elena Rodriguez', email: 'elena@example.com' },
  },
]

export type SwarmFilters = {
  search?: string
  categoryId?: string
  categoryIds?: string
  userId?: string
  featured?: boolean
  limit?: number
  offset?: number
  sortBy?: 'recent' | 'popular' | 'rating' | 'downloads'
}

export function useSwarms(filters: SwarmFilters = {}) {
  let filtered = [...MOCK_SWARMS]

  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter(
      s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    )
  }

  if (filters.categoryIds) {
    const ids = filters.categoryIds.split(',')
    filtered = filtered.filter(s => s.category && ids.includes(s.category.id))
  }

  if (filters.sortBy === 'popular') {
    filtered.sort((a, b) => b.favorites_count - a.favorites_count)
  } else if (filters.sortBy === 'recent') {
    filtered.reverse()
  }

  return {
    data: { swarms: filtered, total: filtered.length },
    isLoading: false,
    error: null,
  }
}

export function useCategories() {
  return {
    data: MOCK_CATEGORIES,
    isLoading: false,
    error: null,
  }
}

export function useIsAdmin() {
  return {
    data: { isAdmin: false },
    isLoading: false,
  }
}
