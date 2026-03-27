#!/usr/bin/env bash
# =============================================================================
#  SetGo — PM2 Start / Restart Script
#  Run this on your server after pulling a new production branch.
#  Usage: bash scripts/pm2-start.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

success() { echo -e "${GREEN}✔  $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }
error()   { echo -e "${RED}✖  $*${NC}"; exit 1; }
step()    { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n${BOLD}$*${NC}"; }

echo -e "\n${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║         SetGo — PM2 Production Start                 ║${NC}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${NC}\n"

# ─── Check pm2 installed ──────────────────────────────────────────────────────
command -v pm2 >/dev/null 2>&1 || error "PM2 not found. Install it: npm install -g pm2"

# ─── Create log dirs ──────────────────────────────────────────────────────────
step "📁  Preparing log directories"
mkdir -p "$REPO_ROOT/logs/pm2"
success "Log dir ready: logs/pm2/"

# ─── Install backend deps ──────────────────────────────────────────────────────
step "📦  Installing Backend dependencies"
cd "$REPO_ROOT/backend"
npm install --omit=dev --no-audit --no-fund
success "Backend deps installed"

# ─── Install payment deps ─────────────────────────────────────────────────────
step "📦  Installing Payment Microservice dependencies"
cd "$REPO_ROOT/payment-microservice"
npm install --omit=dev --no-audit --no-fund
success "Payment deps installed"

cd "$REPO_ROOT"

# ─── Start or reload PM2 ─────────────────────────────────────────────────────
step "🚀  Starting services with PM2"

# If already running → reload (zero-downtime), else fresh start
if pm2 list | grep -q "setgo-backend\|setgo-payment"; then
  warn "Services already running — reloading with zero downtime..."
  pm2 reload ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi

success "Services started"

# ─── Save & show status ───────────────────────────────────────────────────────
step "💾  Saving PM2 process list"
pm2 save
success "PM2 list saved (survives server reboot)"

echo ""
pm2 list
echo ""

echo -e "${GREEN}${BOLD}All done! Services are running.${NC}"
echo ""
echo -e "  ${BOLD}Useful commands:${NC}"
echo -e "    pm2 logs                    → live logs (all services)"
echo -e "    pm2 logs setgo-backend      → backend logs only"
echo -e "    pm2 logs setgo-payment      → payment logs only"
echo -e "    pm2 monit                   → live CPU/memory dashboard"
echo -e "    pm2 restart setgo-backend   → restart one service"
echo -e "    pm2 stop all                → stop everything"
echo ""
