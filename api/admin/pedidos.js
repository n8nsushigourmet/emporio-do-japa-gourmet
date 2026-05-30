const supabase = require('../_db')
const checkAuth = require('./_auth')

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
}

module.exports = async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!checkAuth(req)) return res.status(401).json({ error: 'Não autorizado' })

  try {
    if (req.method === 'GET') {
      const { status, id } = req.query

      if (id) {
        const [{ data: pedido, error: e1 }, { data: itens, error: e2 }] = await Promise.all([
          supabase.from('pedidos').select('*').eq('id', id).single(),
          supabase.from('pedido_itens').select('*').eq('pedido_id', id)
        ])
        if (e1) throw e1
        if (e2) throw e2
        return res.json({
          ...pedido,
          total: Number(pedido.total),
          subtotal: Number(pedido.subtotal),
          frete: Number(pedido.frete),
          itens: (itens || []).map(i => ({ ...i, preco: Number(i.preco) }))
        })
      }

      let q = supabase
        .from('pedidos')
        .select('id, criado_em, tipo_entrega, cidade, bairro, total, subtotal, frete, status')
      if (status) q = q.eq('status', status)
      q = q.order('criado_em', { ascending: false }).limit(100)

      const { data, error } = await q
      if (error) throw error
      return res.json((data || []).map(p => ({
        ...p,
        total: Number(p.total),
        subtotal: Number(p.subtotal),
        frete: Number(p.frete)
      })))
    }

    if (req.method === 'PUT') {
      const { status } = req.body
      const allowed = ['novo', 'em_preparo', 'pronto', 'entregue']
      if (!allowed.includes(status)) return res.status(400).json({ error: 'Status inválido' })
      const { error } = await supabase.from('pedidos').update({ status }).eq('id', req.query.id)
      if (error) throw error
      return res.json({ ok: true })
    }

    res.status(405).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
