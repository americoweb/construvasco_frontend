/**
 * Captures Day 1 polish validation screenshots (requires dev server + API).
 * Usage: node tools/polish-screenshots/dia1/capture.mjs
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const base = process.env.APP_URL || 'http://127.0.0.1:4200';

const shots = [
  { name: '01-login.png', path: '/auth/sign-in', wait: 2000 },
];

async function login(page, email, password) {
  await page.goto(`${base}/auth/sign-in`, { waitUntil: 'networkidle' });
  await page.fill('#identifier', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForTimeout(4000);
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${base}/auth/sign-in`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(outDir, '01-login.png'), fullPage: true });

  try {
    await login(page, 'cliente@construvasco.co.mz', 'Cliente@2026');
    await page.goto(`${base}/conta/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(outDir, '02-dashboard-cliente.png'), fullPage: true });

    await page.goto(`${base}/auth/sign-in`, { waitUntil: 'networkidle' });
    await login(page, 'gestor@construvasco.co.mz', 'Gestor@2026');
    await page.goto(`${base}/admin/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(outDir, '03-dashboard-staff.png'), fullPage: true });

    await page.goto(`${base}/admin/pedidos/lista`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(outDir, '04-botoes-primarios.png'), fullPage: true });
  } catch (err) {
    console.warn('Login/screenshots parciais:', err.message);
  }

  await browser.close();
  console.log('Screenshots saved to', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
