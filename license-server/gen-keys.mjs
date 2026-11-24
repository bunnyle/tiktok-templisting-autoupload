// node gen-keys.mjs  → 產生簽名金鑰對
import { webcrypto as c } from 'node:crypto';
const k = await c.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pub = await c.subtle.exportKey('jwk', k.publicKey);
const prv = await c.subtle.exportKey('jwk', k.privateKey);
console.log('=== 公鑰（貼到腳本 LIC_PUB）===');
console.log(JSON.stringify({ kty: pub.kty, crv: pub.crv, x: pub.x, y: pub.y }));
console.log('\n=== 私鑰（wrangler secret put SIGN_KEY 時貼上，絕不要公開）===');
console.log(JSON.stringify(prv));
