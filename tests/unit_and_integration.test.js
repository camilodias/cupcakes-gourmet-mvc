const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// --- Setup ---
process.env.DB_PATH = ':memory:';

const { getDatabase } = require('../src/config/database');
const CupcakeModel = require('../src/models/CupcakeModel');
const OrderModel = require('../src/models/OrderModel');
const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  getDatabase(true);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

// --- Testes Unitários: Model ---
describe('1. Testes Unitários — Camada Model (Vitrine, Combos e Frete)', () => {
  it('UT01: Deve carregar o catálogo inicial com 12 cupcakes gourmet (doces e salgados)', () => {
    const todos = CupcakeModel.listarTodos();
    assert.equal(todos.length, 12);
  });

  it('UT02: Deve filtrar corretamente os cupcakes Sem Glúten, Zero Lactose e Veganos', () => {
    const veganosSemGluten = CupcakeModel.listarTodos({
      sem_gluten: true,
      zero_lactose: true,
      vegano: true
    });
    assert.ok(veganosSemGluten.length >= 3);
    for (const item of veganosSemGluten) {
      assert.equal(item.sem_gluten, true);
      assert.equal(item.zero_lactose, true);
      assert.equal(item.vegano, true);
    }
  });

  it('UT03: Deve filtrar cupcakes Salgados Artesanais separadamente dos Doces', () => {
    const salgados = CupcakeModel.listarTodos({ tipo: 'SALGADO' });
    assert.equal(salgados.length, 3);
    assert.ok(salgados.every((c) => c.categoria_tipo === 'SALGADO'));
  });

  it('UT04: Deve calcular corretamente os descontos progressivos de Combos (10%, 15% e 20% OFF)', () => {
    const avulso = OrderModel.calcularComboDesconto(2, 30.0);
    assert.equal(avulso.percentual, 0);
    assert.equal(avulso.valorDesconto, 0);

    const combo4 = OrderModel.calcularComboDesconto(4, 60.0);
    assert.equal(combo4.percentual, 10);
    assert.equal(combo4.valorDesconto, 6.0);

    const combo8 = OrderModel.calcularComboDesconto(8, 120.0);
    assert.equal(combo8.percentual, 15);
    assert.equal(combo8.valorDesconto, 18.0);

    const combo12 = OrderModel.calcularComboDesconto(12, 200.0);
    assert.equal(combo12.percentual, 20);
    assert.equal(combo12.valorDesconto, 40.0);
  });

  it('UT05: Deve calcular o frete por CEP válido e rejeitar CEP inválido', () => {
    const freteSp = OrderModel.calcularFrete('ENTREGA', '01310-100', 50.0);
    assert.equal(freteSp.valorFrete, 8.9);
    assert.equal(freteSp.freteGratis, false);

    const freteGratis = OrderModel.calcularFrete('ENTREGA', '01310-100', 135.0);
    assert.equal(freteGratis.valorFrete, 0.0);
    assert.equal(freteGratis.freteGratis, true);

    assert.throws(
      () => OrderModel.calcularFrete('ENTREGA', '11111-111', 50.0),
      /CEP inválido/
    );
  });
});

// --- Testes de Integração: API ---
describe('2. Testes de Integração HTTP — Arquitetura MVC (Controllers & Rotas)', () => {
  it('IT01: GET /api/cupcakes deve retornar status 200 e lista filtrada por busca textual', async () => {
    const resp = await fetch(`${baseUrl}/api/cupcakes?busca=pistache`);
    assert.equal(resp.status, 200);
    const body = await resp.json();
    assert.equal(body.sucesso, true);
    assert.equal(body.dados.length, 1);
    assert.match(body.dados[0].nome, /Pistache/i);
  });

  it('IT02: POST /api/pedidos deve rejeitar pedido sem itens ou com dados inválidos (HTTP 400)', async () => {
    const resp = await fetch(`${baseUrl}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_nome: 'Cliente Teste',
        cliente_email: 'cliente@teste.com',
        cliente_telefone: '11900000000',
        itens: []
      })
    });
    assert.equal(resp.status, 400);
    const body = await resp.json();
    assert.equal(body.sucesso, false);
    assert.match(body.erro, /carrinho está vazio/i);
  });

  it('IT03: Fluxo E2E — Deve criar pedido via Pix com Embalagem de Presente Agendada e aprovar via Webhook', async () => {
    // Criação do pedido
    const respCriacao = await fetch(`${baseUrl}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_nome: 'Cliente Exemplo',
        cliente_email: 'cliente@exemplo.com',
        cliente_telefone: '11900000001',
        tipo_entrega: 'ENTREGA',
        cep: '01310-100',
        endereco_completo: 'Av. Paulista, 1578 - Bela Vista, São Paulo/SP',
        embalagem_id: 2,
        agendamento_data: '2026-11-20',
        agendamento_periodo: 'Tarde (13h às 17h)',
        mensagem_presente: 'Parabéns pela comemoração!',
        metodo_pagamento: 'PIX',
        itens: [
          { cupcake_id: 1, quantidade: 2 },
          { cupcake_id: 3, quantidade: 2 }
        ]
      })
    });

    assert.equal(respCriacao.status, 201);
    const criacaoBody = await respCriacao.json();
    assert.equal(criacaoBody.sucesso, true);

    const pedido = criacaoBody.dados;
    assert.equal(pedido.quantidade_total, 4);
    assert.equal(pedido.percentual_desconto_combo, 10);
    assert.equal(pedido.status_pagamento, 'AGUARDANDO_PAGAMENTO');
    assert.ok(pedido.pix_copia_e_cola.includes('BR.GOV.BCB.PIX'));

    // Webhook Pix aprovado
    const respWebhook = await fetch(`${baseUrl}/api/webhooks/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo_pedido: pedido.codigo_pedido,
        acao: 'APROVAR'
      })
    });

    assert.equal(respWebhook.status, 200);
    const webhookBody = await respWebhook.json();
    assert.equal(webhookBody.dados.status_pagamento, 'APROVADO');
    assert.equal(webhookBody.dados.status_entrega, 'EM_PREPARO_E_SELAGEM');

    // Avanço de etapa logística
    const respAvanco = await fetch(`${baseUrl}/api/pedidos/${pedido.codigo_pedido}/avancar-entrega`, {
      method: 'POST'
    });
    assert.equal(respAvanco.status, 200);
    const avancoBody = await respAvanco.json();
    assert.equal(avancoBody.dados.status_entrega, 'EM_ROTA_DE_ENTREGA');
  });

  it('IT04: Webhook Pix Sandbox — Deve registrar pagamento Pix RECUSADO quando acao for RECUSAR', async () => {
    const respCriacao = await fetch(`${baseUrl}/api/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_nome: 'Cliente Recusa',
        cliente_email: 'recusa@exemplo.com',
        cliente_telefone: '11900000002',
        tipo_entrega: 'RETIRADA',
        embalagem_id: 1,
        metodo_pagamento: 'PIX',
        itens: [{ cupcake_id: 2, quantidade: 1 }]
      })
    });

    assert.equal(respCriacao.status, 201);
    const criacaoBody = await respCriacao.json();
    const pedido = criacaoBody.dados;

    const respWebhook = await fetch(`${baseUrl}/api/webhooks/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo_pedido: pedido.codigo_pedido,
        acao: 'RECUSAR'
      })
    });

    assert.equal(respWebhook.status, 200);
    const webhookBody = await respWebhook.json();
    assert.equal(webhookBody.sucesso, true);
    assert.equal(webhookBody.dados.status_pagamento, 'RECUSADO');
    assert.equal(webhookBody.dados.status_entrega, 'PEDIDO_RECEBIDO');
  });
});
