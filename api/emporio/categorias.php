<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
requireAuth();

$pageTitle = 'Categorias';
$pagAtiva  = 'categorias';
$db        = db();

/* ── Ações POST ── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();
    $acao = $_POST['acao'] ?? '';

    if ($acao === 'criar') {
        $nome = trim($_POST['nome'] ?? '');
        $slug = fazerSlug($nome);
        if ($nome && $slug) {
            $maxOrdem = (int) $db->query('SELECT COALESCE(MAX(ordem),0) FROM categorias')->fetchColumn();
            $db->prepare('INSERT INTO categorias (nome, slug, ordem) VALUES (?,?,?)')
               ->execute([$nome, $slug, $maxOrdem + 1]);
            flash('success', 'Categoria criada.');
        }
    }

    if ($acao === 'editar') {
        $id   = (int) ($_POST['id'] ?? 0);
        $nome = trim($_POST['nome'] ?? '');
        $slug = fazerSlug($nome);
        if ($id && $nome && $slug) {
            $db->prepare('UPDATE categorias SET nome=?, slug=? WHERE id=?')
               ->execute([$nome, $slug, $id]);
            flash('success', 'Categoria atualizada.');
        }
    }

    if ($acao === 'toggle') {
        $id = (int) ($_POST['id'] ?? 0);
        if ($id) {
            $db->prepare('UPDATE categorias SET ativo = 1 - ativo WHERE id=?')->execute([$id]);
        }
    }

    if ($acao === 'excluir') {
        $id = (int) ($_POST['id'] ?? 0);
        if ($id) {
            $qtd = (int) $db->prepare('SELECT COUNT(*) FROM produtos WHERE categoria_id=?')
                            ->execute([$id]) ? $db->query("SELECT COUNT(*) FROM produtos WHERE categoria_id=$id")->fetchColumn() : 0;
            if ($qtd > 0) {
                flash('error', "Não é possível excluir: $qtd produto(s) vinculado(s) a esta categoria.");
            } else {
                $db->prepare('DELETE FROM categorias WHERE id=?')->execute([$id]);
                flash('success', 'Categoria excluída.');
            }
        }
    }

    if ($acao === 'subir' || $acao === 'descer') {
        $id     = (int) ($_POST['id'] ?? 0);
        $atual  = $db->prepare('SELECT ordem FROM categorias WHERE id=?');
        $atual->execute([$id]);
        $ordemAtual = (int) $atual->fetchColumn();

        if ($acao === 'subir') {
            $vizinho = $db->prepare('SELECT id, ordem FROM categorias WHERE ordem < ? ORDER BY ordem DESC LIMIT 1');
            $vizinho->execute([$ordemAtual]);
        } else {
            $vizinho = $db->prepare('SELECT id, ordem FROM categorias WHERE ordem > ? ORDER BY ordem ASC LIMIT 1');
            $vizinho->execute([$ordemAtual]);
        }
        $v = $vizinho->fetch();
        if ($v) {
            $db->prepare('UPDATE categorias SET ordem=? WHERE id=?')->execute([$v['ordem'], $id]);
            $db->prepare('UPDATE categorias SET ordem=? WHERE id=?')->execute([$ordemAtual, $v['id']]);
        }
    }

    header('Location: /emporio/categorias.php');
    exit;
}

$categorias = $db->query('SELECT * FROM categorias ORDER BY ordem')->fetchAll();
$editarId   = (int) ($_GET['editar'] ?? 0);

require_once __DIR__ . '/includes/head.php';
?>

<div style="display:grid;grid-template-columns:340px 1fr;gap:20px;align-items:start">

  <!-- Formulário criar/editar -->
  <div class="card">
    <?php
    $editando = null;
    if ($editarId) {
        foreach ($categorias as $c) {
            if ($c['id'] === $editarId) { $editando = $c; break; }
        }
    }
    ?>
    <div class="card-title"><?= $editando ? 'Editar categoria' : 'Nova categoria' ?></div>
    <form method="POST">
      <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
      <input type="hidden" name="acao" value="<?= $editando ? 'editar' : 'criar' ?>">
      <?php if ($editando): ?><input type="hidden" name="id" value="<?= $editando['id'] ?>"><?php endif; ?>

      <div class="form-group" style="margin-bottom:12px">
        <label for="nome">Nome da categoria</label>
        <input type="text" id="nome" name="nome"
               value="<?= h($editando['nome'] ?? '') ?>"
               placeholder="ex: Peixes e Frutos do Mar" required>
      </div>
      <div style="display:flex;gap:8px">
        <button type="submit" class="btn btn-primary" style="flex:1">
          <?= $editando ? 'Salvar' : 'Criar categoria' ?>
        </button>
        <?php if ($editando): ?>
        <a href="/emporio/categorias.php" class="btn btn-secondary">Cancelar</a>
        <?php endif; ?>
      </div>
    </form>
  </div>

  <!-- Lista -->
  <div class="table-wrap">
    <div class="table-toolbar">
      <span class="fw-600">Categorias (<?= count($categorias) ?>)</span>
    </div>

    <?php if (empty($categorias)): ?>
    <div class="empty-msg"><span>🗂️</span>Nenhuma categoria ainda.</div>
    <?php else: ?>
    <table>
      <thead>
        <tr>
          <th style="width:40px">Ordem</th>
          <th>Nome</th>
          <th>Slug</th>
          <th>Status</th>
          <th style="width:160px"></th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($categorias as $cat): ?>
        <tr>
          <td class="text-dim" style="text-align:center"><?= $cat['ordem'] ?></td>
          <td class="fw-600"><?= h($cat['nome']) ?></td>
          <td class="text-dim"><?= h($cat['slug']) ?></td>
          <td>
            <span class="badge <?= $cat['ativo'] ? 'badge-ativo' : 'badge-inativo' ?>">
              <?= $cat['ativo'] ? 'Ativa' : 'Inativa' ?>
            </span>
          </td>
          <td>
            <div class="td-actions">
              <!-- Subir -->
              <form method="POST" style="display:inline">
                <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
                <input type="hidden" name="acao" value="subir">
                <input type="hidden" name="id" value="<?= $cat['id'] ?>">
                <button type="submit" class="btn-icon" title="Mover para cima">
                  <svg viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </form>
              <!-- Descer -->
              <form method="POST" style="display:inline">
                <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
                <input type="hidden" name="acao" value="descer">
                <input type="hidden" name="id" value="<?= $cat['id'] ?>">
                <button type="submit" class="btn-icon" title="Mover para baixo">
                  <svg viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </form>
              <!-- Editar -->
              <a href="/emporio/categorias.php?editar=<?= $cat['id'] ?>" class="btn-icon" title="Editar">
                <svg viewBox="0 0 16 16" fill="none"><path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
              </a>
              <!-- Toggle ativo -->
              <form method="POST" style="display:inline">
                <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
                <input type="hidden" name="acao" value="toggle">
                <input type="hidden" name="id" value="<?= $cat['id'] ?>">
                <button type="submit" class="btn-icon" title="<?= $cat['ativo'] ? 'Desativar' : 'Ativar' ?>">
                  <svg viewBox="0 0 16 16" fill="none">
                    <?php if ($cat['ativo']): ?>
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2v10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                    <?php else: ?>
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/>
                    <path d="M5.5 8h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                    <?php endif; ?>
                  </svg>
                </button>
              </form>
              <!-- Excluir -->
              <form method="POST" style="display:inline" onsubmit="return confirm('Excluir categoria?')">
                <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
                <input type="hidden" name="acao" value="excluir">
                <input type="hidden" name="id" value="<?= $cat['id'] ?>">
                <button type="submit" class="btn-icon danger" title="Excluir">
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

<?php require_once __DIR__ . '/includes/foot.php'; ?>
