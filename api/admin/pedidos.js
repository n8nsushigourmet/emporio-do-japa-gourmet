const pool = require('../_db');
const checkAuth = require('./_auth');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!checkAuth(req)) return res.status(401).json({ error: 'Não autorizado' });

  try {
    if (req.method === 'GET') {
      const { status, id } = req.query;

      if (id) {
        const [rPedido, rItens] = await Promise.all([
          pool.query(`SELECT *, total::float, subtotal::float, frete::float FROM pedidos WHERE id = $1`, [id]),
          pool.query(`SELECT *, preco::float FROM pedido_itens WHERE pedido_id = $1`, [id]),
        ]);
        return res.json({ ...rPedido.rows[0], itens: rItens.rows });
      }

      let q = `SELECT id, criado_em, tipo_entrega, cidade, bairro, total::float, subtotal::float, frete::float, status FROM pedidos`;
      const params = [];
      if (status) { q += ` WHERE status = $1`; params.push(status); }
      q += ` ORDER BY criado_em DESC LIMIT 100`;
      const { rows } = await pool.query(q, params);
      return res.json(rows);
    }

    if (req.method === 'PUT') {
      const { status } = req.body;
      const allowed = ['novo','em_preparo','pronto','entregue'];
      if (!allowed.includes(status)) return res.status(400).json({ error: 'Status inválido' });
      await pool.query(`UPDATE pedidos SET status = $1 WHERE id = $2`, [status, req.query.id]);
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
