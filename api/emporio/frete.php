<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
requireAuth();

$pageTitle = 'Fretes';
$pagAtiva  = 'frete';
$db        = db();

/* ── Ações POST ── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $acao = $_POST['acao'] ?? '';

    /* Cidades */
    if ($acao === 'criar_cidade') {
        $nome = trim($_POST['nome'] ?? '');
        if ($nome) {
            $db->prepare('INSERT INTO cidades (nome) VALUES (?)')->execute([$nome]);
            flash('success', "Cidade \"$nome\" criada.");
        }
    }
    if ($acao === 'toggle_cidade') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id) $db->prepare('UPDATE cidades SET ativo = 1 - ativo WHERE id=?')->execute([$id]);
    }
    if ($acao === 'excluir_cidade') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id) {
            $db->prepare('DELETE FROM cidades WHERE id=?')->execute([$id]);
            flash('success', 'Cidade excluída.');
            header('Location: /emporio/frete.php');
            exit;
        }
    }

    /* Bairros */
    if ($acao === 'criar_bairro') {
        $cidadeId = (int)($_POST['cidade_id'] ?? 0);
        $nome     = trim($_POST['nome'] ?? '');
        $frete    = is_numeric($_POST['frete'] ?? '') ? (float)$_POST['frete'] : null;
        if ($cidadeId && $nome && $frete !== null) {
            $db->prepare('INSERT INTO bairros (cidade_id, nome, frete) VALUES (?,?,?)')
               ->execute([$cidadeId, $nome, $frete]);
            flash('success', "Bairro \"$nome\" adicionado.");
        }
    }
    if ($acao === 'editar_bairro') {
        $id    = (int)($_POST['id'] ?? 0);
        $nome  = trim($_POST['nome'] ?? '');
        $frete = is_numeric($_POST['frete'] ?? '') ? (float)$_POST['frete'] : null;
        if ($id && $nome && $frete !== null) {
            $db->prepare('UPDATE bairros SET nome=?, frete=? WHERE id=?')
               ->execute([$nome, $frete, $id]);
            flash('success', 'Bairro atualizado.');
        }
    }
    if ($acao === 'toggle_bairro') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id) $db->prepare('UPDATE bairros SET ativo = 1 - ativo WHERE id=?')->execute([$id]);
    }
    if ($acao === 'excluir_bairro') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id) {
            $db->prepare('DELETE FROM bairros WHERE id=?')->execute([$id]);
            flash('success', 'Bairro excluído.');
        }
    }

    $cidadeId = (int)($_POST['cidade_id'] ?? $_POST['id_redirect'] ?? 0);
    $redir = $cidadeId ? "/emporio/frete.php?cidade_id=$cidadeId" : '/emporio/frete.php';
    header("Location: $redir");
    exit;
}

/* ── Detalhe de cidade (bairros) ── */
$cidadeId = (int)($_GET['cidade_id'] ?? 0);
$cidadeAtual = null;
$bairros = [];
$editarBairroId = (int)($_GET['editar_bairro'] ?? 0);

if ($cidadeId) {
    $s = $db->prepare('SELECT * FROM cidades WHERE id=?');
    $s->execute([$cidadeId]);
    $cidadeAtual = $s->fetch();
    if ($cidadeAtual) {
        $bairros = $db->prepare(
            'SELECT * FROM bairros WHERE cidade_id=? ORDER BY nome'
        )->execute([$cidadeId]) ? (function() use ($db, $cidadeId) {
            $q = $db->prepare('SELECT * FROM bairros WHERE cidade_id=? ORDER BY nome');
            $q->execute([$cidadeId]);
            return $q->fetchAll();
        })() : [];
    }
}

$cidades = $db->query('SELECT c.*, (SELECT COUNT(*) FROM bairros b WHERE b.cidade_id=c.id AND b.ativo=1) AS qtd_bairros FROM cidades c ORDER BY c.nome')->fetchAll();

/* ── Topbar ── */
ob_start();
if ($cidadeAtual) {
    echo '<a href="/emporio/frete.php" class="btn btn-secondary btn-sm">← Cidades</a>';
}
$topbarActions = ob_get_clean();
if ($cidadeAtual) $pageTitle = 'Fretes — ' . h($cidadeAtual['nome']);

require_once __DIR__ . '/includes/head.php';
?>

<?php if (!$cidadeAtual): ?>
<!-- ══ LISTAGEM DE CIDADES ══ -->
<div style="display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start">

  <div class="card">
    <div class="card-title">Nova cidade</div>
    <form method="POST" style="display:flex;flex-direction:column;gap:12px">
      <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
      <input type="hidden" name="acao"   value="criar_cidade">
      <div class="form-group">
        <label>Nome da cidade</label>
        <input type="text" name="nome" placeholder="ex: Muriaé" required>
      </div>
      <button type="submit" class="btn btn-primary">Adicionar cidade</button>
    </form>
  </div>

  <div class="table-wrap">
    <div class="table-toolbar"><span class="fw-600">Cidades (<?= count($cidades) ?>)</span></div>
    <?php if (empty($cidades)): ?>
    <div class="empty-msg"><span>🏙️</span>Nenhuma cidade cadastrada.</div>
    <?php else: ?>
    <table>
      <thead><tr><th>Cidade</th><th>Bairros ativos</th><th>Status</th><th style="width:160px"></th></tr></thead>
      <tbody>
        <?php foreach ($cidades as $c): ?>
        <tr>
          <td class="fw-600"><?= h($c['nome']) ?></td>
          <td class="text-dim"><?= $c['qtd_bairros'] ?> bairro<?= $c['qtd_bairros'] !== 1 ? 's' : '' ?></td>
          <td><span class="badge <?= $c['ativo'] ? 'badge-ativo' : 'badge-inativo' ?>"><?= $c['ativo'] ? 'Ativa' : 'Inativa' ?></span></td>
          <td>
            <div class="td-actions">
              <a href="/emporio/frete.php?cidade_id=<?= $c['id'] ?>" class="btn btn-secondary btn-sm">Bairros</a>
              <form method="POST" style="display:inline">
                <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
                <input type="hidden" name="acao" value="toggle_cidade">
                <input type="hidden" name="id" value="<?= $c['id'] ?>">
                <button class="btn-icon" title="<?= $c['ativo'] ? 'Desativar' : 'Ativar' ?>">
                  <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><?= $c['ativo'] ? '<path d="M8 5v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' : '<path d="M5.5 8h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' ?></svg>
                </button>
              </form>
              <form method="POST" style="display:inline" onsubmit="return confirm('Excluir cidade e todos os bairros?')">
                <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
                <input type="hidden" name="acao" value="excluir_cidade">
                <input type="hidden" name="id" value="<?= $c['id'] ?>">
                <button class="btn-icon danger">
                  <svg viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </form>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </div>
</div>

<?php else: ?>
<!-- ══ BAIRROS DA CIDADE ══ -->
<div style="display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:start">

  <div class="card">
    <div class="card-title"><?= $editarBairroId ? 'Editar bairro' : 'Novo bairro' ?></div>
    <?php
    $editBairro = null;
    if ($editarBairroId) {
        $eb = $db->prepare('SELECT * FROM bairros WHERE id=? AND cidade_id=?');
        $eb->execute([$editarBairroId, $cidadeId]);
        $editBairro = $eb->fetch();
    }
    ?>
    <form method="POST" style="display:flex;flex-direction:column;gap:12px">
      <input type="hidden" name="_token"      value="<?= h(csrfToken()) ?>">
      <input type="hidden" name="acao"        value="<?= $editBairro ? 'editar_bairro' : 'criar_bairro' ?>">
      <input type="hidden" name="cidade_id"   value="<?= $cidadeId ?>">
      <?php if ($editBairro): ?><input type="hidden" name="id" value="<?= $editBairro['id'] ?>"><?php endif; ?>
      <div class="form-group">
        <label>Nome do bairro</label>
        <input type="text" name="nome" value="<?= h($editBairro['nome'] ?? '') ?>" placeholder="ex: Centro" required>
      </div>
      <div class="form-group">
        <label>Frete (R$)</label>
        <input type="number" name="frete" step="0.01" min="0"
               value="<?= h($editBairro['frete'] ?? '') ?>" placeholder="0,00" required>
      </div>
      <div style="display:flex;gap:8px">
        <button type="submit" class="btn btn-primary" style="flex:1">
          <?= $editBairro ? 'Salvar' : 'Adicionar bairro' ?>
        </button>
        <?php if ($editBairro): ?>
        <a href="/emporio/frete.php?cidade_id=<?= $cidadeId ?>" class="btn btn-secondary">Cancelar</a>
        <?php endif; ?>
      </div>
    </form>
  </div>

  <div class="table-wrap">
    <div class="table-toolbar flex flex-between">
      <span class="fw-600">Bairros — <?= h($cidadeAtual['nome']) ?> (<?= count($bairros) ?>)</span>
    </div>
    <?php if (empty($bairros)): ?>
    <div class="empty-msg"><span>📍</span>Nenhum bairro cadastrado para esta cidade.</div>
    <?php else: ?>
    <table>
      <thead><tr><th>Bairro</th><th>Frete</th><th>Status</th><th style="width:130px"></th></tr></thead>
      <tbody>
        <?php foreach ($bairros as $b): ?>
        <tr>
          <td class="fw-600"><?= h($b['nome']) ?></td>
          <td class="text-ambar fw-600"><?= brl($b['frete']) ?></td>
          <td><span class="badge <?= $b['ativo'] ? 'badge-ativo' : 'badge-inativo' ?>"><?= $b['ativo'] ? 'Ativo' : 'Inativo' ?></span></td>
          <td>
            <div class="td-actions">
              <a href="/emporio/frete.php?cidade_id=<?= $cidadeId ?>&editar_bairro=<?= $b['id'] ?>"
                 class="btn-icon" title="Editar">
                <svg viewBox="0 0 16 16" fill="none"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
              </a>
              <form method="POST" style="display:inline">
                <input type="hidden" name="_token"   value="<?= h(csrfToken()) ?>">
                <input type="hidden" name="acao"     value="toggle_bairro">
                <input type="hidden" name="id"       value="<?= $b['id'] ?>">
                <input type="hidden" name="cidade_id" value="<?= $cidadeId ?>">
                <button class="btn-icon" title="<?= $b['ativo'] ? 'Desativar' : 'Ativar' ?>">
                  <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><?= $b['ativo'] ? '<path d="M8 5v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' : '<path d="M5.5 8h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' ?></svg>
                </button>
              </form>
              <form method="POST" style="display:inline" onsubmit="return confirm('Excluir bairro?')">
                <input type="hidden" name="_token"   value="<?= h(csrfToken()) ?>">
                <input type="hidden" name="acao"     value="excluir_bairro">
                <input type="hidden" name="id"       value="<?= $b['id'] ?>">
                <input type="hidden" name="cidade_id" value="<?= $cidadeId ?>">
                <button class="btn-icon danger">
                  <svg viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </form>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </div>
</div>
<?php endif; ?>

<?php require_once __DIR__ . '/includes/foot.php'; ?>
