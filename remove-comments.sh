#!/bin/bash
# Remove all comments and debug logs from TypeScript files

find src -name "*.ts" -type f -exec sed -i '/^\s*\/\//d' {} \;
find src -name "*.ts" -type f -exec sed -i '/^\s*\/\*\*/,/\*\//d' {} \;

echo "✅ Comments removed from all TypeScript files"
