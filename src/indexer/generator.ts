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

      // Detect tech stack from imports
      fileIndex.imports.forEach(imp => {
        if (imp.source.includes('flask')) { detectedTechs.add('Flask'); }
        if (imp.source.includes('express')) { detectedTechs.add('Express'); }
        if (imp.source.includes('fastapi')) { detectedTechs.add('FastAPI'); }
        if (imp.source.includes('react')) { detectedTechs.add('React'); }
        if (imp.source.includes('next')) { detectedTechs.add('Next.js'); }
        if (imp.source.includes('vue')) { detectedTechs.add('Vue'); }
        if (imp.source.includes('sqlalchemy')) { detectedTechs.add('SQLAlchemy'); }
        if (imp.source.includes('mongoose')) { detectedTechs.add('MongoDB/Mongoose'); }
        if (imp.source.includes('prisma')) { detectedTechs.add('Prisma'); }
        });

      // Extract API endpoints from Flask/Express routes
      if (fileIndex.language === 'python') {
        fileIndex.functions.forEach(func => {
            // Match decorator-style routes
            const lines = content.split('\n');
            let routePath = '';
            let routeMethods: string[] = [];
            
            for (let i = func.line - 10; i < func.line; i++) {
                if (i < 0 || i >= lines.length) { continue; }
                const line = lines[i];
                
                // Match @bp.route('/path', methods=['GET', 'POST'])
                const routeMatch = line.match(/@\w+\.route\(['"]([^'"]+)['"]/);
                if (routeMatch) {
                routePath = routeMatch[1];
                }
                
                // Match methods in same or next line
                const methodMatch = line.match(/methods\s*=\s*\[([^\]]+)\]/);
                if (methodMatch) {
                const methodsStr = methodMatch[1];
                routeMethods = methodsStr.match(/['"]([A-Z]+)['"]/g)?.map(m => m.replace(/['"]/g, '')) || ['GET'];
                }
            }
            
            // If route found, add endpoint
            if (routePath) {
                routeMethods.forEach(method => {
                apiEndpoints.push({
                    method,
                    path: routePath,
                    handler: func.name,
                    file: fileIndex.relativePath,
                    line: func.line,
                    auth: content.includes('@jwt_required') || func.description?.toLowerCase().includes('auth')
                });
                });
            }
            });
      }

      // Extract database schema from SQLAlchemy models
      if (fileIndex.language === 'python' && content.includes('db.Model')) {
        fileIndex.classes.forEach(cls => {
          if (cls.properties && cls.properties.length > 0) {
            const columns: DbColumn[] = cls.properties.map(prop => {
              const [name, typeInfo] = prop.split(':').map(s => s.trim());
              const isPrimary = typeInfo.includes('primary_key');
              const isNullable = !typeInfo.includes('nullable=False');
              const foreignMatch = typeInfo.match(/ForeignKey\\(['"](\\w+\\.\\w+)['"])/);
                
              return {
                name,
                type: typeInfo.split('(')[0],
                nullable: isNullable,
                primary: isPrimary,
                foreign: foreignMatch ? foreignMatch[1] : undefined
              };
            });
              

            dbTables.push({
              name: cls.name,
              file: fileIndex.relativePath,
              line: cls.line,
              columns
            });
          }
        });
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
      path.join(outputDir, 'AI_CONTEXT.md'),
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

function generateMarkdown(index: ProjectIndex): string {
  let md = `# AI Context - ${index.projectName}\n\n`;
  md += `> **Auto-generated project documentation for AI assistants**\n`;
  md += `> Last updated: ${new Date(index.generated).toLocaleString()}\n\n`;

  // Tech Stack
  if (index.techStack && index.techStack.length > 0) {
    md += `## 🛠️ Tech Stack\n\n`;
    index.techStack.forEach(tech => {
      md += `- ${tech}\n`;
    });
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
        if (col.foreign) { constraints.push(`FK → ${col.foreign}`);}
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

          // Show SQLAlchemy columns/properties
          if (cls.properties && cls.properties.length > 0) {
            const props = cls.properties.map(p => '`' + p + '`').join(', ');
            md += `  - **Columns**: ${props}\n`;
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
  md += `- **API Endpoints**: All routes with authentication requirements\n`;
  md += `- **Database Schema**: Complete table structures with relationships\n`;
  md += `- **Function Signatures**: All public functions with parameters\n`;
  md += `- **Dependencies**: Third-party packages used in each file\n\n`;
  md += `*This file is auto-generated. Do not edit manually.*\n`;

  return md;
}
