<?php
function fazerSlug(string $texto): string
{
    $map = [
        'á'=>'a','à'=>'a','ã'=>'a','â'=>'a','ä'=>'a',
        'é'=>'e','ê'=>'e','è'=>'e',
        'í'=>'i','î'=>'i',
        'ó'=>'o','ô'=>'o','õ'=>'o','ö'=>'o',
        'ú'=>'u','û'=>'u','ü'=>'u',
        'ç'=>'c','ñ'=>'n',
        'Á'=>'a','À'=>'a','Ã'=>'a','Â'=>'a',
        'É'=>'e','Ê'=>'e',
        'Í'=>'i',
        'Ó'=>'o','Ô'=>'o','Õ'=>'o',
        'Ú'=>'u',
        'Ç'=>'c',
    ];
    $s = strtr(mb_strtolower(trim($texto)), $map);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s, '-');
}

function uploadImagem(array $file): string|false
{
    require_once __DIR__ . '/db.php';

    $tipos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!in_array($file['type'], $tipos, true)) return false;
    if ($file['size'] > UPLOAD_MAX) return false;
    if (!is_uploaded_file($file['tmp_name'])) return false;

    $info = getimagesize($file['tmp_name']);
    if (!$info) return false;

    $src = match ($file['type']) {
        'image/jpeg' => imagecreatefromjpeg($file['tmp_name']),
        'image/png'  => imagecreatefrompng($file['tmp_name']),
        'image/webp' => imagecreatefromwebp($file['tmp_name']),
        'image/gif'  => imagecreatefromgif($file['tmp_name']),
        default      => false,
    };
    if (!$src) return false;

    [$w, $h] = $info;
    $max = 900;
    if ($w > $max || $h > $max) {
        if ($w >= $h) {
            $nw = $max;
            $nh = (int) round($h * $max / $w);
        } else {
            $nh = $max;
            $nw = (int) round($w * $max / $h);
        }
        $dst = imagecreatetruecolor($nw, $nh);

        // Preservar transparência PNG/GIF
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $trans = imagecolorallocatealpha($dst, 255, 255, 255, 127);
        imagefilledrectangle($dst, 0, 0, $nw, $nh, $trans);

        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($src);
        $src = $dst;
    }

    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);

    $nome = 'prod_' . uniqid() . '.webp';
    $path = UPLOAD_DIR . $nome;

    if (!imagewebp($src, $path, 85)) {
        imagedestroy($src);
        return false;
    }
    imagedestroy($src);
    return $nome;
}

function deletarImagem(string $nome): void
{
    require_once __DIR__ . '/db.php';
    if ($nome && is_file(UPLOAD_DIR . $nome)) {
        unlink(UPLOAD_DIR . $nome);
    }
}

function brl(float|int|null $v): string
{
    if ($v === null) return '—';
    return 'R$ ' . number_format($v, 2, ',', '.');
}

function h(string|null $s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function promoAtiva(array $produto): bool
{
    if (!$produto['promo']) return false;
    $hoje = date('Y-m-d');
    if ($produto['promo_inicio'] && $hoje < $produto['promo_inicio']) return false;
    if ($produto['promo_fim']    && $hoje > $produto['promo_fim'])    return false;
    return true;
}

function precoDisplay(array $produto): string
{
    if (promoAtiva($produto) && $produto['preco_promo']) {
        return brl($produto['preco_promo']);
    }
    return brl($produto['preco']);
}

function labelEntrega(string $tipo): string
{
    return match ($tipo) {
        'retirada'  => 'Retirada na loja',
        'domicilio' => 'Entrega em domicílio',
        default     => $tipo,
    };
}

function labelStatus(string $status): string
{
    return match ($status) {
        'novo'      => 'Novo',
        'em_preparo'=> 'Em preparo',
        'pronto'    => 'Pronto',
        'entregue'  => 'Entregue',
        default     => $status,
    };
}

function badgeStatus(string $status): string
{
    $cls = match ($status) {
        'novo'       => 'badge-novo',
        'em_preparo' => 'badge-preparo',
        'pronto'     => 'badge-pronto',
        'entregue'   => 'badge-entregue',
        default      => '',
    };
    return '<span class="badge ' . $cls . '">' . h(labelStatus($status)) . '</span>';
}
