// Public records only. Configure URL + PUBLIC key in environment, not shell arguments.
import { writeFile } from 'node:fs/promises';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;
if (!url?.startsWith('https://') || !key) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required.');
const response = await fetch(`${url}/rest/v1/programs?select=*&order=created_at,id`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`Export failed: HTTP ${response.status}`);
const records = await response.json();
const file = `programs-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
await writeFile(file, JSON.stringify({ version: 1, records }, null, 2), 'utf8');
console.log(`Exported ${records.length} public programs to ${file}.`);
