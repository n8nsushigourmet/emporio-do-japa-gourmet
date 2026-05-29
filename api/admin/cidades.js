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
      const { rows } = await pool.query(`SELECT * FROM cidades ORDER BY nome`);
      return res.json(rows);
    }
    if (req.method === 'POST') {
      const { nome } = req.body;
      const { rows: [c] } = await pool.query(`INSERT INTO cidades (nome) VALUES ($1) RETURNING *`, [nome]);
      return res.status(201).json(c);
    }
    if (req.method === 'PUT') {
      const { nome, ativo } = req.body;
      await pool.query(`UPDATE cidades SET nome=$1, ativo=$2 WHERE id=$3`, [nome, ativo!==false, req.query.id]);
      return res.json({ ok: true });
    }
    if (req.method === 'DELETE') {
      await pool.query(`DELETE FROM cidades WHERE id = $1`, [req.query.id]);
      return res.json({ ok: true });
    }
    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
