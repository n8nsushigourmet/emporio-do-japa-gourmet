/* Empório Japa Gourmet — Loja */

const WHATSAPP = '5532999975892';
const API_PRODUTOS   = '/api/produtos';
const API_CATEGORIAS = '/api/categorias';
const API_PEDIDO     = '/api/pedidos';
const API_CIDADES    = '/api/cidades';
const API_BAIRROS    = '/api/bairros';

/* ── Estado global ── */
const state = {
  produtos:         [],
  categorias:       [],
  cidades:          [],
  bairrosPorCidade: {},
  cart:             [],
  catAtiva:         'all',
  busca:            '',
  entrega: {
    tipo:   null,   // 'retirada' | 'domicilio'
    cidade: null,   // { id, nome }
    bairro: null,   // { id, nome, frete }
  },
};

/* ── Demo: cidades/bairros (fallback sem API) ── */
const DEMO_CIDADES = [
  { id: 1, nome: 'Carangola' },
  { id: 2, nome: 'Varinhas' },
  { id: 3, nome: 'Lacerdina' },
];
const DEMO_BAIRROS = {
  1: [
    { id: 1, nome: 'Centro',        frete: 7  },
    { id: 2, nome: 'São Cristóvão', frete: 7  },
    { id: 3, nome: 'Bom Jesus',     frete: 9  },
    { id: 4, nome: 'Rancho Fundo',  frete: 9  },
  ],
  2: [{ id: 5, nome: 'Centro', frete: 12 }],
  3: [{ id: 6, nome: 'Centro', frete: 12 }],
};

/* ── Utilitários ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function brl(v) {
  if (v === null || v === undefined) return 'a combinar';
  return 'R$ ' + Number(v).toFixed(2).replace('.', ',');
}

function normalizar(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function parsePesoUnit(label) {
  const m = (label || '').match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
  return m ? { base: parseFloat(m[1]), suffix: m[2] } : { base: 1, suffix: label || 'un' };
}

function pesoQtyValida(input, produto) {
  const qty = parseFloat(input.value);
  const min = produto.quantidade_minima || 1;
  const step = produto.multiplo_de || 1;
  const max = produto.quantidade_maxima;
  if (!qty || qty < min) return false;
  if (max && qty > max) return false;
  return (qty - min) % step === 0;
}

/* ── Dados demo (fallback quando a API não existe) ── */
const DEMO_CATEGORIAS = [
  { id: 1, nome: 'Kits Sushi Preguiçoso', slug: 'kits' },
  { id: 2, nome: 'Peixes e Frutos do Mar', slug: 'peixes' },
  { id: 3, nome: 'Algas', slug: 'algas' },
  { id: 4, nome: 'Temperos e Molhos', slug: 'temperos' },
  { id: 5, nome: 'Arroz e Bases', slug: 'arroz' },
  { id: 6, nome: 'Cream Cheese e Laticínios', slug: 'laticinios' },
  { id: 7, nome: 'Acessórios', slug: 'acessorios' },
];

const DEMO_PRODUTOS = [
  {
    id: 1, categoria_id: 2, nome: 'Salmão Fresco', descricao: 'Filé de salmão fresco, ideal para sashimi e sushi',
    tipo: 'variacao', destaque: 1, ativo: 1, promo: 0,
    foto: '', emoji: '🐟',
    variacoes: [
      { id: 1, rotulo: '100g', preco: 38 },
      { id: 2, rotulo: '200g', preco: 72 },
      { id: 3, rotulo: '500g', preco: 170 },
    ],
  },
  {
    id: 2, categoria_id: 3, nome: 'Alga Nori', descricao: 'Folhas de alga nori tostadas para temaki e hossomaki',
    tipo: 'simples', destaque: 1, ativo: 1, promo: 1,
    foto: '', emoji: '🌿',
    preco: 24, preco_original: 29, preco_promo: 24,
    variacoes: [],
  },
  {
    id: 3, categoria_id: 5, nome: 'Arroz para Sushi', descricao: 'Arroz japonês de grão curto, pacote 1kg',
    tipo: 'simples', destaque: 1, ativo: 1, promo: 0,
    foto: '', emoji: '🍚',
    preco: 18,
    variacoes: [],
  },
  {
    id: 4, categoria_id: 4, nome: 'Molho Shoyu', descricao: 'Shoyu tradicional japonês, garrafa 150ml',
    tipo: 'simples', destaque: 0, ativo: 1, promo: 0,
    foto: '', emoji: '🫙',
    preco: 12,
    variacoes: [],
  },
  {
    id: 5, categoria_id: 4, nome: 'Wasabi em Pasta', descricao: 'Pasta de wasabi pronta, bisnaga 43g',
    tipo: 'simples', destaque: 0, ativo: 1, promo: 0,
    foto: '', emoji: '🟢',
    preco: 9.9,
    variacoes: [],
  },
  {
    id: 6, categoria_id: 6, nome: 'Cream Cheese Philadelphia', descricao: 'Original, caixinha 150g',
    tipo: 'simples', destaque: 1, ativo: 1, promo: 0,
    foto: '', emoji: '🧀',
    preco: 14.5,
    variacoes: [],
  },
  {
    id: 7, categoria_id: 1, nome: 'Kit Sushi Preguiçoso Básico', descricao: 'Tudo que você precisa para seu primeiro rolinho',
    tipo: 'simples', destaque: 1, ativo: 1, promo: 0, is_kit: 1,
    foto: '', emoji: '🍣',
    preco: 89,
    variacoes: [],
  },
  {
    id: 8, categoria_id: 7, nome: 'Esteira de Bambu', descricao: 'Makisu tradicional para enrolar hosso e uramaki',
    tipo: 'simples', destaque: 0, ativo: 1, promo: 0,
    foto: '', emoji: '🎋',
    preco: 16,
    variacoes: [],
  },
  {
    id: 9, categoria_id: 3, nome: 'Alga Wakame', descricao: 'Alga desidratada para missoshiro e saladas',
    tipo: 'simples', destaque: 0, ativo: 1, promo: 0,
    foto: '', emoji: '🌊',
    preco: 15,
    variacoes: [],
  },
  {
    id: 10, categoria_id: 2, nome: 'Atum Fresco', descricao: 'Filé de atum fresco, ideal para temaki e niguiri',
    tipo: 'variacao', destaque: 0, ativo: 1, promo: 0,
    foto: '', emoji: '🐠',
    variacoes: [
      { id: 4, rotulo: '100g', preco: 42 },
      { id: 5, rotulo: '200g', preco: 80 },
    ],
  },
  {
    id: 11, categoria_id: 4, nome: 'Gengibre em Conserva', descricao: 'Gari tradicional para acompanhar o sushi',
    tipo: 'simples', destaque: 0, ativo: 1, promo: 0,
    foto: '', emoji: '🫚',
    preco: 11,
    variacoes: [],
  },
  {
    id: 12, categoria_id: 1, nome: 'Kit Sushi Completo', descricao: 'Kit avançado com ingredientes para janta completa',
    tipo: 'simples', destaque: 0, ativo: 1, promo: 1, is_kit: 1,
    foto: '', emoji: '🎌',
    preco: 149, preco_original: 179, preco_promo: 149,
    variacoes: [],
  },
];

/* ── Carregar dados ── */
async function carregarDados() {
  const toJson = r => r.ok ? r.json() : Promise.reject(r.status);
  const [resCats, resProd, resCids] = await Promise.allSettled([
    fetch(API_CATEGORIAS).then(toJson),
    fetch(API_PRODUTOS).then(toJson),
    fetch(API_CIDADES).then(toJson),
  ]);

  if (resCats.status === 'rejected') console.warn('[API categorias]', resCats.reason);
  if (resProd.status === 'rejected') console.warn('[API produtos]',   resProd.reason);
  if (resCids.status === 'rejected') console.warn('[API cidades]',    resCids.reason);

  state.categorias = resCats.status === 'fulfilled' ? resCats.value : DEMO_CATEGORIAS;
  state.produtos    = resProd.status === 'fulfilled' ? resProd.value : DEMO_PRODUTOS;
  state.cidades     = resCids.status === 'fulfilled' ? resCids.value : DEMO_CIDADES;

  renderizarTudo();
}

async function carregarBairros(cidadeId) {
  if (state.bairrosPorCidade[cidadeId]) return state.bairrosPorCidade[cidadeId];
  try {
    const res = await fetch(`${API_BAIRROS}?cidade_id=${cidadeId}`);
    if (!res.ok) throw new Error();
    const bairros = await res.json();
    state.bairrosPorCidade[cidadeId] = bairros;
    return bairros;
  } catch {
    const fallback = DEMO_BAIRROS[cidadeId] || [];
    state.bairrosPorCidade[cidadeId] = fallback;
    return fallback;
  }
}

/* ── Renderização ── */
function renderizarTudo() {
  $('#loading-state').hidden = true;
  renderizarCategorias();
  renderizarProdutos();
}

function renderizarCategorias() {
  const track = $('#cats-track');
  const catIds = [...new Set(state.produtos.map(p => p.categoria_id))];
  const cats = state.categorias.filter(c => catIds.includes(c.id));

  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-pill';
    btn.dataset.cat = cat.slug;
    btn.textContent = cat.nome;
    track.appendChild(btn);
  });

  track.addEventListener('click', e => {
    const btn = e.target.closest('.cat-pill');
    if (!btn) return;
    $$('.cat-pill', track).forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    state.catAtiva = btn.dataset.cat;
    renderizarProdutos();
  });
}

function produtosFiltrados() {
  let lista = state.produtos.filter(p => p.ativo);
  lista = lista.filter(p => p.tipo !== 'variacao' || (p.variacoes?.length > 0));

  if (state.busca) {
    const q = normalizar(state.busca);
    lista = lista.filter(p =>
      normalizar(p.nome).includes(q) ||
      (p.descricao && normalizar(p.descricao).includes(q))
    );
  } else if (state.catAtiva === 'destaques') {
    lista = lista.filter(p => p.destaque);
  } else if (state.catAtiva !== 'all') {
    const cat = state.categorias.find(c => c.slug === state.catAtiva);
    if (cat) lista = lista.filter(p => p.categoria_id === cat.id);
  }

  return lista;
}

function renderizarProdutos() {
  const container = $('#sections-container');
  const secDestaque = $('#section-destaques');
  const gridDestaque = $('#grid-destaques');
  const emptyState = $('#empty-state');
  container.innerHTML = '';

  const lista = produtosFiltrados();

  if (lista.length === 0) {
    secDestaque.hidden = true;
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  const mostraDestaques = !state.busca && (state.catAtiva === 'all' || state.catAtiva === 'destaques');
  const destaques = mostraDestaques ? lista.filter(p => p.destaque) : [];

  if (destaques.length > 0) {
    gridDestaque.innerHTML = '';
    destaques.forEach(p => gridDestaque.appendChild(criarCard(p)));
    secDestaque.hidden = false;
  } else {
    secDestaque.hidden = true;
  }

  if (state.catAtiva === 'destaques' || state.busca) {
    if (state.busca || destaques.length === 0) {
      const sec = criarSecao('Resultados', lista);
      container.appendChild(sec);
    }
    return;
  }

  const catIds = [...new Set(lista.map(p => p.categoria_id))];
  catIds.forEach(catId => {
    const cat = state.categorias.find(c => c.id === catId);
    const prods = lista.filter(p => p.categoria_id === catId);
    if (!cat || prods.length === 0) return;
    const sec = criarSecao(cat.nome, prods);
    container.appendChild(sec);
  });
}

function criarSecao(titulo, produtos) {
  const sec = document.createElement('section');
  sec.className = 'section';
  sec.innerHTML = `
    <h2 class="section-title">
      <span class="section-label">${titulo}</span>
      <span class="section-line" aria-hidden="true"></span>
    </h2>
    <div class="products-grid"></div>
  `;
  const grid = sec.querySelector('.products-grid');
  produtos.forEach(p => grid.appendChild(criarCard(p)));
  return sec;
}

function criarCard(produto) {
  const tpl = $('#tpl-card').content.cloneNode(true);
  const card = tpl.querySelector('.product-card');

  /* Imagem */
  const imgWrap = card.querySelector('.card-img-wrap');
  const fotos = produto.fotos?.length ? produto.fotos : (produto.foto ? [produto.foto] : []);
  const primeiraFoto = fotos[0] || null;
  if (primeiraFoto) {
    const img = card.querySelector('.card-img');
    img.src = primeiraFoto;
    img.alt = produto.nome;
  } else {
    card.querySelector('.card-img').remove();
    const ph = document.createElement('div');
    ph.className = 'card-img-placeholder';
    ph.textContent = produto.emoji || '🍱';
    imgWrap.insertBefore(ph, imgWrap.firstChild);
  }

  if (fotos.length > 1) {
    let cardFotoAtiva = 0;
    const imgEl = card.querySelector('.card-img');
    const chvL = '<svg viewBox="0 0 20 20" fill="none"><path d="M13 5L8 10l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const chvR = '<svg viewBox="0 0 20 20" fill="none"><path d="M7 5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    ['prev', 'next'].forEach(dir => {
      const btn = document.createElement('button');
      btn.className = `card-nav card-nav-${dir}`;
      btn.setAttribute('aria-label', dir === 'prev' ? 'Foto anterior' : 'Próxima foto');
      btn.innerHTML = dir === 'prev' ? chvL : chvR;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        cardFotoAtiva = dir === 'prev'
          ? (cardFotoAtiva - 1 + fotos.length) % fotos.length
          : (cardFotoAtiva + 1) % fotos.length;
        imgEl.style.opacity = '0';
        setTimeout(() => { imgEl.src = fotos[cardFotoAtiva]; imgEl.style.opacity = '1'; }, 150);
      });
      imgWrap.appendChild(btn);
    });
  }

  /* Badges */
  const badgesEl = card.querySelector('.card-badges');
  if (produto.is_kit)  badgesEl.insertAdjacentHTML('beforeend', '<span class="badge badge-kit">Kit</span>');
  if (produto.promo)   badgesEl.insertAdjacentHTML('beforeend', '<span class="badge badge-promo">Promoção</span>');
  if (produto.destaque && !produto.is_kit && !produto.promo)
    badgesEl.insertAdjacentHTML('beforeend', '<span class="badge badge-destaque">Destaque</span>');

  /* Textos */
  card.querySelector('.card-name').textContent = produto.nome;
  const descEl = card.querySelector('.card-desc');
  if (produto.descricao) descEl.textContent = produto.descricao;
  else descEl.remove();

  atualizarPrecoCard(card, produto);

  /* Botão adicionar */
  const addBtn = card.querySelector('.card-add-btn');
  if (produto.tipo === 'variacao' || produto.tipo === 'peso') {
    addBtn.addEventListener('click', (e) => { e.stopPropagation(); abrirModalProduto(produto); });
  } else {
    addBtn.addEventListener('click', () => adicionarAoCarrinho(produto, card, addBtn));
  }

  card.style.cursor = 'pointer';
  card.addEventListener('click', e => {
    if (e.target.closest('.card-add-btn, .peso-qty-input, .peso-hint-btn')) return;
    abrirModalProduto(produto);
  });

  return card;
}

function atualizarPrecoCard(card, produto) {
  const priceEl = card.querySelector('.card-price');
  priceEl.innerHTML = '';

  if (produto.tipo === 'variacao') {
    const menorPreco = produto.variacoes[0]?.preco;
    priceEl.insertAdjacentHTML('beforeend', `<span class="price-from">A partir de ${brl(menorPreco)}</span>`);
    priceEl.insertAdjacentHTML('beforeend', `<span class="price-ver-opcoes">Ver opções</span>`);
  } else if (produto.tipo === 'peso') {
    priceEl.insertAdjacentHTML('beforeend', `<span class="price-unit">${brl(produto.preco_unidade)}/${produto.unidade_label||'un'}</span>`);
    priceEl.insertAdjacentHTML('beforeend', `<span class="price-ver-opcoes">Escolher quantidade</span>`);
  } else if (produto.promo) {
    priceEl.insertAdjacentHTML('beforeend', `<span class="price-original">${brl(produto.preco_original)}</span>`);
    priceEl.insertAdjacentHTML('beforeend', `<span class="price-promo">${brl(produto.preco_promo)}</span>`);
  } else {
    priceEl.insertAdjacentHTML('beforeend', `<span class="price-normal">${brl(produto.preco)}</span>`);
  }
}

/* ── Carrinho ── */
function adicionarAoCarrinho(produto, card, addBtn) {
  let variacao = null;
  let preco;

  if (produto.tipo === 'variacao') {
    const sel = card.querySelector('.var-btn.selected');
    if (!sel) { sel = card.querySelector('.var-btn'); }
    const varId = sel?.dataset.varId;
    variacao = produto.variacoes.find(v => v.id === varId) || produto.variacoes[0];
    preco = variacao.preco;
  } else if (produto.tipo === 'peso') {
    const input = card.querySelector('.peso-qty-input');
    if (!input) return;
    const qty = parseFloat(input.value);
    const min = produto.quantidade_minima || 1;
    const max = produto.quantidade_maxima;
    if (!qty || qty < min || (max && qty > max)) return;
    const { base, suffix } = parsePesoUnit(produto.unidade_label);
    preco = (qty / base) * produto.preco_unidade;
    variacao = { rotulo: qty + suffix };
  } else if (produto.promo) {
    preco = produto.preco_promo;
  } else {
    preco = produto.preco;
  }

  const existente = state.cart.find(item =>
    item.produto.id === produto.id &&
    (item.produto.tipo === 'peso'
      ? item.variacao?.rotulo === variacao?.rotulo
      : item.variacao?.id === variacao?.id)
  );

  if (existente) {
    existente.quantidade++;
  } else {
    state.cart.push({ id: nextId(), produto, variacao, preco, quantidade: 1 });
  }

  addBtn.classList.add('added');
  setTimeout(() => addBtn.classList.remove('added'), 600);

  if (produto.tipo === 'peso') {
    const input = card.querySelector('.peso-qty-input');
    if (input) {
      input.value = '';
      atualizarPrecoCard(card, produto);
      setTimeout(() => { addBtn.disabled = true; }, 650);
    }
  }

  atualizarUICarrinho();
}

function removerItem(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  atualizarUICarrinho();
  renderizarItensModal();
  atualizarTotais();
}

function alterarQtd(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.quantidade += delta;
  if (item.quantidade <= 0) {
    removerItem(id);
    return;
  }
  atualizarUICarrinho();
  renderizarItensModal();
  atualizarTotais();
}

function totalItens() {
  return state.cart.reduce((s, i) => s + i.quantidade, 0);
}

function subtotal() {
  return state.cart.reduce((s, i) => s + i.preco * i.quantidade, 0);
}

function freteAtual() {
  if (!state.entrega.tipo) return null;
  if (state.entrega.tipo === 'retirada') return 0;
  if (state.entrega.bairro?.frete !== undefined) return state.entrega.bairro.frete;
  return null;
}

function totalFinal() {
  const f = freteAtual();
  return (f !== null) ? subtotal() + f : subtotal();
}

function atualizarUICarrinho() {
  const n = totalItens();
  const badge = $('#cart-badge');
  const cartFloat = $('#cart-float');
  const label = $('#cart-float-label');
  const totalEl = $('#cart-float-total');

  badge.textContent = n;
  badge.hidden = n === 0;

  if (n === 0) {
    cartFloat.hidden = true;
  } else {
    cartFloat.hidden = false;
    label.textContent = `Ver pedido (${n} ${n === 1 ? 'item' : 'itens'})`;
    totalEl.textContent = brl(subtotal());
  }
}

function renderizarItensModal() {
  const container = $('#modal-items');
  if (state.cart.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--texto-suave);padding:24px 0;font-size:14px;">Carrinho vazio.</p>';
    return;
  }
  container.innerHTML = '';
  state.cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';

    const imgSrc = item.produto.fotos?.[0] || item.produto.foto || '';
    const imgEl = imgSrc
      ? `<img class="cart-item-img" src="${imgSrc}" alt="${item.produto.nome}" loading="lazy">`
      : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--creme-escuro)">${item.produto.emoji || '🍱'}</div>`;

    const varLabel = item.variacao ? `<div class="cart-item-var">${item.variacao.rotulo}</div>` : '';

    el.innerHTML = `
      ${imgEl}
      <div class="cart-item-info">
        <div class="cart-item-name">${item.produto.nome}</div>
        ${varLabel}
        <div class="cart-item-controls">
          <button class="qty-btn remove" data-id="${item.id}" aria-label="Remover">✕</button>
          <button class="qty-btn" data-id="${item.id}" data-delta="-1" aria-label="Diminuir">−</button>
          <span class="qty-num">${item.quantidade}</span>
          <button class="qty-btn" data-id="${item.id}" data-delta="1" aria-label="Aumentar">+</button>
        </div>
      </div>
      <div class="cart-item-price">${brl(item.preco * item.quantidade)}</div>
    `;
    container.appendChild(el);
  });

  container.addEventListener('click', e => {
    const btn = e.target.closest('.qty-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('remove')) { removerItem(id); return; }
    alterarQtd(id, Number(btn.dataset.delta));
  });
}

function atualizarTotais() {
  const sub   = subtotal();
  const frete = freteAtual();

  $('#total-subtotal').textContent = brl(sub);

  if (!state.entrega.tipo) {
    $('#total-frete').textContent = '—';
    $('#total-final').textContent = brl(sub);
  } else if (state.entrega.tipo === 'retirada') {
    $('#total-frete').textContent = 'Grátis';
    $('#total-final').textContent = brl(sub);
  } else if (frete !== null) {
    $('#total-frete').textContent = brl(frete);
    $('#total-final').textContent = brl(sub + frete);
  } else {
    $('#total-frete').textContent = 'a consultar';
    $('#total-final').textContent = brl(sub);
  }

  $('#cart-float-total').textContent = brl(sub);
}

/* ── Entrega modal ── */
async function renderizarEntregaModal() {
  $$('.entrega-tipo-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tipo === state.entrega.tipo);
  });

  const isRetirada  = state.entrega.tipo === 'retirada';
  const isDomicilio = state.entrega.tipo === 'domicilio';

  $('#retirada-info').hidden    = !isRetirada;
  $('#domicilio-fields').hidden = !isDomicilio;

  if (!isDomicilio) return;

  const selCidade = $('#select-cidade');

  /* Populate cidade options once */
  if (selCidade.options.length <= 1) {
    state.cidades.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nome;
      selCidade.appendChild(opt);
    });
  }

  /* Restore saved cidade */
  selCidade.value = state.entrega.cidade?.id ?? '';

  if (state.entrega.cidade) {
    await popularBairros(state.entrega.cidade.id);
  } else {
    $('#select-bairro').hidden  = true;
    $('#frete-consultar').hidden = true;
  }
}

async function popularBairros(cidadeId) {
  const selBairro = $('#select-bairro');
  const bairros   = await carregarBairros(cidadeId);

  selBairro.innerHTML = '<option value="">Selecione o bairro…</option>';
  bairros.forEach(b => {
    const opt = document.createElement('option');
    opt.value       = b.id;
    opt.textContent = `${b.nome} — ${brl(b.frete)}`;
    opt.dataset.frete = b.frete;
    opt.dataset.nome  = b.nome;
    selBairro.appendChild(opt);
  });

  selBairro.value  = state.entrega.bairro?.id ?? '';
  selBairro.hidden = false;

  const hasBairro = bairros.length > 0;
  $('#frete-consultar').hidden = hasBairro;
}

/* ── Modal ── */
function abrirModal() {
  renderizarItensModal();
  renderizarEntregaModal();
  atualizarTotais();
  $('#modal-backdrop').hidden = false;
  $('#modal-sheet').hidden    = false;
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  $('#modal-backdrop').hidden = true;
  $('#modal-sheet').hidden    = true;
  document.body.style.overflow = '';
}

/* ── WhatsApp ── */
function gerarMensagem() {
  const { tipo, cidade, bairro } = state.entrega;
  const frete = freteAtual();
  const sub   = subtotal();

  let msg = '🍣 *Pedido — Empório Japa Gourmet*\n\n';

  state.cart.forEach(item => {
    if (item.produto.tipo === 'peso') {
      const qtdLabel = item.quantidade > 1 ? ` x${item.quantidade}` : '';
      msg += `• ${item.produto.nome} — ${item.variacao.rotulo}${qtdLabel} — ${brl(item.preco * item.quantidade)}\n`;
    } else {
      const varLabel = item.variacao ? ` (${item.variacao.rotulo})` : '';
      msg += `• ${item.produto.nome}${varLabel} x${item.quantidade} — ${brl(item.preco * item.quantidade)}\n`;
    }
  });

  msg += `\n*Subtotal:* ${brl(sub)}`;

  if (tipo === 'retirada') {
    msg += '\n*Entrega:* Retirada na loja (Grátis)';
    msg += `\n*Total:* ${brl(sub)}`;
    msg += '\n\n📍 Retirada: Rua Dr. Olímpio Teixeira, 290, Centro, Carangola/MG';
    msg += '\n🕐 Seg–Sáb · 17h às 23h';
  } else if (tipo === 'domicilio') {
    if (bairro && cidade) {
      msg += `\n*Entrega:* ${bairro.nome}, ${cidade.nome} — ${brl(frete)}`;
      msg += `\n*Total:* ${brl(sub + frete)}`;
    } else if (cidade) {
      msg += `\n*Entrega:* ${cidade.nome} — frete a confirmar`;
      msg += `\n*Total:* ${brl(sub)} + frete`;
    } else {
      msg += '\n*Entrega:* Domicílio — frete a confirmar';
      msg += `\n*Total:* ${brl(sub)} + frete`;
    }
  }

  return msg;
}

async function finalizarPedido() {
  if (state.cart.length === 0) return;

  if (!state.entrega.tipo) {
    alert('Escolha o tipo de entrega antes de finalizar.');
    return;
  }

  const msg   = gerarMensagem();
  const frete = freteAtual();
  const sub   = subtotal();

  /* Registrar pedido na API (silencioso) */
  try {
    await fetch(API_PEDIDO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo_entrega: state.entrega.tipo,
        cidade: state.entrega.cidade?.nome || null,
        bairro: state.entrega.bairro?.nome || null,
        subtotal: sub,
        frete: frete,
        total: frete !== null ? sub + frete : sub,
        whatsapp_msg: msg,
        itens: state.cart.map(i => ({
          produto_id: i.produto.id,
          variacao_id: i.variacao?.id || null,
          nome: i.produto.nome,
          variacao_label: i.variacao?.rotulo || null,
          preco: i.preco,
          quantidade: i.quantidade,
        })),
      }),
    });
  } catch { /* ignora se API não disponível */ }

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ── Modal de produto ── */
let _modalProduto = null;
let _pmFotoAtiva  = 0;
let _pmTouchX     = 0;

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function abrirModalProduto(produto) {
  _modalProduto = produto;
  _pmFotoAtiva  = 0;
  const overlay = $('#prod-modal-overlay');
  const body    = $('#prod-modal-body');

  const fotos = produto.fotos?.length ? produto.fotos : produto.foto ? [produto.foto] : [];

  const galHtml = fotos.length
    ? `<div class="pmodal-gallery">
         <div class="pmodal-gallery-main" id="pm-gal-main">
           <img id="pm-foto-main" src="${escHtml(fotos[0])}" alt="${escHtml(produto.nome)}">
         </div>
         ${fotos.length > 1
           ? `<div class="pmodal-thumbs" id="pm-thumbs">${fotos.map((u, i) =>
               `<button class="pmodal-thumb${i===0?' active':''}" data-idx="${i}"><img src="${escHtml(u)}" alt=""></button>`
             ).join('')}</div>`
           : ''}
       </div>`
    : `<div class="pmodal-gallery">
         <div class="pmodal-gallery-main pmodal-gallery-placeholder">
           <span>${produto.emoji || '🍱'}</span>
         </div>
       </div>`;

  /* Variations — pill style (label + price) */
  let varHtml = '';
  if (produto.tipo === 'variacao' && produto.variacoes?.length) {
    varHtml = `<div class="pmodal-pill-vars" id="pm-vars">${produto.variacoes.map((v, i) =>
      `<button class="pmodal-pill${i===0?' selected':''}" data-var-id="${v.id}" data-preco="${v.preco}">
         ${escHtml(v.rotulo)}&ensp;<strong>${brl(v.preco)}</strong>
       </button>`
    ).join('')}</div>`;
  } else if (produto.tipo === 'peso') {
    const { suffix } = parsePesoUnit(produto.unidade_label);
    const min = produto.quantidade_minima || 1;
    const step = produto.multiplo_de || 1;
    varHtml = `<div class="pmodal-peso">
      <div class="peso-row">
        <input type="number" class="peso-qty-input" id="pm-qty" min="${min}" step="${step}" placeholder="${min}" aria-label="Quantidade" inputmode="numeric" pattern="[0-9]*">
        <span class="peso-unit">${suffix}</span>
      </div>
      <div class="pm-qty-error" id="pm-qty-error" style="display:none"></div>
      <div class="peso-hint" id="pm-hint" style="display:none"></div>
    </div>`;
  }

  /* Initial footer price */
  let footerPrecoHtml;
  if (produto.tipo === 'peso') {
    footerPrecoHtml = `<span class="pmodal-footer-price">${brl(produto.preco_unidade)}/${produto.unidade_label||'un'}</span>`;
  } else if (produto.promo) {
    footerPrecoHtml = `<span class="pmodal-footer-price-orig">${brl(produto.preco_original)}</span>
                       <span class="pmodal-footer-price">${brl(produto.preco_promo)}</span>`;
  } else if (produto.tipo === 'variacao') {
    footerPrecoHtml = `<span class="pmodal-footer-price" id="pm-footer-price-val">${brl(produto.variacoes?.[0]?.preco)}</span>`;
  } else {
    footerPrecoHtml = `<span class="pmodal-footer-price">${brl(produto.preco)}</span>`;
  }

  body.innerHTML = `
    <div class="pmodal-handle" id="pmodal-handle"></div>
    <div class="pmodal-layout">
      <div class="pmodal-col-img">${galHtml}</div>
      <div class="pmodal-col-info">
        <div class="pmodal-scroll">
          <div class="pmodal-head">
            <h2 class="pmodal-nome">${escHtml(produto.nome)}</h2>
            ${produto.promo ? '<span class="badge badge-promo">Promoção</span>' : ''}
          </div>
          ${produto.categoria_nome ? `<div class="pmodal-cat">${escHtml(produto.categoria_nome)}</div>` : ''}
          ${varHtml}
          ${produto.descricao ? `<p class="pmodal-desc">${escHtml(produto.descricao)}</p>` : ''}
        </div>
        <div class="pmodal-footer">
          <div class="pmodal-footer-prices" id="pm-footer-prices">${footerPrecoHtml}</div>
          <button class="pmodal-add-btn" id="pm-add-btn"${produto.tipo === 'peso' ? ' disabled' : ''}>
            Adicionar ao carrinho
          </button>
        </div>
      </div>
    </div>`;

  /* Variation pill click: update selected + footer price */
  if (produto.tipo === 'variacao') {
    $$('#pm-vars .pmodal-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#pm-vars .pmodal-pill').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const fpv = $('#pm-footer-price-val');
        if (fpv) fpv.textContent = brl(Number(btn.dataset.preco));
      });
    });
  }

  /* Peso input */
  if (produto.tipo === 'peso') {
    const input  = $('#pm-qty');
    const hintEl = $('#pm-hint');
    const addBtn = $('#pm-add-btn');
    const fpPrices = $('#pm-footer-prices');
    const { suffix: sfx, base } = parsePesoUnit(produto.unidade_label);
    const step = produto.multiplo_de || 1;
    input.addEventListener('input', () => {
      const errorEl = $('#pm-qty-error');
      if (errorEl) errorEl.style.display = 'none';
      const qty = parseFloat(input.value);
      const min = produto.quantidade_minima || 1;
      const max = produto.quantidade_maxima;
      const valido = qty && qty >= min && (!max || qty <= max);
      addBtn.disabled = !valido;
      if (valido && produto.preco_unidade) {
        fpPrices.innerHTML = `<span class="pmodal-footer-price">${brl((qty / base) * produto.preco_unidade)}</span>`;
      } else {
        fpPrices.innerHTML = `<span class="pmodal-footer-price">${brl(produto.preco_unidade)}/${produto.unidade_label||'un'}</span>`;
      }
      if (valido && step > 1 && qty % step !== 0) {
        const sugerido = Math.ceil(qty / step) * step;
        hintEl.innerHTML = `💡 Sugerimos arredondar para ${sugerido}${sfx} <button class="peso-hint-btn" type="button">Usar ${sugerido}${sfx}</button>`;
        hintEl.style.display = '';
        hintEl.querySelector('.peso-hint-btn').addEventListener('click', () => {
          input.value = sugerido;
          input.dispatchEvent(new Event('input'));
        });
      } else {
        hintEl.style.display = 'none';
      }
    });
  }

  $('#pm-add-btn').addEventListener('click', pmAdicionarCarrinho);

  if (fotos.length > 1) {
    $$('#pm-thumbs .pmodal-thumb').forEach(btn => {
      btn.addEventListener('click', () => pmTrocarFoto(Number(btn.dataset.idx), fotos));
    });
    pmSetupSwipe(fotos);
  }

  pmSetupSwipeDown();

  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function fecharModalProduto() {
  const dialog = $('#prod-modal-dialog');
  if (dialog) { dialog.style.transform = ''; dialog.style.transition = ''; }
  $('#prod-modal-overlay').hidden = true;
  document.body.style.overflow = '';
  _modalProduto = null;
}

function pmTrocarFoto(idx, fotos) {
  _pmFotoAtiva = idx;
  const img = $('#pm-foto-main');
  if (img) img.src = fotos[idx];
  $$('#pm-thumbs .pmodal-thumb').forEach(t => t.classList.toggle('active', Number(t.dataset.idx) === idx));
}

function pmAdicionarCarrinho() {
  const produto = _modalProduto;
  if (!produto) return;
  let variacao = null, preco;

  if (produto.tipo === 'variacao') {
    const sel = $('#pm-vars .pmodal-pill.selected') || $('#pm-vars .pmodal-pill');
    variacao = produto.variacoes.find(v => String(v.id) === sel?.dataset.varId) || produto.variacoes[0];
    preco = variacao.preco;
  } else if (produto.tipo === 'peso') {
    const input = $('#pm-qty');
    const qty = parseFloat(input?.value);
    const min = produto.quantidade_minima || 1;
    const max = produto.quantidade_maxima;
    const errorEl = $('#pm-qty-error');
    if (!qty || qty < min) {
      if (errorEl) {
        const { suffix: sfx } = parsePesoUnit(produto.unidade_label);
        errorEl.textContent = `Quantidade mínima: ${min}${sfx}`;
        errorEl.style.display = '';
      }
      return;
    }
    if (max && qty > max) {
      if (errorEl) {
        const { suffix: sfx } = parsePesoUnit(produto.unidade_label);
        errorEl.textContent = `Quantidade máxima: ${max}${sfx}`;
        errorEl.style.display = '';
      }
      return;
    }
    if (errorEl) errorEl.style.display = 'none';
    const { base, suffix } = parsePesoUnit(produto.unidade_label);
    preco = (qty / base) * produto.preco_unidade;
    variacao = { rotulo: qty + suffix };
  } else if (produto.promo) {
    preco = produto.preco_promo;
  } else {
    preco = produto.preco;
  }

  const existente = state.cart.find(item =>
    item.produto.id === produto.id &&
    (produto.tipo === 'peso'
      ? item.variacao?.rotulo === variacao?.rotulo
      : item.variacao?.id === variacao?.id)
  );
  if (existente) existente.quantidade++;
  else state.cart.push({ id: nextId(), produto, variacao, preco, quantidade: 1 });

  atualizarUICarrinho();
  fecharModalProduto();
  abrirModal();
}

function pmSetupSwipe(fotos) {
  const main = $('#pm-gal-main');
  if (!main) return;
  main.addEventListener('touchstart', e => { _pmTouchX = e.touches[0].clientX; }, { passive: true });
  main.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - _pmTouchX;
    if (Math.abs(dx) < 40) return;
    const next = dx < 0
      ? Math.min(_pmFotoAtiva + 1, fotos.length - 1)
      : Math.max(_pmFotoAtiva - 1, 0);
    if (next !== _pmFotoAtiva) pmTrocarFoto(next, fotos);
  }, { passive: true });
}

function pmSetupSwipeDown() {
  const dialog = $('#prod-modal-dialog');
  const handle = $('#pmodal-handle');
  if (!handle || !dialog) return;
  let startY = 0, delta = 0;
  handle.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
    delta = 0;
    dialog.style.transition = 'none';
  }, { passive: true });
  handle.addEventListener('touchmove', e => {
    delta = e.touches[0].clientY - startY;
    if (delta > 0) dialog.style.transform = `translateY(${delta}px)`;
  }, { passive: true });
  handle.addEventListener('touchend', () => {
    dialog.style.transition = '';
    if (delta > 80) fecharModalProduto();
    else dialog.style.transform = '';
  });
}

/* ── Busca ── */
const onBusca = debounce(q => {
  state.busca = q.trim();
  if (state.busca) {
    $$('.cat-pill').forEach(p => p.classList.remove('active'));
    state.catAtiva = '';
  } else {
    const allPill = $('.cat-pill[data-cat="all"]');
    if (allPill) {
      allPill.classList.add('active');
      state.catAtiva = 'all';
    }
  }
  renderizarProdutos();
}, 250);

/* ── Eventos ── */
function iniciarEventos() {
  /* Header: busca */
  $('#search-input').addEventListener('input', e => onBusca(e.target.value));

  /* Header: abrir modal */
  $('#cart-btn').addEventListener('click', () => {
    if (state.cart.length > 0) abrirModal();
  });

  /* Barra flutuante: abrir modal */
  $('#cart-float-btn').addEventListener('click', abrirModal);

  /* Fechar modal carrinho */
  $('#modal-close').addEventListener('click', fecharModal);
  $('#modal-backdrop').addEventListener('click', fecharModal);

  /* Fechar modal produto */
  $('#prod-modal-close').addEventListener('click', fecharModalProduto);
  $('#prod-modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) fecharModalProduto();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#prod-modal-overlay').hidden) fecharModalProduto();
    else fecharModal();
  });

  /* Tipo de entrega */
  $$('.entrega-tipo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.entrega.tipo   = btn.dataset.tipo;
      state.entrega.bairro = null;
      if (btn.dataset.tipo === 'retirada') state.entrega.cidade = null;
      renderizarEntregaModal();
      atualizarTotais();
    });
  });

  /* Cidade select */
  $('#select-cidade').addEventListener('change', async e => {
    const cidadeId = e.target.value;
    if (!cidadeId) {
      state.entrega.cidade = null;
      state.entrega.bairro = null;
      $('#select-bairro').hidden  = true;
      $('#frete-consultar').hidden = true;
      atualizarTotais();
      return;
    }
    const cidade = state.cidades.find(c => c.id === cidadeId);
    state.entrega.cidade = cidade || { id: cidadeId, nome: e.target.options[e.target.selectedIndex].text };
    state.entrega.bairro = null;
    await popularBairros(cidadeId);
    atualizarTotais();
  });

  /* Bairro select */
  $('#select-bairro').addEventListener('change', e => {
    const bairroId = Number(e.target.value);
    if (!bairroId) {
      state.entrega.bairro = null;
    } else {
      const opt = e.target.options[e.target.selectedIndex];
      state.entrega.bairro = {
        id:    bairroId,
        nome:  opt.dataset.nome,
        frete: Number(opt.dataset.frete),
      };
    }
    atualizarTotais();
  });

  /* WhatsApp */
  $('#btn-whatsapp').addEventListener('click', finalizarPedido);
}

/* ── Init ── */
iniciarEventos();
carregarDados();
