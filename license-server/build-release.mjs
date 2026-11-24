// node build-release.mjs https://ttf-license.你的子域.workers.dev '<公鑰JSON>' [--obfuscate]
// 讀取上一層的腳本 → 填入 LIC_API / LIC_PUB / 更新網址 → 輸出到 public/ttf.user.js（部署後客人從這個網址安裝）
import fs from 'node:fs';
import { execSync } from 'node:child_process';
const [api, pub, flag] = process.argv.slice(2);
if (!api || !pub) { console.log('用法: node build-release.mjs <WORKER_URL> <公鑰JSON> [--obfuscate]'); process.exit(1); }
JSON.parse(pub);
const url = api.replace(/\/$/, '') + '/ttf.user.js';
let s = fs.readFileSync(new URL('../tiktok-templisting-autoupload.user.js', import.meta.url), 'utf8');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('找不到：' + a); s = s.replace(a, b); };
rep("const LIC_API = '';", `const LIC_API = '${api.replace(/\/$/, '')}';`);
rep('const LIC_PUB = null;', `const LIC_PUB = ${pub};`);
s = s.replace(/(\/\/ @updateURL\s+).*/, '$1' + url).replace(/(\/\/ @downloadURL\s+).*/, '$1' + url).replace(/(\/\/ @homepageURL\s+).*/, '$1' + api.replace(/\/$/, ''));
s = s.replace(/const UPDATE_URL = '[^']*'/, `const UPDATE_URL = '${url}'`);
const m = s.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/)[0];
let body = s.slice(m.length);
if (flag === '--obfuscate') {
  fs.writeFileSync('/tmp/ttf-body.js', body);
  execSync('npx -y javascript-obfuscator /tmp/ttf-body.js --output /tmp/ttf-obf.js --compact true --string-array true --string-array-threshold 0.75 --control-flow-flattening false --self-defending false', { stdio: 'inherit' });
  body = '\n' + fs.readFileSync('/tmp/ttf-obf.js', 'utf8');
}
fs.mkdirSync(new URL('./public/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./public/ttf.user.js', import.meta.url), m + body);
console.log('完成 → public/ttf.user.js；再執行 npx wrangler deploy。客人安裝網址：' + url);
