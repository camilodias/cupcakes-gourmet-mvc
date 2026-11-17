const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('====================================================');
  console.log('CUPCAKES GOURMET E-COMMERCE (MVC)');
  console.log(`Servidor ativo em: http://localhost:${PORT}`);
  console.log('====================================================');
});
