/**
 * Tour visual automático — Construvasco
 *
 * Captura screenshots de todas as páginas relevantes (sem assertions funcionais).
 *
 * Pré-requisitos:
 *   1. Backend:  cd ../construvasco_laravel_v1 && php artisan serve  (http://127.0.0.1:8000)
 *   2. Frontend: npm start  (http://127.0.0.1:4200)
 *   3. BD demo:  php artisan migrate:fresh --force && php artisan db:seed --force
 *   4. Chromium: npx playwright install chromium
 *
 * Executar (raiz do frontend):
 *   cd construvasco_frontend_v1
 *   node tools/visual-tour/run.mjs
 *
 * Saída: tools/visual-tour/screenshots/*.png + tools/visual-tour/INDEX.md
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = join(__dir, 'screenshots');
const INDEX_PATH = join(__dir, 'INDEX.md');

const BASE = process.env.APP_URL || 'http://127.0.0.1:4200';
const VIEWPORT = { width: 1440, height: 900 };

const USERS = {
  cliente: ['cliente@construvasco.co.mz', 'Cliente@2026'],
  gestor: ['gestor@construvasco.co.mz', 'Gestor@2026'],
  tecnico: ['tecnico@construvasco.co.mz', 'Tecnico@2026'],
  admin: ['admin@construvasco.co.mz', 'Admin@2026'],
};

const successes = [];
const failures = [];
const capturedAt = new Date().toISOString();

mkdirSync(SCREENSHOTS, { recursive: true });

function hashUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}/#${p}`;
}

async function stabilize(page, selector) {
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  if (selector) {
    await page.waitForSelector(selector, { state: 'visible', timeout: 45000 }).catch(() => {});
  }
  await page.waitForTimeout(800);
}

async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  });
  await page.goto(hashUrl('/auth/sign-in'), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await stabilize(page, '#identifier');
}

async function login(page, email, password) {
  await page.goto(hashUrl('/auth/sign-in'), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await stabilize(page, '#identifier');
  await page.fill('#identifier', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => /#\/(admin|conta)\//.test(window.location.hash), { timeout: 90000 });
  await stabilize(page);
}

/**
 * @param {import('playwright').Page} page
 * @param {string} filename
 * @param {{ section?: string, url?: string, selector?: string, afterSelector?: string, action?: (p: import('playwright').Page) => Promise<void> }} opts
 */
async function capture(page, filename, opts = {}) {
  const { section = '', url, selector, afterSelector, action } = opts;
  try {
    if (url) {
      await page.goto(hashUrl(url), { waitUntil: 'domcontentloaded', timeout: 90000 });
    }
    if (selector && !action) {
      await page.waitForSelector(selector, { state: 'visible', timeout: 45000 });
    }
    if (action) {
      await action(page);
    }
    const finalSelector = afterSelector ?? (action ? null : selector);
    if (finalSelector) {
      await page.waitForSelector(finalSelector, { state: 'visible', timeout: 45000 });
    }
    await stabilize(page);
    const path = join(SCREENSHOTS, filename);
    await page.screenshot({ path, fullPage: true });
    successes.push({ filename, section, path });
    console.log(`✅ ${filename}`);
  } catch (err) {
    const path = join(SCREENSHOTS, filename);
    try {
      await page.screenshot({ path, fullPage: true });
    } catch {
      /* ignore */
    }
    const reason = err instanceof Error ? err.message : String(err);
    failures.push({ filename, section, reason });
    console.log(`❌ ${filename} — ${reason}`);
  }
}

async function openAdminRequest(page, referenceCode) {
  await page.goto(hashUrl('/admin/pedidos/lista'), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await stabilize(page, 'a.stf-req-card');
  const card = page.locator('a.stf-req-card').filter({ hasText: referenceCode }).first();
  const count = await card.count();
  if (!count) throw new Error(`Pedido ${referenceCode} não encontrado na lista`);
  await card.click();
  await page.waitForURL(/#\/admin\/pedidos\/\d+/, { timeout: 60000 });
  await stabilize(page, '.request-detail-admin, h1');
}

async function openClienteRequest(page, referenceCode) {
  await page.goto(hashUrl('/conta/pedidos'), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await stabilize(page, 'a.req-card');
  const card = page.locator('a.req-card').filter({ hasText: referenceCode }).first();
  const count = await card.count();
  if (!count) throw new Error(`Pedido ${referenceCode} não encontrado`);
  await card.click();
  await page.waitForURL(/#\/conta\/pedidos\/\d+/, { timeout: 60000 });
  await stabilize(page, '.portal-detail-hero');
}

async function clickFirstCard(page, cardSelector, urlPattern) {
  await stabilize(page, `${cardSelector}, .req-empty, .prj-empty, .stf-prj-empty`);
  const card = page.locator(cardSelector).first();
  if (await card.count()) {
    await card.click();
    if (urlPattern) {
      await page.waitForURL(urlPattern, { timeout: 60000 });
    }
  } else {
    throw new Error(`Nenhum card (${cardSelector})`);
  }
  await page.waitForTimeout(800);
}

/** Abre detalhe do primeiro projecto na lista ou fallback ID 1 (demo seed). */
async function openFirstProjectDetail(page) {
  await page.goto(hashUrl('/admin/projectos'), { waitUntil: 'domcontentloaded', timeout: 90000 });
  await stabilize(page, 'a.stf-prj-card, .stf-prj-empty, .stf-prj');
  if (await page.locator('a.stf-prj-card').count()) {
    await page.locator('a.stf-prj-card').first().click();
    await page.waitForURL(/#\/admin\/projectos\/\d+/, { timeout: 60000 });
  } else {
    await page.goto(hashUrl('/admin/projectos/1'), { waitUntil: 'domcontentloaded', timeout: 90000 });
  }
  await stabilize(page, '.stf-prj-d-hero, .stf-prj-d');
}

function writeIndex() {
  const bySection = (name) => successes.filter((s) => s.section === name);

  const lines = [
    '# Índice — Tour visual Construvasco',
    '',
    `**Data de captura:** ${capturedAt}`,
    '**Resolução:** 1440×900 (desktop)',
    `**Base URL:** ${BASE}`,
    `**Screenshots:** \`tools/visual-tour/screenshots/\``,
    '',
    `**Sucesso:** ${successes.length} · **Falhas:** ${failures.length}`,
    '',
    '---',
    '',
    '## A. Páginas anónimas',
    '',
    ...formatSectionRows(bySection('anon')),
    '',
    '## B. Cliente',
    '',
    ...formatSectionRows(bySection('cliente')),
    '',
    '## C. Gestor',
    '',
    ...formatSectionRows(bySection('gestor')),
    '',
    '## D. Técnico',
    '',
    ...formatSectionRows(bySection('tecnico')),
    '',
    '## E. Admin',
    '',
    ...formatSectionRows(bySection('admin')),
    '',
    '## F. Dialogs',
    '',
    ...formatSectionRows(bySection('dialogs')),
    '',
    '## G. Estúdio / mockups',
    '',
    ...formatSectionRows(bySection('estudio')),
    '',
  ];

  if (failures.length) {
    lines.push('---', '', '## Falhas', '', '| Ficheiro | Secção | Motivo |', '|----------|--------|--------|');
    for (const f of failures) {
      lines.push(`| ${f.filename} | ${f.section} | ${f.reason.replace(/\|/g, '/')} |`);
    }
  }

  writeFileSync(INDEX_PATH, lines.join('\n'), 'utf8');
}

function formatSectionRows(items) {
  if (!items.length) return ['_Nenhum screenshot nesta secção._'];
  return items.map(
    (s) => `- **${s.filename}** — \`tools/visual-tour/screenshots/${s.filename}\` (${s.path})`
  );
}

async function checkSetup() {
  const issues = [];
  try {
    const fe = await fetch(BASE, { signal: AbortSignal.timeout(5000) });
    if (!fe.ok) issues.push(`Frontend ${BASE} respondeu HTTP ${fe.status}`);
  } catch {
    issues.push(`Frontend inacessível em ${BASE} (ng serve na porta 4200?)`);
  }
  try {
    const be = await fetch('http://127.0.0.1:8000/api/test', { signal: AbortSignal.timeout(5000) });
    if (!be.ok) issues.push(`API HTTP ${be.status}`);
  } catch {
    issues.push('Backend inacessível em http://127.0.0.1:8000 (php artisan serve?)');
  }
  if (!existsSync(join(process.cwd(), 'node_modules', 'playwright'))) {
    issues.push('Playwright não encontrado em node_modules — correr: npx playwright install chromium');
  }
  return issues;
}

async function main() {
  console.log('=== Construvasco Visual Tour ===\n');
  const issues = await checkSetup();
  if (issues.length) {
    console.log('AVISO — setup:');
    issues.forEach((i) => console.log(`  - ${i}`));
    console.log('\nA continuar mesmo assim...\n');
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  try {
    // --- A. Anónimo ---
    await capture(page, '01-sign-in.png', {
      section: 'anon',
      url: '/auth/sign-in',
      selector: '#identifier',
    });
    await capture(page, '02-sign-up.png', {
      section: 'anon',
      url: '/auth/sign-up',
      selector: 'form, .auth-sign-in-shell',
    });

    // --- B. Cliente ---
    await login(page, ...USERS.cliente);

    await capture(page, '10-cliente-dashboard.png', {
      section: 'cliente',
      url: '/conta/dashboard',
      selector: '.dash-hero, .dash',
    });

    await capture(page, '11-cliente-estudio-passo1.png', {
      section: 'cliente',
      url: '/conta/estudio',
      selector: '.studio-wizard, .studio-step',
    });

    await capture(page, '12-cliente-pedidos-lista.png', {
      section: 'cliente',
      url: '/conta/pedidos',
      selector: 'a.req-card, .req-empty',
    });

    await capture(page, '13-cliente-pedido-detalhe.png', {
      section: 'cliente',
      action: async (p) => {
        await p.goto(hashUrl('/conta/pedidos'), { waitUntil: 'domcontentloaded', timeout: 90000 });
        if (await p.locator('a.req-card').count()) {
          await clickFirstCard(p, 'a.req-card', /#\/conta\/pedidos\/\d+/);
        } else {
          await p.goto(hashUrl('/conta/pedidos/1'), { waitUntil: 'domcontentloaded', timeout: 90000 });
        }
      },
      afterSelector: '.portal-detail-hero, .portal-detail',
    });

    await capture(page, '14-cliente-projectos-lista.png', {
      section: 'cliente',
      url: '/conta/projectos',
      selector: 'a.prj-card, .prj-empty',
    });

    await capture(page, '15-cliente-projecto-detalhe.png', {
      section: 'cliente',
      action: async (p) => {
        await p.goto(hashUrl('/conta/projectos'), { waitUntil: 'domcontentloaded', timeout: 90000 });
        if (await p.locator('a.prj-card').count()) {
          await clickFirstCard(p, 'a.prj-card', /#\/conta\/projectos\/\d+/);
        } else {
          await p.goto(hashUrl('/conta/projectos/1'), { waitUntil: 'domcontentloaded', timeout: 90000 });
        }
      },
      afterSelector: '.cp-page-title, .cp-list-card__ref, h1',
    });

    await capture(page, '16-cliente-definicoes.png', {
      section: 'cliente',
      url: '/conta/definicoes',
      selector: '.set-form, .settings, form',
    });

    // --- G partial (cliente still logged in) ---
    await capture(page, '60-cliente-estudio-galeria.png', {
      section: 'estudio',
      action: async (p) => {
        await openClienteRequest(p, 'DEMO-PED-STUDIO');
      },
      selector: '.portal-detail-hero, .approved-mockup',
    });

    await capture(page, '61-cliente-pedido-com-mockup.png', {
      section: 'estudio',
      action: async (p) => {
        await openClienteRequest(p, 'DEMO-PED-GERADO');
      },
      selector: '.portal-detail-hero',
    });

    await logout(page);

    // --- C. Gestor ---
    await login(page, ...USERS.gestor);

    await capture(page, '20-gestor-dashboard.png', {
      section: 'gestor',
      url: '/admin/dashboard',
      selector: '.stf-dash-hero, .stf-dash',
    });

    await capture(page, '21-gestor-pedidos-lista.png', {
      section: 'gestor',
      url: '/admin/pedidos/lista',
      selector: 'a.stf-req-card, .stf-req-empty',
    });

    await capture(page, '22-gestor-pedido-detalhe.png', {
      section: 'gestor',
      action: async (p) => {
        await openAdminRequest(p, 'DEMO-PED-STUDIO');
      },
      selector: '.request-detail-admin h1',
    });

    await capture(page, '23-gestor-pedido-com-quote.png', {
      section: 'gestor',
      action: async (p) => {
        await openAdminRequest(p, 'DEMO-PED-001');
      },
      selector: '.request-detail-admin h1',
    });

    await capture(page, '24-gestor-pedido-aceite.png', {
      section: 'gestor',
      action: async (p) => {
        await openAdminRequest(p, 'DEMO-PED-002');
      },
      selector: '.request-detail-admin h1',
    });

    await capture(page, '25-gestor-projectos-lista.png', {
      section: 'gestor',
      url: '/admin/projectos',
      selector: 'a.stf-prj-card, .stf-prj-empty',
    });

    await capture(page, '26-gestor-projecto-detalhe.png', {
      section: 'gestor',
      action: async (p) => {
        await openFirstProjectDetail(p);
      },
      afterSelector: '.stf-prj-d-hero, .stf-prj-d',
    });

    await capture(page, '27-gestor-clientes.png', {
      section: 'gestor',
      url: '/admin/clientes',
      selector: '.stf-cli-hero, .stf-cli',
    });

    await capture(page, '28-gestor-financas.png', {
      section: 'gestor',
      url: '/admin/financas',
      selector: '.stf-fin-hero, .stf-fin',
    });

    await capture(page, '29-gestor-settings.png', {
      section: 'gestor',
      url: '/admin/settings',
      selector: '.stf-set-hero, .stf-set',
    });

    // --- F. Dialogs (gestor) ---
    await capture(page, '50-dialog-enviar-orcamento.png', {
      section: 'dialogs',
      action: async (p) => {
        await openAdminRequest(p, 'DEMO-PED-STUDIO');
        const btn = p.getByRole('button', { name: /Enviar orçamento de arquitectura/i });
        if (await btn.count()) {
          await btn.click();
          await p.waitForSelector('mat-dialog-container', { timeout: 20000 });
        } else {
          // Fallback: pedido com quote visível — abrir dialog via lista outro pedido submetido
          await openAdminRequest(p, 'DEMO-PED-GERADO');
          const btn2 = p.getByRole('button', { name: /Enviar orçamento de arquitectura/i });
          if (await btn2.count()) {
            await btn2.click();
            await p.waitForSelector('mat-dialog-container', { timeout: 20000 });
          } else {
            throw new Error('Botão enviar orçamento não visível (DEMO-PED-STUDIO / GERADO)');
          }
        }
      },
      afterSelector: 'mat-dialog-container, .request-detail-admin',
    });

    console.log('⏭️  51-dialog-rejeitar-quote.png — opcional, ignorado');

    await logout(page);

    // --- D. Técnico ---
    await login(page, ...USERS.tecnico);

    await capture(page, '30-tecnico-dashboard.png', {
      section: 'tecnico',
      url: '/admin/dashboard',
      selector: '.stf-dash-hero, .stf-dash',
    });

    await capture(page, '31-tecnico-projectos-lista.png', {
      section: 'tecnico',
      url: '/admin/projectos',
      selector: 'a.stf-prj-card, .stf-prj-empty',
    });

    await capture(page, '32-tecnico-projecto-detalhe.png', {
      section: 'tecnico',
      action: async (p) => {
        await openFirstProjectDetail(p);
      },
      afterSelector: '.stf-prj-d-hero, .stf-prj-d',
    });

    await logout(page);

    // --- E. Admin ---
    await login(page, ...USERS.admin);

    await capture(page, '40-admin-dashboard.png', {
      section: 'admin',
      url: '/admin/dashboard',
      selector: '.stf-dash-hero, .stf-dash',
    });

    await capture(page, '41-admin-equipa-lista.png', {
      section: 'admin',
      url: '/admin/staff/list',
      selector: '.staff-list, app-data-table, app-page-header',
    });

    await capture(page, '42-admin-equipa-criar.png', {
      section: 'admin',
      url: '/admin/staff/create',
      selector: 'form, app-page-header',
    });

    await capture(page, '43-admin-settings.png', {
      section: 'admin',
      url: '/admin/settings',
      selector: '.stf-set-hero, .stf-set',
    });
  } finally {
    await browser.close();
  }

  writeIndex();

  console.log('\n=== Resumo ===');
  console.log(`Screenshots: ${SCREENSHOTS}`);
  console.log(`Sucesso: ${successes.length}`);
  console.log(`Falhas: ${failures.length}`);
  if (successes.length) {
    console.log('\nGerados:');
    successes.forEach((s) => console.log(`  - ${s.filename}`));
  }
  if (failures.length) {
    console.log('\nFalharam:');
    failures.forEach((f) => console.log(`  - ${f.filename}: ${f.reason}`));
  }
  console.log(`\nINDEX: ${INDEX_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
