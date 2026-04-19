#!/usr/bin/env bash

REPO_URL="https://github.com/hipsterreed/clickup-cli"
INSTALL_DIR="${HOME}/.clickup-cli/repo"
BIN_DIR="${HOME}/.clickup-cli/bin"
MIN_NODE=18

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}→${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
error()   { echo -e "${RED}✗${RESET} $*"; exit 1; }

echo ""
echo -e "${CYAN}${BOLD}  ClickUp CLI Installer${RESET}"
echo "  ─────────────────────────────────"
echo ""

# ── Prerequisites ─────────────────────────────────────────────────────────────

command -v node &>/dev/null || error "Node.js not found. Install from https://nodejs.org (v${MIN_NODE}+ required)."
command -v git  &>/dev/null || error "git not found. Install from https://git-scm.com"

NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
[[ "${NODE_VER}" -ge "${MIN_NODE}" ]] || error "Node.js v${MIN_NODE}+ required (found v${NODE_VER})."
success "Node.js v$(node --version)"

# ── Clone or update ───────────────────────────────────────────────────────────

if [[ -d "${INSTALL_DIR}/.git" ]]; then
  info "Updating..."
  git -C "${INSTALL_DIR}" pull --ff-only
else
  info "Cloning to ${INSTALL_DIR}..."
  git clone "${REPO_URL}" "${INSTALL_DIR}" || error "Clone failed."
fi

# ── Install runtime deps ───────────────────────────────────────────────────────

info "Installing dependencies..."
cd "${INSTALL_DIR}"
npm install --legacy-peer-deps || error "npm install failed."

info "Building..."
npm run build || error "Build failed."

# ── Put clickup on PATH ───────────────────────────────────────────────────────

# Strategy 1: npm link (works great with Homebrew-managed Node)
info "Linking binary..."
npm link --legacy-peer-deps 2>/dev/null

if command -v clickup &>/dev/null; then
  success "clickup linked to $(command -v clickup)"
else
  # Strategy 2: write a wrapper to ~/.clickup-cli/bin/
  info "npm link didn't place clickup on PATH — creating wrapper..."
  mkdir -p "${BIN_DIR}"
  ENTRY="${INSTALL_DIR}/dist/bin/clickup.js"
  chmod +x "${ENTRY}"
  {
    echo '#!/usr/bin/env bash'
    echo "exec node \"${ENTRY}\" \"\$@\""
  } > "${BIN_DIR}/clickup"
  chmod +x "${BIN_DIR}/clickup"
  success "Wrapper created at ${BIN_DIR}/clickup"

  # Write PATH export to shell profile
  if [[ "${SHELL}" == */zsh ]]; then
    PROFILE="${HOME}/.zshrc"
  elif [[ -f "${HOME}/.bash_profile" ]]; then
    PROFILE="${HOME}/.bash_profile"
  else
    PROFILE="${HOME}/.bashrc"
  fi

  LINE="export PATH=\"\$HOME/.clickup-cli/bin:\$PATH\""
  if ! grep -qF '.clickup-cli/bin' "${PROFILE}" 2>/dev/null; then
    echo "" >> "${PROFILE}"
    echo "# clickup-cli" >> "${PROFILE}"
    echo "${LINE}" >> "${PROFILE}"
    info "Added PATH export to ${PROFILE}"
  fi

  echo ""
  echo -e "  ${BOLD}Run this now to activate clickup:${RESET}"
  echo ""
  echo -e "  ${CYAN}export PATH=\"\$HOME/.clickup-cli/bin:\$PATH\"${RESET}"
  echo ""
fi

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}${BOLD}  ✓ ClickUp CLI installed!${RESET}"
echo ""
echo -e "  ${CYAN}clickup setup${RESET}   — connect your ClickUp account"
echo -e "  ${CYAN}clickup help${RESET}    — see all commands"
echo ""
