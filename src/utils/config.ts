import * as vscode from 'vscode';
import { ExtensionConfig } from '../types';

export function getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('aiContextIndex');

    return {
        outputPath: config.get('outputPath', '.omen-code-index'),
        outputFormat: config.get('outputFormat', 'markdown'),
        includePatterns: config.get('includePatterns', [
            'src/**/*.ts',
            'src/**/*.tsx',
            'src/**/*.js',
            'src/**/*.jsx',
            'src/**/*.py'
        ]),
        excludePatterns: config.get('excludePatterns', [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/build/**',
            '**/*.test.*',
            '**/*.spec.*'
        ]),
        autoRefresh: config.get('autoRefresh', true),
        debounceDelay: config.get('debounceDelay', 3000),
        includeClasses: config.get('includeClasses', true),
        includeInterfaces: config.get('includeInterfaces', true),
        includeImports: config.get('includeImports', false),
        maxFileSize: config.get('maxFileSize', 1048576)
    };
}
