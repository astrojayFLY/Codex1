import { collection, doc, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase-backend';
import { validDraft, type DiaryDraft, type DiaryEntry } from './diary';
function requireOwner(uid:string) {if(!auth.currentUser||auth.currentUser.uid!==uid)throw {code:'unauthenticated'};}
export function watchDiary(uid:string,next:(rows:DiaryEntry[])=>void,fail:(error:unknown)=>void) {
  requireOwner(uid);
  // Account-scoped live updates keep two open diary tabs synchronized.
  return onSnapshot(query(collection(db,'users',uid,'entries'),orderBy('date','desc'),orderBy('updatedAt','desc'),limit(500)),snapshot=>{
    try {const rows=snapshot.docs.filter(item=>!item.metadata.hasPendingWrites).map(item=>{const data=item.data();if(!validDraft(data as DiaryDraft)||typeof data.createdAt?.toDate!=='function'||typeof data.updatedAt?.toDate!=='function')throw Error('INVALID_DIARY');return {id:item.id,date:data.date,title:data.title,content:data.content,mood:data.mood,createdAt:data.createdAt.toDate().toISOString(),updatedAt:data.updatedAt.toDate().toISOString()};});next(rows);}catch(error){fail(error);}
  },fail);
}
export async function saveDiary(uid:string,input:DiaryDraft,id?:string) {
  requireOwner(uid);const draft={date:input.date,title:input.title.trim(),content:input.content.trim(),mood:input.mood};if(!validDraft(draft))throw Error('INVALID_DIARY');
  const target=id?doc(db,'users',uid,'entries',id):doc(collection(db,'users',uid,'entries'));
  await runTransaction(db,async transaction=>{const current=await transaction.get(target);if(id&&!current.exists())throw {code:'not-found'};transaction.set(target,{...draft,createdAt:current.exists()?current.data()!.createdAt:serverTimestamp(),updatedAt:serverTimestamp()});});
  return target.id;
}
export async function deleteDiary(uid:string,id:string) {requireOwner(uid);await runTransaction(db,async transaction=>{const ref=doc(db,'users',uid,'entries',id);if(!(await transaction.get(ref)).exists())throw {code:'not-found'};transaction.delete(ref);});}
