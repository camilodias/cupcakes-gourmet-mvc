PRAGMA foreign_keys = ON;

-- === Categorias ===
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(80) NOT NULL UNIQUE,
    slug VARCHAR(80) NOT NULL UNIQUE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('DOCE', 'SALGADO', 'ESPECIAL')),
    descricao TEXT NOT NULL
);

-- === Cupcakes ===
CREATE TABLE IF NOT EXISTS cupcakes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    categoria_id INTEGER NOT NULL,
    nome VARCHAR(120) NOT NULL,
    sabor VARCHAR(80) NOT NULL,
    descricao TEXT NOT NULL,
    ingredientes TEXT NOT NULL,
    alergenos VARCHAR(255) NOT NULL,
    tamanho VARCHAR(30) NOT NULL CHECK (tamanho IN ('Mini (45g)', 'Tradicional (90g)', 'Gourmet Duplo (130g)')),
    preco DECIMAL(10, 2) NOT NULL CHECK (preco > 0),
    preco_original DECIMAL(10, 2),
    cor_tema VARCHAR(20) NOT NULL DEFAULT '#ec4899',
    icone_emoji VARCHAR(16) NOT NULL DEFAULT '🧁',
    imagem_svg VARCHAR(100) NOT NULL DEFAULT 'strawberry',
    sem_gluten INTEGER NOT NULL DEFAULT 0 CHECK (sem_gluten IN (0, 1)),
    zero_lactose INTEGER NOT NULL DEFAULT 0 CHECK (zero_lactose IN (0, 1)),
    zero_acucar INTEGER NOT NULL DEFAULT 0 CHECK (zero_acucar IN (0, 1)),
    vegano INTEGER NOT NULL DEFAULT 0 CHECK (vegano IN (0, 1)),
    destaque INTEGER NOT NULL DEFAULT 0 CHECK (destaque IN (0, 1)),
    mais_vendido INTEGER NOT NULL DEFAULT 0 CHECK (mais_vendido IN (0, 1)),
    promocao INTEGER NOT NULL DEFAULT 0 CHECK (promocao IN (0, 1)),
    estoque INTEGER NOT NULL DEFAULT 50 CHECK (estoque >= 0),
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
);

-- === Embalagens ===
CREATE TABLE IF NOT EXISTS embalagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    protecao_antitranspiracao INTEGER NOT NULL DEFAULT 1 CHECK (protecao_antitranspiracao IN (0, 1)),
    eh_presente INTEGER NOT NULL DEFAULT 0 CHECK (eh_presente IN (0, 1)),
    permite_agendamento INTEGER NOT NULL DEFAULT 0 CHECK (permite_agendamento IN (0, 1)),
    preco_adicional DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (preco_adicional >= 0)
);

-- === Pedidos ===
CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_pedido VARCHAR(30) NOT NULL UNIQUE,
    cliente_nome VARCHAR(120) NOT NULL,
    cliente_email VARCHAR(120) NOT NULL,
    cliente_telefone VARCHAR(30) NOT NULL,
    tipo_entrega VARCHAR(20) NOT NULL CHECK (tipo_entrega IN ('ENTREGA', 'RETIRADA')),
    cep VARCHAR(15),
    endereco_completo TEXT,
    prazo_estimado VARCHAR(60) NOT NULL,
    embalagem_id INTEGER NOT NULL,
    agendamento_data VARCHAR(30),
    agendamento_periodo VARCHAR(40),
    mensagem_presente TEXT,
    metodo_pagamento VARCHAR(30) NOT NULL CHECK (metodo_pagamento IN ('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'APPLE_PAY', 'GOOGLE_PAY')),
    status_pagamento VARCHAR(30) NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO' CHECK (status_pagamento IN ('AGUARDANDO_PAGAMENTO', 'APROVADO', 'RECUSADO')),
    status_entrega VARCHAR(40) NOT NULL DEFAULT 'PEDIDO_RECEBIDO' CHECK (status_entrega IN ('PEDIDO_RECEBIDO', 'EM_PREPARO_E_SELAGEM', 'EM_ROTA_DE_ENTREGA', 'PRONTO_PARA_RETIRADA', 'ENTREGUE')),
    quantidade_total INTEGER NOT NULL CHECK (quantidade_total > 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    percentual_desconto_combo INTEGER NOT NULL DEFAULT 0,
    desconto_combo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    valor_embalagem DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    valor_frete DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    valor_total DECIMAL(10, 2) NOT NULL CHECK (valor_total >= 0),
    pix_copia_e_cola TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (embalagem_id) REFERENCES embalagens(id) ON DELETE RESTRICT
);

-- === Itens do Pedido ===
CREATE TABLE IF NOT EXISTS itens_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    cupcake_id INTEGER NOT NULL,
    nome_cupcake VARCHAR(120) NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10, 2) NOT NULL CHECK (preco_unitario > 0),
    subtotal_item DECIMAL(10, 2) NOT NULL CHECK (subtotal_item > 0),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (cupcake_id) REFERENCES cupcakes(id) ON DELETE RESTRICT
);

-- === Índices ===
CREATE INDEX IF NOT EXISTS idx_cupcakes_categoria ON cupcakes(categoria_id);
CREATE INDEX IF NOT EXISTS idx_cupcakes_dieteticos ON cupcakes(sem_gluten, zero_lactose, zero_acucar, vegano);
CREATE INDEX IF NOT EXISTS idx_cupcakes_destaques ON cupcakes(destaque, mais_vendido, promocao);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo ON pedidos(codigo_pedido);
