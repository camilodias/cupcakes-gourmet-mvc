-- === Categorias ===
INSERT INTO categorias (id, nome, slug, tipo, descricao) VALUES
(1, 'Doces Gourmet Clássicos', 'doces-classicos', 'DOCE', 'Receitas artesanais com coberturas cremosas, recheios generosos e acabamento de alta confeitaria.'),
(2, 'Linha Inclusiva & Saudável', 'inclusiva-saudavel', 'ESPECIAL', 'Cupcakes desenvolvidos especialmente para dietas com restrição a glúten, lactose, açúcar ou veganas.'),
(3, 'Salgados Artesanais Gourmet', 'salgados-gourmet', 'SALGADO', 'Massas fofinhas salgadas assadas na hora com queijos nobres, ervas frescas e recheios especiais.'),
(4, 'Edições Especiais & Presentes', 'edicoes-especiais', 'DOCE', 'Criações especiais da confeitaria para celebrações, datas comemorativas e presentes.');

-- === Embalagens ===
INSERT INTO embalagens (id, codigo, nome, descricao, protecao_antitranspiracao, eh_presente, permite_agendamento, preco_adicional) VALUES
(1, 'EMB_PADRAO_SELADA', 'Embalagem Padrão Individual', 'Inclusa no pedido — cúpula protetora individual que preserva a umidade da massa e protege a cobertura no transporte.', 1, 0, 0, 0.00),
(2, 'EMB_CAIXA_PRESENTE_LUXO', 'Caixa para Presente', 'Caixa rígida com laço de cetim, proteção individual anti-umidade e cartão com dedicatória e agendamento.', 1, 1, 1, 14.90),
(3, 'EMB_TERMICA_EVENTO', 'Caixa Térmica para Viagem/Eventos', 'Embalagem térmica reforçada com proteção individual para trajetos mais longos, combos e comemorações.', 1, 1, 1, 19.90);

-- === Cupcakes ===
INSERT INTO cupcakes (
    id, categoria_id, nome, sabor, descricao, ingredientes, alergenos,
    tamanho, preco, preco_original, cor_tema, icone_emoji, imagem_svg,
    sem_gluten, zero_lactose, zero_acucar, vegano, destaque, mais_vendido, promocao, estoque
) VALUES
(
    1, 1, 'Red Velvet', 'Cacau & Cream Cheese',
    'Massa macia de cacau com cobertura cremosa de cream cheese artesanal e framboesa fresca.',
    'Farinha de trigo, açúcar orgânico, manteiga extra, ovos caipiras, cacau natural, buttermilk, cream cheese artesanal, framboesas frescas, extrato de baunilha.',
    'Contém leite e glúten.',
    'Tradicional (90g)', 14.90, 17.90, '#a72444', 'cake', '/images/red-velvet.png',
    0, 0, 0, 0, 1, 1, 1, 60
),
(
    2, 1, 'Chocolate Belga 70%', 'Ganache Meio Amargo & Nibs',
    'Bolo úmido de cacau 70%, cobertura de ganache brilhante e nibs de cacau torrados.',
    'Farinha de trigo, chocolate belga 70% cacau, creme vegetal de amêndoas, nibs de cacau torrados, açúcar mascavo, ovos caipiras.',
    'Pode conter traços de nozes e glúten.',
    'Tradicional (90g)', 16.90, NULL, '#584143', 'cake', '/images/dark-callebaut.png',
    0, 1, 0, 0, 1, 1, 0, 45
),
(
    3, 4, 'Caramelo Salgado & Pecã', 'Baunilha, Flor de Sal & Noz-Pecã',
    'Massa de baunilha com calda artesanal de caramelo com toque de flor de sal e nozes-pecã tostadas na manteiga.',
    'Farinha de trigo, extrato natural de baunilha, açúcar demerara caramelizado, manteiga, creme de leite, flor de sal, nozes-pecã tostadas, ovos.',
    'Contém leite e castanhas.',
    'Tradicional (90g)', 15.90, NULL, '#9e6b55', 'cake', '/images/caramelo-peca.png',
    0, 0, 0, 0, 1, 1, 0, 50
),
(
    4, 1, 'Pistache & Limão Siciliano', 'Creme de Pistache & Toque Cítrico',
    'Massa amanteigada com infusão de limão siciliano, cobertura cremosa de pistache torrado e raspas cítricas.',
    'Mix de farinha de amêndoas e arroz sem glúten, pistache torrado moído, suco e raspas de limão siciliano, queijo mascarpone, manteiga, açúcar refinado, ovos.',
    'Contém leite e oleaginosas.',
    'Tradicional (90g)', 17.90, 20.90, '#236537', 'cake', '/images/pistache-limao.png',
    1, 0, 0, 0, 1, 1, 1, 35
),
(
    5, 2, 'Mirtilo Vegano', 'Mirtilo Fresco & Baunilha',
    '100% vegetal e sem glúten. Massa leve de farinha de amêndoas com mirtilos frescos e glacê de leite de coco.',
    'Farinha de amêndoas, fécula de batata, leite de coco, óleo de coco extravirgem, mirtilos orgânicos, xarope de agave, baunilha.',
    'Sem glúten e zero lactose. Contém amêndoas.',
    'Gourmet Duplo (130g)', 18.50, 21.00, '#70585c', 'cake', '/images/bosque-mirtilo.png',
    1, 1, 0, 1, 0, 1, 1, 40
),
(
    6, 3, 'Caprese Assado', 'Tomate Confit, Manjericão & Muçarela de Búfala',
    'Cupcake salgado artesanal assado na hora: massa macia de azeite de oliva com muçarela de búfala e molho pesto.',
    'Farinha de trigo, azeite de oliva extravirgem, muçarela de búfala, tomate cereja confitado, manjericão fresco, queijo parmesão, ovos, fermento.',
    'Contém glúten, lactose e ovos.',
    'Tradicional (90g)', 15.90, NULL, '#a72444', 'cake', '/images/caprese-provencal.png',
    0, 0, 1, 0, 0, 0, 0, 40
),
(
    7, 3, 'Alho-Poró & Nozes', 'Alho-Poró Cremoso (Vegano e Sem Glúten)',
    'Opção salgada inclusiva: massa dourada de grão-de-bico e arroz, recheada com creme de alho-poró e nozes.',
    'Farinha de grão-de-bico, farinha de arroz, alho-poró fresco, creme vegetal de castanha de caju, azeite de oliva, nozes-pecã, sal marinho, noz-moscada.',
    'Sem glúten, zero lactose, zero açúcar e 100% vegano. Contém nozes.',
    'Tradicional (90g)', 16.50, 18.90, '#236537', 'cake', '/images/alho-poro-nozes.png',
    1, 1, 1, 1, 0, 1, 1, 35
),
(
    8, 2, 'Cacau Fit Zero Açúcar', 'Brigadeiro Funcional Zero Açúcar',
    'Adoçado naturalmente com eritritol e stévia, zero lactose e sem trigo, com cobertura cremosa de cacau 100%.',
    'Farinha de aveia sem glúten, cacau alcalino 100%, eritritol, leite de amêndoas, óleo de coco, ovos caipiras, biomassa de banana verde.',
    'Sem glúten, zero lactose e zero adição de açúcares. Contém ovos e amêndoas.',
    'Tradicional (90g)', 17.50, NULL, '#236537', 'cake', '/images/cacau-fit.png',
    1, 1, 1, 0, 0, 0, 0, 35
),
(
    9, 2, 'Morango Zero Lactose', 'Compota de Morango & Chantilly Vegetal',
    'Massa leve zero lactose recheada com compota artesanal de morangos frescos e cobertura de chantilly vegetal.',
    'Farinha de arroz, fécula de mandioca, morangos frescos, açúcar demerara, creme vegetal de arroz, claras em neve, extrato natural de morango.',
    'Sem glúten e zero lactose. Contém ovos.',
    'Mini (45g)', 10.90, 12.90, '#c83e5b', 'cake', '/images/morango-silvestre.png',
    1, 1, 0, 0, 0, 0, 1, 70
),
(
    10, 4, 'Lavanda & Mel', 'Toque Floral de Lavanda com Mel',
    'Notas suaves de lavanda culinária combinadas ao mel orgânico e cobertura cremosa de baunilha.',
    'Farinha de trigo especial, mel orgânico, flores de lavanda culinária, manteiga, ovos caipiras, cream cheese leve, corante natural de beterraba.',
    'Contém glúten, lactose e ovos.',
    'Gourmet Duplo (130g)', 21.00, NULL, '#70585c', 'cake', '/images/lavanda-mel.png',
    0, 0, 0, 0, 0, 0, 0, 25
),
(
    11, 2, 'Coco Queimado & Maracujá', 'Mousse de Maracujá com Coco Dourado',
    'Combinação tropical sem glúten, zero lactose, zero açúcar refinado e 100% vegana, finalizada com coco queimado.',
    'Farinha de coco, polvilho doce, leite de coco concentrado, polpa de maracujá fresco, xilitol, coco ralado queimado no forno, linhaça dourada.',
    'Livre de glúten, lactose, açúcar, ovos e soja.',
    'Gourmet Duplo (130g)', 19.90, 22.90, '#236537', 'cake', '/images/coco-maracuja.png',
    1, 1, 1, 1, 0, 1, 1, 45
),
(
    12, 3, 'Gorgonzola, Pera & Melado', 'Gorgonzola Cremoso com Pera Caramelizada',
    'Cupcake salgado-agridoce em tamanho Mini: massa macia de queijo com cubos de pera caramelizados no melado.',
    'Farinha de trigo, queijo gorgonzola, pera fresca, melado de cana, leite integral, manteiga, ovos, tomilho fresco.',
    'Contém glúten, lactose e ovos.',
    'Mini (45g)', 11.90, NULL, '#584143', 'cake', '/images/gorgonzola-pera.png',
    0, 0, 0, 0, 0, 0, 0, 50
);
