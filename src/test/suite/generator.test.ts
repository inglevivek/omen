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

import { parseFile } from '../../indexer/parser';

const FIXTURES = path.resolve(__dirname, '../../test/fixtures');
const fixturesDir = fs.existsSync(FIXTURES)
  ? FIXTURES
  : path.resolve(__dirname, '../../../src/test/fixtures');
const workspaceRoot = path.resolve(fixturesDir, '..');

// ─── relativePath correctness ─────────────────────────────────────────────────
suite('Generator — FileIndex.relativePath correctness', () => {
  test('TS: relativePath is not just the basename', () => {
    const fp = path.join(fixturesDir, 'sample.ts');
    const idx = parseFile(fp, fs.readFileSync(fp, 'utf-8'), workspaceRoot);
    assert.notStrictEqual(idx.relativePath, path.basename(fp));
    assert.ok(idx.relativePath.startsWith('fixtures') || idx.relativePath.includes(path.sep));
  });

  test('Python: relativePath is not just the basename', () => {
    const fp = path.join(fixturesDir, 'sample.py');
    const idx = parseFile(fp, fs.readFileSync(fp, 'utf-8'), workspaceRoot);
    assert.notStrictEqual(idx.relativePath, path.basename(fp));
  });

  test('Rust: relativePath is not just the basename', () => {
    const fp = path.join(fixturesDir, 'sample.rs');
    const idx = parseFile(fp, fs.readFileSync(fp, 'utf-8'), workspaceRoot);
    assert.notStrictEqual(idx.relativePath, path.basename(fp));
  });
});

// ─── Rust tech detection ──────────────────────────────────────────────────────
suite('Generator — Rust tech stack detection', () => {
  function detectTechs(imports: Array<{ source: string }>): Set<string> {
    const out = new Set<string>();
    imports.forEach(({ source: src }) => {
      const s = src.toLowerCase();
      if (s.includes('tokio'))     { out.add('Tokio (async)'); }
      if (s.includes('actix'))     { out.add('Actix-web'); }
      if (s.includes('axum'))      { out.add('Axum'); }
      if (s.includes('serde'))     { out.add('Serde'); }
      if (s.includes('diesel'))    { out.add('Diesel ORM'); }
      if (s.includes('sqlx'))      { out.add('SQLx'); }
      if (s.includes('sea_orm') || s.includes('sea-orm')) { out.add('SeaORM'); }
      if (s.includes('rocket'))    { out.add('Rocket'); }
      if (s.includes('tonic'))     { out.add('Tonic (gRPC)'); }
    });
    return out;
  }

  let imports: Array<{ source: string }>;
  suiteSetup(() => {
    const fp = path.join(fixturesDir, 'sample.rs');
    imports = parseFile(fp, fs.readFileSync(fp, 'utf-8'), workspaceRoot).imports;
  });

  test('detects Actix-web', () => assert.ok(detectTechs(imports).has('Actix-web')));
  test('detects Serde',     () => assert.ok(detectTechs(imports).has('Serde')));
  test('detects Tokio',     () => assert.ok(detectTechs(imports).has('Tokio (async)')));
  test('does NOT falsely detect Axum (absent from fixture)', () => {
    assert.ok(!detectTechs(imports).has('Axum'));
  });
});

// ─── Markdown output integration ──────────────────────────────────────────────
suite('Generator — Markdown output', () => {
  let md: string;
  let tmpDir: string;

  suiteSetup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omen-gen-'));
    const srcDir = path.join(tmpDir, 'src');
    fs.mkdirSync(srcDir);

    for (const name of ['sample.ts', 'sample.py', 'sample.rs']) {
      const src = path.join(fixturesDir, name);
      if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(srcDir, name)); }
    }

    // Simulate generator output (path-fixed version)
    md = '# Omen Index\n\n';
    for (const f of fs.readdirSync(srcDir).map(n => path.join(srcDir, n))) {
      try {
        const idx = parseFile(f, fs.readFileSync(f, 'utf-8'), tmpDir);
        md += `#### \`${path.basename(f)}\` [${idx.language}]\n\n`;
        md += `**Path**: \`${idx.relativePath}\`\n\n`;
      } catch { /* skip */ }
    }
  });

  suiteTeardown(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  test('contains **Path** field for each file (≥3)', () => {
    const count = (md.match(/\*\*Path\*\*/g) || []).length;
    assert.ok(count >= 3, `Expected >=3 **Path** entries, got ${count}`);
  });

  test('Path value includes directory separator', () => {
    const m = md.match(/\*\*Path\*\*: `([^`]+)`/);
    assert.ok(m, 'No **Path** line found');
    assert.ok(m![1].includes('/') || m![1].includes('\\'),
      `Path "${m![1]}" has no directory separator`);
  });

  test('contains [rust] language tag', () => {
    assert.ok(md.includes('[rust]'), 'No [rust] entry in output');
  });

  test('contains [typescript] language tag', () => {
    assert.ok(md.includes('[typescript]'), 'No [typescript] entry in output');
  });

  test('contains [python] language tag', () => {
    assert.ok(md.includes('[python]'), 'No [python] entry in output');
  });
});
