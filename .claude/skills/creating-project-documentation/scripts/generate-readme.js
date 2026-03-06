#!/usr/bin/env node
/**
 * README Generator
 * Creates comprehensive README.md from package.json and project structure
 * Usage: node generate-readme.js package.json README.md
 */

const fs = require('fs');
const path = require('path');

function generateReadme(packageJson, projectPath = '.') {
  const pkg = typeof packageJson === 'string'
    ? JSON.parse(fs.readFileSync(packageJson, 'utf-8'))
    : packageJson;

  const projectName = pkg.name || 'Project';
  const description = pkg.description || 'A software project';
  const version = pkg.version || '1.0.0';
  const license = pkg.license || 'MIT';

  let readme = `# ${projectName}\n\n`;

  // Badges
  readme += `[![License](https://img.shields.io/badge/license-${license}-blue.svg)]()\n`;
  readme += `[![Version](https://img.shields.io/badge/version-${version}-green.svg)]()\n\n`;

  readme += `${description}\n\n`;

  // Features (placeholder)
  readme += `## Features\n\n`;
  readme += `- Feature 1\n`;
  readme += `- Feature 2\n`;
  readme += `- Feature 3\n\n`;

  // Quick Start
  readme += `## Quick Start\n\n`;
  readme += `\`\`\`bash\n`;
  readme += `# Clone repository\n`;
  readme += `git clone https://github.com/username/${projectName}.git\n`;
  readme += `cd ${projectName}\n\n`;

  // Installation command
  const packageManager = pkg.packageManager?.split('@')[0] || 'npm';
  readme += `# Install dependencies\n`;
  readme += `${packageManager} install\n\n`;

  // Environment setup if .env.example exists
  readme += `# Set up environment variables\n`;
  readme += `cp .env.example .env\n`;
  readme += `# Edit .env with your values\n\n`;

  // Dev server
  const devScript = pkg.scripts?.dev || 'dev';
  readme += `# Run development server\n`;
  readme += `${packageManager} run ${devScript}\n`;
  readme += `\`\`\`\n\n`;

  readme += `Visit [http://localhost:3000](http://localhost:3000)\n\n`;

  // Installation
  readme += `## Installation\n\n`;
  readme += `### Prerequisites\n\n`;

  // Detect tech stack from dependencies
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps.next || deps.react) {
    readme += `- Node.js 18+ ([Download](https://nodejs.org))\n`;
  }
  if (deps.postgresql || deps.pg || deps['@prisma/client']) {
    readme += `- PostgreSQL 14+ ([Download](https://postgresql.org))\n`;
  }

  readme += `- Git ([Download](https://git-scm.com))\n\n`;

  // Scripts
  if (pkg.scripts && Object.keys(pkg.scripts).length > 0) {
    readme += `## Scripts\n\n`;
    readme += `| Command | Description |\n`;
    readme += `|---------|-------------|\n`;

    Object.entries(pkg.scripts).forEach(([name, script]) => {
      const description = getScriptDescription(name);
      readme += `| \`${packageManager} run ${name}\` | ${description} |\n`;
    });

    readme += `\n`;
  }

  // Tech Stack
  readme += `## Technology Stack\n\n`;

  if (deps.next) readme += `- **Frontend**: Next.js\n`;
  else if (deps.react) readme += `- **Frontend**: React\n`;

  if (deps.convex) readme += `- **Backend**: Convex\n`;
  else if (deps.express) readme += `- **Backend**: Express\n`;

  if (deps['@clerk/nextjs'] || deps['@clerk/clerk-sdk-node']) {
    readme += `- **Authentication**: Clerk\n`;
  }

  if (deps.tailwindcss) readme += `- **Styling**: Tailwind CSS\n`;
  if (deps.typescript) readme += `- **Language**: TypeScript\n`;

  readme += `\n`;

  // Contributing
  readme += `## Contributing\n\n`;
  readme += `Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.\n\n`;

  // License
  readme += `## License\n\n`;
  readme += `This project is licensed under the ${license} License - see [LICENSE](LICENSE) file.\n\n`;

  // Support
  if (pkg.repository) {
    const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository.url;
    readme += `## Support\n\n`;
    readme += `- **Issues**: [GitHub Issues](${repo}/issues)\n`;
    readme += `- **Discussions**: [GitHub Discussions](${repo}/discussions)\n`;
  }

  return readme;
}

function getScriptDescription(scriptName) {
  const descriptions = {
    dev: 'Start development server',
    build: 'Build for production',
    start: 'Start production server',
    test: 'Run tests',
    lint: 'Lint code',
    format: 'Format code',
    'type-check': 'Check TypeScript types',
    deploy: 'Deploy to production'
  };

  return descriptions[scriptName] || scriptName;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node generate-readme.js <package.json> <README.md>');
    process.exit(1);
  }

  const [packagePath, outputPath] = args;

  if (!fs.existsSync(packagePath)) {
    console.error(`Error: File not found: ${packagePath}`);
    process.exit(1);
  }

  console.log('📝 Generating README...');

  const readme = generateReadme(packagePath);

  fs.writeFileSync(outputPath, readme);

  console.log(`\n✅ README created: ${outputPath}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Add project-specific features list`);
  console.log(`   2. Add screenshots or demo link`);
  console.log(`   3. Update installation prerequisites`);
  console.log(`   4. Add usage examples`);
  console.log(`   5. Customize badges and links`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateReadme };

