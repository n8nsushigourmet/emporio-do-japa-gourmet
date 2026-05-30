const supabase = require('./_db')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { data, error } = await supabase
      .from('cidades')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao carregar cidades' })
  }
}
