const supabase = require('./_db')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).end()

  const { cidade_id } = req.query
  if (!cidade_id) return res.status(400).json({ error: 'cidade_id obrigatório' })

  try {
    const { data, error } = await supabase
      .from('bairros')
      .select('id, nome, frete')
      .eq('cidade_id', cidade_id)
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    res.json((data || []).map(b => ({ ...b, frete: Number(b.frete) })))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao carregar bairros' })
  }
}
