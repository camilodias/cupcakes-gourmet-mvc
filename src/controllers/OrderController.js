const OrderModel = require('../models/OrderModel');

class OrderController {
  // --- POST /api/frete/calcular ---
  static calcularFrete(req, res) {
    try {
      const { tipo_entrega, cep, subtotal_liquido } = req.body || {};
      const resultado = OrderModel.calcularFrete(tipo_entrega, cep, subtotal_liquido);
      return res.status(200).json({
        sucesso: true,
        dados: resultado
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({
        sucesso: false,
        erro: error.message || 'Erro ao calcular frete.'
      });
    }
  }

  // --- POST /api/carrinho/orcamento ---
  static simularOrcamento(req, res) {
    try {
      const orcamento = OrderModel.simularOrcamento(req.body || {});
      return res.status(200).json({
        sucesso: true,
        dados: orcamento
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({
        sucesso: false,
        erro: error.message || 'Erro ao simular orçamento do carrinho.'
      });
    }
  }

  // --- POST /api/pedidos ---
  static criarPedido(req, res) {
    try {
      const pedido = OrderModel.criarPedido(req.body || {});
      return res.status(201).json({
        sucesso: true,
        mensagem: 'Pedido realizado com sucesso!',
        dados: pedido
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({
        sucesso: false,
        erro: error.message || 'Erro ao processar a criação do pedido.'
      });
    }
  }

  // --- GET /api/pedidos ---
  static listarPedidos(req, res) {
    try {
      const pedidos = OrderModel.listarRecentes();
      return res.status(200).json({
        sucesso: true,
        total: pedidos.length,
        dados: pedidos
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao listar pedidos.',
        detalhes: error.message
      });
    }
  }

  // --- GET /api/pedidos/:codigo ---
  static obterPedidoPorCodigo(req, res) {
    try {
      const pedido = OrderModel.buscarPorCodigo(req.params.codigo);
      if (!pedido) {
        return res.status(404).json({
          sucesso: false,
          erro: `Pedido ${req.params.codigo} não encontrado.`
        });
      }
      return res.status(200).json({
        sucesso: true,
        dados: pedido
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao buscar o pedido.',
        detalhes: error.message
      });
    }
  }

  // --- POST /api/webhooks/pix ---
  static receberWebhookPix(req, res) {
    try {
      const { codigo_pedido, acao } = req.body || {};
      if (!codigo_pedido) {
        return res.status(400).json({
          sucesso: false,
          erro: 'O campo codigo_pedido é obrigatório no payload do Webhook Pix.'
        });
      }

      const pedidoAtualizado = OrderModel.processarWebhookPix(codigo_pedido, acao || 'APROVAR');
      return res.status(200).json({
        sucesso: true,
        mensagem: `Webhook Pix processado: pagamento ${pedidoAtualizado.status_pagamento}.`,
        dados: pedidoAtualizado
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({
        sucesso: false,
        erro: error.message || 'Erro ao processar Webhook Pix.'
      });
    }
  }

  // --- POST /api/pedidos/:codigo/avancar-entrega ---
  static avancarStatusEntrega(req, res) {
    try {
      const pedidoAtualizado = OrderModel.avancarEtapaEntrega(req.params.codigo);
      return res.status(200).json({
        sucesso: true,
        mensagem: `Status logístico atualizado para ${pedidoAtualizado.status_entrega}.`,
        dados: pedidoAtualizado
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({
        sucesso: false,
        erro: error.message || 'Erro ao atualizar etapa de entrega.'
      });
    }
  }
}

module.exports = OrderController;
