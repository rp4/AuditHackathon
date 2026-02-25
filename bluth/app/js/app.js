/**
 * Bluth Company MCP - Landing Page JavaScript
 *
 * Handles:
 * - Loading table list from API
 * - Table data preview
 * - CSV downloads
 * - Clipboard operations
 */

// API base URL (relative for same-origin, can be configured for dev)
const API_BASE = window.location.origin;

// Table descriptions for better UX
const TABLE_DESCRIPTIONS = {
  Employees: 'Staff records including ghost employees and related parties',
  Vendors: 'Vendor master data with related party flags',
  JournalEntries: 'Financial transactions with suspicious entries',
  BankTransactions: 'Bank transactions with fraud flags',
  Projects: 'Project data with cost overruns',
  FixedAssets: 'Company asset records',
  Inventory: 'Stock and inventory items',
  VendorInvoices: 'Accounts payable invoices',
  CustomerInvoices: 'Accounts receivable invoices',
  Customers: 'Customer master data',
  PayrollTransactions: 'Payroll with anomalies',
  ExpenseReports: 'Employee expense reports',
  BankStatements: 'Bank statement records',
  CompanyCodes: 'Company structure codes',
  CostCenters: 'Department cost centers',
  GLAccounts: 'General ledger chart of accounts',
  RelatedPartyTransactions: 'Related party disclosure records'
};

// Global state
let tables = [];
let currentTableData = [];

/**
 * Initialize the application
 */
async function init() {
  try {
    // Load tables and summary in parallel
    const [tablesData, summaryData] = await Promise.all([
      fetchJSON('/api/tables'),
      fetchJSON('/api/summary')
    ]);

    tables = tablesData.tables || [];
    populateTableSelector(tables);
    updateStats(summaryData);

    // Set up event listeners
    setupEventListeners();

  } catch (error) {
    console.error('Failed to initialize:', error);
    showToast('Failed to load data. Please refresh the page.', 'error');
  }
}

/**
 * Fetch JSON from API
 */
async function fetchJSON(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Populate the table selector dropdown
 */
function populateTableSelector(tables) {
  const select = document.getElementById('table-select');
  select.innerHTML = '<option value="">-- Select an entity --</option>';

  tables.sort((a, b) => a.name.localeCompare(b.name)).forEach(table => {
    const option = document.createElement('option');
    option.value = table.name;
    option.textContent = `${table.name} (${table.count} records)`;
    select.appendChild(option);
  });
}

/**
 * Update stats cards with summary data
 */
function updateStats(summary) {
  // Calculate total records
  const totalRecords = summary.tables.reduce((sum, t) => sum + t.count, 0);
  const totalEntities = summary.tables.length;

  document.getElementById('total-records').textContent = formatNumber(totalRecords);
  document.getElementById('total-entities').textContent = totalEntities;
  document.getElementById('mcp-tools-count').textContent = summary.mcpTools || 2;
}

/**
 * Format numbers with commas
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Table selector change
  document.getElementById('table-select').addEventListener('change', handleTableChange);

  // Download CSV button
  document.getElementById('download-csv').addEventListener('click', handleDownloadCSV);

  // Copy endpoint button
  document.getElementById('copy-endpoint').addEventListener('click', () => {
    const endpoint = document.getElementById('mcp-endpoint').textContent;
    copyToClipboard(endpoint, 'Endpoint copied to clipboard');
  });

  // Copy example buttons
  document.getElementById('copy-example-1')?.addEventListener('click', () => {
    const example = document.querySelectorAll('.code-block code')[0].textContent;
    copyToClipboard(example, 'Example 1 copied to clipboard');
  });

  document.getElementById('copy-example-2')?.addEventListener('click', () => {
    const example = document.querySelectorAll('.code-block code')[1].textContent;
    copyToClipboard(example, 'Example 2 copied to clipboard');
  });
}

/**
 * Handle table selection change
 */
async function handleTableChange(event) {
  const tableName = event.target.value;
  const tableWrapper = document.getElementById('table-wrapper');
  const tableInfo = document.getElementById('table-info');
  const downloadBtn = document.getElementById('download-csv');
  const loading = document.getElementById('loading');

  if (!tableName) {
    tableWrapper.innerHTML = '<p class="placeholder-text">Select an entity from the dropdown to preview data</p>';
    tableInfo.style.display = 'none';
    downloadBtn.disabled = true;
    return;
  }

  // Show loading state
  loading.style.display = 'flex';
  tableWrapper.innerHTML = '';
  downloadBtn.disabled = true;

  try {
    const data = await fetchJSON(`/api/tables/${tableName}?limit=20`);
    currentTableData = data.rows || [];

    // Update table info
    document.getElementById('record-count').textContent = `${data.totalCount} records total (showing first 20)`;
    document.getElementById('table-description').textContent = TABLE_DESCRIPTIONS[tableName] || 'Entity data';
    tableInfo.style.display = 'block';

    // Render table
    renderTable(currentTableData, data.columns);
    downloadBtn.disabled = false;

  } catch (error) {
    console.error('Failed to load table:', error);
    tableWrapper.innerHTML = `<p class="placeholder-text" style="color: var(--error);">Failed to load ${tableName}: ${error.message}</p>`;
    tableInfo.style.display = 'none';
  } finally {
    loading.style.display = 'none';
  }
}

/**
 * Render data as HTML table
 */
function renderTable(rows, columns) {
  const tableWrapper = document.getElementById('table-wrapper');

  if (!rows.length) {
    tableWrapper.innerHTML = '<p class="placeholder-text">No data available</p>';
    return;
  }

  // Use provided columns or derive from first row
  const cols = columns || Object.keys(rows[0]);

  let html = '<table class="data-table"><thead><tr>';
  cols.forEach(col => {
    html += `<th>${escapeHtml(col)}</th>`;
  });
  html += '</tr></thead><tbody>';

  rows.forEach(row => {
    html += '<tr>';
    cols.forEach(col => {
      const value = row[col];
      const displayValue = value === null || value === undefined ? '' : String(value);
      html += `<td title="${escapeHtml(displayValue)}">${escapeHtml(displayValue)}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  tableWrapper.innerHTML = html;
}

/**
 * Handle CSV download
 */
async function handleDownloadCSV() {
  const tableName = document.getElementById('table-select').value;
  if (!tableName) return;

  const downloadBtn = document.getElementById('download-csv');
  const originalHTML = downloadBtn.innerHTML;

  try {
    downloadBtn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;"></span> Downloading...';
    downloadBtn.disabled = true;

    // Trigger download via hidden link
    const downloadUrl = `${API_BASE}/api/tables/${tableName}/csv`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${tableName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloaded ${tableName}.csv`, 'success');

  } catch (error) {
    console.error('Download failed:', error);
    showToast('Download failed. Please try again.', 'error');
  } finally {
    downloadBtn.innerHTML = originalHTML;
    downloadBtn.disabled = false;
  }
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage || 'Copied to clipboard', 'success');
  } catch (error) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(successMessage || 'Copied to clipboard', 'success');
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
