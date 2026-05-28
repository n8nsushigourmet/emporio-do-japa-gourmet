<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['erro' => 'Método não permitido.']);
    exit;
}

require_once __DIR__ . '/../emporio/includes/db.php';

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) {
    http_response_code(400);
    echo json_encode(['erro' => 'Payload inválido.']);
    exit;
}

try {
    $db = db();

    $tiposValidos = ['carangola','varinhas','retirada','outra'];
    $tipo = in_array($body['tipo_entrega'] ?? '', $tiposValidos) ? $body['tipo_entrega'] : 'outra';

    $subtotal = (float) ($body['subtotal'] ?? 0);
    $frete    = ($body['frete'] !== null) ? (float)$body['frete'] : null;
    $total    = (float) ($body['total']   ?? $subtotal);
    $msg      = $body['whatsapp_msg'] ?? null;

    $st = $db->prepare(
        'INSERT INTO pedidos (tipo_entrega, subtotal, frete, total, whatsapp_msg)
         VALUES (?,?,?,?,?)'
    );
    $st->execute([$tipo, $subtotal, $frete, $total, $msg]);
    $pedidoId = (int) $db->lastInsertId();

    $itens = $body['itens'] ?? [];
    foreach ($itens as $it) {
        $db->prepare(
            'INSERT INTO pedido_itens
             (pedido_id, produto_id, variacao_id, nome, variacao_label, preco, quantidade)
             VALUES (?,?,?,?,?,?,?)'
        )->execute([
            $pedidoId,
            ($it['produto_id'] ?? null) ? (int)$it['produto_id'] : null,
            ($it['variacao_id'] ?? null) ? (int)$it['variacao_id'] : null,
            $it['nome']            ?? '',
            $it['variacao_label']  ?? null,
            (float)($it['preco']   ?? 0),
            (int)  ($it['quantidade'] ?? 1),
        ]);
    }

    echo json_encode(['ok' => true, 'pedido_id' => $pedidoId]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro ao registrar pedido.']);
}
