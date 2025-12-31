import * as fs from 'fs';
import * as path from 'path';
import { scanWorkspace, readFileContent } from './fileScanner';
import { parseFile } from './parser';
import { ProjectIndex, GenerationResult, ApiEndpoint, DbTable, DbColumn } from '../types';
import { getConfig } from '../utils/config';

export async function generateIndex(workspaceRoot: string): Promise<GenerationResult> {
  const config = getConfig();
  const files = await scanWorkspace(workspaceRoot);

  const projectIndex: ProjectIndex = {
    projectName: path.basename(workspaceRoot),
    generated: new Date().toISOString(),
    fileCount: 0,
    functionCount: 0,
    classCount: 0,
    files: [],
    techStack: [],
    apiEndpoints: [],
    dbSchema: []
  };

  const detectedTechs = new Set<string>();
  const apiEndpoints: ApiEndpoint[] = [];
  const dbTables: DbTable[] = [];

  for (const file of files) {
    try {
      const content = readFileContent(file);
      const fileIndex = parseFile(file, content, workspaceRoot);

      projectIndex.files.push(fileIndex);
      projectIndex.fileCount++;
      projectIndex.functionCount += fileIndex.functions.length;
      projectIndex.classCount += fileIndex.classes.length;

      // Enhanced tech stack detection
      fileIndex.imports.forEach(imp => {
            const source = imp.source.toLowerCase();

            // Backend frameworks
            if (source.includes('flask')) { detectedTechs.add('Flask'); }
            if (source.includes('express')) { detectedTechs.add('Express'); }
            if (source.includes('fastapi')) { detectedTechs.add('FastAPI'); }
            if (source.includes('django')) { detectedTechs.add('Django'); }
            if (source.includes('@nestjs')) { detectedTechs.add('NestJS'); }
            if (source.includes('koa')) { detectedTechs.add('Koa'); }

            // Frontend frameworks
            if (source.includes('react')) { detectedTechs.add('React'); }
            if (source.includes('next')) { detectedTechs.add('Next.js'); }
            if (source.includes('vue')) { detectedTechs.add('Vue'); }
            if (source.includes('@angular')) { detectedTechs.add('Angular'); }
            if (source.includes('svelte')) { detectedTechs.add('Svelte'); }
            if (source.includes('solid-js')) { detectedTechs.add('Solid.js'); }

            // Database/ORM
            if (source.includes('sqlalchemy')) { detectedTechs.add('SQLAlchemy'); }
            if (source.includes('mongoose')) { detectedTechs.add('Mongoose'); }
            if (source.includes('prisma')) { detectedTechs.add('Prisma'); }
            if (source.includes('typeorm')) { detectedTechs.add('TypeORM'); }
            if (source.includes('sequelize')) { detectedTechs.add('Sequelize'); }
            if (source.includes('drizzle')) { detectedTechs.add('Drizzle ORM'); }

            // GraphQL
            if (source.includes('graphql') || source.includes('apollo')) {
                detectedTechs.add('GraphQL');
            }

            // Other
            if (source.includes('jwt') || source.includes('jsonwebtoken')) {
                detectedTechs.add('JWT Auth');
            }
            if (source.includes('bcrypt')) { detectedTechs.add('Bcrypt'); }
            if (source.includes('redis')) { detectedTechs.add('Redis'); }
            });

      // Extract API endpoints
      if (fileIndex.language === 'python') {
        extractFlaskRoutes(fileIndex, content, apiEndpoints);
        extractDjangoRoutes(fileIndex, content, apiEndpoints);
      } else if (fileIndex.language === 'typescript' || fileIndex.language === 'javascript') {
        extractExpressRoutes(fileIndex, content, apiEndpoints);
        extractNestJSRoutes(fileIndex, content, apiEndpoints);
        extractNextJSRoutes(file, fileIndex, content, apiEndpoints);
      }

      // Extract database schemas
      if (fileIndex.language === 'python') {
        extractSQLAlchemySchema(fileIndex, content, dbTables);
        extractDjangoModels(fileIndex, content, dbTables);
      } else if (fileIndex.language === 'typescript' || fileIndex.language === 'javascript') {
        extractTypeORMSchema(fileIndex, content, dbTables);
        extractPrismaSchema(fileIndex, content, dbTables);
      }

    } catch (error) {
      console.error(`Failed to parse ${file}:`, error);
    }
  }

  projectIndex.techStack = Array.from(detectedTechs).sort();
  projectIndex.apiEndpoints = apiEndpoints;
  projectIndex.dbSchema = dbTables;

  // Output directory
  const outputDir = config.outputPath === '.' 
    ? workspaceRoot 
    : path.join(workspaceRoot, config.outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate outputs
  if (config.outputFormat === 'markdown' || config.outputFormat === 'both') {
    const markdown = generateMarkdown(projectIndex);
    fs.writeFileSync(
      path.join(outputDir, 'omen-index.md'),
      markdown
    );
  }

  if (config.outputFormat === 'json' || config.outputFormat === 'both') {
    fs.writeFileSync(
      path.join(outputDir, 'AI_CONTEXT.json'),
      JSON.stringify(projectIndex, null, 2)
    );
  }

  if (config.outputPath !== '.') {
    const gitignorePath = path.join(outputDir, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, '*\n!.gitignore\n');
    }
  }

  return {
    fileCount: projectIndex.fileCount,
    functionCount: projectIndex.functionCount,
    classCount: projectIndex.classCount
  };
}

// Flask route extraction
function extractFlaskRoutes(fileIndex: any, content: string, endpoints: ApiEndpoint[]): void {
  const lines = content.split('\n');

  fileIndex.functions.forEach((func: any) => {
    let routePath = '';
    let routeMethods: string[] = [];

    // Look for decorators above function
    for (let i = Math.max(0, func.line - 10); i < func.line; i++) {
      if (i >= lines.length) { break; }
      const line = lines[i];

      // Match @bp.route('/path') or @app.route('/path')
      const routeMatch = line.match(/@\w+\.route\s*\(\s*['"]([^'"]+)['"]/);
      if (routeMatch) {
        routePath = routeMatch[1];
      }

      // Match methods=['GET', 'POST']
      const methodMatch = line.match(/methods\s*=\s*\[([^\]]+)\]/);
      if (methodMatch) {
        const methodsStr = methodMatch[1];
        routeMethods = methodsStr.match(/['"]([A-Z]+)['"]/g)?.map(m => m.replace(/['"]/g, '')) || [];
      }
    }

    if (routePath) {
      const methods = routeMethods.length > 0 ? routeMethods : ['GET'];
      methods.forEach(method => {
        endpoints.push({
          method,
          path: routePath,
          handler: func.name,
          file: fileIndex.relativePath,
          line: func.line,
          auth: content.includes('@jwt_required') || content.includes('@login_required')
        });
      });
    }
  });
}

// Django route extraction
function extractDjangoRoutes(fileIndex: any, content: string, endpoints: ApiEndpoint[]): void {
  // Django REST Framework @api_view decorator
  const apiViewMatches = content.matchAll(/@api_view\(\[([^\]]+)\]\)\s*def\s+(\w+)/g);

  for (const match of apiViewMatches) {
    const methodsStr = match[1];
    const funcName = match[2];
    const methods = methodsStr.match(/['"]([A-Z]+)['"]/g)?.map(m => m.replace(/['"]/g, '')) || ['GET'];
    const func = fileIndex.functions.find((f: any) => f.name === funcName);

    if (func) {
      methods.forEach(method => {
        endpoints.push({
          method,
          path: '/api/' + funcName.replace(/_/g, '-'),
          handler: funcName,
          file: fileIndex.relativePath,
          line: func.line,
          auth: content.includes('@permission_classes') || content.includes('IsAuthenticated')
        });
      });
    }
  }

  // Django class-based views
  const cbvMatches = content.matchAll(/class\s+(\w+)\(.*?View\)/g);
  for (const match of cbvMatches) {
    const className = match[1];
    const cls = fileIndex.classes.find((c: any) => c.name === className);

    if (cls) {
      ['get', 'post', 'put', 'patch', 'delete'].forEach(method => {
        const hasMethod = cls.methods.some((m: any) => m.name === method);
        if (hasMethod) {
          endpoints.push({
            method: method.toUpperCase(),
            path: '/api/' + className.toLowerCase().replace('view', ''),
            handler: `${className}.${method}`,
            file: fileIndex.relativePath,
            line: cls.line,
            auth: content.includes('LoginRequiredMixin') || content.includes('PermissionRequiredMixin')
          });
        }
      });
    }
  }
}

// Express route extraction
function extractExpressRoutes(fileIndex: any, content: string, endpoints: ApiEndpoint[]): void {
  const routePatterns = [
    /(?:app|router)\.get\s*\(\s*['"]([^'"]+)['"]/g,
    /(?:app|router)\.post\s*\(\s*['"]([^'"]+)['"]/g,
    /(?:app|router)\.put\s*\(\s*['"]([^'"]+)['"]/g,
    /(?:app|router)\.delete\s*\(\s*['"]([^'"]+)['"]/g,
    /(?:app|router)\.patch\s*\(\s*['"]([^'"]+)['"]/g
  ];

  routePatterns.forEach((pattern, idx) => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const method = methods[idx];

    for (const match of content.matchAll(pattern)) {
      const path = match[1];
      const startPos = match.index || 0;
      const lineNum = content.substring(0, startPos).split('\n').length;

      endpoints.push({
        method,
        path,
        handler: 'handler',
        file: fileIndex.relativePath,
        line: lineNum,
        auth: content.includes('authenticate') || content.includes('authMiddleware')
      });
    }
  });
}

// NestJS route extraction
function extractNestJSRoutes(fileIndex: any, content: string, endpoints: ApiEndpoint[]): void {
  // Find @Controller decorator
  const controllerMatch = content.match(/@Controller\s*\(\s*['"]([^'"]*)['"]/);
  const basePath = controllerMatch ? '/' + controllerMatch[1] : '';

  // Find route decorators
  const routeDecorators = [
    { pattern: /@Get\s*\(\s*['"]([^'"]*)['"]/g, method: 'GET' },
    { pattern: /@Post\s*\(\s*['"]([^'"]*)['"]/g, method: 'POST' },
    { pattern: /@Put\s*\(\s*['"]([^'"]*)['"]/g, method: 'PUT' },
    { pattern: /@Delete\s*\(\s*['"]([^'"]*)['"]/g, method: 'DELETE' },
    { pattern: /@Patch\s*\(\s*['"]([^'"]*)['"]/g, method: 'PATCH' }
  ];

  routeDecorators.forEach(({ pattern, method }) => {
    for (const match of content.matchAll(pattern)) {
      const routePath = match[1];
      const fullPath = basePath + (routePath ? '/' + routePath : '');
      const startPos = match.index || 0;
      const lineNum = content.substring(0, startPos).split('\n').length;

      // Find associated method
      const methodMatch = content.substring(startPos).match(/async\s+(\w+)\s*\(|\s+(\w+)\s*\(/);
      const handlerName = methodMatch ? (methodMatch[1] || methodMatch[2]) : 'handler';

      endpoints.push({
        method,
        path: fullPath,
        handler: handlerName,
        file: fileIndex.relativePath,
        line: lineNum,
        auth: content.includes('@UseGuards') || content.includes('AuthGuard')
      });
    }
  });
}

// Next.js API route extraction
function extractNextJSRoutes(filePath: string, fileIndex: any, content: string, endpoints: ApiEndpoint[]): void {
  // Check if file is in pages/api/ or app/api/
  const isApiRoute = filePath.includes('/pages/api/') || filePath.includes('/app/api/');

  if (isApiRoute) {
    // Extract route path from file path
    const apiMatch = filePath.match(/\/(?:pages|app)\/api\/(.+)\.(?:ts|js|tsx|jsx)$/);
    if (apiMatch) {
      const routePath = '/api/' + apiMatch[1].replace(/\\/g, '/').replace(/\[([^\]]+)\]/g, ':$1');

      // Check for HTTP method handlers
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      methods.forEach(method => {
        const hasHandler = content.includes(`export async function ${method}`) || 
                          content.includes(`export function ${method}`) ||
                          (method === 'GET' && content.includes('export default'));

        if (hasHandler) {
          endpoints.push({
            method,
            path: routePath,
            handler: method.toLowerCase(),
            file: fileIndex.relativePath,
            line: 1,
            auth: content.includes('getServerSession') || content.includes('auth')
          });
        }
      });
    }
  }
}

// SQLAlchemy schema extraction
function extractSQLAlchemySchema(fileIndex: any, content: string, tables: DbTable[]): void {
  if (!content.includes('db.Model') && !content.includes('Base')) { return; }

  fileIndex.classes.forEach((cls: any) => {
    if (cls.properties && cls.properties.length > 0) {
      const columns: DbColumn[] = cls.properties.map((prop: string) => {
        const [name, typeInfo] = prop.split(':').map((s: string) => s.trim());

        // Find full column definition in content
        const colDefMatch = content.match(new RegExp(`${name}\\s*=\\s*(?:db\\.)?Column\\([^)]+\\)`, 's'));
        const fullDef = colDefMatch ? colDefMatch[0] : typeInfo;

        return {
          name,
          type: typeInfo.split('(')[0].replace('db.', ''),
          nullable: !fullDef.includes('nullable=False'),
          primary: fullDef.includes('primary_key=True'),
          foreign: fullDef.match(/ForeignKey\(['"]([\w.]+)['"]/)?.[1]
        };
      });

      tables.push({
        name: cls.name,
        file: fileIndex.relativePath,
        line: cls.line,
        columns
      });
    }
  });
}

// Django ORM schema extraction
function extractDjangoModels(fileIndex: any, content: string, tables: DbTable[]): void {
  if (!content.includes('models.Model')) { return; }

  fileIndex.classes.forEach((cls: any) => {
    const classContent = content.substring(
      content.indexOf(`class ${cls.name}`),
      content.indexOf('\nclass ', content.indexOf(`class ${cls.name}`) + 1)
    );

    // Find Django model fields
    const fieldMatches = classContent.matchAll(/(\w+)\s*=\s*models\.(\w+Field)\(([^)]*)\)/g);
    const columns: DbColumn[] = [];

    for (const match of fieldMatches) {
      const [_, name, fieldType, params] = match;
      columns.push({
        name,
        type: fieldType,
        nullable: params.includes('null=True'),
        primary: params.includes('primary_key=True'),
        foreign: params.match(/ForeignKey\(['"]([\w.]+)['"]/)?.[1]
      });
    }

    if (columns.length > 0) {
      tables.push({
        name: cls.name,
        file: fileIndex.relativePath,
        line: cls.line,
        columns
      });
    }
  });
}

// TypeORM schema extraction
function extractTypeORMSchema(fileIndex: any, content: string, tables: DbTable[]): void {
  if (!content.includes('@Entity')) { return; }

  fileIndex.classes.forEach((cls: any) => {
    if (cls.properties && cls.properties.length > 0) {
      const classContent = content.substring(
        content.indexOf(`class ${cls.name}`),
        content.indexOf('\n}', content.indexOf(`class ${cls.name}`))
      );

      const columns: DbColumn[] = cls.properties.map((prop: string) => {
        const [name, type] = prop.split(':').map((s: string) => s.trim());

        // Check for column decorators
        const propMatch = classContent.match(new RegExp(`@(?:Primary)?Column[^\n]*\n\s*${name}`, 's'));
        const decorators = propMatch ? propMatch[0] : '';

        return {
          name,
          type: type || 'unknown',
          nullable: decorators.includes('nullable: true'),
          primary: decorators.includes('@PrimaryColumn') || decorators.includes('primary: true'),
          foreign: decorators.match(/@ManyToOne.*?=>\s*(\w+)/)?.[1]
        };
      });

      tables.push({
        name: cls.name,
        file: fileIndex.relativePath,
        line: cls.line,
        columns
      });
    }
  });
}

// Prisma schema extraction (from schema.prisma files)
function extractPrismaSchema(fileIndex: any, content: string, tables: DbTable[]): void {
  // This would require scanning .prisma files separately
  // For now, detect Prisma usage in TypeScript files
  if (content.includes('PrismaClient')) {
    // Mark that Prisma is in use (tables would come from schema.prisma parsing)
  }
}

function generateMarkdown(index: ProjectIndex): string {
  let md = `# AI Context - ${index.projectName}\n\n`;
  md += `> **Auto-generated project documentation for AI assistants**\n`;
  md += `> Last updated: ${new Date(index.generated).toLocaleString()}\n\n`;

  // Tech Stack
  if (index.techStack && index.techStack.length > 0) {
    md += `## 🛠️ Tech Stack\n\n`;

    // Group technologies by category
    const backend = index.techStack.filter(t => 
      ['Flask', 'Express', 'FastAPI', 'Django', 'NestJS', 'Koa'].includes(t)
    );
    const frontend = index.techStack.filter(t => 
      ['React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'Solid.js'].includes(t)
    );
    const database = index.techStack.filter(t => 
      ['SQLAlchemy', 'Mongoose', 'Prisma', 'TypeORM', 'Sequelize', 'Drizzle ORM'].includes(t)
    );
    const other = index.techStack.filter(t => 
      !backend.includes(t) && !frontend.includes(t) && !database.includes(t)
    );

    if (backend.length > 0) {
      md += `**Backend**: ${backend.join(', ')}\n`;
    }
    if (frontend.length > 0) {
      md += `**Frontend**: ${frontend.join(', ')}\n`;
    }
    if (database.length > 0) {
      md += `**Database/ORM**: ${database.join(', ')}\n`;
    }
    if (other.length > 0) {
      md += `**Other**: ${other.join(', ')}\n`;
    }
    md += `\n`;
  }

  // Statistics
  md += `## 📊 Project Statistics\n\n`;
  md += `| Metric | Count |\n`;
  md += `|--------|-------|\n`;
  md += `| Files | ${index.fileCount} |\n`;
  md += `| Functions | ${index.functionCount} |\n`;
  md += `| Classes | ${index.classCount} |\n`;
  if (index.apiEndpoints) {
    md += `| API Endpoints | ${index.apiEndpoints.length} |\n`;
  }
  if (index.dbSchema) {
    md += `| Database Tables | ${index.dbSchema.length} |\n`;
  }
  md += `\n`;

  // API Endpoints
  if (index.apiEndpoints && index.apiEndpoints.length > 0) {
    md += `## 🌐 API Endpoints\n\n`;
    md += `| Method | Path | Handler | Auth | File |\n`;
    md += `|--------|------|---------|------|------|\n`;
    index.apiEndpoints.forEach(endpoint => {
      const authIcon = endpoint.auth ? '🔒' : '🔓';
      const method = '`' + endpoint.method + '`';
      const epath = '`' + endpoint.path + '`';
      const handler = '`' + endpoint.handler + '()`';
      md += `| ${method} | ${epath} | ${handler} | ${authIcon} | ${endpoint.file}:${endpoint.line} |\n`;
    });
    md += `\n`;
  }

  // Database Schema
  if (index.dbSchema && index.dbSchema.length > 0) {
    md += `## 🗄️ Database Schema\n\n`;
    index.dbSchema.forEach(table => {
      md += `### \`${table.name}\` Table\n\n`;
      md += `**File**: ${table.file}:${table.line}\n\n`;
      md += `| Column | Type | Constraints |\n`;
      md += `|--------|------|-------------|\n`;
      table.columns.forEach(col => {
        const constraints: string[] = [];
        if (col.primary) { constraints.push('PRIMARY KEY'); }
        if (!col.nullable) { constraints.push('NOT NULL'); }
        if (col.foreign) { constraints.push(`FK → ${col.foreign}`); }
        const colName = '`' + col.name + '`';
        md += `| ${colName} | ${col.type} | ${constraints.join(', ') || '-'} |\n`;
      });
      md += `\n`;
    });
  }

  md += `---\n\n`;

  // Group files by directory
  const filesByDir: { [key: string]: typeof index.files } = {};
  for (const file of index.files) {
    const dir = path.dirname(file.relativePath);
    if (!filesByDir[dir]) {
      filesByDir[dir] = [];
    }
    filesByDir[dir].push(file);
  }

  md += `## 📁 File Structure\n\n`;
  const sortedDirs = Object.keys(filesByDir).sort();

  for (const dir of sortedDirs) {
    const displayDir = dir === '.' ? '/' : dir;
    md += `### ${displayDir}\n\n`;

    for (const file of filesByDir[dir]) {
      const fileName = '`' + path.basename(file.path) + '`';
      md += `#### ${fileName} [${file.language}]\n\n`;

      // Classes with documentation
      if (file.classes.length > 0) {
        md += `**Classes**:\n\n`;
        for (const cls of file.classes) {
          const exportTag = cls.isExported ? '🔓' : '🔒';
          const className = '`' + cls.name + '`';
          md += `- ${exportTag} ${className} (Line ${cls.line})\n`;

          if (cls.description) {
            md += `  - *${cls.description}*\n`;
          }

          if (cls.properties && cls.properties.length > 0) {
            const props = cls.properties.map(p => '`' + p + '`').join(', ');
            md += `  - **Properties**: ${props}\n`;
          }

          if (cls.methods.length > 0) {
            cls.methods.forEach(method => {
              const params = method.params.join(', ');
              const returnType = method.returnType ? `: ${method.returnType}` : '';
              const asyncTag = method.isAsync ? '⚡ ' : '';
              const methodSig = '`' + method.name + '(' + params + ')' + returnType + '`';
              md += `    - ${asyncTag}${methodSig}`;
              if (method.description) {
                md += ` - ${method.description}`;
              }
              md += `\n`;
            });
          }
        }
        md += `\n`;
      }

      // Functions with documentation
      if (file.functions.length > 0) {
        md += `**Functions**:\n\n`;
        for (const func of file.functions) {
          const params = func.params.join(', ');
          const returnType = func.returnType ? `: ${func.returnType}` : '';
          const asyncTag = func.isAsync ? '⚡ ' : '';
          const exportTag = func.isExported ? '🔓' : '🔒';
          const funcSig = '`' + func.name + '(' + params + ')' + returnType + '`';
          md += `- ${exportTag} ${asyncTag}${funcSig} (Line ${func.line})\n`;

          if (func.description) {
            md += `  - *${func.description}*\n`;
          }
        }
        md += `\n`;
      }

      // Interfaces
      if (file.interfaces.length > 0) {
        md += `**Types/Interfaces**:\n\n`;
        for (const iface of file.interfaces) {
          const exportTag = iface.isExported ? '🔓' : '🔒';
          const ifaceName = '`' + iface.name + '`';
          md += `- ${exportTag} ${ifaceName} (Line ${iface.line})\n`;

          if (iface.description) {
            md += `  - *${iface.description}*\n`;
          }

          if (iface.properties.length > 0) {
            md += `  - Props: ${iface.properties.join(', ')}\n`;
          }
        }
        md += `\n`;
      }

      // Dependencies
      if (file.imports.length > 0) {
        md += `<details>\n<summary>📦 Dependencies</summary>\n\n`;
        file.imports.forEach(imp => {
          const source = '`' + imp.source + '`';
          md += `- ${source}: ${imp.imports.join(', ')}\n`;
        });
        md += `\n</details>\n\n`;
      }

      md += `---\n\n`;
    }
  }

  md += `\n## 💡 How to Use This File\n\n`;
  md += `This file provides a complete overview of your codebase for AI assistants. It includes:\n\n`;
  md += `- **Tech Stack**: Detected frameworks and libraries\n`;
  md += `- **API Endpoints**: All routes with HTTP methods and authentication\n`;
  md += `- **Database Schema**: Complete table structures with relationships\n`;
  md += `- **Function Signatures**: All public functions with parameters and documentation\n`;
  md += `- **Dependencies**: Third-party packages used in each file\n\n`;
  md += `*This file is auto-generated. Do not edit manually.*\n`;

  return md;
}
