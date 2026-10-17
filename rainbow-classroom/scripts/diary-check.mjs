import { diaryApi } from './diary-api.mjs';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'diary-check-'));
const server = createServer(diaryApi(folder));
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}/api/diary`;
const call = async (method, body, extra = {}) => fetch(url, { method, headers: { 'Content-Type': 'application/json', ...extra }, body: body ? JSON.stringify(body) : undefined });
try {
  const input = { date: '2026-10-17', title: '저장 확인', content: '로컬 기록', mood: '평온' };
  const created = await (await call('POST', input)).json();
  assert.ok(created.id);
  assert.equal(JSON.parse(fs.readFileSync(path.join(folder, 'diary.json')))[0].content, input.content);
  assert.equal((await (await call('GET')).json()).length, 1);
  assert.equal((await call('POST', { ...input, date: '2026-02-30' })).status, 400);
  assert.equal((await call('POST', input, { Origin: 'https://example.com' })).status, 403);
  const edited = await (await call('PUT', { ...input, id: created.id, content: '수정된 기록' })).json();
  assert.equal(edited.content, '수정된 기록');
  assert.equal(edited.createdAt, created.createdAt);
  await call('DELETE', { id: created.id });
  assert.deepEqual(await (await call('GET')).json(), []);
  console.log('PASS: disk persistence, read, edit, delete, date validation, origin protection');
} finally {
  await new Promise(resolve => server.close(resolve));
  fs.unlinkSync(path.join(folder, 'diary.json'));
  fs.rmdirSync(folder);
}
