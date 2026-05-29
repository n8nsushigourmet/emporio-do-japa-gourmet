<?php
/**
 * Setup inicial — cria o primeiro usuário admin.
 * APAGUE este arquivo após o primeiro uso.
 */
require_once __DIR__ . '/includes/db.php';

$criado = false;
$erro   = '';

// Só executa se não houver usuários cadastrados
$qtd = db()->query('SELECT COUNT(*) FROM usuarios')->fetchColumn();
if ((int)$qtd > 0) {
    die('<p style="font:16px sans-serif;color:#c0392b;padding:20px">Usuário já cadastrado. Apague este arquivo.</p>');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome    = trim($_POST['nome']    ?? '');
    $usuario = trim($_POST['usuario'] ?? '');
    $senha   = $_POST['senha']        ?? '';
    $conf    = $_POST['confirmar']    ?? '';

    if (!$nome || !$usuario || !$senha) {
        $erro = 'Preencha todos os campos.';
    } elseif (strlen($senha) < 8) {
        $erro = 'A senha deve ter no mínimo 8 caracteres.';
    } elseif ($senha !== $conf) {
        $erro = 'As senhas não conferem.';
    } else {
        $hash = password_hash($senha, PASSWORD_DEFAULT);
        db()->prepare('INSERT INTO usuarios (usuario, senha_hash, nome) VALUES (?,?,?)')
             ->execute([$usuario, $hash, $nome]);
        $criado = true;
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup — Empório Japa Admin</title>
  <link rel="stylesheet" href="/assets/css/admin.css">
</head>
<body>
<div class="setup-page">
  <div class="setup-card">
    <h1>⚙️ Setup inicial</h1>
    <p>Crie o usuário administrador. Após a criação, apague este arquivo do servidor.</p>

    <?php if ($criado): ?>
    <div class="flash flash-success">Usuário criado com sucesso! <a href="/emporio/">Ir para o login</a></div>
    <?php else: ?>

    <?php if ($erro): ?>
    <div class="flash flash-error" style="margin-bottom:16px"><?= htmlspecialchars($erro) ?></div>
    <?php endif; ?>

    <form method="POST" style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group">
        <label>Nome completo</label>
        <input type="text" name="nome" required>
      </div>
      <div class="form-group">
        <label>Usuário (login)</label>
        <input type="text" name="usuario" required>
      </div>
      <div class="form-group">
        <label>Senha (mín. 8 caracteres)</label>
        <input type="password" name="senha" required minlength="8">
      </div>
      <div class="form-group">
        <label>Confirmar senha</label>
        <input type="password" name="confirmar" required>
      </div>
      <button type="submit" class="btn btn-primary" style="height:44px;font-size:15px">Criar administrador</button>
    </form>
    <?php endif; ?>
  </div>
</div>
</body>
</html>
