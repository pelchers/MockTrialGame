#!/usr/bin/env node

/**
 * Trinary Sync - Sync Single Skill
 *
 * Synchronizes a single skill across three locations:
 * 1. Main app: <PROJECT_ROOT>/.claude/skills/
 * 2. App builder template: <PROJECT_ROOT>/app-builder-template/.claude/skills/
 * 3. Do-over files: <PROJECT_ROOT>/do-over-files/.claude/skills/
 *
 * Usage:
 *   node sync-skill.js designing-convex-schemas
 *   node sync-skill.js designing-convex-schemas --force
 *   node sync-skill.js designing-convex-schemas --base-dir /path/to/project
 */

const fs = require('fs');
const path = require('path');

// Base paths - resolve dynamically
// Accepts --base-dir <path> or derives project root from script location
// Script lives at <PROJECT_ROOT>/.codex/skills/maintaining-trinary-sync/scripts/
function resolveBaseDir() {
  const idx = process.argv.indexOf('--base-dir');
  if (idx !== -1 && process.argv[idx + 1]) {
    return path.resolve(process.argv[idx + 1]);
  }
  return path.resolve(__dirname, '..', '..', '..', '..');
}
const BASE_DIR = resolveBaseDir();
const MAIN_SKILLS = path.join(BASE_DIR, '.claude', 'skills');
const TEMPLATE_SKILLS = path.join(BASE_DIR, 'app-builder-template', '.claude', 'skills');
const DOOVER_SKILLS = path.join(BASE_DIR, 'do-over-files', '.claude', 'skills');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source directory not found: ${src}`);
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
      const destDir = path.dirname(destPath);
      ensureDir(destDir);
      fs.copyFileSync(srcPath, destPath);
      copiedCount++;
    }
  }

  return copiedCount;
}

function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      mtime: stats.mtime,
      size: stats.size
    };
  } catch {
    return { exists: false };
  }
}

function checkNewer(srcDir, destDir) {
  const srcSKILL = path.join(srcDir, 'SKILL.md');
  const destSKILL = path.join(destDir, 'SKILL.md');

  const srcStats = getFileStats(srcSKILL);
  const destStats = getFileStats(destSKILL);

  if (!srcStats.exists) {
    throw new Error('Source SKILL.md not found');
  }

  if (!destStats.exists) {
    return { needsSync: true, reason: 'destination missing' };
  }

  if (destStats.mtime > srcStats.mtime) {
    return {
      needsSync: false,
      isNewer: true,
      srcTime: srcStats.mtime,
      destTime: destStats.mtime
    };
  }

  return { needsSync: true, reason: 'source is newer or same' };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node sync-skill.js <skill-name> [--force]');
    console.error('\\nExample:');
    console.error('  node sync-skill.js designing-convex-schemas');
    process.exit(1);
  }

  const skillName = args[0];
  const force = args.includes('--force');

  console.log(`🔄 Syncing skill: ${skillName}\\n`);

  // Validate source exists
  const srcSkill = path.join(MAIN_SKILLS, skillName);
  if (!fs.existsSync(srcSkill)) {
    console.error(`❌ Error: Skill not found: ${srcSkill}`);
    process.exit(1);
  }

  // Validate SKILL.md exists
  const srcSKILL = path.join(srcSkill, 'SKILL.md');
  if (!fs.existsSync(srcSKILL)) {
    console.error(`❌ Error: SKILL.md not found in ${skillName}`);
    process.exit(1);
  }

  // Check template
  const templateDest = path.join(TEMPLATE_SKILLS, skillName);
  const templateCheck = checkNewer(srcSkill, templateDest);

  if (!force && templateCheck.isNewer) {
    console.error(`⚠️  Template version is newer than main!`);
    console.error(`   Main:     ${templateCheck.srcTime.toISOString()}`);
    console.error(`   Template: ${templateCheck.destTime.toISOString()}`);
    console.error(`\\n   Use --force to overwrite, or copy from template to main first.`);
    process.exit(1);
  }

  // Check do-over
  const dooverDest = path.join(DOOVER_SKILLS, skillName);
  const dooverCheck = checkNewer(srcSkill, dooverDest);

  if (!force && dooverCheck.isNewer) {
    console.error(`⚠️  Do-over version is newer than main!`);
    console.error(`   Main:     ${dooverCheck.srcTime.toISOString()}`);
    console.error(`   Do-over:  ${dooverCheck.destTime.toISOString()}`);
    console.error(`\\n   Use --force to overwrite, or copy from do-over to main first.`);
    process.exit(1);
  }

  try {
    // Sync to template
    console.log('📋 Syncing to app-builder-template...');
    const templateCopied = copyDirectory(srcSkill, templateDest);
    console.log(`   ✅ Copied ${templateCopied} files`);

    // Sync to do-over
    console.log('📋 Syncing to do-over-files...');
    const dooverCopied = copyDirectory(srcSkill, dooverDest);
    console.log(`   ✅ Copied ${dooverCopied} files`);

    console.log(`\\n✅ Successfully synced ${skillName} to all locations!`);
    console.log('\\nLocations:');
    console.log(`  - ${templateDest}`);
    console.log(`  - ${dooverDest}`);

  } catch (error) {
    console.error(`\\n❌ Error during sync: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { copyDirectory, checkNewer };

