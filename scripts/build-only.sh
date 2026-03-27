#!/usr/bin/env bash
# =============================================================================
#  SetGo — Build Only (no git operations)
#  Builds all services without creating a branch or pushing.
#  Usage: bash scripts/build-only.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
BOLD='\033[1m'; NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/Frontend"

success() { echo -e "${GREEN}✔  $*${NC}"; }
error()   { echo -e "${RED}✖  $*${NC}"; exit 1; }
step()    { echo -e "\n${CYAN}─────────────────────────────────────────${NC}\n${BOLD}$*${NC}"; }

step "⚡  Frontend Build"
cd "$FRONTEND_DIR"
[[ ! -d node_modules ]] && npm install --no-audit --no-fund
npm run build
[[ -d dist ]] || error "Frontend dist/ not created"
size=$(du -sh dist 2>/dev/null | cut -f1)
success "Frontend built — dist/ ≈ ${size}"

step "🔧  Backend Syntax Check"
cd "$REPO_ROOT/backend"
entry="index.js"; [[ -f "server.js" ]] && entry="server.js"
node --check "$entry" && success "Backend OK"

step "💳  Payment Microservice Syntax Check"
cd "$REPO_ROOT/payment-microservice"
node --check src/app.js && success "Payment OK"

echo ""
success "All builds complete. Run deploy-production.sh to push to a production branch."
