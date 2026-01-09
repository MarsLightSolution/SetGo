#!/bin/bash

# SetGo Backend - Security Packages Installation Script
# This script installs all new security-related dependencies

echo ""
echo "🔐 Installing Security Packages for SetGo Backend"
echo "=================================================="
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the backend directory."
    exit 1
fi

echo "📦 Installing required security packages..."
echo ""

# Install security packages
npm install helmet express-rate-limit express-mongo-sanitize joi

echo ""
echo "✅ Security packages installed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Run: node scripts/generateSecrets.js"
echo "   2. Update your .env file with the generated secrets"
echo "   3. Review DEPLOYMENT_CHECKLIST.md for full deployment guide"
echo ""
echo "🎉 You're ready to test the security improvements!"
echo ""
