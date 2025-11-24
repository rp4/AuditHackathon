#!/bin/bash

# This script helps identify remaining console.error statements that should be replaced with logger
# Run this to see what still needs to be fixed

echo "=== Remaining console.error in API routes ==="
echo ""

find src/app/api -name "*.ts" -type f -exec grep -l "console.error" {} \;

echo ""
echo "=== To fix manually, replace patterns like: ==="
echo "  console.error('Error message:', error)"
echo ""
echo "=== With: ==="
echo "  import { logger } from '@/lib/utils/logger'"
echo "  logger.serverError(error instanceof Error ? error : String(error), { endpoint: 'API_ROUTE_NAME' })"
echo ""
echo "=== Files that still need fixing: ==="
echo ""

# List files with line numbers
find src/app/api -name "*.ts" -type f -exec grep -Hn "console.error" {} \;
