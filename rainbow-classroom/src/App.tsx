import DiaryPage from './DiaryPage';
import DrawPage from './DrawPage';
import { Component, useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { contentApproved, validateVirtues, virtues } from './data/virtues';
import { dailyIndex, otherIndex, prettyDate, seoulDate } from './lib/daily';
import { cleanProgram, validateProgram, validUrl, type Program, type ProgramInput, type FieldErrors } from './lib/programs';
import { configured, deleteProgram, friendlyError, loadPrograms, saveProgram, supabase } from './lib/backend';

function Rainbow({ large = false }: { large?: boolean }) {
  return <svg className={large ? 'rainbow-art' : 'rainbow-mark'} viewBox="0 0 300 210" fill="none" aria-hidden="true">
    <defs><linearGradient id={large ? 'sheen-large' : 'sheen-small'} x1="20" y1="0" x2="270" y2="210" gradientUnits="userSpaceOnUse"><stop stopColor="white" stopOpacity=".64"/><stop offset=".5" stopColor="white" stopOpacity="0"/><stop offset="1" stopColor="#2e153b" stopOpacity=".12"/></linearGradient></defs>
    <path d="M30 175V145a120 120 0 0 1 240 0v30" stroke="#ff73ba" strokeWidth="33" strokeLinecap="round"/>
    <path d="M61 175V145a89 89 0 0 1 178 0v30" stroke="#ffab50" strokeWidth="29" strokeLinecap="round"/>
    <path d="M89 175V145a61 61 0 0 1 122 0v30" stroke="#f5dc83" strokeWidth="27" strokeLinecap="round"/>
    <path d="M115 175V145a35 35 0 0 1 70 0v30" stroke="#96cbb5" strokeWidth="25" strokeLinecap="round"/>
    <path d="M139 175V145a11 11 0 0 1 22 0v30" stroke="#96b7e7" strokeWidth="23" strokeLinecap="round"/>
    {large && <path d="M30 175V145a120 120 0 0 1 240 0v30" stroke="url(#sheen-large)" strokeWidth="33" strokeLinecap="round"/>}
  </svg>;
}
function Arrow({ diagonal = false }: { diagonal?: boolean }) { return <span aria-hidden="true">{diagonal ? '↗' : '↗'}</span>; }
function RainbowTile() { return <span className="rainbow-tile"><Rainbow /></span>; }
function Header() {
  return <header className="site-header"><Link className="brand" to="/" aria-label="무지개 교실 홈"><RainbowTile /><span>무지개 교실<span className="brand-sub">우리의 하루를, 더 다정하게</span></span></Link>
    <nav aria-label="주 메뉴"><NavLink to="/" end>프로그램</NavLink><NavLink to="/virtue">오늘의 미덕</NavLink><NavLink className="nav-admin" to="/admin" aria-label="선생님 공간"><span className="nav-admin-label">선생님 공간</span><span aria-hidden="true"> ↗</span></NavLink></nav></header>;
}
function Footer() { return <footer className="site-footer"><Link to="/" className="footer-brand"><Rainbow /> 무지개 교실</Link><p>작은 도구로 만드는, 더 따뜻한 교실.</p><span>함께 배우고, 함께 자라요.</span></footer>; }
function useDaily() {
  const [date, setDate] = useState(() => seoulDate());
  useEffect(() => {
    const update = () => setDate(seoulDate());
    const timer = window.setInterval(update, 30000);
    window.addEventListener('focus', update); document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, []);
  return date;
}
function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus('loading');
    loadPrograms().then(items => { if (active) { setPrograms(items); setStatus('ready'); } }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [version]);
  return { programs, status, reload: () => setVersion(v => v + 1) };
}
function Home() {
  const date = useDaily();
  const today = virtues[dailyIndex(date, virtues.length)];
  const { programs, status, reload } = usePrograms();
  return <main id="main">
    <section className="hero" aria-labelledby="hero-heading"><div className="hero-copy"><p className="eyebrow"><span className="tiny-spark" aria-hidden="true">✦</span> 선생님의 아이디어가 모이는 곳</p><h1 id="hero-heading">우리 교실의 하루에<br /><span>작은 무지개를.</span></h1><p className="hero-description">배움에 즐거움을, 마음에 따뜻함을.<br />수업에 필요한 작은 도구들을 한곳에서 만나 보세요.</p><Link className="button primary hero-cta" to="/virtue">오늘의 미덕 만나기 <RainbowTile /></Link><div className="hero-note"><span className="dot"/> 로그인 없이, 바로 함께할 수 있어요.</div></div>
      <div className="hero-visual" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="spark spark-one">✦</span><span className="spark spark-two">✧</span><div className="rainbow-float"><Rainbow large /></div><div className="floating-label label-one">마음이 자라는 시간 <span>♡</span></div><div className="floating-label label-two"><span className="dot"/> 오늘도, 함께 한 뼘</div><span className="visual-caption">A LITTLE KINDNESS, EVERY DAY</span></div>
    </section>
    <section className="program-section" id="programs" aria-labelledby="program-heading"><div className="section-heading"><div><p className="eyebrow">OUR CLASSROOM TOOLS</p><h2 id="program-heading">우리 교실 프로그램<span className="count">{programs.length + 4}</span></h2></div><p>필요한 순간, 가볍게 꺼내 쓰세요.</p></div>
      <div className="program-grid"><article className="featured-program"><div className="card-top"><span className="category">마음 성장</span><span className="card-number">01</span></div><div className="mini-scene" aria-hidden="true"><span className="scene-star">✦</span><Rainbow /><span className="scene-heart">♡</span><span className="scene-pill">오늘은 ‘{today.name}’</span></div><div className="program-body"><h3>오늘의 미덕</h3><p>하루 한 가지 미덕으로<br />마음이 자라는 교실을 만들어요.</p><Link className="card-action" to="/virtue">함께 시작하기 <span className="round-arrow"><Arrow /></span></Link></div></article>
        <article className="external-program tint-0"><div className="card-top"><span className="category">문서 도구 · 로컬 처리</span><span className="card-number">02</span></div><div className="external-symbol" aria-hidden="true">Aa</div><div className="program-body"><h3>PDF 글자 수</h3><p>공백 포함·제외 글자 수를 바로 확인해요. 파일과 결과는 내 기기에서만 처리해요.</p><a className="card-action" href="/pdf-counter/index.html">PDF 선택하기 <span className="round-arrow"><Arrow /></span></a></div></article>
        <article className="external-program tint-1"><div className="card-top"><span className="category">학급 운영 · 랜덤 뽑기</span><span className="card-number">03</span></div><div className="external-symbol" aria-hidden="true">✦</div><div className="program-body"><h3>빠른 뽑기</h3><p>1초 룰렛과 카드로 다음 주인공을 뽑아요. 명단 설정과 중복 제외도 간편하게.</p><Link className="card-action" to="/draw">바로 뽑기 <span className="round-arrow"><Arrow /></span></Link></div></article>
        <article className="external-program tint-2"><div className="card-top"><span className="category">마음 기록 · 로컬 저장</span><span className="card-number">04</span></div><div className="external-symbol" aria-hidden="true">✎</div><div className="program-body"><h3>나의 하루 · 일기장</h3><p>오늘의 기분과 소중한 순간을 기록해요. 일기는 내 컴퓨터 폴더에 보관해요.</p><Link className="card-action" to="/diary">일기 쓰러 가기 <span className="round-arrow"><Arrow /></span></Link></div></article>{programs.map((program, i) => <article className={`external-program tint-${i % 3}`} key={program.id}><div className="card-top"><span className="category">교실 도구</span><span className="card-number">{String(i + 5).padStart(2, '0')}</span></div><div className="external-symbol" aria-hidden="true">{['✳', '✦', '✿'][i % 3]}</div><div className="program-body"><h3>{program.title}</h3><p>{program.description}</p>{validUrl(program.url) ? <a className="card-action" href={program.url} target="_blank" rel="noopener noreferrer" aria-label={`${program.title} 새 탭에서 열기`}>프로그램 열기 <span className="round-arrow"><Arrow /></span></a> : <p className="error-text">주소를 확인 중이에요.</p>}</div></article>)}
        {programs.length === 0 && status !== 'loading' && <div className="coming-card"><div className="outlined-plus" aria-hidden="true">+</div><h3>다음 아이디어가 <br />자랄 자리</h3><p>우리 교실에 필요한 도구들이<br />하나씩 더해질 거예요.</p><span className="coming-label">차근차근 준비하고 있어요</span></div>}
      </div>
      {status === 'loading' && <p role="status" className="inline-note">프로그램 목록을 불러오고 있어요…</p>}
      {status === 'error' && <div role="alert" className="notice"><p>추가 프로그램을 불러오지 못했어요. 오늘의 미덕은 바로 사용할 수 있어요.</p><button className="text-button" onClick={reload}>다시 시도</button></div>}
    </section>
    <section className="bottom-note"><span aria-hidden="true">✦</span><p>거창하지 않아도 괜찮아요.<br /><strong>작은 실천이 모여, 우리 교실이 달라져요.</strong></p><span aria-hidden="true">✦</span></section>
  </main>;
}
function VirtuePage() {
  validateVirtues(virtues);
  const date = useDaily();
  const todayIndex = dailyIndex(date, virtues.length);
  const [selection, setSelection] = useState<{ date: string; index: number } | null>(null);
  const index = selection?.date === date ? selection.index : todayIndex;
  const virtue = virtues[index];
  const changed = index !== todayIndex;
  const [fullMessage, setFullMessage] = useState('');
  useEffect(() => { document.title = `${virtue.name} · 오늘의 미덕 | 무지개 교실`; return () => { document.title = '무지개 교실 · 오늘을 더 다정하게'; }; }, [virtue.name]);
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { setFullMessage('전체 화면을 열지 못했어요. 브라우저의 전체 화면 기능을 사용해 주세요.'); }
  }
  return <main id="main" className="virtue-page"><div className="page-toolbar"><Link to="/" className="back-link">← 프로그램으로</Link><button className="text-button" onClick={fullscreen}>화면 크게 보기 <span aria-hidden="true">⛶</span></button></div>
    <div className="virtue-intro"><p className="eyebrow">마음이 자라는 작은 습관</p><h1>오늘의 미덕</h1><p className="date-chip"><span className="dot"/>{prettyDate(date)}<span className="date-zone"> · 한국 시간</span></p></div>
    <article className="virtue-card" aria-labelledby="virtue-name"><div className="virtue-main"><div className="virtue-kicker"><span className="category">{changed ? '함께 만나 보는 미덕' : '오늘 우리 마음에 심을 씨앗'}</span><span aria-hidden="true">✦</span></div><div className="virtue-title-line"><div><p className="little-label">작지만 소중한 마음</p><h2 id="virtue-name" key={virtue.id}>{virtue.name}</h2></div><div className="virtue-rainbow"><Rainbow large /></div></div><p className="virtue-definition">{virtue.description}</p></div>
      <div className="virtue-examples"><h3><span aria-hidden="true">✳</span> 이렇게 실천해요</h3><ol>{virtue.examples.map((example, i) => <li key={example}><span className="example-number" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><span>{example}</span></li>)}</ol></div>
      <div className="practice"><span className="practice-icon" aria-hidden="true">♡</span><div><h3>오늘의 작은 실천</h3><p>{virtue.practice}</p></div></div>
    </article>
    <div className="virtue-controls"><button className="button pink" onClick={() => setSelection({ date, index: otherIndex(index, virtues.length) })} disabled={virtues.length < 2}>다른 미덕 만나기 <RainbowTile /></button>{changed && <button className="button quiet" onClick={() => setSelection(null)}>오늘의 미덕으로 돌아가기 <span aria-hidden="true">↶</span></button>}</div>
    <p className="selection-note" role="status">{changed ? '지금 화면에서만 바꾼 미덕이에요. 새로 열면 오늘의 미덕으로 돌아와요.' : '같은 날에는 같은 미덕을 만나요. 하루에 하나씩, 천천히 실천해요.'}</p>
    {fullMessage && <p role="status" className="inline-note">{fullMessage}</p>}
    {!contentApproved && <p className="draft-note">수업 준비용 초안 · 선생님이 설명과 예시를 살펴본 뒤 함께 읽어 주세요.</p>}
    <details className="source-details"><summary>미덕 내용 안내</summary><p>선생님이 제공한 미덕 생활 예시 자료를 참고해 2학년 눈높이로 새로 쓴 글이에요. 배려 항목은 제공된 버츄카드의 개념도 참고했어요. 공식 카드 원문이나 공식 감수 콘텐츠가 아닙니다.</p></details>
  </main>;
}
function useAdmin() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(!!supabase);
  const [role, setRole] = useState<'checking' | 'admin' | 'visitor' | 'error'>('checking');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    let live = true;
    supabase.auth.getSession().then(({ data, error }) => { if (live) { setSession(data.session); setAuthLoading(false); if (error) setRole('error'); } }).catch(() => { if (live) { setAuthLoading(false); setRole('error'); } });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { if (live) { setSession(next); setAuthLoading(false); } });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    let live = true;
    if (!supabase || !session) { setRole('visitor'); return; }
    setRole('checking');
    supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).abortSignal(AbortSignal.timeout(12000)).maybeSingle().then(({ data, error }) => { if (live) setRole(error ? 'error' : data ? 'admin' : 'visitor'); });
    return () => { live = false; };
  }, [session, retry]);
  return { session, authLoading, role, retry: () => setRetry(v => v + 1) };
}
function SetupNotice() {
  return <div className="setup-panel"><span className="setup-symbol" aria-hidden="true">✳</span><h2>선생님 공간을 연결할 준비가 됐어요.</h2><p>공개 프로그램을 관리하려면 관리자 로그인과 공용 저장 공간을 먼저 연결해 주세요. 오늘의 미덕은 지금 바로 사용할 수 있어요.</p><ol><li>README의 설정 안내에 따라 Supabase와 Google 로그인을 연결해요.</li><li>지정할 Google 계정의 사용자 ID를 관리자 허용 목록에 등록해요.</li><li>환경 설정을 저장하고 개발 서버를 다시 시작해요.</li></ol><Link className="button primary" to="/virtue">오늘의 미덕 열기 <RainbowTile /></Link>{import.meta.env.DEV && <Link className="preview-link" to="/admin/preview">관리 화면 미리보기 → <span>이 브라우저의 임시 시연 · 공개 저장 안 됨</span></Link>}</div>;
}
function AdminPage({ preview = false }: { preview?: boolean }) {
  const auth = useAdmin();
  const { programs: remote, status, reload } = usePrograms();
  const [demo, setDemo] = useState<Program[]>([]);
  const [editing, setEditing] = useState<Program | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Program | null>(null);
  const [message, setMessage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('error')) return '';
    return params.get('error') === 'access_denied' ? 'Google 로그인이 취소되었어요. 원할 때 다시 로그인해 주세요.' : 'Google 로그인을 완료하지 못했어요. 다시 시도해 주세요.';
  });
  const [loginBusy, setLoginBusy] = useState(false);
  const demoMode = preview && import.meta.env.DEV && !configured;
  useEffect(() => {
    const current = new URL(window.location.href);
    if (!current.searchParams.has('error')) return;
    for (const key of ['error', 'error_code', 'error_description']) current.searchParams.delete(key);
    window.history.replaceState(null, '', current.pathname + current.search + current.hash);
  }, []);
  const programs = demoMode ? demo : remote;
  const canEdit = demoMode || (!!auth.session && auth.role === 'admin');
  async function login() {
    if (!supabase) return;
    setLoginBusy(true); setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/admin` } });
      if (error) throw error;
    } catch { setMessage('로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.'); setLoginBusy(false); }
  }
  async function logout() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    setMessage(error ? '로그아웃을 완료하지 못했어요. 다시 시도해 주세요.' : '로그아웃했어요.');
    setEditing(null); setDeleting(null);
  }
  async function save(input: ProgramInput, id?: string) {
    if (demoMode) {
      if (demo.some(p => p.id !== id && p.url === input.url)) throw { code: '23505' };
      const now = new Date().toISOString();
      setDemo(items => id ? items.map(p => p.id === id ? { ...p, ...input, updated_at: now } : p) : [...items, { ...input, id: crypto.randomUUID(), created_at: now, updated_at: now }]);
    } else { await saveProgram(input, id); reload(); }
    setEditing(null); setMessage(demoMode ? '미리보기 목록에 저장했어요. 새로고침하면 사라져요.' : '저장했어요. 방문자가 목록을 새로 불러오면 변경 내용이 보여요.');
  }
  async function remove(id: string) {
    if (demoMode) setDemo(items => items.filter(p => p.id !== id));
    else { await deleteProgram(id); reload(); }
    setDeleting(null); setMessage('프로그램을 삭제했어요.');
  }
  return <main id="main" className="admin-page"><div className="page-toolbar"><Link to="/" className="back-link">← 공개 허브로</Link>{auth.session && <button className="text-button" onClick={logout}>로그아웃</button>}</div><div className="admin-heading"><p className="eyebrow">TEACHER'S SPACE</p><h1>선생님 공간</h1><p>교실에 필요한 프로그램을 하나씩 더해 보세요.</p></div>
    {message && <div className="notice" role="status">{message}</div>}
    {!configured && !demoMode ? <SetupNotice /> : !canEdit ? <div className="login-panel"><RainbowTile /><h2>{auth.authLoading || auth.role === 'checking' ? '로그인을 확인하고 있어요…' : auth.session ? '지정한 선생님 계정만 관리할 수 있어요.' : '선생님, 반가워요.'}</h2><p>{auth.session ? '관리자 계정인지 확인하고 필요하면 다른 Google 계정으로 로그인해 주세요.' : '공개 목록 수정은 지정한 Google 계정으로만 할 수 있어요.'}</p>{auth.role === 'error' && <div role="alert"><p>관리자 권한을 확인하지 못했어요.</p><button className="text-button" onClick={auth.retry}>권한 다시 확인</button></div>}{!auth.session && !auth.authLoading && <button className="button primary" disabled={loginBusy} onClick={login}>{loginBusy ? 'Google로 이동 중…' : 'Google 계정으로 로그인'} <RainbowTile /></button>}<Link className="text-button" to="/">로그인 없이 프로그램 보기 →</Link></div> : <>
      {demoMode && <div className="notice preview-notice"><strong>관리 화면 미리보기</strong><p>로그인 없이 동작을 살펴보는 개발용 화면이에요. 추가한 내용은 이 화면에서만 보이고 새로고침하면 사라집니다. 공개 허브에는 저장되지 않아요.</p></div>}
      <div className="admin-list-heading"><h2>프로그램 관리 <span className="count">{programs.length + 4}</span></h2><button className="button primary" onClick={() => { setMessage(''); setEditing('new'); }}>프로그램 추가 <span aria-hidden="true">＋</span></button></div>
      <div className="admin-list"><div className="admin-row builtin"><RainbowTile /><div className="admin-row-content"><h3>오늘의 미덕 <span className="small-badge">기본 프로그램</span></h3><p>미덕 설명과 실천 예시는 앱에 포함되어 있어요.</p></div><Link className="text-button" to="/virtue">열기 ↗</Link></div>
        {programs.map(p => <div className="admin-row" key={p.id}><div className="program-icon" aria-hidden="true">✳</div><div className="admin-row-content"><h3>{p.title}</h3><p>{p.description}</p><span className="url-label">{p.url}</span></div><div className="row-actions"><button className="text-button" onClick={() => { setMessage(''); setEditing(p); }}>수정<span className="sr-only"> {p.title}</span></button><button className="text-button danger" onClick={() => setDeleting(p)}>삭제<span className="sr-only"> {p.title}</span></button></div></div>)}
      </div>
      {programs.length === 0 && <p className="empty-hint">첫 번째 외부 프로그램을 추가해 보세요. 제목, 설명, 인터넷 주소만 있으면 돼요.</p>}
      {!demoMode && status === 'loading' && <p role="status">목록을 불러오고 있어요…</p>}{!demoMode && status === 'error' && <div className="notice" role="alert">목록을 불러오지 못했어요. <button className="text-button" onClick={reload}>다시 시도</button></div>}
      {editing && <ProgramDialog key={editing === 'new' ? 'new' : editing.id} program={editing === 'new' ? undefined : editing} onSave={save} onClose={() => setEditing(null)} />}
      {deleting && <DeleteDialog program={deleting} onDelete={remove} onClose={() => setDeleting(null)} />}
    </>}
  </main>;
}
function Dialog({ children, label, onClose, busy = false }: { children: ReactNode; label: string; onClose: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current!; dialog.showModal();
    return () => { dialog.close(); if (trigger?.isConnected) trigger.focus(); };
  }, []);
  return <dialog className="modal" ref={ref} aria-labelledby={label} onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length);
    if (!controls.length) { event.preventDefault(); return; }
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}><div className="modal-top"><RainbowTile /><button className="close-button" aria-label="닫기" disabled={busy} onClick={onClose}>×</button></div>{children}</dialog>;
}
function ProgramDialog({ program, onSave, onClose }: { program?: Program; onSave: (input: ProgramInput, id?: string) => Promise<void>; onClose: () => void }) {
  const [input, setInput] = useState<ProgramInput>(program ?? { title: '', description: '', url: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (pending.current) return;
    const form = e.currentTarget;
    const value = cleanProgram(input); const next = validateProgram(value);
    setErrors(next); setError('');
    if (Object.keys(next).length) { (form.elements.namedItem(Object.keys(next)[0]) as HTMLElement)?.focus(); return; }
    pending.current = true; setBusy(true);
    try { await onSave(value, program?.id); } catch (e) { setError(friendlyError(e)); } finally { pending.current = false; setBusy(false); }
  }
  return <Dialog label="program-dialog-title" onClose={onClose} busy={busy}><h2 id="program-dialog-title">프로그램 {program ? '수정' : '추가'}</h2><p className="modal-description">수업에 함께할 도구를 소개해 주세요.</p><form onSubmit={submit} noValidate><div className="form-fields">{(['title', 'description', 'url'] as const).map(name => <div className="field" key={name}><label htmlFor={`field-${name}`}>{({ title: '프로그램 이름', description: '한 줄 소개', url: '인터넷 주소' })[name]} <span>{name === 'title' ? '최대 60자' : name === 'description' ? '최대 200자' : 'https://'}</span></label>{name === 'description' ? <textarea id={`field-${name}`} name={name} rows={3} value={input[name]} onChange={e => setInput({ ...input, [name]: e.target.value })} disabled={busy} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `error-${name}` : undefined} /> : <input id={`field-${name}`} name={name} type={name === 'url' ? 'url' : 'text'} placeholder={name === 'url' ? 'https://example.com/' : '예: 우리 반 낱말 놀이'} value={input[name]} onChange={e => setInput({ ...input, [name]: e.target.value })} disabled={busy} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `error-${name}` : undefined} autoFocus={name === 'title'} />} {errors[name] && <p className="error-text" id={`error-${name}`}>{errors[name]}</p>}</div>)}</div>{error && <p className="error-text" role="alert">{error}</p>}<p className="form-note">학생 이름이나 개인정보는 입력하지 마세요.</p><div className="modal-actions"><button className="button quiet" type="button" disabled={busy} onClick={onClose}>취소</button><button className="button primary" type="submit" disabled={busy}>{busy ? '저장 중…' : '저장하기'} <RainbowTile /></button></div></form></Dialog>;
}
function DeleteDialog({ program, onDelete, onClose }: { program: Program; onDelete: (id: string) => Promise<void>; onClose: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const pending = useRef(false);
  async function confirm() { if (pending.current) return; pending.current = true; setBusy(true); try { await onDelete(program.id); } catch (e) { setError(friendlyError(e)); } finally { pending.current = false; setBusy(false); } }
  return <Dialog label="delete-title" onClose={onClose} busy={busy}><h2 id="delete-title">프로그램을 삭제할까요?</h2><p className="delete-description"><strong>{program.title}</strong>이(가) 공개 목록에서 사라져요. 프로그램 자체는 삭제되지 않아요.</p>{error && <p className="error-text" role="alert">{error}</p>}<div className="modal-actions"><button className="button quiet" autoFocus disabled={busy} onClick={onClose}>취소</button><button className="button pink" disabled={busy} onClick={confirm}>{busy ? '삭제 중…' : '삭제하기'}</button></div></Dialog>;
}
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { if (this.state.failed) return <main id="main" className="setup-panel"><h1>화면을 열지 못했어요.</h1><p>자료를 다시 불러와 주세요.</p><button className="button primary" onClick={() => window.location.reload()}>다시 시도</button><a className="text-button" href="/">허브로 돌아가기</a></main>; return this.props.children; }
}
function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); const main = document.getElementById('main'); main?.setAttribute('tabindex', '-1'); main?.focus({ preventScroll: true }); }, [pathname]);
  return null;
}
export default function App() {
  return <><a className="skip-link" href="#main">본문으로 바로 가기</a><Header /><ErrorBoundary><Routes><Route path="/" element={<Home />} /><Route path="/diary" element={<DiaryPage />} /><Route path="/draw" element={<DrawPage />} /><Route path="/virtue" element={<VirtuePage />} /><Route path="/admin" element={<AdminPage />} />{import.meta.env.DEV && <Route path="/admin/preview" element={<AdminPage preview />} />}<Route path="*" element={<main id="main" className="setup-panel"><h1>이 페이지는 준비되어 있지 않아요.</h1><Link className="button primary" to="/">허브로 돌아가기</Link></main>} /></Routes></ErrorBoundary><RouteFocus /><Footer /></>;
}


