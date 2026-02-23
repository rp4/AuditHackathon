/**
 * Bluth MCP Client
 *
 * Lightweight MCP client for the Bluth Company demo data server.
 * Exposes 2 generic tools: get_schema and query_data.
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
    name: 'bluth_get_schema',
    description:
      'Get the database schema: all available tables, their columns with types, and row counts. Call this first to understand what data is available before querying.',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description:
            'Optional: get detailed schema for a specific table only. If omitted, returns all tables with column names.',
        },
      },
    },
  },
  {
    name: 'bluth_query_data',
    description:
      'Query any table in the Bluth Company database. Supports filtering, sorting, and pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description:
            'Table name to query (use the display name from get_schema, e.g. "Employees", "Vendors", "JournalEntries")',
        },
        filter: {
          type: 'string',
          description:
            "SQL WHERE clause. Examples: \"isRelatedParty = 1\", \"amount > 100000\", \"employmentStatus = 'Terminated'\"",
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
   * Call a tool via MCP JSON-RPC endpoint.
   * The tool name should include the bluth_ prefix.
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
