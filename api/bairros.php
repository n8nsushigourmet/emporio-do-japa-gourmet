<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');

require_once __DIR__ . '/../emporio/includes/db.php';

$cidadeId = (int)($_GET['cidade_id'] ?? 0);
if (!$cidadeId) { echo json_encode([]); exit; }

try {
    $st = db()->prepare(
        'SELECT id, nome, frete FROM bairros WHERE cidade_id=? AND ativo=1 ORDER BY nome'
    );
    $st->execute([$cidadeId]);
    $rows = $st->fetchAll();
    foreach ($rows as &$r) {
        $r['id']    = (int)$r['id'];
        $r['frete'] = (float)$r['frete'];
    }
    echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno.']);
}
