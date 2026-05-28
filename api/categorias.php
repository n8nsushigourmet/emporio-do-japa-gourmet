<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=120');

require_once __DIR__ . '/../emporio/includes/db.php';

try {
    $cats = db()->query(
        'SELECT id, nome, slug, ordem FROM categorias WHERE ativo=1 ORDER BY ordem'
    )->fetchAll();

    foreach ($cats as &$c) { $c['id'] = (int)$c['id']; $c['ordem'] = (int)$c['ordem']; }

    echo json_encode($cats, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno.']);
}
