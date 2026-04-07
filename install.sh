#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/hipsterreed/clickup-cli"
INSTALL_DIR="${HOME}/.clickup-cli"
MIN_NODE=18

# ── Colors ───────────────────────────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
RESET='\033[0m'

info()    { echo -e "${CYAN}→${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}!${RESET} $*"; }
error()   { echo -e "${RED}✗${RESET} $*" >&2; exit 1; }

# ── Checks ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${CYAN}  ClickUp CLI Installer${RESET}"
echo "  ─────────────────────────────────"
echo ""

# Node.js
if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Install it from https://nodejs.org (v${MIN_NODE}+ required)."
fi

NODE_VERSION=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [[ "${NODE_VERSION}" -lt "${MIN_NODE}" ]]; then
  error "Node.js v${MIN_NODE}+ required (found v${NODE_VERSION}). Upgrade at https://nodejs.org"
fi
success "Node.js v$(node --version) detected"

# npm
if ! command -v npm &>/dev/null; then
  error "npm is not installed. It should come with Node.js."
fi

# git
if ! command -v git &>/dev/null; then
  error "git is not installed. Install it from https://git-scm.com"
fi

# ── Install ───────────────────────────────────────────────────────────────────

if [[ -d "${INSTALL_DIR}" ]]; then
  info "Updating existing installation at ${INSTALL_DIR}..."
  cd "${INSTALL_DIR}"
  git pull --ff-only
else
  info "Cloning to ${INSTALL_DIR}..."
  git clone "${REPO_URL}" "${INSTALL_DIR}"
  cd "${INSTALL_DIR}"
fi

info "Installing dependencies..."
npm install --silent

info "Building..."
npm run build --silent

info "Linking to PATH..."
npm link --silent

echo ""
success "ClickUp CLI installed successfully!"
echo ""
echo -e "  Run ${CYAN}clickup setup${RESET} to get started."
echo -e "  Run ${CYAN}clickup help${RESET} for a full command reference."
echo ""
