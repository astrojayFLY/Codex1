import * as pdfjs from './vendor/pdf.mjs';
import { countText, pageText } from './count.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.mjs', import.meta.url).href;
const $ = id => document.getElementById(id);
let task = null, run = 0, report = '';
const fmt = n => n.toLocaleString('ko-KR');
function empty() {
  $('result').hidden = true; $('text').value = ''; $('rows').replaceChildren();
  $('filename').textContent = ''; $('fileinfo').textContent = ''; report = '';
  for (const id of ['with', 'without', 'pages']) $(id).textContent = '0';
  $('warning').textContent = ''; $('warning').hidden = true;
}
async function reset() {
  const token = ++run; const old = task; task = null;
  empty(); $('file').value = ''; $('progress').hidden = true;
  $('status').textContent = '파일과 결과를 지웠어요. 새 PDF를 선택해 주세요.';
  if (old) await old.destroy().catch(() => {});
  return token;
}
async function analyze(file) {
  const token = await reset();
  if (token !== run) return;
  if (!file) return;
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') { $('status').textContent = 'PDF 파일을 선택해 주세요.'; return; }
  if (file.size > 100 * 1024 * 1024) { $('status').textContent = '100MB 이하의 PDF를 선택해 주세요.'; return; }
  $('status').textContent = 'PDF를 브라우저 안에서 읽고 있어요…'; $('progress').hidden = false; $('progress').value = 0;
  let ownTask;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    if (token !== run) return;
    ownTask = pdfjs.getDocument({ data, isEvalSupported: false, cMapUrl: new URL('./vendor/cmaps/', import.meta.url).href, cMapPacked: true, standardFontDataUrl: new URL('./vendor/standard_fonts/', import.meta.url).href, wasmUrl: new URL('./vendor/wasm/', import.meta.url).href, useWasm: false });
    task = ownTask;
    const pdf = await ownTask.promise;
    const parts = [], results = []; let totalWith = 0, totalWithout = 0, blank = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      if (token !== run) return;
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = pageText(content.items), counts = countText(text);
      parts.push(text); results.push([i, counts.withSpaces, counts.withoutSpaces]);
      totalWith += counts.withSpaces; totalWithout += counts.withoutSpaces;
      if (!counts.withoutSpaces) blank++;
      page.cleanup();
      if (token !== run) return;
      $('progress').value = i / pdf.numPages * 100;
      $('status').textContent = `${fmt(pdf.numPages)}쪽 중 ${fmt(i)}쪽을 계산했어요…`;
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (token !== run) return;
    $('filename').textContent = file.name; $('fileinfo').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · 내 기기에서 처리 완료`;
    $('with').textContent = fmt(totalWith); $('without').textContent = fmt(totalWithout); $('pages').textContent = fmt(pdf.numPages);
    const fragment = document.createDocumentFragment();
    results.forEach(values => { const row = document.createElement('tr'); values.forEach(value => { const cell = document.createElement('td'); cell.textContent = fmt(value); row.append(cell); }); fragment.append(row); });
    $('rows').append(fragment); $('text').value = parts.join('\n\n');
    $('warning').hidden = !blank;
    $('warning').textContent = `${fmt(blank)}쪽에서 글자를 추출하지 못했어요. 빈 페이지이거나 스캔 이미지일 수 있어요. 이 페이지의 글자는 합계에 포함되지 않았어요.`;
    report = `${file.name}\n전체 페이지: ${pdf.numPages}\n공백 포함: ${totalWith}\n공백 제외: ${totalWithout}\n글자를 추출하지 못한 페이지: ${blank}\n기준: 줄바꿈 제외, 보이는 글자 단위. OCR 미지원.\n\n페이지\t공백 포함\t공백 제외\n${results.map(row => row.join('\t')).join('\n')}`;
    $('result').hidden = false; $('status').textContent = '계산을 마쳤어요. 파일과 결과는 이 브라우저 안에만 있어요.';
  } catch (error) {
    if (token !== run) return;
    empty();
    $('status').textContent = error?.name === 'PasswordException' ? '암호가 걸린 PDF예요. 컴퓨터에서 암호를 해제한 사본을 선택해 주세요.' : 'PDF를 읽지 못했어요. 손상되었거나 지원하지 않는 파일일 수 있어요. 다른 PDF로 다시 시도해 주세요.';
  } finally {
    if (token === run) { $('progress').hidden = true; task = null; }
    if (ownTask) await ownTask.destroy().catch(() => {});
  }
}
$('file').addEventListener('change', event => analyze(event.target.files[0]));
$('clear').addEventListener('click', reset);
$('drop').addEventListener('dragover', event => { event.preventDefault(); $('drop').classList.add('dragging'); });
$('drop').addEventListener('dragleave', () => $('drop').classList.remove('dragging'));
$('drop').addEventListener('drop', event => { event.preventDefault(); $('drop').classList.remove('dragging'); if (event.dataTransfer.files.length !== 1) { $('status').textContent = 'PDF를 한 개씩 놓아 주세요.'; return; } analyze(event.dataTransfer.files[0]); });
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());
$('download').addEventListener('click', () => { const url = URL.createObjectURL(new Blob(['\ufeff' + report], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'PDF-글자수.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
window.addEventListener('pagehide', () => { run++; empty(); if (task) { task.destroy().catch(() => {}); task = null; } });
