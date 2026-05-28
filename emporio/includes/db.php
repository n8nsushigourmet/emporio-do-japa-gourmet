<?php
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $host = getenv('DB_HOST') ?: 'localhost';
        $port = getenv('DB_PORT') ?: '5432';
        $name = getenv('DB_NAME') ?: 'postgres';
        $user = getenv('DB_USER') ?: 'postgres';
        $pass = getenv('DB_PASS') ?: '';

        $dsn = "pgsql:host={$host};port={$port};dbname={$name};sslmode=require";
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

define('ROOT_DIR',   dirname(dirname(__DIR__)));
define('UPLOAD_DIR', ROOT_DIR . '/uploads/produtos/');
define('UPLOAD_URL', '/uploads/produtos/');
define('UPLOAD_MAX', 5 * 1024 * 1024); // 5 MB
