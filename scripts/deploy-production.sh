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
NC='\033[0m'

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

  git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    || error "Not inside a git repository: $REPO_ROOT"

  # ── GUARD: untracked files check ─────────────────────────────────────────
  # Untracked files get committed to the production branch via `git add --all`.
  # When the script switches back to the source branch, git removes those files
  # because the source branch doesn't know about them. Force-commit them first.
  UNTRACKED="$(git -C "$REPO_ROOT" ls-files --others --exclude-standard)"
  if [[ -n "$UNTRACKED" ]]; then
    echo ""
    warn "You have untracked files that are NOT committed to '${SOURCE_BRANCH}':"
    echo "$UNTRACKED" | sed 's/^/    /'
    echo ""
    warn "If you continue, these files will be LOST from your working directory"
    warn "after the script switches back to '${SOURCE_BRANCH}'."
    echo ""
    echo -e "  ${BOLD}Recommended fix:${NC}"
    echo -e "    git add <files>"
    echo -e "    git commit -m 'your message'"
    echo -e "  Then re-run this script."
    echo ""
    read -r -p "  Understood — continue anyway and lose those files? (y/N): " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || error "Aborted. Commit your untracked files first."
  fi

  # ── Staged but uncommitted changes check ─────────────────────────────────
  if ! git -C "$REPO_ROOT" diff --quiet || ! git -C "$REPO_ROOT" diff --cached --quiet; then
    warn "Working tree has uncommitted changes — they won't be included in the build."
    read -r -p "  Continue anyway? (y/N): " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || error "Aborted. Please commit or stash your changes first."
  fi

  [[ -d "$FRONTEND_DIR" ]]  || error "Frontend directory not found: $FRONTEND_DIR"
  [[ -d "$BACKEND_DIR" ]]   || error "Backend directory not found: $BACKEND_DIR"
  [[ -d "$PAYMENT_DIR" ]]   || error "Payment directory not found: $PAYMENT_DIR"

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

  if [[ ! -d node_modules ]] || [[ package.json -nt node_modules/.package-lock.json ]]; then
    log "Installing frontend dependencies..."
    npm install --no-audit --no-fund
  fi

  log "Running vite build..."
  npm run build

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
  local entry="index.js"
  [[ -f "server.js" ]] && entry="server.js"
  node --check "$entry" && success "Backend $entry syntax OK"

  cd "$REPO_ROOT"
}

# ─── Validate Payment Microservice ───────────────────────────────────────────
validate_payment() {
  step "💳  Validating Payment Microservice (Node.js)"

  cd "$PAYMENT_DIR"
  node --check src/app.js && success "src/app.js syntax OK"

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

  git add --all
  log "Force-adding Frontend/dist/ (bypassing .gitignore)..."
  git add -f Frontend/dist/

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

# ─── Return to source branch ─────────────────────────────────────────────────
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
  echo -e "  ${BOLD}On your server:${NC}"
  echo -e "    git pull origin ${PROD_BRANCH}"
  echo -e "    bash scripts/pm2-start.sh"
  echo ""
}

# ─── Trap for cleanup on error ───────────────────────────────────────────────
on_error() {
  echo ""
  error "Deploy failed on line $1 — restoring branch..."
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
