const CupcakeModel = require('../models/CupcakeModel');

class CupcakeController {
  // --- GET /api/cupcakes ---
  static listarCupcakes(req, res) {
    try {
      const cupcakes = CupcakeModel.listarTodos(req.query);
      return res.status(200).json({
        sucesso: true,
        total: cupcakes.length,
        filtros_aplicados: req.query,
        dados: cupcakes
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro interno ao consultar o catálogo de cupcakes.',
        detalhes: error.message
      });
    }
  }

  // --- GET /api/cupcakes/:id ---
  static obterCupcakePorId(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          sucesso: false,
          erro: 'ID do cupcake inválido. Informe um número inteiro positivo.'
        });
      }

      const cupcake = CupcakeModel.buscarPorId(id);
      if (!cupcake) {
        return res.status(404).json({
          sucesso: false,
          erro: `Cupcake com ID ${id} não encontrado no catálogo.`
        });
      }

      return res.status(200).json({
        sucesso: true,
        dados: cupcake
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao buscar detalhes do cupcake.',
        detalhes: error.message
      });
    }
  }

  // --- GET /api/catalogo/metadados ---
  static obterMetadadosCatalogo(req, res) {
    try {
      const categorias = CupcakeModel.listarCategorias();
      const embalagens = CupcakeModel.listarEmbalagens();
      return res.status(200).json({
        sucesso: true,
        dados: {
          categorias,
          embalagens
        }
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        erro: 'Erro ao carregar metadados do catálogo.',
        detalhes: error.message
      });
    }
  }
}

module.exports = CupcakeController;
