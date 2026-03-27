#!/usr/bin/env bash
# =============================================================================
#  SetGo — Production Build & Deploy Script
#  Usage: bash scripts/deploy-production.sh [branch-suffix]
#  Example: bash scripts/deploy-production.sh hotfix-1
# =============================================================================

set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ─── Config ───────────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
BRANCH_SUFFIX="${1:-}"
PROD_BRANCH="production/${TIMESTAMP}${BRANCH_SUFFIX:+-$BRANCH_SUFFIX}"
SOURCE_BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"
COMMIT_SHA="$(git -C "$REPO_ROOT" rev-parse --short HEAD)"

FRONTEND_DIR="$REPO_ROOT/Frontend"
BACKEND_DIR="$REPO_ROOT/backend"
PAYMENT_DIR="$REPO_ROOT/payment-microservice"

# ─── Helpers ─────────────────────────────────────────────────────────────────
log()     { echo -e "${BOLD}${BLUE}[DEPLOY]${NC} $*"; }
success() { echo -e "${GREEN}✔  $*${NC}"; }
warn()    { echo -e "${YELLOW}⚠  $*${NC}"; }
error()   { echo -e "${RED}✖  $*${NC}"; exit 1; }
step()    { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BOLD}$*${NC}"; }

# ─── Preflight Checks ────────────────────────────────────────────────────────
preflight() {
  step "🔍  Pre-flight checks"

  command -v git  >/dev/null 2>&1 || error "git is not installed"
  command -v node >/dev/null 2>&1 || error "node is not installed"
  command -v npm  >/dev/null 2>&1 || error "npm is not installed"

  # Must be run from inside the repo
  git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    || error "Not inside a git repository: $REPO_ROOT"

  # Working tree must be clean (no uncommitted changes)
  if ! git -C "$REPO_ROOT" diff --quiet || ! git -C "$REPO_ROOT" diff --cached --quiet; then
    warn "Working tree has uncommitted changes."
    read -r -p "  Continue anyway? Changes won't be included. (y/N): " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || error "Aborted. Please commit or stash your changes first."
  fi

  # Check required dirs exist
  [[ -d "$FRONTEND_DIR" ]]  || error "Frontend directory not found: $FRONTEND_DIR"
  [[ -d "$BACKEND_DIR" ]]   || error "Backend directory not found: $BACKEND_DIR"
  [[ -d "$PAYMENT_DIR" ]]   || error "Payment directory not found: $PAYMENT_DIR"

  # Check remote reachable (non-fatal — offline builds still work locally)
  if ! git -C "$REPO_ROOT" ls-remote origin HEAD >/dev/null 2>&1; then
    warn "Cannot reach remote 'origin'. Build will run but push will be skipped."
    SKIP_PUSH=true
  else
    SKIP_PUSH=false
  fi

  success "All checks passed  |  source: ${SOURCE_BRANCH}  |  commit: ${COMMIT_SHA}"
}

# ─── Build Frontend ──────────────────────────────────────────────────────────
build_frontend() {
  step "⚡  Building Frontend (Vite/React)"

  cd "$FRONTEND_DIR"

  # Install deps if node_modules is missing or package.json is newer
  if [[ ! -d node_modules ]] || [[ package.json -nt node_modules/.package-lock.json ]]; then
    log "Installing frontend dependencies..."
    npm install --no-audit --no-fund
  fi

  log "Running vite build..."
  npm run build

  # Verify dist was created
  [[ -d "$FRONTEND_DIR/dist" ]] || error "Frontend build failed — dist/ not created"
  local size
  size=$(du -sh "$FRONTEND_DIR/dist" 2>/dev/null | cut -f1)
  success "Frontend built successfully  (dist/ ≈ ${size})"

  cd "$REPO_ROOT"
}

# ─── Validate Backend ────────────────────────────────────────────────────────
validate_backend() {
  step "🔧  Validating Backend (Node.js)"

  cd "$BACKEND_DIR"

  # Quick syntax check on the entry point
  if [[ -f "server.js" ]]; then
    node --check server.js && success "server.js syntax OK"
  elif [[ -f "index.js" ]]; then
    node --check index.js && success "index.js syntax OK"
  else
    warn "No entry point found — skipping syntax check"
  fi

  cd "$REPO_ROOT"
}

# ─── Validate Payment Microservice ───────────────────────────────────────────
validate_payment() {
  step "💳  Validating Payment Microservice (Node.js)"

  cd "$PAYMENT_DIR"

  if [[ -f "src/app.js" ]]; then
    node --check src/app.js && success "src/app.js syntax OK"
  else
    warn "No entry point found — skipping syntax check"
  fi

  cd "$REPO_ROOT"
}

# ─── Create Production Branch ────────────────────────────────────────────────
create_branch() {
  step "🌿  Creating production branch: ${PROD_BRANCH}"

  git -C "$REPO_ROOT" checkout -b "$PROD_BRANCH"
  success "Branch created: $PROD_BRANCH"
}

# ─── Stage All Artifacts ─────────────────────────────────────────────────────
stage_artifacts() {
  step "📦  Staging build artifacts"

  cd "$REPO_ROOT"

  # Stage everything tracked (source files, config, etc.)
  git add --all

  # Force-add Frontend/dist/ — it's in .gitignore but we WANT it on production branch
  log "Force-adding Frontend/dist/ (bypassing .gitignore)..."
  git add -f Frontend/dist/

  # Show what's staged
  echo ""
  log "Staged files summary:"
  git diff --cached --stat | tail -5
  echo "  ..."
  git diff --cached --stat | tail -1

  success "Artifacts staged"
}

# ─── Commit ──────────────────────────────────────────────────────────────────
create_commit() {
  step "💾  Committing"

  local msg="chore(deploy): production build ${TIMESTAMP}

Source branch : ${SOURCE_BRANCH}
Source commit : ${COMMIT_SHA}
Build time    : $(date '+%Y-%m-%d %H:%M:%S')

Services included:
  - Frontend (Vite/React) — pre-built dist/ included
  - Backend (Node.js)     — source, run: npm install && npm start
  - Payment Microservice  — source, run: npm install && npm start"

  git -C "$REPO_ROOT" commit -m "$msg"
  success "Committed"
}

# ─── Push to Remote ──────────────────────────────────────────────────────────
push_branch() {
  step "🚀  Pushing to remote"

  if [[ "${SKIP_PUSH:-false}" == "true" ]]; then
    warn "Skipping push — remote unreachable"
    return
  fi

  git -C "$REPO_ROOT" push -u origin "$PROD_BRANCH"
  success "Pushed to origin/${PROD_BRANCH}"
}

# ─── Cleanup: return to source branch ────────────────────────────────────────
cleanup() {
  step "🔄  Switching back to ${SOURCE_BRANCH}"
  git -C "$REPO_ROOT" checkout "$SOURCE_BRANCH"
  success "Back on ${SOURCE_BRANCH}"
}

# ─── Summary ─────────────────────────────────────────────────────────────────
print_summary() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║           PRODUCTION DEPLOY — COMPLETE               ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}Branch   :${NC} ${PROD_BRANCH}"
  echo -e "  ${BOLD}From     :${NC} ${SOURCE_BRANCH} @ ${COMMIT_SHA}"
  echo -e "  ${BOLD}Built at :${NC} $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  echo -e "  ${BOLD}Next steps on your server:${NC}"
  echo -e "    git pull origin ${PROD_BRANCH}"
  echo -e "    cd Frontend  && serve -s dist        # or nginx/apache"
  echo -e "    cd backend            && npm install --production && npm start"
  echo -e "    cd payment-microservice && npm install --production && npm start"
  echo ""
}

# ─── Trap for cleanup on error ───────────────────────────────────────────────
on_error() {
  echo ""
  error "Deploy script failed on line $1. Attempting to restore branch..."
  git -C "$REPO_ROOT" checkout "$SOURCE_BRANCH" 2>/dev/null || true
}
trap 'on_error $LINENO' ERR

# ─── Main ─────────────────────────────────────────────────────────────────────
main() {
  echo ""
  echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}${BLUE}║         SetGo — Production Deploy Script             ║${NC}"
  echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
  echo ""

  preflight
  build_frontend
  validate_backend
  validate_payment
  create_branch
  stage_artifacts
  create_commit
  push_branch
  cleanup
  print_summary
}

main "$@"
