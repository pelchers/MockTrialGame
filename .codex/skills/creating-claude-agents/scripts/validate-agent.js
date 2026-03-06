#!/usr/bin/env node

/**
 * Agent Configuration Validator
 *
 * Validates Claude Code agent YAML configuration and file structure.
 *
 * Usage: node validate-agent.js path/to/agent.md
 */

const fs = require('fs');
const path = require('path');

// Validation rules
const VALID_MODELS = [
  'claude-sonnet-4-5',
  'claude-opus-4-5',
  'claude-sonnet-4',
  'claude-opus-4',
];

const VALID_PERMISSION_MODES = ['auto', 'full', 'manual'];

const AVAILABLE_TOOLS = [
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  'Bash',
  'LSP',
  'WebFetch',
  'WebSearch',
  'TodoWrite',
  'Skill',
  'NotebookEdit',
];

// YAML frontmatter parser
function parseYamlFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { error: 'No YAML frontmatter found' };
  }

  const yamlContent = match[1];
  const config = {};

  // Parse simple YAML (key: value and arrays)
  const lines = yamlContent.split('\n');
  let currentKey = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check for array items
    if (trimmed.startsWith('-')) {
      if (currentKey) {
        if (!Array.isArray(config[currentKey])) {
          config[currentKey] = [];
        }
        config[currentKey].push(trimmed.substring(1).trim());
      }
    } else {
      // Key-value pair
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();

        if (value) {
          config[key] = value;
        } else {
          currentKey = key;
          config[key] = [];
        }
      }
    }
  }

  return config;
}

// Validation functions
function validateRequiredFields(config) {
  const errors = [];
  const required = ['name', 'description', 'model', 'permissionMode'];

  for (const field of required) {
    if (!config[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return errors;
}

function validateModel(config) {
  if (!config.model) return [];

  if (!VALID_MODELS.includes(config.model)) {
    return [`Invalid model: ${config.model}. Must be one of: ${VALID_MODELS.join(', ')}`];
  }

  return [];
}

function validatePermissionMode(config) {
  if (!config.permissionMode) return [];

  if (!VALID_PERMISSION_MODES.includes(config.permissionMode)) {
    return [`Invalid permissionMode: ${config.permissionMode}. Must be one of: ${VALID_PERMISSION_MODES.join(', ')}`];
  }

  return [];
}

function validateTools(config) {
  if (!config.tools || !Array.isArray(config.tools)) {
    return []; // Tools are optional
  }

  const errors = [];

  for (const tool of config.tools) {
    if (!AVAILABLE_TOOLS.includes(tool)) {
      errors.push(`Invalid tool: ${tool}. Available tools: ${AVAILABLE_TOOLS.join(', ')}`);
    }
  }

  return errors;
}

function validateNaming(config, filename) {
  const errors = [];

  // Check filename convention
  if (!filename.endsWith('-agent.md')) {
    errors.push('Agent filename should end with -agent.md (e.g., database-agent.md)');
  }

  // Check name convention
  if (config.name && !config.name.includes('Agent')) {
    errors.push('Agent name should include "Agent" (e.g., "Database Agent")');
  }

  return errors;
}

function validateDescription(config) {
  if (!config.description) return [];

  const errors = [];

  if (config.description.length < 20) {
    errors.push('Description is too short (minimum 20 characters)');
  }

  if (config.description.length > 1024) {
    errors.push('Description exceeds maximum length (1024 characters)');
  }

  return errors;
}

// Main validation
function validateAgent(filePath) {
  console.log(`\nValidating agent: ${filePath}\n`);

  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error('❌ File not found:', filePath);
    return false;
  }

  // Read file
  const content = fs.readFileSync(filePath, 'utf-8');
  const filename = path.basename(filePath);

  // Parse YAML
  const config = parseYamlFrontmatter(content);

  if (config.error) {
    console.error('❌ YAML Parse Error:', config.error);
    return false;
  }

  // Run validations
  const allErrors = [
    ...validateRequiredFields(config),
    ...validateModel(config),
    ...validatePermissionMode(config),
    ...validateTools(config),
    ...validateNaming(config, filename),
    ...validateDescription(config),
  ];

  // Report results
  if (allErrors.length === 0) {
    console.log('✅ Agent configuration is valid!\n');
    console.log('Configuration:');
    console.log('  Name:', config.name);
    console.log('  Model:', config.model);
    console.log('  Permission Mode:', config.permissionMode);
    console.log('  Tools:', config.tools?.join(', ') || 'None');
    console.log('  Skills:', config.skills?.join(', ') || 'None');
    return true;
  } else {
    console.error('❌ Validation failed with', allErrors.length, 'error(s):\n');
    allErrors.forEach((error, i) => {
      console.error(`  ${i + 1}. ${error}`);
    });
    return false;
  }
}

// CLI execution
if (require.main === module) {
  const agentPath = process.argv[2];

  if (!agentPath) {
    console.error('Usage: node validate-agent.js path/to/agent.md');
    process.exit(1);
  }

  const isValid = validateAgent(agentPath);
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateAgent, parseYamlFrontmatter };

