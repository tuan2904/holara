import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const badText = /\uFFFD|Ã[\u0080-\u00bf]|á[»º]|â€|Ä‘|Æ°/u;
function files(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? files(child) : [child];
  });
}

test('Application sources and SQL seed contain valid UTF-8 without known mojibake', () => {
  const targets = ['frontend/src', 'laravel-backend/app', 'laravel-backend/routes']
    .flatMap((dir) => files(join(root, dir)))
    .filter((path) => ['.js', '.jsx', '.json', '.css', '.php'].includes(extname(path)));
  targets.push(join(root, 'holora_medical.sql'));
  for (const path of targets) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path));
    assert.equal(badText.test(text), false, `Damaged text in ${path}`);
  }
});

test('Vietnamese reference data and chat default are present in clean seed', () => {
  const seed = readFileSync(join(root, 'holora_medical.sql'), 'utf8');
  const map = JSON.parse(readFileSync(new URL('vietnamese-reference.json', import.meta.url), 'utf8'));
  for (const description of [...Object.values(map.permission), ...Object.values(map.role)]) {
    assert.ok(seed.includes(`'${description}'`), description);
  }
  for (const [name, description] of Object.values(map.specialty)) {
    assert.ok(seed.includes(`'${name}'`), name);
    if (description) assert.ok(seed.includes(`'${description}'`), description);
  }
  assert.ok(seed.includes("DEFAULT 'Cuộc trò chuyện mới'"));
});

test('Live repair only updates known damaged values; no data reset or role changes', () => {
  const sql = readFileSync(join(root, 'docker/repair-vietnamese.sql'), 'utf8');
  assert.doesNotMatch(sql, /^\s*(DROP|TRUNCATE|DELETE|INSERT)\b/im);
  assert.doesNotMatch(sql, /\b(user_role|role_permission|users)\b/i);
  const updates = sql.split('\n').filter((line) => line.startsWith('UPDATE '));
  assert.equal(updates.length, 102);
  for (const statement of updates) assert.match(statement, /WHERE .*BINARY .*BINARY CONVERT\(0x/);
});
