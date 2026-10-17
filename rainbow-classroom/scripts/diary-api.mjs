import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export function diaryApi(directory = fileURLToPath(new URL('../data/', import.meta.url))) {
  const file = path.join(directory, 'diary.json');
  const read = () => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  const write = rows => {
    fs.mkdirSync(directory, { recursive: true });
    const temporary = file + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify(rows, null, 2), { mode: 0o600 });
    fs.renameSync(temporary, file);
  };
  return async (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/api/diary') return next();
    const reply = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
    if (!/^((127\.0\.0\.1|localhost)(:\d+)?)$/.test(req.headers.host || '') || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`)) return reply(403, { error: '허용되지 않은 요청이에요.' });
    try {
      if (req.method === 'GET') return reply(200, read());
      if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return reply(405, { error: '지원하지 않는 요청이에요.' });
      if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'JSON 요청이 필요해요.' });
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 150000) return reply(413, { error: '내용이 너무 길어요.' }); }
      const input = JSON.parse(raw);
      const rows = read();
      const index = rows.findIndex(row => row.id === input.id);
      if (req.method !== 'POST' && index < 0) return reply(404, { error: '일기를 찾지 못했어요.' });
      if (req.method === 'DELETE') { rows.splice(index, 1); write(rows); return reply(200, { ok: true }); }
      const { date, title, content, mood } = input;
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || typeof title !== 'string' || !title.trim() || title.length > 100 || typeof content !== 'string' || !content.trim() || content.length > 30000 || !['행복', '평온', '보통', '속상', '피곤'].includes(mood)) return reply(400, { error: '날짜, 제목(100자), 내용(30,000자), 기분을 확인해 주세요.' });
      const now = new Date().toISOString();
      const entry = { id: req.method === 'POST' ? randomUUID() : rows[index].id, date, title: title.trim(), content: content.trim(), mood, createdAt: req.method === 'POST' ? now : rows[index].createdAt, updatedAt: now };
      if (req.method === 'POST') rows.push(entry); else rows[index] = entry;
      write(rows); reply(200, entry);
    } catch (error) { reply(error instanceof SyntaxError ? 400 : 500, { error: error instanceof SyntaxError ? '저장 데이터를 읽지 못했어요. 파일을 확인해 주세요.' : '저장하지 못했어요. 로컬 폴더 권한과 남은 공간을 확인해 주세요.' }); }
  };
}
