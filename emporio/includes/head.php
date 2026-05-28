<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title><?= h($pageTitle ?? 'Admin') ?> — Empório Japa</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/admin.css">
</head>
<body>
<div class="layout">

  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">帝</div>
      <div class="sidebar-logo-text">
        <span class="sidebar-logo-name">Empório Japa</span>
        <span class="sidebar-logo-sub">Painel Admin</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section">Menu</div>

      <a href="/emporio/dashboard.php" class="nav-item <?= ($pagAtiva ?? '') === 'dashboard' ? 'active' : '' ?>">
        <svg viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/></svg>
        Dashboard
      </a>

      <a href="/emporio/pedidos.php" class="nav-item <?= ($pagAtiva ?? '') === 'pedidos' ? 'active' : '' ?>">
        <svg viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 8h12M2 13h7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        Pedidos
      </a>

      <div class="nav-section" style="margin-top:8px">Catálogo</div>

      <a href="/emporio/produtos.php" class="nav-item <?= ($pagAtiva ?? '') === 'produtos' ? 'active' : '' ?>">
        <svg viewBox="0 0 16 16" fill="none"><path d="M8 1.5l5.5 3v6L8 14.5 2.5 11.5v-6L8 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 1.5v6M2.5 5.5l5.5 2 5.5-2" stroke="currentColor" stroke-width="1.3"/></svg>
        Produtos
      </a>

      <a href="/emporio/categorias.php" class="nav-item <?= ($pagAtiva ?? '') === 'categorias' ? 'active' : '' ?>">
        <svg viewBox="0 0 16 16" fill="none"><path d="M1.5 4h4v4h-4zM9 1.5h4l1.5 2.5-1.5 2.5H9L7.5 4zM3.5 10a2 2 0 100 4 2 2 0 000-4zM9.5 10.5h5M9.5 13h5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Categorias
      </a>

      <a href="/emporio/kits.php" class="nav-item <?= ($pagAtiva ?? '') === 'kits' ? 'active' : '' ?>">
        <svg viewBox="0 0 16 16" fill="none"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
        Kits
      </a>

      <a href="/emporio/importar.php" class="nav-item <?= ($pagAtiva ?? '') === 'importar' ? 'active' : '' ?>">
        <svg viewBox="0 0 16 16" fill="none"><path d="M8 1v8M5 6l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        Importar
      </a>

      <a href="/emporio/frete.php" class="nav-item <?= ($pagAtiva ?? '') === 'frete' ? 'active' : '' ?>">
        <svg viewBox="0 0 16 16" fill="none"><path d="M2 8l2.5-5h7L14 8v4H2V8z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M2 8h12" stroke="currentColor" stroke-width="1.3"/><circle cx="5" cy="13" r="1" fill="currentColor"/><circle cx="11" cy="13" r="1" fill="currentColor"/></svg>
        Fretes
      </a>
    </nav>

    <div class="sidebar-footer">
      <span style="font-size:12px;color:var(--text-dim);padding:4px 8px;display:block">
        <?= h($_SESSION['admin_nome'] ?? '') ?>
      </span>
      <a href="/emporio/logout.php" class="sidebar-logout">
        <svg viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Sair
      </a>
    </div>
  </aside>

  <!-- Main -->
  <div class="main-area">
    <div class="topbar">
      <h1 class="topbar-title"><?= h($pageTitle ?? '') ?></h1>
      <div class="topbar-actions">
        <?= isset($topbarActions) ? $topbarActions : '' ?>
      </div>
    </div>
    <div class="content">
<?php
$flash = getFlash();
if ($flash):
  $cls = match($flash['tipo']) { 'success' => 'flash-success', 'error' => 'flash-error', default => 'flash-info' };
?>
<div class="flash <?= $cls ?>"><?= h($flash['msg']) ?></div>
<?php endif; ?>
