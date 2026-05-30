const { createClient } = require('@supabase/supabase-js')
const checkAuth = require('./_auth')

const BUCKET = 'produtos'
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()
  if (!checkAuth(req)) return res.status(401).json({ error: 'Não autorizado' })

  const { filename, mimetype } = req.query
  if (!filename || !mimetype) return res.status(400).json({ error: 'filename e mimetype obrigatórios' })
  if (!ALLOWED.includes(mimetype)) return res.status(400).json({ error: 'Formato não permitido' })

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const buffer = Buffer.concat(chunks)

  if (buffer.length > MAX_BYTES) return res.status(400).json({ error: 'Arquivo muito grande (máx 5MB)' })

  const ext = filename.split('.').pop().toLowerCase().replace(/[^a-z]/g, '') || 'jpg'
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

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
  res.json({ url: publicUrl })
}

handler.config = { api: { bodyParser: false } }
module.exports = handler
