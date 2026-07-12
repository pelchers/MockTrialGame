param(
  [Parameter(Mandatory=$true)]
  [string]$Message,
  [ValidateSet('codex','claude')]
  [string]$Author = 'claude',
  [string]$LogDir = '.chat-history',
  [string]$LogBase = 'user-messages',
  [string]$LogFile  # back-compat: if given, derive LogDir/LogBase from it
)

if ($LogFile) {
  $LogDir  = Split-Path -Parent $LogFile
  $LogBase = [System.IO.Path]::GetFileNameWithoutExtension($LogFile)
}

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')

# Resolve THIS device from device.local.md (checked box in section 1) so the entry lands in the
# correct per-device segment. Branched-logs: each device appends only to user-messages.<device>.md;
# the merged user-messages.md view is regenerated (0-loss, deduped, chronological).
$device = 'unknown'
if (Test-Path 'device.local.md') {
  $m = Select-String -Path 'device.local.md' -Pattern '^\s*-\s*\[x\]\s*(home-desktop|asus-laptop)'
  if ($m) { $device = $m.Matches[0].Groups[1].Value }
}

try {
  $shortHash = (git rev-parse --short HEAD 2>$null).Trim()
  $subject   = (git log -1 --pretty=%s 2>$null).Trim()
  if ([string]::IsNullOrWhiteSpace($shortHash)) {
    $commitLine = 'Most recent commit: unavailable (git returned no HEAD)'
  } else {
    $commitLine = "Most recent commit: $shortHash ($subject)"
  }
} catch {
  $commitLine = "Most recent commit: unavailable ($($_.Exception.Message))"
}

# Legacy-format entry block (the branched-log engine ingests this + wraps it with a hidden marker).
$entry = "[$timestamp] role=user`nAuthored by: $Author (device: $device)`n$commitLine`n`n$Message`n"

$eng = '.claude/hooks/scripts/branched-log-merge.py'
if (-not (Test-Path $eng)) { $eng = '.codex/hooks/scripts/branched-log-merge.py' }
$py = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $py) { $py = (Get-Command python3 -ErrorAction SilentlyContinue) }

if ((Test-Path $eng) -and $py -and ($device -ne 'unknown')) {
  # append to THIS device's segment + regenerate the merged view, via the engine's absorb (dedups)
  $tmp = [System.IO.Path]::GetTempFileName()
  Set-Content -Path $tmp -Value $entry -Encoding utf8
  & $py.Source $eng absorb $LogBase $LogDir 'asc' $device 'chat' $tmp | Out-Null
  Remove-Item $tmp -ErrorAction SilentlyContinue
  Write-Output "Appended entry to $LogDir/$LogBase.$device.md + regenerated $LogDir/$LogBase.md"
} else {
  # graceful fallback (engine/python/device unavailable): append to the merged file directly
  if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Force -Path $LogDir | Out-Null }
  Add-Content -Path (Join-Path $LogDir "$LogBase.md") -Value "`n---`n$entry"
  Write-Output "Appended user message to $LogDir/$LogBase.md (fallback: engine/device unavailable)"
}
