# Documentação Técnica — Cupcakes Gourmet E-Commerce (MVC)

Especificação técnica consolidada do projeto **Cupcakes Gourmet**: backlog ágil, modelagem UML/MVC, arquitetura de telas (IHC), Design System *Atelier Gourmet* e dicionário de dados relacional (SQLite 3FN).

---

## 1. Escopo e Backlog do Produto

### 1.1. Visão Geral
A aplicação web *Mobile-First* implementa os quatro pilares do e-commerce definidos no planejamento ágil:
1. **Vitrine Virtual Inclusiva:** Catálogo com opções doces e salgadas, 3 porções (*Mini 45g*, *Tradicional 90g*, *Gourmet Duplo 130g*), filtros combináveis para restrições alimentares (`Sem Glúten`, `Zero Lactose`, `Zero Açúcar`, `Vegano`), lista de favoritos persistente e transparência direta de ingredientes e alérgenos.
2. **Pedido Eletrônico & Combos:** Adição rápida sem sair da vitrine e cálculo automático de descontos progressivos: **10% OFF** (`4+` un.), **15% OFF** (`8+` un.) e **20% OFF** (`12+` un.), além de **Revisão Detalhada do Pedido** antes da confirmação.
3. **Conservação Anti-Transpiração & Presentes:** Acondicionamento padrão incluso com película protetora individual, além de embalagens rígidas/térmicas para presente com agendamento de data, turno e dedicatória personalizada.
4. **Pagamento Multimétodo & Logística:** Simulador *Gateway Virtual Sandbox* para aprovação/recusa (Pix com QR Code e Copia-e-Cola via Webhook, Cartão de Crédito/Débito, Apple Pay e Google Pay), cálculo dinâmico de frete por CEP (isento acima de `R$ 120,00`), retirada na loja e acompanhamento em 4 estágios.

### 1.2. Histórias de Usuário (`US01`–`US12`)

| ID | Pilar | História de Usuário | Implementação no Sistema |
| :--- | :--- | :--- | :--- |
| **US01** | Vitrine Virtual | Visualizar cupcakes com foto, sabor, ingredientes, alérgenos, tamanho e preço | Grid em `src/views/index.html`, alerta de alérgenos nos cards e modal de detalhes |
| **US02** | Pedido Eletrônico | Comprar por unidade ou em combos progressivos | `OrderModel.calcularComboDesconto` (10%, 15% e 20% OFF automático) |
| **US03** | Pagamento | Pagar via Pix, Cartão de Crédito/Débito, Apple Pay ou Google Pay | Seletor na etapa `/pagamento`, payload Pix EMV e Webhook `POST /api/webhooks/pix` |
| **US04** | Entrega | Receber bem embalados, calcular frete por CEP ou retirar na loja | Embalagem `EMB_PADRAO_SELADA` + `OrderModel.calcularFrete` (`POST /api/frete/calcular`) |
| **US05** | Pedido Eletrônico | Escolher embalagens personalizadas para presente | Tabela `embalagens` selecionável em `/sacola` |
| **US06** | Entrega | Agendar entrega de presente com mensagem personalizada | Campos `agendamento_data`, `agendamento_periodo` e `mensagem_presente` em `pedidos` |
| **US07** | Vitrine Virtual | Visualizar destaques, mais vendidos e ofertas com preço riscado | Abas `Destaques & Novidades`, `Mais Vendidos` e selo `Oferta` nos cards |
| **US08** | Vitrine Virtual | Filtrar por tipo (Doce/Salgado) e restrições dietéticas | Chips combináveis em `GET /api/cupcakes` e filtro instantâneo em memória |
| **US09** | Pedido Eletrônico | Acompanhar progresso até o próximo nível de desconto de combo | Barra visual `#barra-progresso-combo` no topo da sacola |
| **US10** | Vitrine Virtual | Adicionar ao carrinho rapidamente sem sair da vitrine | Seletor `-/+` e botão `Adicionar` direto em cada card com notificação *Toast* |
| **US11** | Pedido Eletrônico | Gerenciar lista de favoritos (`♥`) e filtrar por preferidos | Persistência em `localStorage`, ícone de favorito nos cards e filtros dedicados |
| **US12** | Entrega | Acompanhar o status do pedido após a confirmação | Painel `/pedidos` com linha do tempo em 4 estágios e avanço logístico |

> **Revisão Detalhada do Pedido:** Antes da finalização em `/pagamento`, o painel `Revisão Detalhada do Pedido` consolida todos os sabores, endereço/retirada, embalagem agendada e valores para evitar erros de compra.

### 1.3. Tarefas Técnicas (`TK01`–`TK15`)

| Código | Tarefa Técnica | Artefatos no Repositório |
| :--- | :--- | :--- |
| **TK01** | Estrutura MVC em Node.js + Express + SQLite | `package.json`, `src/app.js`, `src/config/database.js` |
| **TK02** | Grid de catálogo com tags dietéticas coloridas | `src/views/index.html`, `public/css/styles.css`, `public/js/app.js` |
| **TK03** | Scripts de criação e carga inicial do catálogo | `database/schema.sql`, `database/seed.sql` |
| **TK04** | API REST e filtros dinâmicos de cupcakes | `src/models/CupcakeModel.js`, `src/controllers/CupcakeController.js` |
| **TK05** | Interface da sacola (`+/-`, remover, esvaziar, resumo) | `#tela-sacola` em `src/views/index.html`, `renderizarCarrinhoUI()` |
| **TK06** | Gerenciamento de estado global no front-end | Objeto `AppState` e `localStorage` em `public/js/app.js` |
| **TK07** | Persistência transacional de pedidos no banco | `OrderModel.criarPedido()`, `POST /api/pedidos` |
| **TK08** | Cálculo de subtotal, combos, embalagem, frete e total | `OrderModel.simularOrcamento()`, `POST /api/carrinho/orcamento` |
| **TK09** | Tela de checkout com dados do cliente e pagamento | `#tela-pagamento` em `src/views/index.html` |
| **TK10** | Geração de payload Pix Copia-e-Cola | Geração EMV Pix em `OrderModel.criarPedido()` e QR Code SVG no Sandbox |
| **TK11** | Rota de Webhook para conciliação de pagamento | `OrderController.receberWebhookPix()`, `POST /api/webhooks/pix` |
| **TK12** | Testes automatizados de aprovação e recusa (Sandbox) | `tests/unit_and_integration.test.js` (`IT03` e `IT04`) e `#modal-sandbox-pagamento` |
| **TK13** | Seletor Entrega (com CEP) ou Retirada na Loja | Bloco `#bloco-cep-entrega` / `#bloco-info-retirada` na Sacola |
| **TK14** | Cálculo dinâmico de frete por CEP com isenção > R$ 120 | `OrderModel.calcularFrete()`, `POST /api/frete/calcular` |
| **TK15** | Modelagem física de pedidos, itens e embalagens | `database/schema.sql` (`pedidos`, `itens_pedido`, `embalagens`) |

---

## 2. Arquitetura MVC e Diagramas UML

Os diagramas completos encontram-se compilados em **[`docs/Diagramas_Cupcakes_Gourmet_MVC.pdf`](./Diagramas_Cupcakes_Gourmet_MVC.pdf)** (fonte editável em [`Diagramas_Cupcakes_Gourmet_MVC.drawio`](./Diagramas_Cupcakes_Gourmet_MVC.drawio) e imagens individuais em [`docs/diagramas/`](./diagramas/)):

1. **[Casos de Uso UML](./diagramas/01-casos-de-uso-uml.png):** Atores (*Cliente*, *Atendente/Expedição*, *Gateway Bancário*) e casos de uso `UC01`–`UC09`.
2. **[Diagrama de Classes MVC](./diagramas/02-diagrama-classes-mvc.png):** Separação entre `View` (`index.html` / `app.js`), `Controllers` (`CupcakeController`, `OrderController`), `Models` (`CupcakeModel`, `OrderModel`), `DatabaseSync` e entidades.
3. **[Diagrama de Sequência](./diagramas/03-diagrama-sequencia-checkout-pix.png):** Fluxo ponta a ponta de orçamento (`/api/carrinho/orcamento`), persistência (`/api/pedidos`), abertura do *Gateway Virtual Sandbox* e confirmação por Webhook (`/api/webhooks/pix`).
4. **[Máquina de Estados](./diagramas/04-maquina-estados-pedido.png):** Estados financeiros (`AGUARDANDO_PAGAMENTO`, `APROVADO`, `RECUSADO`) e logísticos em 4 estágios (`PEDIDO_RECEBIDO` → `EM_PREPARO_E_SELAGEM` → `EM_ROTA_DE_ENTREGA`/`PRONTO_PARA_RETIRADA` → `ENTREGUE`).
5. **[DER Normalizado (3FN)](./diagramas/05-der-banco-sqlite-3fn.png):** Relacionamentos e chaves do banco relacional SQLite.

---

## 3. Interface (IHC), Fluxo de Telas e Design System

### 3.1. Arquitetura de Navegação (4 Telas Dedicadas)
A interface separa o fluxo de compra em quatro rotas sincronizadas via History API (`src/routes/index.js` e `public/js/app.js`):
- **`/` — Vitrine Principal (`Cardápio`):** Header com busca ampla e contador de favoritos/sacola, 2 banners destacados acima dos filtros (Combos Progressivos e Embalagem Anti-Transpiração), filtros combináveis e grid responsivo em 100% da largura.
- **`/sacola` — Sacola & Entrega:** Ajuste de quantidades, barra de progresso dos combos, seleção de embalagem (`Embalagem Padrão Individual`, `Caixa para Presente` ou `Caixa Térmica para Viagem/Eventos`, com campos condicionais de agendamento e dedicatória), cálculo de frete por CEP ou Retirar na Loja.
- **`/pagamento` — Checkout & Revisão Detalhada:** Dados do cliente (com preenchimento rápido para testes em homologação), seletor dos 5 meios de pagamento e **Revisão Detalhada do Pedido** antes de abrir o **Gateway Virtual Sandbox**.
- **`/pedidos` — Acompanhamento & Rastreamento:** Consulta por código (`CG-AAAA-XXXXXX`), reabertura do Sandbox para pagamentos pendentes/recusados, lista de pedidos recentes e linha do tempo de 4 estágios.

### 3.2. Tokens do Design System *Atelier Gourmet*
- **Cores principais:** Primária Carmim Framboesa (`#a72444`), Terciária Verde Sálvia (`#236537`), Superfície Creme Amanteigado (`#fcf9f4`), Cards Brancos (`#ffffff`) e Texto Cacau Profundo (`#1c1c19`).
- **Tipografia:** `Playfair Display` para títulos editoriais e preços; `Plus Jakarta Sans` para descrições, filtros, alérgenos e formulários.

### 3.3. Catálogo de Validações e Mensagens de Erro
| Código | Condição | Mensagem na Interface |
| :--- | :--- | :--- |
| **ERR-CEP-01** | CEP inválido ou dígitos repetidos (`11111-111`) | `CEP inválido. Informe um CEP válido contendo 8 dígitos numéricos (ex: 01310-100).` |
| **ERR-CART-01** | Submissão com carrinho vazio | `O carrinho está vazio. Adicione pelo menos 1 cupcake antes de finalizar o pedido.` |
| **ERR-CLI-01** | Nome ausente ou `< 3` caracteres | `O nome completo do cliente é obrigatório (mínimo de 3 caracteres).` |
| **ERR-CLI-02** | E-mail sem `@` | `Informe um endereço de e-mail válido para envio do comprovante.` |
| **ERR-CLI-03** | Telefone com menos de 8 dígitos | `Informe um telefone/WhatsApp válido para notificações da entrega.` |
| **ERR-END-01** | Entrega sem endereço completo | `Informe o endereço de entrega completo (Rua, número e complemento).` |
| **ERR-PED-404** | Código de pedido inexistente | `Pedido CG-XXXX não encontrado.` |

---

## 4. Banco de Dados Relacional (3FN) e Dicionário de Dados

O modelo físico está definido em [`database/schema.sql`](../database/schema.sql) e populado com 12 sabores e 3 embalagens em [`database/seed.sql`](../database/seed.sql), atendendo à 1FN, 2FN e 3FN:

- **`categorias`** (`id`, `nome`, `slug`, `tipo`, `descricao`)
- **`cupcakes`** (`id`, `categoria_id` FK, `nome`, `sabor`, `descricao`, `ingredientes`, `alergenos`, `tamanho`, `preco`, `preco_original`, `cor_tema`, `icone_emoji`, `imagem_svg`, `sem_gluten`, `zero_lactose`, `zero_acucar`, `vegano`, `destaque`, `mais_vendido`, `promocao`, `estoque`, `ativo`, `criado_em`)
- **`embalagens`** (`id`, `codigo`, `nome`, `descricao`, `protecao_antitranspiracao`, `eh_presente`, `permite_agendamento`, `preco_adicional`)
- **`pedidos`** (`id`, `codigo_pedido`, `cliente_nome`, `cliente_email`, `cliente_telefone`, `tipo_entrega`, `cep`, `endereco_completo`, `prazo_estimado`, `embalagem_id` FK, `agendamento_data`, `agendamento_periodo`, `mensagem_presente`, `metodo_pagamento`, `status_pagamento`, `status_entrega`, `quantidade_total`, `subtotal`, `percentual_desconto_combo`, `desconto_combo`, `valor_embalagem`, `valor_frete`, `valor_total`, `pix_copia_e_cola`, `criado_em`)
- **`itens_pedido`** (`id`, `pedido_id` FK, `cupcake_id` FK, `nome_cupcake`, `quantidade`, `preco_unitario`, `subtotal_item`)
