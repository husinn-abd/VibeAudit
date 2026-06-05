[CmdletBinding()]
param(
  [switch]$CheckOnly,
  [switch]$SkipInstall,
  [switch]$SkipBuild,
  [switch]$SkipMockScan
)

$ErrorActionPreference = "Stop"
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -Scope Global -ErrorAction SilentlyContinue) {
  $Global:PSNativeCommandUseErrorActionPreference = $false
}
$PnpmVersion = "10.24.0"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Set-Location $RepoRoot

function Write-Section {
  param([string]$Message)
  Write-Host ""
  Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Write-Ok {
  param([string]$Message)
  Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-WarnLine {
  param([string]$Message)
  Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Stop-WithSolution {
  param(
    [string]$Message,
    [string[]]$Solutions,
    [int]$ExitCode = 1
  )

  Write-Host ""
  Write-Host "[FAILED] $Message" -ForegroundColor Red
  Write-Host ""
  Write-Host "Try this:" -ForegroundColor Yellow
  foreach ($solution in $Solutions) {
    Write-Host "  - $solution"
  }
  exit $ExitCode
}

function Require-Command {
  param(
    [string]$Name,
    [string[]]$Solutions
  )

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    Stop-WithSolution "$Name was not found." $Solutions 127
  }

  Write-Ok "$Name found at $($command.Source)"
}

function Invoke-Step {
  param(
    [string]$Name,
    [string]$Command,
    [string[]]$Arguments,
    [string[]]$Solutions
  )

  Write-Section $Name
  Write-Host "> $Command $($Arguments -join ' ')"
  & $Command @Arguments
  $exitCode = $LASTEXITCODE

  if ($exitCode -ne 0) {
    Stop-WithSolution "$Name failed with exit code $exitCode." $Solutions $exitCode
  }

  Write-Ok "$Name completed"
}

function Get-NodeMajor {
  $raw = (& node --version) 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $raw) {
    return $null
  }

  $majorText = $raw.Trim().TrimStart("v").Split(".")[0]
  $major = 0
  if ([int]::TryParse($majorText, [ref]$major)) {
    return $major
  }

  return $null
}

Write-Section "VibeAudit quickstart"
Write-Host "Repo: $RepoRoot"

if (-not (Test-Path ".\package.json")) {
  Stop-WithSolution "package.json was not found in $RepoRoot." @(
    "Clone the repository first: git clone https://github.com/husinn-abd/VibeAudit.git `$env:USERPROFILE\VibeAudit",
    "Then enter it: Set-Location `$env:USERPROFILE\VibeAudit",
    "Run this script again: powershell -ExecutionPolicy Bypass -File .\scripts\quickstart.ps1"
  )
}

if (-not (Test-Path ".\pnpm-workspace.yaml")) {
  Stop-WithSolution "pnpm-workspace.yaml was not found, so this is not the monorepo root." @(
    "Run from the VibeAudit repository root.",
    "If you are inside apps or packages, run: Set-Location ..\.."
  )
}

Write-Section "Dependency preflight"
Require-Command "git" @(
  "Install Git for Windows from https://git-scm.com/download/win",
  "Close and reopen PowerShell after installing Git.",
  "Confirm with: git --version"
)

Require-Command "node" @(
  "Install Node.js 20 LTS or newer from https://nodejs.org/",
  "Close and reopen PowerShell after installing Node.js.",
  "Confirm with: node --version"
)

Require-Command "corepack" @(
  "Install Node.js 20 LTS or newer; Corepack ships with Node.js.",
  "If Corepack exists but is blocked, try: corepack enable",
  "If PowerShell policy blocks shims, run this script with: powershell -ExecutionPolicy Bypass -File .\scripts\quickstart.ps1"
)

$nodeMajor = Get-NodeMajor
if ($null -eq $nodeMajor) {
  Stop-WithSolution "Unable to read the Node.js version." @(
    "Run: node --version",
    "Install Node.js 20 LTS or newer if the command fails.",
    "Close and reopen PowerShell after installing Node.js."
  )
}

if ($nodeMajor -lt 20) {
  Write-WarnLine "Node.js major version is $nodeMajor. VibeAudit is tested with Node.js 20+."
  Write-Host "Recommended fix: install Node.js 20 LTS or newer from https://nodejs.org/"
} else {
  Write-Ok "Node.js major version $nodeMajor is supported"
}

Write-Section "pnpm via Corepack"
& corepack pnpm --version
if ($LASTEXITCODE -ne 0) {
  Write-WarnLine "corepack pnpm is not ready. Trying to activate pnpm $PnpmVersion."
  & corepack prepare "pnpm@$PnpmVersion" --activate
  if ($LASTEXITCODE -ne 0) {
    Stop-WithSolution "Corepack could not activate pnpm $PnpmVersion." @(
      "Confirm internet access to the npm registry.",
      "Run manually: corepack prepare pnpm@$PnpmVersion --activate",
      "If Corepack is unavailable, install Node.js 20 LTS or newer, then reopen PowerShell."
    )
  }
}

$pnpmVersionOutput = (& corepack pnpm --version) 2>$null
if ($LASTEXITCODE -ne 0 -or -not $pnpmVersionOutput) {
  Stop-WithSolution "pnpm still could not start through Corepack." @(
    "Run manually: corepack prepare pnpm@$PnpmVersion --activate",
    "Then run: corepack pnpm --version",
    "If it still fails, reinstall Node.js 20 LTS or newer."
  )
}
Write-Ok "pnpm $pnpmVersionOutput is ready"

$docker = Get-Command "docker" -ErrorAction SilentlyContinue
if ($docker) {
  Write-Ok "Docker found at $($docker.Source)"
} else {
  Write-WarnLine "Docker was not found. Mock quickstart still works; real Semgrep/Gitleaks/Trivy scanning needs Docker Desktop."
}

Write-Section "Environment file"
if (-not (Test-Path ".\.env")) {
  if (-not (Test-Path ".\.env.example")) {
    Stop-WithSolution ".env.example was not found." @(
      "Run: git pull --ff-only",
      "If the file is still missing, reclone the repo."
    )
  }

  Copy-Item ".\.env.example" ".\.env"
  Write-Ok "Created .env from .env.example"
} else {
  Write-Ok ".env already exists"
}

if ($CheckOnly) {
  Write-Section "Check only complete"
  Write-Host "Dependencies look ready. Rerun without -CheckOnly to install and validate the repo."
  exit 0
}

if (-not $SkipInstall) {
  Invoke-Step "Install project dependencies" "corepack" @("pnpm", "install") @(
    "Confirm internet access to https://registry.npmjs.org/ or your configured npm mirror.",
    "Confirm Node.js is 20 or newer: node --version",
    "Activate pnpm manually: corepack prepare pnpm@$PnpmVersion --activate",
    "If node_modules is corrupted, close dev servers, run: Remove-Item -Recurse -Force node_modules",
    "Then rerun: powershell -ExecutionPolicy Bypass -File .\scripts\quickstart.ps1"
  )
} else {
  Write-WarnLine "Skipped dependency install because -SkipInstall was passed."
}

Invoke-Step "Typecheck" "corepack" @("pnpm", "typecheck") @(
  "Run dependency install again: corepack pnpm install",
  "Pull the latest public repo: git pull --ff-only",
  "If you have local edits, inspect them with: git status -sb"
)

Invoke-Step "Unit tests" "corepack" @("pnpm", "test") @(
  "Read the first failing test in the output above.",
  "Rerun only tests: corepack pnpm test",
  "If dependencies changed, rerun: corepack pnpm install"
)

if (-not $SkipBuild) {
  Invoke-Step "Production build" "corepack" @("pnpm", "build") @(
    "Run typecheck first: corepack pnpm typecheck",
    "If Vite or TypeScript cannot be found, rerun: corepack pnpm install",
    "If a port warning appears, close the old dev server and rerun."
  )
} else {
  Write-WarnLine "Skipped production build because -SkipBuild was passed."
}

if (-not $SkipMockScan) {
  Invoke-Step "Mock scan demo" "corepack" @("pnpm", "--filter", "@vibeaudit/runner", "scan:mock:demo") @(
    "Confirm artifacts can be written: Test-Path .\artifacts",
    "Rerun the scan only: corepack pnpm --filter @vibeaudit/runner scan:mock:demo",
    "If runner dependencies are missing, rerun: corepack pnpm install"
  )
} else {
  Write-WarnLine "Skipped mock scan because -SkipMockScan was passed."
}

Write-Section "Quickstart complete"
Write-Ok "VibeAudit installed, checked, built, and mock-scanned successfully."
Write-Host ""
Write-Host "Open the dashboard locally:"
Write-Host "  corepack pnpm --filter @vibeaudit/web dev"
Write-Host "  http://localhost:5173"
