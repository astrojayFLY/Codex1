export const moods = ['행복','평온','보통','속상','피곤'] as const;
export type DiaryDraft = { date: string; title: string; content: string; mood: string };
export type DiaryEntry = DiaryDraft & { id: string; createdAt: string; updatedAt: string };
export function validDraft(value: DiaryDraft) {
  return typeof value.date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date) && Number.isFinite(Date.parse(value.date)) && new Date(value.date).toISOString().slice(0,10)===value.date && typeof value.title==='string' && value.title.trim().length>0 && [...value.title].length<=100 && typeof value.content==='string' && value.content.trim().length>0 && [...value.content].length<=30000 && moods.some(m=>m===value.mood);
}
