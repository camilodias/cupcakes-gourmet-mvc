const express = require('express');
const path = require('path');
const CupcakeController = require('../controllers/CupcakeController');
const OrderController = require('../controllers/OrderController');

const router = express.Router();

// --- Views ---
const enviarViewPrincipal = (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
};

router.get('/', enviarViewPrincipal);
router.get('/sacola', enviarViewPrincipal);
router.get('/pagamento', enviarViewPrincipal);
router.get('/pedidos', enviarViewPrincipal);

// --- API: Catálogo ---
router.get('/api/cupcakes', CupcakeController.listarCupcakes);
router.get('/api/cupcakes/:id', CupcakeController.obterCupcakePorId);
router.get('/api/catalogo/metadados', CupcakeController.obterMetadadosCatalogo);

// --- API: Pedidos & Pagamento ---
router.post('/api/frete/calcular', OrderController.calcularFrete);
router.post('/api/carrinho/orcamento', OrderController.simularOrcamento);
router.post('/api/pedidos', OrderController.criarPedido);
router.get('/api/pedidos', OrderController.listarPedidos);
router.get('/api/pedidos/:codigo', OrderController.obterPedidoPorCodigo);
router.post('/api/pedidos/:codigo/avancar-entrega', OrderController.avancarStatusEntrega);
router.post('/api/webhooks/pix', OrderController.receberWebhookPix);

module.exports = router;
