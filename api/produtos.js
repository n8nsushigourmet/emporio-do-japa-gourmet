const pool = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { rows } = await pool.query(`
      SELECT p.id, p.categoria_id, p.nome, p.descricao, p.foto, p.tipo,
             p.preco::float, p.destaque, p.ativo, p.promo,
             p.preco_original::float, p.preco_promo::float,
             COALESCE(
               json_agg(
                 json_build_object('id', v.id, 'rotulo', v.rotulo, 'preco', v.preco::float)
                 ORDER BY v.preco
               ) FILTER (WHERE v.id IS NOT NULL),
               '[]'
             ) AS variacoes
      FROM produtos p
      LEFT JOIN variacoes v ON v.produto_id = p.id
      WHERE p.ativo = true
      GROUP BY p.id
      ORDER BY p.destaque DESC, p.criado_em
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar produtos' });
  }
};
