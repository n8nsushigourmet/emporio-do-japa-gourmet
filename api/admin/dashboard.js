const pool = require('../_db');
const checkAuth = require('./_auth');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req)) return res.status(401).json({ error: 'Não autorizado' });

  const hoje = new Date().toISOString().slice(0, 10);

  try {
    const [rPedidosHoje, rFatHoje, rProd, rRecentes] = await Promise.all([
      pool.query(`SELECT count(*)::int FROM pedidos WHERE criado_em::date = $1`, [hoje]),
      pool.query(`SELECT coalesce(sum(total),0)::float FROM pedidos WHERE criado_em::date = $1`, [hoje]),
      pool.query(`SELECT count(*)::int FROM produtos WHERE ativo = true`),
      pool.query(`SELECT id, criado_em, tipo_entrega, cidade, bairro, total::float, status FROM pedidos ORDER BY criado_em DESC LIMIT 10`),
    ]);

    res.json({
      pedidosHoje:      rPedidosHoje.rows[0].count,
      totalHoje:        rFatHoje.rows[0].coalesce,
      totalProdutos:    rProd.rows[0].count,
      pedidosRecentes:  rRecentes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
