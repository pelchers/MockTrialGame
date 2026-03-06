#!/usr/bin/env node
/**
 * Requirements Analysis Script
 * Extracts and categorizes requirements from assignment text
 * Usage: node analyze-requirements.js assignment.txt requirements.json
 */

const fs = require('fs');

function extractRequirements(text) {
  const requirements = {
    deliverables: [],
    constraints: [],
    gradingCriteria: [],
    dueDate: null
  };

  // Extract due date
  const datePattern = /due\s+(?:date|on|by)?:?\s*(\w+\s+\d{1,2},?\s+\d{4})/i;
  const dateMatch = text.match(datePattern);
  if (dateMatch) requirements.dueDate = dateMatch[1];

  // Extract page/word count
  const lengthPattern = /(\d+)[-\s]*(page|word)s?/gi;
  const lengths = [...text.matchAll(lengthPattern)];
  lengths.forEach(match => {
    requirements.constraints.push({
      type: match[2].toLowerCase() + '_count',
      value: parseInt(match[1])
    });
  });

  // Extract source requirements
  const sourcePattern = /(\d+)\s+(?:academic\s+)?sources?/i;
  const sourceMatch = text.match(sourcePattern);
  if (sourceMatch) {
    requirements.constraints.push({
      type: 'minimum_sources',
      value: parseInt(sourceMatch[1])
    });
  }

  return requirements;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node analyze-requirements.js <assignment.txt> <requirements.json>');
    process.exit(1);
  }

  const [inputPath, outputPath] = args;
  const text = fs.readFileSync(inputPath, 'utf-8');

  console.log('🔍 Analyzing assignment requirements...');
  const requirements = extractRequirements(text);

  fs.writeFileSync(outputPath, JSON.stringify(requirements, null, 2));
  console.log(`✅ Requirements extracted: ${outputPath}`);
}

if (require.main === module) {
  main().catch(console.error);
}

