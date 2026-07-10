# register-idle-handoff.ps1 — install the idle auto-handoff monitor as a Windows
# Scheduled Task that runs every 20 minutes. Run ONCE per machine per repo (idempotent;
# -Force replaces an existing task of the same name). Part of the device-sync-protocol
# component. The monitor itself (idle-handoff-monitor.sh) does the idle check + handoff;
# this just schedules it so it runs even when no Claude/Codex session is open.
#
#   Usage:   powershell -ExecutionPolicy Bypass -File .claude\hooks\scripts\register-idle-handoff.ps1
#   Remove:  Unregister-ScheduledTask -TaskName <name printed below> -Confirm:$false
#   Tune:    set the env vars IDLE_HANDOFF_HOURS / IDLE_HANDOFF / IDLE_HANDOFF_AGENT
#            (machine or user scope) before the task runs.
$ErrorActionPreference = "Stop"

$repo = (& git rev-parse --show-toplevel 2>$null)
if (-not $repo) { throw "Not inside a git repo — cd into the repo first." }
$repo = $repo.Trim()
$script = Join-Path $repo ".claude\hooks\scripts\idle-handoff-monitor.sh"
if (-not (Test-Path $script)) { throw "Monitor not found: $script" }

# locate Git Bash
$bash = (Get-Command bash.exe -ErrorAction SilentlyContinue).Source
if (-not $bash) { foreach ($p in @("C:\Program Files\Git\bin\bash.exe","C:\Program Files (x86)\Git\bin\bash.exe")) { if (Test-Path $p) { $bash = $p; break } } }
if (-not $bash) { throw "bash.exe not found — install Git for Windows, or edit this script's `$bash path." }

# task name is per-repo so multiple repos each get their own monitor
$leaf = Split-Path $repo -Leaf
$taskName = "DeviceIdleHandoff-$leaf"

$action  = New-ScheduledTaskAction -Execute $bash -Argument "`"$script`"" -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
             -RepetitionInterval (New-TimeSpan -Minutes 20)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
             -ExecutionTimeLimit (New-TimeSpan -Minutes 10) -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings `
  -Description "Idle auto-handoff monitor for $repo (device-sync-protocol): after IDLE_HANDOFF_HOURS of no edits, commit + HANDOFF + push the device branch (never main)." -Force | Out-Null

Write-Host "[idle-handoff] Registered scheduled task '$taskName' (every 20 min)."
Write-Host "[idle-handoff]   monitor: $script"
Write-Host "[idle-handoff]   test now: & '$bash' '$script'"
Write-Host "[idle-handoff]   remove:  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
