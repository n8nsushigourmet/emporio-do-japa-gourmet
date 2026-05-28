<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: public, max-age=60');

require_once __DIR__ . '/../emporio/includes/db.php';
require_once __DIR__ . '/../emporio/includes/helpers.php';

try {
    $db = db();

    $produtos = $db->query(
        "SELECT p.*, c.slug AS categoria_slug
         FROM produtos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
         WHERE p.ativo = 1
         ORDER BY p.categoria_id, p.nome"
    )->fetchAll();

    $ids  = array_column($produtos, 'id');
    $vars = [];
    if ($ids) {
        $ph  = implode(',', array_fill(0, count($ids), '?'));
        $vsQ = $db->prepare("SELECT * FROM variacoes WHERE produto_id IN ($ph) ORDER BY produto_id, id");
        $vsQ->execute($ids);
        foreach ($vsQ->fetchAll() as $v) {
            $vars[$v['produto_id']][] = [
                'id'     => (int)$v['id'],
                'rotulo' => $v['rotulo'],
                'preco'  => (float)$v['preco'],
            ];
        }
    }

    $hoje = date('Y-m-d');
    $saida = [];
    foreach ($produtos as $p) {
        $promoAtiva = (bool)$p['promo']
            && (!$p['promo_inicio'] || $hoje >= $p['promo_inicio'])
            && (!$p['promo_fim']    || $hoje <= $p['promo_fim']);

        $saida[] = [
            'id'           => (int)$p['id'],
            'categoria_id' => (int)$p['categoria_id'],
            'nome'         => $p['nome'],
            'descricao'    => $p['descricao'],
            'foto'         => $p['foto'] ? (UPLOAD_URL . $p['foto']) : null,
            'tipo'         => $p['tipo'],
            'preco'        => $p['preco'] !== null ? (float)$p['preco'] : null,
            'destaque'     => (bool)$p['destaque'],
            'ativo'        => true,
            'promo'        => $promoAtiva,
            'preco_original' => $p['preco_original'] !== null ? (float)$p['preco_original'] : null,
            'preco_promo'    => $p['preco_promo']    !== null ? (float)$p['preco_promo']    : null,
            'variacoes'    => $vars[(int)$p['id']] ?? [],
        ];
    }

    echo json_encode($saida, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['erro' => 'Erro interno.']);
}
