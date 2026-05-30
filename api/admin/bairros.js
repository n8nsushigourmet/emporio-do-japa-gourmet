const supabase = require('../_db')
const checkAuth = require('./_auth')

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
}

module.exports = async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!checkAuth(req)) return res.status(401).json({ error: 'Não autorizado' })

  try {
    if (req.method === 'GET') {
      const { cidade_id } = req.query
      let q = supabase.from('bairros').select('*').order('nome')
      if (cidade_id) q = q.eq('cidade_id', cidade_id)
      else q = q.order('cidade_id')
      const { data, error } = await q
      if (error) throw error
      return res.json((data || []).map(b => ({ ...b, frete: Number(b.frete) })))
    }

    if (req.method === 'POST') {
      const { cidade_id, nome, frete } = req.body
      const { data: b, error } = await supabase
        .from('bairros')
        .insert({ cidade_id, nome, frete })
        .select()
        .single()
      if (error) throw error
      return res.status(201).json({ ...b, frete: Number(b.frete) })
    }

    if (req.method === 'PUT') {
      const { nome, frete, ativo } = req.body
      const { error } = await supabase
        .from('bairros')
        .update({ nome, frete, ativo: ativo !== false })
        .eq('id', req.query.id)
      if (error) throw error
      return res.json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('bairros').delete().eq('id', req.query.id)
      if (error) throw error
      return res.json({ ok: true })
    }

    res.status(405).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
