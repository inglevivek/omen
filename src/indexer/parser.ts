import * as ts from 'typescript';
import { FunctionInfo, ClassInfo, InterfaceInfo, ImportInfo, FileIndex } from '../types';
import { getConfig } from '../utils/config';
import * as path from 'path';

export function parseFile(
  filePath: string,
  content: string,
  workspaceRoot: string
): FileIndex {
  const ext = path.extname(filePath);
  let language: 'typescript' | 'javascript' | 'python';

  if (ext === '.ts' || ext === '.tsx') {
    language = 'typescript';
  } else if (ext === '.js' || ext === '.jsx') {
    language = 'javascript';
  } else if (ext === '.py') {
    language = 'python';
    return parsePythonFile(filePath, content, workspaceRoot);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  return parseTypeScriptFile(filePath, content, workspaceRoot, language);
}

function parseTypeScriptFile(
  filePath: string,
  content: string,
  workspaceRoot: string,
  language: 'typescript' | 'javascript'
): FileIndex {
  const config = getConfig();
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const fileIndex: FileIndex = {
    path: filePath,
    relativePath: path.relative(workspaceRoot, filePath),
    functions: [],
    classes: [],
    interfaces: [],
    imports: [],
    language
  };

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node)) {
      const funcInfo = extractFunctionInfo(node, sourceFile);
      if (funcInfo) {
        fileIndex.functions.push(funcInfo);
      }
    }

    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(decl => {
        if (decl.initializer && ts.isArrowFunction(decl.initializer)) {
          const funcInfo = extractArrowFunctionInfo(decl, sourceFile);
          if (funcInfo) {
            fileIndex.functions.push(funcInfo);
          }
        }
      });
    }

    if (config.includeClasses && ts.isClassDeclaration(node)) {
      const classInfo = extractClassInfo(node, sourceFile);
      if (classInfo) {
        fileIndex.classes.push(classInfo);
      }
    }

    if (config.includeInterfaces && ts.isInterfaceDeclaration(node)) {
      const interfaceInfo = extractInterfaceInfo(node, sourceFile);
      if (interfaceInfo) {
        fileIndex.interfaces.push(interfaceInfo);
      }
    }

    if (config.includeInterfaces && ts.isTypeAliasDeclaration(node)) {
      const typeInfo = extractTypeAliasInfo(node, sourceFile);
      if (typeInfo) {
        fileIndex.interfaces.push(typeInfo);
      }
    }

    if (config.includeImports && ts.isImportDeclaration(node)) {
      const importInfo = extractImportInfo(node, sourceFile);
      if (importInfo) {
        fileIndex.imports.push(importInfo);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return fileIndex;
}

function extractJSDoc(node: any, sourceFile: ts.SourceFile): string | undefined {
  try {
    const fullText = sourceFile.getFullText();
    const nodeStart = node.getFullStart();
    const nodeActualStart = node.getStart(sourceFile);
    const trivia = fullText.substring(nodeStart, nodeActualStart);

    const jsDocRegex = /\/\*\*([\s\S]*?)\*\//;
    const match = trivia.match(jsDocRegex);

    if (match) {
      return match[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line && !line.startsWith('@'))
        .join(' ')
        .trim();
    }
  } catch (error) {
    // Silently fail if JSDoc extraction fails
  }

  return undefined;
}

function extractFunctionInfo(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): FunctionInfo | null {
  const name = node.name ? node.name.text : 'anonymous';
  const params: string[] = node.parameters.map(p => p.getText(sourceFile));
  const returnType = node.type ? node.type.getText(sourceFile) : undefined;
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const isAsync = node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;
  const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;
  const description = extractJSDoc(node, sourceFile);

  return { name, params, returnType, line, isAsync, isExported, description };
}

function extractArrowFunctionInfo(node: ts.VariableDeclaration, sourceFile: ts.SourceFile): FunctionInfo | null {
  const name = node.name.getText(sourceFile);
  const arrowFunc = node.initializer as ts.ArrowFunction;
  const params: string[] = arrowFunc.parameters.map(p => p.getText(sourceFile));
  const returnType = arrowFunc.type ? arrowFunc.type.getText(sourceFile) : undefined;
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const isAsync = arrowFunc.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;

  const parent = node.parent?.parent;
  const isExported = parent && ts.isVariableStatement(parent) 
    ? parent.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false
    : false;

  const description = extractJSDoc(parent || node, sourceFile);

  return { name, params, returnType, line, isAsync, isExported, description };
}

function extractClassInfo(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): ClassInfo | null {
  const name = node.name ? node.name.text : 'anonymous';
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;
  const methods: FunctionInfo[] = [];
  const description = extractJSDoc(node, sourceFile);
  const properties: string[] = [];

  node.members.forEach(member => {
    if (ts.isPropertyDeclaration(member) && member.name) {
      const propName = member.name.getText(sourceFile);
      const propType = member.type ? member.type.getText(sourceFile) : 'any';
      properties.push(`${propName}: ${propType}`);
    }

    if (ts.isMethodDeclaration(member) && member.name) {
      const methodName = member.name.getText(sourceFile);
      const params: string[] = member.parameters.map(p => p.getText(sourceFile));
      const returnType = member.type ? member.type.getText(sourceFile) : undefined;
      const methodLine = sourceFile.getLineAndCharacterOfPosition(member.getStart()).line + 1;
      const isAsync = member.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword) || false;
      const methodDesc = extractJSDoc(member, sourceFile);

      methods.push({
        name: methodName,
        params,
        returnType,
        line: methodLine,
        isAsync,
        isExported: false,
        description: methodDesc
      });
    }
  });

  return { name, line, methods, isExported, description, properties };
}

function extractInterfaceInfo(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): InterfaceInfo | null {
  const name = node.name.text;
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;
  const properties: string[] = node.members
    .filter(m => ts.isPropertySignature(m))
    .map(m => m.name?.getText(sourceFile) || '')
    .filter(n => n !== '');

  const description = extractJSDoc(node, sourceFile);

  return { name, line, properties, isExported, description };
}

function extractTypeAliasInfo(node: ts.TypeAliasDeclaration, sourceFile: ts.SourceFile): InterfaceInfo | null {
  const name = node.name.text;
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const isExported = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) || false;

  const properties: string[] = [];
  if (ts.isTypeLiteralNode(node.type)) {
    node.type.members.forEach(m => {
      if (ts.isPropertySignature(m) && m.name) {
        properties.push(m.name.getText(sourceFile));
      }
    });
  }

  const description = extractJSDoc(node, sourceFile);

  return { name, line, properties, isExported, description };
}

function extractImportInfo(node: ts.ImportDeclaration, sourceFile: ts.SourceFile): ImportInfo | null {
  const moduleSpecifier = node.moduleSpecifier;
  if (!ts.isStringLiteral(moduleSpecifier)) {
    return null;
  }

  const source = moduleSpecifier.text;
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const imports: string[] = [];

  if (node.importClause) {
    if (node.importClause.name) {
      imports.push(node.importClause.name.text);
    }

    if (node.importClause.namedBindings) {
      if (ts.isNamedImports(node.importClause.namedBindings)) {
        node.importClause.namedBindings.elements.forEach(el => {
          imports.push(el.name.text);
        });
      } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
        imports.push(node.importClause.namedBindings.name.text);
      }
    }
  }

  return { source, imports, line };
}

// Enhanced Python parser with docstrings and SQLAlchemy support
function parsePythonFile(filePath: string, content: string, workspaceRoot: string): FileIndex {
  const config = getConfig();
  const fileIndex: FileIndex = {
    path: filePath,
    relativePath: path.relative(workspaceRoot, filePath),
    functions: [],
    classes: [],
    interfaces: [],
    imports: [],
    language: 'python'
  };

  const lines = content.split('\n');
  let currentClass: ClassInfo | null = null;
  let currentIndent = 0;
  let pendingDocstring: string | undefined;
  let inDocstring = false;
  let docstringLines: string[] = [];
  const tripleQuote = '"""';
  const tripleSingleQuote = "'''";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const indent = line.match(/^(\s*)/)?.[1].length || 0;

    // Handle multi-line docstrings
    const hasTripleQuote = line.includes(tripleQuote) || line.includes(tripleSingleQuote);

    if (hasTripleQuote) {
      const quote = line.includes(tripleQuote) ? tripleQuote : tripleSingleQuote;
      const quoteCount = (line.match(new RegExp(quote.replace(/"/g, '\\"'), 'g')) || []).length;

      if (inDocstring) {
        // End of docstring
        const endContent = line.split(quote)[0];
        if (endContent.trim()) {
          docstringLines.push(endContent.trim());
        }
        pendingDocstring = docstringLines.join(' ').trim();
        inDocstring = false;
        docstringLines = [];
      } else if (quoteCount >= 2) {
        // Single line docstring
        const content = line.split(quote)[1] || '';
        pendingDocstring = content.trim();
      } else {
        // Start of multi-line docstring
        inDocstring = true;
        const startContent = line.split(quote)[1];
        if (startContent && startContent.trim()) {
          docstringLines = [startContent.trim()];
        }
      }
      continue;
    }

    if (inDocstring) {
      docstringLines.push(line.trim());
      continue;
    }

    // Class definitions
    const classMatch = line.match(/^class\s+(\w+)\s*\(([^)]*)\)/);
    if (classMatch) {
      const name = classMatch[1];

      currentClass = {
        name,
        line: lineNum,
        methods: [],
        isExported: true,
        description: pendingDocstring,
        properties: []
      };
      currentIndent = indent;
      pendingDocstring = undefined;

      fileIndex.classes.push(currentClass);
      continue;
    }

    // SQLAlchemy column definitions
    if (currentClass && indent > currentIndent) {
      const columnMatch = line.match(/^\s+(\w+)\s*=\s*(?:db\.)?Column\((.+)/);
      if (columnMatch) {
        const colName = columnMatch[1];
        let colDef = columnMatch[2];

        // Handle multi-line column definitions
        let fullDef = colDef;
        let j = i + 1;
        let parenCount = (colDef.match(/\(/g) || []).length - (colDef.match(/\)/g) || []).length;

        while (parenCount > 0 && j < lines.length) {
          const nextLine = lines[j].trim();
          fullDef += ' ' + nextLine;
          parenCount += (nextLine.match(/\(/g) || []).length - (nextLine.match(/\)/g) || []).length;
          i = j;
          j++;
        }

        const typeMatch = fullDef.match(/^([^,()]+)/);
        const colType = typeMatch ? typeMatch[1].trim() : 'Unknown';

        if (!currentClass.properties) {
          currentClass.properties = [];
        }
        currentClass.properties.push(`${colName}: ${colType}`);
        continue;
      }

      // Regular Python class attributes
      const attrMatch = line.match(/^\s+(\w+)\s*:\s*(.+?)\s*(?:=|$)/);
      if (attrMatch && !line.includes('def ')) {
        const attrName = attrMatch[1];
        const attrType = attrMatch[2].split('=')[0].trim();

        if (!currentClass.properties) {
          currentClass.properties = [];
        }
        currentClass.properties.push(`${attrName}: ${attrType}`);
        continue;
      }
    }

    // Method definitions
    const methodMatch = line.match(/^(\s*)(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)/);
    if (methodMatch && currentClass && indent > currentIndent) {
      const name = methodMatch[2];
      const paramsStr = methodMatch[3];
      const params = paramsStr.split(',')
        .map(p => p.trim())
        .filter(p => p !== 'self' && p !== 'cls' && p !== '');
      const isAsync = line.includes('async def');

      currentClass.methods.push({
        name,
        params,
        line: lineNum,
        isAsync,
        isExported: false,
        description: pendingDocstring
      });
      pendingDocstring = undefined;
      continue;
    }

    // Top-level function definitions
    const funcMatch = line.match(/^(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)/);
    if (funcMatch && indent === 0) {
      const name = funcMatch[1];
      const paramsStr = funcMatch[2];
      const params = paramsStr.split(',').map(p => p.trim()).filter(p => p !== '');
      const isAsync = line.includes('async def');

      fileIndex.functions.push({
        name,
        params,
        line: lineNum,
        isAsync,
        isExported: true,
        description: pendingDocstring
      });
      pendingDocstring = undefined;
      currentClass = null;
      continue;
    }

    // Reset current class if back at top level
    if (indent === 0 && currentClass && line.trim() !== '') {
      currentClass = null;
    }

    // Import statements
    if (config.includeImports) {
      const importMatch = line.match(/^(?:from\s+(\S+)\s+)?import\s+(.+)/);
      if (importMatch) {
        const source = importMatch[1] || importMatch[2].split(',')[0].trim();
        const imports = importMatch[2]
          .split(',')
          .map(i => i.trim().split(' as ')[0].trim());

        fileIndex.imports.push({
          source,
          imports,
          line: lineNum
        });
      }
    }
  }

  return fileIndex;
}
