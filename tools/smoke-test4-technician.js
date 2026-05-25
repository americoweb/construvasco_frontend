const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://127.0.0.1:4200';
const OUT = path.join(__dirname, '..', 'tools', 'smoke-test4-technician.png');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto(`${BASE}/#/auth/sign-in`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('#identifier', { timeout: 60000 });
  await page.fill('#identifier', 'tecnico@construvasco.co.mz');
  await page.fill('#password', 'Tecnico@2026');
  const loginResp = page.waitForResponse(
    (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
    { timeout: 30000 }
  );
  await page.click('button[type="submit"]');
  const resp = await loginResp;
  console.log(`Login HTTP: ${resp.status()}`);

  await page.waitForTimeout(4000);
  await page.goto(`${BASE}/#/admin/projectos/1`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(5000);

  const url = page.url();
  const assignTitle = await page.locator('mat-card-title:has-text("Atribuir técnico")').count();
  const assignSelect = await page.locator('mat-label:has-text("Técnico / gestor")').count();
  const projectTitle = await page.locator('mat-card-title').first().textContent().catch(() => '');
  const bodyText = await page.locator('.project-detail').textContent().catch(() => '');

  await page.screenshot({ path: OUT, fullPage: true });

  console.log(`URL: ${url}`);
  console.log(`Project card title: ${(projectTitle || '').trim()}`);
  console.log(`"Atribuir técnico" blocks: ${assignTitle}`);
  console.log(`"Técnico / gestor" selects: ${assignSelect}`);
  console.log(`Screenshot: ${OUT}`);

  const ok =
    url.includes('/admin/projectos/1') &&
    assignTitle === 0 &&
    assignSelect === 0 &&
    !bodyText.includes('Guardar atribuição');

  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => {
  console.error('PLAYWRIGHT_ERROR', e.message);
  process.exit(2);
});
