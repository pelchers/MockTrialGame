param(
  [string]$ConfigPath = '.codex/skills/planning-frontend-design-orchestrator/references/style-config.json',
  [switch]$Sequential,
  [string]$OutputSetName = ''
)

$ErrorActionPreference = 'Stop'

function Get-SeedScore {
  param([Parameter(Mandatory = $true)][string]$Seed)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Seed)
  $hash = $sha.ComputeHash($bytes)
  return [BitConverter]::ToUInt32($hash, 0)
}

function Get-SeedIndex {
  param(
    [Parameter(Mandatory = $true)][string]$Seed,
    [Parameter(Mandatory = $true)][int]$Count
  )
  if ($Count -le 0) { return 0 }
  $score = Get-SeedScore -Seed $Seed
  return [int]($score % $Count)
}

function Get-ShuffledItems {
  param(
    [Parameter(Mandatory = $true)][array]$Items,
    [Parameter(Mandatory = $true)][string]$Seed,
    [Parameter(Mandatory = $true)][string]$IdProperty
  )
  return @(
    $Items |
      Sort-Object {
        $idVal = $_.$IdProperty
        Get-SeedScore -Seed "$Seed|$idVal"
      }
  )
}

function Select-InspirationReferences {
  param(
    [Parameter(Mandatory = $true)][array]$References,
    [Parameter(Mandatory = $true)][string]$RunId,
    [Parameter(Mandatory = $true)][string]$JobKey
  )
  $awwwards = @($References | Where-Object { $_.url -match 'awwwards\.com' })
  if ($awwwards.Count -eq 0) {
    throw "No Awwwards references available for $JobKey"
  }
  $nonAwwwards = @($References | Where-Object { $_.url -notmatch 'awwwards\.com' })

  $primaryAwwIdx = Get-SeedIndex -Seed "$RunId|$JobKey|awwwards" -Count $awwwards.Count
  $primaryAww = $awwwards[$primaryAwwIdx]

  $secondary = @()
  $nonAwwwardsCount = $nonAwwwards.Count
  if ($nonAwwwardsCount -gt 0) {
    $take = [Math]::Min(2, $nonAwwwardsCount)
    $offset = Get-SeedIndex -Seed "$RunId|$JobKey|secondary" -Count $nonAwwwardsCount
    for ($i = 0; $i -lt $take; $i++) {
      $secondary += $nonAwwwards[($offset + $i) % $nonAwwwardsCount]
    }
  }

  return [PSCustomObject]@{
    primaryAwwwards = $primaryAww
    selected = @($primaryAww) + $secondary
    all = $References
  }
}

$cfg = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json
$buildJobsScript = (Resolve-Path '.codex/skills/planning-frontend-design-orchestrator/scripts/build-pass-jobs.ps1').Path
$jobsManifestPath = '.codex/skills/planning-frontend-design-orchestrator/references/pass-jobs.json'
$generateScript = (Resolve-Path '.codex/skills/frontend-design-subagent/scripts/generate-concept.ps1').Path
$uniquenessScript = (Resolve-Path '.codex/skills/frontend-design-subagent/scripts/validate-design-uniqueness.mjs').Path
$validateScript = (Resolve-Path '.codex/skills/frontend-design-subagent/scripts/validate-concepts-playwright.mjs').Path
$inspirationCatalogConfigPath = if ($cfg.inspirationCatalogPath) { $cfg.inspirationCatalogPath } else { '.codex/skills/frontend-design-subagent/references/external-inspiration-catalog.json' }
$uniquenessCatalogConfigPath = if ($cfg.uniquenessCatalogPath) { $cfg.uniquenessCatalogPath } else { '.codex/skills/planning-frontend-design-orchestrator/references/layout-uniqueness-catalog.json' }
$inspirationCatalogPath = (Resolve-Path $inspirationCatalogConfigPath).Path
$uniquenessCatalogPath = (Resolve-Path $uniquenessCatalogConfigPath).Path
$workspaceRoot = (Get-Location).Path
$baseOutputRoot = [System.IO.Path]::GetFullPath((Join-Path $workspaceRoot $cfg.outputRoot))
$effectiveOutputRoot = if ([string]::IsNullOrWhiteSpace($OutputSetName)) {
  $baseOutputRoot
} else {
  [System.IO.Path]::GetFullPath((Join-Path $baseOutputRoot $OutputSetName))
}
$concurrency = if ($cfg.orchestration.concurrency) { [int]$cfg.orchestration.concurrency } else { 5 }
$validationSubfolder = if ($cfg.orchestration.validationSubfolder) { $cfg.orchestration.validationSubfolder } else { 'validation' }
$uniquenessThreshold = if ($cfg.orchestration.uniquenessThreshold) { [double]$cfg.orchestration.uniquenessThreshold } else { 0.62 }
$requireExternalInspiration = if ($null -ne $cfg.orchestration.requireExternalInspiration) { [bool]$cfg.orchestration.requireExternalInspiration } else { $true }
$requireValidation = if ($null -ne $cfg.orchestration.requireValidation) { [bool]$cfg.orchestration.requireValidation } else { $true }
$requireAwwwardsReference = if ($null -ne $cfg.orchestration.requireAwwwardsReference) { [bool]$cfg.orchestration.requireAwwwardsReference } else { $true }
$requireDownloadedMedia = if ($null -ne $cfg.orchestration.requireDownloadedMedia) { [bool]$cfg.orchestration.requireDownloadedMedia } else { $true }
$requireUniqueProfilesPerRun = if ($null -ne $cfg.orchestration.requireUniqueProfilesPerRun) { [bool]$cfg.orchestration.requireUniqueProfilesPerRun } else { $true }
$requiredAnimationLibraries = if ($cfg.orchestration.requiredAnimationLibraries) { @($cfg.orchestration.requiredAnimationLibraries) } else { @('three.js', 'gsap') }

$runId = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$runLogRoot = Join-Path $effectiveOutputRoot "_orchestration/$runId"
$handoffRoot = Join-Path $runLogRoot 'handoffs'
New-Item -ItemType Directory -Force -Path $runLogRoot | Out-Null
New-Item -ItemType Directory -Force -Path $handoffRoot | Out-Null

& $buildJobsScript -ConfigPath $ConfigPath -OutPath $jobsManifestPath -OutputRootOverride $effectiveOutputRoot
if (-not (Test-Path $jobsManifestPath)) {
  throw 'Failed to build pass jobs manifest.'
}

$jobManifest = @(Get-Content -Raw -Path $jobsManifestPath | ConvertFrom-Json)
if ($jobManifest.Count -eq 0) {
  throw 'No jobs found in pass jobs manifest.'
}

$catalogObj = Get-Content -Raw -Path $inspirationCatalogPath | ConvertFrom-Json
$inspirationCatalog = @{}
$catalogObj.PSObject.Properties | ForEach-Object { $inspirationCatalog[$_.Name] = $_.Value }

$uniquenessCatalogObj = Get-Content -Raw -Path $uniquenessCatalogPath | ConvertFrom-Json
$profiles = @($uniquenessCatalogObj.profiles)
if ($profiles.Count -lt $jobManifest.Count) {
  throw "Uniqueness profile catalog has $($profiles.Count) profiles but $($jobManifest.Count) jobs were requested."
}

$orderedJobs = Get-ShuffledItems -Items $jobManifest -Seed "$runId|jobs" -IdProperty 'jobId'
$orderedProfiles = Get-ShuffledItems -Items $profiles -Seed "$runId|profiles" -IdProperty 'profileId'

$jobs = @()
for ($i = 0; $i -lt $orderedJobs.Count; $i++) {
  $job = $orderedJobs[$i]
  $profile = $orderedProfiles[$i]
  $jobKey = if ($job.jobKey) { $job.jobKey } else { "$($job.styleId)/pass-$($job.pass)" }

  if (-not $inspirationCatalog.ContainsKey($jobKey)) {
    throw "Missing inspiration catalog entry for $jobKey"
  }
  $inspirationEntry = $inspirationCatalog[$jobKey]
  $pickedRefs = Select-InspirationReferences -References @($inspirationEntry.references) -RunId $runId -JobKey $jobKey

  $handoff = [PSCustomObject]@{
    runId = $runId
    jobId = $job.jobId
    jobKey = $jobKey
    styleId = $job.styleId
    pass = [int]$job.pass
    variantSeed = $job.variantSeed
    outputDir = $job.outputDir
    uniquenessFlags = [PSCustomObject]@{
      profileId = $profile.profileId
      shellMode = $profile.shellMode
      navPattern = $profile.navPattern
      contentFlow = $profile.contentFlow
      scrollMode = $profile.scrollMode
      alignment = $profile.alignment
      heroTreatment = $profile.heroTreatment
      motionLanguage = $profile.motionLanguage
      density = $profile.density
      componentTone = $profile.componentTone
    }
    inspiration = [PSCustomObject]@{
      direction = $inspirationEntry.direction
      primaryAwwwards = $pickedRefs.primaryAwwwards
      selectedReferences = $pickedRefs.selected
      allReferences = $pickedRefs.all
      sourceCatalogKey = $jobKey
    }
    researchReferences = @(
      'https://www.awwwards.com/websites/sites_of_the_day/',
      'https://www.awwwards.com/websites/transitions/',
      'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout',
      'https://gsap.com/docs/v3/Plugins/ScrollTrigger/',
      'https://threejs.org/manual/#en/fundamentals'
    )
    createdAt = (Get-Date).ToUniversalTime().ToString('o')
  }

  $handoffPath = Join-Path $handoffRoot "$($job.jobId).json"
  $handoff | ConvertTo-Json -Depth 12 | Set-Content -Path $handoffPath

  $jobs += [PSCustomObject]@{
    jobId = $job.jobId
    jobKey = $jobKey
    styleId = $job.styleId
    pass = [int]$job.pass
    variantSeed = $job.variantSeed
    outputDir = $job.outputDir
    validationDir = $job.validationDir
    handoffFile = $job.handoffFile
    inspirationFile = $job.inspirationFile
    handoffPath = $handoffPath
    uniquenessProfileId = $profile.profileId
  }
}

Write-Output "Starting orchestration run $runId with $($jobs.Count) jobs. Mode: $(if ($Sequential) { 'sequential' } else { 'concurrent' })"

$results = @()
if ($Sequential) {
  foreach ($job in $jobs) {
    $start = (Get-Date).ToUniversalTime().ToString('o')
    & $generateScript -StyleId $job.styleId -Pass $job.pass -VariantSeed $job.variantSeed -OutputDir $job.outputDir -RunSeed $runId -HandoffPath $job.handoffPath
    $end = (Get-Date).ToUniversalTime().ToString('o')
    $results += [PSCustomObject]@{
      jobId = $job.jobId
      jobKey = $job.jobKey
      styleId = $job.styleId
      pass = $job.pass
      outputDir = $job.outputDir
      handoffFile = $job.handoffFile
      handoffPath = $job.handoffPath
      uniquenessProfileId = $job.uniquenessProfileId
      status = 'completed'
      mode = 'sequential'
      startedAt = $start
      endedAt = $end
    }
  }
} else {
  $active = @()
  $submitted = @()
  foreach ($job in $jobs) {
    while (@($active | Where-Object { $_.State -eq 'Running' }).Count -ge $concurrency) {
      Start-Sleep -Milliseconds 200
      $active = @($active | Where-Object { $_.State -eq 'Running' })
    }
    $psJob = Start-Job -Name $job.jobId -ScriptBlock {
      param($generateScriptPath, $styleId, $pass, $variantSeed, $outputDir, $workspaceRootPath, $runSeed, $handoffPath)
      $ErrorActionPreference = 'Stop'
      Set-Location $workspaceRootPath
      $startedAt = (Get-Date).ToUniversalTime().ToString('o')
      & $generateScriptPath -StyleId $styleId -Pass $pass -VariantSeed $variantSeed -OutputDir $outputDir -RunSeed $runSeed -HandoffPath $handoffPath
      $endedAt = (Get-Date).ToUniversalTime().ToString('o')
      [PSCustomObject]@{
        styleId = $styleId
        pass = $pass
        outputDir = $outputDir
        startedAt = $startedAt
        endedAt = $endedAt
        pid = $PID
        handoffPath = $handoffPath
      }
    } -ArgumentList $generateScript, $job.styleId, $job.pass, $job.variantSeed, $job.outputDir, $workspaceRoot, $runId, $job.handoffPath
    $active += $psJob
    $submitted += $psJob
  }

  Wait-Job -Job $submitted | Out-Null
  foreach ($run in $submitted) {
    if ($run.State -ne 'Completed') {
      $err = Receive-Job -Job $run -ErrorAction SilentlyContinue
      throw "Job $($run.Name) failed with state $($run.State). $err"
    }
    $payload = Receive-Job -Job $run
    Remove-Job -Job $run | Out-Null

    $job = $jobs | Where-Object { $_.jobId -eq $run.Name } | Select-Object -First 1
    $handoffFile = "$($payload.outputDir)/$validationSubfolder/handoff.json"
    $results += [PSCustomObject]@{
      jobId = $run.Name
      jobKey = $job.jobKey
      styleId = $payload.styleId
      pass = $payload.pass
      outputDir = $payload.outputDir
      handoffFile = $handoffFile
      handoffPath = $payload.handoffPath
      uniquenessProfileId = $job.uniquenessProfileId
      status = 'completed'
      mode = 'concurrent'
      startedAt = $payload.startedAt
      endedAt = $payload.endedAt
      processId = $payload.pid
    }
  }
}

$results | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $runLogRoot 'handoff-results.json')

Write-Output 'Running uniqueness validation...'
node $uniquenessScript --concept-root $effectiveOutputRoot --threshold $uniquenessThreshold
if ($LASTEXITCODE -ne 0) {
  throw "Uniqueness validation failed with exit code $LASTEXITCODE"
}

if ($requireValidation) {
  Write-Output 'Running Playwright validation...'
  node $validateScript --concept-root $effectiveOutputRoot
  if ($LASTEXITCODE -ne 0) {
    throw "Playwright validation failed with exit code $LASTEXITCODE"
  }
}

$usedProfileIds = @()
foreach ($r in $results) {
  if (-not (Test-Path $r.handoffFile)) {
    throw "Missing handoff file: $($r.handoffFile)"
  }

  $passValidationDir = Join-Path $r.outputDir $validationSubfolder
  $reportPath = Join-Path $passValidationDir 'report.playwright.json'
  $inspirationPath = Join-Path $passValidationDir 'inspiration-crossreference.json'

  if (-not (Test-Path $reportPath)) {
    throw "Missing validation report: $reportPath"
  }
  if (-not (Test-Path (Join-Path $passValidationDir 'screenshots'))) {
    throw "Missing screenshots folder: $(Join-Path $passValidationDir 'screenshots')"
  }
  if ($requireExternalInspiration -and -not (Test-Path $inspirationPath)) {
    throw "Missing inspiration cross-reference file: $inspirationPath"
  }

  if ($requireAwwwardsReference -and (Test-Path $inspirationPath)) {
    $insp = Get-Content -Raw -Path $inspirationPath | ConvertFrom-Json
    $refs = @($insp.references)
    $hasAwwwards = ($refs | Where-Object { $_.url -match 'awwwards\.com' }).Count -gt 0
    if (-not $hasAwwwards) {
      throw "Missing required Awwwards reference in: $inspirationPath"
    }
    if (-not $insp.primaryAwwwardsReference) {
      throw "Missing primaryAwwwardsReference in: $inspirationPath"
    }
  }

  $indexPath = Join-Path $r.outputDir 'index.html'
  if (-not (Test-Path $indexPath)) {
    throw "Missing index file for animation library validation: $indexPath"
  }
  $indexMarkup = Get-Content -Raw -Path $indexPath
  foreach ($lib in $requiredAnimationLibraries) {
    switch -Regex ($lib.ToLowerInvariant()) {
      'three(\.js)?' {
        if ($indexMarkup -notmatch 'three\.min\.js') { throw "Missing required Three.js include in $indexPath" }
      }
      'gsap' {
        if ($indexMarkup -notmatch 'gsap(\.min)?\.js') { throw "Missing required GSAP include in $indexPath" }
      }
      default {
        if ($indexMarkup -notmatch [regex]::Escape($lib)) { throw "Missing required animation library marker '$lib' in $indexPath" }
      }
    }
  }

  if ($requireDownloadedMedia) {
    $primaryMedia = Join-Path $r.outputDir 'assets/background-primary.jpg'
    $secondaryMedia = Join-Path $r.outputDir 'assets/background-secondary.jpg'
    if (-not (Test-Path $primaryMedia)) {
      throw "Missing required media asset: $primaryMedia"
    }
    if (-not (Test-Path $secondaryMedia)) {
      throw "Missing required media asset: $secondaryMedia"
    }
  }

  $passHandoffObj = Get-Content -Raw -Path $r.handoffFile | ConvertFrom-Json
  if (-not $passHandoffObj.uniquenessFlags) {
    throw "Missing uniquenessFlags in pass handoff: $($r.handoffFile)"
  }
  $usedProfileIds += [string]$passHandoffObj.uniquenessFlags.profileId
}

$uniqueProfileCount = (@($usedProfileIds | Select-Object -Unique)).Count
if ($requireUniqueProfilesPerRun -and $uniqueProfileCount -lt $results.Count) {
  throw "Uniqueness profile collision detected. Expected $($results.Count) unique profiles, got $uniqueProfileCount."
}

$summary = [PSCustomObject]@{
  runId = $runId
  mode = if ($Sequential) { 'sequential' } else { 'concurrent' }
  concurrency = if ($Sequential) { 1 } else { $concurrency }
  totalJobs = $results.Count
  uniquenessThreshold = $uniquenessThreshold
  requireExternalInspiration = $requireExternalInspiration
  requireAwwwardsReference = $requireAwwwardsReference
  requireDownloadedMedia = $requireDownloadedMedia
  requireUniqueProfilesPerRun = $requireUniqueProfilesPerRun
  requiredAnimationLibraries = $requiredAnimationLibraries
  validationRequired = $requireValidation
  outputRoot = $effectiveOutputRoot
  outputSetName = if ([string]::IsNullOrWhiteSpace($OutputSetName)) { $null } else { $OutputSetName }
  uniqueProfileCount = $uniqueProfileCount
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  results = $results
}

$summaryPath = Join-Path $runLogRoot 'summary.json'
$summary | ConvertTo-Json -Depth 10 | Set-Content -Path $summaryPath
Write-Output "Local orchestration complete. Summary: $summaryPath"
