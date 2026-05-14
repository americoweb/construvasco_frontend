# Construvasco — Frontend (Angular)

SPA em **Angular 18** (base **Fuse**) para o site público, área de cliente, autenticação e backoffice administrativo da Construvasco. Comunica com a API **Laravel** (`/api`).

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/PRODUTO_E_VALOR.md](docs/PRODUTO_E_VALOR.md) | O que a plataforma resolve para a empresa e públicos-alvo |
| [docs/ARQUITETURA_E_FLUXOS.md](docs/ARQUITETURA_E_FLUXOS.md) | Mapa de fluxos, rotas, guards e camadas |
| [docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md) | Ambiente local, variáveis, debugging |
| [docs/INTEGRACAO_API.md](docs/INTEGRACAO_API.md) | Ligação ao backend e constantes de API |

## Pré-requisitos

- Node.js compatível com Angular 18 (LTS recomendado)
- npm (ou yarn)
- API Laravel a correr (por defeito o frontend aponta para `http://127.0.0.1:8000/api` em desenvolvimento)

## Arranque rápido

```bash
npm install
npm start
```

Abre `http://localhost:4200/` (ou a porta indicada pelo CLI).

Build de produção:

```bash
npm run build:prod
```

## Configuração da API e integrações

- URLs e flags: [`src/environments/environment.ts`](src/environments/environment.ts) (dev) e [`src/environments/environment.prod.ts`](src/environments/environment.prod.ts) (substituído no build de produção via `angular.json`).
- Resolução de URLs de API: [`src/app/core/services/config.service.ts`](src/app/core/services/config.service.ts).
- Google Sign-In: `googleClientId` / `external.google.clientId` no `environment`; no Google Cloud Console, os **Authorized JavaScript origins** devem coincidir com o origin do browser (ex.: `http://localhost:4200`).

Detalhes em [docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md) e [docs/INTEGRACAO_API.md](docs/INTEGRACAO_API.md).

## Estrutura do código (resumo)

| Pasta | Função |
|-------|--------|
| `src/app/modules/landing/` | Site público: home, catálogo, produto, checkout |
| `src/app/modules/auth/` | Páginas auth (sign-in, sign-up, change-password) |
| `src/app/modules/account/` | Área cliente autenticada (`/conta/...`) |
| `src/app/modules/admin/` | Backoffice (`/admin/...`) |
| `src/app/core/` | Auth, guards, interceptors, serviços partilhados |
| `src/app/shared/` | Componentes e constantes reutilizáveis |
| `src/app/layout/` | Shell de layout (Fuse) |

## Backend

O repositório da API Laravel costuma viver lado a lado, por exemplo `../construvasco_laravel_v1`. Ver [docs/INTEGRACAO_API.md](docs/INTEGRACAO_API.md).

## Licença e template

O projeto deriva do template comercial **Fuse** (Angular). Respeitar a licença original do template onde aplicável; o código e a documentação específicos da Construvasco são da organização.
