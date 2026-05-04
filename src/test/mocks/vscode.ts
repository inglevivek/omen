/**
 * Minimal vscode mock — tests run outside a VS Code host.
 * Module interception in each test file routes require('vscode') here.
 */
export const workspace = {
  getConfiguration: (_section?: string) => ({
    get: <T>(_key: string, defaultValue: T): T => defaultValue,
  }),
};

export const window = {
  showInformationMessage: () => {},
  showErrorMessage: () => {},
};

export const commands = {
  registerCommand: () => ({ dispose: () => {} }),
};

export const ExtensionContext = {};
