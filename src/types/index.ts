export interface FunctionInfo {
  name: string;
  params: string[];
  returnType?: string;
  line: number;
  isAsync?: boolean;
  isExported?: boolean;
  description?: string;  // NEW: JSDoc/docstring
}

export interface ClassInfo {
  name: string;
  line: number;
  methods: FunctionInfo[];
  isExported?: boolean;
  description?: string;  // NEW: Class documentation
  properties?: string[];  // NEW: For SQLAlchemy columns or TypeScript properties
}

export interface InterfaceInfo {
  name: string;
  line: number;
  properties: string[];
  isExported?: boolean;
  description?: string;  // NEW: Interface documentation
}

export interface ImportInfo {
  source: string;
  imports: string[];
  line: number;
}

export interface FileIndex {
  path: string;
  relativePath: string;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  imports: ImportInfo[];
  language: 'typescript' | 'javascript' | 'python';
}

export interface ProjectIndex {
  projectName: string;
  generated: string;
  fileCount: number;
  functionCount: number;
  classCount: number;
  files: FileIndex[];
  techStack?: string[];  // NEW: Detected technologies
  apiEndpoints?: ApiEndpoint[];  // NEW: Extracted API routes
  dbSchema?: DbTable[];  // NEW: Database schema
}

export interface ApiEndpoint {
  method: string;
  path: string;
  handler: string;
  file: string;
  line: number;
  auth?: boolean;
}

export interface DbTable {
  name: string;
  file: string;
  line: number;
  columns: DbColumn[];
}

export interface DbColumn {
  name: string;
  type: string;
  nullable?: boolean;
  primary?: boolean;
  foreign?: string;
}

export interface ExtensionConfig {
  outputPath: string;
  outputFormat: 'markdown' | 'json' | 'both';
  includePatterns: string[];
  excludePatterns: string[];
  autoRefresh: boolean;
  debounceDelay: number;
  includeClasses: boolean;
  includeInterfaces: boolean;
  includeImports: boolean;
  maxFileSize: number;
}

export interface GenerationResult {
  fileCount: number;
  functionCount: number;
  classCount: number;
}
