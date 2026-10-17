const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 960 }, timezoneId: 'America/Los_Angeles' });
    await page.clock.install({ time: new Date('2026-10-16T14:59:45Z') });
    await page.goto('http://127.0.0.1:4180/virtue');
    await page.locator('#virtue-name').waitFor();
    const prior = await page.locator('#virtue-name').textContent();
    assert((await page.locator('.date-chip').textContent()).includes('10월 16일'));
    await page.getByRole('button', { name: '다른 미덕 만나기' }).click();
    await page.clock.fastForward(31000);
    assert((await page.locator('.date-chip').textContent()).includes('10월 17일'));
    assert.notEqual(await page.locator('#virtue-name').textContent(), prior);
    assert.equal(await page.getByRole('button', { name: '오늘의 미덕으로 돌아가기' }).count(), 0);
    console.log('PASS: 미국 시간대 브라우저에서 서울 자정이 지나면 날짜·기본 미덕 갱신, 임시 선택 해제');
    await page.goto('http://127.0.0.1:4180/admin/preview');
    await page.getByRole('button', { name: '프로그램 추가' }).click();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      assert(await page.locator('dialog').evaluate(el => el.contains(document.activeElement)), 'Dialog focus escaped');
    }
    await page.keyboard.press('Escape');
    assert(await page.getByRole('button', { name: '프로그램 추가' }).evaluate(el => el === document.activeElement));
    console.log('PASS: 키보드 초점이 대화상자 안에 유지되고 Escape 후 시작 버튼으로 복귀');
    await page.setViewportSize({ width: 683, height: 480 });
    for (const route of ['/', '/virtue', '/admin/preview']) {
      await page.goto('http://127.0.0.1:4180' + route);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    console.log('PASS: 1366px 화면의 200% 확대에 해당하는 683 CSS px에서 핵심 화면 재배치');
    // Text-only, solid-surface contrast diagnostic. Gradient and image contrast need visual review.
    const report = [];
    for (const route of ['/', '/virtue', '/admin']) {
      await page.goto('http://127.0.0.1:4180' + route);
      const failures = await page.evaluate(() => {
        const color = v => (v.match(/[\d.]+/g) || []).map(Number);
        const lum = c => c.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
        return [...document.querySelectorAll('p,span,a,button,h1,h2,h3,summary')].filter(el => el.getClientRects().length && !el.closest('[aria-hidden=true]') && el.textContent.trim() && !el.children.length).flatMap(el => {
          const style = getComputedStyle(el); let ancestor = el; let bg = [255, 255, 255];
          while (ancestor) { const s = getComputedStyle(ancestor); const c = color(s.backgroundColor); if (c.length === 3 || c[3] === 1) { bg = c; break; } ancestor = ancestor.parentElement; }
          const foreground = color(style.color); const l1 = lum(foreground), l2 = lum(bg); const ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
          const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
          return ratio + .01 < (large ? 3 : 4.5) ? [{ text: el.textContent.slice(0, 45), className: el.className, ratio: +ratio.toFixed(2) }] : [];
        });
      });
      report.push({ route, failures });
    }
    console.log('Contrast diagnostics:', JSON.stringify(report));
    assert.equal(report.flatMap(r => r.failures).length, 0, 'Low contrast text');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
