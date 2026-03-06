
param(
  [Parameter(Mandatory = $true)][string]$StyleId,
  [Parameter(Mandatory = $true)][int]$Pass,
  [Parameter(Mandatory = $true)][string]$VariantSeed,
  [Parameter(Mandatory = $true)][string]$OutputDir,
  [string]$RunSeed = '',
  [string]$HandoffPath = ''
)

$ErrorActionPreference = 'Stop'

function Get-SeedIndex {
  param(
    [Parameter(Mandatory = $true)][string]$Seed,
    [Parameter(Mandatory = $true)][int]$Count
  )
  if ($Count -le 0) { return 0 }
  $sha = [System.Security.Cryptography.SHA256]::Create()
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Seed)
  $hash = $sha.ComputeHash($bytes)
  $raw = [BitConverter]::ToUInt32($hash, 0)
  return [int]($raw % $Count)
}

function Save-RemoteAsset {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][string]$OutFile
  )
  try {
    Invoke-WebRequest -Uri $Uri -OutFile $OutFile -TimeoutSec 25 | Out-Null
    return $true
  }
  catch {
    return $false
  }
}

function Build-NavButtons {
  param(
    [Parameter(Mandatory = $true)][array]$Views,
    [Parameter(Mandatory = $true)][string]$Pattern,
    [Parameter(Mandatory = $true)][string]$Prefix
  )
  $items = @()
  for ($i = 0; $i -lt $Views.Count; $i++) {
    $v = $Views[$i]
    $n = '{0:d2}' -f ($i + 1)
    switch ($Pattern) {
      'segmented-tabs' { $items += "<button class='nav-btn segmented' data-view='$($v.id)'><strong>$Prefix$n</strong><span>$($v.title)</span></button>" }
      'dock-pills' { $items += "<button class='nav-btn dock-pill' data-view='$($v.id)'><span>$n</span>$($v.title)</button>" }
      'chip-cloud' { $items += "<button class='nav-btn chip' data-view='$($v.id)'>$($v.title)</button>" }
      'floating-orbital' { $items += "<button class='nav-btn orbital' data-view='$($v.id)'><em>$n</em>$($v.title)</button>" }
      'timeline-dots' { $items += "<button class='nav-btn timeline-dot' data-view='$($v.id)'><i></i>$($v.title)</button>" }
      'command-palette' { $items += "<button class='nav-btn command' data-view='$($v.id)'><kbd>Alt+$n</kbd><span>$($v.title)</span></button>" }
      default { $items += "<button class='nav-btn rail' data-view='$($v.id)'><span>$Prefix$n</span>$($v.title)</button>" }
    }
  }
  return ($items -join "`n")
}

function Build-Cards {
  param(
    [Parameter(Mandatory = $true)][array]$Views,
    [Parameter(Mandatory = $true)][string]$Flow,
    [Parameter(Mandatory = $true)][string]$Tone,
    [Parameter(Mandatory = $true)][string]$Density
  )
  $cards = @()
  for ($i = 0; $i -lt $Views.Count; $i++) {
    $v = $Views[$i]
    $n = '{0:d2}' -f ($i + 1)
    $cards += "<article class='view-card tone-$Tone density-$Density' data-page='$($v.id)' data-order='$($i + 1)'><header><p class='kicker'>$($Flow.ToUpperInvariant())-$n</p><h2>$($v.title)</h2></header><p>$($v.desc)</p><ul><li>Workflow map</li><li>Execution hooks</li><li>Validation route</li></ul></article>"
  }
  return ($cards -join "`n")
}

function Build-Shell {
  param(
    [Parameter(Mandatory = $true)][string]$ShellMode,
    [Parameter(Mandatory = $true)][string]$Title,
    [Parameter(Mandatory = $true)][string]$VariantSeed,
    [Parameter(Mandatory = $true)][string]$HeroTreatment,
    [Parameter(Mandatory = $true)][string]$NavMarkup,
    [Parameter(Mandatory = $true)][string]$CardsMarkup,
    [Parameter(Mandatory = $true)][string]$ProfileId,
    [Parameter(Mandatory = $true)][string]$NavPattern,
    [Parameter(Mandatory = $true)][string]$ContentFlow,
    [Parameter(Mandatory = $true)][string]$Alignment,
    [Parameter(Mandatory = $true)][string]$ScrollMode,
    [Parameter(Mandatory = $true)][string]$MotionLanguage,
    [Parameter(Mandatory = $true)][string]$ComponentTone,
    [Parameter(Mandatory = $true)][string]$Density
  )
  $attrs = "data-theme-root data-profile-id='$ProfileId' data-nav-pattern='$NavPattern' data-content-flow='$ContentFlow' data-scroll-mode='$ScrollMode' data-motion-language='$MotionLanguage' data-hero-treatment='$HeroTreatment'"
  $content = "<section class='content-grid flow-$ContentFlow align-$Alignment density-$Density'>$CardsMarkup</section>"

  switch ($ShellMode) {
    'top-ribbon-command' { return "<body class='shell-top-ribbon-command tone-$ComponentTone' $attrs><div id='fx-3d-stage' class='fx-3d-stage'></div><header class='hero-banner'><h1>$Title</h1><p>$HeroTreatment / $VariantSeed</p></header><nav class='nav-shell top-ribbon'>$NavMarkup</nav><main class='workspace'>$content</main></body>" }
    'bottom-dock-workbench' { return "<body class='shell-bottom-dock-workbench tone-$ComponentTone' $attrs><div id='fx-3d-stage' class='fx-3d-stage'></div><main class='workspace'><header class='hero-banner'><h1>$Title</h1><p>$VariantSeed</p></header>$content</main><nav class='nav-shell bottom-dock'>$NavMarkup</nav></body>" }
    'right-rail-inspector' { return "<body class='shell-right-rail-inspector tone-$ComponentTone' $attrs><div id='fx-3d-stage' class='fx-3d-stage'></div><section class='split-layout right-rail'><main class='workspace'><header class='hero-banner'><h1>$Title</h1><p>$VariantSeed</p></header>$content</main><aside class='nav-shell'>$NavMarkup</aside></section></body>" }
    'radial-hub-stage' { return "<body class='shell-radial-hub-stage tone-$ComponentTone' $attrs><div id='fx-3d-stage' class='fx-3d-stage'></div><section class='radial-stage'><header class='hero-banner center'><h1>$Title</h1><p>$HeroTreatment / $VariantSeed</p></header><nav class='nav-shell orbital-ring'>$NavMarkup</nav><main class='workspace'>$content</main></section></body>" }
    'timeline-story-stack' { return "<body class='shell-timeline-story-stack tone-$ComponentTone' $attrs><div id='fx-3d-stage' class='fx-3d-stage'></div><section class='split-layout timeline'><aside class='nav-shell'>$NavMarkup</aside><main class='workspace'><header class='hero-banner'><h1>$Title</h1><p>$VariantSeed</p></header>$content</main></section></body>" }
    'notebook-sheet-canvas' { return "<body class='shell-notebook-sheet-canvas tone-$ComponentTone' $attrs><div id='fx-3d-stage' class='fx-3d-stage'></div><main class='workspace notebook'><header class='hero-banner'><h1>$Title</h1><p>$VariantSeed</p></header><nav class='nav-shell chip-rack'>$NavMarkup</nav>$content</main></body>" }
    'cockpit-monitor-wall' { return "<body class='shell-cockpit-monitor-wall tone-$ComponentTone' $attrs><div id='fx-3d-stage' class='fx-3d-stage'></div><section class='split-layout cockpit'><aside class='nav-shell'>$NavMarkup</aside><main class='workspace'><header class='hero-banner'><h1>$Title</h1><p>$HeroTreatment / $VariantSeed</p></header>$content</main></section></body>" }
    'billboard-sticky-stack' { return "<body class='shell-billboard-sticky-stack tone-$ComponentTone' $attrs><div id='fx-3d-stage' class='fx-3d-stage'></div><section class='split-layout billboard'><aside class='sticky-hero'><header class='hero-banner'><h1>$Title</h1><p>$HeroTreatment</p></header><nav class='nav-shell'>$NavMarkup</nav></aside><main class='workspace'>$content</main></section></body>" }
    'gallery-horizontal-pan' { return "<body class='shell-gallery-horizontal-pan tone-$ComponentTone' $attrs><div id='fx-3d-stage' class='fx-3d-stage'></div><section class='split-layout gallery'><aside class='nav-shell'>$NavMarkup</aside><main class='workspace'><header class='hero-banner'><h1>$Title</h1><p>$VariantSeed</p></header><div class='horizontal-track'>$content</div></main></section></body>" }
    default { return "<body class='shell-split-command-rail tone-$ComponentTone' $attrs><div id='fx-3d-stage' class='fx-3d-stage'></div><section class='split-layout'><aside class='nav-shell'>$NavMarkup</aside><main class='workspace'><header class='hero-banner'><h1>$Title</h1><p>$VariantSeed</p></header>$content</main></section></body>" }
  }
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$validationDir = Join-Path $OutputDir 'validation'
$screenshotsDir = Join-Path $validationDir 'screenshots'
$assetsDir = Join-Path $OutputDir 'assets'
New-Item -ItemType Directory -Force -Path $validationDir | Out-Null
New-Item -ItemType Directory -Force -Path $screenshotsDir | Out-Null
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

$key = "$StyleId/pass-$Pass"
$effectiveRunSeed = if ([string]::IsNullOrWhiteSpace($RunSeed)) { 'baseline-seed' } else { $RunSeed }

$paletteByStyle = @{
  'signal-brutalist' = @{ title='Signal Brutalist'; bg='#f4efe2'; text='#131313'; surface='#ffffff'; accent='#ff5f15'; accent2='#0059ff'; border='#181818'; heading='Anton'; body='Space Grotesk'; mono='IBM Plex Mono' };
  'aurora-glass' = @{ title='Aurora Glass'; bg='#091427'; text='#eef7ff'; surface='rgba(255,255,255,0.12)'; accent='#59d6ff'; accent2='#8f7dff'; border='rgba(153,220,255,0.55)'; heading='Syne'; body='Manrope'; mono='JetBrains Mono' };
  'ledger-editorial' = @{ title='Ledger Editorial'; bg='#f2ece1'; text='#191613'; surface='#fffdf8'; accent='#865a38'; accent2='#245a8c'; border='#2f2923'; heading='Playfair Display'; body='Source Serif 4'; mono='IBM Plex Mono' };
  'industrial-terminal' = @{ title='Industrial Terminal'; bg='#081009'; text='#9affb2'; surface='#0d1a0f'; accent='#45c06a'; accent2='#ffbe6b'; border='#265c34'; heading='Rajdhani'; body='Share Tech Mono'; mono='VT323' };
  'playful-clay' = @{ title='Playful Clay'; bg='#fff6fb'; text='#2f2252'; surface='#ffffff'; accent='#ff7d9b'; accent2='#6f55d6'; border='#d9c9ff'; heading='Fredoka'; body='Nunito'; mono='Fira Code' };
}
if (-not $paletteByStyle.ContainsKey($StyleId)) { throw "Unknown styleId: $StyleId" }
$palette = $paletteByStyle[$StyleId]

$defaultFlags = @{
  'signal-brutalist/pass-1' = @{ profileId='default-brutal-1'; shellMode='split-command-rail'; navPattern='rail-list'; contentFlow='masonry'; scrollMode='reveal'; alignment='left'; heroTreatment='marquee'; motionLanguage='elastic'; density='compact'; componentTone='hard' };
  'signal-brutalist/pass-2' = @{ profileId='default-brutal-2'; shellMode='top-ribbon-command'; navPattern='segmented-tabs'; contentFlow='columns'; scrollMode='sticky'; alignment='left'; heroTreatment='datawall'; motionLanguage='strobe'; density='compact'; componentTone='hard' };
  'aurora-glass/pass-1' = @{ profileId='default-aurora-1'; shellMode='radial-hub-stage'; navPattern='floating-orbital'; contentFlow='bento'; scrollMode='parallax'; alignment='center'; heroTreatment='cinematic'; motionLanguage='orbit'; density='balanced'; componentTone='soft' };
  'aurora-glass/pass-2' = @{ profileId='default-aurora-2'; shellMode='bottom-dock-workbench'; navPattern='dock-pills'; contentFlow='cards'; scrollMode='chapter-snap'; alignment='mixed'; heroTreatment='split'; motionLanguage='drift'; density='balanced'; componentTone='soft' };
  'ledger-editorial/pass-1' = @{ profileId='default-ledger-1'; shellMode='timeline-story-stack'; navPattern='timeline-dots'; contentFlow='timeline'; scrollMode='chapter-snap'; alignment='left'; heroTreatment='marquee'; motionLanguage='calm'; density='spacious'; componentTone='mixed' };
  'ledger-editorial/pass-2' = @{ profileId='default-ledger-2'; shellMode='notebook-sheet-canvas'; navPattern='chip-cloud'; contentFlow='stack'; scrollMode='reveal'; alignment='left'; heroTreatment='minimal'; motionLanguage='calm'; density='balanced'; componentTone='mixed' };
  'industrial-terminal/pass-1' = @{ profileId='default-terminal-1'; shellMode='cockpit-monitor-wall'; navPattern='command-palette'; contentFlow='bento'; scrollMode='parallax'; alignment='center'; heroTreatment='datawall'; motionLanguage='strobe'; density='compact'; componentTone='hard' };
  'industrial-terminal/pass-2' = @{ profileId='default-terminal-2'; shellMode='right-rail-inspector'; navPattern='rail-list'; contentFlow='masonry'; scrollMode='sticky'; alignment='left'; heroTreatment='minimal'; motionLanguage='elastic'; density='compact'; componentTone='hard' };
  'playful-clay/pass-1' = @{ profileId='default-clay-1'; shellMode='billboard-sticky-stack'; navPattern='chip-cloud'; contentFlow='cards'; scrollMode='reveal'; alignment='center'; heroTreatment='cinematic'; motionLanguage='drift'; density='spacious'; componentTone='soft' };
  'playful-clay/pass-2' = @{ profileId='default-clay-2'; shellMode='gallery-horizontal-pan'; navPattern='dock-pills'; contentFlow='horizontal'; scrollMode='horizontal'; alignment='mixed'; heroTreatment='split'; motionLanguage='orbit'; density='balanced'; componentTone='soft' };
}
if (-not $defaultFlags.ContainsKey($key)) { throw "No defaults for $key" }
$flags = [PSCustomObject]$defaultFlags[$key]

$handoffContext = $null
if (-not [string]::IsNullOrWhiteSpace($HandoffPath) -and (Test-Path $HandoffPath)) {
  $handoffContext = Get-Content -Raw -Path $HandoffPath | ConvertFrom-Json
  if ($handoffContext.uniquenessFlags) { $flags = $handoffContext.uniquenessFlags }
}

$catalogPath = '.codex/skills/frontend-design-subagent/references/external-inspiration-catalog.json'
$catalogObj = Get-Content -Raw -Path $catalogPath | ConvertFrom-Json
$catalog = @{}
$catalogObj.PSObject.Properties | ForEach-Object { $catalog[$_.Name] = $_.Value }
if (-not $catalog.ContainsKey($key)) { throw "Missing inspiration entry for $key" }
$catalogEntry = $catalog[$key]

$selectedReferences = @($catalogEntry.references)
$primaryAwwwards = $selectedReferences | Where-Object { $_.url -match 'awwwards\.com' } | Select-Object -First 1
if ($handoffContext -and $handoffContext.inspiration) {
  if ($handoffContext.inspiration.selectedReferences) { $selectedReferences = @($handoffContext.inspiration.selectedReferences) }
  if ($handoffContext.inspiration.primaryAwwwards) { $primaryAwwwards = $handoffContext.inspiration.primaryAwwwards }
}
if (-not $primaryAwwwards) { throw "Awwwards reference required for $key" }

$views = @(
  @{ id='dashboard'; title='Dashboard'; desc='Cross-project health and delivery telemetry.' },
  @{ id='projects'; title='Projects'; desc='Drive-style root with project cards and metadata.' },
  @{ id='project-workspace'; title='Project Workspace'; desc='Split file tree and descriptor panel.' },
  @{ id='kanban'; title='Kanban'; desc='Backlog, in-progress, blocked, and done lanes.' },
  @{ id='whiteboard'; title='Whiteboard'; desc='Node canvas with drag, resize, and embedded media.' },
  @{ id='schema-planner'; title='Schema Planner'; desc='Entity graph and migration planning surfaces.' },
  @{ id='directory-tree'; title='Directory Tree'; desc='Scaffold generation and folder governance views.' },
  @{ id='ideas'; title='Ideas'; desc='Idea capture queue linked to projects and roadmap.' },
  @{ id='ai-chat'; title='AI Chat'; desc='Action chat with workspace-wide context access.' },
  @{ id='settings'; title='Settings'; desc='Auth, subscriptions, and environment controls.' }
)

$prefixes = @('AX-','PR-','MN-','VX-','UI-','NT-','OP-','FD-')
$prefix = $prefixes[(Get-SeedIndex -Seed "$($flags.profileId)|$effectiveRunSeed|prefix" -Count $prefixes.Count)]
$navMarkup = Build-NavButtons -Views $views -Pattern $flags.navPattern -Prefix $prefix
$cardsMarkup = Build-Cards -Views $views -Flow $flags.contentFlow -Tone $flags.componentTone -Density $flags.density

$title = "$($palette.title) / Pass $Pass"
$bodyMarkup = Build-Shell -ShellMode $flags.shellMode -Title $title -VariantSeed $VariantSeed -HeroTreatment $flags.heroTreatment -NavMarkup $navMarkup -CardsMarkup $cardsMarkup -ProfileId $flags.profileId -NavPattern $flags.navPattern -ContentFlow $flags.contentFlow -Alignment $flags.alignment -ScrollMode $flags.scrollMode -MotionLanguage $flags.motionLanguage -ComponentTone $flags.componentTone -Density $flags.density

$mediaSeedBase = "$StyleId-$Pass-$($flags.profileId)-$effectiveRunSeed"
$primaryPath = Join-Path $assetsDir 'background-primary.jpg'
$secondaryPath = Join-Path $assetsDir 'background-secondary.jpg'
$primaryUrl = "https://picsum.photos/seed/$([uri]::EscapeDataString("$mediaSeedBase-primary"))/1920/1200"
$secondaryUrl = "https://picsum.photos/seed/$([uri]::EscapeDataString("$mediaSeedBase-secondary"))/1600/1000"
$primaryDownloaded = Save-RemoteAsset -Uri $primaryUrl -OutFile $primaryPath
$secondaryDownloaded = Save-RemoteAsset -Uri $secondaryUrl -OutFile $secondaryPath

$fontLink = "<link rel='preconnect' href='https://fonts.googleapis.com'><link rel='preconnect' href='https://fonts.gstatic.com' crossorigin><link href='https://fonts.googleapis.com/css2?family=Anton&family=Fira+Code:wght@400;600&family=Fredoka:wght@400;600;700&family=IBM+Plex+Mono:wght@400;600&family=JetBrains+Mono:wght@400;700&family=Manrope:wght@400;600;700&family=Nunito:wght@400;700&family=Playfair+Display:wght@500;700&family=Rajdhani:wght@500;700&family=Share+Tech+Mono&family=Source+Serif+4:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&family=Syne:wght@500;700&family=VT323&display=swap' rel='stylesheet'>"
$html = "<!doctype html><html lang='en'><head><meta charset='UTF-8' /><meta name='viewport' content='width=device-width, initial-scale=1.0' /><title>$title</title>$fontLink<link rel='stylesheet' href='./style.css' /></head>$bodyMarkup<script src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.min.js'></script><script src='https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js'></script><script src='./app.js'></script></html>"

$css = @"
:root{--bg:$($palette.bg);--text:$($palette.text);--surface:$($palette.surface);--accent:$($palette.accent);--accent2:$($palette.accent2);--border:$($palette.border);--heading:'$($palette.heading)',sans-serif;--body:'$($palette.body)',sans-serif;--mono:'$($palette.mono)',monospace}
*{box-sizing:border-box}html,body{margin:0;min-height:100%}body{background:var(--bg);color:var(--text);font-family:var(--body);overflow-x:hidden}
body::before{content:'';position:fixed;inset:0;z-index:-2;background:url('./assets/background-primary.jpg') center/cover no-repeat;opacity:.18}
body::after{content:'';position:fixed;inset:0;z-index:-1;background:linear-gradient(145deg,rgba(255,255,255,.08),transparent 55%,rgba(0,0,0,.2))}
h1,h2{font-family:var(--heading);margin:0}p{line-height:1.45}.fx-3d-stage{position:fixed;inset:0;pointer-events:none;opacity:.72;z-index:0}
.hero-banner{display:flex;justify-content:space-between;gap:10px;align-items:end;padding:14px 16px;border:1px solid var(--border);background:color-mix(in srgb,var(--surface) 94%,transparent);border-radius:14px}.hero-banner.center{flex-direction:column;align-items:center;text-align:center}
.workspace{position:relative;z-index:1;padding:12px;display:grid;gap:12px;min-height:100vh}.split-layout{display:grid;grid-template-columns:280px 1fr;gap:12px;padding:12px}.nav-shell{display:grid;gap:8px;align-content:start}
.nav-btn{cursor:pointer;border:1px solid var(--border);padding:9px 10px;border-radius:12px;background:color-mix(in srgb,var(--surface) 96%,transparent);color:var(--text);font:inherit;display:flex;gap:8px;align-items:center}
.nav-btn.active{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#09131d;font-weight:700}.nav-btn.timeline-dot i{width:10px;height:10px;border-radius:999px;background:currentColor;display:inline-block}
.nav-btn.command kbd{font-family:var(--mono);border:1px solid currentColor;border-radius:6px;padding:2px 6px;font-size:.72rem}
.top-ribbon{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:10px 12px;position:sticky;top:8px;z-index:2}
.bottom-dock{position:fixed;left:50%;transform:translateX(-50%);bottom:12px;width:min(1200px,calc(100vw - 24px));display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:8px;border:1px solid var(--border);border-radius:16px;background:color-mix(in srgb,var(--surface) 94%,transparent);backdrop-filter:blur(6px);z-index:3}
.radial-stage{display:grid;gap:12px;padding:12px}.orbital-ring{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.right-rail{grid-template-columns:1fr 280px}.timeline{grid-template-columns:220px 1fr}.timeline .nav-shell{position:sticky;top:10px;max-height:calc(100vh - 20px);overflow:auto}
.cockpit{grid-template-columns:300px 1fr}.billboard{grid-template-columns:340px 1fr}.sticky-hero{position:sticky;top:10px;height:fit-content;display:grid;gap:10px}
.gallery{grid-template-columns:230px 1fr}.horizontal-track{overflow-x:auto}
.content-grid{display:grid;gap:12px}.flow-bento{grid-template-columns:repeat(12,minmax(0,1fr))}.flow-bento .view-card{grid-column:span 4}
.flow-masonry{grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-flow:dense}.flow-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
.flow-columns{columns:2;column-gap:12px}.flow-columns .view-card{break-inside:avoid-column;margin-bottom:12px}.flow-stack,.flow-timeline{grid-template-columns:1fr}
.flow-horizontal{display:flex;overflow-x:auto;gap:16px;padding-bottom:12px}
.view-card{border:1px solid var(--border);padding:14px;border-radius:16px;background:color-mix(in srgb,var(--surface) 95%,transparent);box-shadow:0 8px 22px rgba(0,0,0,.12)}
.view-card .kicker{font-family:var(--mono);font-size:.72rem;letter-spacing:.08em;opacity:.72}.view-card ul{margin:8px 0 0;padding-left:18px}
.view-card.tone-hard{border-width:2px;border-radius:8px}.view-card.tone-soft{border-radius:22px}.density-compact{padding:10px}.density-spacious{padding:18px}
[data-page]{display:none}[data-page].active{display:block}
.flow-horizontal [data-page]{display:block;min-width:min(86vw,720px);opacity:.34;transform:scale(.98);transition:.3s ease}.flow-horizontal [data-page].active{opacity:1;transform:scale(1)}
[data-scroll-mode='parallax'] .workspace{transform:translate3d(var(--parallax-x,0px),var(--parallax-y,0px),0);transition:transform .12s ease-out}
[data-scroll-mode='chapter-snap'] .workspace{scroll-snap-type:y mandatory;max-height:100vh;overflow:auto}[data-scroll-mode='chapter-snap'] .view-card{scroll-snap-align:start}
[data-scroll-mode='sticky'] .hero-banner{position:sticky;top:8px;z-index:2}
@media (max-width:1100px){.flow-bento .view-card{grid-column:span 6}.flow-masonry{grid-template-columns:1fr 1fr}.flow-columns{columns:1}}
@media (max-width:900px){.split-layout,.right-rail,.timeline,.cockpit,.billboard,.gallery{grid-template-columns:1fr}.nav-shell{grid-template-columns:repeat(2,minmax(0,1fr))}.bottom-dock{position:static;transform:none;width:auto}.flow-cards,.flow-masonry{grid-template-columns:1fr}}
"@

$js = @'
(() => {
  const root = document.querySelector("[data-theme-root]") || document.body;
  const buttons = Array.from(document.querySelectorAll("button[data-view]"));
  const pages = Array.from(document.querySelectorAll("[data-page]"));
  const contentFlow = root.dataset.contentFlow || "cards";
  const scrollMode = root.dataset.scrollMode || "reveal";
  const motionLanguage = root.dataset.motionLanguage || "calm";

  function activate(id) {
    buttons.forEach((btn) => btn.classList.toggle("active", btn.dataset.view === id));
    pages.forEach((page) => page.classList.toggle("active", page.dataset.page === id));
    root.setAttribute("data-active-view", id);
    const activePage = pages.find((page) => page.dataset.page === id);
    if (contentFlow === "horizontal" && activePage?.scrollIntoView) {
      activePage.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
    if (window.gsap && activePage) {
      gsap.fromTo(activePage, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, ease: "power2.out" });
    }
    const url = new URL(window.location.href);
    url.hash = id;
    history.replaceState({}, "", url);
  }

  function setupScroll() {
    if (scrollMode === "parallax") {
      window.addEventListener("mousemove", (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 9;
        const y = (e.clientY / window.innerHeight - 0.5) * 9;
        root.style.setProperty("--parallax-x", `${x}px`);
        root.style.setProperty("--parallax-y", `${y}px`);
      });
    }
    if (scrollMode === "horizontal") {
      const track = document.querySelector(".flow-horizontal");
      if (track) {
        track.addEventListener("wheel", (e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            track.scrollLeft += e.deltaY;
          }
        }, { passive: false });
      }
    }
  }

  function initThree() {
    if (!window.THREE) return;
    const stage = document.getElementById("fx-3d-stage");
    if (!stage) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 7);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    stage.appendChild(renderer.domElement);
    const map = {
      orbit: new THREE.TorusKnotGeometry(1.7, 0.32, 170, 22),
      drift: new THREE.IcosahedronGeometry(2.0, 1),
      elastic: new THREE.OctahedronGeometry(2.2, 0),
      strobe: new THREE.TorusGeometry(2.1, 0.52, 16, 110),
      calm: new THREE.SphereGeometry(2.0, 38, 24)
    };
    const geometry = map[motionLanguage] || map.calm;
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.34, roughness: 0.32, transparent: true, opacity: 0.66, wireframe: motionLanguage === "strobe" });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    scene.add(new THREE.AmbientLight(0xffffff, 0.44));
    const key = new THREE.PointLight(0x7fd8ff, 1.2, 30); key.position.set(3, 4, 6); scene.add(key);
    const fill = new THREE.PointLight(0xff8fc6, 1.0, 26); fill.position.set(-3, -2, 4); scene.add(fill);
    if (window.gsap) {
      const speed = motionLanguage === "strobe" ? 9 : motionLanguage === "orbit" ? 16 : 22;
      gsap.to(mesh.rotation, { y: Math.PI * 2, duration: speed, ease: "none", repeat: -1 });
    }
    let raf = 0;
    const tick = () => {
      const t = performance.now() * 0.001;
      mesh.rotation.x = Math.sin(t * 0.42) * 0.34;
      mesh.position.y = Math.cos(t * 0.6) * 0.2;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    window.addEventListener("beforeunload", () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    });
  }

  buttons.forEach((btn) => btn.addEventListener("click", () => activate(btn.dataset.view)));
  activate(window.location.hash ? window.location.hash.slice(1) : "dashboard");
  setupScroll();
  initThree();
  if (window.gsap && buttons.length) {
    gsap.from(buttons, { y: 12, opacity: 0, duration: 0.34, stagger: 0.03, ease: "power2.out" });
  }
})();
'@

$readmeRefs = ($selectedReferences | ForEach-Object {
  "- $($_.name): $($_.url) (traits: $([string]::Join(', ', $_.traits)))"
}) -join "`n"

$readme = @"
# $title

- style-id: $StyleId
- pass: $Pass
- variant-seed: $VariantSeed
- run-seed: $effectiveRunSeed
- profile-id: $($flags.profileId)
- shell-mode: $($flags.shellMode)
- nav-pattern: $($flags.navPattern)
- content-flow: $($flags.contentFlow)
- scroll-mode: $($flags.scrollMode)
- alignment: $($flags.alignment)
- motion-language: $($flags.motionLanguage)
- animation-libraries: three.js, gsap

## Inspiration
$readmeRefs
"@

$handoffOut = [PSCustomObject]@{
  styleId = $StyleId
  pass = $Pass
  variantSeed = $VariantSeed
  runSeed = $effectiveRunSeed
  outputDir = $OutputDir
  template = $title
  uniquenessFlags = $flags
  handoffSource = if ($handoffContext) { $HandoffPath } else { $null }
  animationLibraries = @('three.js', 'gsap')
  mediaAssets = @(
    @{ file = 'assets/background-primary.jpg'; source = $primaryUrl; downloaded = $primaryDownloaded },
    @{ file = 'assets/background-secondary.jpg'; source = $secondaryUrl; downloaded = $secondaryDownloaded }
  )
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  script = '.codex/skills/frontend-design-subagent/scripts/generate-concept.ps1'
}

$inspirationOut = [PSCustomObject]@{
  key = $key
  styleId = $StyleId
  pass = $Pass
  runSeed = $effectiveRunSeed
  profile = $flags.profileId
  direction = if ($handoffContext -and $handoffContext.inspiration -and $handoffContext.inspiration.direction) { $handoffContext.inspiration.direction } else { $catalogEntry.direction }
  primaryAwwwardsReference = $primaryAwwwards
  references = $selectedReferences
  catalogReferences = @($catalogEntry.references)
  handoffSource = if ($handoffContext) { $HandoffPath } else { $null }
  appliedAt = (Get-Date).ToUniversalTime().ToString('o')
}

Set-Content -Path (Join-Path $OutputDir 'index.html') -Value $html
Set-Content -Path (Join-Path $OutputDir 'style.css') -Value $css
Set-Content -Path (Join-Path $OutputDir 'app.js') -Value $js
Set-Content -Path (Join-Path $OutputDir 'README.md') -Value $readme
Set-Content -Path (Join-Path $validationDir 'handoff.json') -Value ($handoffOut | ConvertTo-Json -Depth 12)
Set-Content -Path (Join-Path $validationDir 'inspiration-crossreference.json') -Value ($inspirationOut | ConvertTo-Json -Depth 12)

Write-Output "Generated $OutputDir"
