# Bluth Company MCP Server - SQLite Direct
FROM node:20-slim

# Install build tools for better-sqlite3 native module
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install SAP CAP CLI globally (for building the SQLite database)
RUN npm install -g @sap/cds-dk

# Install CAP dependencies (for building database)
COPY package*.json ./
RUN npm install

# Copy CAP application code and data
COPY db/ ./db/
COPY srv/ ./srv/

# Build SQLite database with mock data
RUN cds deploy --to sqlite

# Install MCP server dependencies
RUN npm install express better-sqlite3

# Copy MCP server
COPY mcp-server.js ./

# Copy landing page static files
COPY app/ ./app/

# Cloud Run uses PORT env variable
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start MCP server directly (no CAP server needed at runtime)
CMD ["node", "mcp-server.js"]
