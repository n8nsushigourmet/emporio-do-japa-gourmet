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
      const { cidade_id } = req.query;
      const q = cidade_id
        ? `SELECT *, frete::float FROM bairros WHERE cidade_id = $1 ORDER BY nome`
        : `SELECT *, frete::float FROM bairros ORDER BY cidade_id, nome`;
      const { rows } = await pool.query(q, cidade_id ? [cidade_id] : []);
      return res.json(rows);
    }
    if (req.method === 'POST') {
      const { cidade_id, nome, frete } = req.body;
      const { rows: [b] } = await pool.query(
        `INSERT INTO bairros (cidade_id, nome, frete) VALUES ($1,$2,$3) RETURNING *, frete::float`,
        [cidade_id, nome, frete]
      );
      return res.status(201).json(b);
    }
    if (req.method === 'PUT') {
      const { nome, frete, ativo } = req.body;
      await pool.query(`UPDATE bairros SET nome=$1, frete=$2, ativo=$3 WHERE id=$4`, [nome, frete, ativo!==false, req.query.id]);
      return res.json({ ok: true });
    }
    if (req.method === 'DELETE') {
      await pool.query(`DELETE FROM bairros WHERE id = $1`, [req.query.id]);
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
