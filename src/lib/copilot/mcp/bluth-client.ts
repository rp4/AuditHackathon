/**
 * Bluth MCP Client
 *
 * Lightweight MCP client for the Bluth Company demo data server.
 * No authentication required - public endpoint for testing.
 */

export interface BluthToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface BluthToolResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

// Tool definitions matching the Bluth MCP server (prefixed with bluth_)
export const BLUTH_TOOL_DEFINITIONS: BluthToolDefinition[] = [
  {
    name: 'bluth_query_employees',
    description:
      'Query Bluth Company employees. Use to find ghost employees, terminated staff with access, or related party employees. Returns employee records with employment status, salary, and relationship flags.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description:
            'SQL WHERE clause. Examples: "isRelatedParty = 1", "employmentStatus = \'Terminated\'", "salary > 100000"',
        },
        limit: {
          type: 'number',
          description: 'Maximum records to return (default: 50)',
        },
      },
    },
  },
  {
    name: 'bluth_query_vendors',
    description:
      'Query Bluth Company vendors. Use to find related party vendors, suspicious payment recipients, or vendor risk analysis. Includes related party flags and risk ratings.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'SQL WHERE clause. Examples: "isRelatedParty = 1", "riskRating = \'High\'"',
        },
        limit: {
          type: 'number',
          description: 'Maximum records to return',
        },
      },
    },
  },
  {
    name: 'bluth_query_journal_entries',
    description:
      'Query journal entries/financial transactions. Use to find high-value transactions, suspicious entries, round-dollar amounts, or weekend postings.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'SQL WHERE clause. Examples: "amount > 100000", "isManualEntry = 1"',
        },
        limit: {
          type: 'number',
          description: 'Maximum records to return',
        },
        orderBy: {
          type: 'string',
          description: 'SQL ORDER BY. Example: "amount DESC"',
        },
      },
    },
  },
  {
    name: 'bluth_query_audit_findings',
    description:
      'Query known audit findings - the "answer key" of embedded anomalies. Use to validate AI detection accuracy or get hints about what issues exist.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description:
            'SQL WHERE clause. Examples: "severity = \'Critical\'", "category = \'Fraud\'"',
        },
      },
    },
  },
  {
    name: 'bluth_query_bank_transactions',
    description:
      'Query bank transactions. Find suspicious transactions, unusual patterns, or flagged payments.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'SQL WHERE clause. Example: "suspiciousFlag = 1"',
        },
        limit: {
          type: 'number',
          description: 'Maximum records to return',
        },
      },
    },
  },
  {
    name: 'bluth_query_projects',
    description: 'Query projects. Find cost overruns, troubled projects, or budget variances.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'SQL WHERE clause. Example: "costVariance > 0"',
        },
      },
    },
  },
  {
    name: 'bluth_detect_ghost_employees',
    description:
      'Automated analysis: Detect potential ghost employees by finding duplicate bank accounts across employees. Returns pairs of employees sharing the same bank account.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'bluth_detect_related_party_transactions',
    description:
      'Automated analysis: Find all related party vendors and summarize their transaction exposure.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'bluth_get_data_summary',
    description:
      'Get a summary of available data entities and record counts. Useful for understanding the scope of data available.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

const BLUTH_MCP_URL = process.env.BLUTH_MCP_URL || 'https://data.auditswarm.com';

export class BluthMCPClient {
  private requestId: number = 0;
  private sessionId: string | null = null;

  /**
   * Get available tool definitions
   */
  getTools(): BluthToolDefinition[] {
    return BLUTH_TOOL_DEFINITIONS;
  }

  /**
   * Get headers for MCP requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }
    return headers;
  }

  /**
   * Initialize the MCP session
   */
  async initialize(): Promise<void> {
    if (this.sessionId) {
      return;
    }

    const response = await fetch(`${BLUTH_MCP_URL}/mcp`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'gemini-agent-bluth',
            version: '1.0.0',
          },
        },
        id: ++this.requestId,
      }),
    });

    // Capture session ID from response header
    const sessionId = response.headers.get('Mcp-Session-Id');
    if (sessionId) {
      this.sessionId = sessionId;
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'Failed to initialize Bluth MCP session');
    }
  }

  /**
   * Call a tool via MCP JSON-RPC endpoint
   * The tool name should include the bluth_ prefix
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<BluthToolResult> {
    // Strip the bluth_ prefix to get the actual Bluth MCP tool name
    const bluthToolName = name.replace(/^bluth_/, '');

    try {
      // Ensure session is initialized
      await this.initialize();

      const response = await fetch(`${BLUTH_MCP_URL}/mcp`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: bluthToolName,
            arguments: args,
          },
          id: ++this.requestId,
        }),
      });

      const data = await response.json();

      // Check for JSON-RPC error
      if (data.error) {
        return {
          success: false,
          error: data.error.message || 'Bluth tool call failed',
        };
      }

      // Extract the result from MCP response
      const content = data.result?.content;
      if (content && Array.isArray(content)) {
        const textPart = content.find((p: { type: string }) => p.type === 'text');
        if (textPart?.text) {
          try {
            return {
              success: true,
              result: JSON.parse(textPart.text),
            };
          } catch {
            return {
              success: true,
              result: textPart.text,
            };
          }
        }
      }

      return {
        success: true,
        result: data.result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error connecting to Bluth MCP',
      };
    }
  }
}

/**
 * Create a Bluth MCP client instance
 */
export function createBluthMCPClient(): BluthMCPClient {
  return new BluthMCPClient();
}
