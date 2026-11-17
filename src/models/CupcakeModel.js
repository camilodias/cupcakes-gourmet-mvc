const { getDatabase } = require('../config/database');

class CupcakeModel {
  // --- Listagem e Filtros ---
  static listarTodos(filtros = {}) {
    const db = getDatabase();
    const conditions = ['c.ativo = 1'];
    const params = [];

    if (filtros.tipo && ['DOCE', 'SALGADO', 'ESPECIAL'].includes(String(filtros.tipo).toUpperCase())) {
      conditions.push('cat.tipo = ?');
      params.push(String(filtros.tipo).toUpperCase());
    }

    if (filtros.categoria_id) {
      conditions.push('c.categoria_id = ?');
      params.push(Number(filtros.categoria_id));
    }

    if (filtros.sem_gluten === 'true' || filtros.sem_gluten === true || filtros.sem_gluten === '1') {
      conditions.push('c.sem_gluten = 1');
    }

    if (filtros.zero_lactose === 'true' || filtros.zero_lactose === true || filtros.zero_lactose === '1') {
      conditions.push('c.zero_lactose = 1');
    }

    if (filtros.zero_acucar === 'true' || filtros.zero_acucar === true || filtros.zero_acucar === '1') {
      conditions.push('c.zero_acucar = 1');
    }

    if (filtros.vegano === 'true' || filtros.vegano === true || filtros.vegano === '1') {
      conditions.push('c.vegano = 1');
    }

    if (filtros.destaque === 'true' || filtros.destaque === true || filtros.destaque === '1') {
      conditions.push('c.destaque = 1');
    }

    if (filtros.mais_vendido === 'true' || filtros.mais_vendido === true || filtros.mais_vendido === '1') {
      conditions.push('c.mais_vendido = 1');
    }

    if (filtros.promocao === 'true' || filtros.promocao === true || filtros.promocao === '1') {
      conditions.push('c.promocao = 1');
    }

    if (filtros.tamanho && String(filtros.tamanho).trim() !== '') {
      conditions.push('c.tamanho = ?');
      params.push(String(filtros.tamanho).trim());
    }

    if (filtros.busca && String(filtros.busca).trim() !== '') {
      const termo = `%${String(filtros.busca).trim().toLowerCase()}%`;
      conditions.push('(LOWER(c.nome) LIKE ? OR LOWER(c.sabor) LIKE ? OR LOWER(c.ingredientes) LIKE ?)');
      params.push(termo, termo, termo);
    }

    const sql = `
      SELECT
        c.*,
        cat.nome AS categoria_nome,
        cat.slug AS categoria_slug,
        cat.tipo AS categoria_tipo
      FROM cupcakes c
      INNER JOIN categorias cat ON cat.id = c.categoria_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.destaque DESC, c.mais_vendido DESC, c.id ASC
    `;

    const rows = db.prepare(sql).all(...params);
    return rows.map(CupcakeModel.formatarRegistro);
  }

  // --- Busca por ID ---
  static buscarPorId(id) {
    const db = getDatabase();
    const sql = `
      SELECT
        c.*,
        cat.nome AS categoria_nome,
        cat.slug AS categoria_slug,
        cat.tipo AS categoria_tipo
      FROM cupcakes c
      INNER JOIN categorias cat ON cat.id = c.categoria_id
      WHERE c.id = ? AND c.ativo = 1
    `;
    const row = db.prepare(sql).get(Number(id));
    return row ? CupcakeModel.formatarRegistro(row) : null;
  }

  // --- Categorias ---
  static listarCategorias() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM categorias ORDER BY id ASC').all();
  }

  // --- Embalagens ---
  static listarEmbalagens() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM embalagens ORDER BY id ASC').all().map((emb) => ({
      ...emb,
      preco_adicional: Number(emb.preco_adicional),
      protecao_antitranspiracao: Boolean(emb.protecao_antitranspiracao),
      eh_presente: Boolean(emb.eh_presente),
      permite_agendamento: Boolean(emb.permite_agendamento)
    }));
  }

  // --- Normalização ---
  static formatarRegistro(row) {
    return {
      ...row,
      preco: Number(row.preco),
      preco_original: row.preco_original !== null ? Number(row.preco_original) : null,
      sem_gluten: Boolean(row.sem_gluten),
      zero_lactose: Boolean(row.zero_lactose),
      zero_acucar: Boolean(row.zero_acucar),
      vegano: Boolean(row.vegano),
      destaque: Boolean(row.destaque),
      mais_vendido: Boolean(row.mais_vendido),
      promocao: Boolean(row.promocao),
      ativo: Boolean(row.ativo)
    };
  }
}

module.exports = CupcakeModel;
