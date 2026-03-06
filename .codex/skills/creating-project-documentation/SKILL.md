---
name: creating-project-documentation
description: Generates comprehensive project documentation including README files, API docs, setup guides, contributing guidelines, and code documentation. Use when starting projects, preparing for open source, onboarding developers, or maintaining documentation.
---

# Creating Project Documentation

Complete framework for creating clear, comprehensive project documentation that helps developers get started quickly.

## What This Skill Does

Transforms code into accessible documentation:

- **README generation**: Project overview, setup, usage
- **API documentation**: Endpoints, parameters, responses
- **Setup guides**: Installation, configuration, deployment
- **Contributing guidelines**: How to contribute, code standards
- **Code comments**: JSDoc, docstrings, inline documentation
- **Changelog maintenance**: Version history, release notes

## Quick Start

### Generate README

```bash
node scripts/generate-readme.js package.json README.md
```

### Create API Documentation

```bash
node scripts/create-api-docs.js src/ docs/api.md
```

### Scaffold Documentation

```bash
node scripts/scaffold-docs.js project-name docs/
```

---

## Documentation Workflow

```mermaid
graph TD
    A[Codebase] --> B[Analyze Structure]
    B --> C[Generate README]
    C --> D[Document APIs]

    D --> E[Create Setup Guide]
    E --> F[Write Contributing Guide]
    F --> G[Add Code Comments]

    G --> H[Generate Changelog]
    H --> I[Review & Refine]

    I --> J{Complete?}
    J -->|No| B
    J -->|Yes| K[Publish Docs]

    style K fill:#99ff99
```

---

## README Template

### Essential Structure

```markdown
# Project Name

[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)]()

One-line description of what this project does.

## Features

- Feature 1
- Feature 2
- Feature 3
- Feature 4

## Demo

![Screenshot](docs/screenshot.png)

**Live Demo**: [https://demo.example.com](https://demo.example.com)

## Quick Start

\`\`\`bash
# Clone repository
git clone https://github.com/username/project.git
cd project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Run development server
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000)

## Installation

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org))
- PostgreSQL 14+ ([Download](https://postgresql.org))
- Git ([Download](https://git-scm.com))

### Step-by-Step Setup

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/username/project.git
   cd project
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Configuration**

   Create \`.env\` file:
   \`\`\`env
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   SECRET_KEY=your-secret-key
   \`\`\`

4. **Database Setup**
   \`\`\`bash
   npm run db:migrate
   npm run db:seed
   \`\`\`

5. **Run Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

## Usage

### Basic Example

\`\`\`typescript
import { createUser } from '@/lib/users';

const user = await createUser({
  email: 'user@example.com',
  name: 'John Doe'
});
\`\`\`

### Advanced Features

[Link to detailed usage documentation]

## API Reference

See [API Documentation](docs/api.md) for complete API reference.

### Quick Reference

\`\`\`
GET    /api/users      - List users
POST   /api/users      - Create user
GET    /api/users/:id  - Get user
PATCH  /api/users/:id  - Update user
DELETE /api/users/:id  - Delete user
\`\`\`

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| \`DATABASE_URL\` | PostgreSQL connection string | Yes | - |
| \`API_KEY\` | Third-party API key | Yes | - |
| \`PORT\` | Server port | No | 3000 |
| \`NODE_ENV\` | Environment | No | development |

### Configuration Files

- \`next.config.js\` - Next.js configuration
- \`tsconfig.json\` - TypeScript settings
- \`.eslintrc.js\` - Linting rules

## Scripts

| Command | Description |
|---------|-------------|
| \`npm run dev\` | Start development server |
| \`npm run build\` | Build for production |
| \`npm start\` | Start production server |
| \`npm test\` | Run tests |
| \`npm run lint\` | Lint code |
| \`npm run format\` | Format code with Prettier |

## Project Structure

\`\`\`
project/
├── app/                 # Next.js app directory
│   ├── (auth)/         # Authentication routes
│   ├── (dashboard)/    # Dashboard routes
│   └── api/            # API routes
├── components/         # React components
│   ├── ui/            # UI primitives
│   └── features/      # Feature components
├── lib/               # Utility functions
├── convex/            # Backend (Convex)
├── public/            # Static assets
├── docs/              # Documentation
└── tests/             # Test files
\`\`\`

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Convex (serverless)
- **Database**: Convex (built-in)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS, shadcn/ui
- **Deployment**: Vercel

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit changes (\`git commit -m 'Add amazing feature'\`)
4. Push to branch (\`git push origin feature/amazing-feature\`)
5. Open Pull Request

## Testing

\`\`\`bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test path/to/test.ts
\`\`\`

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/username/project)

### Manual Deployment

1. Build production bundle:
   \`\`\`bash
   npm run build
   \`\`\`

2. Set environment variables in hosting platform

3. Deploy:
   \`\`\`bash
   npm start
   \`\`\`

See [Deployment Guide](docs/deployment.md) for platform-specific instructions.

## Troubleshooting

### Common Issues

**Issue**: Database connection fails
**Solution**: Check \`DATABASE_URL\` format and database is running

**Issue**: Build errors with TypeScript
**Solution**: Run \`npm run type-check\` and fix type errors

See [Troubleshooting Guide](docs/troubleshooting.md) for more help.

## Roadmap

- [ ] Feature 1 (Q1 2024)
- [ ] Feature 2 (Q2 2024)
- [ ] Feature 3 (Q3 2024)

See [ROADMAP.md](ROADMAP.md) for detailed plans.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## Acknowledgments

- [Library 1](https://github.com/...) - Description
- [Library 2](https://github.com/...) - Description

## Support

- **Documentation**: [https://docs.example.com](https://docs.example.com)
- **Issues**: [GitHub Issues](https://github.com/username/project/issues)
- **Discussions**: [GitHub Discussions](https://github.com/username/project/discussions)
- **Email**: support@example.com

## Contributors

Thanks to these wonderful people:

<!-- ALL-CONTRIBUTORS-LIST:START -->
[See all contributors](CONTRIBUTORS.md)
<!-- ALL-CONTRIBUTORS-LIST:END -->

---

**Made with by [Your Name](https://github.com/username)**
```

---

## API Documentation

### OpenAPI/Swagger Format

```yaml
openapi: 3.0.0
info:
  title: Project API
  version: 1.0.0
  description: Complete API reference

servers:
  - url: https://api.example.com
    description: Production
  - url: http://localhost:3000/api
    description: Development

paths:
  /users:
    get:
      summary: List users
      tags:
        - Users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  meta:
                    $ref: '#/components/schemas/PaginationMeta'

    post:
      summary: Create user
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserInput'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        name:
          type: string
        createdAt:
          type: string
          format: date-time

    CreateUserInput:
      type: object
      required:
        - email
        - name
      properties:
        email:
          type: string
          format: email
        name:
          type: string
```

### Markdown API Docs

```markdown
# API Documentation

Base URL: \`https://api.example.com\`

## Authentication

All endpoints require Bearer token authentication:

\`\`\`http
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### Users

#### List Users

\`GET /api/users\`

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`page\` | integer | No | Page number (default: 1) |
| \`limit\` | integer | No | Items per page (default: 20) |
| \`search\` | string | No | Search by name or email |

**Response**:

\`\`\`json
{
  "data": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
\`\`\`

**Status Codes**:
- \`200\` - Success
- \`400\` - Invalid parameters
- \`401\` - Unauthorized
- \`500\` - Server error

---

#### Create User

\`POST /api/users\`

**Request Body**:

\`\`\`json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user"
}
\`\`\`

**Response**:

\`\`\`json
{
  "id": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`

**Validation Rules**:
- \`email\`: Valid email format, unique
- \`name\`: 2-50 characters
- \`role\`: One of: user, admin, moderator

**Status Codes**:
- \`201\` - Created
- \`400\` - Validation error
- \`409\` - Email already exists
```

---

## Contributing Guide Template

```markdown
# Contributing to [Project Name]

Thank you for considering contributing! This document outlines the process.

## Code of Conduct

Be respectful, inclusive, and constructive. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

**Before submitting**:
- Check existing issues
- Verify bug in latest version
- Gather information

**Submitting**:
1. Use bug report template
2. Provide clear title
3. Describe expected vs actual behavior
4. Include steps to reproduce
5. Add system information
6. Attach screenshots if relevant

### Suggesting Features

1. Check if already suggested
2. Use feature request template
3. Explain use case
4. Describe proposed solution
5. Consider alternatives

### Pull Requests

#### Setup

\`\`\`bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/project.git
cd project

# Add upstream
git remote add upstream https://github.com/original/project.git

# Install dependencies
npm install

# Create branch
git checkout -b feature/your-feature
\`\`\`

#### Development Process

1. **Make changes**
   - Follow code style guide
   - Add tests for new features
   - Update documentation

2. **Test**
   \`\`\`bash
   npm test
   npm run lint
   npm run type-check
   \`\`\`

3. **Commit**
   \`\`\`bash
   git commit -m "feat: add amazing feature"
   \`\`\`

   **Commit Convention**:
   - \`feat:\` New feature
   - \`fix:\` Bug fix
   - \`docs:\` Documentation
   - \`style:\` Formatting
   - \`refactor:\` Code restructuring
   - \`test:\` Adding tests
   - \`chore:\` Maintenance

4. **Push**
   \`\`\`bash
   git push origin feature/your-feature
   \`\`\`

5. **Create PR**
   - Use PR template
   - Link related issues
   - Request review

#### PR Requirements

- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Descriptive commit messages
- [ ] PR template filled out

## Code Style

### TypeScript

\`\`\`typescript
// Good
function createUser(data: CreateUserInput): Promise<User> {
  return db.user.create({ data });
}

// Bad
function createUser(data) {
  return db.user.create({ data });
}
\`\`\`

### React Components

\`\`\`typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// Bad
export function Button(props) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
\`\`\`

### File Naming

- Components: \`PascalCase.tsx\`
- Utilities: \`camelCase.ts\`
- Constants: \`UPPER_SNAKE_CASE.ts\`

## Testing Guidelines

\`\`\`typescript
describe('createUser', () => {
  it('should create user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User'
    };

    const user = await createUser(userData);

    expect(user).toMatchObject(userData);
    expect(user.id).toBeDefined();
  });

  it('should throw error for invalid email', async () => {
    await expect(createUser({ email: 'invalid', name: 'Test' }))
      .rejects
      .toThrow('Invalid email');
  });
});
\`\`\`

## Documentation

- Add JSDoc comments to functions
- Update README for new features
- Include code examples
- Update API docs if applicable

## Review Process

1. Maintainer reviews PR
2. Feedback provided
3. Make requested changes
4. Re-request review
5. PR merged when approved

## Questions?

- Discussion: [GitHub Discussions](https://github.com/username/project/discussions)
- Issues: [GitHub Issues](https://github.com/username/project/issues)
- Email: maintainers@example.com

Thank you for contributing!
```

---

## Code Documentation Standards

### JSDoc for JavaScript/TypeScript

```typescript
/**
 * Creates a new user in the database
 *
 * @param data - User data including email and name
 * @returns Promise resolving to created user
 * @throws {ValidationError} If email format is invalid
 * @throws {ConflictError} If email already exists
 *
 * @example
 * const user = await createUser({
 *   email: 'user@example.com',
 *   name: 'John Doe'
 * });
 */
async function createUser(data: CreateUserInput): Promise<User> {
  // Validate email format
  if (!isValidEmail(data.email)) {
    throw new ValidationError('Invalid email format');
  }

  // Check for existing user
  const existing = await db.user.findUnique({
    where: { email: data.email }
  });

  if (existing) {
    throw new ConflictError('Email already registered');
  }

  // Create user
  return await db.user.create({ data });
}
```

---

## Best Practices

### Documentation Principles

1. **Write for beginners**: Assume no prior knowledge
2. **Be concise**: Clear and brief explanations
3. **Show examples**: Code speaks louder than words
4. **Keep updated**: Documentation rots quickly
5. **Test instructions**: Follow your own guide

### README Essentials

**Must have**:
- Project description
- Installation instructions
- Usage examples
- License information

**Should have**:
- Features list
- API reference
- Contributing guidelines
- Troubleshooting

**Nice to have**:
- Screenshots/demo
- Badges
- Roadmap
- Acknowledgments

---

## Advanced Topics

For detailed information:
- **Documentation Templates**: `resources/documentation-templates.md`
- **Markdown Best Practices**: `resources/markdown-best-practices.md`
- **API Documentation Standards**: `resources/api-doc-standards.md`

## References

- [GitHub Docs Guide](https://docs.github.com/en/github/writing-on-github)
- [Write the Docs](https://www.writethedocs.org/)
- [JSDoc Reference](https://jsdoc.app/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
