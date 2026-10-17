import { initializeApp } from 'firebase/app';
import { browserSessionPersistence, getAuth, GoogleAuthProvider, onAuthStateChanged, setPersistence, signInWithPopup, signOut, type User } from 'firebase/auth';
import { collection, doc, getFirestore, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import firebaseConfig from '../firebase-config.json';
import { cleanProgram, validateProgram, validUrl, type Program, type ProgramInput } from './programs';

// Browser config is public. Firestore rules enforce authorization.
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, 'classroom-live');
export const configured = true;
const authReady = setPersistence(auth, browserSessionPersistence);
export function useAccount() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let stop: (() => void) | undefined; let active = true;
    authReady.then(() => { if (active) stop = onAuthStateChanged(auth, next => { setUser(next); setLoading(false); }, () => { setLoading(false); setError('로그인 상태를 확인하지 못했어요. 새로고침해 주세요.'); }); }).catch(() => { if (active) { setLoading(false); setError('브라우저의 세션 저장을 허용한 뒤 다시 열어 주세요.'); } });
    return () => { active = false; stop?.(); };
  }, []);
  return { user, loading, error };
}
export async function loginGoogle() { await authReady; const provider = new GoogleAuthProvider(); provider.setCustomParameters({prompt:'select_account'}); await signInWithPopup(auth, provider); }
export async function logoutGoogle() { await signOut(auth); }
export function watchAdmin(uid: string, next: (allowed: boolean) => void, fail: () => void) { return onSnapshot(doc(db,'admin_users',uid), snapshot => next(snapshot.exists() && snapshot.data().enabled === true), fail); }
// Live snapshots keep already-open classroom and admin screens synchronized.
export function watchPrograms(next: (items: Program[]) => void, fail: (error: unknown) => void) {
  return onSnapshot(query(collection(db,'programs'),orderBy('created_at'),limit(100)), snapshot => { try { next(snapshot.docs.map(item => { const data=item.data(); if(typeof data.title!=='string'||typeof data.description!=='string'||typeof data.url!=='string'||!validUrl(data.url))throw Error('INVALID_PROGRAM');return {id:item.id,title:data.title,description:data.description,url:data.url,created_at:data.created_at?.toDate?.().toISOString()??'',updated_at:data.updated_at?.toDate?.().toISOString()??''}; })); } catch(error) {fail(error);} }, fail);
}
async function urlId(url: string) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(url)))].map(b=>b.toString(16).padStart(2,'0')).join(''); }
export async function saveProgram(raw: ProgramInput, id?: string) {
  const input=cleanProgram(raw); if(Object.keys(validateProgram(input)).length) throw Error('INVALID_PROGRAM');
  const newId=await urlId(input.url); const target=doc(db,'programs',newId);
  await runTransaction(db,async transaction => {
    const existing=await transaction.get(target);
    const original=id&&id!==newId?await transaction.get(doc(db,'programs',id)):existing;
    if(existing.exists()&&id!==newId) throw {code:'duplicate-url'};
    if(id&&!original.exists()) throw {code:'not-found'};
    transaction.set(target,{...input,created_at:existing.exists()?existing.data()!.created_at:serverTimestamp(),updated_at:serverTimestamp()});
    if(id&&id!==newId) transaction.delete(doc(db,'programs',id));
  });
}
export async function deleteProgram(id: string) { await runTransaction(db,async transaction=>{const ref=doc(db,'programs',id);if(!(await transaction.get(ref)).exists())throw {code:'not-found'};transaction.delete(ref);}); }
export function friendlyError(error: unknown) {
  const code=(error as {code?:string})?.code;
  if(code==='duplicate-url') return '같은 주소의 프로그램이 이미 있어요. 기존 항목을 수정해 주세요.';
  if(code==='permission-denied'||code==='unauthenticated') return '변경할 권한이 없거나 로그인이 만료되었어요. 다시 로그인해 주세요.';
  if(code==='auth/popup-closed-by-user'||code==='auth/cancelled-popup-request') return 'Google 로그인을 취소했어요. 원할 때 다시 로그인해 주세요.';
  if(code==='auth/popup-blocked') return '로그인 팝업을 허용한 뒤 다시 시도해 주세요.';
  if(code==='not-found') return '다른 화면에서 이미 변경된 항목이에요. 목록을 확인해 주세요.';
  return '연결을 완료하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
}
