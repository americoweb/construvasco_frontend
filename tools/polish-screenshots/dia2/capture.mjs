/**
 * Dia 2 — screenshots do lado cliente.
 * Requer: php artisan serve, ng serve, DB seeded.
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = process.env.APP_URL || 'http://127.0.0.1:4200';
const email = 'cliente@construvasco.co.mz';
const password = 'Cliente@2026';

async function login(page) {
  await page.goto(`${base}/auth/sign-in`, { waitUntil: 'networkidle' });
  await page.fill('#identifier', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForTimeout(3500);
}

async function main() {
  await mkdir(__dirname, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await login(page);

  const shots = [
    ['01-dashboard-cliente.png', '/conta/dashboard'],
    ['02-estudio-passo1.png', '/conta/estudio'],
    ['04-pedidos-lista.png', '/conta/pedidos'],
    ['06-projectos-lista.png', '/conta/projectos'],
    ['08-definicoes.png', '/conta/definicoes'],
  ];

  for (const [file, path] of shots) {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(__dirname, file), fullPage: true });
  }

  await page.goto(`${base}/conta/estudio`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const nextBtn = page.getByRole('button', { name: /seguinte/i });
  for (let i = 0; i < 3; i++) {
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1200);
    }
  }
  await page.screenshot({ path: join(__dirname, '03-estudio-geracao.png'), fullPage: true });

  await page.goto(`${base}/conta/pedidos`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const detail = page.locator('a.cp-list-card').first();
  if (await detail.count()) {
    await detail.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(__dirname, '05-pedido-detalhe.png'), fullPage: true });
  }

  await page.goto(`${base}/conta/projectos`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const proj = page.locator('a.cp-list-card').first();
  if (await proj.count()) {
    await proj.click();
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(__dirname, '07-projecto-detalhe.png'), fullPage: true });
  }

  await browser.close();
  console.log('Dia 2 screenshots em', __dirname);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
