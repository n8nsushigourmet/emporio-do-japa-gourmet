<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');

require_once __DIR__ . '/../emporio/includes/db.php';

try {
    $rows = db()->query('SELECT id, nome FROM cidades WHERE ativo=1 ORDER BY nome')->fetchAll();
    foreach ($rows as &$r) $r['id'] = (int)$r['id'];
    echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno.']);
}
