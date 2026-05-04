import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

// Intercept require('vscode') before any src imports
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

// ─── TypeScript ───────────────────────────────────────────────────────────────
suite('Parser — TypeScript', () => {
  let result: ReturnType<typeof parseFile>;

  suiteSetup(() => {
    const fp = path.join(fixturesDir, 'sample.ts');
    result = parseFile(fp, fs.readFileSync(fp, 'utf-8'), workspaceRoot);
  });

  test('language detected as typescript', () => {
    assert.strictEqual(result.language, 'typescript');
  });

  test('relativePath contains directory separator', () => {
    assert.ok(
      result.relativePath.includes(path.sep) || result.relativePath.includes('/'),
      `Got: "${result.relativePath}"`
    );
  });

  test('detects exported class UserController', () => {
    const cls = result.classes.find(c => c.name === 'UserController');
    assert.ok(cls, 'UserController not found');
    assert.strictEqual(cls!.isExported, true);
  });

  test('detects class methods getUsers and createUser', () => {
    const cls = result.classes.find(c => c.name === 'UserController')!;
    const names = cls.methods.map(m => m.name);
    assert.ok(names.includes('getUsers'), 'Missing getUsers');
    assert.ok(names.includes('createUser'), 'Missing createUser');
  });

  test('getUsers is async', () => {
    const cls = result.classes.find(c => c.name === 'UserController')!;
    assert.strictEqual(cls.methods.find(m => m.name === 'getUsers')!.isAsync, true);
  });

  test('detects exported interface UserDto', () => {
    const iface = result.interfaces.find(i => i.name === 'UserDto');
    assert.ok(iface, 'UserDto not found');
    assert.strictEqual(iface!.isExported, true);
  });

  test('UserDto has id, name, email properties', () => {
    const iface = result.interfaces.find(i => i.name === 'UserDto')!;
    assert.ok(iface.properties.includes('id'));
    assert.ok(iface.properties.includes('name'));
    assert.ok(iface.properties.includes('email'));
  });

  test('detects async top-level function formatUserName', () => {
    const fn = result.functions.find(f => f.name === 'formatUserName');
    assert.ok(fn, 'formatUserName not found');
    assert.strictEqual(fn!.isAsync, true);
    assert.strictEqual(fn!.isExported, true);
  });

  test('detects non-async function getUserById', () => {
    const fn = result.functions.find(f => f.name === 'getUserById');
    assert.ok(fn, 'getUserById not found');
    assert.strictEqual(fn!.isAsync, false);
  });

  test('class properties include router and baseUrl', () => {
    const cls = result.classes.find(c => c.name === 'UserController')!;
    const props = (cls.properties ?? []).map(p => p.split(':')[0].trim());
    assert.ok(props.includes('router'));
    assert.ok(props.includes('baseUrl'));
  });
});

// ─── Python ───────────────────────────────────────────────────────────────────
suite('Parser — Python', () => {
  let result: ReturnType<typeof parseFile>;

  suiteSetup(() => {
    const fp = path.join(fixturesDir, 'sample.py');
    result = parseFile(fp, fs.readFileSync(fp, 'utf-8'), workspaceRoot);
  });

  test('language detected as python', () => assert.strictEqual(result.language, 'python'));

  test('relativePath contains separator', () => {
    assert.ok(result.relativePath.includes(path.sep) || result.relativePath.includes('/'));
  });

  test('detects class UserModel', () => {
    assert.ok(result.classes.find(c => c.name === 'UserModel'), 'UserModel not found');
  });

  test('UserModel has docstring description', () => {
    const cls = result.classes.find(c => c.name === 'UserModel')!;
    assert.ok(cls.description && cls.description.length > 0);
  });

  test('detects method get_display_name', () => {
    const cls = result.classes.find(c => c.name === 'UserModel')!;
    assert.ok(cls.methods.some(m => m.name === 'get_display_name'));
  });

  test('detects top-level function list_users', () => {
    assert.ok(result.functions.find(f => f.name === 'list_users'));
  });

  test('detects async function background_job', () => {
    const fn = result.functions.find(f => f.name === 'background_job');
    assert.ok(fn);
    assert.strictEqual(fn!.isAsync, true);
  });

  test('detects flask import', () => {
    assert.ok(result.imports.find(i => i.source === 'flask'));
  });
});

// ─── Rust ─────────────────────────────────────────────────────────────────────
suite('Parser — Rust', () => {
  let result: ReturnType<typeof parseFile>;

  suiteSetup(() => {
    const fp = path.join(fixturesDir, 'sample.rs');
    result = parseFile(fp, fs.readFileSync(fp, 'utf-8'), workspaceRoot);
  });

  test('language detected as rust', () => assert.strictEqual(result.language, 'rust'));

  test('relativePath contains separator', () => {
    assert.ok(result.relativePath.includes(path.sep) || result.relativePath.includes('/'));
  });

  test('detects pub struct User', () => {
    const s = result.classes.find(c => c.name === 'User');
    assert.ok(s, 'User struct not found');
    assert.strictEqual(s!.isExported, true);
  });

  test('detects pub enum Status', () => {
    const e = result.classes.find(c => c.name === 'Status');
    assert.ok(e, 'Status enum not found');
    assert.strictEqual(e!.isExported, true);
  });

  test('detects pub trait Repository', () => {
    const t = result.interfaces.find(i => i.name === 'Repository');
    assert.ok(t, 'Repository trait not found');
    assert.strictEqual(t!.isExported, true);
  });

  test('detects pub async fn get_users', () => {
    const fn = result.functions.find(f => f.name === 'get_users');
    assert.ok(fn);
    assert.strictEqual(fn!.isAsync, true);
    assert.strictEqual(fn!.isExported, true);
  });

  test('detects pub async fn create_user', () => {
    const fn = result.functions.find(f => f.name === 'create_user');
    assert.ok(fn);
    assert.strictEqual(fn!.isAsync, true);
  });

  test('detects private fn internal_helper', () => {
    const fn = result.functions.find(f => f.name === 'internal_helper');
    assert.ok(fn);
    assert.strictEqual(fn!.isExported, false);
  });

  test('detects actix_web, serde, tokio imports', () => {
    const sources = result.imports.map(i => i.source);
    assert.ok(sources.some(s => s.includes('actix_web')));
    assert.ok(sources.some(s => s.includes('serde')));
    assert.ok(sources.some(s => s.includes('tokio')));
  });

  test('User struct has doc comment', () => {
    const s = result.classes.find(c => c.name === 'User')!;
    assert.ok(s.description && s.description.length > 0);
  });

  test('get_users has doc comment', () => {
    const fn = result.functions.find(f => f.name === 'get_users')!;
    assert.ok(fn.description && fn.description.length > 0);
  });

  test('internal_helper has 2 params', () => {
    const fn = result.functions.find(f => f.name === 'internal_helper')!;
    assert.strictEqual(fn.params.length, 2);
  });

  test('internal_helper return type is u32', () => {
    const fn = result.functions.find(f => f.name === 'internal_helper')!;
    assert.ok(fn.returnType?.includes('u32'));
  });

  test('no &self or self in any param list', () => {
    const params = result.functions.flatMap(f => f.params);
    assert.ok(!params.includes('&self'));
    assert.ok(!params.includes('self'));
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────
suite('Parser — Error handling', () => {
  test('throws on unsupported extension (.go)', () => {
    assert.throws(
      () => parseFile('/fake/file.go', 'package main', '/fake'),
      /Unsupported file type/
    );
  });

  test('empty Rust file returns empty arrays', () => {
    const r = parseFile('/fake/empty.rs', '', '/fake');
    assert.strictEqual(r.language, 'rust');
    assert.strictEqual(r.functions.length, 0);
    assert.strictEqual(r.classes.length, 0);
  });

  test('empty Python file returns empty arrays', () => {
    const r = parseFile('/fake/empty.py', '', '/fake');
    assert.strictEqual(r.language, 'python');
    assert.strictEqual(r.functions.length, 0);
  });
});
