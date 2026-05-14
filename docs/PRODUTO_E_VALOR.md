# Produto e valor — Construvasco (frontend)

Este documento descreve **o que a aplicação web resolve** e **para quem**, com base nas capacidades expostas no frontend. A mensagem de marca e o posicionamento comercial finais devem ser validados pela equipa de negócio.

## Problema que a empresa tende a resolver

- **Digitalizar a relação com o cliente**: catálogo de projetos/serviços online, página de produto e checkout reduzem dependência exclusiva de canais informais (telefone, mensagens soltas).
- **Dar visibilidade ao cliente**: depois da compra ou do pedido, o cliente pode acompanhar estado e histórico na área **Conta** (pedidos, designs guardados, pagamentos, definições).
- **Orquestrar a operação interna**: o backoffice **Admin** concentra gestão de catálogo, pedidos (incluindo visão tipo kanban), designs, job cards (fluxo de trabalho) e equipa, alinhando vendas com execução.

## Públicos e necessidades

### Visitante (não autenticado)

- Descobrir oferta no site (home, listagens, detalhe por slug).
- Avançar para checkout ou contacto.
- Registar-se ou iniciar sessão quando o fluxo exige identidade.

### Cliente (autenticado, rota `/conta`)

- Ver resumo na dashboard.
- Consultar **pedidos** e evolução associada.
- Gerir conteúdos guardados (**designs**) quando aplicável ao negócio.
- Gerir **métodos de pagamento** e dados em **definições** (inclui alteração de palavra-passe com sessão ativa).

### Staff administrativo (autenticado, rota `/admin`)

- Manter **produtos** e **categorias** alinhados ao que o site mostra.
- Operar **pedidos** (criação, listagem, kanban) e **designs**.
- Acompanhar trabalho em **job cards** (produção/design).
- Gerir **staff** e definições do painel.

## Métricas de sucesso sugeridas (a afinar)

- Taxa de conversão visitante → pedido/checkout concluído.
- Tempo médio até primeiro login do cliente após pedido.
- Utilização da área Conta (pedidos consultados, designs guardados).
- Lead time interno: pedido criado → estados atualizados no admin/job cards.

## Relação com outros sistemas

O browser consome a **API Laravel**; este repositório não substitui regras de negócio nem persistência — apenas apresenta e orquestra chamadas HTTP. Ver [INTEGRACAO_API.md](INTEGRACAO_API.md).
