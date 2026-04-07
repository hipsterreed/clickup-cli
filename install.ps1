# ClickUp CLI Installer — Windows PowerShell
# Run with: irm https://raw.githubusercontent.com/YOUR_USERNAME/clickup-cli/main/install.ps1 | iex

$ErrorActionPreference = 'Stop'

$RepoUrl   = 'https://github.com/hipsterreed/clickup-cli'
$InstallDir = "$env:LOCALAPPDATA\clickup-cli"
$MinNode   = 18

function Info    ($msg) { Write-Host "→ $msg" -ForegroundColor Cyan }
function Success ($msg) { Write-Host "✓ $msg" -ForegroundColor Green }
function Warn    ($msg) { Write-Host "! $msg" -ForegroundColor Yellow }
function Fail    ($msg) { Write-Host "✗ $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "  ClickUp CLI Installer" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────"
Write-Host ""

# ── Check Node.js ─────────────────────────────────────────────────────────────

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Fail "Node.js is not installed. Download it from https://nodejs.org (v$MinNode+ required)."
}

$nodeVersion = [int](node -e "process.stdout.write(process.versions.node.split('.')[0])")
if ($nodeVersion -lt $MinNode) {
    Fail "Node.js v$MinNode+ required (found v$nodeVersion). Upgrade at https://nodejs.org"
}
Success "Node.js $(node --version) detected"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Fail "npm is not installed. It should come with Node.js."
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Fail "git is not installed. Download from https://git-scm.com"
}

# ── Clone or update ───────────────────────────────────────────────────────────

if (Test-Path $InstallDir) {
    Info "Updating existing installation at $InstallDir..."
    Push-Location $InstallDir
    git pull --ff-only
} else {
    Info "Cloning to $InstallDir..."
    git clone $RepoUrl $InstallDir
    Push-Location $InstallDir
}

# ── Build ─────────────────────────────────────────────────────────────────────

Info "Installing dependencies..."
npm install --silent

Info "Building..."
npm run build --silent

Info "Linking to PATH..."
npm link --silent

Pop-Location

Write-Host ""
Success "ClickUp CLI installed successfully!"
Write-Host ""
Write-Host "  Run " -NoNewline
Write-Host "clickup setup" -ForegroundColor Cyan -NoNewline
Write-Host " to get started."
Write-Host "  Run " -NoNewline
Write-Host "clickup help" -ForegroundColor Cyan -NoNewline
Write-Host " for a full command reference."
Write-Host ""
