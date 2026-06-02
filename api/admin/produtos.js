const supabase = require('../_db')
const checkAuth = require('./_auth')

const BUCKET = 'produtos'
const UPLOAD_ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const UPLOAD_MAX = 5 * 1024 * 1024

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
}

function mapProduto({ categorias, preco, preco_original, preco_promo, preco_unidade, quantidade_minima, quantidade_maxima, multiplo_de, variacoes, ...p }) {
  return {
    ...p,
    categoria_nome: categorias?.nome || null,
    preco: preco != null ? Number(preco) : null,
    preco_original: preco_original != null ? Number(preco_original) : null,
    preco_promo: preco_promo != null ? Number(preco_promo) : null,
    preco_unidade: preco_unidade != null ? Number(preco_unidade) : null,
    quantidade_minima: quantidade_minima != null ? Number(quantidade_minima) : null,
    quantidade_maxima: quantidade_maxima != null ? Number(quantidade_maxima) : null,
    multiplo_de: multiplo_de != null ? Number(multiplo_de) : null,
    variacoes: (variacoes || []).map(v => ({ ...v, preco: Number(v.preco) }))
  }
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

const handler = async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!checkAuth(req)) return res.status(401).json({ error: 'Não autorizado' })

  // ── Upload de imagem (?action=upload) ─────────────────
  if (req.query.action === 'upload') {
    if (req.method !== 'POST') return res.status(405).end()
    const { filename, mimetype } = req.query
    if (!filename || !mimetype) return res.status(400).json({ error: 'filename e mimetype obrigatórios' })
    if (!UPLOAD_ALLOWED.includes(mimetype)) return res.status(400).json({ error: 'Formato não permitido' })

    const buffer = await readBody(req)
    if (buffer.length > UPLOAD_MAX) return res.status(400).json({ error: 'Arquivo muito grande (máx 5MB)' })

    const ext = filename.split('.').pop().toLowerCase().replace(/[^a-z]/g, '') || 'jpg'
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    let { error } = await supabase.storage.from(BUCKET).upload(name, buffer, { contentType: mimetype, upsert: false })
    if (error) {
      if (error.statusCode === 404 || /not found|does not exist/i.test(error.message || '')) {
        await supabase.storage.createBucket(BUCKET, { public: true })
        const { error: e2 } = await supabase.storage.from(BUCKET).upload(name, buffer, { contentType: mimetype, upsert: false })
        if (e2) { console.error(e2); return res.status(500).json({ error: e2.message }) }
      } else {
        console.error(error)
        return res.status(500).json({ error: error.message })
      }
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(name)
    return res.json({ url: publicUrl })
  }

  // ── CRUD de produtos ──────────────────────────────────
  // bodyParser desabilitado globalmente — parseia JSON manualmente
  let body = {}
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const buf = await readBody(req)
      body = JSON.parse(buf.toString())
    } catch {
      return res.status(400).json({ error: 'Body JSON inválido' })
    }
  }

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
      const { nome, descricao, foto, fotos, tipo, preco, categoria_id, destaque, ativo, promo, preco_original, preco_promo, promo_inicio, promo_fim, variacoes,
              preco_unidade, unidade_label, quantidade_minima, quantidade_maxima, multiplo_de } = body
      const { data: p, error } = await supabase
        .from('produtos')
        .insert({
          nome, descricao: descricao || null, foto: foto || null, fotos: fotos || [], tipo: tipo || 'simples',
          preco: preco || null, categoria_id: categoria_id || null,
          destaque: !!destaque, ativo: ativo !== false, promo: !!promo,
          preco_original: preco_original || null, preco_promo: preco_promo || null,
          promo_inicio: promo_inicio || null, promo_fim: promo_fim || null,
          preco_unidade: preco_unidade || null, unidade_label: unidade_label || null,
          quantidade_minima: quantidade_minima || null, quantidade_maxima: quantidade_maxima || null,
          multiplo_de: multiplo_de || null
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

    if (req.method === 'PATCH') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'id obrigatório' })
      console.log('[PATCH produto]', id, body)
      const { error } = await supabase.from('produtos').update(body).eq('id', id)
      if (error) { console.error('[PATCH erro]', error); throw error }
      console.log('[PATCH ok]', id)
      return res.json({ ok: true })
    }

    if (req.method === 'PUT') {
      const id = req.query.id
      const { nome, descricao, foto, fotos, tipo, preco, categoria_id, destaque, ativo, promo, preco_original, preco_promo, promo_inicio, promo_fim, variacoes,
              preco_unidade, unidade_label, quantidade_minima, quantidade_maxima, multiplo_de } = body
      const { error } = await supabase
        .from('produtos')
        .update({
          nome, descricao: descricao || null, foto: foto || null, fotos: fotos || [], tipo: tipo || 'simples',
          preco: preco || null, categoria_id: categoria_id || null,
          destaque: !!destaque, ativo: ativo !== false, promo: !!promo,
          preco_original: preco_original || null, preco_promo: preco_promo || null,
          promo_inicio: promo_inicio || null, promo_fim: promo_fim || null,
          preco_unidade: preco_unidade || null, unidade_label: unidade_label || null,
          quantidade_minima: quantidade_minima || null, quantidade_maxima: quantidade_maxima || null,
          multiplo_de: multiplo_de || null
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

handler.config = { api: { bodyParser: false } }
module.exports = handler
