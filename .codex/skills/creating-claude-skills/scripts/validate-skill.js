#!/usr/bin/env node

/**
 * Validates Claude Code skill structure
 * Usage: node validate-skill.js path/to/skill-folder
 */

const fs = require('fs');
const path = require('path');

function validateSkill(skillPath) {
  const errors = [];
  const warnings = [];

  // Check if directory exists
  if (!fs.existsSync(skillPath)) {
    errors.push(`Skill directory does not exist: ${skillPath}`);
    return { valid: false, errors, warnings };
  }

  // Check for SKILL.md
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    errors.push('Missing required SKILL.md file');
    return { valid: false, errors, warnings };
  }

  // Read SKILL.md
  const content = fs.readFileSync(skillMdPath, 'utf-8');
  const lines = content.split('\n');

  // Check YAML frontmatter
  if (!content.startsWith('---\n')) {
    errors.push('SKILL.md must start with YAML frontmatter (---)');
  } else {
    const frontmatterEnd = content.indexOf('\n---\n', 4);
    if (frontmatterEnd === -1) {
      errors.push('YAML frontmatter not properly closed');
    } else {
      const frontmatter = content.substring(4, frontmatterEnd);

      // Check for required fields
      if (!frontmatter.includes('name:')) {
        errors.push('Missing required "name" field in frontmatter');
      } else {
        const nameLine = frontmatter.split('\n').find(l => l.startsWith('name:'));
        const name = nameLine.split(':')[1].trim();

        // Check gerund naming
        if (!name.endsWith('ing') && !name.includes('-ing-')) {
          warnings.push(`Name "${name}" does not follow gerund form (verb + -ing). Consider: processing-*, analyzing-*, managing-*, etc.`);
        }
      }

      if (!frontmatter.includes('description:')) {
        errors.push('Missing required "description" field in frontmatter');
      } else {
        const descLine = frontmatter.split('\n').find(l => l.startsWith('description:'));
        const desc = descLine.split(':').slice(1).join(':').trim();

        // Check description length
        if (desc.length > 1024) {
          errors.push(`Description is ${desc.length} characters (max 1024)`);
        }

        // Check if description includes "when to use"
        if (!desc.toLowerCase().includes('use when') && !desc.toLowerCase().includes('when working')) {
          warnings.push('Description should include WHEN to use the skill (e.g., "Use when...")');
        }
      }

      // Check for extra fields
      const validFields = ['name', 'description'];
      frontmatter.split('\n').forEach(line => {
        const field = line.split(':')[0].trim();
        if (field && !validFields.includes(field)) {
          warnings.push(`Unexpected field in frontmatter: "${field}". Only "name" and "description" are allowed.`);
        }
      });
    }
  }

  // Check file length
  if (lines.length > 500) {
    warnings.push(`SKILL.md has ${lines.length} lines (recommended < 500). Consider moving content to resources/`);
  }

  // Check for first/second person
  const firstPerson = /(^|\s)(I|we|my|our|you|your)(\s|')/gi;
  const matches = content.match(firstPerson);
  if (matches && matches.length > 5) {
    warnings.push('Consider using third person instead of first/second person ("Processes files" instead of "I can help you process")');
  }

  // Check for backslashes in paths
  if (content.includes('\\') && !content.includes('\\\\')) {
    warnings.push('Use forward slashes (/) for paths instead of backslashes (\\)');
  }

  // Check scripts directory
  const scriptsPath = path.join(skillPath, 'scripts');
  if (fs.existsSync(scriptsPath)) {
    const scriptFiles = fs.readdirSync(scriptsPath);
    if (scriptFiles.length === 0) {
      warnings.push('scripts/ directory is empty. Consider removing it or adding utilities.');
    }
  }

  // Check resources directory
  const resourcesPath = path.join(skillPath, 'resources');
  if (fs.existsSync(resourcesPath)) {
    const resourceFiles = fs.readdirSync(resourcesPath);
    if (resourceFiles.length === 0) {
      warnings.push('resources/ directory is empty. Consider removing it or adding reference docs.');
    }
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings };
}

// CLI usage
if (require.main === module) {
  const skillPath = process.argv[2];

  if (!skillPath) {
    console.error('Usage: node validate-skill.js path/to/skill-folder');
    process.exit(1);
  }

  console.log(`Validating skill: ${skillPath}\n`);

  const result = validateSkill(skillPath);

  if (result.errors.length > 0) {
    console.error('❌ ERRORS:');
    result.errors.forEach(err => console.error(`  - ${err}`));
    console.error('');
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  WARNINGS:');
    result.warnings.forEach(warn => console.warn(`  - ${warn}`));
    console.warn('');
  }

  if (result.valid) {
    console.log('✅ Skill validation passed!');
    if (result.warnings.length > 0) {
      console.log('   (with warnings - consider addressing them)');
    }
    process.exit(0);
  } else {
    console.error('❌ Skill validation failed!');
    process.exit(1);
  }
}

module.exports = { validateSkill };

