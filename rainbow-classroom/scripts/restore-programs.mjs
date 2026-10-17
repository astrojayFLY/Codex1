// Local SQL generation only: review output and run ONLY against a test database first.
import { readFile, writeFile } from 'node:fs/promises';
const input = process.argv[2];
if (!input) throw new Error('Pass a backup JSON file.');
const { records, version } = JSON.parse(await readFile(input, 'utf8'));
if (version !== 1 || !Array.isArray(records)) throw new Error('Unsupported backup.');
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const rows = records.map(p => {
  if (!/^[0-9a-f-]{36}$/i.test(p.id) || !p.title || !p.description || !String(p.url).startsWith('https://')) throw new Error('Invalid backup row.');
  return `insert into public.programs(id,title,description,url,created_at,updated_at) values (${[p.id,p.title,p.description,p.url,p.created_at,p.updated_at].map(quote).join(',')}) on conflict(id) do nothing;`;
});
const output = input + '.restore.sql';
await writeFile(output, '-- Review before running in a TEST database. Does not delete existing rows.\nbegin;\n' + rows.join('\n') + '\ncommit;\n');
console.log(`Created restore SQL for ${rows.length} rows: ${output}`);
