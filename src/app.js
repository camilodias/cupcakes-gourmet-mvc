const express = require('express');
const path = require('path');
const { getDatabase } = require('./config/database');
const routes = require('./routes');

const app = express();

// --- Inicialização ---
getDatabase();

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Rotas ---
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use('/', routes);

// --- 404 ---
app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    erro: `Rota ${req.method} ${req.originalUrl} não encontrada no servidor Cupcakes Gourmet.`
  });
});

module.exports = app;
