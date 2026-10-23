import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const pages=fs.readdirSync(root).filter(name=>name.endsWith('.html'));
assert.ok(pages.length>0,'No bundled pages');
for(const name of pages){
 const html=fs.readFileSync(path.join(root,name),'utf8');
 assert.ok(html.includes(`<style data-jinju-component-styles>${fs.readFileSync(path.join(root, "assets/app.css"), "utf8")}</style>`),`${name}: embedded component CSS is missing or stale`);
 for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]+)"/g)){
  const asset=path.join(root,match[1]);
  assert.ok(fs.existsSync(asset),`${name}: missing ${match[1]}`);
  assert.ok(fs.statSync(asset).size>0,`${name}: empty ${match[1]}`);
 }
}
console.log(`Verified CSS and asset references for ${pages.length} bundled pages`);
