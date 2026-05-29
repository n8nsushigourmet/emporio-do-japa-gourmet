<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
requireAuth();

$db   = db();
$acao = $_GET['acao'] ?? 'listar';

/* ── Salvar kit ── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $id = (int) ($_POST['id'] ?? 0);

    $nome     = trim($_POST['nome'] ?? '');
    $descricao = trim($_POST['descricao'] ?? '') ?: null;
    $preco    = is_numeric($_POST['preco'] ?? '') ? (float)$_POST['preco'] : null;
    $ativo    = isset($_POST['ativo']) ? 1 : 0;

    $fotoAtual = $_POST['foto_atual'] ?? null;
    $foto = $fotoAtual;
    if (!empty($_FILES['foto']['name'])) {
        $nova = uploadImagem($_FILES['foto']);
        if ($nova) {
            if ($fotoAtual) deletarImagem($fotoAtual);
            $foto = $nova;
        }
    }

    if ($id) {
        $db->prepare('UPDATE kits SET nome=?,descricao=?,preco=?,ativo=?,foto=? WHERE id=?')
           ->execute([$nome, $descricao, $preco, $ativo, $foto, $id]);
    } else {
        $db->prepare('INSERT INTO kits (nome,descricao,preco,ativo,foto) VALUES (?,?,?,?,?)')
           ->execute([$nome, $descricao, $preco, $ativo, $foto]);
        $id = (int) $db->lastInsertId();
    }

    // Itens do kit
    $db->prepare('DELETE FROM kit_itens WHERE kit_id=?')->execute([$id]);
    $prodIds  = $_POST['item_produto_id']  ?? [];
    $varIds   = $_POST['item_variacao_id'] ?? [];
    $qtds     = $_POST['item_qtd']         ?? [];

    foreach ($prodIds as $i => $prodId) {
        $prodId = (int)$prodId;
        if (!$prodId) continue;
        $varId = ($varIds[$i] ?? '') ? (int)$varIds[$i] : null;
        $qtd   = max(1, (int)($qtds[$i] ?? 1));
        $db->prepare('INSERT INTO kit_itens (kit_id,produto_id,variacao_id,quantidade) VALUES (?,?,?,?)')
           ->execute([$id, $prodId, $varId, $qtd]);
    }

    flash('success', 'Kit salvo.');
    header('Location: /emporio/kits.php');
    exit;
}

// Excluir
if (isset($_GET['excluir'])) {
    $id  = (int) $_GET['excluir'];
    $kit = $db->prepare('SELECT foto FROM kits WHERE id=?');
    $kit->execute([$id]);
    $k   = $kit->fetch();
    if ($k) {
        if ($k['foto']) deletarImagem($k['foto']);
        $db->prepare('DELETE FROM kits WHERE id=?')->execute([$id]);
        flash('success', 'Kit excluído.');
    }
    header('Location: /emporio/kits.php');
    exit;
}

/* ── Formulário ── */
if ($acao === 'novo' || $acao === 'editar') {
    $pageTitle = $acao === 'novo' ? 'Novo kit' : 'Editar kit';
    $pagAtiva  = 'kits';

    $kit   = null;
    $itens = [];
    if ($acao === 'editar') {
        $editId = (int) ($_GET['id'] ?? 0);
        $k = $db->prepare('SELECT * FROM kits WHERE id=?');
        $k->execute([$editId]);
        $kit = $k->fetch();
        if (!$kit) { header('Location: /emporio/kits.php'); exit; }
        $itensQ = $db->prepare(
            'SELECT ki.*, p.nome AS prod_nome, v.rotulo AS var_rotulo
             FROM kit_itens ki
             JOIN produtos p ON p.id = ki.produto_id
             LEFT JOIN variacoes v ON v.id = ki.variacao_id
             WHERE ki.kit_id=?'
        );
        $itensQ->execute([$editId]);
        $itens = $itensQ->fetchAll();
    }

    // Produtos disponíveis + variações para o picker
    $todosProd = $db->query(
        'SELECT p.id, p.nome, p.tipo FROM produtos p WHERE p.ativo=1 ORDER BY p.nome'
    )->fetchAll();
    $todasVars = $db->query(
        'SELECT id, produto_id, rotulo FROM variacoes ORDER BY produto_id, id'
    )->fetchAll();

    // Index variações por produto_id para JS
    $varsPorProd = [];
    foreach ($todasVars as $v) {
        $varsPorProd[$v['produto_id']][] = $v;
    }

    require_once __DIR__ . '/includes/head.php';
    ?>
    <a href="/emporio/kits.php" class="btn btn-secondary btn-sm" style="margin-bottom:20px">← Voltar</a>

    <form method="POST" enctype="multipart/form-data">
      <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
      <input type="hidden" name="id" value="<?= (int)($kit['id'] ?? 0) ?>">
      <input type="hidden" name="foto_atual" value="<?= h($kit['foto'] ?? '') ?>">

      <div style="display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start">
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card-title">Dados do kit</div>
            <div style="display:flex;flex-direction:column;gap:14px">
              <div class="form-group">
                <label>Nome do kit *</label>
                <input type="text" name="nome" value="<?= h($kit['nome'] ?? '') ?>" required>
              </div>
              <div class="form-group">
                <label>Descrição</label>
                <textarea name="descricao"><?= h($kit['descricao'] ?? '') ?></textarea>
              </div>
              <div class="form-group">
                <label>Preço (R$)</label>
                <input type="number" name="preco" step="0.01" min="0" value="<?= h($kit['preco'] ?? '') ?>"
                       id="preco-kit" placeholder="Calculado automaticamente">
                <span class="form-hint">Preço sugerido = soma dos componentes (editável)</span>
              </div>
            </div>
          </div>

          <!-- Itens -->
          <div class="card">
            <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
              Componentes
              <button type="button" class="btn btn-secondary btn-sm" id="add-item-btn">+ Adicionar produto</button>
            </div>
            <div class="kit-items-list" id="kit-items-list">
              <?php foreach ($itens as $item): ?>
              <div class="kit-item-row">
                <select name="item_produto_id[]" class="item-prod-select">
                  <option value="">— produto —</option>
                  <?php foreach ($todosProd as $tp): ?>
                  <option value="<?= $tp['id'] ?>" <?= $tp['id'] === $item['produto_id'] ? 'selected' : '' ?>>
                    <?= h($tp['nome']) ?>
                  </option>
                  <?php endforeach; ?>
                </select>
                <select name="item_variacao_id[]" class="item-var-select">
                  <option value="">— variação —</option>
                  <?php foreach ($varsPorProd[$item['produto_id']] ?? [] as $v): ?>
                  <option value="<?= $v['id'] ?>" <?= $v['id'] === $item['variacao_id'] ? 'selected' : '' ?>>
                    <?= h($v['rotulo']) ?>
                  </option>
                  <?php endforeach; ?>
                </select>
                <input type="number" name="item_qtd[]" value="<?= (int)$item['quantidade'] ?>" min="1" placeholder="Qtd">
                <button type="button" class="btn-icon danger remove-item-btn">
                  <svg viewBox="0 0 16 16" fill="none"><path d="M4 8h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
              </div>
              <?php endforeach; ?>
            </div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="card">
            <div class="card-title">Foto</div>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div class="img-preview" id="img-preview" style="width:100%;height:140px;aspect-ratio:unset">
                <?php if (!empty($kit['foto'])): ?>
                  <img src="<?= h(UPLOAD_URL . $kit['foto']) ?>" alt="">
                <?php else: ?>🎌<?php endif; ?>
              </div>
              <label class="img-upload-label">
                <svg viewBox="0 0 16 16" fill="none"><path d="M8 1v8M5 6l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                Escolher imagem
                <input type="file" name="foto" id="foto-input" accept="image/*">
              </label>
            </div>
          </div>
          <div class="card">
            <div class="card-title">Opções</div>
            <label class="toggle-row">
              <div class="toggle-label">Kit ativo</div>
              <label class="toggle">
                <input type="checkbox" name="ativo" value="1" <?= ($kit['ativo'] ?? 1) ? 'checked' : '' ?>>
                <span class="toggle-track"></span>
              </label>
            </label>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;height:44px;font-size:15px">
            <?= isset($kit) && $kit ? 'Salvar kit' : 'Criar kit' ?>
          </button>
          <a href="/emporio/kits.php" class="btn btn-secondary" style="width:100%;justify-content:center">Cancelar</a>
        </div>
      </div>
    </form>

    <script>
    const todosProd = <?= json_encode($todosProd) ?>;
    const varsPorProd = <?= json_encode($varsPorProd) ?>;

    function atualizarVars(row) {
      const sel = row.querySelector('.item-prod-select');
      const varSel = row.querySelector('.item-var-select');
      const prodId = parseInt(sel.value);
      const vars = varsPorProd[prodId] || [];
      varSel.innerHTML = '<option value="">— variação —</option>';
      vars.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.rotulo;
        varSel.appendChild(opt);
      });
      varSel.style.display = vars.length ? '' : 'none';
    }

    function addItemRow(prodId = '', varId = '', qtd = 1) {
      const row = document.createElement('div');
      row.className = 'kit-item-row';
      const selOpts = todosProd.map(p =>
        `<option value="${p.id}" ${p.id == prodId ? 'selected' : ''}>${p.nome.replace(/</g,'&lt;')}</option>`
      ).join('');
      row.innerHTML = `
        <select name="item_produto_id[]" class="item-prod-select">
          <option value="">— produto —</option>${selOpts}
        </select>
        <select name="item_variacao_id[]" class="item-var-select">
          <option value="">— variação —</option>
        </select>
        <input type="number" name="item_qtd[]" value="${qtd}" min="1" placeholder="Qtd">
        <button type="button" class="btn-icon danger remove-item-btn">
          <svg viewBox="0 0 16 16" fill="none"><path d="M4 8h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>`;
      document.getElementById('kit-items-list').appendChild(row);
      row.querySelector('.item-prod-select').addEventListener('change', () => atualizarVars(row));
      row.querySelector('.remove-item-btn').addEventListener('click', () => row.remove());
      atualizarVars(row);
    }

    document.getElementById('add-item-btn').addEventListener('click', () => addItemRow());

    document.querySelectorAll('.kit-item-row').forEach(row => {
      row.querySelector('.item-prod-select').addEventListener('change', () => atualizarVars(row));
      row.querySelector('.remove-item-btn').addEventListener('click', () => row.remove());
      atualizarVars(row);
    });

    document.getElementById('foto-input').addEventListener('change', function () {
      if (!this.files[0]) return;
      const r = new FileReader();
      r.onload = e => {
        document.getElementById('img-preview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
      };
      r.readAsDataURL(this.files[0]);
    });
    </script>
    <?php require_once __DIR__ . '/includes/foot.php'; exit;
}

/* ── Listagem ── */
$pageTitle = 'Kits';
$pagAtiva  = 'kits';

$kits = $db->query(
    'SELECT k.*, (SELECT COUNT(*) FROM kit_itens ki WHERE ki.kit_id=k.id) AS qtd_itens
     FROM kits k ORDER BY k.criado_em DESC'
)->fetchAll();

ob_start();
?>
<a href="/emporio/kits.php?acao=novo" class="btn btn-primary">
  <svg viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
  Novo kit
</a>
<?php
$topbarActions = ob_get_clean();
require_once __DIR__ . '/includes/head.php';
?>

<div class="table-wrap">
  <?php if (empty($kits)): ?>
  <div class="empty-msg"><span>🎌</span>Nenhum kit cadastrado.</div>
  <?php else: ?>
  <table>
    <thead>
      <tr><th>Kit</th><th>Itens</th><th>Preço</th><th>Status</th><th style="width:100px"></th></tr>
    </thead>
    <tbody>
      <?php foreach ($kits as $k): ?>
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <?php if ($k['foto']): ?>
            <img src="<?= h(UPLOAD_URL . $k['foto']) ?>" style="width:36px;height:36px;border-radius:6px;object-fit:cover">
            <?php else: ?>
            <div style="width:36px;height:36px;border-radius:6px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:18px">🎌</div>
            <?php endif; ?>
            <span class="fw-600"><?= h($k['nome']) ?></span>
          </div>
        </td>
        <td class="text-dim"><?= $k['qtd_itens'] ?> componente<?= $k['qtd_itens'] !== 1 ? 's' : '' ?></td>
        <td class="fw-600"><?= brl($k['preco']) ?></td>
        <td><span class="badge <?= $k['ativo'] ? 'badge-ativo' : 'badge-inativo' ?>"><?= $k['ativo'] ? 'Ativo' : 'Inativo' ?></span></td>
        <td>
          <div class="td-actions">
            <a href="/emporio/kits.php?acao=editar&id=<?= $k['id'] ?>" class="btn-icon" title="Editar">
              <svg viewBox="0 0 16 16" fill="none"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
            </a>
            <a href="/emporio/kits.php?excluir=<?= $k['id'] ?>" class="btn-icon danger"
               onclick="return confirm('Excluir este kit?')">
              <svg viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
          </div>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/foot.php'; ?>
