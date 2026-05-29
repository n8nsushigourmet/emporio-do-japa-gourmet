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
      const { rows } = await pool.query(`SELECT * FROM categorias ORDER BY ordem, nome`);
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const { nome, slug, ordem, ativo } = req.body;
      const { rows: [c] } = await pool.query(
        `INSERT INTO categorias (nome,slug,ordem,ativo) VALUES ($1,$2,$3,$4) RETURNING id`,
        [nome, slug, ordem||0, ativo!==false]
      );
      return res.status(201).json({ id: c.id });
    }

    if (req.method === 'PUT') {
      const { nome, slug, ordem, ativo } = req.body;
      await pool.query(
        `UPDATE categorias SET nome=$1,slug=$2,ordem=$3,ativo=$4 WHERE id=$5`,
        [nome, slug, ordem||0, ativo!==false, req.query.id]
      );
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await pool.query(`DELETE FROM categorias WHERE id = $1`, [req.query.id]);
      return res.json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
