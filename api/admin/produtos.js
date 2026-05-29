const pool = require('../_db');
const checkAuth = require('./_auth');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req)) return res.status(401).json({ error: 'Não autorizado' });

  try {
    if (req.method === 'GET') {
      const { rows } = await pool.query(`
        SELECT p.*, p.preco::float, p.preco_original::float, p.preco_promo::float,
               c.nome AS categoria_nome,
               COALESCE(json_agg(
                 json_build_object('id',v.id,'rotulo',v.rotulo,'preco',v.preco::float)
                 ORDER BY v.preco
               ) FILTER (WHERE v.id IS NOT NULL), '[]') AS variacoes
        FROM produtos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        LEFT JOIN variacoes v ON v.produto_id = p.id
        GROUP BY p.id, c.nome
        ORDER BY p.criado_em DESC
      `);
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { nome, descricao, foto, tipo, preco, categoria_id, destaque, ativo, promo, preco_original, preco_promo, variacoes } = req.body;
      const { rows: [p] } = await pool.query(
        `INSERT INTO produtos (nome,descricao,foto,tipo,preco,categoria_id,destaque,ativo,promo,preco_original,preco_promo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
        [nome, descricao||null, foto||null, tipo||'simples', preco||null, categoria_id||null,
         !!destaque, ativo!==false, !!promo, preco_original||null, preco_promo||null]
      );
      if (Array.isArray(variacoes)) {
        for (const v of variacoes) {
          await pool.query(`INSERT INTO variacoes (produto_id,rotulo,preco) VALUES ($1,$2,$3)`, [p.id, v.rotulo, v.preco]);
        }
      }
      return res.status(201).json({ id: p.id });
    }

    if (req.method === 'PUT') {
      const id = req.query.id;
      const { nome, descricao, foto, tipo, preco, categoria_id, destaque, ativo, promo, preco_original, preco_promo, variacoes } = req.body;
      await pool.query(
        `UPDATE produtos SET nome=$1,descricao=$2,foto=$3,tipo=$4,preco=$5,categoria_id=$6,
         destaque=$7,ativo=$8,promo=$9,preco_original=$10,preco_promo=$11 WHERE id=$12`,
        [nome, descricao||null, foto||null, tipo||'simples', preco||null, categoria_id||null,
         !!destaque, ativo!==false, !!promo, preco_original||null, preco_promo||null, id]
      );
      if (Array.isArray(variacoes)) {
        await pool.query(`DELETE FROM variacoes WHERE produto_id = $1`, [id]);
        for (const v of variacoes) {
          await pool.query(`INSERT INTO variacoes (produto_id,rotulo,preco) VALUES ($1,$2,$3)`, [id, v.rotulo, v.preco]);
        }
      }
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await pool.query(`DELETE FROM produtos WHERE id = $1`, [req.query.id]);
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
