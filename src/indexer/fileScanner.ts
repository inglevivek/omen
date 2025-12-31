import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';
import { getConfig } from '../utils/config';

export async function scanWorkspace(workspaceRoot: string): Promise<string[]> {
    const config = getConfig();
    
    // Load .gitignore if exists
    const ig = ignore();
    const gitignorePath = path.join(workspaceRoot, '.gitignore');
    
    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
        ig.add(gitignoreContent);
    }
    
    // Add configured exclude patterns
    ig.add(config.excludePatterns);

    const files: Set<string> = new Set();

    // Supported extensions
    const supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py'];

    function scanDirectory(dir: string) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(workspaceRoot, fullPath);

                // Skip if ignored
                if (ig.ignores(relativePath)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    // Recursively scan subdirectory
                    scanDirectory(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    
                    // Check if supported extension
                    if (supportedExtensions.includes(ext)) {
                        try {
                            const stats = fs.statSync(fullPath);
                            if (stats.size <= config.maxFileSize) {
                                files.add(fullPath);
                            }
                        } catch (error) {
                            console.error(`Failed to stat file ${fullPath}:`, error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to scan directory ${dir}:`, error);
        }
    }

    // Start scanning from workspace root
    scanDirectory(workspaceRoot);

    return Array.from(files);
}

export function readFileContent(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
}
