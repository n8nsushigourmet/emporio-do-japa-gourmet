<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/helpers.php';
requireAuth();

$pageTitle = 'Importar produtos';
$pagAtiva  = 'importar';
$db        = db();

$resultado = null;

/* ── Download do modelo CSV ── */
if (isset($_GET['modelo'])) {
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="modelo-produtos.csv"');
    $cols = ['nome','descricao','categoria_slug','tipo','preco','destaque','ativo',
             'promo','preco_original','preco_promo','promo_inicio','promo_fim'];
    echo implode(',', $cols) . "\n";
    echo implode(',', [
        'Salmão Fresco', 'Descrição do produto', 'peixes', 'simples',
        '72.00', '1', '1', '0', '', '', '', ''
    ]) . "\n";
    echo implode(',', [
        'Alga Nori', 'Folhas de alga nori tostadas', 'algas', 'simples',
        '24.00', '0', '1', '1', '29.00', '24.00', '2026-01-01', '2026-12-31'
    ]) . "\n";
    exit;
}

/* ── Upload CSV ── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verifyCsrf();

    if (empty($_FILES['csv']['name'])) {
        flash('error', 'Nenhum arquivo enviado.');
        header('Location: /emporio/importar.php');
        exit;
    }

    $linhas = array_map('str_getcsv', file($_FILES['csv']['tmp_name']));
    $cabec  = array_map('trim', array_shift($linhas));

    $cats   = $db->query('SELECT id, slug FROM categorias')->fetchAll(PDO::FETCH_KEY_PAIR);
    // fetchAll(PDO::FETCH_KEY_PAIR) retorna [slug => id]
    $catMap = [];
    foreach ($db->query('SELECT id, slug FROM categorias')->fetchAll() as $c) {
        $catMap[$c['slug']] = $c['id'];
    }

    $criados     = 0;
    $atualizados = 0;
    $erros       = [];

    foreach ($linhas as $num => $linha) {
        if (count($linha) < count($cabec)) continue;
        $row = array_combine($cabec, $linha);

        $nome = trim($row['nome'] ?? '');
        if (!$nome) { $erros[] = "Linha " . ($num + 2) . ": nome vazio."; continue; }

        $tipo  = in_array($row['tipo'] ?? '', ['simples','variacao']) ? $row['tipo'] : 'simples';
        $catId = $catMap[trim($row['categoria_slug'] ?? '')] ?? null;

        $dados = [
            'categoria_id'   => $catId,
            'nome'           => $nome,
            'descricao'      => $row['descricao']     ?: null,
            'tipo'           => $tipo,
            'preco'          => is_numeric($row['preco'] ?? '')          ? (float)$row['preco']          : null,
            'destaque'       => ($row['destaque'] ?? '0') === '1' ? 1 : 0,
            'ativo'          => ($row['ativo']    ?? '1') !== '0' ? 1 : 0,
            'promo'          => ($row['promo']    ?? '0') === '1' ? 1 : 0,
            'preco_original' => is_numeric($row['preco_original'] ?? '') ? (float)$row['preco_original'] : null,
            'preco_promo'    => is_numeric($row['preco_promo']    ?? '') ? (float)$row['preco_promo']    : null,
            'promo_inicio'   => $row['promo_inicio'] ?: null,
            'promo_fim'      => $row['promo_fim']    ?: null,
        ];

        // Verificar se já existe pelo nome
        $exist = $db->prepare('SELECT id FROM produtos WHERE nome=? LIMIT 1');
        $exist->execute([$nome]);
        $existId = (int) $exist->fetchColumn();

        if ($existId) {
            $cols = implode(', ', array_map(fn($k) => "$k=?", array_keys($dados)));
            $vals = array_values($dados);
            $vals[] = $existId;
            $db->prepare("UPDATE produtos SET $cols WHERE id=?")->execute($vals);
            $atualizados++;
        } else {
            $cols = implode(', ', array_keys($dados));
            $phs  = implode(', ', array_fill(0, count($dados), '?'));
            $db->prepare("INSERT INTO produtos ($cols) VALUES ($phs)")->execute(array_values($dados));
            $criados++;
        }
    }

    $resultado = compact('criados', 'atualizados', 'erros');
}

require_once __DIR__ . '/includes/head.php';
?>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">

  <!-- Download modelo -->
  <div class="card">
    <div class="card-title">1. Baixar modelo</div>
    <p style="font-size:13.5px;color:var(--text-dim);margin-bottom:16px">
      Preencha o arquivo CSV com seus produtos. Você pode criar novos ou atualizar existentes
      (correspondência pelo nome).
    </p>
    <a href="/emporio/importar.php?modelo=1" class="btn btn-secondary">
      <svg viewBox="0 0 16 16" fill="none"><path d="M8 1v8M5 6l3 3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
      Baixar modelo CSV
    </a>
    <hr class="divider">
    <div class="card-title" style="font-size:13px">Colunas do CSV</div>
    <table style="font-size:12px;margin-top:8px">
      <thead><tr><th>Coluna</th><th>Descrição</th></tr></thead>
      <tbody>
        <?php foreach ([
          'nome'          => 'Nome do produto (obrigatório)',
          'descricao'     => 'Descrição curta',
          'categoria_slug'=> 'Slug da categoria (ex: peixes)',
          'tipo'          => 'simples ou variacao',
          'preco'         => 'Preço (ex: 72.00)',
          'destaque'      => '1 = destaque, 0 = normal',
          'ativo'         => '1 = ativo (padrão), 0 = inativo',
          'promo'         => '1 = em promoção',
          'preco_original'=> 'Preço original (riscado)',
          'preco_promo'   => 'Preço promocional',
          'promo_inicio'  => 'Data início promo (AAAA-MM-DD)',
          'promo_fim'     => 'Data fim promo (AAAA-MM-DD)',
        ] as $col => $desc): ?>
        <tr>
          <td><code style="color:var(--ambar-cl)"><?= $col ?></code></td>
          <td class="text-dim"><?= $desc ?></td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <!-- Upload -->
  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="card">
      <div class="card-title">2. Fazer upload</div>
      <form method="POST" enctype="multipart/form-data" style="display:flex;flex-direction:column;gap:14px">
        <input type="hidden" name="_token" value="<?= h(csrfToken()) ?>">
        <div class="form-group">
          <label>Arquivo CSV</label>
          <input type="file" name="csv" accept=".csv,text/csv" required>
          <span class="form-hint">Encoding UTF-8 · máx 2MB</span>
        </div>
        <button type="submit" class="btn btn-primary">
          <svg viewBox="0 0 16 16" fill="none"><path d="M8 1v8M5 6l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          Importar
        </button>
      </form>
    </div>

    <!-- Resultado -->
    <?php if ($resultado): ?>
    <div class="card">
      <div class="card-title">Resultado</div>
      <div style="display:flex;flex-direction:column;gap:8px;font-size:13.5px">
        <div class="flex gap-12">
          <span class="badge badge-ativo">✓ <?= $resultado['criados'] ?> criado<?= $resultado['criados'] !== 1 ? 's' : '' ?></span>
          <span class="badge badge-preparo">↻ <?= $resultado['atualizados'] ?> atualizado<?= $resultado['atualizados'] !== 1 ? 's' : '' ?></span>
        </div>
        <?php if ($resultado['erros']): ?>
        <div style="margin-top:8px">
          <div class="fw-600 text-red" style="margin-bottom:6px">Erros (<?= count($resultado['erros']) ?>):</div>
          <?php foreach ($resultado['erros'] as $e): ?>
          <div class="text-dim" style="font-size:12px">• <?= h($e) ?></div>
          <?php endforeach; ?>
        </div>
        <?php endif; ?>
      </div>
    </div>
    <?php endif; ?>
  </div>
</div>

<?php require_once __DIR__ . '/includes/foot.php'; ?>
