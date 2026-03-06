#!/usr/bin/env node

/**
 * Scan for hardcoded paths in agent, skill, hook, and orchestration files.
 *
 * Usage:
 *   node scan-hardcoded-paths.js [--dir <subdir>] [--fix-report]
 *
 * Options:
 *   --dir <subdir>    Scan only a specific subdirectory (e.g., .claude/hooks)
 *   --fix-report      Output machine-readable JSON report
 *
 * Scans for:
 *   - Absolute Windows paths (C:\..., C:/...)
 *   - Absolute Unix paths (/home/..., /Users/...)
 *   - Hardcoded BASE_DIR or PROJECT_ROOT constants
 *   - Hardcoded workdir in JSON files
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

const args = process.argv.slice(2);
const dirIdx = args.indexOf('--dir');
const scanDir = dirIdx !== -1 && args[dirIdx + 1]
  ? path.resolve(PROJECT_ROOT, args[dirIdx + 1])
  : null;
const fixReport = args.includes('--fix-report');

const SCAN_DIRS = scanDir
  ? [scanDir]
  : [
      path.join(PROJECT_ROOT, '.claude'),
      path.join(PROJECT_ROOT, '.codex'),
      path.join(PROJECT_ROOT, '.adr'),
    ].filter(d => fs.existsSync(d));

const SCAN_EXTENSIONS = ['.js', '.ps1', '.sh', '.json', '.md', '.yaml', '.yml', '.toml'];

const PATTERNS = [
  { name: 'Windows absolute path', regex: /[A-Z]:\\[\\a-zA-Z0-9._-]+\\[\\a-zA-Z0-9._-]+/g, severity: 'high' },
  { name: 'Windows forward-slash path', regex: /[A-Z]:\/[\/a-zA-Z0-9._-]+\/[\/a-zA-Z0-9._-]+/g, severity: 'high' },
  { name: 'Unix home path', regex: /\/home\/[a-zA-Z0-9._-]+/g, severity: 'high' },
  { name: 'macOS user path', regex: /\/Users\/[a-zA-Z0-9._-]+/g, severity: 'high' },
  { name: 'Hardcoded BASE_DIR', regex: /const\s+BASE_DIR\s*=\s*['"][^'"]+['"]/g, severity: 'high' },
  { name: 'Hardcoded PROJECT_ROOT', regex: /PROJECT_ROOT\s*=\s*["'][^"']+["']/g, severity: 'medium' },
  { name: 'Hardcoded workdir in JSON', regex: /"workdir"\s*:\s*"[A-Z]:[^"]+"/g, severity: 'high' },
];

// Paths/patterns to ignore (the scan script itself, node_modules, etc.)
const IGNORE_PATTERNS = [
  'node_modules',
  'scan-hardcoded-paths.js', // don't flag ourselves
  '.git',
  'test-results',
];

const findings = [];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(p => filePath.includes(p));
}

function scanFile(filePath) {
  if (shouldIgnore(filePath)) return;

  const ext = path.extname(filePath).toLowerCase();
  if (!SCAN_EXTENSIONS.includes(ext)) return;

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return;
  }

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of PATTERNS) {
      const matches = line.matchAll(pattern.regex);
      for (const match of matches) {
        findings.push({
          file: path.relative(PROJECT_ROOT, filePath),
          line: i + 1,
          column: match.index + 1,
          pattern: pattern.name,
          severity: pattern.severity,
          match: match[0],
          context: line.trim().substring(0, 120),
        });
      }
    }
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (shouldIgnore(fullPath)) continue;

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      scanFile(fullPath);
    }
  }
}

function printReport() {
  if (fixReport) {
    console.log(JSON.stringify({ findings, summary: getSummary() }, null, 2));
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('Agnosticism Scan Report');
  console.log('='.repeat(60) + '\n');

  if (findings.length === 0) {
    console.log('All clear — no hardcoded paths found.\n');
    return;
  }

  const highFindings = findings.filter(f => f.severity === 'high');
  const mediumFindings = findings.filter(f => f.severity === 'medium');

  if (highFindings.length > 0) {
    console.log(`HIGH severity (${highFindings.length} findings):\n`);
    for (const f of highFindings) {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    Pattern: ${f.pattern}`);
      console.log(`    Match:   ${f.match}`);
      console.log(`    Context: ${f.context}`);
      console.log('');
    }
  }

  if (mediumFindings.length > 0) {
    console.log(`MEDIUM severity (${mediumFindings.length} findings):\n`);
    for (const f of mediumFindings) {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    Pattern: ${f.pattern}`);
      console.log(`    Match:   ${f.match}`);
      console.log('');
    }
  }

  const summary = getSummary();
  console.log('='.repeat(60));
  console.log(`Total: ${findings.length} findings (${summary.high} high, ${summary.medium} medium)`);
  console.log(`Files affected: ${summary.filesAffected}`);
  console.log('='.repeat(60) + '\n');
}

function getSummary() {
  const high = findings.filter(f => f.severity === 'high').length;
  const medium = findings.filter(f => f.severity === 'medium').length;
  const filesAffected = new Set(findings.map(f => f.file)).size;
  return { total: findings.length, high, medium, filesAffected };
}

// Main
console.log('Scanning for hardcoded paths...\n');
console.log(`Directories: ${SCAN_DIRS.map(d => path.relative(PROJECT_ROOT, d)).join(', ')}`);

for (const dir of SCAN_DIRS) {
  scanDirectory(dir);
}

printReport();
process.exit(findings.filter(f => f.severity === 'high').length > 0 ? 1 : 0);
