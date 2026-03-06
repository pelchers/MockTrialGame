#!/usr/bin/env node
/**
 * Documentation Scaffold Generator
 * Creates complete documentation structure
 * Usage: node scaffold-docs.js project-name docs/
 */

const fs = require('fs');
const path = require('path');

const templates = {
  'README.md': (projectName) => `# ${projectName}

One-line description of the project.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

See [INSTALLATION.md](docs/INSTALLATION.md) for detailed setup.

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [API Reference](docs/API.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Architecture Overview](docs/ARCHITECTURE.md)

## License

MIT License - see [LICENSE](LICENSE)
`,

  'CONTRIBUTING.md': (projectName) => `# Contributing to ${projectName}

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork: \`git clone https://github.com/YOUR_USERNAME/${projectName}.git\`
3. Create a branch: \`git checkout -b feature/amazing-feature\`
4. Make your changes
5. Commit: \`git commit -m 'Add amazing feature'\`
6. Push: \`git push origin feature/amazing-feature\`
7. Open a Pull Request

## Code Style

- Use TypeScript
- Follow ESLint rules
- Write tests for new features
- Update documentation

## Commit Convention

- \`feat:\` New feature
- \`fix:\` Bug fix
- \`docs:\` Documentation
- \`test:\` Tests
- \`chore:\` Maintenance

## Questions?

Open an issue or start a discussion.
`,

  'CODE_OF_CONDUCT.md': () => `# Code of Conduct

## Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

## Our Standards

**Positive behavior**:
- Being respectful and inclusive
- Accepting constructive criticism
- Focusing on what's best for the community

**Unacceptable behavior**:
- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information

## Enforcement

Violations can be reported to [maintainers@example.com]. All complaints will be reviewed.

## Attribution

Adapted from the [Contributor Covenant](https://www.contributor-covenant.org/).
`,

  'docs/INSTALLATION.md': (projectName) => `# Installation Guide

Complete setup instructions for ${projectName}.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

## Step-by-Step Installation

### 1. Clone Repository

\`\`\`bash
git clone https://github.com/username/${projectName}.git
cd ${projectName}
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Environment Configuration

Create \`.env\` file:

\`\`\`env
DATABASE_URL=your_database_url
API_KEY=your_api_key
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:3000

## Troubleshooting

### Common Issues

**Issue**: Dependency installation fails
**Solution**: Clear npm cache: \`npm cache clean --force\`

**Issue**: Port 3000 already in use
**Solution**: Kill process or use different port: \`PORT=3001 npm run dev\`
`,

  'docs/API.md': (projectName) => `# API Documentation

Complete API reference for ${projectName}.

## Base URL

\`\`\`
Development: http://localhost:3000/api
Production: https://api.example.com
\`\`\`

## Authentication

Include API key in Authorization header:

\`\`\`http
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### GET /api/resource

Description of endpoint.

**Response**:

\`\`\`json
{
  "data": [],
  "meta": {}
}
\`\`\`

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |
`,

  'docs/ARCHITECTURE.md': (projectName) => `# Architecture Overview

Technical architecture of ${projectName}.

## System Design

\`\`\`
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
┌──────▼──────┐
│   Server    │
└──────┬──────┘
       │
┌──────▼──────┐
│  Database   │
└─────────────┘
\`\`\`

## Technology Stack

- Frontend: Next.js
- Backend: Node.js
- Database: PostgreSQL

## Project Structure

\`\`\`
project/
├── app/           # Application code
├── components/    # React components
├── lib/           # Utilities
└── docs/          # Documentation
\`\`\`

## Design Decisions

See [ADRs](adr/) for architectural decisions.
`,

  'docs/DEPLOYMENT.md': (projectName) => `# Deployment Guide

How to deploy ${projectName} to production.

## Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Manual Deployment

### Build

\`\`\`bash
npm run build
\`\`\`

### Start

\`\`\`bash
npm start
\`\`\`

## Environment Variables

Set these in your hosting platform:

- \`DATABASE_URL\`
- \`API_KEY\`
- \`NODE_ENV=production\`

## Monitoring

- Error tracking: Sentry
- Analytics: Vercel Analytics
- Uptime: UptimeRobot
`,

  'docs/CHANGELOG.md': () => `# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Added
- Initial release

## [1.0.0] - ${new Date().toISOString().split('T')[0]}

### Added
- Project initialization
- Basic features
- Documentation
`
};

function scaffoldDocs(projectName, outputDir) {
  const created = [];

  Object.entries(templates).forEach(([filename, templateFn]) => {
    const filePath = path.join(outputDir, filename);
    const fileDir = path.dirname(filePath);

    // Create directory if needed
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }

    // Generate content
    const content = templateFn(projectName);

    // Write file
    fs.writeFileSync(filePath, content);
    created.push(filePath);
  });

  return created;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node scaffold-docs.js <project-name> <output-dir>');
    console.error('Example: node scaffold-docs.js my-project docs/');
    process.exit(1);
  }

  const [projectName, outputDir] = args;

  console.log(`📚 Scaffolding documentation for ${projectName}...`);

  const created = scaffoldDocs(projectName, outputDir);

  console.log(`\n✅ Created ${created.length} documentation files:\n`);
  created.forEach(file => {
    console.log(`   📄 ${file}`);
  });

  console.log(`\n💡 Next steps:`);
  console.log(`   1. Review and customize README.md`);
  console.log(`   2. Update INSTALLATION.md with specific setup steps`);
  console.log(`   3. Document API endpoints in API.md`);
  console.log(`   4. Fill in ARCHITECTURE.md with your tech stack`);
  console.log(`   5. Set up CHANGELOG.md workflow`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { scaffoldDocs };

