// Security tests against the LOCAL test copy (throwaway database, fake Stripe).
// Run: node attack.mjs   (from dist-sectest so otplib resolves from the repo)
import { authenticator } from 'otplib';
authenticator.options = { window: 1 };
const BASE = 'http://localhost:5000';
let cookie = '';
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

async function call(method, path, body, { auth = true, headers = {} } = {}) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-Proto': 'https', ...(auth && cookie ? { Cookie: cookie } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const sc = r.headers.getSetCookie?.() || [];
  for (const c of sc) if (c.startsWith('sessionId=')) cookie = c.split(';')[0];
  let data; const t = await r.text(); try { data = JSON.parse(t); } catch { data = t; }
  return { status: r.status, data };
}

const STRONG = 'Test-Only-Pass-9182736';
// 1. First-time sign-in, then set a strong password
let r = await call('POST', '/api/admin/login', { username: 'admin', password: 'password' });
check('first-time sign-in works once', r.status === 200, JSON.stringify(r.data));
r = await call('POST', '/api/admin/update-credentials', { currentUsername: 'admin', currentPassword: 'password', newUsername: 'admin', newPassword: STRONG });
check('set strong password', r.status === 200);
r = await call('POST', '/api/admin/login', { username: 'admin', password: 'password' }, { auth: false });
check('default password no longer works', r.status === 401);

// 2. Turn on 2-step
r = await call('POST', '/api/admin/setup-mfa');
const secret = r.data.secret;
r = await call('POST', '/api/admin/verify-mfa', { verificationCode: authenticator.generate(secret), secret });
check('2-step turns on with a right code', r.status === 200, JSON.stringify(r.data));

// 3. Turning 2-step off
r = await call('POST', '/api/admin/disable-mfa', {});
check('ATTACK: turn off 2-step with no code is refused', r.status === 401);
r = await call('POST', '/api/admin/disable-mfa', { mfaCode: '000000' });
check('ATTACK: turn off 2-step with wrong code is refused', r.status === 401);
r = await call('POST', '/api/admin/mfa/disable', {});
check('ATTACK: second turn-off address also refuses with no code', r.status === 401);

// 4. Swapping in an attacker's authenticator while 2-step is on
const evil = authenticator.generateSecret();
r = await call('POST', '/api/admin/verify-mfa', { verificationCode: authenticator.generate(evil), secret: evil });
check('ATTACK: replace 2-step secret without current code is refused', r.status === 401);
r = await call('POST', '/api/admin/mfa/verify', { token: authenticator.generate(evil), secret: evil });
check('ATTACK: replace via second address is refused', r.status === 401);

// 5. Sign-in still needs the code; right code works
r = await call('POST', '/api/admin/login', { username: 'admin', password: STRONG }, { auth: false });
check('sign-in asks for 2-step code', r.data?.requireMfa === true);
r = await call('POST', '/api/admin/login', { username: 'admin', password: STRONG, mfaCode: authenticator.generate(secret) }, { auth: false });
check('sign-in with right code works', r.status === 200);

// 6. Private settings
r = await call('PUT', '/api/admin/settings', { key: 'shipping_studio_address', value: '123 Test St' });
check('admin can save studio address', r.status === 200);
await call('PUT', '/api/admin/settings', { key: 'about_full_resume', value: 'Name, City, 000-000-0000' });
r = await call('GET', '/api/settings/about_full_resume', undefined, { auth: false });
check('public cannot read the full resume (phone number)', r.status === 404);
r = await call('GET', '/api/settings/shipping_studio_address', undefined, { auth: false });
check('public cannot read studio address', r.status === 404);
r = await call('GET', '/api/settings', undefined, { auth: false });
check("public settings list hides studio address, resume, 2-step secret", Array.isArray(r.data) && !r.data.some(s => /shipping_studio|mfa|admin_|about_full_resume/.test(s.key)));
r = await call('GET', '/api/settings/shipping_studio_address');
check('admin can still read studio address', r.status === 200 && r.data.value === '123 Test St');

// 7. Payment reuse
r = await call('POST', '/api/products', { title: 'Test original', description: 'x', price: 100, imageUrl: 'https://res.cloudinary.com/x.jpg', type: 'originals', stock: 1 });
const pid = r.data?.id ?? r.data?.product?.id;
check('admin can create a test product', !!pid, `status ${r.status}`);
const zone = 1;
const orderBody = { customerName: 'Acme Co', customerEmail: ('sample' + String.fromCharCode(64) + 'test.invalid'), shippingStreetAddress: '1 Test Rd', shippingCity: 'Testville', shippingState: 'CO', shippingZipCode: '80000', billingSameAsShipping: true, shippingZoneId: zone, cartItems: [{ id: pid, quantity: 1 }], subtotal: 100, shippingCost: 0 };
const A = (await call('POST', '/api/orders', orderBody, { auth: false })).data?.order?.id;
const B = (await call('POST', '/api/orders', orderBody, { auth: false })).data?.order?.id;
check('two test orders created', !!A && !!B, `A=${A} B=${B}`);
const piA = (await call('POST', '/api/create-payment-intent', { amount: 100, metadata: { orderId: A } }, { auth: false })).data?.paymentIntentId;
r = await call('PATCH', `/api/orders/${A}/payment`, { paymentIntentId: piA }, { auth: false });
check('real payment marks its own order paid', r.status === 200, JSON.stringify(r.data).slice(0, 120));
let prod = (await call('GET', `/api/products/${pid}`, undefined, { auth: false })).data;
check('paid original: stock drops 1 -> 0', (prod?.stock ?? prod?.product?.stock) === 0, `stock=${prod?.stock ?? prod?.product?.stock}`);
r = await call('PATCH', `/api/orders/${A}/payment`, { paymentIntentId: piA }, { auth: false });
prod = (await call('GET', `/api/products/${pid}`, undefined, { auth: false })).data;
check('same payment sent twice: still OK, stock not lowered again', r.status === 200 && (prod?.stock ?? prod?.product?.stock) === 0);
r = await call('PATCH', `/api/orders/${B}/payment`, { paymentIntentId: piA }, { auth: false });
check('ATTACK: reuse order A payment for order B is refused', r.status === 400, JSON.stringify(r.data));
const piNone = (await call('POST', '/api/create-payment-intent', { amount: 100 }, { auth: false })).data?.paymentIntentId;
r = await call('PATCH', `/api/orders/${B}/payment`, { paymentIntentId: piNone }, { auth: false });
check('ATTACK: payment with no order number is refused', r.status === 400);
const piCheap = (await call('POST', '/api/create-payment-intent', { amount: 1, metadata: { orderId: B } }, { auth: false })).data?.paymentIntentId;
r = await call('PATCH', `/api/orders/${B}/payment`, { paymentIntentId: piCheap }, { auth: false });
check('ATTACK: $1 payment for a $100 order is refused', r.status === 400);
r = await call('POST', '/api/create-payment-intent', { amount: 100, metadata: { orderId: B, evil: 'x'.repeat(400) } }, { auth: false });
check('payment notes only keep the order number', r.status === 200);

// 8. Switched-off doors
r = await call('POST', '/api/checkout/limited-edition', {}, { auth: false });
check('limited-edition checkout is off', r.status === 410);
r = await call('POST', '/api/webhooks/gooten', { id: 1, status: 'Shipped' }, { auth: false });
check('fake Gooten webhook is ignored', r.data?.message === 'Ignored');
r = await call('POST', '/api/printful/webhook', { type: 'package_shipped' }, { auth: false });
check('fake Printful webhook is ignored', r.data?.message === 'Ignored');

// 9. Rate limits
let codes = [];
for (let i = 0; i < 8; i++) codes.push((await call('POST', '/api/admin/reset-password', { email: ('sample' + String.fromCharCode(64) + 'test.invalid') }, { auth: false })).status);
check('password-reset requests are capped (429 after 6)', codes.includes(429), codes.join(','));
codes = [];
for (let i = 0; i < 12; i++) codes.push((await call('POST', '/api/create-payment-intent', { amount: 5 }, { auth: false })).status);
check('payment starts are capped (429 after 10)', codes.includes(429), codes.join(','));

// 10. Admin still locked to the public
for (const p of ['/api/admin/orders', '/api/admin/messages', '/api/ADMIN/orders', '/api/admin/api-configs']) {
  r = await call('GET', p, undefined, { auth: false });
  check(`public blocked from ${p}`, r.status === 401);
}

// Write things the log must not contain, for the log check
const fs = await import('fs');
fs.writeFileSync('/tmp/must-not-log.txt', [secret, STRONG, cookie.split('=')[1].split('.')[0].replace(/^s%3A/, '')].join('\n'));
const failed = results.filter(x => !x.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
