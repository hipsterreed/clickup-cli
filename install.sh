#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/hipsterreed/clickup-cli"
INSTALL_DIR="${HOME}/.clickup-cli"
MIN_NODE=18

# ── Colors ───────────────────────────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}→${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}!${RESET} $*"; }
error()   { echo -e "\033[0;31m✗${RESET} $*" >&2; exit 1; }

# ── Checks ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${CYAN}${BOLD}  ClickUp CLI Installer${RESET}"
echo "  ─────────────────────────────────"
echo ""

if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Install it from https://nodejs.org (v${MIN_NODE}+ required)."
fi

NODE_VERSION=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [[ "${NODE_VERSION}" -lt "${MIN_NODE}" ]]; then
  error "Node.js v${MIN_NODE}+ required (found v${NODE_VERSION}). Upgrade at https://nodejs.org"
fi
success "Node.js v$(node --version) detected"

if ! command -v npm &>/dev/null; then
  error "npm is not installed. It should come with Node.js."
fi

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

# Make the binary executable
chmod +x "${INSTALL_DIR}/dist/bin/clickup.js"

# ── PATH setup ────────────────────────────────────────────────────────────────

NPM_BIN="$(npm prefix -g)/bin"
EXPORT_LINE="export PATH=\"${NPM_BIN}:\$PATH\""

# Detect shell profile
if [[ -n "${ZSH_VERSION:-}" ]] || [[ "${SHELL}" == */zsh ]]; then
  SHELL_PROFILE="${HOME}/.zshrc"
elif [[ -n "${BASH_VERSION:-}" ]] || [[ "${SHELL}" == */bash ]]; then
  if [[ -f "${HOME}/.bash_profile" ]]; then
    SHELL_PROFILE="${HOME}/.bash_profile"
  else
    SHELL_PROFILE="${HOME}/.bashrc"
  fi
else
  SHELL_PROFILE="${HOME}/.profile"
fi

info "Linking to PATH..."
npm link --silent 2>/dev/null || true

# Always ensure the PATH export is in the profile (idempotent)
if ! grep -qF "${NPM_BIN}" "${SHELL_PROFILE}" 2>/dev/null; then
  echo "" >> "${SHELL_PROFILE}"
  echo "# clickup-cli" >> "${SHELL_PROFILE}"
  echo "${EXPORT_LINE}" >> "${SHELL_PROFILE}"
fi

# Apply to current session too
export PATH="${NPM_BIN}:${PATH}"

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}${BOLD}  ✓ ClickUp CLI installed!${RESET}"
echo ""
echo -e "  To start using it, run:"
echo ""
echo -e "  ${BOLD}source ${SHELL_PROFILE}${RESET}"
echo ""
echo -e "  Then:"
echo -e "  ${CYAN}clickup setup${RESET}   — connect your ClickUp account"
echo -e "  ${CYAN}clickup help${RESET}    — see all commands"
echo ""
