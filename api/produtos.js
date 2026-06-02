const supabase = require('./_db')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, categoria_id, nome, descricao, foto, tipo, preco, destaque, ativo, promo, preco_original, preco_promo, promo_inicio, promo_fim, preco_unidade, unidade_label, quantidade_minima, quantidade_maxima, multiplo_de, variacoes(id, rotulo, preco)')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('criado_em')

    if (error) throw error

    const hoje = new Date().toISOString().slice(0, 10)
    const result = (data || []).map(({ preco, preco_original, preco_promo, promo_inicio, promo_fim, preco_unidade, quantidade_minima, quantidade_maxima, multiplo_de, variacoes, ...p }) => {
      const expirada = p.promo && promo_fim && hoje > promo_fim.slice(0, 10)
      return {
        ...p,
        promo: expirada ? false : p.promo,
        preco: preco != null ? Number(preco) : null,
        preco_original: expirada ? null : (preco_original != null ? Number(preco_original) : null),
        preco_promo: expirada ? null : (preco_promo != null ? Number(preco_promo) : null),
        preco_unidade: preco_unidade != null ? Number(preco_unidade) : null,
        quantidade_minima: quantidade_minima != null ? Number(quantidade_minima) : null,
        quantidade_maxima: quantidade_maxima != null ? Number(quantidade_maxima) : null,
        multiplo_de: multiplo_de != null ? Number(multiplo_de) : null,
        variacoes: (variacoes || []).map(v => ({ ...v, preco: Number(v.preco) })).sort((a, b) => a.preco - b.preco)
      }
    })

    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao carregar produtos' })
  }
}
