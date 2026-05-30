const supabase = require('../_db')
const checkAuth = require('./_auth')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!checkAuth(req)) return res.status(401).json({ error: 'Não autorizado' })

  const hoje = new Date().toISOString().slice(0, 10)
  const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  try {
    const [
      { data: pedidosHojeData, error: e1 },
      { count: totalProdutos, error: e2 },
      { data: pedidosRecentes, error: e3 }
    ] = await Promise.all([
      supabase.from('pedidos').select('total')
        .gte('criado_em', `${hoje}T00:00:00`)
        .lt('criado_em', `${amanha}T00:00:00`),
      supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('ativo', true),
      supabase.from('pedidos')
        .select('id, criado_em, tipo_entrega, cidade, bairro, total, status')
        .order('criado_em', { ascending: false })
        .limit(10)
    ])

    if (e1) throw e1
    if (e2) throw e2
    if (e3) throw e3

    const pedidosHoje = pedidosHojeData?.length || 0
    const totalHoje = (pedidosHojeData || []).reduce((s, p) => s + Number(p.total || 0), 0)

    res.json({
      pedidosHoje,
      totalHoje,
      totalProdutos: totalProdutos || 0,
      pedidosRecentes: (pedidosRecentes || []).map(p => ({ ...p, total: Number(p.total) }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
