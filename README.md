# Omen - AI Context Index Generator

<div align="center">

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-0078d7?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/)
[![Version](https://img.shields.io/badge/version-0.1.0-green?style=for-the-badge)]()
[![License](https://img.shields.io/badge/license-Apache%202.0-blue?style=for-the-badge)](LICENSE)
[![Publisher](https://img.shields.io/badge/publisher-vivekingle-orange?style=for-the-badge)]()

**Automatically generate comprehensive project documentation for AI assistants**

[Installation](#-installation) • [Features](#-features) • [Supported Tech](#-supported-technologies) • [Configuration](#%EF%B8%8F-configuration) • [Development](#-development)

</div>

---

## 📖 Overview

Omen is a VS Code extension that automatically scans your codebase and generates a detailed **code-index.md** file. This file helps AI assistants (Cursor, GitHub Copilot, Claude, ChatGPT) understand your project structure, API endpoints, database schema, and code organization.
Testing in progress across technolgy frameworks.

### Why Omen?

AI coding assistants are powerful, but they work best with context. Omen provides:
- ✅ **Complete project overview** - Architecture, tech stack, dependencies
- ✅ **API documentation** - All endpoints with methods, auth, and handlers
- ✅ **Database schema** - Tables, columns, relationships, constraints
- ✅ **Code structure** - Functions, classes, interfaces with documentation
- ✅ **Auto-updates** - Refreshes on file changes (configurable)

Perfect for:
- 🤖 **AI-assisted development** (Cursor, Copilot, Claude)
- 👥 **Team onboarding** - New devs understand structure quickly
- 📚 **Documentation** - Always up-to-date project reference
- 🔍 **Code review** - Quick project navigation

---

## ✨ Features

### 🔍 Smart Code Parsing
- Extracts functions, classes, interfaces, and types
- Captures JSDoc comments and Python docstrings
- Detects async functions, exports, and decorators
- Supports TypeScript, JavaScript, and Python

### 🌐 API Endpoint Detection
Automatically discovers REST API routes from:
- **Flask** - `@bp.route()` decorators with methods
- **Django** - `@api_view`, class-based views
- **Express** - `app.get/post/put/delete/patch()`
- **NestJS** - `@Controller`, `@Get/@Post` decorators
- **Next.js** - `pages/api/` and `app/api/` routes

Detects authentication:
- `@jwt_required`, `@login_required` (Flask)
- `@permission_classes` (Django)
- `@UseGuards(AuthGuard)` (NestJS)
- `getServerSession`, `auth()` (Next.js)

### 🗄️ Database Schema Export
Generates complete table structures from:
- **SQLAlchemy** - Columns, foreign keys, constraints
- **Django ORM** - Field types, relationships
- **TypeORM** - Entity decorators, relations
- **Prisma** - Schema detection

Captures:
- Primary keys, foreign keys, nullable fields
- Column types and constraints
- Relationships between tables

### 🔄 Auto-Refresh
- Watches file changes in workspace
- Debounced updates (configurable delay)
- Incremental parsing (only changed files)
- Status bar indicator

### 🎯 Tech Stack Detection
Automatically identifies 25+ technologies:
- Backend frameworks (Flask, Django, Express, NestJS, etc.)
- Frontend libraries (React, Vue, Angular, Svelte, etc.)
- ORMs (SQLAlchemy, TypeORM, Prisma, etc.)
- Additional tools (GraphQL, JWT, Redis, etc.)

---

## 🚀 Supported Technologies

### Languages (2)

| Language | File Types | Features |
|----------|------------|----------|
| **TypeScript** | `.ts`, `.tsx` | Full AST parsing, JSDoc, decorators, type inference |
| **JavaScript** | `.js`, `.jsx` | Full AST parsing, JSDoc, ES6+ support |
| **Python** | `.py` | Docstrings (single/multi-line), type hints, decorators, SQLAlchemy |

### Backend Frameworks (8)

| Framework | Detection | Route Extraction | Auth Detection |
|-----------|-----------|------------------|----------------|
| **Flask** | ✅ Import | `@bp.route()` decorators | `@jwt_required`, `@login_required` |
| **Django** | ✅ Import | `@api_view`, class-based views | `@permission_classes`, `LoginRequiredMixin` |
| **FastAPI** | ✅ Import | Async routes, path operations | Depends() injection |
| **Express** | ✅ Import | `app.get/post/put/delete/patch` | `authenticate()`, middleware |
| **NestJS** | ✅ `@nestjs` | `@Controller`, `@Get/@Post/@Put/@Delete` | `@UseGuards(AuthGuard)` |
| **Next.js API** | ✅ File structure | `pages/api/`, `app/api/` routes, dynamic routes | `getServerSession`, `auth()` |
| **Koa** | ✅ Import | Router middleware patterns | Context-based auth |
| **tRPC** | ✅ Import | Procedure detection | Auth middleware |

### Frontend Frameworks (6)

| Framework | Detection | Component Extraction |
|-----------|-----------|---------------------|
| **React** | ✅ Import | Functional & class components, hooks |
| **Next.js** | ✅ Import | Server/client components, layouts |
| **Vue** | ✅ Import | SFC components, Composition API |
| **Angular** | ✅ `@angular` | `@Component` decorators |
| **Svelte** | ✅ Import | SFC parsing, reactive statements |
| **Solid.js** | ✅ Import | Signal-based components |

### Database & ORM (7)

| ORM/Database | Detection | Schema Extraction | Features |
|--------------|-----------|-------------------|----------|
| **SQLAlchemy** | ✅ Import | `Column()` definitions | FK, PK, constraints, relationships |
| **Django ORM** | ✅ `models.Model` | Field types (CharField, etc.) | Relationships, Meta options |
| **TypeORM** | ✅ Decorators | `@Entity`, `@Column`, `@PrimaryColumn` | Relations, cascade |
| **Prisma** | ✅ Import | Schema detection | Multi-language support |
| **Mongoose** | ✅ Import | Schema models | MongoDB validation |
| **Sequelize** | ✅ Import | Model definitions | SQL database support |
| **Drizzle ORM** | ✅ Import | Schema detection | TypeScript-first |

### Additional Technologies (4)

| Technology | Detection | Purpose |
|------------|-----------|---------|
| **GraphQL** | ✅ `graphql`, `apollo` | API schema detection |
| **JWT Auth** | ✅ `jsonwebtoken` | Authentication detection |
| **Redis** | ✅ Import | Caching layer |
| **Bcrypt** | ✅ Import | Password hashing |

### Coverage Statistics
- **Total Technologies**: 25+
- **Languages**: 2 (TypeScript/JavaScript, Python)
- **Backend Frameworks**: 8
- **Frontend Frameworks**: 6
- **ORMs/Databases**: 7
- **Market Coverage**: ~70% of modern web development stacks

---

## 📦 Installation

### From VS Code Marketplace
1. Open VS Code
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
3. Type: `ext install Chronos.omen-code-indexer`
4. Press Enter

### Manual Installation
1. Download `.vsix` file from [Releases](https://github.com/inglevivek/omen/releases)
2. Open VS Code
3. Go to Extensions (`Ctrl+Shift+X`)
4. Click `...` → "Install from VSIX"
5. Select the downloaded file

### From Source
```bash
git clone https://github.com/inglevivek/omen.git
cd omen
npm install
npm run compile
# Press F5 in VS Code to run extension
```

---

## 🎯 Usage

### Generate Index

1. Open your project in VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type: `Omen: Generate Context Index`
4. Press Enter

The extension will generate `omen-index.md` in `.omen-context/` directory (configurable).

### Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `Omen: Generate Context Index` | Generate new index from scratch | - |
| `Omen: Refresh Context Index` | Update existing index | - |
| `Omen: Open Context Index` | Open generated file in editor | Click status bar |

### Status Bar

The status bar item (📄 Omen Context) shows:
- Last update time
- File/function/class counts
- Click to open the generated index
- Hover for quick stats

---

## ⚙️ Configuration

Configure via VS Code settings (`Ctrl+,` or `File > Preferences > Settings`):

```json
{
  // Output location (default: .omen-context)
  "omen.outputPath": ".omen-context",

  // Output format: "markdown", "json", or "both"
  "omen.outputFormat": "markdown",

  // File patterns to include
  "omen.includePatterns": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.js",
    "src/**/*.jsx",
    "src/**/*.py"
  ],

  // File patterns to exclude
  "omen.excludePatterns": [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/coverage/**",
    "**/*.test.*",
    "**/*.spec.*"
  ],

  // Auto-refresh on file changes
  "omen.autoRefresh": true,

  // Debounce delay (ms) for auto-refresh (min: 1000)
  "omen.debounceDelay": 3000,

  // Include classes in output
  "omen.includeClasses": true,

  // Include interfaces/types in output
  "omen.includeInterfaces": true,

  // Include import statements
  "omen.includeImports": false,

  // Maximum file size to parse (bytes)
  "omen.maxFileSize": 1048576
}
```

### Configuration Options Explained

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `outputPath` | string | `.omen-context` | Output directory for generated files |
| `outputFormat` | enum | `markdown` | `markdown`, `json`, or `both` |
| `includePatterns` | array | `src/**/*.{ts,tsx,js,jsx,py}` | Glob patterns to include |
| `excludePatterns` | array | `node_modules`, `dist`, etc. | Glob patterns to exclude |
| `autoRefresh` | boolean | `true` | Auto-update on file changes |
| `debounceDelay` | number | `3000` | Delay before refresh (ms) |
| `includeClasses` | boolean | `true` | Include class definitions |
| `includeInterfaces` | boolean | `true` | Include type/interface definitions |
| `includeImports` | boolean | `false` | Include import statements |
| `maxFileSize` | number | `1048576` | Max file size to parse (1MB) |

---

## 📄 Output Format

### Tech Stack Section
```markdown
## 🛠️ Tech Stack

**Backend**: Flask, FastAPI
**Frontend**: React, Next.js
**Database/ORM**: SQLAlchemy, Prisma
**Other**: GraphQL, JWT Auth, Redis
```

### API Endpoints Table
```markdown
## 🌐 API Endpoints

| Method | Path | Handler | Auth | File |
|--------|------|---------|------|------|
| `GET` | `/api/users` | `list_users()` | 🔒 | routes.py:15 |
| `POST` | `/api/users` | `create_user()` | 🔒 | routes.py:35 |
| `GET` | `/api/users/:id` | `get_user()` | 🔒 | routes.py:55 |
| `PUT` | `/api/users/:id` | `update_user()` | 🔒 | routes.py:75 |
| `DELETE` | `/api/users/:id` | `delete_user()` | 🔒 | routes.py:95 |
```

### Database Schema
```markdown
## 🗄️ Database Schema

### `User` Table

**File**: app/models.py:13

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | PRIMARY KEY |
| `email` | String | NOT NULL |
| `password_hash` | String | NOT NULL |
| `created_at` | DateTime | - |
| `role_id` | Integer | FK → roles.id |

### `Role` Table

**File**: app/models.py:35

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | Integer | PRIMARY KEY |
| `name` | String | NOT NULL |
```

### File Structure
```markdown
## 📁 File Structure

### src/auth

#### `user.py` [python]

**Classes**:
- 🔓 `User` (Line 10)
  - *User account model with authentication*
  - **Properties**: `id: Integer`, `email: String`, `password_hash: String`
    - ⚡ `authenticate(password: str): bool` - Verify user password
    - `to_dict(): dict` - Convert to dictionary representation
    - `generate_token(): str` - Generate JWT token

**Functions**:
- 🔓 ⚡ `hash_password(password: str): str` (Line 45)
  - *Hash password using bcrypt*
```

---

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- VS Code 1.85.0+

### Setup

```bash
# Clone repository
git clone https://github.com/inglevivek/omen.git
cd omen

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run extension in development mode
code .
# Press F5 to launch Extension Development Host
```

### Project Structure

```
omen/
├── src/
│   ├── extension.ts          # Extension entry point, command registration
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces and types
│   ├── indexer/
│   │   ├── parser.ts         # Code parsing (TS/JS/Python)
│   │   ├── generator.ts      # Markdown/JSON generation
│   │   └── fileScanner.ts    # Workspace file scanning
│   └── utils/
│       └── config.ts         # Configuration handling
├── package.json              # Extension manifest
├── tsconfig.json            # TypeScript configuration
├── esbuild.js               # Build configuration
└── README.md                # This file
```

### Build & Package

```bash
# Development build
npm run compile

# Production build
npm run package

# Create .vsix package
npm install -g @vscode/vsce
vsce package

# Publish to marketplace
vsce publish
```

---

## 🤝 Contributing

Contributions are welcome! We'd love your help making Omen better.

### How to Contribute

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/omen.git`
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes
5. **Test** thoroughly
6. **Commit**: `git commit -m 'Add amazing feature'`
7. **Push**: `git push origin feature/amazing-feature`
8. **Open** a Pull Request

### Adding New Framework Support

Want to add support for a new framework? Here's how:

#### 1. Add Detection (in `src/indexer/generator.ts`)

```typescript
// Add to tech stack detection
if (imp.source.includes('your-framework')) {
  detectedTechs.add('YourFramework');
}
```

#### 2. Add Route Extraction (if applicable)

```typescript
function extractYourFrameworkRoutes(
  fileIndex: any, 
  content: string, 
  endpoints: ApiEndpoint[]
): void {
  // Parse framework-specific route definitions
  const routeMatches = content.matchAll(/@Route\(['"]([^'"]+)['"]/g);

  for (const match of routeMatches) {
    const path = match[1];
    // ... extract method, handler, auth

    endpoints.push({
      method: 'GET',
      path,
      handler: 'handlerName',
      file: fileIndex.relativePath,
      line: lineNumber,
      auth: hasAuth
    });
  }
}
```

#### 3. Add Schema Extraction (if ORM)

```typescript
function extractYourORMSchema(
  fileIndex: any, 
  content: string, 
  tables: DbTable[]
): void {
  // Parse ORM model definitions
  // Extract tables, columns, constraints
}
```

#### 4. Test & Document

- Add test cases
- Update README with new framework
- Add examples in documentation

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 🐛 Known Issues

- **TypeORM decorators** require TypeScript 5.0+
- **Large files** (>1MB) may slow down parsing - increase `maxFileSize` if needed
- **Python multi-line strings** in unusual contexts may not parse correctly
- **Next.js app router** support is experimental
- **Dynamic imports** are not fully tracked

Report issues: [GitHub Issues](https://github.com/inglevivek/omen/issues)

---

## 📝 Roadmap

### v0.2.0 (Q1 2026)
- [ ] Enhanced Flask route parsing (multi-line decorators)
- [ ] Django URL patterns extraction from `urls.py`
- [ ] GraphQL schema file parsing (`.graphql`, `.gql`)
- [ ] Prisma schema file parsing (`schema.prisma`)
- [ ] SQL migration file detection
- [ ] Incremental updates (only changed files)

### v0.3.0 (Q2 2026)
- [ ] PHP/Laravel support
- [ ] Ruby/Rails support
- [ ] Go support (Gin, Echo, Fiber)
- [ ] Custom template support
- [ ] Multi-language documentation
- [ ] VS Code workspace indexing

### v1.0.0 (Q3 2026)
- [ ] Java/Spring Boot support
- [ ] C#/.NET Core support
- [ ] Rust support (Actix, Rocket)
- [ ] Direct integration with AI assistants (Cursor API, Copilot)
- [ ] Web dashboard for project visualization
- [ ] Team collaboration features

[View full roadmap →](https://github.com/inglevivek/omen/projects)

---

## 📜 License

**MIT License**

Copyright (c) 2026 Vivek Ingle

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 👤 Author

**Vivek Ingle**
- GitHub: [@inglevivek](https://github.com/inglevivek)
- Website: [github.com/inglevivek/omen](https://github.com/inglevivek/omen)
- Email: vivekingle315@gmail.com
- LinkedIN: [Vivek Ingle](https://www.linkedin.com/in/inglevivek/)
**Publisher**: [vivekingle](https://marketplace.visualstudio.com/publishers/vivekingle)

---

## 🙏 Acknowledgments

- **VS Code Extension API** - For seamless IDE integration
- **Open Source Community** - For inspiration and support

---

## 🌟 Star History

If you find Omen useful, please consider giving it a star on GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=inglevivek/omen&type=Date)](https://star-history.com/#inglevivek/omen&Date)

---

## 💬 Support

- 📖 [Documentation](https://github.com/inglevivek/omen#readme)
- 🐛 [Report Issues](https://github.com/inglevivek/omen/issues)
- 💡 [Feature Requests](https://github.com/inglevivek/omen/issues/new?labels=enhancement)
- 💬 [Discussions](https://github.com/inglevivek/omen/discussions)
- 📧 [Email](mailto:ingleVivek@gmail.com)

---

<div align="center">

**Made with Understanding for AI-assisted development**

*Help AI assistants understand your code better with Omen!*

[⬆ Back to Top](#omen---code-index-generator)

</div>
