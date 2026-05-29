<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
requireAuth();

$pageTitle = 'Dashboard';
$pagAtiva  = 'dashboard';

$db = db();

$totalProdutos   = (int) $db->query('SELECT COUNT(*) FROM produtos WHERE ativo = 1')->fetchColumn();
$totalCategorias = (int) $db->query('SELECT COUNT(*) FROM categorias WHERE ativo = 1')->fetchColumn();
$pedidosHoje     = (int) $db->query("SELECT COUNT(*) FROM pedidos WHERE DATE(criado_em) = CURDATE()")->fetchColumn();
$faturamentoHoje = (float) ($db->query("SELECT COALESCE(SUM(total),0) FROM pedidos WHERE DATE(criado_em) = CURDATE()")->fetchColumn() ?? 0);

$pedidosRecentes = $db->query(
    "SELECT id, criado_em, tipo_entrega, total, status
     FROM pedidos
     ORDER BY criado_em DESC
     LIMIT 10"
)->fetchAll();

require_once __DIR__ . '/includes/head.php';
?>

<!-- Stats -->
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-icon">📦</div>
    <div class="stat-label">Produtos ativos</div>
    <div class="stat-value"><?= $totalProdutos ?></div>
  </div>
  <div class="stat-card">
    <div class="stat-icon">🗂️</div>
    <div class="stat-label">Categorias</div>
    <div class="stat-value"><?= $totalCategorias ?></div>
  </div>
  <div class="stat-card">
    <div class="stat-icon">🛒</div>
    <div class="stat-label">Pedidos hoje</div>
    <div class="stat-value"><?= $pedidosHoje ?></div>
  </div>
  <div class="stat-card">
    <div class="stat-icon">💰</div>
    <div class="stat-label">Faturamento hoje</div>
    <div class="stat-value" style="font-size:20px"><?= brl($faturamentoHoje) ?></div>
  </div>
</div>

<!-- Pedidos recentes -->
<div class="table-wrap">
  <div class="table-toolbar flex flex-between">
    <span class="fw-600">Pedidos recentes</span>
    <a href="/emporio/pedidos.php" class="btn btn-secondary btn-sm">Ver todos</a>
  </div>

  <?php if (empty($pedidosRecentes)): ?>
  <div class="empty-msg"><span>🛒</span>Nenhum pedido ainda.</div>
  <?php else: ?>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Data</th>
        <th>Entrega</th>
        <th>Total</th>
        <th>Status</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($pedidosRecentes as $p): ?>
      <tr>
        <td class="text-dim">#<?= $p['id'] ?></td>
        <td><?= date('d/m H:i', strtotime($p['criado_em'])) ?></td>
        <td><?= h(labelEntrega($p['tipo_entrega'])) ?></td>
        <td class="fw-600"><?= brl($p['total']) ?></td>
        <td><?= badgeStatus($p['status']) ?></td>
        <td><a href="/emporio/pedidos.php?ver=<?= $p['id'] ?>" class="btn btn-secondary btn-sm">Ver</a></td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</div>

<?php require_once __DIR__ . '/includes/foot.php'; ?>
