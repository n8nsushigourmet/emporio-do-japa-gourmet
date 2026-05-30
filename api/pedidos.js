const supabase = require('./_db')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { tipo_entrega, cidade, bairro, subtotal, frete, total, whatsapp_msg, itens } = req.body

  try {
    const { data: pedido, error: ePedido } = await supabase
      .from('pedidos')
      .insert({ tipo_entrega, cidade: cidade || null, bairro: bairro || null, subtotal, frete, total, whatsapp_msg })
      .select('id')
      .single()

    if (ePedido) throw ePedido

    if (Array.isArray(itens) && itens.length) {
      const { error: eItens } = await supabase.from('pedido_itens').insert(
        itens.map(item => ({
          pedido_id: pedido.id,
          produto_id: item.produto_id,
          nome: item.nome,
          variacao_label: item.variacao_label || null,
          preco: item.preco,
          quantidade: item.quantidade
        }))
      )
      if (eItens) throw eItens
    }

    res.json({ ok: true, id: pedido.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao registrar pedido' })
  }
}
