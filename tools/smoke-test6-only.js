const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:4200';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  let unauthorizedCount = 0;
  page.on('response', (resp) => {
    if (resp.status() === 401) unauthorizedCount++;
  });

  await page.goto(`${BASE}/#/auth/sign-in`);
  await page.waitForSelector('#identifier');
  await page.fill('#identifier', 'cliente@construvasco.co.mz');
  await page.fill('#password', 'Cliente@2026');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  await page.evaluate(() => {
    const token = localStorage.getItem('access_token');
    if (token) localStorage.setItem('access_token', token + 'xxx');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.goto(`${BASE}/#/conta/pedidos`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);

  console.log(`url=${page.url()} unauthorized=${unauthorizedCount}`);
  await browser.close();
})();
