import { cp } from 'node:fs/promises';

await cp(new URL('../../silofon/', import.meta.url), new URL('../dist/silofon/', import.meta.url), {
  recursive: true,
});
