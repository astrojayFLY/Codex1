import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { parseRoster, randomIndex } from './lib/draw';
import './draw.css';

const colors = ['#f5a7bc','#ffd49a','#f6e596','#a9d9c3','#a8d8ed','#b6b8eb','#d3b2ec','#edb5d8'];
export default function DrawPage() {
  const [roster, setRoster] = useState(() => Array.from({length:24}, (_,i) => `${i+1}번`));
  const [draft, setDraft] = useState(roster.join('\n'));
  const [count, setCount] = useState('24');
  const [excluded, setExcluded] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [exclude, setExclude] = useState(true);
  const [mode, setMode] = useState<'wheel'|'cards'>('wheel');
  const [editing, setEditing] = useState(false);
  const [compact, setCompact] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState('');
  const [message, setMessage] = useState('');
  const [angle, setAngle] = useState(0);
  const [card, setCard] = useState<number|null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const pending = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const pool = roster.filter(n => !excluded.includes(n));
  useEffect(() => () => { if(timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { document.title = '빠른 뽑기 | 무지개 교실'; return () => {document.title = '무지개 교실';}; }, []);
  useEffect(() => { if(editing) dialog.current?.showModal(); }, [editing]);
  function reset() { setExcluded([]); setHistory([]); setResult(''); setCard(null); setAngle(0); setMessage('모든 인원이 돌아왔어요.'); }
  function draw(cardIndex: number|null = null) {
    if(pending.current || !pool.length) return;
    pending.current = true; setBusy(true); setResult(''); setMessage(''); setCard(cardIndex);
    const candidates = result && exclude ? pool.filter(n => n !== result) : pool;
    if (!candidates.length) { pending.current = false; setBusy(false); return; }
    if (result && exclude) setExcluded(old => [...old,result]);
    if (cardIndex !== null) setCard(cardIndex % candidates.length);
    const index = randomIndex(candidates.length), selected = candidates[index];
    const target = (360 - (index + .5) * 360 / candidates.length) % 360;
    setAngle(previous => previous + 1080 + ((target - previous % 360 + 360) % 360));
    timer.current = setTimeout(() => {
      setResult(selected); setHistory(old => [selected,...old]);
      // Keep the wheel's sectors unchanged until the next draw so the pointer matches the winner.
      setBusy(false); pending.current = false;
    }, 1000);
  }
  function next(cardIndex: number|null = null) {
    draw(cardIndex);
  }
  const remaining = pool.length - (result && exclude && !excluded.includes(result) ? 1 : 0);
  async function fullscreen() { try { if(document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch {setMessage('브라우저의 전체 화면 기능을 사용해 주세요.');} }
  return <main id="main" className={`draw-page ${compact ? 'draw-compact' : ''}`}>
    <div className="page-toolbar"><Link to="/" className="back-link">← 프로그램으로</Link><div><button className="text-button" onClick={fullscreen}>전체 화면</button> · <button className="text-button" disabled={busy} onClick={() => setCompact(!compact)}>{compact ? '펼치기' : '작게 접기'}</button></div></div>
    <div className="draw-heading"><p className="eyebrow">QUICK PICK · 우리 반의 다음 주인공</p><h1>빠른 뽑기 <span>✦</span></h1><p>기다림은 짧게, 참여는 골고루. 1초면 충분해요.</p></div>
    <section className="draw-shell" aria-label="학생 뽑기">
      <div className="draw-top"><div className="draw-tabs" role="group" aria-label="뽑기 방식"><button aria-pressed={mode==='wheel'} disabled={busy} onClick={()=>{setMode('wheel');setCard(null);}}>룰렛</button><button aria-pressed={mode==='cards'} disabled={busy} onClick={()=>{setMode('cards');setCard(null);}}>카드</button></div><button className="text-button" disabled={busy} onClick={()=>{setDraft(roster.join('\n'));setEditing(true);setMessage('');}}>명단 설정 ↗</button></div>
      {!compact && (mode === 'wheel' ? <div className="wheel-wrap"><span className="wheel-pointer" aria-hidden="true">▼</span><svg className="draw-wheel" viewBox="0 0 400 400" aria-hidden="true" style={{transform:`rotate(${angle}deg)`,transition:busy?'transform 1s cubic-bezier(.15,.65,.2,1)':'none'}}>{pool.map((name,i)=>{
        const step=360/pool.length, a=(i*step-90)*Math.PI/180, b=((i+1)*step-90)*Math.PI/180, mid=(a+b)/2;
        return <g key={name}>{pool.length===1 ? <circle cx="200" cy="200" r="192" fill={colors[0]}/> : <path d={`M200 200 L${200+192*Math.cos(a)} ${200+192*Math.sin(a)} A192 192 0 ${step>180?1:0} 1 ${200+192*Math.cos(b)} ${200+192*Math.sin(b)} Z`} fill={colors[i%colors.length]} stroke="#fffaf7" strokeWidth="2"/>}<text x={200+138*Math.cos(mid)} y={200+138*Math.sin(mid)} textAnchor="middle" dominantBaseline="middle" fontSize={pool.length>35?8:pool.length>20?11:16} fill="#44334f" transform={`rotate(${(i+.5)*step},${200+138*Math.cos(mid)},${200+138*Math.sin(mid)})`}>{name.length>7?name.slice(0,6)+'…':name}</text></g>;
      })}</svg><button className="wheel-center" disabled={busy || !remaining} onClick={()=>next()}>뽑기<span>{remaining}명</span></button></div> : <div className="draw-cards">{pool.map((name,i)=><button key={name} disabled={busy || !remaining || (result!=='' && card===i)} aria-label={`${i+1}번째 카드 뽑기`} className={card===i && result ? 'revealed' : ''} onClick={()=>next(i)}>{card===i && result ? result : <><span>✦</span>PICK</>}</button>)}</div>)}
      <div className="draw-result" role="status" aria-live="polite"><p>{busy ? '누가 나올까요?' : result ? '오늘의 주인공' : remaining===0 ? '모두 한 번씩 뽑혔어요' : '함께할 준비 됐나요?'}</p><strong>{busy ? '✦' : result || (remaining===0 ? '한 바퀴 완료!' : '다음은 누구?')}</strong></div>
      <button className="button primary draw-go" disabled={busy || !remaining} onClick={()=>next()}>{busy?'뽑는 중…':result && exclude ? remaining ? '다음 뽑기 · 1초 →' : '뽑기 완료' : '바로 뽑기 · 1초'}</button>
      <div className="draw-bottom"><label><input type="checkbox" checked={exclude} disabled={busy} onChange={e=>{setExclude(e.target.checked);reset();}}/> 뽑힌 사람 제외</label><span>남은 {remaining} / {roster.length}명</span><button className="text-button" disabled={busy} onClick={reset}>초기화</button></div>
      {message && <p className="draw-message" role="status">{message}</p>}
    </section>
    {!compact && <><section className="draw-history"><h2>뽑기 기록 <span>{history.length}회</span></h2>{history.length ? <ol>{history.map((n,i)=><li key={i}><small>{history.length-i}</small>{n}</li>)}</ol> : <p>뽑힌 순서가 여기에 보여요.</p>}</section><p className="draw-note">명단과 기록은 이 화면에서만 사용해요. 새로고침하거나 나가면 사라져요.<br/>작게 접기는 웹페이지 안에서만 작동해요.</p></>}
    {editing && <dialog ref={dialog} className="modal draw-dialog" onCancel={()=>setEditing(false)} onClose={()=>setEditing(false)}><h2>우리 반 명단</h2><p className="modal-description">한 줄에 한 명씩, 또는 쉼표로 구분해 주세요. 같은 항목은 하나로 합쳐요. 최대 100명.</p><form onSubmit={e=>{e.preventDefault();const names=parseRoster(draft);if(!names.length || names.length>100 || names.some(n=>n.length>30)){setMessage('1~100명, 이름은 각각 30자 이내로 입력해 주세요.');return;}setRoster(names);reset();setEditing(false);}}><div className="draw-number"><label htmlFor="draw-count">번호로 만들기</label><input id="draw-count" type="number" min="1" max="100" value={count} onChange={e=>setCount(e.target.value)}/><button type="button" className="button quiet" onClick={()=>{const n=Number(count);if(Number.isInteger(n)&&n>=1&&n<=100){setDraft(Array.from({length:n},(_,i)=>`${i+1}번`).join('\n'));setMessage('');}else setMessage('인원은 1~100 사이의 정수로 입력해 주세요.');}}>번호 생성</button></div><div className="field"><label htmlFor="draw-roster">명단</label><textarea id="draw-roster" rows={9} autoFocus value={draft} onChange={e=>setDraft(e.target.value)}/></div><p className="form-note">적용하면 뽑기 기록이 초기화돼요.</p>{message && <p role="alert">{message}</p>}<div className="modal-actions"><button type="button" className="button quiet" onClick={()=>setEditing(false)}>취소</button><button className="button primary">명단 적용</button></div></form></dialog>}
  </main>;
}
