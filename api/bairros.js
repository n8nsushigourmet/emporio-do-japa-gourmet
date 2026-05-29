const pool = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const { cidade_id } = req.query;
  if (!cidade_id) return res.status(400).json({ error: 'cidade_id obrigatório' });

  try {
    const { rows } = await pool.query(`
      SELECT id, nome, frete::float FROM bairros
      WHERE cidade_id = $1 AND ativo = true ORDER BY nome
    `, [cidade_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar bairros' });
  }
};
