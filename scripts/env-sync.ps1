# env-sync.ps1 -- move env values between the committed vault and the live files.
#
# WHY THIS EXISTS. Device swaps happen daily, and several of these values sit behind an external
# admin request wall, so re-obtaining them per device is a real cost. CC-Local is a PRIVATE remote,
# so the values are committed -- but only in one place.
#
# THE LOCATION RULE is what makes it safe, not secrecy. `CC/` is the subtree that gets patched into
# PRs against fmchisti/collectibleclassics, so an env file committed inside `CC/` could ride a patch
# upstream. The canonical copies therefore live in the repo-ROOT `.envs/` vault (root content never
# ships), and the live files inside `CC/` stay gitignored and are only ever WRITTEN by this script.
#
#   Edit the vault file. Never the live file inside CC/.
#
# Usage (from the repo root, Windows PowerShell 5.1 or pwsh):
#   .\scripts\env-sync.ps1                 # hydrate: vault -> live files (the new-device case)
#   .\scripts\env-sync.ps1 -Capture        # capture: live files -> vault (after editing a live one)
#   .\scripts\env-sync.ps1 -Check          # report drift between vault and live; changes nothing
#
# Hydrate never silently overwrites a live file that differs: it backs it up to <file>.bak-<stamp>
# first, so a value you added on this device and forgot to capture is recoverable.

[CmdletBinding()]
param(
  [switch]$Capture,
  [switch]$Check
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$vault = Join-Path $repo '.envs'
$manifest = Join-Path $vault 'manifest.tsv'

if (-not (Test-Path $manifest)) {
  Write-Error "No manifest at $manifest. The vault is missing - restore it from git (.envs/)."
  exit 1
}

# -- Parse the manifest: <vault-file>TAB<destination relative to repo root> ------
$pairs = @()
foreach ($line in Get-Content $manifest) {
  if ($line -match '^\s*#' -or $line.Trim() -eq '') { continue }
  $parts = $line -split "`t", 2
  if ($parts.Count -ne 2) {
    Write-Warning "manifest line is not <file>TAB<destination>, skipped: $line"
    continue
  }
  $pairs += [pscustomobject]@{
    VaultPath = Join-Path $vault $parts[0].Trim()
    LivePath  = Join-Path $repo $parts[1].Trim()
    Name      = $parts[0].Trim()
    Dest      = $parts[1].Trim()
  }
}

if ($pairs.Count -eq 0) { Write-Error 'Manifest has no usable entries.'; exit 1 }

function Get-Sha([string]$path) {
  if (-not (Test-Path $path)) { return $null }
  return (Get-FileHash -Path $path -Algorithm SHA256).Hash
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$changed = 0
$drift = 0

foreach ($p in $pairs) {
  $vSha = Get-Sha $p.VaultPath
  $lSha = Get-Sha $p.LivePath

  if ($Check) {
    if ($null -eq $vSha) { Write-Host ("  {0,-26} MISSING FROM VAULT" -f $p.Name); $drift++ }
    elseif ($null -eq $lSha) { Write-Host ("  {0,-26} not present live -> {1}" -f $p.Name, $p.Dest); $drift++ }
    elseif ($vSha -eq $lSha) { Write-Host ("  {0,-26} in sync" -f $p.Name) }
    else { Write-Host ("  {0,-26} DIFFERS from {1}" -f $p.Name, $p.Dest); $drift++ }
    continue
  }

  if ($Capture) {
    if ($null -eq $lSha) { Write-Warning ("no live file at {0}; nothing to capture for {1}" -f $p.Dest, $p.Name); continue }
    if ($vSha -eq $lSha) { continue }
    Copy-Item -Path $p.LivePath -Destination $p.VaultPath -Force
    Write-Host ("  captured {0}  <-  {1}" -f $p.Name, $p.Dest)
    $changed++
    continue
  }

  # Hydrate (default).
  if ($null -eq $vSha) { Write-Warning ("{0} is not in the vault; skipped" -f $p.Name); continue }
  if ($vSha -eq $lSha) { continue }

  $destDir = Split-Path -Parent $p.LivePath
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }

  # Never clobber a differing live file without a copy of it.
  if ($null -ne $lSha) {
    $backup = "$($p.LivePath).bak-$stamp"
    Copy-Item -Path $p.LivePath -Destination $backup -Force
    Write-Host ("  backed up existing {0} -> {1}" -f $p.Dest, (Split-Path -Leaf $backup))
  }
  Copy-Item -Path $p.VaultPath -Destination $p.LivePath -Force
  Write-Host ("  hydrated {0}  ->  {1}" -f $p.Name, $p.Dest)
  $changed++
}

if ($Check) {
  if ($drift -eq 0) { Write-Host '[env-sync] vault and live files agree.' }
  else { Write-Host "[env-sync] $drift file(s) differ. Run with -Capture (live is right) or without flags (vault is right)." }
  exit 0
}

$mode = if ($Capture) { 'capture' } else { 'hydrate' }
if ($changed -eq 0) { Write-Host "[env-sync] $mode - nothing to do, already in sync." }
else { Write-Host "[env-sync] $mode - $changed file(s) updated." }

if ($Capture -and $changed -gt 0) {
  Write-Host '[env-sync] commit the vault so the other device gets these:  git add .envs && git commit'
}
if (-not $Capture -and $changed -gt 0) {
  Write-Host '[env-sync] restart any running dev server so it re-reads the environment.'
}
