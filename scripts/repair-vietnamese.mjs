import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const file = new URL('holora_medical.sql', root);
const mapping = JSON.parse(readFileSync(new URL('vietnamese-reference.json', import.meta.url), 'utf8'));
const damaged = /\uFFFD|Ã|á»|áº|â€|\?\?/u;
const quote = (value) => `'${value.replaceAll("'", "''")}'`;
const hex = (value) => `CONVERT(0x${Buffer.from(value, 'utf8').toString('hex')} USING utf8mb4)`;
let sql = readFileSync(file, 'utf8');
const updates = [];
const replaceField = (table, code, column, before, after) => {
  if (!after || !damaged.test(before)) return before;
  // Match the exact damaged seed text; do not overwrite customized values.
  updates.push(`UPDATE \`${table}\` SET \`${column}\`=${hex(after)} WHERE code=${quote(code)} AND BINARY \`${column}\`=BINARY ${hex(before)};`);
  return after;
};

for (const table of ['permission', 'role', 'specialty']) {
  const statement = new RegExp('INSERT INTO `' + table + '` VALUES [^\\n]+');
  sql = sql.replace(statement, (line) => {
    if (table === 'permission') {
      return line.replace(/\((\d+),'([^']*)','([^']*)','([^']*)','([^']*)'/g, (row, id, name, code, module, description) => {
        const result = replaceField(table, code, 'description', description, mapping.permission[code]);
        return `(${id},${quote(name)},${quote(code)},${quote(module)},${quote(result)}`;
      });
    }
    if (table !== 'specialty') {
      return line.replace(/\((\d+),'([^']*)','([^']*)','([^']*)'/g, (row, id, name, code, description) => {
        const result = replaceField(table, code, 'description', description, mapping[table][code]);
        return `(${id},${quote(name)},${quote(code)},${quote(result)}`;
      });
    }
    return line.replace(/\((\d+),'([^']*)','([^']*)',(NULL|\d+),(NULL|'[^']*')/g, (row, id, name, code, parent, description) => {
      if (!mapping.specialty[code]) return row;
      const [newName, newDescription] = mapping.specialty[code];
      const resultName = replaceField(table, code, 'name', name, newName);
      const resultDescription = description === 'NULL' ? 'NULL' : quote(replaceField(table, code, 'description', description.slice(1, -1), newDescription));
      return `(${id},${quote(resultName)},${quote(code)},${parent},${resultDescription}`;
    });
  });
}
sql = sql.replace(/DEFAULT '([^'\n]*\uFFFD[^'\n]*)'/gu, (match, oldTitle) => {
  const title = 'Cuộc trò chuyện mới';
  updates.push(`UPDATE holora_mind_chats SET title=${hex(title)} WHERE BINARY title=BINARY ${hex(oldTitle)};`);
  return `DEFAULT ${quote(title)}`;
});
if (damaged.test(sql)) {
  const at = sql.search(damaged);
  throw new Error('Unmapped damaged seed text remains: ' + sql.slice(Math.max(0, at - 50), at + 80));
}

if (process.argv.includes('--write')) {
  if (updates.length) {
    const migration = new URL('docker/repair-vietnamese.sql', root);
    writeFileSync(migration, [
      '-- Generated from damaged seed values. Back up first; run only on MeDecode.',
      '-- UTF-8 strings encoded as hex to survive Windows shell pipes.',
      'SET NAMES utf8mb4;', 'START TRANSACTION;', ...updates, 'COMMIT;',
      `ALTER TABLE holora_mind_chats ALTER COLUMN title SET DEFAULT (${hex('Cuộc trò chuyện mới')});`, ''
    ].join('\n'));
    writeFileSync(file, sql);
    console.log(`Repaired ${updates.length} fields; migration: ${fileURLToPath(migration)}`);
  } else console.log('Seed is already clean. Existing repair migration preserved.');
} else console.log(`Dry run: ${updates.length} damaged fields. Use --write to repair the seed and generate a guarded migration.`);
