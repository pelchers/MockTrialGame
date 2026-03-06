param(
  [string]$ConfigPath = '.codex/skills/planning-frontend-design-orchestrator/references/style-config.json',
  [string]$OutPath = '.codex/skills/planning-frontend-design-orchestrator/references/pass-jobs.json',
  [string]$OutputRootOverride = ''
)

$cfg = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json
$jobs = @()
$validationSubfolder = if ($cfg.orchestration.validationSubfolder) { $cfg.orchestration.validationSubfolder } else { 'validation' }
$screenshotsSubfolder = if ($cfg.orchestration.screenshotsSubfolder) { $cfg.orchestration.screenshotsSubfolder } else { 'validation/screenshots' }
$effectiveOutputRoot = if ([string]::IsNullOrWhiteSpace($OutputRootOverride)) { $cfg.outputRoot } else { $OutputRootOverride }

foreach ($style in $cfg.styles) {
  foreach ($variant in $style.passVariants) {
    $outputDir = "$effectiveOutputRoot/$($style.id)/pass-$($variant.pass)"
    $jobKey = "$($style.id)/pass-$($variant.pass)"
    $jobs += [PSCustomObject]@{
      jobId = "$($style.id)-pass-$($variant.pass)"
      jobKey = $jobKey
      styleId = $style.id
      styleLabel = $style.label
      styleNotes = $style.notes
      pass = [int]$variant.pass
      variantSeed = $variant.variantSeed
      styleLayoutArchetypes = @($style.layoutArchetypes)
      outputDir = $outputDir
      validationDir = "$outputDir/$validationSubfolder"
      screenshotsDir = "$outputDir/$screenshotsSubfolder"
      handoffFile = "$outputDir/$validationSubfolder/handoff.json"
      inspirationFile = "$outputDir/$validationSubfolder/inspiration-crossreference.json"
      flags = @(
        "--style-id $($style.id)",
        "--pass $($variant.pass)",
        "--output-dir $outputDir",
        "--variant-seed $($variant.variantSeed)"
      )
    }
  }
}

$jobs | ConvertTo-Json -Depth 6 | Set-Content -Path $OutPath
Write-Output "Wrote $($jobs.Count) jobs to $OutPath"
