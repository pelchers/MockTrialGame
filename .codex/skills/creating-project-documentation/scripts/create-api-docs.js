#!/usr/bin/env node
/**
 * API Documentation Generator
 * Scans code for API routes and generates documentation
 * Usage: node create-api-docs.js src/ docs/api.md
 */

const fs = require('fs');
const path = require('path');

function findApiRoutes(directory, baseDir = directory, routes = []) {
  if (!fs.existsSync(directory)) {
    return routes;
  }

  const items = fs.readdirSync(directory);

  items.forEach(item => {
    const fullPath = path.join(directory, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findApiRoutes(fullPath, baseDir, routes);
    } else if (item === 'route.ts' || item === 'route.js') {
      const relativePath = path.relative(baseDir, directory);
      const routePath = `/${relativePath.replace(/\\/g, '/')}`;

      // Read file to detect HTTP methods
      const content = fs.readFileSync(fullPath, 'utf-8');
      const methods = [];

      if (content.includes('export async function GET') || content.includes('export function GET')) {
        methods.push('GET');
      }
      if (content.includes('export async function POST') || content.includes('export function POST')) {
        methods.push('POST');
      }
      if (content.includes('export async function PUT') || content.includes('export function PUT')) {
        methods.push('PUT');
      }
      if (content.includes('export async function PATCH') || content.includes('export function PATCH')) {
        methods.push('PATCH');
      }
      if (content.includes('export async function DELETE') || content.includes('export function DELETE')) {
        methods.push('DELETE');
      }

      routes.push({
        path: routePath,
        methods,
        file: fullPath
      });
    }
  });

  return routes;
}

function generateApiDocs(sourceDir) {
  const routes = findApiRoutes(sourceDir);

  let docs = `# API Documentation\n\n`;
  docs += `Generated: ${new Date().toLocaleDateString()}\n\n`;
  docs += `Base URL: \`http://localhost:3000/api\`\n\n`;

  docs += `## Authentication\n\n`;
  docs += `Most endpoints require authentication. Include your API key in the Authorization header:\n\n`;
  docs += `\`\`\`http\n`;
  docs += `Authorization: Bearer YOUR_API_KEY\n`;
  docs += `\`\`\`\n\n`;

  docs += `---\n\n`;

  docs += `## Endpoints\n\n`;

  if (routes.length === 0) {
    docs += `_No API routes found in ${sourceDir}_\n\n`;
    docs += `Create API routes in \`app/api/\` or \`pages/api/\` directories.\n`;
    return docs;
  }

  // Group by base path
  const grouped = {};
  routes.forEach(route => {
    const parts = route.path.split('/').filter(p => p);
    const baseResource = parts[1] || 'root';

    if (!grouped[baseResource]) {
      grouped[baseResource] = [];
    }

    grouped[baseResource].push(route);
  });

  Object.keys(grouped).sort().forEach(resource => {
    docs += `### ${resource.charAt(0).toUpperCase() + resource.slice(1)}\n\n`;

    grouped[resource].forEach(route => {
      route.methods.forEach(method => {
        docs += `#### ${method} ${route.path}\n\n`;

        docs += `**Description**: _Add description_\n\n`;

        if (method === 'GET') {
          docs += `**Query Parameters**:\n\n`;
          docs += `| Parameter | Type | Required | Description |\n`;
          docs += `|-----------|------|----------|-------------|\n`;
          docs += `| \`page\` | integer | No | Page number (default: 1) |\n`;
          docs += `| \`limit\` | integer | No | Items per page (default: 20) |\n\n`;
        } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
          docs += `**Request Body**:\n\n`;
          docs += `\`\`\`json\n`;
          docs += `{\n`;
          docs += `  "field1": "value",\n`;
          docs += `  "field2": "value"\n`;
          docs += `}\n`;
          docs += `\`\`\`\n\n`;
        }

        docs += `**Response**:\n\n`;
        docs += `\`\`\`json\n`;
        docs += `{\n`;
        docs += `  "data": {},\n`;
        docs += `  "meta": {}\n`;
        docs += `}\n`;
        docs += `\`\`\`\n\n`;

        docs += `**Status Codes**:\n`;
        docs += `- \`200\` - Success\n`;
        docs += `- \`400\` - Bad Request\n`;
        docs += `- \`401\` - Unauthorized\n`;
        docs += `- \`404\` - Not Found\n`;
        docs += `- \`500\` - Server Error\n\n`;

        docs += `---\n\n`;
      });
    });
  });

  docs += `## Error Responses\n\n`;
  docs += `All errors follow this format:\n\n`;
  docs += `\`\`\`json\n`;
  docs += `{\n`;
  docs += `  "error": {\n`;
  docs += `    "code": "ERROR_CODE",\n`;
  docs += `    "message": "Human-readable message",\n`;
  docs += `    "details": {}\n`;
  docs += `  }\n`;
  docs += `}\n`;
  docs += `\`\`\`\n\n`;

  return docs;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node create-api-docs.js <source-dir> <output.md>');
    console.error('Example: node create-api-docs.js app/api docs/api.md');
    process.exit(1);
  }

  const [sourceDir, outputPath] = args;

  console.log('📚 Scanning for API routes...');

  const docs = generateApiDocs(sourceDir);

  // Create directory if needed
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, docs);

  console.log(`\n✅ API documentation created: ${outputPath}`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Add descriptions for each endpoint`);
  console.log(`   2. Document request/response schemas`);
  console.log(`   3. Add example requests and responses`);
  console.log(`   4. Document authentication requirements`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findApiRoutes, generateApiDocs };

