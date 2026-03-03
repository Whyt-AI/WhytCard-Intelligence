# WhytCard Intelligence - Install script for Cursor and Claude Code
# Copies plugin to ~/.cursor/plugins/ and registers in ~/.claude/

$ErrorActionPreference = "Stop"
$PluginName = "whytcard-intelligence"
$PluginId = "${PluginName}@local"

$RepoRoot = $PSScriptRoot | Split-Path -Parent
$TargetDir = Join-Path $env:USERPROFILE ".cursor\plugins\$PluginName"
$CursorCommandsDir = Join-Path $env:USERPROFILE ".cursor\commands"
$CursorSkillsDir = Join-Path $env:USERPROFILE ".cursor\skills"
$CursorRulesDir = Join-Path $env:USERPROFILE ".cursor\rules"
$ClaudePluginsDir = Join-Path $env:USERPROFILE ".claude\plugins"
$InstalledPluginsPath = Join-Path $ClaudePluginsDir "installed_plugins.json"
$SettingsPath = Join-Path $env:USERPROFILE ".claude\settings.json"

$DirsToCopy = @(".cursor-plugin", ".claude-plugin", "commands", "rules", "skills", "hooks", "scripts", "AGENTS.md", "CLAUDE.md", "INSTALL.md", "README.md", "LICENSE")

Write-Host "WhytCard Intelligence - Installation" -ForegroundColor Cyan
Write-Host "Source: $RepoRoot" -ForegroundColor Gray
Write-Host "Target: $TargetDir" -ForegroundColor Gray
Write-Host ""

Write-Host "[1/3] Copying plugin files..." -ForegroundColor Yellow
if (Test-Path $TargetDir) {
  Remove-Item -Recurse -Force $TargetDir
}
New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null

foreach ($item in $DirsToCopy) {
    $src = Join-Path $RepoRoot $item
    if (Test-Path $src) {
        if (Test-Path $src -PathType Container) {
            Copy-Item $src $TargetDir -Recurse -Force
        } else {
            Copy-Item $src $TargetDir -Force
        }
        Write-Host "  + $item" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "[1b/3] Installing Cursor commands + skills..." -ForegroundColor Yellow

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

# Optional: global Cursor rules (visible in Cursor Settings → Rules)
New-Item -ItemType Directory -Path $CursorRulesDir -Force | Out-Null
$RulesSrcDir = Join-Path $RepoRoot "rules"
if (Test-Path $RulesSrcDir) {
  Copy-Item (Join-Path $RulesSrcDir "*.mdc") $CursorRulesDir -Force
  Write-Host "  OK: Cursor rules installed to $CursorRulesDir" -ForegroundColor Green
} else {
  Write-Host "  WARN: rules/ missing in repo; skipping global rules install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2/3] Registering in installed_plugins.json..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $ClaudePluginsDir -Force | Out-Null
$mergeScript = Join-Path (Join-Path $RepoRoot "scripts") "install-json-merge.js"
node $mergeScript $InstalledPluginsPath $SettingsPath $PluginId $TargetDir
if ($LASTEXITCODE -ne 0) { throw "JSON merge failed" }
Write-Host "  OK: $PluginId registered and enabled" -ForegroundColor Green

Write-Host ""
Write-Host "Installation complete." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Restart Cursor (or Reload Window: Ctrl+Shift+P)" -ForegroundColor Gray
Write-Host "  2. Settings > Features > Include third-party Plugins = ON" -ForegroundColor Gray
Write-Host "  3. Commands /wi-brainstorm, /wi-add-feature should appear" -ForegroundColor Gray
Write-Host ""
Write-Host "Claude Code: plugin shared via .claude" -ForegroundColor Gray
Write-Host ""
