#!/usr/bin/env node

/**
 * Trinary Sync - Check Sync Status
 *
 * Verifies synchronization status across three locations
 * Reports missing files, outdated files, and conflicts
 *
 * Usage:
 *   node check-sync.js
 *   node check-sync.js --fix (automatically sync differences)
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const FIX = args.includes('--fix');

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

// Sync status
const status = {
  inSync: [],
  missing: [],
  outdated: [],
  conflicts: [],
  errors: []
};

function getFileInfo(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      mtime: stats.mtime,
      size: stats.size,
      mtimeMs: stats.mtimeMs
    };
  } catch {
    return { exists: false };
  }
}

function checkSkill(skillName) {
  const mainPath = path.join(MAIN_CLAUDE, 'skills', skillName);
  const templatePath = path.join(TEMPLATE_CLAUDE, 'skills', skillName);
  const dooverPath = path.join(DOOVER_CLAUDE, 'skills', skillName);

  const mainSKILL = path.join(mainPath, 'SKILL.md');
  const templateSKILL = path.join(templatePath, 'SKILL.md');
  const dooverSKILL = path.join(dooverPath, 'SKILL.md');

  const mainInfo = getFileInfo(mainSKILL);
  const templateInfo = getFileInfo(templateSKILL);
  const dooverInfo = getFileInfo(dooverSKILL);

  // Check if main exists
  if (!mainInfo.exists) {
    status.errors.push({
      type: 'skill',
      name: skillName,
      issue: 'Main skill missing SKILL.md'
    });
    return;
  }

  // Check template
  if (!templateInfo.exists) {
    status.missing.push({
      type: 'skill',
      name: skillName,
      location: 'app-builder-template',
      mainTime: mainInfo.mtime
    });
  } else if (mainInfo.mtimeMs > templateInfo.mtimeMs + 1000) {
    // +1000ms tolerance for filesystem timestamp precision
    status.outdated.push({
      type: 'skill',
      name: skillName,
      location: 'app-builder-template',
      mainTime: mainInfo.mtime,
      remoteTime: templateInfo.mtime
    });
  } else if (templateInfo.mtimeMs > mainInfo.mtimeMs + 1000) {
    status.conflicts.push({
      type: 'skill',
      name: skillName,
      issue: 'Template newer than main',
      mainTime: mainInfo.mtime,
      remoteTime: templateInfo.mtime
    });
  } else {
    // In sync (close enough)
  }

  // Check do-over
  if (!dooverInfo.exists) {
    status.missing.push({
      type: 'skill',
      name: skillName,
      location: 'do-over-files',
      mainTime: mainInfo.mtime
    });
  } else if (mainInfo.mtimeMs > dooverInfo.mtimeMs + 1000) {
    status.outdated.push({
      type: 'skill',
      name: skillName,
      location: 'do-over-files',
      mainTime: mainInfo.mtime,
      remoteTime: dooverInfo.mtime
    });
  } else if (dooverInfo.mtimeMs > mainInfo.mtimeMs + 1000) {
    status.conflicts.push({
      type: 'skill',
      name: skillName,
      issue: 'Do-over newer than main',
      mainTime: mainInfo.mtime,
      remoteTime: dooverInfo.mtime
    });
  }

  // If all in sync
  if (templateInfo.exists && dooverInfo.exists &&
      Math.abs(mainInfo.mtimeMs - templateInfo.mtimeMs) <= 1000 &&
      Math.abs(mainInfo.mtimeMs - dooverInfo.mtimeMs) <= 1000) {
    status.inSync.push({ type: 'skill', name: skillName });
  }
}

function checkAgent(agentFile) {
  const mainPath = path.join(MAIN_CLAUDE, 'agents', agentFile);
  const templatePath = path.join(TEMPLATE_CLAUDE, 'agents', agentFile);
  const dooverPath = path.join(DOOVER_CLAUDE, 'agents', agentFile);

  const mainInfo = getFileInfo(mainPath);
  const templateInfo = getFileInfo(templatePath);
  const dooverInfo = getFileInfo(dooverPath);

  if (!mainInfo.exists) {
    status.errors.push({
      type: 'agent',
      name: agentFile,
      issue: 'Main agent missing'
    });
    return;
  }

  // Check template
  if (!templateInfo.exists) {
    status.missing.push({
      type: 'agent',
      name: agentFile,
      location: 'app-builder-template'
    });
  } else if (mainInfo.mtimeMs > templateInfo.mtimeMs + 1000) {
    status.outdated.push({
      type: 'agent',
      name: agentFile,
      location: 'app-builder-template',
      mainTime: mainInfo.mtime,
      remoteTime: templateInfo.mtime
    });
  } else if (templateInfo.mtimeMs > mainInfo.mtimeMs + 1000) {
    status.conflicts.push({
      type: 'agent',
      name: agentFile,
      issue: 'Template newer than main',
      mainTime: mainInfo.mtime,
      remoteTime: templateInfo.mtime
    });
  }

  // Check do-over
  if (!dooverInfo.exists) {
    status.missing.push({
      type: 'agent',
      name: agentFile,
      location: 'do-over-files'
    });
  } else if (mainInfo.mtimeMs > dooverInfo.mtimeMs + 1000) {
    status.outdated.push({
      type: 'agent',
      name: agentFile,
      location: 'do-over-files',
      mainTime: mainInfo.mtime,
      remoteTime: dooverInfo.mtime
    });
  } else if (dooverInfo.mtimeMs > mainInfo.mtimeMs + 1000) {
    status.conflicts.push({
      type: 'agent',
      name: agentFile,
      issue: 'Do-over newer than main',
      mainTime: mainInfo.mtime,
      remoteTime: dooverInfo.mtime
    });
  }

  // If all in sync
  if (templateInfo.exists && dooverInfo.exists &&
      Math.abs(mainInfo.mtimeMs - templateInfo.mtimeMs) <= 1000 &&
      Math.abs(mainInfo.mtimeMs - dooverInfo.mtimeMs) <= 1000) {
    status.inSync.push({ type: 'agent', name: agentFile });
  }
}

function printReport() {
  console.log('\\n' + '='.repeat(60));
  console.log('Trinary Sync Status Report');
  console.log('='.repeat(60) + '\\n');

  // In sync
  if (status.inSync.length > 0) {
    console.log(`✅ In Sync (${status.inSync.length} items):\\n`);

    const skillsInSync = status.inSync.filter(i => i.type === 'skill').length;
    const agentsInSync = status.inSync.filter(i => i.type === 'agent').length;

    if (skillsInSync > 0) console.log(`   - ${skillsInSync} skills`);
    if (agentsInSync > 0) console.log(`   - ${agentsInSync} agents`);
    console.log('');
  }

  // Missing
  if (status.missing.length > 0) {
    console.log(`⚠️  Missing (${status.missing.length} items):\\n`);

    status.missing.forEach(item => {
      console.log(`   - ${item.type}: ${item.name}`);
      console.log(`     Missing in: ${item.location}`);
    });
    console.log('');
  }

  // Outdated
  if (status.outdated.length > 0) {
    console.log(`⚠️  Outdated (${status.outdated.length} items):\\n`);

    status.outdated.forEach(item => {
      console.log(`   - ${item.type}: ${item.name}`);
      console.log(`     Location: ${item.location}`);
      console.log(`     Main:     ${item.mainTime.toISOString().slice(0, 19)}`);
      console.log(`     Remote:   ${item.remoteTime.toISOString().slice(0, 19)}`);
    });
    console.log('');
  }

  // Conflicts
  if (status.conflicts.length > 0) {
    console.log(`❌ Conflicts (${status.conflicts.length} items):\\n`);

    status.conflicts.forEach(item => {
      console.log(`   - ${item.type}: ${item.name}`);
      console.log(`     Issue: ${item.issue}`);
      console.log(`     Main:   ${item.mainTime.toISOString().slice(0, 19)}`);
      console.log(`     Remote: ${item.remoteTime.toISOString().slice(0, 19)}`);
      console.log(`     ACTION: Manual review needed`);
    });
    console.log('');
  }

  // Errors
  if (status.errors.length > 0) {
    console.log(`❌ Errors (${status.errors.length} items):\\n`);

    status.errors.forEach(item => {
      console.log(`   - ${item.type}: ${item.name}`);
      console.log(`     Issue: ${item.issue}`);
    });
    console.log('');
  }

  // Summary
  console.log('='.repeat(60));

  const hasIssues = status.missing.length > 0 ||
                    status.outdated.length > 0 ||
                    status.conflicts.length > 0 ||
                    status.errors.length > 0;

  if (hasIssues) {
    console.log('\\n⚠️  Directories are OUT OF SYNC\\n');

    if (status.conflicts.length > 0) {
      console.log('❌ Manual review required for conflicts');
      console.log('   Review each conflict and decide which version to keep\\n');
    }

    if (status.missing.length > 0 || status.outdated.length > 0) {
      if (FIX) {
        console.log('🔧 Auto-fixing with sync-all.js...');
        const { execSync } = require('child_process');
        const scriptPath = path.join(__dirname, 'sync-all.js');
        execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
      } else {
        console.log('Fix with: node sync-all.js');
        console.log('Or:       node check-sync.js --fix');
      }
    }

    return 1; // Exit code 1 for issues
  } else {
    console.log('\\n✅ All directories are IN SYNC\\n');
    return 0; // Exit code 0 for success
  }
}

async function main() {
  console.log('🔍 Checking trinary sync status...\\n');

  // Check if main directory exists
  if (!fs.existsSync(MAIN_CLAUDE)) {
    console.error(`❌ Error: Main Claude directory not found: ${MAIN_CLAUDE}`);
    process.exit(1);
  }

  // Check skills
  const skillsDir = path.join(MAIN_CLAUDE, 'skills');
  if (fs.existsSync(skillsDir)) {
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

    console.log(`📋 Checking ${skills.length} skills...`);
    skills.forEach(checkSkill);
  }

  // Check agents
  const agentsDir = path.join(MAIN_CLAUDE, 'agents');
  if (fs.existsSync(agentsDir)) {
    const agents = fs.readdirSync(agentsDir)
      .filter(file => file.endsWith('.md'));

    console.log(`📋 Checking ${agents.length} agents...`);
    agents.forEach(checkAgent);
  }

  // Print report
  const exitCode = printReport();
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { checkSkill, checkAgent, getFileInfo };

