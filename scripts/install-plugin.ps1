# WhytCard Intelligence - Install script for Cursor
# Copies plugin to ~/.cursor/plugins/ and installs global Cursor assets.
# Optional: also synchronize plugin-managed assets into a project's local `.cursor/`.

param(
  [string]$ProjectRoot = ""
)

$ErrorActionPreference = "Stop"
$PluginName = "whytcard-intelligence"

$RepoRoot = $PSScriptRoot | Split-Path -Parent
$TargetDir = Join-Path $env:USERPROFILE ".cursor\plugins\$PluginName"
$CursorCommandsDir = Join-Path $env:USERPROFILE ".cursor\commands"
$CursorSkillsDir = Join-Path $env:USERPROFILE ".cursor\skills"
$CursorAgentsDir = Join-Path $env:USERPROFILE ".cursor\agents"
$CursorRulesDir = Join-Path $env:USERPROFILE ".cursor\rules"
$CursorHooksPath = Join-Path $env:USERPROFILE ".cursor\hooks.json"
$LegacyCursorPluginDir = Join-Path $env:USERPROFILE ".cursor\plugins\whytcardAI-plugin"

$DirsToCopy = @(".cursor-plugin", "agents", "commands", "rules", "skills", "hooks", "scripts", "AGENTS.md", "INSTALL.md", "README.md", "LICENSE")

function Sync-PluginItem {
  param(
    [Parameter(Mandatory = $true)][string]$SourcePath,
    [Parameter(Mandatory = $true)][string]$TargetRoot
  )

  $leaf = Split-Path $SourcePath -Leaf
  $destinationPath = Join-Path $TargetRoot $leaf

  if (Test-Path $destinationPath) {
    try {
      Remove-Item -Recurse -Force $destinationPath
    } catch {
      Write-Host "  ! Could not clear existing target item ($leaf). Will try overwrite-in-place." -ForegroundColor Yellow
    }
  }

  if (Test-Path $SourcePath -PathType Container) {
    Copy-Item $SourcePath $TargetRoot -Recurse -Force
  } else {
    Copy-Item $SourcePath $TargetRoot -Force
  }
}

Write-Host "WhytCard Intelligence - Installation" -ForegroundColor Cyan
Write-Host "Source: $RepoRoot" -ForegroundColor Gray
Write-Host "Target: $TargetDir" -ForegroundColor Gray
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js must be available in PATH. The plugin is standalone at the package level (no npm install, no extra plugin, no MCP), but Cursor hook commands still execute via node."
}

Write-Host "[0/4] Cleaning legacy conflicting installs..." -ForegroundColor Yellow

if (Test-Path $LegacyCursorPluginDir) {
  Remove-Item -Recurse -Force $LegacyCursorPluginDir
  Write-Host "  - Removed legacy plugin folder: $LegacyCursorPluginDir" -ForegroundColor Green
}

Write-Host ""

Write-Host "[1/4] Copying plugin files..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null

foreach ($item in $DirsToCopy) {
    $src = Join-Path $RepoRoot $item
    if (Test-Path $src) {
        Sync-PluginItem -SourcePath $src -TargetRoot $TargetDir
        Write-Host "  + $item" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[1b/4] Installing Cursor commands + skills + agents..." -ForegroundColor Yellow

# Global Cursor commands (guaranteed discovery by Cursor)
New-Item -ItemType Directory -Path $CursorCommandsDir -Force | Out-Null
$CmdSrcDir = Join-Path $RepoRoot "commands"
if (Test-Path $CmdSrcDir) {
  Copy-Item (Join-Path $CmdSrcDir "*.md") $CursorCommandsDir -Force
  Write-Host "  OK: Cursor commands installed to $CursorCommandsDir" -ForegroundColor Green
} else {
  Write-Host "  WARN: commands/ missing in repo; skipping global commands install" -ForegroundColor Yellow
}

# Global Cursor skills (guaranteed /wi-* availability)
New-Item -ItemType Directory -Path $CursorSkillsDir -Force | Out-Null
$SkillsSrcDir = Join-Path $RepoRoot "skills"
if (Test-Path $SkillsSrcDir) {
  Get-ChildItem -Path $SkillsSrcDir -Directory | ForEach-Object {
    $name = $_.Name
    $dst = Join-Path $CursorSkillsDir $name
    if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
    Copy-Item $_.FullName $dst -Recurse -Force
  }
  Write-Host "  OK: Cursor skills installed to $CursorSkillsDir" -ForegroundColor Green
} else {
  Write-Host "  WARN: skills/ missing in repo; skipping global skills install" -ForegroundColor Yellow
}

# Global Cursor agents (guaranteed explicit delegation targets)
New-Item -ItemType Directory -Path $CursorAgentsDir -Force | Out-Null
$AgentsSrcDir = Join-Path $RepoRoot "agents"
if (Test-Path $AgentsSrcDir) {
  Get-ChildItem -Path $CursorAgentsDir -Filter "whytcard-*.md" -File -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Force $_.FullName
    Write-Host "  - Removed legacy agent: $($_.Name)" -ForegroundColor Green
  }
  Copy-Item (Join-Path $AgentsSrcDir "*.md") $CursorAgentsDir -Force
  Write-Host "  OK: Cursor agents installed to $CursorAgentsDir" -ForegroundColor Green
} else {
  Write-Host "  WARN: agents/ missing in repo; skipping global agents install" -ForegroundColor Yellow
}

# Optional: global Cursor rules (visible in Cursor Settings → Rules)
New-Item -ItemType Directory -Path $CursorRulesDir -Force | Out-Null
$RulesSrcDir = Join-Path $RepoRoot "rules"
if (Test-Path $RulesSrcDir) {
  Get-ChildItem -Path $CursorRulesDir -Filter "wc-*.mdc" -File -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Force $_.FullName
    Write-Host "  - Removed legacy rule: $($_.Name)" -ForegroundColor Green
  }
  $legacyGlobalRule = Join-Path $CursorRulesDir "plugins-orchestrator-global.mdc"
  if (Test-Path $legacyGlobalRule) {
    Remove-Item -Force $legacyGlobalRule
    Write-Host "  - Removed legacy global orchestrator rule: plugins-orchestrator-global.mdc" -ForegroundColor Green
  }
  Copy-Item (Join-Path $RulesSrcDir "*.mdc") $CursorRulesDir -Force
  Write-Host "  OK: Cursor rules installed to $CursorRulesDir" -ForegroundColor Green
} else {
  Write-Host "  WARN: rules/ missing in repo; skipping global rules install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2/4] Installing global Cursor hooks..." -ForegroundColor Yellow
$cursorHooksMerge = Join-Path (Join-Path $RepoRoot "scripts") "install-cursor-hooks-merge.js"
node $cursorHooksMerge $CursorHooksPath $PluginName $TargetDir
if ($LASTEXITCODE -ne 0) { throw "Cursor hooks merge failed" }
Write-Host "  OK: Cursor hooks merged into $CursorHooksPath" -ForegroundColor Green

Write-Host "[3/4] Validating merged Cursor hooks..." -ForegroundColor Yellow
$cursorHooksValidate = Join-Path (Join-Path $RepoRoot "scripts") "validate-cursor-hooks.js"
node $cursorHooksValidate $CursorHooksPath
if ($LASTEXITCODE -ne 0) { throw "Cursor hooks validation failed" }
Write-Host "  OK: Cursor hooks validation passed" -ForegroundColor Green

if ($ProjectRoot) {
  Write-Host "[4/4] Syncing project-local .cursor assets..." -ForegroundColor Yellow
  $syncProjectCursor = Join-Path (Join-Path $RepoRoot "scripts") "sync-project-cursor.js"
  node $syncProjectCursor $ProjectRoot
  if ($LASTEXITCODE -ne 0) { throw "Project-local .cursor sync failed" }
  Write-Host "  OK: Project-local .cursor synced for $ProjectRoot" -ForegroundColor Green
}

Write-Host ""
Write-Host "Installation complete." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Restart Cursor (or Reload Window: Ctrl+Shift+P)" -ForegroundColor Gray
Write-Host "  2. Commands /wi-whytcard, /wi-create-step, /wi-dispatch-step, /wi-review-step, /wi-create-agent should appear" -ForegroundColor Gray
Write-Host "     (Global hooks are installed via ~/.cursor/hooks.json)" -ForegroundColor Gray
if ($ProjectRoot) {
  Write-Host "  3. Project-local instructions/rules/assets were also synced into .cursor/" -ForegroundColor Gray
  Write-Host "     (Project-level active hooks are still intentionally not auto-enabled)" -ForegroundColor Gray
  Write-Host "  4. WhytCard agents /whytcard-* should be available for delegation" -ForegroundColor Gray
} else {
  Write-Host "  3. WhytCard agents /whytcard-* should be available for delegation" -ForegroundColor Gray
}
Write-Host ""
