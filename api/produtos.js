const supabase = require('./_db')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, categoria_id, nome, descricao, foto, tipo, preco, destaque, ativo, promo, preco_original, preco_promo, variacoes(id, rotulo, preco)')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('criado_em')

    if (error) throw error

    const result = (data || []).map(({ preco, preco_original, preco_promo, variacoes, ...p }) => ({
      ...p,
      preco: preco != null ? Number(preco) : null,
      preco_original: preco_original != null ? Number(preco_original) : null,
      preco_promo: preco_promo != null ? Number(preco_promo) : null,
      variacoes: (variacoes || []).map(v => ({ ...v, preco: Number(v.preco) })).sort((a, b) => a.preco - b.preco)
    }))

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao carregar produtos' })
  }
}
