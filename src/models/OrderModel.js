const { getDatabase } = require('../config/database');
const CupcakeModel = require('./CupcakeModel');

class OrderModel {
  // --- Cálculo de Combos ---
  static calcularComboDesconto(quantidadeTotal, subtotal) {
    const qtd = Number(quantidadeTotal) || 0;
    const sub = Number(subtotal) || 0;

    let percentual = 0;
    let nomeCombo = 'Compra por Unidade';
    let proximoComboTexto = `Adicione mais ${Math.max(0, 4 - qtd)} cupcake(s) para ativar o Combo Degustação (10% OFF)!`;

    if (qtd >= 12) {
      percentual = 20;
      nomeCombo = 'Combo Festa Gourmet (12+ un. • 20% OFF)';
      proximoComboTexto = 'Parabéns! Você atingiu o desconto máximo de 20% OFF do Combo Festa!';
    } else if (qtd >= 8) {
      percentual = 15;
      nomeCombo = 'Combo Família Gourmet (8+ un. • 15% OFF)';
      proximoComboTexto = `Faltam apenas ${12 - qtd} cupcake(s) para o Combo Festa com 20% OFF!`;
    } else if (qtd >= 4) {
      percentual = 10;
      nomeCombo = 'Combo Degustação (4+ un. • 10% OFF)';
      proximoComboTexto = `Faltam apenas ${8 - qtd} cupcake(s) para o Combo Família com 15% OFF!`;
    }

    const valorDesconto = Number(((sub * percentual) / 100).toFixed(2));
    return {
      percentual,
      valorDesconto,
      nomeCombo,
      proximoComboTexto
    };
  }

  // --- Cálculo de Frete ---
  static calcularFrete(tipoEntrega, cep = '', subtotalLiquido = 0) {
    const modalidade = String(tipoEntrega || 'ENTREGA').toUpperCase();

    if (modalidade === 'RETIRADA') {
      return {
        valorFrete: 0.0,
        prazoEstimado: 'Retirada na Loja em 25 min',
        cepFormatado: 'Isento (Retirada)',
        regiao: 'Loja Cupcakes Gourmet — Av. Paulista, 1578 (SP)',
        freteGratis: true,
        enderecoSugerido: 'Retirada no Balcão — Loja Cupcakes Gourmet'
      };
    }

    const apenasDigitos = String(cep || '').replace(/\D/g, '');
    if (apenasDigitos.length !== 8 || /^(\d)\1{7}$/.test(apenasDigitos)) {
      const err = new Error('CEP inválido. Informe um CEP válido contendo 8 dígitos numéricos (ex: 01310-100).');
      err.statusCode = 400;
      throw err;
    }

    const cepFormatado = `${apenasDigitos.slice(0, 5)}-${apenasDigitos.slice(5)}`;
    const prefixo = Number(apenasDigitos[0]);

    let valorBase = 14.90;
    let prazoEstimado = 'Entrega em 50 a 70 min';
    let regiao = 'Região Metropolitana';
    let enderecoSugerido = `Entrega Expressa para a região do CEP ${cepFormatado}`;

    if (prefixo === 0) {
      valorBase = 8.90;
      prazoEstimado = 'Entrega Expressa em 30 a 45 min';
      regiao = 'São Paulo - Capital (Zona Central/Sul/Oeste)';
      enderecoSugerido = `Av. Paulista / Jardins — São Paulo/SP (${cepFormatado})`;
    } else if (prefixo === 1) {
      valorBase = 11.90;
      prazoEstimado = 'Entrega em 45 a 60 min';
      regiao = 'Grande São Paulo & Interior Paulista';
      enderecoSugerido = `Região Metropolitana de São Paulo/SP (${cepFormatado})`;
    } else if (prefixo === 2 || prefixo === 3) {
      valorBase = 13.90;
      prazoEstimado = 'Entrega em 50 a 75 min';
      regiao = 'Sudeste (RJ / MG / ES)';
      enderecoSugerido = `Centro Urbano Sudeste (${cepFormatado})`;
    }

    const freteGratis = Number(subtotalLiquido) >= 120;
    return {
      valorFrete: freteGratis ? 0.0 : valorBase,
      prazoEstimado,
      cepFormatado,
      regiao,
      freteGratis,
      enderecoSugerido
    };
  }

  // --- Orçamento ---
  static simularOrcamento(payload = {}) {
    const db = getDatabase();
    const itensInput = Array.isArray(payload.itens) ? payload.itens : [];
    let quantidadeTotal = 0;
    let subtotal = 0;

    const itensDetalhados = [];
    for (const item of itensInput) {
      const cupcake = CupcakeModel.buscarPorId(item.cupcake_id);
      const qtd = Math.max(0, Number(item.quantidade) || 0);
      if (cupcake && qtd > 0) {
        const subItem = Number((cupcake.preco * qtd).toFixed(2));
        quantidadeTotal += qtd;
        subtotal += subItem;
        itensDetalhados.push({
          cupcake_id: cupcake.id,
          nome: cupcake.nome,
          preco_unitario: cupcake.preco,
          quantidade: qtd,
          subtotal_item: subItem
        });
      }
    }

    subtotal = Number(subtotal.toFixed(2));
    const combo = OrderModel.calcularComboDesconto(quantidadeTotal, subtotal);
    const subtotalLiquido = Number((subtotal - combo.valorDesconto).toFixed(2));

    const embalagemId = Number(payload.embalagem_id) || 1;
    const embalagem = db.prepare('SELECT * FROM embalagens WHERE id = ?').get(embalagemId)
      || db.prepare('SELECT * FROM embalagens WHERE id = 1').get();
    const valorEmbalagem = quantidadeTotal > 0 ? Number(embalagem.preco_adicional) : 0;

    let freteInfo = {
      valorFrete: 0,
      prazoEstimado: 'Informe o CEP ou selecione Retirada',
      cepFormatado: '',
      regiao: '',
      freteGratis: false,
      enderecoSugerido: ''
    };

    if (quantidadeTotal > 0 && (payload.tipo_entrega === 'RETIRADA' || (payload.cep && String(payload.cep).replace(/\D/g, '').length === 8))) {
      freteInfo = OrderModel.calcularFrete(payload.tipo_entrega, payload.cep, subtotalLiquido);
    }

    const valorTotal = Number((subtotalLiquido + valorEmbalagem + freteInfo.valorFrete).toFixed(2));

    return {
      itens: itensDetalhados,
      quantidade_total: quantidadeTotal,
      subtotal,
      percentual_desconto_combo: combo.percentual,
      desconto_combo: combo.valorDesconto,
      nome_combo: combo.nomeCombo,
      proximo_combo_texto: combo.proximoComboTexto,
      embalagem: {
        id: embalagem.id,
        nome: embalagem.nome,
        preco_adicional: valorEmbalagem,
        eh_presente: Boolean(embalagem.eh_presente)
      },
      frete: freteInfo,
      valor_total: valorTotal
    };
  }

  // --- Criação de Pedido ---
  static criarPedido(dados = {}) {
    const db = getDatabase();

    // Validação
    const nome = String(dados.cliente_nome || '').trim();
    const email = String(dados.cliente_email || '').trim();
    const telefone = String(dados.cliente_telefone || '').trim();

    if (!nome || nome.length < 3) {
      const err = new Error('O nome completo do cliente é obrigatório (mínimo de 3 caracteres).');
      err.statusCode = 400;
      throw err;
    }

    if (!email || !email.includes('@')) {
      const err = new Error('Informe um endereço de e-mail válido para envio do comprovante.');
      err.statusCode = 400;
      throw err;
    }

    if (!telefone || telefone.replace(/\D/g, '').length < 8) {
      const err = new Error('Informe um telefone/WhatsApp válido para notificações da entrega.');
      err.statusCode = 400;
      throw err;
    }

    if (!Array.isArray(dados.itens) || dados.itens.length === 0) {
      const err = new Error('O carrinho está vazio. Adicione pelo menos 1 cupcake antes de finalizar o pedido.');
      err.statusCode = 400;
      throw err;
    }

    const tipoEntrega = String(dados.tipo_entrega || 'ENTREGA').toUpperCase();
    if (!['ENTREGA', 'RETIRADA'].includes(tipoEntrega)) {
      const err = new Error('Modalidade de entrega inválida. Escolha ENTREGA ou RETIRADA.');
      err.statusCode = 400;
      throw err;
    }

    const metodoPagamento = String(dados.metodo_pagamento || 'PIX').toUpperCase();
    const metodosValidos = ['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'APPLE_PAY', 'GOOGLE_PAY'];
    if (!metodosValidos.includes(metodoPagamento)) {
      const err = new Error('Método de pagamento inválido.');
      err.statusCode = 400;
      throw err;
    }

    // Orçamento
    const orcamento = OrderModel.simularOrcamento({
      itens: dados.itens,
      embalagem_id: dados.embalagem_id,
      tipo_entrega: tipoEntrega,
      cep: dados.cep
    });

    if (orcamento.quantidade_total === 0) {
      const err = new Error('Nenhum cupcake válido encontrado nos itens enviados.');
      err.statusCode = 400;
      throw err;
    }

    let enderecoCompleto = 'Retirada na Loja Cupcakes Gourmet — Av. Paulista, 1578 (SP)';
    let cepFormatado = null;

    if (tipoEntrega === 'ENTREGA') {
      const freteValidado = OrderModel.calcularFrete('ENTREGA', dados.cep, orcamento.subtotal - orcamento.desconto_combo);
      cepFormatado = freteValidado.cepFormatado;
      enderecoCompleto = String(dados.endereco_completo || '').trim() || freteValidado.enderecoSugerido;
      if (enderecoCompleto.length < 5) {
        const err = new Error('Informe o endereço de entrega completo (Rua, número e complemento).');
        err.statusCode = 400;
        throw err;
      }
    }

    const codigoPedido = `CG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const ehPix = metodoPagamento === 'PIX';
    const statusPagamento = 'AGUARDANDO_PAGAMENTO';
    const statusEntrega = 'PEDIDO_RECEBIDO';

    const pixCopiaECola = ehPix
      ? `00020126580014BR.GOV.BCB.PIX0136cupcakesgourmet@pagamentos.com.br520400005303986540${orcamento.valor_total.toFixed(2)}5802BR5920CUPCAKES GOURMET APP6009SAO PAULO62190515${codigoPedido}6304ABCD`
      : null;

    // Persistência
    db.exec('BEGIN TRANSACTION;');
    try {
      const insertPedidoStmt = db.prepare(`
        INSERT INTO pedidos (
          codigo_pedido, cliente_nome, cliente_email, cliente_telefone,
          tipo_entrega, cep, endereco_completo, prazo_estimado,
          embalagem_id, agendamento_data, agendamento_periodo, mensagem_presente,
          metodo_pagamento, status_pagamento, status_entrega,
          quantidade_total, subtotal, percentual_desconto_combo, desconto_combo,
          valor_embalagem, valor_frete, valor_total, pix_copia_e_cola
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertPedidoStmt.run(
        codigoPedido,
        nome,
        email,
        telefone,
        tipoEntrega,
        cepFormatado,
        enderecoCompleto,
        orcamento.frete.prazoEstimado,
        orcamento.embalagem.id,
        dados.agendamento_data || null,
        dados.agendamento_periodo || null,
        dados.mensagem_presente || null,
        metodoPagamento,
        statusPagamento,
        statusEntrega,
        orcamento.quantidade_total,
        orcamento.subtotal,
        orcamento.percentual_desconto_combo,
        orcamento.desconto_combo,
        orcamento.embalagem.preco_adicional,
        orcamento.frete.valorFrete,
        orcamento.valor_total,
        pixCopiaECola
      );

      const pedidoId = Number(result.lastInsertRowid);
      const insertItemStmt = db.prepare(`
        INSERT INTO itens_pedido (pedido_id, cupcake_id, nome_cupcake, quantidade, preco_unitario, subtotal_item)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of orcamento.itens) {
        insertItemStmt.run(
          pedidoId,
          item.cupcake_id,
          item.nome,
          item.quantidade,
          item.preco_unitario,
          item.subtotal_item
        );
      }

      db.exec('COMMIT;');
      return OrderModel.buscarPorCodigo(codigoPedido);
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }
  }

  // --- Consulta por Código ---
  static buscarPorCodigo(codigoPedido) {
    const db = getDatabase();
    const pedido = db.prepare(`
      SELECT p.*, e.nome AS embalagem_nome, e.descricao AS embalagem_descricao, e.eh_presente
      FROM pedidos p
      INNER JOIN embalagens e ON e.id = p.embalagem_id
      WHERE p.codigo_pedido = ?
    `).get(String(codigoPedido));

    if (!pedido) return null;

    const itens = db.prepare(`
      SELECT ip.*, c.icone_emoji, c.tamanho, c.cor_tema
      FROM itens_pedido ip
      LEFT JOIN cupcakes c ON c.id = ip.cupcake_id
      WHERE ip.pedido_id = ?
    `).all(pedido.id);

    return {
      ...pedido,
      subtotal: Number(pedido.subtotal),
      desconto_combo: Number(pedido.desconto_combo),
      valor_embalagem: Number(pedido.valor_embalagem),
      valor_frete: Number(pedido.valor_frete),
      valor_total: Number(pedido.valor_total),
      eh_presente: Boolean(pedido.eh_presente),
      itens: itens.map((i) => ({
        ...i,
        preco_unitario: Number(i.preco_unitario),
        subtotal_item: Number(i.subtotal_item)
      }))
    };
  }

  // --- Webhook Pix ---
  static processarWebhookPix(codigoPedido, acao = 'APROVAR') {
    const db = getDatabase();
    const pedido = OrderModel.buscarPorCodigo(codigoPedido);
    if (!pedido) {
      const err = new Error(`Pedido ${codigoPedido} não encontrado para conciliação de Webhook.`);
      err.statusCode = 404;
      throw err;
    }

    const aprovado = String(acao).toUpperCase() !== 'RECUSAR';
    const novoStatusPagamento = aprovado ? 'APROVADO' : 'RECUSADO';
    const novoStatusEntrega = aprovado ? 'EM_PREPARO_E_SELAGEM' : pedido.status_entrega;

    db.prepare(`
      UPDATE pedidos
      SET status_pagamento = ?, status_entrega = ?
      WHERE codigo_pedido = ?
    `).run(novoStatusPagamento, novoStatusEntrega, codigoPedido);

    return OrderModel.buscarPorCodigo(codigoPedido);
  }

  // --- Rastreamento ---
  static avancarEtapaEntrega(codigoPedido) {
    const db = getDatabase();
    const pedido = OrderModel.buscarPorCodigo(codigoPedido);
    if (!pedido) {
      const err = new Error(`Pedido ${codigoPedido} não encontrado.`);
      err.statusCode = 404;
      throw err;
    }

    const fluxoEntrega = [
      'PEDIDO_RECEBIDO',
      'EM_PREPARO_E_SELAGEM',
      pedido.tipo_entrega === 'RETIRADA' ? 'PRONTO_PARA_RETIRADA' : 'EM_ROTA_DE_ENTREGA',
      'ENTREGUE'
    ];

    const indiceAtual = fluxoEntrega.indexOf(pedido.status_entrega);
    const proximoStatus = indiceAtual >= 0 && indiceAtual < fluxoEntrega.length - 1
      ? fluxoEntrega[indiceAtual + 1]
      : 'ENTREGUE';

    db.prepare(`
      UPDATE pedidos
      SET status_entrega = ?, status_pagamento = 'APROVADO'
      WHERE codigo_pedido = ?
    `).run(proximoStatus, codigoPedido);

    return OrderModel.buscarPorCodigo(codigoPedido);
  }

  // --- Pedidos Recentes ---
  static listarRecentes() {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT p.codigo_pedido, p.cliente_nome, p.tipo_entrega, p.metodo_pagamento,
             p.status_pagamento, p.status_entrega, p.quantidade_total, p.valor_total, p.criado_em,
             e.nome AS embalagem_nome
      FROM pedidos p
      INNER JOIN embalagens e ON e.id = p.embalagem_id
      ORDER BY p.id DESC
      LIMIT 10
    `).all();

    return rows.map((r) => ({
      ...r,
      valor_total: Number(r.valor_total)
    }));
  }
}

module.exports = OrderModel;
