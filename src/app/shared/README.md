# Guia de Estrutura e Uso — `shared/components` - Desenvolvimento Frontend

Este documento serve como referência para desenvolvedores (ou IA) entenderem a arquitetura, propósito e práticas de uso dos componentes compartilhados para desenvolvimento de aplicações frontend Angular baseadas no Fuse.

---

## Visão Geral

A pasta `shared/components` centraliza **componentes reutilizáveis** e altamente configuráveis, que podem ser usados em qualquer módulo da aplicação (ex: admin, auth, landing, etc.). O objetivo é **evitar duplicidade de código**, facilitar manutenção e garantir consistência visual e funcional em toda a aplicação.

Todos os componentes aqui são pensados para serem genéricos, flexíveis e receberem configurações via propriedades/inputs, permitindo que sejam adaptados a diferentes contextos sem necessidade de duplicação.

---

## Estrutura da Pasta

```
shared/
  components/
    feedback/          # Notificações, modais, diálogos
    data/              # Tabelas, listas, paginação, filtros
    ui/                # Componentes visuais básicos
    layout/            # Headers, breadcrumbs, navegação
    forms/              # Formulários dinâmicos e campos
    index.ts
  constants/            # Constantes da aplicação
  interfaces/           # Interfaces TypeScript
  models/               # Modelos de dados
  services/             # Serviços base e utilitários
  utils/                # Funções auxiliares
  README.md
```

### Subpastas e Propósito

#### 1. `components/feedback/`
- **Propósito:** Serviços e componentes para feedback ao usuário (notificações, modais, diálogos de confirmação, etc.).
- **Principais arquivos/subpastas:**
  - `modal.service.ts`, `notification.service.ts`, `notification-container.component.ts`, `feedback.types.ts`
  - `confirm-dialog/`, `notification/`, `modal/`
- **Exemplo de uso:**
  - Exibir uma notificação global após uma ação bem-sucedida.
  - Abrir um modal de confirmação antes de deletar um item.

#### 2. `components/data/`
- **Propósito:** Componentes para exibição e manipulação de dados.
- **Principais subpastas:**
  - `table/`, `pagination/`, `list/`, `grid/`, `filters/`
  - `examples.md` (exemplos de uso)
- **Exemplo de uso:**
  - Exibir uma lista paginada de escolas.
  - Mostrar detalhes de um estudante selecionado.

#### 3. `components/ui/`
- **Propósito:** Componentes visuais básicos e utilitários.
- **Principais subpastas:**
  - `loading/`, `empty-state/`, `chip/`, `card/`, `button/`, `badge/`, `avatar/`
- **Exemplo de uso:**
  - Exibir um spinner de loading enquanto dados são carregados.
  - Mostrar um card de estudante com avatar e badge de status.

#### 4. `components/layout/`
- **Propósito:** Componentes de layout e navegação.
- **Principais subpastas:**
  - `page-header/`, `breadcrumb/`
- **Exemplo de uso:**
  - Adicionar um header de página com título, botões de ação e breadcrumbs.

#### 5. `components/forms/`
- **Propósito:** Componentes e helpers para construção de formulários dinâmicos e reutilizáveis.
- **Principais subpastas/arquivos:**
  - `search-box/`, `form-field/`, `file-upload/`, `dynamic-form/`
  - `form.types.ts`, `examples.md`
- **Exemplo de uso:**
  - Criar um formulário dinâmico para cadastro de estudante, com validação e upload de arquivos.

#### 6. `constants/`
- **Propósito:** Constantes da aplicação, endpoints de API e configurações.
- **Principais arquivos:**
  - `api-endpoints.ts`, `app.constants.ts`, `status-codes.ts`

#### 7. `interfaces/`
- **Propósito:** Interfaces TypeScript para tipagem forte.
- **Principais arquivos:**
  - `permission.interface.ts`

#### 8. `models/`
- **Propósito:** Modelos de dados e interfaces de API.
- **Principais arquivos:**
  - `api-response.interface.ts`, `base.interface.ts`, `pagination.interface.ts`

#### 9. `services/`
- **Propósito:** Serviços base e utilitários compartilhados.
- **Principais arquivos:**
  - `base.service.ts`, `loading.service.ts`, `permission.service.ts`

#### 10. `utils/`
- **Propósito:** Funções auxiliares e utilitários.
- **Principais arquivos:**
  - `date.utils.ts`, `format.utils.ts`, `validation.utils.ts`

---

## Práticas de Uso e Manutenção

- **Reutilização máxima:**
  - Sempre que precisar de um componente (header, tabela, formulário, etc.), procure primeiro no `shared/components` antes de criar um novo.
  - Use propriedades/inputs para customizar comportamento e aparência conforme a necessidade do contexto.
- **Manutenção centralizada:**
  - Se encontrar um bug ou precisar evoluir uma funcionalidade, corrija ou adicione no componente compartilhado. Todos os lugares que usam esse componente serão beneficiados automaticamente.
- **Consistência:**
  - Siga o padrão de inputs/outputs e estilos definidos nos componentes compartilhados para garantir uma experiência uniforme.
- **Documentação e exemplos:**
  - Utilize arquivos `examples.md` (quando disponíveis) para ver exemplos práticos de uso dos componentes.
- **Estilo:**
  - Prefira Tailwind CSS nos templates HTML para estilização rápida e consistente, evitando SCSS separado quando possível.

---

## Exemplo Prático de Reutilização

**Cenário:**
- O componente `page-header` do `shared/components/layout/page-header/` pode ser usado em diferentes páginas (Escolas, Estudantes, Transporte, etc.).
- Ele aceita propriedades como `title`, `showImportButton`, `showExportButton`, etc.
- Em cada página, basta importar e configurar conforme a necessidade:

```html
<!-- Em schools.component.html -->
<app-page-header [title]="'Escolas'" [showImportButton]="true" [showExportButton]="true"></app-page-header>

<!-- Em students.component.html -->
<app-page-header [title]="'Estudantes'" [showImportButton]="false" [showExportButton]="false"></app-page-header>
```

Se precisar mudar o comportamento do botão de exportação, basta alterar o componente no `shared/components/layout/page-header/` e todas as páginas refletirão a mudança.

---

## Integração com Fuse

- Os componentes do `shared/components` podem ser usados em conjunto com os componentes e serviços do Fuse (`@fuse/`), aproveitando temas, layouts e helpers visuais prontos.
- Siga o padrão de modularização e reutilização do Fuse para manter a aplicação escalável e fácil de manter.

---

## Estrutura Base de Módulos: Organização de Pastas e Arquivos

A estrutura de cada módulo deve seguir o padrão abaixo, que é a base obrigatória para todos os módulos enterprise do iEDU:

### Estrutura de Pastas e Arquivos

```
modules/<context>/<modulo>/
  <modulo>.component.ts        # Shell component com router-outlet
  <modulo>.component.html      # Template shell com router-outlet
  <modulo>.routes.ts          # Rotas lazy-loaded
  shared/                     # Arquivos compartilhados do módulo
    <modulo>.service.ts       # Serviço principal
    <modulo>.types.ts         # Interfaces TypeScript
    <modulo>.constants.ts     # Constantes e configurações
    <modulo>.validators.ts    # Validadores específicos
    <modulo>.helpers.ts       # Funções auxiliares
    <modulo>.interfaces.ts    # Interfaces adicionais
  list/                       # Componente de listagem
    <modulo>-list.component.ts
    <modulo>-list.component.html
  detail/                     # Componente de detalhes
    <modulo>-detail.component.ts
    <modulo>-detail.component.html
  form/                       # Componente de formulário
    <modulo>-form.component.ts
    <modulo>-form.component.html
  // Outros componentes conforme necessidade da app
```

### Regras Obrigatórias
- **Sempre crie o componente principal como shell** dentro do módulo, contendo `router-outlet`.
- **Sempre crie a pasta `shared`** dentro do módulo, contendo:
  - `services` (ex: schools.service.ts)
  - `types` e `interfaces` (ex: schools.types.ts)
  - `constants` (ex: schools.constants.ts)
  - `validators` (ex: schools.validators.ts)
  - `helpers` (ex: schools.helpers.ts)
- **A estrutura deve ser gerada primeiro em um artefato `structure.sh`** antes de produzir os códigos dos componentes e serviços.
- **Todos os arquivos e pastas devem seguir esse padrão, adaptando apenas para necessidades específicas da app.**

### Exemplo Visual da Estrutura

```
modules/admin/schools/
  schools.component.ts        # Shell component
  schools.component.html      # Template com router-outlet
  schools.routes.ts          # Rotas lazy-loaded
  shared/
    schools.service.ts       # Serviço principal
    schools.types.ts        # Interfaces TypeScript
    schools.constants.ts     # Constantes
    schools.validators.ts   # Validadores
    schools.helpers.ts      # Funções auxiliares
  list/
    schools-list.component.ts
    schools-list.component.html
  detail/
    schools-detail.component.ts
    schools-detail.component.html
  form/
    schools-form.component.ts
    schools-form.component.html
```

### Orientação
- Sempre gere a estrutura de pastas e arquivos com o artefato `structure.sh` antes de iniciar a implementação dos códigos.
- Adapte a estrutura apenas se a documentação da app exigir componentes ou arquivos adicionais.
- Mantenha este README atualizado sempre que a estrutura base evoluir.

---

## Criação de Novos Módulos de Forma Genérica

Após entender toda a estrutura e práticas deste projeto, **basta informar o nome do novo módulo** (ex: "schools", "students", "transport", etc.) e seguir o template abaixo para gerar automaticamente todos os arquivos e pastas necessários.

### Estrutura Genérica

```
modules/<context>/<nome-do-modulo>/
  <nome-do-modulo>.component.ts        # Shell component
  <nome-do-modulo>.component.html      # Template shell
  <nome-do-modulo>.routes.ts          # Rotas lazy-loaded
  shared/
    <nome-do-modulo>.service.ts       # Serviço principal
    <nome-do-modulo>.types.ts         # Interfaces TypeScript
    <nome-do-modulo>.constants.ts     # Constantes
    <nome-do-modulo>.validators.ts    # Validadores
    <nome-do-modulo>.helpers.ts       # Funções auxiliares
  list/
    <nome-do-modulo>-list.component.ts
    <nome-do-modulo>-list.component.html
  detail/
    <nome-do-modulo>-detail.component.ts
    <nome-do-modulo>-detail.component.html
  form/
    <nome-do-modulo>-form.component.ts
    <nome-do-modulo>-form.component.html
  // Outros componentes conforme necessidade
```

- Substitua `<context>` por admin, core, etc. conforme o contexto do módulo.
- Substitua `<nome-do-modulo>` pelo nome desejado (ex: "schools", "students", "transport").
- Siga sempre as boas práticas e checklist já documentados.
- Use componentes do `shared/components` para headers, tabelas, formulários, etc.

### Como usar

> **Exemplo:**
> Se você quiser criar um módulo "schools", basta informar "schools" e a IA/developer irá gerar:
> - `modules/admin/schools/schools.component.ts`
> - `modules/admin/schools/schools.component.html`
> - `modules/admin/schools/shared/schools.service.ts`
> - ... e assim por diante, seguindo o padrão.

---

## Geração Automática com Script `generate.sh`

Para facilitar ainda mais a automação, após gerar o código do novo módulo (e de qualquer feature nova em `shared/components/`), a IA ou desenvolvedor deve também gerar um arquivo `generate.sh` na raiz do projeto.

### 1. Objetivo
- O script, ao ser executado, cria toda a estrutura de pastas e arquivos do módulo solicitado (e de novos componentes compartilhados, se houver), já com o código pronto.
- Isso permite que a criação de módulos e features seja totalmente automatizada, bastando executar um comando.

### 2. Exemplo de Estrutura do Script

```bash
#!/bin/bash

# Exemplo: gerar módulo "schools" com estrutura base

mkdir -p src/app/modules/admin/schools/shared
mkdir -p src/app/modules/admin/schools/list
mkdir -p src/app/modules/admin/schools/detail
mkdir -p src/app/modules/admin/schools/form

cat > src/app/modules/admin/schools/schools.component.ts <<'EOF'
// ...código do schools.component.ts...
EOF

cat > src/app/modules/admin/schools/schools.component.html <<'EOF'
<!-- ...código do schools.component.html... -->
EOF

# Repita para shared, list, detail, form, etc.

cat > src/app/modules/admin/schools/shared/schools.service.ts <<'EOF'
// ...código do schools.service.ts...
EOF

cat > src/app/modules/admin/schools/shared/schools.types.ts <<'EOF'
// ...types, interfaces...
EOF

cat > src/app/modules/admin/schools/schools.routes.ts <<'EOF'
// ...rotas standalone/lazy...
EOF

echo "Estrutura do módulo criada com sucesso!"
```

### 3. Boas Práticas
- O script deve ser idempotente: pode ser executado várias vezes sem sobrescrever arquivos já existentes (ou perguntar antes de sobrescrever).
- Todos os caminhos devem ser relativos à raiz do projeto.
- O script deve ser executável (`chmod +x generate.sh`).

### 4. Como Usar
1. Gere a estrutura de pastas e arquivos com o artefato `generate.sh`.
2. Implemente os códigos dos componentes e serviços conforme a estrutura.
3. Execute o script:
   ```bash
   ./generate.sh
   ```
4. O módulo e os componentes estarão prontos para uso no projeto.

---

**Resumo:**
> Após gerar o código do novo módulo (e de qualquer feature no shared/components), gere também um arquivo `generate.sh` que, ao ser executado, cria toda a estrutura de pastas e arquivos com o código gerado. O script deve contemplar tanto o módulo quanto qualquer novo componente compartilhado criado.

---

## Princípio de Adaptação por Aplicação

Cada aplicação é única e pode ter necessidades, fluxos, campos e layouts específicos. Por isso:

- **Siga rigorosamente a documentação e requisitos da app:**
  - Se a documentação exigir 5 formulários, crie 5 formulários, cada um com todos os campos, validações e lógicas descritas.
  - Não omita nenhum campo, validação ou comportamento solicitado.
- **Adapte os layouts e componentes:**
  - O layout deve ser ajustado para atender à experiência do usuário esperada para aquela app.
  - Crie novos componentes ou ajuste os existentes sempre que necessário para cumprir todos os requisitos.
- **Reutilize com inteligência:**
  - Sempre que possível, reutilize componentes do shared, mas nunca sacrifique requisitos da app só para reutilizar algo.
  - Se precisar, crie novos componentes ou estenda os existentes.

### Orientação para IA e desenvolvedores

> **Ao criar módulos, formulários e layouts para uma app, siga rigorosamente a documentação e as necessidades daquela aplicação. Se a documentação pedir 5 formulários, crie 5, cada um com todos os campos e comportamentos necessários. Adapte os layouts e componentes para garantir que nada fique faltando, mesmo que precise criar novos componentes ou ajustar os existentes.**

---

## Padrão de Nomenclatura para Componentes Compartilhados

Para garantir clareza, escalabilidade e fácil manutenção, **todos os componentes compartilhados devem ter nomes descritivos**. Isso facilita a identificação e o reuso em toda a aplicação, sem a necessidade de prefixos como `shared-`.

### Exemplos de Nomes Recomendados
- `dynamic-form` (formulário dinâmico reutilizável)
- `data-table` (tabela de dados reutilizável)
- `page-header` (header de página reutilizável)
- `confirm-dialog` (diálogo de confirmação reutilizável)
- `status-chip` (chip de status reutilizável)
- `tag-badge` (badge de tag reutilizável)
- `pagination` (componente de paginação reutilizável)
- `breadcrumbs` (breadcrumbs reutilizáveis)

### Como usar nos exemplos e templates
- Sempre utilize nomes descritivos ao criar, importar ou referenciar componentes compartilhados.
- Exemplo de uso em template:
  ```html
  <page-header [title]="'Escolas'" ...></page-header>
  <data-table [data]="schools" ...></data-table>
  <dynamic-form [formFields]="schoolFormFields" ...></dynamic-form>
  ```

### Atualize componentes existentes
- Se houver componentes compartilhados com nomes genéricos ou pouco descritivos, renomeie para um nome descritivo e consistente.
- Mantenha a consistência em toda a base de código e documentação.

### Orientação
- Sempre prefira nomes descritivos e padronizados para facilitar o entendimento e a manutenção do projeto.
- Atualize este README e os exemplos sempre que um novo padrão de nomenclatura for adotado.

---

## Componentes UI do Fuse

Os componentes UI do Fuse, localizados em `src/@fuse/components`, são altamente modulares, reutilizáveis e prontos para uso em qualquer parte da aplicação. Cada componente segue o padrão Angular: arquivos `.ts` (lógica), `.html` (template) e `.scss` (estilo). A importação é facilitada por arquivos `public-api.ts` e `index.ts` em cada componente.

### Mapa dos Componentes

| Componente    | Arquivos principais                                                                                 |
|---------------|----------------------------------------------------------------------------------------------------|
| **alert**     | alert.component.ts, alert.component.html, alert.component.scss, alert.service.ts, alert.types.ts    |
| **card**      | card.component.ts, card.component.html, card.component.scss, card.types.ts                          |
| **drawer**    | drawer.component.ts, drawer.component.html, drawer.component.scss, drawer.service.ts, drawer.types.ts|
| **fullscreen**| fullscreen.component.ts, fullscreen.component.html                                                  |
| **highlight** | highlight.component.ts, highlight.component.html, highlight.component.scss, highlight.service.ts     |
| **loading-bar**| loading-bar.component.ts, loading-bar.component.html, loading-bar.component.scss                   |
| **masonry**   | masonry.component.ts, masonry.component.html                                                        |
| **navigation**| navigation.service.ts, navigation.types.ts, vertical/, horizontal/                                  |

#### Componentes de Navegação

- **navigation/vertical**
  - vertical.component.ts/html/scss
  - styles/appearances: default.scss, compact.scss, dense.scss, thin.scss
  - Subcomponentes: spacer, group, collapsable, divider, basic, aside
- **navigation/horizontal**
  - horizontal.component.ts/html/scss
  - Subcomponentes: divider, spacer, branch, basic

### Como usar

- **Importação modular:** Todos os componentes possuem `public-api.ts` e `index.ts` para facilitar a importação em outros módulos Angular.
- **Customização:** Os componentes de navegação são altamente modulares, com subcomponentes para diferentes tipos de itens (básico, colapsável, grupo, divisor, etc) e estilos customizáveis via SCSS.
- **Padrão Angular:** Todos os componentes seguem o padrão Angular (arquivos `.ts`, `.html`, `.scss`).

#### Exemplo de Importação

```typescript
// Exemplo: importando o AlertModule do Fuse
import { FuseAlertModule } from '@fuse/components/alert';
```

### Quer detalhes de algum componente?

Se precisar de:
- Propriedades/inputs de um componente específico
- Métodos públicos
- Exemplos de uso em template
- Como customizar estilos

**É só pedir o nome do componente que trago o detalhamento!** 

--- 

---

## Regra de Ouro: Evite Duplicidade de /api nas URLs de API

### Problema
Ao integrar o frontend Angular com um backend (ex: Laravel), é comum definir o prefixo `/api` na baseURL do `environment.ts`. Se você concatenar manualmente `/api/` nos endpoints dos serviços, a URL final ficará duplicada (ex: `/api/api/v1/schools`), causando erros 404, CORS e falha de integração.

### Como evitar e resolver
- **Nunca concatene manualmente `/api/` nos endpoints dos serviços Angular.**
- **Sempre use apenas o endpoint relativo** (ex: `'v1/schools'`, `'auth/login'`, `'config/feature-flags'`).
- **O prefixo `/api` deve ser definido apenas no `environment.ts`** (ex: `root: 'http://127.0.0.1:8000/api'`).

#### Exemplo correto:
```typescript
this.http.get(`${environment.apiURL.root}/v1/schools`)
// OU, se usar um utilitário:
this.http.get('v1/schools')
```

#### Exemplo errado:
```typescript
this.http.get(`${environment.apiURL.root}/api/v1/schools`) // ERRADO!
this.http.get('/api/v1/schools') // ERRADO!
```

### Resumo para prompts de geração de módulos
> Ao gerar módulos Angular, garanta que todos os endpoints de API sejam relativos (ex: 'v1/schools', 'auth/login'). O prefixo /api deve ser definido apenas no environment. Nunca adicione /api/ manualmente nos serviços.

**Siga esta regra em todos os novos módulos e aplicações para evitar erros de integração!**

--- 

---

## Principais Problemas Encontrados e Como Evitar

### 1. Duplicidade de /api nas URLs
- **Descrição:** Concatenar /api/ manualmente nos serviços, resultando em URLs como /api/api/v1/schools.
- **Como evitar:** Só defina /api no environment.ts. Use endpoints relativos nos serviços.

### 2. Endpoints inconsistentes entre frontend e backend
- **Descrição:** O frontend chamando /v1/schools enquanto o backend só responde em /api/v1/schools.
- **Como evitar:** Sempre alinhe o path base do environment com o backend. Teste manualmente a URL no navegador.

### 3. CORS Policy Error
- **Descrição:** O backend não retorna headers CORS para rotas inválidas (ex: /v1/schools), resultando em erro de CORS.
- **Como evitar:** Garanta que o frontend sempre chama o endpoint correto do backend.

### 4. Imports e Rotas Standalone
- **Descrição:** Usar loadComponent para componentes que não são standalone, ou loadChildren para arquivos de rota com export default errado.
- **Como evitar:**
  - Use loadComponent só para componentes standalone.
  - Use loadChildren para módulos de rota, e sempre exporte o array de rotas como export default.

### 5. Nomenclatura inconsistente de arquivos de rota
- **Descrição:** Usar schools.routing.ts em vez de schools.routes.ts, causando confusão e erros de import.
- **Como evitar:**
  - Siga o padrão Angular: nome.routes.ts (ex: schools.routes.ts).
  - Alinhe o nome do arquivo com o path da rota.

### 6. routerLink e path inconsistentes
- **Descrição:** O menu aponta para /schools, mas a rota é /escolas, ou vice-versa.
- **Como evitar:** Sempre alinhe o path do menu, do routerLink e do arquivo de rotas.

### 7. Guards: uso de function guard vs. class guard
- **Descrição:** Usar CanDeactivateGuard (classe) quando o Angular espera canDeactivateGuard (função).
- **Como evitar:** Use sempre function guards (canDeactivateGuard) e importe do local correto.

### 8. Faltam interfaces/types no frontend
- **Descrição:** Tipos como School, Student, TransportRoute etc. não definidos, causando erros de compilação.
- **Como evitar:** Gere todas as interfaces/types do backend no frontend, especialmente para relacionamentos.

### 9. Componentes compartilhados não utilizados
- **Descrição:** Não usar componentes como page-header, data-table, pagination, resultando em UI inconsistente.
- **Como evitar:** Sempre utilize os shared components para header, tabela, paginação, status, etc.

### 10. Botão de criar item não navega
- **Descrição:** Botão "New School" sem ação ou com rota errada.
- **Como evitar:** Implemente (click) ou action no header para navegar para /schools/create (ou path correto).

---

### Resumo para prompts de geração de módulos
> - Nunca concatene /api/ manualmente nos serviços.
> - Garanta que todos os endpoints são relativos ao root do environment.
> - Alinhe paths, nomes de arquivos de rota e routerLink.
> - Use function guards, não classes.
> - Implemente e use todos os shared components.
> - Gere todas as interfaces/types do backend no frontend.
> - Implemente navegação correta para criar, editar, visualizar.
> - Siga o padrão Angular para nomes de arquivos de rota (nome.routes.ts).

**Siga essas práticas para evitar erros comuns e garantir qualidade e consistência em todos os módulos e aplicações Angular!**

--- 

---

## Criação de Componentes em modules/components/

- **Sempre crie os componentes `list` e `detail` como padrão** dentro de `modules/<context>/<modulo>/`.
- **Se a documentação exigir, crie outros componentes** (ex: `form`, `documents`, `enrollment-history`, etc.), cada um em sua própria subpasta, com seu `.ts` e `.html`.
- **Cada componente deve implementar o padrão de consumo de API:**
  - Use `.subscribe()` e `.pipe(map(...))` para tratar os dados recebidos.
  - Sempre use `this._changeDetectorRef.markForCheck();` após atualizar os dados para garantir a renderização correta.

### Exemplo de Consumo de API em Componentes
```typescript
this._schoolService.items$
  .pipe(takeUntil(this._unsubscribeAll))
  .subscribe((data) => {
    this.schools = data.map(school => ({
      id: school.id,
      name: school.name,
      // ...outros campos
    }));
    this._changeDetectorRef.markForCheck();
  });

private _loadSchools() {
  this._schoolService.get({itemKey: 'school'})
    .pipe(takeUntil(this._unsubscribeAll))
    .subscribe((data) => {
      this.schools = data.map((school) => ({
        id: school.id,
        name: school.name,
        // ...outros campos
      }));
      this._changeDetectorRef.markForCheck();
    });
}
```
- **O uso de `this._changeDetectorRef.markForCheck();` é obrigatório após atualização de dados.**

### Exemplo de Imports e Estrutura de Componentes
```typescript
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { SchoolService } from '../shared/schools.service';
import { School, SchoolStatus, SchoolType } from '../shared/schools.types';
import { PageHeaderComponent } from 'app/shared/components/layout/page-header/page-header.component';
import { DataTableComponent, TableColumn, TableAction } from 'app/shared/components/data/table/data-table.component';
import { PaginationComponent } from 'app/shared/components/ui/pagination/pagination.component';
import { NotificationService } from 'app/shared/components/feedback/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';
```
- **Sempre importe e utilize os shared components (page-header, data-table, pagination, etc.).**
- **Siga o padrão correto de rotas e imports:**
  - Use `import { ... } from '.../schools.routes';` para arquivos de rota.
  - O nome do arquivo de rota deve ser `<modulo>.routes.ts` e alinhar com o path da rota.

---

## Processo de Desenvolvimento Frontend

### 1. **Análise do Backend**
- Ler e compreender a estrutura do backend (models, migrations, seeds)
- Identificar módulos principais e relacionamentos
- Mapear estrutura de banco de dados
- Gerar relatório completo da análise

### 2. **Design da Estrutura**
- Desenhar estrutura de pastas e arquivos por completo para cada módulo
- Definir componentes necessários (list, detail, form, etc.)
- Mapear rotas e navegação
- Documentar interfaces e tipos necessários

### 3. **Desenho da Estrutura**
- **Analisar backend** para identificar módulos principais
- **Desenhar estrutura completa** de pastas e arquivos
- **Identificar componentes necessários** (list, detail, form, etc.)
- **Documentar estrutura** para criação manual

### 4. **Criação Manual da Estrutura**
- **Criar manualmente** a estrutura baseada no desenho
- **Adicionar módulos** em `src/app/modules/admin`
- **Seguir padrões** de nomenclatura e organização
- **Preparar estrutura** para implementação de código

### 5. **Desenvolvimento Passo a Passo**
- **Aguardar instruções** específicas para cada módulo
- **Implementar código** de forma incremental
- **Não gastar memória** com implementações desnecessárias
- **Focar em um módulo** por vez
- **Seguir padrões** estabelecidos no README

---

## Padrões de Desenvolvimento - Regras Completas

### **1. ESTRUTURA DE MÓDULOS**
- **Shell Component obrigatório** com `router-outlet` no template
- **Pasta `shared/` obrigatória** dentro de cada módulo
- **Componentes padrão**: `list`, `detail`, `form` (conforme necessidade)
- **Nomenclatura consistente**: `modulo.component.ts`, `modulo.routes.ts`

### **2. ARQUIVOS SHARED OBRIGATÓRIOS**
- `modulo.service.ts` - Serviço principal do módulo
- `modulo.types.ts` - Interfaces e tipos TypeScript
- `modulo.constants.ts` - Constantes e configurações
- `modulo.validators.ts` - Validadores específicos
- `modulo.helpers.ts` - Funções auxiliares

### **3. ROTAS E NAVEGAÇÃO**
- **Arquivo de rota**: `modulo.routes.ts` (não `modulo.routing.ts`)
- **Lazy loading**: Use `loadComponent` para componentes standalone
- **Paths consistentes**: Alinhe menu, routerLink e arquivo de rotas
- **Function guards**: Use `canActivateGuard` (não class guards)

### **4. CONSUMO DE API**
- **Endpoints relativos**: Nunca concatene `/api/` manualmente
- **Base URL**: Defina apenas no `environment.ts`
- **Tipagem forte**: Use interfaces TypeScript para todos os dados
- **Change detection**: Sempre use `markForCheck()` após atualizações

### **5. COMPONENTES COMPARTILHADOS**
- **Uso obrigatório**: page-header, data-table, pagination, etc.
- **Nomenclatura descritiva**: `data-table`, `page-header`, `dynamic-form`
- **Reutilização máxima**: Procure primeiro no shared antes de criar novo
- **Manutenção centralizada**: Corrija bugs no componente compartilhado

### **6. IMPORTS E DEPENDÊNCIAS**
- **CommonModule**: Para diretivas básicas (ngIf, ngFor)
- **FormsModule**: Para formulários reativos
- **Shared components**: Importe sempre que necessário
- **RxJS operators**: Use `map`, `takeUntil`, `pipe` adequadamente

### **7. TEMPLATES E LAYOUT**
- **Tailwind CSS**: Prefira sobre SCSS separado
- **Responsividade**: Use classes Tailwind para mobile-first
- **Acessibilidade**: Implemente ARIA labels e navegação por teclado
- **Consistência visual**: Siga padrões do Fuse

### **8. VALIDAÇÃO E FORMULÁRIOS**
- **Validadores customizados**: Crie em `modulo.validators.ts`
- **Formulários reativos**: Use ReactiveFormsModule
- **Validação em tempo real**: Implemente feedback visual
- **Mensagens de erro**: Use componentes de feedback compartilhados

### **9. ESTADO E DADOS**
- **Observables**: Use para dados assíncronos
- **Unsubscribe**: Implemente `takeUntil` para evitar memory leaks
- **Loading states**: Use componentes de loading compartilhados
- **Error handling**: Implemente tratamento de erros consistente

### **10. TESTES E QUALIDADE**
- **Unit tests**: Para serviços e componentes críticos
- **Integration tests**: Para fluxos principais
- **Linting**: Siga regras do ESLint e Prettier
- **Type safety**: Use TypeScript strict mode

### **11. PERFORMANCE**
- **Lazy loading**: Para módulos e componentes
- **OnPush strategy**: Para componentes que não mudam frequentemente
- **TrackBy functions**: Para listas grandes
- **Virtual scrolling**: Para listas muito grandes

### **12. SEGURANÇA**
- **Guards**: Implemente autenticação e autorização
- **Sanitização**: Para dados do usuário
- **HTTPS**: Em produção
- **CORS**: Configure adequadamente

---

## Conclusão

A pasta `shared/components` é o coração da reutilização e padronização visual/funcional de qualquer aplicação frontend. Use, evolua e mantenha os componentes aqui para garantir produtividade, consistência e facilidade de manutenção em todo o projeto.

Siga rigorosamente os padrões estabelecidos neste README para criar módulos escaláveis, reutilizáveis e de fácil manutenção, sempre adaptando às necessidades específicas de cada aplicação.

---