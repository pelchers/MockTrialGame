#!/usr/bin/env node

/**
 * Trinary Sync - Sync All
 *
 * Synchronizes entire .claude/ directory across three locations:
 * 1. Main app: <PROJECT_ROOT>/.claude/
 * 2. App builder template (PRIMARY): <PROJECT_ROOT>/app-builder-template/.claude/
 * 3. Do-over files: <PROJECT_ROOT>/do-over-files/.claude/
 *
 * Usage:
 *   node sync-all.js
 *   node sync-all.js --dry-run
 *   node sync-all.js --verbose
 *   node sync-all.js --base-dir /path/to/project
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

// Base paths - resolve dynamically
// Accepts --base-dir <path> or derives project root from script location
// Script lives at <PROJECT_ROOT>/.claude/skills/maintaining-trinary-sync/scripts/
function resolveBaseDir() {
  const idx = args.indexOf('--base-dir');
  if (idx !== -1 && args[idx + 1]) {
    return path.resolve(args[idx + 1]);
  }
  return path.resolve(__dirname, '..', '..', '..', '..');
}
const BASE_DIR = resolveBaseDir();
const MAIN_CLAUDE = path.join(BASE_DIR, '.claude');
const TEMPLATE_CLAUDE = path.join(BASE_DIR, 'app-builder-template', '.claude');
const DOOVER_CLAUDE = path.join(BASE_DIR, 'do-over-files', '.claude');

// Directories to sync
const SYNC_DIRS = ['skills', 'agents', 'subagents'];
const SYNC_FILES = ['mcp.json'];

// Statistics
const stats = {
  skillsCopied: 0,
  agentsCopied: 0,
  subagentsCopied: 0,
  filesCopied: 0,
  errors: 0
};

function log(message, level = 'info') {
  const prefix = {
    info: '',
    verbose: '  ',
    success: '✅',
    warning: '⚠️ ',
    error: '❌'
  }[level];

  if (level === 'verbose' && !VERBOSE) return;

  console.log(`${prefix} ${message}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    if (!DRY_RUN) {
      fs.mkdirSync(dir, { recursive: true });
    }
    log(`Created directory: ${dir}`, 'verbose');
  }
}

function copyFile(src, dest) {
  try {
    if (DRY_RUN) {
      log(`Would copy: ${src} → ${dest}`, 'verbose');
      return true;
    }

    const destDir = path.dirname(dest);
    ensureDir(destDir);

    fs.copyFileSync(src, dest);
    log(`Copied: ${path.basename(src)}`, 'verbose');
    return true;
  } catch (error) {
    log(`Error copying ${src}: ${error.message}`, 'error');
    stats.errors++;
    return false;
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    log(`Source directory not found: ${src}`, 'warning');
    return 0;
  }

  ensureDir(dest);

  const entries = fs.readdirSync(src, { withFileTypes: true });
  let copiedCount = 0;

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copiedCount += copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      if (copyFile(srcPath, destPath)) {
        copiedCount++;
      }
    }
  }

  return copiedCount;
}

function syncSkills() {
  log('\\nSyncing skills...', 'info');

  const skillsDir = path.join(MAIN_CLAUDE, 'skills');
  if (!fs.existsSync(skillsDir)) {
    log('No skills directory found', 'warning');
    return;
  }

  const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);

  log(`Found ${skills.length} skills`, 'info');

  for (const skill of skills) {
    log(`\\n  Syncing skill: ${skill}`, VERBOSE ? 'verbose' : 'info');

    const srcSkill = path.join(skillsDir, skill);

    // Sync to template
    const templateDest = path.join(TEMPLATE_CLAUDE, 'skills', skill);
    const templateCopied = copyDirectory(srcSkill, templateDest);

    // Sync to do-over
    const dooverDest = path.join(DOOVER_CLAUDE, 'skills', skill);
    const dooverCopied = copyDirectory(srcSkill, dooverDest);

    if (templateCopied > 0 && dooverCopied > 0) {
      log(`  ${skill}: ${templateCopied + dooverCopied} files`, 'verbose');
      stats.skillsCopied++;
    }
  }

  log(`\\n✅ Synced ${stats.skillsCopied} skills`, 'success');
}

function syncAgents() {
  log('\\nSyncing agents...', 'info');

  const agentsDir = path.join(MAIN_CLAUDE, 'agents');
  if (!fs.existsSync(agentsDir)) {
    log('No agents directory found', 'warning');
    return;
  }

  const agents = fs.readdirSync(agentsDir)
    .filter(file => file.endsWith('.md'));

  log(`Found ${agents.length} agents`, 'info');

  for (const agent of agents) {
    const srcAgent = path.join(agentsDir, agent);

    // Sync to template
    const templateDest = path.join(TEMPLATE_CLAUDE, 'agents', agent);
    if (copyFile(srcAgent, templateDest)) {
      stats.agentsCopied++;
    }

    // Sync to do-over
    const dooverDest = path.join(DOOVER_CLAUDE, 'agents', agent);
    copyFile(srcAgent, dooverDest);

    log(`  ${agent}`, 'verbose');
  }

  log(`\\n✅ Synced ${stats.agentsCopied} agents`, 'success');
}

function syncSubagents() {
  log('\\nSyncing subagents...', 'info');

  const subagentsDir = path.join(MAIN_CLAUDE, 'subagents');
  if (!fs.existsSync(subagentsDir)) {
    log('No subagents directory found (this is normal)', 'verbose');
    return;
  }

  const subagents = fs.readdirSync(subagentsDir)
    .filter(file => file.endsWith('.md'));

  if (subagents.length === 0) {
    log('No subagents to sync', 'verbose');
    return;
  }

  log(`Found ${subagents.length} subagents`, 'info');

  for (const subagent of subagents) {
    const srcSubagent = path.join(subagentsDir, subagent);

    // Sync to template
    const templateDest = path.join(TEMPLATE_CLAUDE, 'subagents', subagent);
    if (copyFile(srcSubagent, templateDest)) {
      stats.subagentsCopied++;
    }

    // Sync to do-over
    const dooverDest = path.join(DOOVER_CLAUDE, 'subagents', subagent);
    copyFile(srcSubagent, dooverDest);

    log(`  ${subagent}`, 'verbose');
  }

  log(`\\n✅ Synced ${stats.subagentsCopied} subagents`, 'success');
}

function syncMCPConfig() {
  log('\\nSyncing MCP configuration...', 'info');

  const mcpFile = path.join(MAIN_CLAUDE, 'mcp.json');
  if (!fs.existsSync(mcpFile)) {
    log('No mcp.json found', 'verbose');
    return;
  }

  // Sync to template
  const templateDest = path.join(TEMPLATE_CLAUDE, 'mcp.json');
  copyFile(mcpFile, templateDest);

  // Sync to do-over
  const dooverDest = path.join(DOOVER_CLAUDE, 'mcp.json');
  copyFile(mcpFile, dooverDest);

  log('✅ Synced MCP configuration', 'success');
}

function printSummary() {
  console.log('\\n' + '='.repeat(50));
  console.log('Trinary Sync Summary');
  console.log('='.repeat(50));

  if (DRY_RUN) {
    console.log('🔍 DRY RUN - No files were actually copied\\n');
  }

  console.log(`✅ Skills:     ${stats.skillsCopied}`);
  console.log(`✅ Agents:     ${stats.agentsCopied}`);
  console.log(`✅ Subagents:  ${stats.subagentsCopied}`);

  if (stats.errors > 0) {
    console.log(`\\n❌ Errors:     ${stats.errors}`);
  }

  console.log('\\nSynced to:');
  console.log(`  - ${TEMPLATE_CLAUDE} (PRIMARY TEMPLATE)`);
  console.log(`  - ${DOOVER_CLAUDE} (CLEAN REFERENCE)`);

  if (!DRY_RUN) {
    console.log('\\n✅ Trinary sync complete!');
  } else {
    console.log('\\n🔍 Dry run complete. Run without --dry-run to apply changes.');
  }
}

async function main() {
  console.log('🔄 Trinary Sync - Synchronizing Claude Code configurations\\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be modified\\n');
  }

  // Verify main directory exists
  if (!fs.existsSync(MAIN_CLAUDE)) {
    console.error(`❌ Error: Main Claude directory not found: ${MAIN_CLAUDE}`);
    process.exit(1);
  }

  // Ensure destination directories exist
  ensureDir(TEMPLATE_CLAUDE);
  ensureDir(DOOVER_CLAUDE);

  // Sync everything
  syncSkills();
  syncAgents();
  syncSubagents();
  syncMCPConfig();

  // Print summary
  printSummary();

  // Exit with error code if there were errors
  process.exit(stats.errors > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { copyDirectory, syncSkills, syncAgents };

