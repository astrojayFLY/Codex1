import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { seoulDate } from './lib/daily';
import './diary.css';
type Entry = { id: string; date: string; title: string; content: string; mood: string; createdAt: string; updatedAt: string };
const moods = ['행복', '평온', '보통', '속상', '피곤'];
const icons = ['☀️', '🌿', '☁️', '🌧️', '🌙'];
const blank = () => ({ date: seoulDate(), title: '', content: '', mood: '평온' });
export default function DiaryPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState(blank);
  const [id, setId] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  async function request(method = 'GET', body?: unknown) {
    const response = await fetch('/api/diary', { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json().catch(() => { throw Error('로컬 서버를 실행해 주세요.'); });
    if (!response.ok) throw Error(data.error || '요청을 처리하지 못했어요.');
    return data;
  }
  async function load() { try { setEntries(await request()); setReady(true); setMessage(''); } catch (e) { setMessage((e as Error).message); } }
  useEffect(() => { void load(); document.title = '나의 하루 · 일기장 | 무지개 교실'; return () => { document.title = '무지개 교실'; }; }, []);
  useEffect(() => { const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  function choose(entry?: Entry) { if (dirty && !window.confirm('저장하지 않은 내용을 버릴까요?')) return; setDraft(entry || blank()); setId(entry?.id); setDirty(false); setMessage(''); }
  async function save() {
    if (busy) return;
    setBusy(true);
    try { const entry: Entry = await request(id ? 'PUT' : 'POST', { ...draft, id }); setEntries(rows => [...rows.filter(row => row.id !== entry.id), entry]); setDraft(entry); setId(entry.id); setDirty(false); setMessage('로컬 폴더에 저장했어요.'); } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  async function remove() { if (!id || !window.confirm('이 일기를 삭제할까요? 삭제한 내용은 되돌릴 수 없어요.')) return; setBusy(true); try { await request('DELETE', { id }); setEntries(rows => rows.filter(row => row.id !== id)); setDraft(blank()); setId(undefined); setDirty(false); setMessage('일기를 삭제했어요.'); } catch (e) { setMessage((e as Error).message); } finally { setBusy(false); } }
  const filtered = entries.filter(entry => `${entry.date} ${entry.title} ${entry.content} ${entry.mood}`.includes(search)).sort((a,b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  return <main id="main" className="diary-page"><div className="page-toolbar"><Link to="/" onClick={e => { if (dirty && !window.confirm('저장하지 않은 내용을 버리고 허브로 갈까요?')) e.preventDefault(); }} className="back-link">← 프로그램으로</Link><span className="category">내 컴퓨터에 보관</span></div><div className="diary-heading"><p className="eyebrow">A LITTLE MOMENT, JUST FOR YOU</p><h1>나의 하루 <span>✎</span></h1><p>평범한 하루에도, 기억하고 싶은 순간이 있어요.</p></div><div className="diary-layout"><aside className="diary-list"><div className="diary-list-top"><h2>쌓인 이야기 <small>{entries.length}</small></h2><button className="button quiet" disabled={busy} onClick={() => choose()}>＋ 새 일기</button></div><label className="sr-only" htmlFor="diary-search">일기 검색</label><input id="diary-search" type="search" placeholder="날짜, 제목, 내용 검색" value={search} onChange={e => setSearch(e.target.value)} /><div className="diary-items">{filtered.map(entry => <button key={entry.id} disabled={busy} className={`diary-item ${id === entry.id ? 'selected' : ''}`} onClick={() => choose(entry)}><span>{entry.date} · {icons[moods.indexOf(entry.mood)]}</span><strong>{entry.title}</strong><p>{entry.content.slice(0,70)}</p></button>)}{!filtered.length && <p className="diary-empty">{search ? '검색 결과가 없어요.' : '첫 번째 이야기를 남겨 보세요.\n작은 한 줄도 좋아요.'}</p>}</div></aside><section className="diary-paper"><form onSubmit={e => { e.preventDefault(); void save(); }}><fieldset disabled={busy || !ready}><div className="diary-meta"><label>기록할 날짜<input type="date" required value={draft.date} onChange={e => { setDraft({ ...draft, date: e.target.value }); setDirty(true); }} /></label><span>{id ? '다시 꺼내 보는 하루' : '오늘의 새 페이지'}</span></div><div className="diary-moods" role="group" aria-label="오늘의 기분">{moods.map((mood,i) => <button type="button" key={mood} aria-pressed={draft.mood === mood} onClick={() => { setDraft({ ...draft, mood }); setDirty(true); }}>{icons[i]} {mood}</button>)}</div><label className="sr-only" htmlFor="diary-title">일기 제목</label><input className="diary-title" id="diary-title" required maxLength={100} placeholder="오늘은 어떤 하루였나요?" value={draft.title} onChange={e => { setDraft({ ...draft, title: e.target.value }); setDirty(true); }} /><label className="sr-only" htmlFor="diary-content">일기 내용</label><textarea id="diary-content" required maxLength={30000} placeholder="기억하고 싶은 순간, 오늘 느낀 마음을 자유롭게 적어 보세요." value={draft.content} onChange={e => { setDraft({ ...draft, content: e.target.value }); setDirty(true); }} /><div className="diary-actions"><span>{draft.content.length.toLocaleString()}자 · {dirty ? '저장 전' : '편안하게 적어 보세요'}</span><div>{id && <button type="button" className="text-button danger" onClick={remove}>삭제</button>}<button className="button primary" type="submit">{busy ? '저장 중…' : '일기 저장하기'}</button></div></div></fieldset></form><p role="status" className="diary-status">{message}</p>{!ready && <button className="text-button" onClick={load}>저장소 다시 연결</button>}</section></div><p className="diary-storage">저장 위치: rainbow-classroom/data/diary.json · 이 컴퓨터의 로컬 서버에서 사용해요.</p></main>;
}
