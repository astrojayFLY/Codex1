const config = await fetch('./config.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).catch(() => null);
if (config?.classroomUrl && /^https:\/\/[a-z0-9-]+\.web\.app\/$/.test(config.classroomUrl)) document.querySelector('#classroom-link').href = config.classroomUrl;
if (config?.projectId) {
  try {
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/programs?pageSize=100`, {signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw Error();
    const result = await response.json();
    for (const document of result.documents || []) {
      const f = document.fields;
      const url = new URL(f.url.stringValue);
      if (url.protocol !== 'https:' || url.username || url.password) continue;
      const card = document.createElement('article'); card.className = 'card';
      const body = document.createElement('div'); body.className='body';
      const title = document.createElement('h3'); title.textContent=f.title.stringValue;
      const description = document.createElement('p'); description.textContent=f.description.stringValue;
      const link = document.createElement('a'); link.href=url.href; link.textContent='프로그램 열기 ↗'; link.target='_blank'; link.rel='noopener noreferrer';
      body.append(title,description,link);card.append(body);document.querySelector('#extra-tools').append(card);
    }
  } catch { document.querySelector('#catalog-status').textContent='추가 프로그램을 불러오지 못했어요. 기본 프로그램은 바로 사용할 수 있어요.'; }
}
