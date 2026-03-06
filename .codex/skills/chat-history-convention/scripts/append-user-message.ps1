param(
  [Parameter(Mandatory=$true)]
  [string]$Message,
  [string]$LogFile = '.chat-history/user-messages.log'
)

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
$entry = "[$timestamp] role=user`n$Message`n`n---`n"

if (-not (Test-Path -Path (Split-Path -Parent $LogFile))) {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $LogFile) | Out-Null
}

Add-Content -Path $LogFile -Value $entry
Write-Output "Appended user message to $LogFile"
