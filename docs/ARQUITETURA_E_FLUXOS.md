# Arquitectura e fluxos — Construvasco (frontend)

## Visão em camadas

1. **Router (Angular)**: define URLs, lazy loading e `data` (ex.: `layout: 'empty'`).
2. **Guards**: `authGuard`, `noAuthGuard`, `adminGuard` em `src/app/core/auth/guards/`.
3. **Layout**: `LayoutComponent` (`src/app/layout/`) envolve rotas com o shell Fuse.
4. **Módulos de funcionalidade**: `landing`, `auth`, `account`, `admin` sob `src/app/modules/`.
5. **Core**: `AuthService`, `UserService`, `ConfigService`, interceptors HTTP.
6. **Shared**: componentes reutilizáveis (header, modais, paginação) e constantes.

## Modo interior (entrada por defeito)

Com `features.publicSiteEnabled: false` (ver `environment.ts`):

1. `/` → `/admin/dashboard` (sem sessão, `adminGuard` envia para `/auth/sign-in`).
2. Após login: staff → `/admin/dashboard`; cliente (`customer`) → `/conta/dashboard` ([`role-dashboard.util.ts`](../src/app/core/auth/utils/role-dashboard.util.ts)).
3. URLs antigas da loja (`/produtos`, `/checkout`, …) redireccionam para `/auth/sign-in`.
4. Site público só é montado se `publicSiteEnabled: true` (prefixo `/public`).

## Mapa de fluxos (alto nível)

```mermaid
flowchart TB
  root["/"] --> adminDash["/admin/dashboard"]
  adminDash --> adminGuard{adminGuard}
  adminGuard -->|nao autenticado| signIn["/auth/sign-in"]
  adminGuard -->|customer| contaDash["/conta/dashboard"]
  adminGuard -->|staff| adminOK[Admin_UI]

  subgraph auth [Autenticacao]
    SignIn[auth_sign_in]
    SignUp[auth_sign_up]
    ChangePwd[auth_change_password]
    SignIn --> adminOK
    SignIn --> contaDash
    SignUp --> SignIn
  end

  subgraph conta [Cliente_autenticado]
    Dashboard[conta_dashboard]
    Pedidos[conta_pedidos]
    Projectos[conta_projectos]
    Pagamentos[conta_pagamentos]
    Definicoes[conta_definicoes]
    contaDash --> Dashboard
    Dashboard --> Pedidos
    Dashboard --> Projectos
  end

  subgraph admin [Staff_admin]
    AdminDash[admin_dashboard]
    AdminOrders[admin_orders]
    AdminJobCards[admin_job_cards]
    AdminStaff[admin_staff]
    AdminDash --> AdminOrders
    AdminDash --> AdminJobCards
    AdminDash --> AdminStaff
  end
```

Notas:

- Rotas antigas `forgot-password`, `reset-password`, `redefinir-senha/:token` redireccionam para `sign-in`; alteração de palavra-passe com sessão em `/auth/change-password`.
- Logout redirecciona para `/auth/sign-in`.

## Rotas principais (referência)

Definição canónica: [`src/app/app.routes.ts`](../src/app/app.routes.ts). Landing filha: [`src/app/modules/landing/landing.routes.ts`](../src/app/modules/landing/landing.routes.ts).

| Prefixo | Público | Descrição |
|---------|---------|-----------|
| `/` | Não (redirect) | → `/admin/dashboard` (login-first) |
| `/auth/sign-in`, `/auth/sign-up` | Sim (guest) | Entrada; `noAuthGuard` redirecciona se já autenticado |
| `/auth/change-password` | Não | JWT + `authGuard`; também fluxo `must_change` |
| `/conta/*` | Não | Área cliente (`authGuard`) |
| `/admin/*` | Não | Backoffice (`adminGuard`; customer → `/conta`) |
| `/public/*` | Sim | Só com `publicSiteEnabled: true` (landing/loja) |
| `/produtos`, `/checkout`, … | Redirect | → `/auth/sign-in` quando loja desactivada |

Com `publicSiteEnabled: true`, ver `landing.routes.ts` sob o prefixo `/public`.

## Autenticação e autorização

| Ficheiro | Papel |
|----------|-------|
| [`auth.service.ts`](../src/app/core/auth/services/auth.service.ts) | Login, registo, logout, refresh, Google, `changePassword`; token em `localStorage` (`access_token`). |
| [`auth.interceptor.ts`](../src/app/core/auth/interceptors/auth.interceptor.ts) | Anexa `Authorization: Bearer` excepto em rotas públicas explícitas (login, register, google). |
| [`auth.guard.ts`](../src/app/core/auth/guards/auth.guard.ts) | Protecção de rotas autenticadas; redirecção para change-password se `must_change`. |
| [`no-auth.guard.ts`](../src/app/core/auth/guards/no-auth.guard.ts) | Impede acesso a sign-in/sign-up quando já autenticado. |
| [`admin.guard.ts`](../src/app/core/auth/guards/admin.guard.ts) | Restringe `/admin` a perfis administrativos. |

## Admin: sub-rotas (resumo)

Sob `/admin` (lazy): `dashboard`, `settings`, `products` (list/create/edit/detail), `designs`, `orders` (list/create/kanban/detail), `categories`, `staff`, `job-cards` (list/kanban/create/detail). Detalhe exacto em `app.routes.ts`.

## Decisões já reflectidas no código (útil para onboarding)

- **JWT** na API; refresh configurado no `AuthService`.
- **Sem recuperação pública de senha por email**: mensagens na UI orientam alteração em **Conta → Definições** após login.
- **Layout `empty`** nas áreas públicas e conta para controlar chrome Fuse vs site.
