---
name: polish-staff-portal
description: >-
  Polish all Construvasco staff (admin, gestor, técnico) portal screens to match
  the customer area visual quality. Rotates roles, processes every sidebar menu
  in order, and does not stop until the checklist is complete. Use when the user
  asks to improve admin/gestor/técnico layouts, Day 3 polish, or staff UI.
---

# Polish Staff Portal (Admin · Gestor · Técnico)

## Mission

Bring **every staff menu screen** to the same standard as the customer portal (`#/conta/*`): olive brand tokens, hero + KPIs where relevant, pill filters, animated cards, skeletons, empty states, Portuguese copy, `prefers-reduced-motion`. **Do not stop** until `CHECKLIST.md` in this folder has every item marked `[x]`.

## Repos & URLs

| | Path |
|---|------|
| Frontend | `construvasco_frontend_v1` |
| Dev | `http://127.0.0.1:4200` (hash routing) |
| Staff base | `#/admin/*` |
| Tokens | `src/styles/_app-design-tokens.scss` |
| Customer reference | `src/app/modules/account/styles/customer-portal.scss`, `req-*`, `prj-*`, `dash-*`, `set-*` |

## Demo logins (seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@construvasco.co.mz` | `Admin@2026` |
| Gestor | `gestor@construvasco.co.mz` | `Gestor@2026` |
| Técnico | `tecnico@construvasco.co.mz` | `Tecnico@2026` |

Navigation is **role-based** (`navigation.service.ts` + `mock-api/common/navigation/data.ts`). All roles share the same route tree; only the sidebar differs.

## Non-negotiable rules

1. **One screen at a time** — finish HTML + SCSS + TS (`pageReady` / loading) before the next checklist row.
2. **Do not break role logic** — respect `isTechnicianView`, role checks, hidden actions for técnico, admin-only staff routes.
3. **Reuse tokens** — `var(--app-primary)`, `--app-surface`, `--app-border`, shadows from `_app-design-tokens.scss`. No random indigo/gray slop.
4. **BEM prefix per screen** — use `stf-{area}-*` (staff), e.g. `stf-dash-*`, `stf-req-*`, `stf-prj-*`, `stf-cli-*`, `stf-fin-*`, `stf-team-*`, `stf-set-*`. One block root per component (`<div class="stf-req" [class.stf-req--ready]="pageReady">`).
5. **Patterns to copy from customer** (read the file, do not guess):
   - Hero: eyebrow, title, subtitle, optional CTA, gradient + subtle noise
   - KPI row when list/dashboard has countable metrics
   - Toolbar: search + pill filters with counts
   - List cards: left accent bar, status chip, hover lift
   - Skeleton while loading; `stf-*-animate` with `--i` stagger; `--ready` gate
   - Empty state: icon, title, short text
6. **Shared staff styles** — when 3+ screens need the same chrome, add utilities to `src/app/modules/admin/styles/staff-portal.scss` and import from component SCSS (mirror `customer-portal.scss`).
7. **Fuse shell stays** — polish **content inside** `<router-outlet>` only; do not redesign classy sidebar unless asked.
8. **Build after each screen** — `npm run build`; fix errors before continuing.
9. **Scope** — no unrelated refactors, no commits unless user asks.
10. **Update checklist** — mark `[x]` in `CHECKLIST.md` after each screen; write one-line note if técnico/gestor needs visual QA only.

## Execution loop (do not exit early)

```
WHILE checklist has unchecked items:
  1. Pick next unchecked row (order below)
  2. Read component .html, .scss, .ts
  3. Rewrite template + SCSS to stf-* pattern; wire pageReady/skeleton
  4. npm run build
  5. Mark [x] in CHECKLIST.md
  6. If row says "QA gestor/tecnico": log in mentally / note shared component — no duplicate SCSS
END
```

### Phase A — Admin (covers shared components for all roles)

Process in this **exact order** (child routes included):

| # | Menu | Route | Component dir |
|---|------|-------|----------------|
| A1 | Painel | `/admin/dashboard` | `modules/admin/dashboard/` |
| A2 | Pedidos · lista | `/admin/pedidos/lista` | `modules/admin/project-requests/` → `project-requests-list` |
| A3 | Pedidos · novo | `/admin/pedidos/novo` | `project-requests-page` |
| A4 | Pedido · detalhe | `/admin/pedidos/:id` | `project-request-detail` |
| A5 | Projectos · lista | `/admin/projectos` | `modules/admin/projects/projects-list` |
| A6 | Projecto · detalhe | `/admin/projectos/:id` | `project-detail` |
| A7 | Clientes | `/admin/clientes` | `modules/admin/clients/` |
| A8 | Finanças | `/admin/financas` | `modules/admin/finances/` |
| A9 | Equipa · lista | `/admin/staff/list` | `modules/admin/staff/list/` |
| A10 | Equipa · criar | `/admin/staff/create` | `modules/admin/staff/form/` |
| A11 | Equipa · editar | `/admin/staff/:id/edit` | same form |
| A12 | Configurações | `/admin/settings` | `modules/settings/` (Fuse drawer — restyle panels to `stf-set-*`, keep tabs) |

Hub shells (`project-requests-hub`, `projects-shell`, `clients-hub`, `staff.component`) — polish only if tabs/outlet chrome look bare; prefer child polish first.

### Phase B — Gestor QA

Same components as admin. For each gestor menu item, confirm layout works and **no admin-only CTAs** leak visually:

- Painel, Pedidos, Projectos, Clientes, Finanças, Configurações

Mark gestor rows in checklist `[x]` after confirming A1–A8 + A12 cover them (no separate SCSS unless gestor-specific copy/layout branch exists).

### Phase C — Técnico QA

| Menu | Route | Notes |
|------|-------|-------|
| Painel | `/admin/dashboard` | Technician stats/copy |
| Meus projectos | `/admin/projectos` | `isTechnicianView`; hide manager actions |
| Configurações | `/admin/settings` | Same as A12 |

Mark técnico rows `[x]` after A1, A5, A6, A12 verified for technician navigation.

## Per-screen checklist (apply every time)

- [ ] Root `stf-*` block + `--ready` + skeleton
- [ ] Hero matches customer quality (gradient, typography)
- [ ] KPIs / filters / search if list page
- [ ] Cards/tables visually consistent; status chips use semantic colors
- [ ] Empty + error states
- [ ] `prefers-reduced-motion` in SCSS
- [ ] `npm run build` passes
- [ ] `CHECKLIST.md` updated

## What NOT to polish (unless user asks)

- Legacy redirects: `products`, `designs`, `categories`, `orders`, `job-cards`
- Customer portal `/conta/*` (already done)
- Backend / API changes

## Reference files (read before first edit)

- `customer-requests.component.{html,scss}` — list hub pattern
- `customer-projects.component.{html,scss}` — projects list
- `customer-dashboard.component.{html,scss}` — dashboard KPIs
- `account/views/settings/settings.component.{html,scss}` — settings tabs

## Completion message

When all checklist items are `[x]`, report:

1. Screens changed (file paths)
2. Any gestor/técnico-specific branches touched
3. Build status
4. Suggested manual smoke: login as each role and open each menu once
