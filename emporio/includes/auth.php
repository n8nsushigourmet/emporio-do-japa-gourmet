<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax',
    ]);
}

define('SESSION_TIMEOUT', 8 * 3600); // 8 horas

function requireAuth(): void
{
    if (empty($_SESSION['admin_id'])) {
        header('Location: /emporio/');
        exit;
    }
    if (time() - ($_SESSION['last_activity'] ?? 0) > SESSION_TIMEOUT) {
        session_unset();
        session_destroy();
        header('Location: /emporio/?timeout=1');
        exit;
    }
    $_SESSION['last_activity'] = time();
}

function isLoggedIn(): bool
{
    return !empty($_SESSION['admin_id'])
        && (time() - ($_SESSION['last_activity'] ?? 0)) <= SESSION_TIMEOUT;
}

function loginAdmin(string $usuario, string $senha): bool
{
    require_once __DIR__ . '/db.php';
    $st = db()->prepare('SELECT id, nome, senha_hash FROM usuarios WHERE usuario = ? LIMIT 1');
    $st->execute([$usuario]);
    $row = $st->fetch();
    if (!$row || !password_verify($senha, $row['senha_hash'])) return false;

    session_regenerate_id(true);
    $_SESSION['admin_id']       = $row['id'];
    $_SESSION['admin_nome']     = $row['nome'];
    $_SESSION['last_activity']  = time();
    return true;
}

function logoutAdmin(): void
{
    session_unset();
    session_destroy();
}

/* ── CSRF ── */
function csrfToken(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrf(): void
{
    $token = $_POST['_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(403);
        exit('Token inválido. Recarregue a página.');
    }
}

/* ── Flash ── */
function flash(string $tipo, string $msg): void
{
    $_SESSION['flash'] = ['tipo' => $tipo, 'msg' => $msg];
}

function getFlash(): ?array
{
    $f = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $f;
}
