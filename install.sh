#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/hipsterreed/clickup-cli"
INSTALL_DIR="${HOME}/.clickup-cli/repo"
BIN_DIR="${HOME}/.clickup-cli/bin"
BIN_PATH="${BIN_DIR}/clickup"
MIN_NODE=18

# ── Colors ───────────────────────────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}→${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
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

if ! command -v git &>/dev/null; then
  error "git is not installed. Install it from https://git-scm.com"
fi

# ── Clone or update ───────────────────────────────────────────────────────────

if [[ -d "${INSTALL_DIR}/.git" ]]; then
  info "Updating existing installation..."
  cd "${INSTALL_DIR}"
  git pull --ff-only
else
  info "Installing to ${INSTALL_DIR}..."
  git clone "${REPO_URL}" "${INSTALL_DIR}"
  cd "${INSTALL_DIR}"
fi

info "Installing dependencies..."
npm install --omit=dev --legacy-peer-deps --silent

# ── Create bin wrapper ────────────────────────────────────────────────────────

mkdir -p "${BIN_DIR}"

ENTRY="${INSTALL_DIR}/dist/bin/clickup.js"
chmod +x "${ENTRY}"

printf '#!/usr/bin/env bash\nexec node "%s" "$@"\n' "${ENTRY}" > "${BIN_PATH}"
chmod +x "${BIN_PATH}"

success "Binary ready at ${BIN_PATH}"

# ── Shell profile PATH setup ──────────────────────────────────────────────────

# Detect shell profile
if [[ "${SHELL}" == */zsh ]]; then
  SHELL_PROFILE="${HOME}/.zshrc"
elif [[ -f "${HOME}/.bash_profile" ]]; then
  SHELL_PROFILE="${HOME}/.bash_profile"
else
  SHELL_PROFILE="${HOME}/.bashrc"
fi

EXPORT_LINE="export PATH=\"\$HOME/.clickup-cli/bin:\$PATH\""

if ! grep -qF '.clickup-cli/bin' "${SHELL_PROFILE}" 2>/dev/null; then
  echo "" >> "${SHELL_PROFILE}"
  echo "# clickup-cli" >> "${SHELL_PROFILE}"
  echo "${EXPORT_LINE}" >> "${SHELL_PROFILE}"
fi

# Apply to current session
export PATH="${BIN_DIR}:${PATH}"

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}${BOLD}  ✓ ClickUp CLI installed successfully!${RESET}"
echo ""
echo -e "  ${CYAN}clickup setup${RESET}   — connect your ClickUp account"
echo -e "  ${CYAN}clickup help${RESET}    — see all commands"
echo ""
