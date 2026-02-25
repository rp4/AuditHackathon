#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const ODATA_BASE_URL = process.env.ODATA_URL || "http://localhost:4004/odata/v4/audit";

// Helper to fetch from OData
async function fetchOData(path, params = {}) {
  // Build query string manually to avoid double-encoding
  const queryParts = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`);

  const queryString = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
  const fullUrl = `${ODATA_BASE_URL}/${path}${queryString}`;

  const response = await fetch(fullUrl);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OData error: ${response.status} ${response.statusText} - ${text}`);
  }
  return response.json();
}

const server = new Server(
  {
    name: "bluth-odata-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query_employees",
        description: "Query Bluth Company employees. Use to find ghost employees, related parties, or specific staff.",
        inputSchema: {
          type: "object",
          properties: {
            filter: { type: "string", description: "OData $filter expression (e.g., 'isRelatedParty eq true')" },
            select: { type: "string", description: "OData $select fields (e.g., 'employeeNumber,fullName,jobTitle')" },
            top: { type: "number", description: "Number of records to return" },
          },
        },
      },
      {
        name: "query_vendors",
        description: "Query Bluth Company vendors. Use to find related party vendors, suspicious vendors, or payment recipients.",
        inputSchema: {
          type: "object",
          properties: {
            filter: { type: "string", description: "OData $filter expression" },
            select: { type: "string", description: "OData $select fields" },
            top: { type: "number", description: "Number of records to return" },
          },
        },
      },
      {
        name: "query_journal_entries",
        description: "Query journal entries/transactions. Use to find high-value transactions, suspicious entries, or specific postings.",
        inputSchema: {
          type: "object",
          properties: {
            filter: { type: "string", description: "OData $filter expression (e.g., 'amount gt 100000')" },
            select: { type: "string", description: "OData $select fields" },
            top: { type: "number", description: "Number of records to return" },
            orderby: { type: "string", description: "OData $orderby (e.g., 'amount desc')" },
          },
        },
      },
      {
        name: "query_bank_transactions",
        description: "Query bank transactions. Use to find suspicious transactions flagged for review.",
        inputSchema: {
          type: "object",
          properties: {
            filter: { type: "string", description: "OData $filter (e.g., 'suspiciousFlag eq true')" },
            select: { type: "string", description: "OData $select fields" },
            top: { type: "number", description: "Number of records to return" },
          },
        },
      },
      {
        name: "query_projects",
        description: "Query projects. Use to find cost overruns, troubled projects like Sudden Valley or Iraq.",
        inputSchema: {
          type: "object",
          properties: {
            filter: { type: "string", description: "OData $filter (e.g., 'costVariance gt 0')" },
            select: { type: "string", description: "OData $select fields" },
          },
        },
      },
      {
        name: "get_entity_count",
        description: "Get count of records in an entity.",
        inputSchema: {
          type: "object",
          properties: {
            entity: { 
              type: "string", 
              description: "Entity name (Employees, Vendors, JournalEntries, BankTransactions, etc.)",
              enum: ["Employees", "Vendors", "JournalEntries", "BankTransactions", "Projects", "CustomerInvoices", "VendorInvoices", "GLAccounts", "FixedAssets", "Inventory"]
            },
            filter: { type: "string", description: "Optional OData $filter" },
          },
          required: ["entity"],
        },
      },
      {
        name: "detect_ghost_employees",
        description: "Detect potential ghost employees by finding duplicate bank accounts across employees.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "detect_related_party_transactions",
        description: "Find all related party vendors and their transaction totals.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "query_employees": {
        const params = {};
        if (args.filter) params.$filter = args.filter;
        if (args.select) params.$select = args.select;
        if (args.top) params.$top = args.top;
        const result = await fetchOData("Employees", params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "query_vendors": {
        const params = {};
        if (args.filter) params.$filter = args.filter;
        if (args.select) params.$select = args.select;
        if (args.top) params.$top = args.top;
        const result = await fetchOData("Vendors", params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "query_journal_entries": {
        const params = {};
        if (args.filter) params.$filter = args.filter;
        if (args.select) params.$select = args.select;
        if (args.top) params.$top = args.top;
        if (args.orderby) params.$orderby = args.orderby;
        const result = await fetchOData("JournalEntries", params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "query_bank_transactions": {
        const params = {};
        if (args.filter) params.$filter = args.filter;
        if (args.select) params.$select = args.select;
        if (args.top) params.$top = args.top;
        const result = await fetchOData("BankTransactions", params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "query_projects": {
        const params = {};
        if (args.filter) params.$filter = args.filter;
        if (args.select) params.$select = args.select;
        const result = await fetchOData("Projects", params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "get_entity_count": {
        const params = {};
        if (args.filter) params.$filter = args.filter;
        const response = await fetch(`${ODATA_BASE_URL}/${args.entity}/$count${args.filter ? '?$filter=' + encodeURIComponent(args.filter) : ''}`);
        const count = await response.text();
        return { content: [{ type: "text", text: `${args.entity} count: ${count}` }] };
      }

      case "detect_ghost_employees": {
        const result = await fetchOData("Employees", { $select: "employeeNumber,fullName,bankAccount,salary" });
        const employees = result.value;
        
        // Find duplicate bank accounts
        const bankAccountMap = new Map();
        const duplicates = [];
        
        for (const emp of employees) {
          if (emp.bankAccount) {
            if (bankAccountMap.has(emp.bankAccount)) {
              duplicates.push({
                employee1: bankAccountMap.get(emp.bankAccount),
                employee2: { number: emp.employeeNumber, name: emp.fullName, salary: emp.salary },
                sharedBankAccount: emp.bankAccount,
                potentialFraud: "GHOST_EMPLOYEE - Same bank account indicates possible duplicate/fictitious employee"
              });
            }
            bankAccountMap.set(emp.bankAccount, { number: emp.employeeNumber, name: emp.fullName, salary: emp.salary });
          }
        }
        
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              analysisType: "Ghost Employee Detection",
              duplicateBankAccountsFound: duplicates.length,
              findings: duplicates
            }, null, 2) 
          }] 
        };
      }

      case "detect_related_party_transactions": {
        const vendors = await fetchOData("Vendors", { $filter: "isRelatedParty eq true" });
        const result = vendors.value.map(v => ({
          vendorNumber: v.vendorNumber,
          name: v.name,
          relatedPartyType: v.relatedPartyType,
          riskRating: v.riskRating,
          notes: v.notes
        }));
        
        return { 
          content: [{ 
            type: "text", 
            text: JSON.stringify({
              analysisType: "Related Party Vendor Analysis",
              relatedPartyVendorsFound: result.length,
              vendors: result
            }, null, 2) 
          }] 
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bluth OData MCP Server running on stdio");
}

main().catch(console.error);
