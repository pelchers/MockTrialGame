param(
  [string]$QueueFile
)

# Derive repo root from script location: .codex/hooks/scripts/ -> repo root
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

if (-not $QueueFile) {
  $QueueFile = Join-Path $repoRoot ".codex\orchestration\queue\next_phase.json"
}

if (-not (Test-Path $QueueFile)) {
  exit 0
}

try {
  $payload = Get-Content -LiteralPath $QueueFile -Raw | ConvertFrom-Json
} catch {
  Write-Host "Orchestrator: failed to parse queue file."
  exit 1
}

if (-not $payload.autoSpawn) {
  Write-Host "Orchestrator: autoSpawn=false; skipping."
  exit 0
}

$prompt = $payload.prompt
if (-not $prompt) {
  Write-Host "Orchestrator: missing prompt; skipping."
  exit 1
}

$workdir = $payload.workdir
if (-not $workdir) {
  $workdir = $repoRoot
}

$fullAuto = $payload.fullAuto
$dryRun = $payload.dryRun
$agent = $payload.agent

# Build the full command string for codex exec
$cmdStr = "codex exec --cd `"$workdir`""
if ($fullAuto) {
  $cmdStr += " --full-auto"
}
if ($agent) {
  $prompt = "Use agent file: .codex/agents/$agent/AGENT.md. " + $prompt
}
# Escape double quotes in prompt for cmd /c
$escapedPrompt = $prompt -replace '"', '\"'
$cmdStr += " `"$escapedPrompt`""

if ($dryRun) {
  Write-Host "Orchestrator dry run: $cmdStr"
} else {
  # Log file for subagent output
  $logsDir = Join-Path $repoRoot ".codex\orchestration\logs"
  if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
  }
  $logFile = Join-Path $logsDir "subagent_$timestamp.log"
  $errFile = Join-Path $logsDir "subagent_${timestamp}_err.log"

  Write-Host "Orchestrator: spawning subagent (log: $logFile)"

  # codex is a .cmd file, so launch via cmd.exe with output redirected
  $fullCmd = "$cmdStr > `"$logFile`" 2> `"$errFile`""
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $fullCmd -WindowStyle Hidden
}

# Archive the queue file
$historyDir = Join-Path $repoRoot ".codex\orchestration\history"
if (-not (Test-Path $historyDir)) {
  New-Item -ItemType Directory -Path $historyDir -Force | Out-Null
}
$dest = Join-Path $historyDir "next_phase_$timestamp.json"
Move-Item -Force $QueueFile $dest
