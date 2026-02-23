#!/bin/sh
# Start both OData server (SAP CAP) and MCP server

echo "Starting Bluth Company servers..."

# Start SAP CAP OData server in background on port 4004
echo "Starting OData server on port 4004..."
cds serve --port 4004 &
ODATA_PID=$!

# Wait for OData server to be ready using node
echo "Waiting for OData server to start..."
node -e "
const http = require('http');
const maxAttempts = 30;
let attempts = 0;

function checkServer() {
  attempts++;
  const req = http.get('http://localhost:4004/odata/v4/audit/', (res) => {
    if (res.statusCode === 200) {
      console.log('OData server is ready!');
      process.exit(0);
    } else {
      retry();
    }
  });
  req.on('error', () => retry());
  req.setTimeout(1000, () => { req.destroy(); retry(); });
}

function retry() {
  if (attempts >= maxAttempts) {
    console.log('OData server failed to start after ' + maxAttempts + ' attempts');
    process.exit(1);
  }
  console.log('Waiting... attempt ' + attempts + '/' + maxAttempts);
  setTimeout(checkServer, 1000);
}

checkServer();
"

if [ $? -ne 0 ]; then
  echo "Failed to start OData server"
  exit 1
fi

# Start MCP server on port 8080 (Cloud Run default) in foreground
echo "Starting MCP server on port 8080..."
export ODATA_URL="http://localhost:4004/odata/v4/audit"
export PORT=8080
exec node mcp-server.js
