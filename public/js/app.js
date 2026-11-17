// === Estado ===
const AppState = {
  telaAtual: 'vitrine',
  catalogo: [],
  catalogoCompleto: [],
  totalCatalogo: 12,
  embalagens: [],
  carrinho: JSON.parse(localStorage.getItem('cg_carrinho') || '[]'),
  favoritos: JSON.parse(localStorage.getItem('cg_favoritos') || '[]'),
  quantidadesCard: {},
  apenasFavoritos: false,
  filtros: {
    busca: '',
    tamanho: '',
    tipo: '',
    destaque: '',
    sem_gluten: false,
    zero_lactose: false,
    zero_acucar: false,
    vegano: false
  },
  checkout: {
    embalagem_id: 1,
    tipo_entrega: 'ENTREGA',
    cep: '',
    metodo_pagamento: 'PIX',
    orcamento: null
  },
  pedidoAtivo: null
};

// === Navegação ===
const TELAS_ROTAS = {
  vitrine: '/',
  sacola: '/sacola',
  pagamento: '/pagamento',
  pedidos: '/pedidos'
};

function obterTelaDaUrl() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const entrada = Object.entries(TELAS_ROTAS).find(([, rota]) => rota === path);
  return entrada ? entrada[0] : 'vitrine';
}

function navegarParaTela(tela, atualizarHistorico = true) {
  const destino = TELAS_ROTAS[tela] ? tela : 'vitrine';
  AppState.telaAtual = destino;

  Object.keys(TELAS_ROTAS).forEach((nome) => {
    const sec = document.getElementById(`tela-${nome}`);
    if (sec) sec.classList.toggle('hidden', nome !== destino);

    const nav = document.getElementById(`nav-link-${nome}`);
    if (nav) {
      const ativo = nome === destino;
      nav.classList.toggle('border-b-2', ativo);
      nav.classList.toggle('border-primary', ativo);
      nav.classList.toggle('text-primary', ativo);
      nav.classList.toggle('font-semibold', ativo);
      nav.classList.toggle('text-on-surface-variant', !ativo);
      nav.classList.toggle('font-medium', !ativo);
    }
  });

  if (destino === 'pagamento') {
    renderizarRevisaoPagamento();
  }

  if (atualizarHistorico) {
    const rotaDestino = TELAS_ROTAS[destino];
    if (window.location.pathname !== rotaDestino) {
      window.history.pushState({ tela: destino }, '', rotaDestino);
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('popstate', () => {
  navegarParaTela(obterTelaDaUrl(), false);
});

// === Inicialização ===
document.addEventListener('DOMContentLoaded', async () => {
  const inputData = document.getElementById('input-data-agendamento');
  if (inputData) {
    const amanha = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    inputData.value = amanha;
    inputData.min = amanha;
  }

  navegarParaTela(obterTelaDaUrl(), false);
  atualizarContadorFavoritosUI();
  await carregarMetadados();
  await carregarVitrine(true);
  await atualizarOrcamentoServidor();
  await carregarPedidosRecentes();
});

// === Vitrine & Filtros ===
async function carregarMetadados() {
  try {
    const resp = await fetch('/api/catalogo/metadados');
    const json = await resp.json();
    if (json.sucesso) {
      AppState.embalagens = json.dados.embalagens || [];
      renderizarEmbalagensCheckout();
    }
  } catch (err) {
    console.error('Erro ao carregar metadados:', err);
  }
}

let vitrineRequestSeq = 0;

async function carregarVitrine(atualizarTotalGeral = false) {
  const reqId = ++vitrineRequestSeq;
  try {
    const query = new URLSearchParams();
    if (AppState.filtros.busca) query.set('busca', AppState.filtros.busca);
    if (AppState.filtros.tamanho) query.set('tamanho', AppState.filtros.tamanho);
    if (AppState.filtros.tipo) query.set('tipo', AppState.filtros.tipo);
    if (AppState.filtros.destaque === 'destaque') query.set('destaque', 'true');
    if (AppState.filtros.destaque === 'mais_vendido') query.set('mais_vendido', 'true');
    if (AppState.filtros.destaque === 'promocao') query.set('promocao', 'true');
    if (AppState.filtros.sem_gluten) query.set('sem_gluten', 'true');
    if (AppState.filtros.zero_lactose) query.set('zero_lactose', 'true');
    if (AppState.filtros.zero_acucar) query.set('zero_acucar', 'true');
    if (AppState.filtros.vegano) query.set('vegano', 'true');

    const resp = await fetch(`/api/cupcakes?${query.toString()}`);
    const json = await resp.json();
    if (json.sucesso && reqId === vitrineRequestSeq) {
      const dados = json.dados || [];
      if (query.toString() === '') {
        AppState.catalogoCompleto = dados;
      }
      AppState.catalogo = dados;
      if (atualizarTotalGeral && query.toString() === '') {
        AppState.totalCatalogo = AppState.catalogo.length;
        const badgeTotal = document.getElementById('total-catalogo-aba');
        if (badgeTotal) badgeTotal.textContent = AppState.totalCatalogo;
      }
      renderizarVitrine();
    }
  } catch (err) {
    console.error('Erro ao carregar vitrine:', err);
  }
}

function aplicarFiltrosLocais() {
  if (AppState.catalogoCompleto.length === 0) return false;
  const f = AppState.filtros;
  const busca = (f.busca || '').toLowerCase();

  AppState.catalogo = AppState.catalogoCompleto.filter((c) => {
    if (f.tipo && c.categoria_tipo !== f.tipo) return false;
    if (f.destaque === 'destaque' && !c.destaque) return false;
    if (f.destaque === 'mais_vendido' && !c.mais_vendido) return false;
    if (f.destaque === 'promocao' && !c.promocao) return false;
    if (f.tamanho && c.tamanho !== f.tamanho) return false;
    if (f.sem_gluten && !c.sem_gluten) return false;
    if (f.zero_lactose && !c.zero_lactose) return false;
    if (f.zero_acucar && !c.zero_acucar) return false;
    if (f.vegano && !c.vegano) return false;
    if (busca) {
      const alvo = `${c.nome} ${c.sabor} ${c.ingredientes}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });

  renderizarVitrine();
  return true;
}

function renderizarVitrine() {
  const grid = document.getElementById('grid-cupcakes');
  const contador = document.getElementById('contador-resultados');
  if (!grid) return;

  let lista = [...AppState.catalogo];
  if (AppState.apenasFavoritos) {
    lista = lista.filter((c) => AppState.favoritos.includes(c.id));
  }

  if (contador) {
    contador.textContent = `Exibindo ${lista.length} cupcake(s)`;
  }

  if (lista.length === 0) {
    grid.innerHTML = `
      <div class="sm:col-span-2 bg-surface-container-lowest rounded-xl p-space-xl text-center border border-surface-variant flex flex-col items-center gap-3">
        <span class="material-symbols-outlined text-[40px] text-outline">bakery_dining</span>
        <p class="font-title-md text-title-md text-on-surface">Nenhum cupcake encontrado para esta combinação de filtros.</p>
        <button type="button" onclick="limparTodosFiltros()" class="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg hover:bg-primary-container transition-colors">
          Mostrar Todo o Cardápio
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = lista
    .map((c) => {
      const ehFav = AppState.favoritos.includes(c.id);
      const qtdCard = AppState.quantidadesCard[c.id] || 1;
      const seloTopo = obterSeloSecundarioCard(c);
      const tagsDiet = montarTagsDieteticasCard(c);
      const imgUrl = c.imagem_svg && c.imagem_svg.startsWith('/') ? c.imagem_svg : '/images/red-velvet.png';

      return `
        <article class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group border border-surface-variant/50" data-id="${c.id}">
          <div class="relative w-full aspect-square bg-surface-container-high overflow-hidden">
            <img
              src="${imgUrl}"
              alt="${c.nome}"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span class="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full font-label-md text-label-md text-on-surface shadow-sm">
              ${c.tamanho}
            </span>
            <button
              type="button"
              onclick="alternarFavorito(${c.id})"
              aria-label="${ehFav ? 'Desfavoritar' : 'Favoritar'} ${c.nome}"
              class="absolute top-3 right-3 w-9 h-9 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center ${ehFav ? 'text-primary' : 'text-outline hover:text-primary'} transition-colors shadow-sm active:scale-90"
            >
              <span class="material-symbols-outlined text-[19px] ${ehFav ? 'icon-filled' : ''}">favorite</span>
            </button>
          </div>

          <div class="p-space-md flex flex-col flex-1 justify-between gap-space-sm">
            <div class="flex flex-col gap-1.5">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-headline-sm text-headline-sm text-on-surface leading-tight">${c.nome}</h3>
                <span class="px-2 py-0.5 rounded-full ${seloTopo.classe} font-label-md text-[10px] shrink-0 mt-0.5">
                  ${seloTopo.texto}
                </span>
              </div>

              <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                ${c.descricao}
              </p>

              <div class="flex flex-wrap items-center gap-1.5 mt-0.5">
                ${tagsDiet}
              </div>

              <p class="font-body-sm text-[11px] text-outline mt-0.5 flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px] shrink-0">info</span>
                <span>Alérgenos: ${c.alergenos.replace(/^Alérgenos:\s*/i, '')}</span>
              </p>
            </div>

            <div class="flex flex-col gap-space-xs pt-space-xs border-t border-surface-variant/40">
              <div class="flex items-center justify-between gap-2">
                <div class="flex flex-col">
                  <div class="flex items-baseline gap-2">
                    <span class="font-price-tag text-price-tag text-on-surface">${formatarMoeda(c.preco)}</span>
                    ${c.preco_original ? `<span class="font-body-sm text-[11px] text-outline line-through">${formatarMoeda(c.preco_original)}</span>` : ''}
                  </div>
                  <button
                    type="button"
                    onclick="abrirModalDetalhe(${c.id})"
                    class="text-left font-label-md text-label-md text-secondary hover:text-primary underline decoration-dotted transition-colors"
                  >
                    Ver ingredientes
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1 bg-surface-container-low px-1.5 py-1 rounded-lg">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      onclick="alterarQtdCard(${c.id}, -1)"
                      class="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors shadow-xs"
                    >
                      <span class="material-symbols-outlined text-[14px]">remove</span>
                    </button>
                    <span id="qtd-card-${c.id}" class="font-label-md text-[13px] font-bold w-5 text-center text-on-surface">${qtdCard}</span>
                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      onclick="alterarQtdCard(${c.id}, 1)"
                      class="w-6 h-6 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors shadow-xs"
                    >
                      <span class="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onclick="adicionarDoCard(${c.id}, this)"
                    class="px-3.5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-label-lg text-label-lg shadow-sm flex items-center gap-1.5 transition-all shrink-0"
                  >
                    <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function obterSeloSecundarioCard(c) {
  if (c.categoria_tipo === 'SALGADO') {
    return { texto: 'Salgado', classe: 'bg-secondary-fixed text-on-secondary-fixed' };
  }
  if (c.promocao) {
    return { texto: 'Oferta', classe: 'bg-secondary-container text-on-secondary-container' };
  }
  if (c.mais_vendido) {
    return { texto: 'Mais Vendido', classe: 'bg-surface-container-high text-on-surface-variant' };
  }
  return { texto: 'Clássico', classe: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' };
}

function montarTagsDieteticasCard(c) {
  const tags = [];
  if (c.sem_gluten) {
    tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-md text-[11px] font-semibold"><span class="material-symbols-outlined text-[13px]">check_circle</span>Sem Glúten</span>`);
  }
  if (c.zero_lactose) {
    tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-md text-[11px] font-semibold"><span class="material-symbols-outlined text-[13px]">check_circle</span>Zero Lactose</span>`);
  }
  if (c.zero_acucar) {
    tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-md text-[11px] font-semibold"><span class="material-symbols-outlined text-[13px]">check_circle</span>Zero Açúcar</span>`);
  }
  if (c.vegano) {
    tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-md text-[11px] font-semibold"><span class="material-symbols-outlined text-[13px]">eco</span>Vegano</span>`);
  }
  if (tags.length === 0) {
    tags.push(`<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-[11px] font-semibold"><span class="material-symbols-outlined text-[13px]">bakery_dining</span>Artesanal do Dia</span>`);
  }
  return tags.join('');
}

function alterarQtdCard(cupcakeId, delta) {
  const atual = AppState.quantidadesCard[cupcakeId] || 1;
  const novo = Math.max(1, Math.min(24, atual + delta));
  AppState.quantidadesCard[cupcakeId] = novo;
  const span = document.getElementById(`qtd-card-${cupcakeId}`);
  if (span) span.textContent = novo;
}

async function adicionarDoCard(cupcakeId, btn) {
  const qtd = AppState.quantidadesCard[cupcakeId] || 1;
  await adicionarAoCarrinho(cupcakeId, qtd);
  AppState.quantidadesCard[cupcakeId] = 1;
  const span = document.getElementById(`qtd-card-${cupcakeId}`);
  if (span) span.textContent = 1;

  if (btn) {
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span><span>Adicionado!</span>';
    btn.classList.remove('bg-primary', 'hover:bg-primary-container');
    btn.classList.add('bg-tertiary');
    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.remove('bg-tertiary');
      btn.classList.add('bg-primary', 'hover:bg-primary-container');
    }, 1000);
  }
}

function aoDigitarBusca(valor) {
  const desktop = document.getElementById('input-busca');
  const mobile = document.getElementById('input-busca-mobile');
  if (desktop && desktop.value !== valor) desktop.value = valor;
  if (mobile && mobile.value !== valor) mobile.value = valor;

  if (AppState.telaAtual !== 'vitrine' && valor.trim()) {
    navegarParaTela('vitrine');
  }

  AppState.filtros.busca = valor.trim();
  aplicarFiltrosLocais();
  carregarVitrine();
}

function selecionarAbaTipo(btn, tipo) {
  atualizarEstadoVisualAbas(btn);
  AppState.filtros.tipo = tipo;
  AppState.filtros.destaque = '';
  aplicarFiltrosLocais();
  carregarVitrine();
}

function selecionarAbaDestaque(btn, tipoDestaque) {
  atualizarEstadoVisualAbas(btn);
  AppState.filtros.tipo = '';
  AppState.filtros.destaque = tipoDestaque;
  aplicarFiltrosLocais();
  carregarVitrine();
}

function atualizarEstadoVisualAbas(btnAtivo) {
  document.querySelectorAll('.cat-tab').forEach((b) => {
    b.classList.remove('bg-inverse-surface', 'text-inverse-on-surface');
    if (b.dataset.destaque === 'promocao') {
      b.classList.add('bg-secondary-container', 'text-on-secondary-container');
    } else {
      b.classList.add('bg-surface-container-low', 'text-on-surface-variant');
    }
  });

  if (btnAtivo) {
    btnAtivo.classList.remove('bg-surface-container-low', 'text-on-surface-variant', 'bg-secondary-container', 'text-on-secondary-container');
    btnAtivo.classList.add('bg-inverse-surface', 'text-inverse-on-surface');
  }
}

function selecionarTamanho(btn, tamanho) {
  document.querySelectorAll('.size-tab').forEach((b) => {
    b.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-semibold');
    b.classList.add('text-on-surface-variant');
  });

  btn.classList.remove('text-on-surface-variant');
  btn.classList.add('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-semibold');

  AppState.filtros.tamanho = tamanho;
  aplicarFiltrosLocais();
  carregarVitrine();
}

function alternarChipDietetico(chave) {
  AppState.filtros[chave] = !AppState.filtros[chave];
  const mapaId = {
    sem_gluten: 'chip-sem-gluten',
    zero_lactose: 'chip-zero-lactose',
    zero_acucar: 'chip-zero-acucar',
    vegano: 'chip-vegano'
  };
  const el = document.getElementById(mapaId[chave]);
  if (el) {
    el.classList.toggle('bg-tertiary-fixed', AppState.filtros[chave]);
    el.classList.toggle('text-on-tertiary-fixed-variant', AppState.filtros[chave]);
    el.classList.toggle('font-semibold', AppState.filtros[chave]);
    el.classList.toggle('bg-surface-container-low', !AppState.filtros[chave]);
    el.classList.toggle('text-on-surface-variant', !AppState.filtros[chave]);
  }
  aplicarFiltrosLocais();
  carregarVitrine();
}

function limparTodosFiltros() {
  AppState.filtros = {
    busca: '',
    tamanho: '',
    tipo: '',
    destaque: '',
    sem_gluten: false,
    zero_lactose: false,
    zero_acucar: false,
    vegano: false
  };
  AppState.apenasFavoritos = false;

  const buscaDesk = document.getElementById('input-busca');
  const buscaMob = document.getElementById('input-busca-mobile');
  if (buscaDesk) buscaDesk.value = '';
  if (buscaMob) buscaMob.value = '';

  const primeiraAba = document.querySelector('.cat-tab');
  atualizarEstadoVisualAbas(primeiraAba);

  const primeiroTamanho = document.querySelector('.size-tab');
  if (primeiroTamanho) {
    document.querySelectorAll('.size-tab').forEach((b) => {
      b.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-semibold');
      b.classList.add('text-on-surface-variant');
    });
    primeiroTamanho.classList.remove('text-on-surface-variant');
    primeiroTamanho.classList.add('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-semibold');
  }

  document.querySelectorAll('.diet-chip').forEach((el) => {
    el.classList.remove('bg-tertiary-fixed', 'text-on-tertiary-fixed-variant', 'bg-primary-fixed', 'text-on-primary-fixed', 'font-semibold');
    el.classList.add('bg-surface-container-low', 'text-on-surface-variant');
  });

  atualizarBotaoFavoritosTopoUI();
  aplicarFiltrosLocais();
  carregarVitrine();
}

// === Favoritos ===
function alternarFavorito(cupcakeId) {
  const idx = AppState.favoritos.indexOf(cupcakeId);
  if (idx >= 0) {
    AppState.favoritos.splice(idx, 1);
    mostrarToast('Removido da sua lista de Favoritos.');
  } else {
    AppState.favoritos.push(cupcakeId);
    mostrarToast('Salvo na sua lista de Favoritos!');
  }
  localStorage.setItem('cg_favoritos', JSON.stringify(AppState.favoritos));
  atualizarContadorFavoritosUI();
  renderizarVitrine();
}

function alternarFiltroFavoritos() {
  AppState.apenasFavoritos = !AppState.apenasFavoritos;
  if (AppState.telaAtual !== 'vitrine') {
    navegarParaTela('vitrine');
  }
  const chip = document.getElementById('chip-apenas-favoritos');
  if (chip) {
    chip.classList.toggle('bg-primary-fixed', AppState.apenasFavoritos);
    chip.classList.toggle('text-on-primary-fixed', AppState.apenasFavoritos);
    chip.classList.toggle('font-semibold', AppState.apenasFavoritos);
    chip.classList.toggle('bg-surface-container-low', !AppState.apenasFavoritos);
    chip.classList.toggle('text-on-surface-variant', !AppState.apenasFavoritos);
  }
  atualizarBotaoFavoritosTopoUI();
  renderizarVitrine();
}

function atualizarBotaoFavoritosTopoUI() {
  const btnTopo = document.getElementById('btn-filtro-favoritos-topo');
  const iconTopo = document.getElementById('icone-favoritos-topo');
  if (btnTopo) {
    btnTopo.classList.toggle('bg-primary-fixed', AppState.apenasFavoritos);
    btnTopo.classList.toggle('border-primary', AppState.apenasFavoritos);
    btnTopo.classList.toggle('text-on-primary-fixed', AppState.apenasFavoritos);
    btnTopo.classList.toggle('border-[#E5E0D8]', !AppState.apenasFavoritos);
    btnTopo.classList.toggle('text-on-surface', !AppState.apenasFavoritos);
  }
  if (iconTopo) {
    iconTopo.classList.toggle('icon-filled', AppState.apenasFavoritos);
  }
}

function atualizarContadorFavoritosUI() {
  const el = document.getElementById('contador-favoritos');
  if (el) el.textContent = AppState.favoritos.length;
}

// === Modal de Detalhes ===
async function abrirModalDetalhe(cupcakeId) {
  try {
    const resp = await fetch(`/api/cupcakes/${cupcakeId}`);
    const json = await resp.json();
    if (!json.sucesso) return;
    const c = json.dados;
    const imgUrl = c.imagem_svg && c.imagem_svg.startsWith('/') ? c.imagem_svg : '/images/red-velvet.png';

    const modal = document.getElementById('modal-detalhe-cupcake');
    const conteudo = document.getElementById('conteudo-modal-cupcake');
    conteudo.innerHTML = `
      <div class="flex items-center gap-4 mb-4 pr-6">
        <img src="${imgUrl}" alt="${c.nome}" class="w-20 h-20 rounded-xl object-cover shadow-sm shrink-0" />
        <div>
          <span class="font-label-md text-[11px] uppercase tracking-wider text-primary font-semibold">${c.categoria_nome} &bull; ${c.tamanho}</span>
          <h2 class="font-headline-md text-headline-md text-on-surface leading-tight mt-0.5">${c.nome}</h2>
          <span class="font-price-tag text-price-tag text-primary">${formatarMoeda(c.preco)}</span>
        </div>
      </div>

      <p class="font-body-md text-body-md text-on-surface-variant mb-4">${c.descricao}</p>

      <div class="bg-surface-container-low p-3.5 rounded-lg mb-3">
        <span class="font-label-md text-label-md text-on-surface flex items-center gap-1.5 mb-1">
          <span class="material-symbols-outlined text-[16px] text-secondary">restaurant_menu</span>
          Lista Completa de Ingredientes
        </span>
        <p class="font-body-sm text-body-sm text-on-surface-variant">${c.ingredientes}</p>
      </div>

      <div class="bg-error-container/50 p-3.5 rounded-lg mb-3">
        <span class="font-label-md text-label-md text-on-error-container flex items-center gap-1.5 mb-1">
          <span class="material-symbols-outlined text-[16px]">warning</span>
          Informação para Alérgicos
        </span>
        <p class="font-body-sm text-body-sm text-on-error-container">${c.alergenos}</p>
      </div>

      <div class="bg-tertiary-fixed/50 p-3.5 rounded-lg mb-5 flex items-start gap-2 text-on-tertiary-fixed-variant">
        <span class="material-symbols-outlined text-[18px] shrink-0 mt-0.5">verified_user</span>
        <p class="font-body-sm text-body-sm">
          <strong>Embalagem Segura:</strong> Entregue com cúpula protetora individual que preserva a umidade da massa e protege a cobertura.
        </p>
      </div>

      <button
        type="button"
        onclick="adicionarAoCarrinho(${c.id}, 1); fecharModalDetalhe();"
        class="w-full py-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
      >
        <span class="material-symbols-outlined text-[18px]">add_shopping_cart</span>
        <span>Adicionar à Sacola (${formatarMoeda(c.preco)})</span>
      </button>
    `;
    modal.classList.remove('hidden');
  } catch (err) {
    console.error(err);
  }
}

function fecharModalDetalhe() {
  document.getElementById('modal-detalhe-cupcake').classList.add('hidden');
}

// === Sacola & Checkout ===
function salvarCarrinhoLocal() {
  localStorage.setItem('cg_carrinho', JSON.stringify(AppState.carrinho));
}

function irParaSacola() {
  navegarParaTela('sacola');
}

function avancarParaPagamento() {
  if (AppState.carrinho.length === 0) {
    mostrarToast('Sua sacola está vazia. Adicione pelo menos 1 cupcake na loja!');
    return;
  }
  navegarParaTela('pagamento');
}

async function adicionarAoCarrinho(cupcakeId, delta = 1) {
  const existente = AppState.carrinho.find((i) => i.cupcake_id === cupcakeId);
  if (existente) {
    existente.quantidade += delta;
    if (existente.quantidade <= 0) {
      AppState.carrinho = AppState.carrinho.filter((i) => i.cupcake_id !== cupcakeId);
    }
  } else if (delta > 0) {
    AppState.carrinho.push({ cupcake_id: cupcakeId, quantidade: delta });
  }

  salvarCarrinhoLocal();
  await atualizarOrcamentoServidor();
  if (delta > 0) {
    mostrarToast('Cupcake adicionado à sua sacola!');
  }
}

async function esvaziarCarrinho() {
  AppState.carrinho = [];
  salvarCarrinhoLocal();
  await atualizarOrcamentoServidor();
  mostrarToast('Sacola esvaziada.');
}

function renderizarEmbalagensCheckout() {
  const container = document.getElementById('opcoes-embalagem');
  if (!container) return;

  container.innerHTML = AppState.embalagens
    .map((emb) => {
      const selecionada = Number(AppState.checkout.embalagem_id) === Number(emb.id);
      const precoTxt = emb.preco_adicional > 0 ? ` (+ ${formatarMoeda(emb.preco_adicional)})` : '';
      const subTxt = emb.preco_adicional === 0 ? 'Incluso no pedido &bull; Grátis' : emb.descricao;

      return `
        <label
          onclick="selecionarEmbalagem(${emb.id})"
          class="flex items-start gap-space-xs p-2.5 rounded-lg ${selecionada ? 'bg-surface-container-low ring-1 ring-primary' : 'bg-surface-container-low hover:bg-surface-container'} cursor-pointer transition-all"
        >
          <input
            type="radio"
            name="packaging"
            value="${emb.id}"
            ${selecionada ? 'checked' : ''}
            class="accent-primary w-4 h-4 mt-0.5 shrink-0"
          />
          <div class="flex flex-col min-w-0 flex-1">
            <span class="font-body-sm text-body-sm font-semibold text-on-surface">${emb.nome}${precoTxt}</span>
            <span class="font-body-sm text-[11px] ${emb.preco_adicional === 0 ? 'text-tertiary' : 'text-on-surface-variant'}">${subTxt}</span>
          </div>
        </label>
      `;
    })
    .join('');

  const embAtual = AppState.embalagens.find((e) => Number(e.id) === Number(AppState.checkout.embalagem_id));
  const blocoAgendamento = document.getElementById('bloco-agendamento-presente');
  if (blocoAgendamento) {
    blocoAgendamento.classList.toggle('hidden', !(embAtual && embAtual.eh_presente));
  }
}

async function selecionarEmbalagem(id) {
  AppState.checkout.embalagem_id = Number(id);
  renderizarEmbalagensCheckout();
  await atualizarOrcamentoServidor();
}

async function selecionarTipoEntrega(tipo) {
  AppState.checkout.tipo_entrega = tipo;
  const btnEntrega = document.getElementById('btn-modo-entrega');
  const btnRetirada = document.getElementById('btn-modo-retirada');

  if (tipo === 'ENTREGA') {
    btnEntrega.classList.add('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-semibold');
    btnEntrega.classList.remove('text-on-surface-variant');
    btnRetirada.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-semibold');
    btnRetirada.classList.add('text-on-surface-variant');
  } else {
    btnRetirada.classList.add('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-semibold');
    btnRetirada.classList.remove('text-on-surface-variant');
    btnEntrega.classList.remove('bg-surface-container-lowest', 'text-on-surface', 'shadow-sm', 'font-semibold');
    btnEntrega.classList.add('text-on-surface-variant');
  }

  document.getElementById('bloco-cep-entrega').classList.toggle('hidden', tipo !== 'ENTREGA');
  document.getElementById('bloco-info-retirada').classList.toggle('hidden', tipo !== 'RETIRADA');
  await atualizarOrcamentoServidor();
}

function aoDigitarCep(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 8);
  if (v.length > 5) {
    v = `${v.slice(0, 5)}-${v.slice(5)}`;
  }
  input.value = v;
  AppState.checkout.cep = v;
}

async function calcularFreteNoCarrinho() {
  const cepInput = document.getElementById('input-cep').value;
  AppState.checkout.cep = cepInput;
  const box = document.getElementById('resultado-frete-box');
  esconderAlertaCheckout();

  try {
    const subtotalLiquido = AppState.checkout.orcamento
      ? AppState.checkout.orcamento.subtotal - AppState.checkout.orcamento.desconto_combo
      : 0;

    const resp = await fetch('/api/frete/calcular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo_entrega: AppState.checkout.tipo_entrega,
        cep: cepInput,
        subtotal_liquido: subtotalLiquido
      })
    });
    const json = await resp.json();

    if (!json.sucesso) {
      box.classList.remove('hidden', 'bg-tertiary-fixed/40', 'text-on-tertiary-fixed-variant');
      box.classList.add('bg-error-container', 'text-on-error-container');
      box.textContent = json.erro;
      return;
    }

    const f = json.dados;
    box.classList.remove('hidden', 'bg-error-container', 'text-on-error-container');
    box.classList.add('bg-tertiary-fixed/40', 'text-on-tertiary-fixed-variant');
    box.innerHTML = `<strong>${f.regiao}</strong> &bull; ${f.prazoEstimado} &bull; <strong>${f.freteGratis ? 'Frete Grátis' : formatarMoeda(f.valorFrete)}</strong>`;

    const inputEnd = document.getElementById('input-endereco-entrega');
    if (inputEnd && !inputEnd.value.trim()) {
      inputEnd.value = f.enderecoSugerido;
    }

    await atualizarOrcamentoServidor();
  } catch (err) {
    console.error(err);
  }
}

function selecionarMetodoPagamento(btn, metodo) {
  document.querySelectorAll('.pay-card').forEach((b) => {
    b.classList.remove('active', 'bg-surface-container-lowest', 'shadow-sm', 'ring-1', 'ring-primary');
    b.classList.add('bg-surface-container-low');
  });
  btn.classList.remove('bg-surface-container-low');
  btn.classList.add('active', 'bg-surface-container-lowest', 'shadow-sm', 'ring-1', 'ring-primary');
  AppState.checkout.metodo_pagamento = metodo;
}

async function atualizarOrcamentoServidor() {
  try {
    const resp = await fetch('/api/carrinho/orcamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itens: AppState.carrinho,
        embalagem_id: AppState.checkout.embalagem_id,
        tipo_entrega: AppState.checkout.tipo_entrega,
        cep: AppState.checkout.cep
      })
    });
    const json = await resp.json();
    if (json.sucesso) {
      AppState.checkout.orcamento = json.dados;
      renderizarCarrinhoUI(json.dados);
    }
  } catch (err) {
    console.error('Erro ao atualizar orçamento:', err);
  }
}

function renderizarCarrinhoUI(orc) {
  const totalFormatado = formatarMoeda(orc.valor_total);
  document.getElementById('badge-qtd-header').textContent = orc.quantidade_total;
  document.getElementById('header-valor-carrinho').textContent = totalFormatado;
  document.getElementById('badge-qtd-sacola').textContent = `${orc.quantidade_total} ${orc.quantidade_total === 1 ? 'item' : 'itens'}`;
  document.getElementById('mobile-bar-qtd').textContent = `Sacola (${orc.quantidade_total} ${orc.quantidade_total === 1 ? 'item' : 'itens'})`;
  document.getElementById('mobile-bar-total').textContent = totalFormatado;
  document.getElementById('btn-finalizar-valor').textContent = totalFormatado;

  const btnLimpar = document.getElementById('btn-esvaziar-sacola');
  if (btnLimpar) btnLimpar.classList.toggle('hidden', orc.quantidade_total === 0);

  // Progresso do combo
  const alvoMeta = orc.quantidade_total < 4 ? 4 : orc.quantidade_total < 8 ? 8 : 12;
  const pctBarra = Math.min(100, Math.round((orc.quantidade_total / alvoMeta) * 100));
  document.getElementById('barra-progresso-combo').style.width = `${pctBarra}%`;
  document.getElementById('label-progresso-combo').textContent = `${orc.quantidade_total} de ${alvoMeta}`;
  document.getElementById('texto-progresso-combo').innerHTML = `
    <span class="material-symbols-outlined text-primary text-[16px]">percent</span>
    <span>${orc.proximo_combo_texto}</span>
  `;

  const listaEl = document.getElementById('lista-itens-carrinho');
  if (orc.itens.length === 0) {
    listaEl.innerHTML = `
      <div class="bg-surface-container-low rounded-lg p-space-md text-center flex flex-col items-center gap-2">
        <span class="material-symbols-outlined text-[28px] text-outline">shopping_bag</span>
        <p class="font-body-sm text-body-sm text-on-surface-variant">Sua sacola está vazia. Escolha seus sabores na loja.</p>
        <button type="button" onclick="navegarParaTela('vitrine')" class="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-[12px]">
          Explorar Cardápio
        </button>
      </div>
    `;
  } else {
    listaEl.innerHTML = orc.itens
      .map((item) => {
        const prod =
          AppState.catalogoCompleto.find((c) => c.id === item.cupcake_id) ||
          AppState.catalogo.find((c) => c.id === item.cupcake_id);
        const imgUrl = prod && prod.imagem_svg && prod.imagem_svg.startsWith('/') ? prod.imagem_svg : '/images/red-velvet.png';
        const tamanho = prod ? prod.tamanho : 'Tradicional 90g';
        return `
          <div class="flex items-center justify-between gap-space-sm p-space-xs rounded-lg hover:bg-surface-container-low transition-colors">
            <img src="${imgUrl}" alt="${item.nome}" class="w-12 h-12 rounded-full object-cover shrink-0 shadow-sm" />
            <div class="flex flex-col flex-1 min-w-0">
              <span class="font-body-md text-body-md font-semibold text-on-surface truncate">${item.nome}</span>
              <span class="font-body-sm text-body-sm text-on-surface-variant">${tamanho}</span>
              <span class="font-label-md text-label-md text-on-surface mt-0.5">${formatarMoeda(item.subtotal_item)}</span>
            </div>
            <div class="flex items-center gap-1 bg-surface-container rounded-lg p-1 shrink-0">
              <button type="button" aria-label="Diminuir" onclick="adicionarAoCarrinho(${item.cupcake_id}, -1)" class="w-6 h-6 rounded flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
                <span class="material-symbols-outlined text-[14px]">remove</span>
              </button>
              <span class="font-body-sm text-body-sm font-semibold px-1 text-on-surface">${item.quantidade}</span>
              <button type="button" aria-label="Aumentar" onclick="adicionarAoCarrinho(${item.cupcake_id}, 1)" class="w-6 h-6 rounded flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
                <span class="material-symbols-outlined text-[14px]">add</span>
              </button>
            </div>
            <button type="button" aria-label="Remover ${item.nome}" onclick="adicionarAoCarrinho(${item.cupcake_id}, -${item.quantidade})" class="text-outline hover:text-error transition-colors p-1 shrink-0">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        `;
      })
      .join('');
  }

  document.getElementById('resumo-qtd-itens').textContent = orc.quantidade_total;
  document.getElementById('resumo-subtotal').textContent = formatarMoeda(orc.subtotal);
  document.getElementById('resumo-nome-combo').textContent = orc.nome_combo;
  document.getElementById('resumo-valor-desconto').textContent = `- ${formatarMoeda(orc.desconto_combo)}`;
  document.getElementById('resumo-nome-embalagem').textContent = orc.embalagem.nome;
  document.getElementById('resumo-valor-embalagem').textContent =
    orc.embalagem.preco_adicional > 0 ? formatarMoeda(orc.embalagem.preco_adicional) : 'Grátis';
  document.getElementById('resumo-valor-frete').textContent =
    orc.quantidade_total === 0 ? 'R$ 0,00' : orc.frete.freteGratis ? 'Grátis' : formatarMoeda(orc.frete.valorFrete);
  document.getElementById('resumo-valor-total').textContent = totalFormatado;

  const prevEl = document.getElementById('sacola-previsao-entrega');
  if (prevEl && orc.frete && orc.frete.prazoEstimado && orc.quantidade_total > 0) {
    prevEl.textContent = `Previsão: ${orc.frete.prazoEstimado}`;
  }

  renderizarRevisaoPagamento();
}

function renderizarRevisaoPagamento() {
  const orc = AppState.checkout.orcamento;
  const itensEl = document.getElementById('revisao-itens-pagamento');
  const entEl = document.getElementById('revisao-entrega-pagamento');
  const embEl = document.getElementById('revisao-embalagem-pagamento');
  if (!orc || !itensEl) return;

  if (orc.itens.length === 0) {
    itensEl.innerHTML = '<p class="text-on-surface-variant">Nenhum item na sacola ainda.</p>';
  } else {
    itensEl.innerHTML = orc.itens
      .map(
        (item) => `
        <div class="flex items-center justify-between gap-2">
          <span class="text-on-surface truncate">${item.quantidade}x ${item.nome}</span>
          <span class="font-semibold text-on-surface shrink-0">${formatarMoeda(item.subtotal_item)}</span>
        </div>`
      )
      .join('');
  }

  if (entEl) {
    if (AppState.checkout.tipo_entrega === 'RETIRADA') {
      entEl.innerHTML = '<strong>Recebimento:</strong> Retirar na Loja (Av. Paulista, 1578 - SP)';
    } else {
      const cep = (document.getElementById('input-cep')?.value || '').trim();
      const end = (document.getElementById('input-endereco-entrega')?.value || '').trim();
      entEl.innerHTML = `<strong>Entrega:</strong> ${end || 'Endereço a informar'}${cep ? ` (CEP ${cep})` : ''}`;
    }
  }

  if (embEl) {
    const dataAg = document.getElementById('input-data-agendamento')?.value || '';
    const turnoAg = document.getElementById('select-periodo-agendamento')?.value || '';
    const extraPresente =
      orc.embalagem.eh_presente && dataAg ? ` &bull; Agendado: ${dataAg} (${turnoAg})` : '';
    embEl.innerHTML = `<strong>Embalagem:</strong> ${orc.embalagem.nome}${extraPresente}`;
  }

  const subEl = document.getElementById('revisao-subtotal-pagamento');
  const descEl = document.getElementById('revisao-desconto-pagamento');
  const freteEl = document.getElementById('revisao-frete-pagamento');
  const totalEl = document.getElementById('revisao-total-pagamento');
  if (subEl) subEl.textContent = formatarMoeda(orc.subtotal);
  if (descEl) descEl.textContent = `- ${formatarMoeda(orc.desconto_combo)}`;
  if (freteEl) {
    freteEl.textContent =
      orc.quantidade_total === 0 ? 'R$ 0,00' : orc.frete.freteGratis ? 'Grátis' : formatarMoeda(orc.frete.valorFrete);
  }
  if (totalEl) totalEl.textContent = formatarMoeda(orc.valor_total);
}

// === Pedidos & Webhook ===
function preencherDadosTesteSandbox() {
  const nomeEl = document.getElementById('input-cliente-nome');
  const emailEl = document.getElementById('input-cliente-email');
  const telEl = document.getElementById('input-cliente-telefone');
  const cepEl = document.getElementById('input-cep');
  const endEl = document.getElementById('input-endereco-entrega');

  if (nomeEl) nomeEl.value = 'Cliente Homologação Sandbox';
  if (emailEl) emailEl.value = 'sandbox@teste.com';
  if (telEl) telEl.value = '(11) 90000-0000';
  if (cepEl) {
    cepEl.value = '01310-100';
    AppState.checkout.cep = '01310-100';
  }
  if (endEl) endEl.value = 'Av. Paulista, 1578 - Bela Vista, São Paulo/SP';

  esconderAlertaCheckout();
  calcularFreteNoCarrinho();
  mostrarToast('Dados fictícios de homologação preenchidos!');
}

function mostrarAlertaCheckout(msg) {
  const alerta = document.getElementById('alerta-checkout');
  const txt = document.getElementById('alerta-checkout-texto');
  if (txt) txt.textContent = msg;
  if (alerta) {
    alerta.classList.remove('hidden');
    alerta.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  mostrarToast(msg);
}

function esconderAlertaCheckout() {
  const alerta = document.getElementById('alerta-checkout');
  if (alerta) alerta.classList.add('hidden');
}

async function submeterPedido() {
  esconderAlertaCheckout();

  const payload = {
    cliente_nome: document.getElementById('input-cliente-nome').value,
    cliente_email: document.getElementById('input-cliente-email').value,
    cliente_telefone: document.getElementById('input-cliente-telefone').value,
    tipo_entrega: AppState.checkout.tipo_entrega,
    cep: document.getElementById('input-cep').value,
    endereco_completo: document.getElementById('input-endereco-entrega').value,
    embalagem_id: AppState.checkout.embalagem_id,
    agendamento_data: document.getElementById('input-data-agendamento').value,
    agendamento_periodo: document.getElementById('select-periodo-agendamento').value,
    mensagem_presente: document.getElementById('input-mensagem-presente').value,
    metodo_pagamento: AppState.checkout.metodo_pagamento,
    itens: AppState.carrinho
  };

  try {
    const resp = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await resp.json();

    if (!json.sucesso) {
      mostrarAlertaCheckout(json.erro || 'Não foi possível concluir o pedido.');
      return;
    }

    AppState.pedidoAtivo = json.dados;
    AppState.carrinho = [];
    salvarCarrinhoLocal();
    await atualizarOrcamentoServidor();
    await carregarPedidosRecentes();

    renderizarPainelPedidoAtivo(json.dados);
    navegarParaTela('pedidos');
    abrirModalSandboxPagamento(json.dados);
  } catch (err) {
    mostrarAlertaCheckout('Erro de conexão ao enviar pedido.');
  }
}

function gerarBlocoMetodoSandboxHtml(pedido, compacto = false) {
  const valor = formatarMoeda(pedido.valor_total);
  if (pedido.metodo_pagamento === 'PIX') {
    return `
      <div class="flex flex-col gap-3">
        ${
          compacto
            ? ''
            : `
          <div class="flex justify-center">
            <div class="p-3 bg-white rounded-xl border border-surface-variant shadow-xs">
              <svg width="132" height="132" viewBox="0 0 100 100" aria-label="QR Code Pix Sandbox">
                <rect width="100" height="100" fill="#ffffff"/>
                <rect x="6" y="6" width="24" height="24" fill="none" stroke="#1c1c19" stroke-width="5"/>
                <rect x="14" y="14" width="8" height="8" fill="#1c1c19"/>
                <rect x="70" y="6" width="24" height="24" fill="none" stroke="#1c1c19" stroke-width="5"/>
                <rect x="78" y="14" width="8" height="8" fill="#1c1c19"/>
                <rect x="6" y="70" width="24" height="24" fill="none" stroke="#1c1c19" stroke-width="5"/>
                <rect x="14" y="78" width="8" height="8" fill="#1c1c19"/>
                <rect x="38" y="10" width="8" height="8" fill="#236537"/>
                <rect x="52" y="10" width="10" height="8" fill="#1c1c19"/>
                <rect x="38" y="24" width="12" height="8" fill="#1c1c19"/>
                <rect x="56" y="24" width="8" height="14" fill="#236537"/>
                <rect x="10" y="38" width="12" height="8" fill="#1c1c19"/>
                <rect x="28" y="38" width="8" height="16" fill="#236537"/>
                <rect x="42" y="42" width="16" height="16" rx="3" fill="#a72444"/>
                <rect x="66" y="40" width="10" height="10" fill="#1c1c19"/>
                <rect x="82" y="38" width="12" height="14" fill="#1c1c19"/>
                <rect x="10" y="54" width="10" height="8" fill="#1c1c19"/>
                <rect x="62" y="58" width="14" height="8" fill="#236537"/>
                <rect x="82" y="58" width="10" height="10" fill="#1c1c19"/>
                <rect x="38" y="68" width="14" height="8" fill="#1c1c19"/>
                <rect x="56" y="72" width="10" height="10" fill="#1c1c19"/>
                <rect x="72" y="74" width="20" height="8" fill="#236537"/>
                <rect x="40" y="84" width="24" height="8" fill="#1c1c19"/>
                <rect x="70" y="86" width="18" height="6" fill="#1c1c19"/>
              </svg>
            </div>
          </div>`
        }
        <textarea class="w-full font-mono text-[11px] bg-surface-container-low rounded-lg p-2.5 text-on-surface border border-surface-variant" rows="2" readonly>${pedido.pix_copia_e_cola || ''}</textarea>
        <button type="button" onclick="copiarCodigoPix('${pedido.pix_copia_e_cola || ''}')" class="self-start px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-[12px] flex items-center gap-1.5 hover:bg-surface-variant transition-colors">
          <span class="material-symbols-outlined text-[15px]">content_copy</span>
          Copiar Código Pix
        </button>
      </div>
    `;
  }

  if (pedido.metodo_pagamento === 'CARTAO_CREDITO' || pedido.metodo_pagamento === 'CARTAO_DEBITO') {
    const rotulo = pedido.metodo_pagamento === 'CARTAO_CREDITO' ? 'Cartão de Crédito' : 'Cartão de Débito';
    return `
      <div class="bg-inverse-surface text-inverse-on-surface rounded-xl p-4 flex flex-col gap-3 shadow-sm">
        <div class="flex items-center justify-between text-[11px] opacity-80">
          <span class="uppercase tracking-wider font-semibold">${rotulo} • Sandbox</span>
          <span class="material-symbols-outlined text-[20px]">credit_card</span>
        </div>
        <div class="font-mono text-[16px] tracking-widest">4111 •••• •••• 1111</div>
        <div class="flex items-center justify-between text-[11px] opacity-85">
          <span>VAL 12/29 &bull; CVV 123</span>
          <span class="font-semibold text-[13px]">${valor}</span>
        </div>
      </div>
    `;
  }

  const nomeCarteira = pedido.metodo_pagamento === 'APPLE_PAY' ? 'Apple Pay' : 'Google Pay';
  const iconeCarteira = pedido.metodo_pagamento === 'APPLE_PAY' ? 'phone_iphone' : 'wallet';
  return `
    <div class="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
          <span class="material-symbols-outlined text-[22px]">${iconeCarteira}</span>
        </div>
        <div class="flex flex-col">
          <span class="font-label-lg text-label-lg text-on-surface font-semibold">${nomeCarteira} (Sandbox)</span>
          <span class="font-body-sm text-[11px] text-on-surface-variant">Confirmação biométrica simulada &bull; ${valor}</span>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-md text-[10px]">Pronto</span>
    </div>
  `;
}

function abrirModalSandboxPagamento(pedido) {
  const modal = document.getElementById('modal-sandbox-pagamento');
  const conteudo = document.getElementById('conteudo-modal-sandbox');
  if (!modal || !conteudo) return;

  conteudo.innerHTML = `
    <div class="flex flex-col gap-4 pr-2">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[22px]">shield</span>
        </div>
        <div>
          <span class="font-label-md text-[11px] uppercase tracking-wider text-primary font-semibold">Gateway Virtual Sandbox</span>
          <h2 class="font-headline-sm text-headline-sm text-on-surface leading-tight">Simulação de Pagamento</h2>
        </div>
      </div>

      <div class="bg-surface-container-low rounded-lg px-3.5 py-2.5 flex items-center justify-between text-on-surface">
        <span class="font-body-sm text-body-sm text-on-surface-variant">Pedido <strong>${pedido.codigo_pedido}</strong></span>
        <span class="font-price-tag text-price-tag text-primary">${formatarMoeda(pedido.valor_total)}</span>
      </div>

      ${gerarBlocoMetodoSandboxHtml(pedido, false)}

      <p class="font-body-sm text-[11px] text-on-surface-variant">
        Ambiente de homologação: escolha abaixo o retorno bancário para testar aprovação ou recusa da transação.
      </p>

      <div class="flex flex-col gap-2">
        <button
          type="button"
          onclick="dispararWebhookPix('${pedido.codigo_pedido}', 'APROVAR')"
          class="w-full py-3 px-4 rounded-lg bg-tertiary text-on-tertiary font-label-lg text-label-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
        >
          <span class="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Simular Pagamento APROVADO</span>
        </button>
        <button
          type="button"
          onclick="dispararWebhookPix('${pedido.codigo_pedido}', 'RECUSAR')"
          class="w-full py-2.5 px-4 rounded-lg bg-error-container text-on-error-container font-label-lg text-label-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span class="material-symbols-outlined text-[18px]">cancel</span>
          <span>Simular Pagamento RECUSADO</span>
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function fecharModalSandbox() {
  const modal = document.getElementById('modal-sandbox-pagamento');
  if (modal) modal.classList.add('hidden');
}

function renderizarPainelPedidoAtivo(pedido) {
  const painel = document.getElementById('painel-pedido-ativo');
  if (!painel) return;
  painel.classList.remove('hidden');

  const etapas = [
    { codigo: 'PEDIDO_RECEBIDO', titulo: '1. Pedido Recebido', desc: 'Registrado no sistema', icone: 'receipt_long' },
    { codigo: 'EM_PREPARO_E_SELAGEM', titulo: '2. Preparo & Selagem', desc: 'Película Anti-Transpiração', icone: 'inventory_2' },
    {
      codigo: pedido.tipo_entrega === 'RETIRADA' ? 'PRONTO_PARA_RETIRADA' : 'EM_ROTA_DE_ENTREGA',
      titulo: pedido.tipo_entrega === 'RETIRADA' ? '3. Pronto na Loja' : '3. Saiu para Entrega',
      desc: pedido.prazo_estimado,
      icone: pedido.tipo_entrega === 'RETIRADA' ? 'storefront' : 'local_shipping'
    },
    { codigo: 'ENTREGUE', titulo: '4. Entregue Intacto', desc: 'Concluído com sucesso', icone: 'check_circle' }
  ];

  const ordemCodigos = etapas.map((e) => e.codigo);
  const idxAtual = Math.max(0, ordemCodigos.indexOf(pedido.status_entrega));

  const blocoSandboxHtml =
    pedido.status_pagamento !== 'APROVADO'
      ? `
      <div class="bg-surface-container-lowest border border-dashed ${pedido.status_pagamento === 'RECUSADO' ? 'border-error' : 'border-tertiary'} rounded-xl p-space-md flex flex-col gap-3">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2 ${pedido.status_pagamento === 'RECUSADO' ? 'text-error' : 'text-tertiary'} font-label-lg text-label-lg">
            <span class="material-symbols-outlined text-[20px]">shield</span>
            <span>${pedido.status_pagamento === 'RECUSADO' ? 'Pagamento Recusado no Sandbox — Tente Novamente' : `Pagamento (${pedido.metodo_pagamento}) Pendente no Sandbox`}</span>
          </div>
          <button type="button" onclick="abrirModalSandboxPagamento(AppState.pedidoAtivo)" class="px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-label-md text-[11px] font-semibold transition-colors">
            Abrir Gateway Sandbox
          </button>
        </div>
        ${gerarBlocoMetodoSandboxHtml(pedido, true)}
        <div class="flex flex-wrap gap-2">
          <button type="button" onclick="dispararWebhookPix('${pedido.codigo_pedido}', 'APROVAR')" class="px-4 py-2 rounded-lg bg-tertiary text-on-tertiary font-label-md text-label-md flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <span class="material-symbols-outlined text-[16px]">bolt</span>
            Simular Pagamento APROVADO
          </button>
          <button type="button" onclick="dispararWebhookPix('${pedido.codigo_pedido}', 'RECUSAR')" class="px-4 py-2 rounded-lg bg-error-container text-on-error-container font-label-md text-label-md flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <span class="material-symbols-outlined text-[16px]">cancel</span>
            Simular Pagamento RECUSADO
          </button>
        </div>
      </div>
    `
      : '';

  painel.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
      <div>
        <span class="px-2.5 py-0.5 rounded-full bg-inverse-surface text-inverse-on-surface font-label-md text-[11px]">${pedido.codigo_pedido}</span>
        <h3 class="font-headline-sm text-headline-sm text-on-surface mt-1">Pedido de ${pedido.cliente_nome}</h3>
        <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
          ${pedido.endereco_completo} &bull; ${pedido.embalagem_nome}
        </p>
        ${
          pedido.agendamento_data
            ? `<p class="font-body-sm text-body-sm text-primary font-semibold mt-1">Entrega Agendada: ${pedido.agendamento_data} (${pedido.agendamento_periodo || ''}) — Cartão: "${pedido.mensagem_presente || 'Sem mensagem'}"</p>`
            : ''
        }
      </div>
      <div class="sm:text-right">
        <span class="font-label-md text-[11px] uppercase text-outline">Pagamento (${pedido.metodo_pagamento})</span>
        <div class="font-label-lg text-label-lg font-bold ${pedido.status_pagamento === 'APROVADO' ? 'text-tertiary' : pedido.status_pagamento === 'RECUSADO' ? 'text-error' : 'text-primary'}">
          ${pedido.status_pagamento}
        </div>
        <div class="font-price-tag text-price-tag text-on-surface">
          ${formatarMoeda(pedido.valor_total)}
        </div>
      </div>
    </div>

    ${blocoSandboxHtml}

    <div class="flex flex-col gap-2">
      <span class="font-label-md text-label-md text-on-surface flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px] text-primary">route</span>
        Acompanhamento Logístico em Tempo Real
      </span>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        ${etapas
          .map((et, i) => {
            const concluida = i < idxAtual;
            const atual = i === idxAtual;
            const estilo = concluida
              ? 'bg-tertiary-fixed/40 border-tertiary text-on-tertiary-fixed-variant'
              : atual
                ? 'bg-primary-fixed/50 border-primary text-on-primary-fixed font-semibold'
                : 'bg-surface-container-lowest border-surface-variant text-on-surface-variant opacity-60';
            return `
              <div class="p-3 rounded-lg border ${estilo} flex flex-col gap-1">
                <div class="flex items-center gap-1.5 font-label-md text-[12px]">
                  <span class="material-symbols-outlined text-[16px]">${et.icone}</span>
                  <span>${et.titulo}</span>
                </div>
                <span class="font-body-sm text-[11px]">${et.desc}</span>
              </div>
            `;
          })
          .join('')}
      </div>
      <div class="pt-1">
        <button type="button" onclick="simularAvancoEntrega('${pedido.codigo_pedido}')" class="px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant hover:border-primary text-on-surface font-label-md text-label-md flex items-center gap-1.5 transition-colors">
          <span class="material-symbols-outlined text-[16px] text-primary">local_shipping</span>
          Avançar Etapa Logística (Demonstração)
        </button>
      </div>
    </div>
  `;
}

async function dispararWebhookPix(codigoPedido, acao) {
  try {
    const resp = await fetch('/api/webhooks/pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_pedido: codigoPedido, acao })
    });
    const json = await resp.json();
    if (json.sucesso) {
      fecharModalSandbox();
      AppState.pedidoAtivo = json.dados;
      renderizarPainelPedidoAtivo(json.dados);
      await carregarPedidosRecentes();
      const sec = document.getElementById('meus-pedidos-sec');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      mostrarToast(
        acao === 'RECUSAR'
          ? 'Pagamento recusado no Sandbox. Tente novamente ou escolha outro método.'
          : 'Pagamento APROVADO no Sandbox e pedido liberado para preparo!'
      );
    }
  } catch (err) {
    console.error(err);
  }
}

async function simularAvancoEntrega(codigoPedido) {
  try {
    const resp = await fetch(`/api/pedidos/${codigoPedido}/avancar-entrega`, {
      method: 'POST'
    });
    const json = await resp.json();
    if (json.sucesso) {
      AppState.pedidoAtivo = json.dados;
      renderizarPainelPedidoAtivo(json.dados);
      await carregarPedidosRecentes();
      mostrarToast(`Status logístico atualizado: ${json.dados.status_entrega}`);
    }
  } catch (err) {
    console.error(err);
  }
}

async function buscarPedidoPorCodigoInput() {
  const codigo = document.getElementById('input-codigo-rastreio').value.trim();
  if (!codigo) {
    mostrarToast('Digite o código do pedido (ex: CG-2026-123456).');
    return;
  }
  await carregarPedidoEspecifico(codigo);
}

async function carregarPedidoEspecifico(codigo) {
  try {
    const resp = await fetch(`/api/pedidos/${encodeURIComponent(codigo)}`);
    const json = await resp.json();
    if (!json.sucesso) {
      mostrarToast(json.erro);
      return;
    }
    AppState.pedidoAtivo = json.dados;
    renderizarPainelPedidoAtivo(json.dados);
    navegarParaTela('pedidos');
  } catch (err) {
    console.error(err);
  }
}

async function carregarPedidosRecentes() {
  try {
    const resp = await fetch('/api/pedidos');
    const json = await resp.json();
    const container = document.getElementById('lista-pedidos-recentes');
    if (!container || !json.sucesso) return;

    if (json.dados.length === 0) {
      container.innerHTML = `<p class="font-body-sm text-body-sm text-on-surface-variant">Nenhum pedido registrado ainda. Adicione cupcakes na sacola para testar o fluxo completo.</p>`;
      return;
    }

    container.innerHTML = json.dados
      .map(
        (p) => `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-container-low px-3.5 py-2.5 rounded-lg">
          <div class="flex flex-col">
            <span class="font-label-lg text-label-lg text-on-surface">${p.codigo_pedido} &bull; ${p.cliente_nome}</span>
            <span class="font-body-sm text-[11px] text-on-surface-variant">
              ${p.quantidade_total} cupcake(s) &bull; ${p.embalagem_nome} &bull; ${p.metodo_pagamento}
            </span>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-label-md text-[11px] text-tertiary font-semibold">${p.status_entrega}</span>
            <span class="font-label-lg text-label-lg text-on-surface">${formatarMoeda(p.valor_total)}</span>
            <button type="button" onclick="carregarPedidoEspecifico('${p.codigo_pedido}')" class="px-2.5 py-1 rounded-md bg-surface-container-lowest text-primary font-label-md text-[11px] shadow-xs hover:bg-primary hover:text-on-primary transition-colors">
              Rastrear
            </button>
          </div>
        </div>
      `
      )
      .join('');
  } catch (err) {
    console.error(err);
  }
}

// === Utilitários ===
function copiarCodigoPix(codigo) {
  navigator.clipboard.writeText(codigo);
  mostrarToast('Código Pix Copia e Cola copiado!');
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function mostrarToast(mensagem) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast-enter bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-full font-label-md text-label-md shadow-lg flex items-center gap-2';
  el.innerHTML = `<span class="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">check_circle</span><span>${mensagem}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 3000);
}
