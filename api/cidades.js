const pool = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { rows } = await pool.query(`
      SELECT id, nome FROM cidades WHERE ativo = true ORDER BY nome
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar cidades' });
  }
};
