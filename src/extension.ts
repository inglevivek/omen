import * as vscode from 'vscode';
import { generateIndex } from './indexer/generator';
import { getConfig } from './utils/config';
import * as path from 'path';
import * as fs from 'fs';

let statusBarItem: vscode.StatusBarItem;
let fileWatcher: vscode.FileSystemWatcher | undefined;
let debounceTimer: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Context Index extension is now active');

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = "$(file-code) AI Context";
    statusBarItem.tooltip = "AI Context Index";
    statusBarItem.command = 'ai-context-index.openIndex';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register commands
    const generateCommand = vscode.commands.registerCommand(
        'omen.generateIndex',
        async () => {
            await handleGenerateIndex();
        }
    );

    const refreshCommand = vscode.commands.registerCommand(
        'omen.refreshIndex',
        async () => {
            await handleGenerateIndex(true);
        }
    );

    const openCommand = vscode.commands.registerCommand(
        'omen.openIndex',
        async () => {
            await openIndexFile();
        }
    );

    context.subscriptions.push(generateCommand, refreshCommand, openCommand);

    // Setup file watcher if auto-refresh is enabled
    setupFileWatcher(context);

    // Generate index on activation if workspace is open
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        vscode.window.showInformationMessage(
            'AI Context Index: Ready! Use "Generate AI Context Index" to create index.'
        );
    }
}

async function handleGenerateIndex(isRefresh: boolean = false) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const action = isRefresh ? 'Refreshing' : 'Generating';
    statusBarItem.text = `$(sync~spin) ${action}...`;

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `${action} Omen`,
                cancellable: false
            },
            async (progress) => {
                progress.report({ increment: 0, message: 'Scanning files...' });
                
                const result = await generateIndex(workspaceFolder.uri.fsPath);
                
                progress.report({ increment: 100, message: 'Complete!' });
                
                vscode.window.showInformationMessage(
                    `Omen ${isRefresh ? 'refreshed' : 'generated'}: ${result.fileCount} files, ${result.functionCount} functions`
                );
                
                statusBarItem.text = "$(file-code) AI Context";
            }
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to generate index: ${errorMessage}`);
        statusBarItem.text = "$(error) AI Context";
    }
}

async function openIndexFile() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const config = getConfig();
    const indexPath = path.join(
        workspaceFolder.uri.fsPath,
        config.outputPath,
        'project-index.md'
    );

    if (!fs.existsSync(indexPath)) {
        const result = await vscode.window.showInformationMessage(
            'Index file not found. Generate it now?',
            'Generate',
            'Cancel'
        );
        
        if (result === 'Generate') {
            await handleGenerateIndex();
            // Try to open again after generation
            if (fs.existsSync(indexPath)) {
                const doc = await vscode.workspace.openTextDocument(indexPath);
                await vscode.window.showTextDocument(doc);
            }
        }
        return;
    }

    const doc = await vscode.workspace.openTextDocument(indexPath);
    await vscode.window.showTextDocument(doc);
}

function setupFileWatcher(context: vscode.ExtensionContext) {
    const config = getConfig();
    
    if (!config.autoRefresh) {
        return;
    }

    // Clean up existing watcher
    if (fileWatcher) {
        fileWatcher.dispose();
    }

    // Create file watcher for workspace files
    fileWatcher = vscode.workspace.createFileSystemWatcher(
        '**/*.{ts,tsx,js,jsx,py}',
        false,
        false,
        false
    );

    const handleFileChange = () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        const delay = Math.max(config.debounceDelay, 1000);
        
        debounceTimer = setTimeout(async () => {
            console.log('Auto-refreshing AI Context Index...');
            await handleGenerateIndex(true);
        }, delay);
    };

    fileWatcher.onDidChange(handleFileChange);
    fileWatcher.onDidCreate(handleFileChange);
    fileWatcher.onDidDelete(handleFileChange);

    context.subscriptions.push(fileWatcher);
}

export function deactivate() {
    if (fileWatcher) {
        fileWatcher.dispose();
    }
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}
