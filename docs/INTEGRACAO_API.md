# Integração com a API — Construvasco (frontend)

## Repositório backend

A lógica de negócio, base de dados, JWT e políticas CORS vive no **Laravel**, normalmente no repositório irmão (ex.: `construvasco_laravel_v1` ao mesmo nível deste frontend).

- Rotas HTTP: ver `routes/api.php`, `routes/auth.php` e restantes ficheiros em `routes/` no backend.
- Autenticação API: prefixo `auth/` (login, register, google, logout, refresh, me, change-password) conforme versão actual do servidor.

Este frontend **não duplica** a lista completa de endpoints; usa `ConfigService.getApiUrl()` e, nalguns módulos, constantes em [`src/app/shared/constants/api-endpoints.ts`](../src/app/shared/constants/api-endpoints.ts).

## Como o frontend constrói URLs

1. Lê `environment.apiURL.root` (ex.: `http://127.0.0.1:8000/api`).
2. `ConfigService.getApiUrl('auth/login')` → `http://127.0.0.1:8000/api/auth/login`.
3. Ficheiros em storage: `getFileUrl()` remove o sufixo `/api` e monta URLs sob `/storage/...` no mesmo host que serve a app Laravel.

## Constante `API_ENDPOINTS`

O ficheiro [`api-endpoints.ts`](../src/app/shared/constants/api-endpoints.ts) é um **catálogo legado/híbrido**: inclui secções usadas pela Construvasco (produtos `v1/...`, categorias, pedidos, etc.) e **blocos herdados de outros domínios** (ex.: candidatos, jobs) que podem não estar activos no teu deploy.

**Regra prática:** tratar o Laravel como **fonte de verdade** das rotas; usar `API_ENDPOINTS` apenas onde o código já o referencia, e ir consolidando chamadas em serviços pequenos com paths alinhados ao backend.

## Convenções de versão

Muitos endpoints administrativos e públicos usam prefixo `v1/` na constante. Confirma no Laravel se o prefixo global (`Route::prefix('v1')`) coincide; ajusta `environment` ou rotas se o servidor usar outro esquema.

## HTTPS e produção

Em produção, `environment.prod.ts` deve apontar para **HTTPS** na API e o mesmo domínio ou CORS explicitamente configurado. Google Sign-In exige origins HTTPS válidos em produção.

## Erros comuns

| Sintoma | Verificar |
|---------|-----------|
| 401 em tudo após login | Token não guardado ou interceptor a omitir em rota errada |
| CORS | Headers e `allowed_origins` no Laravel |
| Google 403 / origin | Client ID e **Authorized JavaScript origins** |
| 404 em `v1/...` | Prefixo de rota no Laravel vs string no frontend |
