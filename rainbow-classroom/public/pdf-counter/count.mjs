const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });
export function countText(text) {
  const count = value => Array.from(segmenter.segment(value)).length;
  return { withSpaces: count(text.replace(/[\r\n\u2028\u2029]/gu, '')), withoutSpaces: count(text.replace(/\s/gu, '')) };
}
export function pageText(items) {
  let text = '', previous = null;
  for (const item of items) {
    if (typeof item.str !== 'string') continue;
    if (previous && !text.endsWith('\n') && !/\s$/u.test(text) && item.str && !/^\s/u.test(item.str)) {
      const sameLine = Math.abs(previous.transform[5] - item.transform[5]) < Math.max(1, Math.abs(item.transform[3]) * 0.25);
      const gap = item.transform[4] - (previous.transform[4] + previous.width);
      if (!sameLine) text += '\n';
      else if (previous.dir !== 'rtl' && gap > Math.max(0.8, Math.abs(item.transform[0]) * 0.15)) text += ' ';
    }
    text += item.str;
    if (item.hasEOL) text += '\n';
    previous = item;
  }
  return text;
}
