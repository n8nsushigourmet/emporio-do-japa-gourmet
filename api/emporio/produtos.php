<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
requireAuth();

$db = db();
$acao = $_GET['acao'] ?? 'listar';

/* ══════════════════════════════════
   SALVAR (criar / editar)
══════════════════════════════════ */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $id = (int) ($_POST['id'] ?? 0);

    $dados = [
        'categoria_id'   => $_POST['categoria_id'] ? (int)$_POST['categoria_id'] : null,
        'nome'           => trim($_POST['nome'] ?? ''),
        'descricao'      => trim($_POST['descricao'] ?? '') ?: null,
        'tipo'           => in_array($_POST['tipo'] ?? '', ['simples','variacao']) ? $_POST['tipo'] : 'simples',
        'preco'          => is_numeric($_POST['preco'] ?? '') ? (float)$_POST['preco'] : null,
        'destaque'       => isset($_POST['destaque']) ? 1 : 0,
        'ativo'          => isset($_POST['ativo']) ? 1 : 0,
        'promo'          => isset($_POST['promo']) ? 1 : 0,
        'preco_original' => is_numeric($_POST['preco_original'] ?? '') ? (float)$_POST['preco_original'] : null,
        'preco_promo'    => is_numeric($_POST['preco_promo'] ?? '')    ? (float)$_POST['preco_promo']    : null,
        'promo_inicio'   => $_POST['promo_inicio'] ?: null,
        'promo_fim'      => $_POST['promo_fim']    ?: null,
    ];

    // Upload de imagem
    $fotoAtual = $_POST['foto_atual'] ?? null;
    if (!empty($_FILES['foto']['name'])) {
        $novaFoto = uploadImagem($_FILES['foto']);
        if ($novaFoto) {
            if ($fotoAtual) deletarImagem($fotoAtual);
            $dados['foto'] = $novaFoto;
        }
    } else {
        $dados['foto'] = $fotoAtual;
    }

    if ($id) {
        // UPDATE
        $cols = implode(', ', array_map(fn($k) => "$k=?", array_keys($dados)));
        $vals = array_values($dados);
        $vals[] = $id;
        $db->prepare("UPDATE produtos SET $cols WHERE id=?")->execute($vals);
    } else {
        // INSERT
        $cols = implode(', ', array_keys($dados));
        $phs  = implode(', ', array_fill(0, count($dados), '?'));
        $st   = $db->prepare("INSERT INTO produtos ($cols) VALUES ($phs)");
        $st->execute(array_values($dados));
        $id = (int) $db->lastInsertId();
    }

    // Variações
    if ($dados['tipo'] === 'variacao') {
        $db->prepare('DELETE FROM variacoes WHERE produto_id=?')->execute([$id]);
        $rotulos = $_POST['var_rotulo'] ?? [];
        $precos  = $_POST['var_preco']  ?? [];
        foreach ($rotulos as $i => $rot) {
            $rot = trim($rot);
            $prc = is_numeric($precos[$i] ?? '') ? (float)$precos[$i] : null;
            if ($rot && $prc !== null) {
                $db->prepare('INSERT INTO variacoes (produto_id, rotulo, preco) VALUES (?,?,?)')
                   ->execute([$id, $rot, $prc]);
            }
        }
    } else {
        $db->prepare('DELETE FROM variacoes WHERE produto_id=?')->execute([$id]);
    }

    flash('success', $id ? 'Produto salvo.' : 'Produto criado.');
    header('Location: /emporio/produtos.php');
    exit;
}

/* ══════════════════════════════════
   AÇÕES RÁPIDAS (toggle / excluir)
══════════════════════════════════ */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['toggle'])) {
    // CSRF via GET não ideal, mas é uma ação simples de admin interno
    $id = (int) $_GET['toggle'];
    $db->prepare('UPDATE produtos SET ativo = 1 - ativo WHERE id=?')->execute([$id]);
    header('Location: /emporio/produtos.php');
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['excluir'])) {
    $id = (int) $_GET['excluir'];
    $row = $db->prepare('SELECT foto FROM produtos WHERE id=?');
    $row->execute([$id]);
    $p = $row->fetch();
    if ($p) {
        if ($p['foto']) deletarImagem($p['foto']);
        $db->prepare('DELETE FROM produtos WHERE id=?')->execute([$id]);
        flash('success', 'Produto excluído.');
    }
    header('Location: /emporio/produtos.php');
    exit;
}

/* ══════════════════════════════════
   FORMULÁRIO criar / editar
══════════════════════════════════ */
if ($acao === 'novo' || $acao === 'editar') {
    $pageTitle = $acao === 'novo' ? 'Novo produto' : 'Editar produto';
    $pagAtiva  = 'produtos';

    $prod = null;
    $vars = [];
    if ($acao === 'editar') {
        $editId = (int) ($_GET['id'] ?? 0);
        $prod   = $db->prepare('SELECT * FROM produtos WHERE id=?');
        $prod->execute([$editId]);
        $prod   = $prod->fetch();
        if (!$prod) { header('Location: /emporio/produtos.php'); exit; }
        $varsQ  = $db->prepare('SELECT * FROM variacoes WHERE produto_id=? ORDER BY id');
        $varsQ->execute([$editId]);
        $vars   = $varsQ->fetchAll();
    }

    $categorias = $db->query('SELECT id, nome FROM categorias WHERE ativo=1 ORDER BY ordem')->fetchAll();

    ob_start();
    ?>
    <a href="/emporio/produtos.php" class="btn btn-secondary btn-sm" style="margin-bottom:20px">
      ← Voltar
    </a>
    <?php
    $topbarActions = ob_get_clean();
    require_once __DIR__ . '/includes/head.php';
    ?>

    <form method="POST" enctype="multipart/form-data">
      <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
      <input type="hidden" name="id" value="<?= (int)($prod['id'] ?? 0) ?>">
      <input type="hidden" name="foto_atual" value="<?= h($prod['foto'] ?? '') ?>">

      <div style="display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start">

        <!-- Coluna esquerda -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Básico -->
          <div class="card">
            <div class="card-title">Informações básicas</div>
            <div style="display:flex;flex-direction:column;gap:14px">
              <div class="form-group">
                <label>Nome *</label>
                <input type="text" name="nome" value="<?= h($prod['nome'] ?? '') ?>" required>
              </div>
              <div class="form-group">
                <label>Descrição</label>
                <textarea name="descricao" rows="3"><?= h($prod['descricao'] ?? '') ?></textarea>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Categoria</label>
                  <select name="categoria_id">
                    <option value="">— sem categoria —</option>
                    <?php foreach ($categorias as $cat): ?>
                    <option value="<?= $cat['id'] ?>"
                      <?= ($prod['categoria_id'] ?? '') == $cat['id'] ? 'selected' : '' ?>>
                      <?= h($cat['nome']) ?>
                    </option>
                    <?php endforeach; ?>
                  </select>
                </div>
                <div class="form-group">
                  <label>Tipo</label>
                  <select name="tipo" id="tipo-select">
                    <option value="simples"  <?= ($prod['tipo'] ?? 'simples') === 'simples'  ? 'selected' : '' ?>>Simples (preço único)</option>
                    <option value="variacao" <?= ($prod['tipo'] ?? '') === 'variacao' ? 'selected' : '' ?>>Com variações (ex: 100g / 200g)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Preço simples -->
          <div class="card" id="secao-preco-simples" <?= ($prod['tipo'] ?? 'simples') === 'variacao' ? 'style="display:none"' : '' ?>>
            <div class="card-title">Preço</div>
            <div class="form-grid">
              <div class="form-group">
                <label>Preço (R$) *</label>
                <input type="number" name="preco" step="0.01" min="0"
                       value="<?= h($prod['preco'] ?? '') ?>" placeholder="0,00">
              </div>
            </div>
          </div>

          <!-- Variações -->
          <div class="card" id="secao-variacoes" <?= ($prod['tipo'] ?? 'simples') !== 'variacao' ? 'style="display:none"' : '' ?>>
            <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
              Variações
              <button type="button" class="btn btn-secondary btn-sm" id="add-var-btn">+ Adicionar</button>
            </div>
            <div class="variations-list" id="variacoes-list">
              <?php if ($vars): ?>
                <?php foreach ($vars as $v): ?>
                <div class="var-row">
                  <input type="text"   name="var_rotulo[]" value="<?= h($v['rotulo']) ?>" placeholder="Rótulo (ex: 200g)">
                  <input type="number" name="var_preco[]"  value="<?= h($v['preco'])  ?>" placeholder="Preço" step="0.01" min="0">
                  <button type="button" class="btn-icon danger remove-var-btn" title="Remover">
                    <svg viewBox="0 0 16 16" fill="none"><path d="M4 8h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  </button>
                </div>
                <?php endforeach; ?>
              <?php else: ?>
                <div class="var-row">
                  <input type="text"   name="var_rotulo[]" placeholder="Rótulo (ex: 200g)">
                  <input type="number" name="var_preco[]"  placeholder="Preço" step="0.01" min="0">
                  <button type="button" class="btn-icon danger remove-var-btn" title="Remover">
                    <svg viewBox="0 0 16 16" fill="none"><path d="M4 8h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  </button>
                </div>
              <?php endif; ?>
            </div>
          </div>

          <!-- Promoção -->
          <div class="card">
            <div class="card-title">Promoção</div>
            <div style="display:flex;flex-direction:column;gap:12px">
              <label class="toggle-row">
                <div>
                  <div class="toggle-label">Em promoção</div>
                  <div class="toggle-sub">Exibe badge e preço riscado na loja</div>
                </div>
                <label class="toggle">
                  <input type="checkbox" name="promo" value="1" id="promo-check"
                         <?= ($prod['promo'] ?? 0) ? 'checked' : '' ?>>
                  <span class="toggle-track"></span>
                </label>
              </label>

              <div id="secao-promo-campos" <?= !($prod['promo'] ?? 0) ? 'style="display:none"' : '' ?>>
                <div class="form-grid form-grid-3">
                  <div class="form-group">
                    <label>Preço original (R$)</label>
                    <input type="number" name="preco_original" step="0.01" min="0"
                           value="<?= h($prod['preco_original'] ?? '') ?>">
                  </div>
                  <div class="form-group">
                    <label>Preço promocional (R$)</label>
                    <input type="number" name="preco_promo" step="0.01" min="0"
                           value="<?= h($prod['preco_promo'] ?? '') ?>">
                  </div>
                </div>
                <div class="form-grid mt-16">
                  <div class="form-group">
                    <label>Início da promoção</label>
                    <input type="date" name="promo_inicio" value="<?= h($prod['promo_inicio'] ?? '') ?>">
                  </div>
                  <div class="form-group">
                    <label>Fim da promoção</label>
                    <input type="date" name="promo_fim" value="<?= h($prod['promo_fim'] ?? '') ?>">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna direita -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Foto -->
          <div class="card">
            <div class="card-title">Foto do produto</div>
            <div class="img-upload-wrap" style="flex-direction:column;gap:12px">
              <div class="img-preview" id="img-preview">
                <?php if (!empty($prod['foto'])): ?>
                  <img src="<?= h(UPLOAD_URL . $prod['foto']) ?>" alt="">
                <?php else: ?>🍱<?php endif; ?>
              </div>
              <label class="img-upload-label">
                <svg viewBox="0 0 16 16" fill="none"><path d="M8 1v8M5 6l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                Escolher imagem
                <input type="file" name="foto" id="foto-input" accept="image/*">
              </label>
              <span class="form-hint">JPG, PNG ou WebP · máx 5MB · convertido para WebP</span>
            </div>
          </div>

          <!-- Opções -->
          <div class="card">
            <div class="card-title">Opções</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <label class="toggle-row">
                <div class="toggle-label">Produto ativo</div>
                <label class="toggle">
                  <input type="checkbox" name="ativo" value="1"
                         <?= ($prod['ativo'] ?? 1) ? 'checked' : '' ?>>
                  <span class="toggle-track"></span>
                </label>
              </label>
              <label class="toggle-row">
                <div>
                  <div class="toggle-label">Destaque</div>
                  <div class="toggle-sub">Aparece na seção de destaques</div>
                </div>
                <label class="toggle">
                  <input type="checkbox" name="destaque" value="1"
                         <?= ($prod['destaque'] ?? 0) ? 'checked' : '' ?>>
                  <span class="toggle-track"></span>
                </label>
              </label>
            </div>
          </div>

          <!-- Ações -->
          <div style="display:flex;flex-direction:column;gap:8px">
            <button type="submit" class="btn btn-primary" style="width:100%;height:44px;font-size:15px">
              <?= isset($prod) && $prod ? 'Salvar alterações' : 'Criar produto' ?>
            </button>
            <a href="/emporio/produtos.php" class="btn btn-secondary" style="width:100%;justify-content:center">
              Cancelar
            </a>
          </div>
        </div>
      </div>
    </form>

    <script>
    // Tipo simples ↔ variação
    document.getElementById('tipo-select').addEventListener('change', function () {
      const isVar = this.value === 'variacao';
      document.getElementById('secao-preco-simples').style.display = isVar ? 'none' : '';
      document.getElementById('secao-variacoes').style.display     = isVar ? '' : 'none';
    });

    // Toggle promoção
    document.getElementById('promo-check').addEventListener('change', function () {
      document.getElementById('secao-promo-campos').style.display = this.checked ? '' : 'none';
    });

    // Adicionar variação
    document.getElementById('add-var-btn').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'var-row';
      row.innerHTML = `
        <input type="text"   name="var_rotulo[]" placeholder="Rótulo (ex: 500g)">
        <input type="number" name="var_preco[]"  placeholder="Preço" step="0.01" min="0">
        <button type="button" class="btn-icon danger remove-var-btn" title="Remover">
          <svg viewBox="0 0 16 16" fill="none"><path d="M4 8h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>`;
      document.getElementById('variacoes-list').appendChild(row);
      row.querySelector('input').focus();
    });

    // Remover variação
    document.getElementById('variacoes-list').addEventListener('click', e => {
      if (e.target.closest('.remove-var-btn')) {
        const rows = document.querySelectorAll('#variacoes-list .var-row');
        if (rows.length > 1) e.target.closest('.var-row').remove();
      }
    });

    // Preview imagem
    document.getElementById('foto-input').addEventListener('change', function () {
      if (!this.files[0]) return;
      const reader = new FileReader();
      reader.onload = e => {
        const prev = document.getElementById('img-preview');
        prev.innerHTML = `<img src="${e.target.result}" alt="" style="width:100%;height:100%;object-fit:cover">`;
      };
      reader.readAsDataURL(this.files[0]);
    });
    </script>

    <?php require_once __DIR__ . '/includes/foot.php';
    exit;
}

/* ══════════════════════════════════
   LISTAGEM
══════════════════════════════════ */
$pageTitle = 'Produtos';
$pagAtiva  = 'produtos';

$busca  = trim($_GET['q'] ?? '');
$catFil = (int) ($_GET['cat'] ?? 0);
$pagina = max(1, (int) ($_GET['p'] ?? 1));
$porPag = 20;

$where  = '1=1';
$params = [];
if ($busca) {
    $where .= ' AND p.nome LIKE ?';
    $params[] = "%$busca%";
}
if ($catFil) {
    $where .= ' AND p.categoria_id = ?';
    $params[] = $catFil;
}

$total = (int) $db->prepare("SELECT COUNT(*) FROM produtos p WHERE $where")
                  ->execute($params) ? $db->prepare("SELECT COUNT(*) FROM produtos p WHERE $where")->execute($params) && 1 : 0;

// Refetch with proper count
$stCount = $db->prepare("SELECT COUNT(*) FROM produtos p WHERE $where");
$stCount->execute($params);
$total = (int) $stCount->fetchColumn();

$offset = ($pagina - 1) * $porPag;
$stProd = $db->prepare(
    "SELECT p.*, c.nome AS cat_nome
     FROM produtos p
     LEFT JOIN categorias c ON c.id = p.categoria_id
     WHERE $where
     ORDER BY p.criado_em DESC
     LIMIT $porPag OFFSET $offset"
);
$stProd->execute($params);
$produtos = $stProd->fetchAll();

$categorias = $db->query('SELECT id, nome FROM categorias WHERE ativo=1 ORDER BY ordem')->fetchAll();
$totalPags  = (int) ceil($total / $porPag);

ob_start();
?>
<a href="/emporio/produtos.php?acao=novo" class="btn btn-primary">
  <svg viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
  Novo produto
</a>
<?php
$topbarActions = ob_get_clean();
require_once __DIR__ . '/includes/head.php';
?>

<!-- Filtros -->
<form method="GET" class="filter-bar" style="margin-bottom:16px">
  <input type="search" name="q" value="<?= h($busca) ?>" placeholder="Buscar por nome…">
  <select name="cat">
    <option value="">Todas as categorias</option>
    <?php foreach ($categorias as $c): ?>
    <option value="<?= $c['id'] ?>" <?= $catFil === (int)$c['id'] ? 'selected' : '' ?>><?= h($c['nome']) ?></option>
    <?php endforeach; ?>
  </select>
  <button type="submit" class="btn btn-secondary">Filtrar</button>
  <?php if ($busca || $catFil): ?>
  <a href="/emporio/produtos.php" class="btn btn-secondary">Limpar</a>
  <?php endif; ?>
</form>

<div class="table-wrap">
  <div class="table-toolbar flex flex-between">
    <span class="fw-600"><?= $total ?> produto<?= $total !== 1 ? 's' : '' ?></span>
  </div>

  <?php if (empty($produtos)): ?>
  <div class="empty-msg"><span>📦</span>Nenhum produto encontrado.</div>
  <?php else: ?>
  <table>
    <thead>
      <tr>
        <th style="width:52px">Foto</th>
        <th>Nome</th>
        <th>Categoria</th>
        <th>Tipo</th>
        <th>Preço</th>
        <th>Status</th>
        <th style="width:130px"></th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($produtos as $p): ?>
      <tr>
        <td>
          <?php if ($p['foto']): ?>
          <img src="<?= h(UPLOAD_URL . $p['foto']) ?>" alt=""
               style="width:40px;height:40px;border-radius:6px;object-fit:cover">
          <?php else: ?>
          <div style="width:40px;height:40px;border-radius:6px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:18px">🍱</div>
          <?php endif; ?>
        </td>
        <td>
          <div class="fw-600"><?= h($p['nome']) ?></div>
          <?php if ($p['destaque']): ?><span class="badge badge-destaque" style="font-size:10px">Destaque</span><?php endif; ?>
          <?php if (promoAtiva($p)):  ?><span class="badge badge-promo"   style="font-size:10px">Promo</span><?php endif; ?>
        </td>
        <td class="text-dim"><?= h($p['cat_nome'] ?? '—') ?></td>
        <td class="text-dim"><?= $p['tipo'] === 'variacao' ? 'Variações' : 'Simples' ?></td>
        <td class="fw-600"><?= precoDisplay($p) ?></td>
        <td>
          <span class="badge <?= $p['ativo'] ? 'badge-ativo' : 'badge-inativo' ?>">
            <?= $p['ativo'] ? 'Ativo' : 'Inativo' ?>
          </span>
        </td>
        <td>
          <div class="td-actions">
            <a href="/emporio/produtos.php?acao=editar&id=<?= $p['id'] ?>" class="btn-icon" title="Editar">
              <svg viewBox="0 0 16 16" fill="none"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
            </a>
            <a href="/emporio/produtos.php?toggle=<?= $p['id'] ?>" class="btn-icon" title="<?= $p['ativo'] ? 'Desativar' : 'Ativar' ?>">
              <svg viewBox="0 0 16 16" fill="none">
                <?php if ($p['ativo']): ?>
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 5v3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                <?php else: ?>
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 8l1.5 1.5L10.5 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                <?php endif; ?>
              </svg>
            </a>
            <a href="/emporio/produtos.php?excluir=<?= $p['id'] ?>" class="btn-icon danger"
               title="Excluir" onclick="return confirm('Excluir este produto?')">
              <svg viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>

  <!-- Paginação -->
  <?php if ($totalPags > 1): ?>
  <div class="pagination">
    <?php for ($i = 1; $i <= $totalPags; $i++): ?>
    <a href="?p=<?= $i ?>&q=<?= urlencode($busca) ?>&cat=<?= $catFil ?>"
       class="page-btn <?= $i === $pagina ? 'active' : '' ?>"><?= $i ?></a>
    <?php endfor; ?>
  </div>
  <?php endif; ?>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/foot.php'; ?>
