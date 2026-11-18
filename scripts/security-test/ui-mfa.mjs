// Browser test of the new "turn off 2-step needs a code" box (local test copy only).
import { chromium } from 'playwright'; // global install: import from $(npm root -g)/playwright/index.mjs
import { authenticator } from 'otplib';
authenticator.options = { window: 1 };
const BASE = 'http://localhost:5000';
const PW = 'Ui-Test-Only-Pass-55120';
const ok = (n, c, d = '') => console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`);

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
// Secure cookies over plain http: pretend we came through the https proxy
const ctx = await browser.newContext({ extraHTTPHeaders: { 'X-Forwarded-Proto': 'https' } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

// API helper that shares the browser's cookies
const api = async (method, path, data) => {
  const r = await ctx.request.fetch(BASE + path, { method, data, headers: { 'Content-Type': 'application/json' } });
  // Copy the (Secure) session cookie so the http test page can use it
  return { status: r.status(), body: await r.json().catch(() => ({})) };
};
await api('POST', '/api/admin/login', { username: 'admin', password: 'password' });
await api('POST', '/api/admin/update-credentials', { currentUsername: 'admin', currentPassword: 'password', newUsername: 'admin', newPassword: PW });
const setup = await api('POST', '/api/admin/setup-mfa');
const secret = setup.body.secret;
const en = await api('POST', '/api/admin/verify-mfa', { verificationCode: authenticator.generate(secret), secret });
ok('setup: 2-step on', en.status === 200);

// Make the Secure cookie usable on http://localhost
const cookies = (await ctx.cookies()).map(c => ({ ...c, secure: false }));
await ctx.addCookies(cookies);

await page.addInitScript(() => sessionStorage.setItem('admin_authenticated', 'true'));
await page.goto(BASE + '/admin/account-security', { waitUntil: 'networkidle' });
const mfaTab = page.getByRole('tab', { name: /mfa|2-step|two|multi/i }).first();
if (await mfaTab.count()) await mfaTab.click();
const sw = page.getByRole('switch').first();
await page.screenshot({ path: '/tmp/ui-before.png' }); console.log('URL', page.url()); await sw.waitFor({ timeout: 10000 });
ok('switch shows ON', (await sw.getAttribute('aria-checked')) === 'true');
await sw.click();
const box = page.getByTestId('mfa-disable-box');
await box.waitFor({ timeout: 5000 }).catch(() => {});
ok('clicking OFF opens the code box', await box.isVisible());
ok('switch stays ON until a code works', (await sw.getAttribute('aria-checked')) === 'true');
const btn = page.getByRole('button', { name: /turn off 2-step/i });
ok('button is disabled with no code', await btn.isDisabled());
await page.getByLabel('6-digit code').fill('000000');
await btn.click();
await page.waitForTimeout(1500);
let status = await api('GET', '/api/admin/mfa-status');
ok('wrong code: 2-step is still on', status.body.enabled === true);
await page.screenshot({ path: '/tmp/ui-wrong-code.png' });
await page.getByLabel('6-digit code').fill(authenticator.generate(secret));
await btn.click();
await page.waitForTimeout(1500);
status = await api('GET', '/api/admin/mfa-status');
ok('right code: 2-step is off', status.body.enabled === false);
ok('code box closes after success', !(await box.isVisible()));
await page.screenshot({ path: '/tmp/ui-after.png' });
ok('no page errors', errors.length === 0, errors.join(' | ').slice(0, 200));
await browser.close();
