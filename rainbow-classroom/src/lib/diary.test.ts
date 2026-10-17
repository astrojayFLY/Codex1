import {describe,it,expect} from 'vitest';
import {validDraft} from './diary';
const draft={date:'2026-10-17',title:'합성 테스트',content:'실제 개인정보 없는 검사 자료',mood:'평온'};
describe('클라우드 일기 입력 경계',()=>{
 it('실제 날짜와 허용 기분을 검증한다',()=>{expect(validDraft(draft)).toBe(true);expect(validDraft({...draft,date:'2026-02-30'})).toBe(false);expect(validDraft({...draft,date:'2024-02-29'})).toBe(true);expect(validDraft({...draft,mood:'unknown'})).toBe(false);});
 it('빈 값과 길이 제한을 검증한다',()=>{expect(validDraft({...draft,title:' '})).toBe(false);expect(validDraft({...draft,content:'\n '})).toBe(false);expect(validDraft({...draft,title:'가'.repeat(101)})).toBe(false);expect(validDraft({...draft,content:'가'.repeat(30001)})).toBe(false);});
});
