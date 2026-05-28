<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
requireAuth();

$pageTitle = 'Pedidos';
$pagAtiva  = 'pedidos';
$db        = db();

/* ── Atualizar status ── */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['acao'])) {
    verifyCsrf();
    if ($_POST['acao'] === 'status') {
        $id     = (int) ($_POST['id'] ?? 0);
        $status = $_POST['status'] ?? '';
        $valid  = ['novo','em_preparo','pronto','entregue'];
        if ($id && in_array($status, $valid)) {
            $db->prepare('UPDATE pedidos SET status=? WHERE id=?')->execute([$status, $id]);
        }
    }
    header('Location: /emporio/pedidos.php' . ($_GET['ver'] ? '?ver=' . (int)$_GET['ver'] : ''));
    exit;
}

/* ── Ver pedido individual ── */
$verId = (int) ($_GET['ver'] ?? 0);
if ($verId) {
    $pedido = $db->prepare('SELECT * FROM pedidos WHERE id=?');
    $pedido->execute([$verId]);
    $pedido = $pedido->fetch();

    if ($pedido) {
        $itensPed = $db->prepare('SELECT * FROM pedido_itens WHERE pedido_id=? ORDER BY id');
        $itensPed->execute([$verId]);
        $itensPed = $itensPed->fetchAll();

        ob_start(); ?>
        <div class="flex gap-12">
          <a href="/emporio/pedidos.php" class="btn btn-secondary btn-sm">← Pedidos</a>
          <button onclick="window.print()" class="btn btn-secondary btn-sm">🖨️ Imprimir</button>
        </div>
        <?php $topbarActions = ob_get_clean();
        $pageTitle = 'Pedido #' . $pedido['id'];
        require_once __DIR__ . '/includes/head.php'; ?>

        <div style="display:grid;grid-template-columns:1fr 280px;gap:20px;align-items:start">
          <div class="card">
            <div class="card-title">Itens do pedido</div>
            <table>
              <thead>
                <tr><th>Produto</th><th>Variação</th><th>Qtd</th><th>Preço un.</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                <?php foreach ($itensPed as $it): ?>
                <tr>
                  <td class="fw-600"><?= h($it['nome']) ?></td>
                  <td class="text-dim"><?= h($it['variacao_label'] ?? '—') ?></td>
                  <td><?= $it['quantidade'] ?></td>
                  <td><?= brl($it['preco']) ?></td>
                  <td class="fw-600"><?= brl($it['preco'] * $it['quantidade']) ?></td>
                </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
            <div style="padding:14px;display:flex;flex-direction:column;gap:6px;border-top:1px solid var(--border)">
              <div class="flex flex-between"><span class="text-dim">Subtotal</span><span><?= brl($pedido['subtotal']) ?></span></div>
              <div class="flex flex-between"><span class="text-dim">Frete</span><span><?= brl($pedido['frete']) ?></span></div>
              <div class="flex flex-between fw-600" style="font-size:16px;padding-top:6px;border-top:1px solid var(--border)">
                <span>Total</span><span class="text-ambar"><?= brl($pedido['total']) ?></span>
              </div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:16px">
            <div class="card">
              <div class="card-title">Informações</div>
              <div style="display:flex;flex-direction:column;gap:10px;font-size:13.5px">
                <div><span class="text-dim">Data:</span> <strong><?= date('d/m/Y H:i', strtotime($pedido['criado_em'])) ?></strong></div>
                <div><span class="text-dim">Entrega:</span> <strong><?= h(labelEntrega($pedido['tipo_entrega'])) ?></strong></div>
                <div><span class="text-dim">Status:</span> <?= badgeStatus($pedido['status']) ?></div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Alterar status</div>
              <form method="POST" style="display:flex;flex-direction:column;gap:8px">
                <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
                <input type="hidden" name="acao" value="status">
                <input type="hidden" name="id" value="<?= $pedido['id'] ?>">
                <?php foreach (['novo'=>'Novo','em_preparo'=>'Em preparo','pronto'=>'Pronto','entregue'=>'Entregue'] as $val => $lab): ?>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px 10px;border-radius:6px;border:1px solid var(--border2);<?= $pedido['status'] === $val ? 'background:var(--ambar-bg);border-color:var(--ambar);' : '' ?>">
                  <input type="radio" name="status" value="<?= $val ?>" <?= $pedido['status'] === $val ? 'checked' : '' ?>>
                  <span><?= $lab ?></span>
                </label>
                <?php endforeach; ?>
                <button type="submit" class="btn btn-primary btn-sm" style="margin-top:4px">Salvar</button>
              </form>
            </div>

            <?php if ($pedido['whatsapp_msg']): ?>
            <div class="card">
              <div class="card-title">Mensagem WhatsApp</div>
              <pre style="font-size:12px;color:var(--text-dim);white-space:pre-wrap;word-break:break-word"><?= h($pedido['whatsapp_msg']) ?></pre>
            </div>
            <?php endif; ?>
          </div>
        </div>

        <?php require_once __DIR__ . '/includes/foot.php'; exit;
    }
}

/* ── Listagem ── */
$status  = $_GET['status'] ?? '';
$de      = $_GET['de']     ?? '';
$ate     = $_GET['ate']    ?? '';
$pagina  = max(1, (int)($_GET['p'] ?? 1));
$porPag  = 25;

$where  = '1=1';
$params = [];
if ($status) { $where .= ' AND status=?'; $params[] = $status; }
if ($de)     { $where .= ' AND DATE(criado_em) >= ?'; $params[] = $de; }
if ($ate)    { $where .= ' AND DATE(criado_em) <= ?'; $params[] = $ate; }

$stCount = $db->prepare("SELECT COUNT(*), COALESCE(SUM(total),0) FROM pedidos WHERE $where");
$stCount->execute($params);
[$total, $somaTotal] = $stCount->fetch(PDO::FETCH_NUM);

$offset  = ($pagina - 1) * $porPag;
$stPed   = $db->prepare("SELECT * FROM pedidos WHERE $where ORDER BY criado_em DESC LIMIT $porPag OFFSET $offset");
$stPed->execute($params);
$pedidos = $stPed->fetchAll();
$totalPags = (int) ceil((int)$total / $porPag);

require_once __DIR__ . '/includes/head.php';
?>

<!-- Filtros -->
<form class="filter-bar" method="GET" style="margin-bottom:16px">
  <select name="status">
    <option value="">Todos os status</option>
    <?php foreach (['novo'=>'Novo','em_preparo'=>'Em preparo','pronto'=>'Pronto','entregue'=>'Entregue'] as $v => $l): ?>
    <option value="<?= $v ?>" <?= $status === $v ? 'selected' : '' ?>><?= $l ?></option>
    <?php endforeach; ?>
  </select>
  <div style="display:flex;align-items:center;gap:6px">
    <input type="date" name="de"  value="<?= h($de) ?>">
    <span class="text-dim">até</span>
    <input type="date" name="ate" value="<?= h($ate) ?>">
  </div>
  <button type="submit" class="btn btn-secondary">Filtrar</button>
  <?php if ($status || $de || $ate): ?>
  <a href="/emporio/pedidos.php" class="btn btn-secondary">Limpar</a>
  <?php endif; ?>
</form>

<!-- Resumo -->
<div class="stats-grid" style="grid-template-columns:repeat(3,auto);justify-content:start;margin-bottom:20px">
  <div class="stat-card" style="padding:14px 20px">
    <div class="stat-label">Pedidos</div>
    <div class="stat-value" style="font-size:22px"><?= (int)$total ?></div>
  </div>
  <div class="stat-card" style="padding:14px 20px">
    <div class="stat-label">Receita total</div>
    <div class="stat-value" style="font-size:18px"><?= brl((float)$somaTotal) ?></div>
  </div>
</div>

<div class="table-wrap">
  <?php if (empty($pedidos)): ?>
  <div class="empty-msg"><span>🛒</span>Nenhum pedido encontrado.</div>
  <?php else: ?>
  <table>
    <thead>
      <tr><th>#</th><th>Data</th><th>Entrega</th><th>Subtotal</th><th>Frete</th><th>Total</th><th>Status</th><th></th></tr>
    </thead>
    <tbody>
      <?php foreach ($pedidos as $p): ?>
      <tr>
        <td class="text-dim">#<?= $p['id'] ?></td>
        <td><?= date('d/m/Y H:i', strtotime($p['criado_em'])) ?></td>
        <td><?= h(labelEntrega($p['tipo_entrega'])) ?></td>
        <td><?= brl($p['subtotal']) ?></td>
        <td><?= brl($p['frete']) ?></td>
        <td class="fw-600"><?= brl($p['total']) ?></td>
        <td><?= badgeStatus($p['status']) ?></td>
        <td>
          <a href="/emporio/pedidos.php?ver=<?= $p['id'] ?>" class="btn btn-secondary btn-sm">Ver</a>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <?php if ($totalPags > 1): ?>
  <div class="pagination">
    <?php for ($i = 1; $i <= $totalPags; $i++): ?>
    <a href="?p=<?= $i ?>&status=<?= urlencode($status) ?>&de=<?= urlencode($de) ?>&ate=<?= urlencode($ate) ?>"
       class="page-btn <?= $i === $pagina ? 'active' : '' ?>"><?= $i ?></a>
    <?php endfor; ?>
  </div>
  <?php endif; ?>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/foot.php'; ?>
