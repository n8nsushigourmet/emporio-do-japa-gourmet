const pool = require('./_db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { tipo_entrega, cidade, bairro, subtotal, frete, total, whatsapp_msg, itens } = req.body;

  try {
    const { rows: [pedido] } = await pool.query(
      `INSERT INTO pedidos (tipo_entrega, cidade, bairro, subtotal, frete, total, whatsapp_msg)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [tipo_entrega, cidade || null, bairro || null, subtotal, frete, total, whatsapp_msg]
    );

    if (Array.isArray(itens) && itens.length) {
      for (const item of itens) {
        await pool.query(
          `INSERT INTO pedido_itens (pedido_id, produto_id, nome, variacao_label, preco, quantidade)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [pedido.id, item.produto_id, item.nome, item.variacao_label || null, item.preco, item.quantidade]
        );
      }
    }

    res.json({ ok: true, id: pedido.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar pedido' });
  }
};
