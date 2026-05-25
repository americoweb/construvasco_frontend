const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:4200';
const USERS = [
  ['admin', 'admin@construvasco.co.mz', 'Admin@2026', '#/admin/dashboard'],
  ['gestor', 'gestor@construvasco.co.mz', 'Gestor@2026', '#/admin/dashboard'],
  ['tecnico', 'tecnico@construvasco.co.mz', 'Tecnico@2026', '#/admin/dashboard'],
  ['cliente', 'cliente@construvasco.co.mz', 'Cliente@2026', '#/conta/dashboard'],
];

(async () => {
  const browser = await chromium.launch({ headless: true });

  console.log('=== TEST 2: Frontend redirect by role ===');
  for (const [label, email, password, expectedHash] of USERS) {
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    await p.goto(`${BASE}/#/auth/sign-in`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await p.waitForSelector('#identifier', { timeout: 60000 });
    await p.fill('#identifier', email);
    await p.fill('#password', password);
    const loginResp = p.waitForResponse((r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST', { timeout: 30000 });
    await p.click('button[type="submit"]');
    const resp = await loginResp;
    console.log(`2.${label} login HTTP: ${resp.status()}`);
    await p.waitForTimeout(5000);
    const url = p.url();
    const alertText = await p.locator('fuse-alert').textContent().catch(() => '');
    const ok = url.includes(expectedHash);
    console.log(`2.${label}: url=${url} alert=${(alertText || '').trim()} expected_contains=${expectedHash} ${ok ? 'OK' : 'FAIL'}`);
    await ctx.close();
    if (!ok) {
      await browser.close();
      process.exit(1);
    }
  }
  const page = await browser.newPage();

  console.log('\n=== TEST 5: Staff blocked from /conta ===');
  await page.goto(`${BASE}/#/auth/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#identifier');
  await page.fill('#identifier', 'gestor@construvasco.co.mz');
  await page.fill('#password', 'Gestor@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  await page.goto(`${BASE}/#/conta/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const url5 = page.url();
  const ok5 = url5.includes('#/admin/dashboard');
  console.log(`5.gestor /conta: url=${url5} ${ok5 ? 'OK' : 'FAIL'}`);
  if (!ok5) {
    await browser.close();
    process.exit(1);
  }

  console.log('\n=== TEST 6: 401 interceptor without loop ===');
  const ctx6 = await browser.newContext();
  const page6 = await ctx6.newPage();
  await page6.goto(`${BASE}/#/auth/sign-in`);
  await page6.waitForSelector('#identifier');
  await page6.fill('#identifier', 'cliente@construvasco.co.mz');
  await page6.fill('#password', 'Cliente@2026');
  await page6.click('button[type="submit"]');
  await page6.waitForTimeout(5000);
  await page6.evaluate(() => {
    const token = localStorage.getItem('access_token');
    if (token) localStorage.setItem('access_token', token + 'xxx');
  });
  let unauthorizedCount = 0;
  page6.on('response', (resp) => {
    if (resp.status() === 401) unauthorizedCount++;
  });
  await page6.reload({ waitUntil: 'domcontentloaded' });
  await page6.waitForTimeout(2000);
  await page6.goto(`${BASE}/#/conta/pedidos`, { waitUntil: 'domcontentloaded' });
  await page6.waitForTimeout(6000);
  const url6 = page6.url();
  const ok6 = url6.includes('#/auth/sign-in') && unauthorizedCount <= 5;
  console.log(`6.401: url=${url6} unauthorized_responses=${unauthorizedCount} ${ok6 ? 'OK' : 'FAIL'}`);
  await ctx6.close();

  await browser.close();
  process.exit(ok6 ? 0 : 1);
})().catch((e) => {
  console.error('PLAYWRIGHT_ERROR', e.message);
  process.exit(2);
});
