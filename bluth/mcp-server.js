#!/usr/bin/env node
/**
 * Bluth Company MCP Server - HTTP Transport (SQLite Direct)
 *
 * Provides MCP (Model Context Protocol) access to Bluth Company mock audit data.
 * Queries SQLite database directly for fast startup on Cloud Run.
 *
 * Endpoints:
 *   GET  /mcp                     - Discovery endpoint (required for MCP)
 *   POST /mcp                     - JSON-RPC 2.0 MCP endpoint
 *   GET  /.well-known/mcp-server-info  - Server metadata
 *   GET  /openapi.json            - OpenAPI spec for Copilot Studio
 */

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Open SQLite database
const dbPath = path.join(__dirname, 'db.sqlite');
let db;
try {
  db = new Database(dbPath, { readonly: true });
  console.log(`[SQLite] Connected to ${dbPath}`);
} catch (err) {
  console.error(`[SQLite] Failed to open database:`, err.message);
  process.exit(1);
}

// Middleware
app.use(express.json({ limit: '1mb' }));

// Serve static files from app/ directory
app.use(express.static(path.join(__dirname, 'app')));

// =============================================================================
// Session Management (Required for Copilot Studio)
// =============================================================================

const sessions = new Map();
const SESSION_TTL = 3600000; // 1 hour

function createSession() {
  const sessionId = 'mcp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
  const session = {
    id: sessionId,
    createdAt: Date.now(),
    lastAccessedAt: Date.now()
  };
  sessions.set(sessionId, session);
  console.log(`[Session] Created: ${sessionId}`);
  return session;
}

function getSession(sessionId) {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (session) {
    session.lastAccessedAt = Date.now();
    return session;
  }
  return null;
}

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.lastAccessedAt > SESSION_TTL) {
      sessions.delete(id);
      console.log(`[Session] Expired: ${id}`);
    }
  }
}, 60000);

// Detect Copilot Studio client
function isCopilotStudio(req) {
  const userAgent = req.headers['user-agent'] || '';
  return userAgent.includes('Microsoft') ||
         userAgent.includes('Copilot') ||
         req.headers['x-ms-client-request-id'] !== undefined ||
         req.headers['x-ms-correlation-id'] !== undefined;
}

// CORS for AI platforms
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Mcp-Session-Id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, X-MCP-Probe');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// =============================================================================
// MCP Tool Definitions
// =============================================================================

const MCP_TOOLS = [
  {
    name: 'get_schema',
    description: 'Get the database schema: all available tables, their columns with types, and row counts. Call this first to understand what data is available before querying.',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Optional: get schema for a specific table only. If omitted, returns all tables.',
        },
      },
    },
  },
  {
    name: 'query_data',
    description: 'Query any table in the Bluth Company database. Supports filtering, sorting, and pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name to query (use the display name from get_schema, e.g. "Employees", "Vendors", "JournalEntries")',
        },
        filter: {
          type: 'string',
          description: "SQL WHERE clause. Examples: \"isRelatedParty = 1\", \"amount > 100000\", \"employmentStatus = 'Terminated'\"",
        },
        orderBy: {
          type: 'string',
          description: 'SQL ORDER BY clause. Example: "amount DESC"',
        },
        limit: {
          type: 'number',
          description: 'Maximum records to return (default: 50, max: 500)',
        },
        offset: {
          type: 'number',
          description: 'Number of records to skip for pagination (default: 0)',
        },
      },
      required: ['table'],
    },
  },
];

// =============================================================================
// SQLite Query Helpers
// =============================================================================

function queryTable(table, filter, limit = 50, orderBy = null) {
  let sql = `SELECT * FROM ${table}`;
  if (filter) {
    sql += ` WHERE ${filter}`;
  }
  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }
  sql += ` LIMIT ${limit}`;

  try {
    return db.prepare(sql).all();
  } catch (err) {
    throw new Error(`SQL Error: ${err.message}`);
  }
}

function countTable(table, filter = null) {
  let sql = `SELECT COUNT(*) as count FROM ${table}`;
  if (filter) {
    sql += ` WHERE ${filter}`;
  }
  try {
    return db.prepare(sql).get().count;
  } catch (err) {
    return 'N/A';
  }
}

// =============================================================================
// Tool Handlers
// =============================================================================

async function handleToolCall(name, args) {
  switch (name) {
    case 'get_schema': {
      const targetTable = args.table;

      if (targetTable) {
        // Schema for a specific table
        const sqliteTable = TABLE_MAPPING[targetTable];
        if (!sqliteTable) {
          throw new Error(`Unknown table: ${targetTable}. Use get_schema without a table parameter to see available tables.`);
        }

        const columns = db.prepare(`PRAGMA table_info(${sqliteTable})`).all();
        const count = countTable(sqliteTable);

        return {
          table: targetTable,
          rowCount: count,
          columns: columns.map(col => ({
            name: col.name,
            type: col.type || 'TEXT',
            nullable: col.notnull === 0,
            primaryKey: col.pk === 1,
          })),
        };
      }

      // Schema for all tables
      const tables = [];
      for (const [displayName, sqliteTable] of Object.entries(TABLE_MAPPING)) {
        try {
          const count = countTable(sqliteTable);
          const columns = db.prepare(`PRAGMA table_info(${sqliteTable})`).all();
          tables.push({
            table: displayName,
            rowCount: count,
            columns: columns.map(col => col.name),
          });
        } catch (err) {
          // Skip tables that don't exist yet
        }
      }

      return {
        dataSource: 'Bluth Company (Arrested Development)',
        description: 'Mock audit data with embedded anomalies for AI audit agent testing',
        totalTables: tables.length,
        tables,
      };
    }

    case 'query_data': {
      const tableName = args.table;
      if (!tableName) {
        throw new Error('table parameter is required. Use get_schema to see available tables.');
      }

      const sqliteTable = TABLE_MAPPING[tableName];
      if (!sqliteTable) {
        throw new Error(`Unknown table: ${tableName}. Use get_schema to see available tables.`);
      }

      const limit = Math.min(args.limit || 50, 500);
      const offset = args.offset || 0;
      const filter = args.filter || null;
      const orderBy = args.orderBy || null;

      // Get total count (with filter if applicable)
      const totalCount = countTable(sqliteTable, filter);

      // Build and execute query
      let sql = `SELECT * FROM ${sqliteTable}`;
      if (filter) {
        sql += ` WHERE ${filter}`;
      }
      if (orderBy) {
        sql += ` ORDER BY ${orderBy}`;
      }
      sql += ` LIMIT ${limit} OFFSET ${offset}`;

      try {
        const rows = db.prepare(sql).all();
        return {
          table: tableName,
          totalCount,
          returnedCount: rows.length,
          limit,
          offset,
          rows,
        };
      } catch (err) {
        throw new Error(`Query error on ${tableName}: ${err.message}`);
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// =============================================================================
// Discovery Endpoints
// =============================================================================

// GET /mcp - Required discovery endpoint
app.get('/mcp', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    transports: ['streamable-http'],
    server: 'bluth-odata-mcp',
    version: '1.0.0'
  });
});

// MCP Server Info
app.get('/.well-known/mcp-server-info', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    name: 'Bluth Company Audit Data MCP',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    description: 'Mock audit data from Bluth Company for AI audit agent testing',
    capabilities: {
      tools: MCP_TOOLS.map(t => t.name),
      tasks: false,
      resources: false,
      prompts: false
    },
    transports: ['streamable-http'],
    authentication: {
      type: 'none',
      description: 'Public endpoint - no authentication required'
    }
  });
});

// Helper to get base URL (respects Cloud Run's x-forwarded-proto)
function getBaseUrl(req) {
  const proto = req.get('x-forwarded-proto') || req.protocol;
  return `${proto}://${req.get('host')}`;
}

// OAuth Authorization Server Metadata (RFC 8414)
// Required by Copilot Studio even for public endpoints
app.get('/.well-known/oauth-authorization-server', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.set('Cache-Control', 'no-store');
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'client_credentials'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    scopes_supported: ['read'],
    code_challenge_methods_supported: ['S256'],
    service_documentation: 'https://github.com/auditswarm/bluth-mcp'
  });
});

// Path-specific OAuth metadata for /mcp
app.get('/.well-known/oauth-authorization-server/mcp', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.set('Cache-Control', 'no-store');
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'client_credentials'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    scopes_supported: ['read'],
    code_challenge_methods_supported: ['S256']
  });
});

// OAuth Protected Resource Metadata (RFC 9728)
app.get('/.well-known/oauth-protected-resource', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.set('Cache-Control', 'no-store');
  res.json({
    resource: baseUrl,
    authorization_servers: [baseUrl],
    bearer_methods_supported: ['header'],
    scopes_supported: ['read']
  });
});

// Path-specific protected resource for /mcp
app.get('/.well-known/oauth-protected-resource/mcp', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.set('Cache-Control', 'no-store');
  res.json({
    resource: `${baseUrl}/mcp`,
    authorization_servers: [baseUrl],
    bearer_methods_supported: ['header'],
    scopes_supported: ['read']
  });
});

// Dynamic Client Registration (RFC 7591)
// Required by Copilot Studio
app.post('/oauth/register', (req, res) => {
  const clientId = 'bluth-client-' + Date.now();
  const clientSecret = 'public-secret-' + Math.random().toString(36).slice(2);

  res.status(201).json({
    client_id: clientId,
    client_secret: clientSecret,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_secret_expires_at: 0, // Never expires
    redirect_uris: req.body.redirect_uris || [],
    grant_types: ['authorization_code', 'client_credentials'],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_post',
    client_name: req.body.client_name || 'Copilot Studio Client'
  });
});

// Dummy OAuth endpoints (return success for any request)
app.get('/oauth/authorize', (req, res) => {
  // For public API, just redirect back with a dummy code
  const redirectUri = req.query.redirect_uri;
  const state = req.query.state || '';
  if (redirectUri) {
    res.redirect(`${redirectUri}?code=public-access-granted&state=${state}`);
  } else {
    res.json({ message: 'Public API - no authentication required' });
  }
});

app.post('/oauth/token', (req, res) => {
  // Return a dummy token for public access
  res.json({
    access_token: 'public-access-token',
    token_type: 'Bearer',
    expires_in: 86400,
    scope: 'read'
  });
});

// OpenAPI spec for Copilot Studio
app.get('/openapi.json', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const scheme = (req.get('x-forwarded-proto') || req.protocol) === 'http' ? 'http' : 'https';

  const spec = {
    swagger: '2.0',
    info: {
      title: 'Bluth Company Audit Data MCP',
      description: `Mock audit data from Bluth Company for AI audit agent testing.

This MCP server provides ${MCP_TOOLS.length} tools for querying and analyzing audit data.

**Protocol:** MCP 2025-11-25 (Model Context Protocol)
**Transport:** Streamable HTTP

**Available Tools:**
${MCP_TOOLS.map(t => `- ${t.name}: ${t.description.split('.')[0]}`).join('\n')}

**Usage:** POST JSON-RPC 2.0 requests to /mcp endpoint
**Authentication:** None required (public demo data)`,
      version: '1.0.0'
    },
    host: req.get('host'),
    basePath: '/',
    schemes: [scheme],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      OAuth2: {
        type: 'oauth2',
        flow: 'accessCode',
        authorizationUrl: `${baseUrl}/oauth/authorize`,
        tokenUrl: `${baseUrl}/oauth/token`,
        scopes: {
          'read': 'Read access to audit data'
        }
      }
    },
    paths: {
      // Main MCP endpoint with Microsoft Copilot Studio extension
      '/mcp': {
        post: {
          summary: 'Bluth Company MCP Server',
          description: `Model Context Protocol (MCP 2025-11-25) endpoint for Bluth Company audit data.

This endpoint accepts JSON-RPC 2.0 requests and provides ${MCP_TOOLS.length} tools for AI agents.

**JSON-RPC Methods:**
- initialize: Initialize MCP connection
- tools/list: List all available tools
- tools/call: Execute a tool
- tasks/get: Get task status by ID
- tasks/list: List all tasks
- tasks/cancel: Cancel a running task
- tasks/result: Get task result
- ping: Heartbeat

**Example - List Tools:**
\`\`\`json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
\`\`\`

**Example - Call Tool:**
\`\`\`json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": { "name": "query_employees", "arguments": { "filter": "isRelatedParty = 1" } },
  "id": 2
}
\`\`\``,
          operationId: 'InvokeMCP',
          'x-ms-agentic-protocol': 'mcp-streamable-1.0',  // Microsoft Copilot Studio extension
          consumes: ['application/json'],
          produces: ['application/json'],
          parameters: [
            {
              name: 'body',
              in: 'body',
              required: true,
              description: 'JSON-RPC 2.0 request',
              schema: {
                type: 'object',
                required: ['jsonrpc', 'method', 'id'],
                properties: {
                  jsonrpc: {
                    type: 'string',
                    enum: ['2.0'],
                    description: 'JSON-RPC version'
                  },
                  method: {
                    type: 'string',
                    enum: ['initialize', 'tools/list', 'tools/call', 'tasks/get', 'tasks/list', 'tasks/cancel', 'tasks/result', 'ping'],
                    description: 'JSON-RPC method name'
                  },
                  params: {
                    type: 'object',
                    description: 'Method parameters'
                  },
                  id: {
                    type: 'string',
                    description: 'Request identifier'
                  }
                }
              }
            }
          ],
          responses: {
            '200': {
              description: 'Successful JSON-RPC response',
              schema: {
                type: 'object',
                properties: {
                  jsonrpc: { type: 'string', enum: ['2.0'] },
                  result: { type: 'object', description: 'Method result' },
                  id: { type: 'string', description: 'Request identifier' }
                }
              }
            },
            '400': {
              description: 'Invalid JSON-RPC request',
              schema: {
                type: 'object',
                properties: {
                  jsonrpc: { type: 'string' },
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'number' },
                      message: { type: 'string' }
                    }
                  },
                  id: { type: 'string' }
                }
              }
            }
          },
          security: [{ 'OAuth2': ['read'] }]
        }
      }
    },
    security: [{ 'OAuth2': ['read'] }],
    definitions: {}
  };

  // Note: Unlike the REST /tools/* endpoints (which are for direct access),
  // Copilot Studio uses the /mcp endpoint with JSON-RPC protocol.
  // The individual /tools/* endpoints are NOT included in the OpenAPI spec
  // to avoid confusion - Copilot Studio should use MCP protocol via /mcp.

  res.set('Cache-Control', 'no-store');
  res.json(spec);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', server: 'bluth-odata-mcp', database: 'connected' });
});

// =============================================================================
// MCP JSON-RPC Endpoint
// =============================================================================

app.post('/mcp', async (req, res) => {
  const { jsonrpc, id: rawId, method, params } = req.body;

  // CRITICAL: Copilot Studio requires id to be a STRING, not a number
  const id = rawId !== undefined && rawId !== null ? String(rawId) : null;

  if (jsonrpc !== '2.0') {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: id,
      error: { code: -32600, message: 'Invalid Request: Must be JSON-RPC 2.0' }
    });
  }

  // Get or validate session
  const sessionId = req.headers['mcp-session-id'];
  let session = getSession(sessionId);

  // Detect Copilot Studio for sync mode
  const copilotStudio = isCopilotStudio(req);

  console.log(`[MCP] ${method}`, params ? JSON.stringify(params).slice(0, 100) : '',
              copilotStudio ? '[CopilotStudio]' : '',
              session ? `[Session:${session.id.slice(-8)}]` : '[NoSession]');

  try {
    let result;

    switch (method) {
      case 'initialize':
        // Create new session on initialize
        session = createSession();
        res.setHeader('Mcp-Session-Id', session.id);

        result = {
          protocolVersion: '2024-11-05',  // Use stable protocol version matching working Node.js example
          capabilities: {
            experimental: {},
            prompts: { listChanged: false },
            resources: { subscribe: false, listChanged: false },
            tools: { listChanged: false }
          },
          serverInfo: {
            name: 'Bluth Company Audit Data MCP',
            version: '1.0.0'
          }
        };
        break;

      case 'tools/list':
        // Return tools in MCP 2024-11-05 format
        result = {
          tools: MCP_TOOLS.map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        };
        break;

      case 'resources/list':
        // Return empty resources list
        result = { resources: [] };
        break;

      case 'prompts/list':
        // Return empty prompts list
        result = { prompts: [] };
        break;

      case 'tools/describe':
        // Describe a specific tool
        const toolName = params?.name;
        const tool = MCP_TOOLS.find(t => t.name === toolName);
        if (tool) {
          result = { tool };
        } else {
          return res.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: `Unknown tool: ${toolName}` }
          });
        }
        break;

      case 'tools/call':
        const { name, arguments: args } = params;
        const toolResult = await handleToolCall(name, args || {});
        result = {
          content: [
            { type: 'text', text: JSON.stringify(toolResult, null, 2) }
          ]
        };
        break;

      case 'ping':
        result = {};
        break;

      // Handle notifications - always return empty result for Copilot Studio compatibility
      case 'notifications/initialized':
      case 'notifications/cancelled':
      case 'notifications/progress':
      case 'notifications/subscribe':
        result = {};
        break;

      default:
        // Check if it's any other notification (starts with notifications/)
        if (method && method.startsWith('notifications/')) {
          result = {};
          break;
        }
        return res.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        });
    }

    // Always include session header if we have one
    if (session) {
      res.setHeader('Mcp-Session-Id', session.id);
    }

    res.json({ jsonrpc: '2.0', id, result });

  } catch (error) {
    console.error(`[MCP] Error:`, error);
    res.json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32000,
        message: error.message || 'Internal error'
      }
    });
  }
});

// REST endpoints for each tool (for Copilot Studio compatibility)
for (const tool of MCP_TOOLS) {
  app.post(`/tools/${tool.name}`, async (req, res) => {
    try {
      console.log(`[REST] ${tool.name}`, JSON.stringify(req.body).slice(0, 100));
      const result = await handleToolCall(tool.name, req.body);
      res.json(result);
    } catch (error) {
      console.error(`[REST] Error:`, error);
      res.status(500).json({ error: error.message });
    }
  });
}

// =============================================================================
// Landing Page API Endpoints
// =============================================================================

// Table name mapping from display names to SQLite table names
const TABLE_MAPPING = {
  'Employees': 'bluth_company_Employees',
  'Vendors': 'bluth_company_Vendors',
  'JournalEntries': 'bluth_company_JournalEntries',
  'BankTransactions': 'bluth_company_BankTransactions',
  'Projects': 'bluth_company_Projects',
  'FixedAssets': 'bluth_company_FixedAssets',
  'Inventory': 'bluth_company_Inventory',
  'VendorInvoices': 'bluth_company_VendorInvoices',
  'CustomerInvoices': 'bluth_company_CustomerInvoices',
  'Customers': 'bluth_company_Customers',
  'PayrollTransactions': 'bluth_company_PayrollTransactions',
  'ExpenseReports': 'bluth_company_ExpenseReports',
  'BankStatements': 'bluth_company_BankStatements',
  'CompanyCodes': 'bluth_company_CompanyCodes',
  'CostCenters': 'bluth_company_CostCenters',
  'GLAccounts': 'bluth_company_GLAccounts',
  'RelatedPartyTransactions': 'bluth_company_RelatedPartyTransactions'
};

// GET /api/tables - List all tables with record counts
app.get('/api/tables', (req, res) => {
  const tables = [];

  for (const [displayName, sqliteTable] of Object.entries(TABLE_MAPPING)) {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${sqliteTable}`).get().count;
      tables.push({ name: displayName, sqliteTable, count });
    } catch (err) {
      // Skip tables that don't exist
      console.warn(`[API] Table ${sqliteTable} not found:`, err.message);
    }
  }

  // Sort by record count descending
  tables.sort((a, b) => b.count - a.count);

  res.json({ tables });
});

// GET /api/summary - Data summary for stats cards
app.get('/api/summary', (req, res) => {
  const tables = [];
  let totalRecords = 0;

  for (const [displayName, sqliteTable] of Object.entries(TABLE_MAPPING)) {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${sqliteTable}`).get().count;
      tables.push({ name: displayName, count });
      totalRecords += count;
    } catch (err) {
      // Skip missing tables
    }
  }

  res.json({
    tables,
    totalRecords,
    totalEntities: tables.length,
    mcpTools: MCP_TOOLS.length
  });
});

// GET /api/tables/:name - Get table data with pagination
app.get('/api/tables/:name', (req, res) => {
  const { name } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
  const offset = parseInt(req.query.offset) || 0;

  const sqliteTable = TABLE_MAPPING[name];
  if (!sqliteTable) {
    return res.status(404).json({ error: `Table not found: ${name}` });
  }

  try {
    // Get total count
    const totalCount = db.prepare(`SELECT COUNT(*) as count FROM ${sqliteTable}`).get().count;

    // Get column info
    const pragmaResult = db.prepare(`PRAGMA table_info(${sqliteTable})`).all();
    const columns = pragmaResult.map(col => col.name);

    // Get rows
    const rows = db.prepare(`SELECT * FROM ${sqliteTable} LIMIT ? OFFSET ?`).all(limit, offset);

    res.json({
      name,
      totalCount,
      columns,
      rows,
      limit,
      offset
    });
  } catch (err) {
    console.error(`[API] Error querying ${name}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tables/:name/csv - Download table as CSV
app.get('/api/tables/:name/csv', (req, res) => {
  const { name } = req.params;

  const sqliteTable = TABLE_MAPPING[name];
  if (!sqliteTable) {
    return res.status(404).json({ error: `Table not found: ${name}` });
  }

  try {
    // Get all rows
    const rows = db.prepare(`SELECT * FROM ${sqliteTable}`).all();

    if (rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${name}.csv"`);
      return res.send('');
    }

    // Get column names from first row
    const columns = Object.keys(rows[0]);

    // Build CSV content
    const csvRows = [];

    // Header row
    csvRows.push(columns.map(col => escapeCsvField(col)).join(','));

    // Data rows
    for (const row of rows) {
      const values = columns.map(col => escapeCsvField(row[col]));
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.csv"`);
    res.send(csv);

  } catch (err) {
    console.error(`[API] Error generating CSV for ${name}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Helper: Escape CSV field (handle quotes, commas, newlines)
function escapeCsvField(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Serve landing page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

// =============================================================================
// Start Server
// =============================================================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         Bluth Company MCP Server - SQLite Direct             ║
╠══════════════════════════════════════════════════════════════╣
║  "There's always money in the banana stand"                  ║
╚══════════════════════════════════════════════════════════════╝

🚀 Server running on port ${PORT}

📍 Endpoints:
   GET  /mcp                          - Discovery (required for MCP)
   POST /mcp                          - JSON-RPC 2.0 MCP endpoint
   GET  /.well-known/mcp-server-info  - Server metadata
   GET  /openapi.json                 - OpenAPI spec for Copilot Studio
   GET  /health                       - Health check

🗄️  Database: ${dbPath}

📝 Test with:
   curl -X POST http://localhost:${PORT}/mcp \\
     -H "Content-Type: application/json" \\
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

🔑 Authentication: None required (public mock data)
  `);
});
