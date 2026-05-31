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
  try {
    const [resCats, resProd, resCids] = await Promise.all([
      fetch(API_CATEGORIAS),
      fetch(API_PRODUTOS),
      fetch(API_CIDADES),
    ]);
    if (!resCats.ok || !resProd.ok || !resCids.ok) throw new Error('API indisponível');
    state.categorias = await resCats.json();
    state.produtos    = await resProd.json();
    state.cidades     = await resCids.json();
  } catch {
    state.categorias = DEMO_CATEGORIAS;
    state.produtos    = DEMO_PRODUTOS;
    state.cidades     = DEMO_CIDADES;
  }
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
  if (produto.foto) {
    const img = card.querySelector('.card-img');
    img.src = produto.foto;
    img.alt = produto.nome;
  } else {
    card.querySelector('.card-img').remove();
    const ph = document.createElement('div');
    ph.className = 'card-img-placeholder';
    ph.textContent = produto.emoji || '🍱';
    imgWrap.insertBefore(ph, imgWrap.firstChild);
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

  /* Variações */
  const varWrap = card.querySelector('.card-variations');
  if (produto.tipo === 'variacao' && produto.variacoes?.length) {
    varWrap.hidden = false;
    produto.variacoes.forEach((v, i) => {
      const btn = document.createElement('button');
      btn.className = 'var-btn' + (i === 0 ? ' selected' : '');
      btn.dataset.varId = v.id;
      btn.dataset.preco = v.preco;
      btn.textContent = v.rotulo;
      btn.addEventListener('click', () => {
        $$('.var-btn', varWrap).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        atualizarPrecoCard(card, produto);
      });
      varWrap.appendChild(btn);
    });
  }

  /* Peso/Quantidade */
  if (produto.tipo === 'peso') {
    const { suffix } = parsePesoUnit(produto.unidade_label);
    const min = produto.quantidade_minima || 1;
    const step = produto.multiplo_de || 1;
    const pesoWrap = document.createElement('div');
    pesoWrap.className = 'card-peso';
    pesoWrap.innerHTML = `<div class="peso-row"><input type="number" class="peso-qty-input" min="${min}" step="${step}" placeholder="${min}" aria-label="Quantidade"><span class="peso-unit">${suffix}</span></div>`;
    card.querySelector('.card-body').insertBefore(pesoWrap, card.querySelector('.card-footer'));
  }

  atualizarPrecoCard(card, produto);

  /* Botão adicionar */
  const addBtn = card.querySelector('.card-add-btn');
  if (produto.tipo === 'peso') {
    addBtn.disabled = true;
    const qtyInput = card.querySelector('.peso-qty-input');
    qtyInput.addEventListener('input', () => {
      atualizarPrecoCard(card, produto);
      addBtn.disabled = !pesoQtyValida(qtyInput, produto);
    });
  }
  addBtn.addEventListener('click', () => adicionarAoCarrinho(produto, card, addBtn));

  return card;
}

function atualizarPrecoCard(card, produto) {
  const priceEl = card.querySelector('.card-price');
  priceEl.innerHTML = '';

  if (produto.tipo === 'variacao') {
    const sel = card.querySelector('.var-btn.selected');
    const preco = sel ? Number(sel.dataset.preco) : produto.variacoes[0]?.preco;
    priceEl.insertAdjacentHTML('beforeend', `<span class="price-normal">${brl(preco)}</span>`);
  } else if (produto.tipo === 'peso') {
    const input = card.querySelector('.peso-qty-input');
    const qty = input ? parseFloat(input.value) : 0;
    const { base } = parsePesoUnit(produto.unidade_label);
    if (qty > 0 && produto.preco_unidade != null) {
      priceEl.insertAdjacentHTML('beforeend', `<span class="price-normal">${brl((qty / base) * produto.preco_unidade)}</span>`);
    } else {
      priceEl.insertAdjacentHTML('beforeend', `<span class="price-unit">${brl(produto.preco_unidade)}/${produto.unidade_label||'un'}</span>`);
    }
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
    if (!input || !pesoQtyValida(input, produto)) return;
    const qty = parseFloat(input.value);
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

    const imgSrc = item.produto.foto || '';
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

  /* Fechar modal */
  $('#modal-close').addEventListener('click', fecharModal);
  $('#modal-backdrop').addEventListener('click', fecharModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });

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
