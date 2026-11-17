const { getDatabase, DB_FILE_PATH } = require('./database');

const db = getDatabase(true);
const totalCupcakes = db.prepare('SELECT COUNT(*) as total FROM cupcakes').get().total;
const totalEmbalagens = db.prepare('SELECT COUNT(*) as total FROM embalagens').get().total;

console.log(`[Banco de Dados] Reset concluído com sucesso em: ${DB_FILE_PATH}`);
console.log(`[Banco de Dados] Catálogo carregado: ${totalCupcakes} cupcakes | ${totalEmbalagens} opções de embalagem.`);
