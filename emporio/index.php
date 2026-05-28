<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/helpers.php';

if (isLoggedIn()) {
    header('Location: /emporio/dashboard.php');
    exit;
}

$erro    = '';
$timeout = !empty($_GET['timeout']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuario = trim($_POST['usuario'] ?? '');
    $senha   = $_POST['senha'] ?? '';

    if ($usuario && $senha) {
        if (loginAdmin($usuario, $senha)) {
            header('Location: /emporio/dashboard.php');
            exit;
        }
        $erro = 'Usuário ou senha incorretos.';
    } else {
        $erro = 'Preencha todos os campos.';
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>Login — Empório Japa Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/admin.css">
</head>
<body>
<div class="login-page">
  <div class="login-card">
    <div class="login-logo">
      <div class="login-logo-icon">帝</div>
      <div>
        <div class="login-title">Empório Japa</div>
        <div class="login-sub">Painel Admin</div>
      </div>
    </div>

    <?php if ($timeout): ?>
    <div class="flash flash-info" style="margin-bottom:16px">Sessão expirada. Faça login novamente.</div>
    <?php endif; ?>

    <?php if ($erro): ?>
    <div class="flash flash-error" style="margin-bottom:16px"><?= h($erro) ?></div>
    <?php endif; ?>

    <form class="login-form" method="POST">
      <div class="form-group">
        <label for="usuario">Usuário</label>
        <input type="text" id="usuario" name="usuario" value="<?= h($_POST['usuario'] ?? '') ?>"
               autocomplete="username" autofocus required>
      </div>
      <div class="form-group">
        <label for="senha">Senha</label>
        <input type="password" id="senha" name="senha" autocomplete="current-password" required>
      </div>
      <button type="submit" class="login-btn">Entrar</button>
    </form>
  </div>
</div>
</body>
</html>
