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
      const { data, error } = await supabase.from('categorias').select('*').order('ordem').order('nome')
      if (error) throw error
      return res.json(data || [])
    }

    if (req.method === 'POST') {
      const { nome, slug, ordem, ativo } = req.body
      const { data: c, error } = await supabase
        .from('categorias')
        .insert({ nome, slug, ordem: ordem || 0, ativo: ativo !== false })
        .select('id')
        .single()
      if (error) throw error
      return res.status(201).json({ id: c.id })
    }

    if (req.method === 'PUT') {
      const { nome, slug, ordem, ativo } = req.body
      const { error } = await supabase
        .from('categorias')
        .update({ nome, slug, ordem: ordem || 0, ativo: ativo !== false })
        .eq('id', req.query.id)
      if (error) throw error
      return res.json({ ok: true })
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase.from('categorias').delete().eq('id', req.query.id)
      if (error) throw error
      return res.json({ ok: true })
    }

    res.status(405).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
