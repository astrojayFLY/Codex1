import { cp, mkdir, copyFile, writeFile } from 'node:fs/promises';
await mkdir('pages-dist/math-play', {recursive:true});
await cp('hub', 'pages-dist', {recursive:true});
for (const name of ['index.html','style.css','app.js']) await copyFile(`math-play/${name}`,`pages-dist/math-play/${name}`);
await writeFile('pages-dist/.nojekyll','');
console.log('Pages: hub and math static assets only');
