# AI Context Index

Automatically generates AI-readable index of your project structure and functions. Perfect for developers using AI coding assistants like Cursor, Copilot, or Claude.

## Features

- 🔍 **Automatic Indexing**: Scans TypeScript, JavaScript, and Python files
- 📝 **Multiple Formats**: Generate Markdown or JSON output
- ⚡ **Auto-Refresh**: Automatically updates on file save
- 🎯 **Smart Filtering**: Respects .gitignore and custom patterns
- 🏗️ **Complete Structure**: Captures functions, classes, interfaces, and imports

## Usage

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run `Generate AI Context Index`
3. Find the generated index in `.ai-context/project-index.md`

## Commands

- `AI Context: Generate AI Context Index` - Create new index
- `AI Context: Refresh AI Context Index` - Update existing index
- `AI Context: Open AI Context Index` - Open the index file

## Configuration

{
"aiContextIndex.outputPath": ".ai-context",
"aiContextIndex.outputFormat": "markdown",
"aiContextIndex.autoRefresh": true,
"aiContextIndex.debounceDelay": 3000
}
## Benefits for AI Coding

- Helps AI remember function names and locations
- Provides complete project structure context
- Reduces token usage compared to uploading full files
- Works seamlessly with Cursor, Copilot, and other AI tools

## Requirements

- VS Code 1.85.0 or higher
- Works with Cursor IDE

## Extension Settings

See VS Code Settings UI or `package.json` for full configuration options.

## Release Notes

### 0.1.0

Initial release with core functionality.

## License

MIT
