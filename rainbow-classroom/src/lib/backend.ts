import { createClient } from '@supabase/supabase-js';
import type { Program, ProgramInput } from './programs';
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const configured = !!url && !!key && /^https:\/\//.test(url);
export const supabase = configured ? createClient(url!, key!, { auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } }) : null;
export async function loadPrograms(): Promise<Program[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('programs').select('id,title,description,url,created_at,updated_at').order('created_at').order('id').abortSignal(AbortSignal.timeout(12000));
  if (error) throw error;
  return data ?? [];
}
export async function saveProgram(input: ProgramInput, id?: string) {
  if (!supabase) throw new Error('NOT_CONFIGURED');
  const result = id ? await supabase.from('programs').update(input).eq('id', id).select('id').abortSignal(AbortSignal.timeout(12000)).single() : await supabase.from('programs').insert(input).select('id').abortSignal(AbortSignal.timeout(12000)).single();
  if (result.error) throw result.error;
}
export async function deleteProgram(id: string) {
  if (!supabase) throw new Error('NOT_CONFIGURED');
  const { data, error } = await supabase.from('programs').delete().eq('id', id).select('id').abortSignal(AbortSignal.timeout(12000)).single();
  if (error || !data) throw error ?? new Error('DELETE_FAILED');
}
export function friendlyError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === '23505') return '같은 주소의 프로그램이 이미 있어요. 기존 항목을 수정해 주세요.';
  if (code === '42501' || code === 'PGRST116' || code === 'PGRST301') return '변경할 권한이 없거나 로그인이 만료되었어요. 다시 로그인해 주세요.';
  if (code === '23514' || code === '22001') return '입력한 글자 수와 인터넷 주소를 확인해 주세요.';
  return '연결을 완료하지 못했어요. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.';
}
