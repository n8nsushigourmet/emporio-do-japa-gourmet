const supabase = require('../_db')
const checkAuth = require('./_auth')

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
}

function mapProduto({ categorias, preco, preco_original, preco_promo, variacoes, ...p }) {
  return {
    ...p,
    categoria_nome: categorias?.nome || null,
    preco: preco != null ? Number(preco) : null,
    preco_original: preco_original != null ? Number(preco_original) : null,
    preco_promo: preco_promo != null ? Number(preco_promo) : null,
    variacoes: (variacoes || []).map(v => ({ ...v, preco: Number(v.preco) }))
  }
}

module.exports = async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!checkAuth(req)) return res.status(401).json({ error: 'Não autorizado' })

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias(nome), variacoes(id, rotulo, preco)')
        .order('criado_em', { ascending: false })
      if (error) throw error
      return res.json((data || []).map(mapProduto))
    }

    if (req.method === 'POST') {
      const { nome, descricao, foto, tipo, preco, categoria_id, destaque, ativo, promo, preco_original, preco_promo, variacoes } = req.body
      const { data: p, error } = await supabase
        .from('produtos')
        .insert({
          nome, descricao: descricao || null, foto: foto || null, tipo: tipo || 'simples',
          preco: preco || null, categoria_id: categoria_id || null,
          destaque: !!destaque, ativo: ativo !== false, promo: !!promo,
          preco_original: preco_original || null, preco_promo: preco_promo || null
        })
        .select('id')
        .single()
      if (error) throw error
      if (Array.isArray(variacoes) && variacoes.length) {
        const { error: eV } = await supabase.from('variacoes').insert(
          variacoes.map(v => ({ produto_id: p.id, rotulo: v.rotulo, preco: v.preco }))
        )
        if (eV) throw eV
      }
      return res.status(201).json({ id: p.id })
    }

    if (req.method === 'PUT') {
      const id = req.query.id
      const { nome, descricao, foto, tipo, preco, categoria_id, destaque, ativo, promo, preco_original, preco_promo, variacoes } = req.body
      const { error } = await supabase
        .from('produtos')
        .update({
          nome, descricao: descricao || null, foto: foto || null, tipo: tipo || 'simples',
          preco: preco || null, categoria_id: categoria_id || null,
          destaque: !!destaque, ativo: ativo !== false, promo: !!promo,
          preco_original: preco_original || null, preco_promo: preco_promo || null
        })
        .eq('id', id)
      if (error) throw error
      if (Array.isArray(variacoes)) {
        const { error: eD } = await supabase.from('variacoes').delete().eq('produto_id', id)
        if (eD) throw eD
        if (variacoes.length) {
          const { error: eV } = await supabase.from('variacoes').insert(
            variacoes.map(v => ({ produto_id: id, rotulo: v.rotulo, preco: v.preco }))
          )
          if (eV) throw eV
        }
      }
      return res.json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('produtos').delete().eq('id', req.query.id)
      if (error) throw error
      return res.json({ ok: true })
    }

    res.status(405).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
