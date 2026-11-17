# 🧁 Cupcakes Gourmet — Sistema de E-Commerce (Padrão MVC)

**Demonstração Online (Render):** https://cupcakes-gourmet-mvc.onrender.com/

---

## 📌 Visão Geral do Projeto

O **Cupcakes Gourmet** é uma aplicação web *Mobile-First* de comércio eletrônico desenvolvida no **Modo Tradicional** utilizando o padrão arquitetural **MVC (Model-View-Controller)** em **Node.js + Express** com banco de dados relacional **SQLite (SQL 3FN)**.

A app implementa o todo o planejamento ágil iniciado no PIT I, entregando os quatro pilares essenciais do negócio:
1. **Vitrine Virtual Inclusiva:** Catálogo colorido com opções doces e salgadas, 3 tamanhos (*Mini 45g*, *Tradicional 90g*, *Gourmet Duplo 130g*), filtros para restrições alimentares (`Sem Glúten`, `Zero Lactose`, `Zero Açúcar`, `100% Vegano`), lista de favoritos (`♥`) e transparência de ingredientes/alérgenos.
2. **Pedido Eletrônico & Combos Inteligentes:** Adição rápida à sacola e motor de descontos progressivos automáticos (**10% OFF** para 4+ unidades, **15% OFF** para 8+ unidades e **20% OFF** para 12+ unidades).
3. **Conservação Anti-Transpiração & Embalagens de Presente:** Embalagem padrão com película protetora individual (evitando transpiração e ressecamento) e opções de **Caixa Rígida Presente Gourmet** com agendamento de data/horário e cartão de dedicatória.
4. **Pagamento Multimétodo, Webhook Pix & Logística:** Cálculo dinâmico de frete por CEP (ou Retirada Grátis na loja em 25 min), pagamento via **Pix Instantâneo** (com geração de código Copia-e-Cola e conciliação automática por Webhook bancário), Cartão de Crédito/Débito, Apple Pay e Google Pay, além de rastreamento em tempo real das 4 etapas de entrega.

---

## 📂 Estrutura do Projeto

```text
cupcakes-gourmet-mvc/
├── database/
│   ├── schema.sql                    # DDL das 5 tabelas normalizadas em 3FN
│   └── seed.sql                      # Carga inicial de 12 cupcakes e 3 embalagens
├── docs/
│   ├── documentacao-tecnica.md       # Backlog, arquitetura MVC, IHC e dicionário de dados
│   ├── Diagramas_Cupcakes_Gourmet_MVC.pdf     # Diagramas UML, máquina de estados e DER
│   ├── Diagramas_Cupcakes_Gourmet_MVC.drawio  # Arquivo fonte editável (Draw.io)
│   ├── diagramas/                    # Imagens individuais dos 5 diagramas
│   └── evidencias/                   # Prints do fluxo completo validado
├── public/
│   ├── css/styles.css                # Estilos complementares
│   ├── images/                       # Fotos dos 12 cupcakes e 2 banners da loja
│   └── js/app.js                     # Lógica da interface SPA, filtros, sacola e Sandbox
├── src/
│   ├── app.js                        # Configuração Express e middlewares
│   ├── server.js                     # Inicialização do servidor HTTP
│   ├── config/database.js            # Conexão SQLite (node:sqlite) e auto-seed
│   ├── controllers/                  # Controladores MVC (CupcakeController, OrderController)
│   ├── models/                       # Modelos e regras de negócio (CupcakeModel, OrderModel)
│   ├── routes/index.js               # Rotas das páginas e endpoints da API REST
│   └── views/index.html              # Interface Mobile-First em 4 telas
└── tests/
    └── unit_and_integration.test.js  # Suíte de 9 testes (unitários e integração E2E)
```

---

## 🚀 Como Executar o Projeto Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor MVC (cria e popula o banco SQLite automaticamente)
npm start

# 3. Acessar no navegador
# http://localhost:3000
```

### Executar a Bateria de Testes Automatizados
```bash
npm test
```
