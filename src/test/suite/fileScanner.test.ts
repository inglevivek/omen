import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

import Module from 'module';
const _orig = (Module as any)._load;
(Module as any)._load = function (request: string, ...args: any[]) {
  if (request === 'vscode') {
    return { workspace: { getConfiguration: () => ({ get: (_k: string, d: any) => d }) } };
  }
  return _orig(request, ...args);
};

import { scanWorkspace } from '../../indexer/fileScanner';

suite('FileScanner — extension filtering', () => {
  let tmpDir: string;

  suiteSetup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omen-scan-'));

    // Root-level files of various extensions
    const files = [
      'main.ts', 'app.tsx', 'index.js', 'component.jsx',
      'server.py', 'main.rs', 'README.md', 'config.json',
      'Makefile', 'styles.css',
    ];
    files.forEach(f => fs.writeFileSync(path.join(tmpDir, f), '// content'));

    // Nested src/ directory
    fs.mkdirSync(path.join(tmpDir, 'src'));
    fs.writeFileSync(path.join(tmpDir, 'src', 'util.rs'),   'pub fn helper() {}');
    fs.writeFileSync(path.join(tmpDir, 'src', 'types.ts'),  'export type Foo = string;');

    // node_modules — must be ignored
    fs.mkdirSync(path.join(tmpDir, 'node_modules', 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'node_modules', 'pkg', 'index.js'), 'module.exports={};');
  });

  suiteTeardown(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  test('includes .ts files',  async () => { const f = await scanWorkspace(tmpDir); assert.ok(f.some(x => x.endsWith('.ts'))); });
  test('includes .tsx files', async () => { const f = await scanWorkspace(tmpDir); assert.ok(f.some(x => x.endsWith('.tsx'))); });
  test('includes .js files',  async () => { const f = await scanWorkspace(tmpDir); assert.ok(f.some(x => x.endsWith('.js'))); });
  test('includes .py files',  async () => { const f = await scanWorkspace(tmpDir); assert.ok(f.some(x => x.endsWith('.py'))); });

  test('includes .rs files (Rust support)', async () => {
    const f = await scanWorkspace(tmpDir);
    const rs = f.filter(x => x.endsWith('.rs'));
    assert.ok(rs.length >= 2, `Expected >=2 .rs files, got ${rs.length}`);
  });

  test('excludes .md files',   async () => { const f = await scanWorkspace(tmpDir); assert.ok(!f.some(x => x.endsWith('.md'))); });
  test('excludes .json files', async () => { const f = await scanWorkspace(tmpDir); assert.ok(!f.some(x => x.endsWith('.json'))); });
  test('excludes .css files',  async () => { const f = await scanWorkspace(tmpDir); assert.ok(!f.some(x => x.endsWith('.css'))); });

  test('excludes node_modules', async () => {
    const f = await scanWorkspace(tmpDir);
    assert.ok(!f.some(x => x.includes('node_modules')));
  });

  test('scans nested directories recursively', async () => {
    const f = await scanWorkspace(tmpDir);
    assert.ok(f.some(x => x.includes(path.join('src', 'util.rs'))));
  });

  test('returns absolute paths', async () => {
    const f = await scanWorkspace(tmpDir);
    f.forEach(x => assert.ok(path.isAbsolute(x), `Not absolute: ${x}`));
  });

  test('respects maxFileSize — skips oversized files', async () => {
    const big = path.join(tmpDir, 'big.ts');
    fs.writeFileSync(big, 'x'.repeat(1048577));   // > 1 MB
    const f = await scanWorkspace(tmpDir);
    assert.ok(!f.includes(big), 'Oversized file should be excluded');
    fs.unlinkSync(big);
  });
});
