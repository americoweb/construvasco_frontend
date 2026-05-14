# Desenvolvimento — Construvasco (frontend)

## Requisitos

- Node.js (LTS recomendado para Angular 18)
- `npm install` na raiz do repositório

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm start` | `ng serve` — servidor de desenvolvimento |
| `npm run build` | Build default |
| `npm run build:prod` | Build produção (`fileReplacements` para `environment.prod.ts`) |
| `npm test` | Testes unitários (Karma) |

## Ambientes (`environment`)

| Ficheiro | Uso |
|----------|-----|
| [`src/environments/environment.ts`](../src/environments/environment.ts) | Desenvolvimento local |
| [`src/environments/environment.prod.ts`](../src/environments/environment.prod.ts) | Produção (substitui o anterior no build `--configuration=production`) |

Campos relevantes do modelo `AppConfig` (ver [`src/app/core/models/app-config.interface.ts`](../src/app/core/models/app-config.interface.ts)):

- **`apiURL.root`**: base da API (ex.: `http://127.0.0.1:8000/api`). O [`ConfigService`](../src/app/core/services/config.service.ts) concatena endpoints (`auth/login`, `v1/...`).
- **`apiURL.auth`**: reservado; na prática o código usa `root` para auth.
- **`apiURL.uploads`**: base para ficheiros públicos quando aplicável.
- **`features`**: `aiEnabled`, `multiTenant`, etc.
- **`external.google` / `googleClientId`**: Google Identity Services (botões de login). O origin do browser deve estar autorizado no Google Cloud Console.

## CORS e origem

A API Laravel deve aceitar pedidos desde o origin do Angular (ex.: `http://localhost:4200`). Se mudares a porta ou usares `127.0.0.1` vs `localhost`, mantém consistência com **Google OAuth** (origins autorizados) e com **CORS** no backend.

## Depuração de autenticação

1. **Token**: `localStorage` chave `access_token` (serviço canónico em [`src/app/core/auth/services/auth.service.ts`](../src/app/core/auth/services/auth.service.ts)).
2. **Interceptor**: [`src/app/core/auth/interceptors/auth.interceptor.ts`](../src/app/core/auth/interceptors/auth.interceptor.ts) — confirma que URLs públicas (`auth/login`, `auth/register`, `auth/google`) não levam `Bearer` inválido.
3. **Guards**: se fores redireccionado inesperadamente, verifica `authGuard` / `must_change` e `adminGuard` (perfil).
4. **Rede**: DevTools → Network → filtra por `api` e inspecciona 401/403/422.

## Mock API (Fuse)

Existe integração opcional com **Fuse Mock API** sob `src/app/mock-api/`. Em desenvolvimento real contra Laravel, garante que o app não depende só de mocks para fluxos críticos (auth, pedidos).

## Estilo e UI

- Angular Material + Tailwind (conforme template Fuse).
- Componentes standalone predominantes.

## Onde pedir ajuda no código

- Rotas: `app.routes.ts`, `landing.routes.ts`
- Cliente: `modules/account/`
- Público: `modules/landing/`
- Admin: `modules/admin/`
