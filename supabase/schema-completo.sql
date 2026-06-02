-- ============================================================
-- Empório Japa Gourmet — Schema PostgreSQL Completo
-- Versão: junho/2025
--
-- Como usar:
--   1. Crie um novo projeto no Supabase (supabase.com)
--   2. Acesse o projeto → SQL Editor → New query
--   3. Cole todo este arquivo e clique em Run
--   4. Atualize o .env.local e as variáveis da Vercel com
--      os novos SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
--
-- Nota sobre Storage:
--   Após rodar o SQL, vá em Storage → New bucket:
--   Nome: produtos  |  Public: SIM
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- 1. TABELAS
-- ══════════════════════════════════════════════════════════════

-- ── 1.1 Categorias ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id        SERIAL        PRIMARY KEY,
  nome      VARCHAR(100)  NOT NULL,
  slug      VARCHAR(100)  NOT NULL UNIQUE,
  ordem     INT           DEFAULT 0,
  ativo     BOOLEAN       DEFAULT true,
  criado_em TIMESTAMPTZ   DEFAULT now()
);

-- ── 1.2 Produtos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS produtos (
  id                SERIAL         PRIMARY KEY,
  categoria_id      INT            REFERENCES categorias(id) ON DELETE SET NULL,
  nome              VARCHAR(200)   NOT NULL,
  descricao         TEXT,

  -- imagens
  foto              VARCHAR(500),               -- foto principal (legado / compat)
  fotos             JSONB          DEFAULT '[]', -- galeria de até 4 fotos

  -- tipo do produto
  tipo              VARCHAR(20)    NOT NULL DEFAULT 'simples'
                                   CHECK (tipo IN ('simples','variacao','peso')),

  -- preço simples
  preco             DECIMAL(10,2),

  -- flags
  destaque          BOOLEAN        DEFAULT false,
  ativo             BOOLEAN        DEFAULT true,
  promo             BOOLEAN        DEFAULT false,

  -- preços de promoção
  preco_original    DECIMAL(10,2),
  preco_promo       DECIMAL(10,2),
  promo_inicio      DATE,
  promo_fim         DATE,

  -- campos exclusivos tipo "peso/quantidade"
  preco_unidade     DECIMAL(10,2),
  unidade_label     VARCHAR(20),
  quantidade_minima INT            DEFAULT 0,
  quantidade_maxima INT,
  multiplo_de       INT            DEFAULT 1,

  criado_em         TIMESTAMPTZ    DEFAULT now()
);

-- ── 1.3 Variações ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS variacoes (
  id         SERIAL         PRIMARY KEY,
  produto_id INT            NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  rotulo     VARCHAR(100)   NOT NULL,
  preco      DECIMAL(10,2)  NOT NULL
);

-- ── 1.4 Kits ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kits (
  id        SERIAL         PRIMARY KEY,
  nome      VARCHAR(200)   NOT NULL,
  descricao TEXT,
  foto      VARCHAR(500),
  preco     DECIMAL(10,2),
  ativo     BOOLEAN        DEFAULT true,
  criado_em TIMESTAMPTZ    DEFAULT now()
);

-- ── 1.5 Kit itens ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kit_itens (
  id          SERIAL  PRIMARY KEY,
  kit_id      INT     NOT NULL REFERENCES kits(id)     ON DELETE CASCADE,
  produto_id  INT     NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  variacao_id INT              REFERENCES variacoes(id) ON DELETE SET NULL,
  quantidade  INT     DEFAULT 1
);

-- ── 1.6 Cidades ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cidades (
  id    SERIAL        PRIMARY KEY,
  nome  VARCHAR(100)  NOT NULL,
  ativo BOOLEAN       DEFAULT true
);

-- ── 1.7 Bairros ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bairros (
  id        SERIAL        PRIMARY KEY,
  cidade_id INT           NOT NULL REFERENCES cidades(id) ON DELETE CASCADE,
  nome      VARCHAR(100)  NOT NULL,
  frete     DECIMAL(8,2)  NOT NULL,
  ativo     BOOLEAN       DEFAULT true
);

-- ── 1.8 Pedidos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id           SERIAL        PRIMARY KEY,
  criado_em    TIMESTAMPTZ   DEFAULT now(),
  tipo_entrega VARCHAR(50),
  cidade       VARCHAR(100),
  bairro       VARCHAR(100),
  subtotal     DECIMAL(10,2),
  frete        DECIMAL(10,2) DEFAULT 0,
  total        DECIMAL(10,2),
  status       VARCHAR(20)   DEFAULT 'novo'
               CHECK (status IN ('novo','em_preparo','pronto','entregue')),
  whatsapp_msg TEXT
);

-- ── 1.9 Pedido itens ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedido_itens (
  id             SERIAL        PRIMARY KEY,
  pedido_id      INT           NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id     INT,          -- nullable: produto pode ter sido excluído
  nome           VARCHAR(200)  NOT NULL,
  variacao_label VARCHAR(100),
  preco          DECIMAL(10,2) NOT NULL,
  quantidade     INT           NOT NULL
);


-- ══════════════════════════════════════════════════════════════
-- 2. ÍNDICES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_produtos_categoria   ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo       ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_destaque    ON produtos(destaque);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo        ON produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_variacoes_produto    ON variacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_kit_itens_kit        ON kit_itens(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_itens_produto    ON kit_itens(produto_id);
CREATE INDEX IF NOT EXISTS idx_bairros_cidade       ON bairros(cidade_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status       ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado       ON pedidos(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido  ON pedido_itens(pedido_id);


-- ══════════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY
--
-- As APIs do servidor usam SUPABASE_SERVICE_ROLE_KEY, que
-- ignora o RLS automaticamente. As policies abaixo são para
-- chamadas do cliente (anon key) — não usadas neste projeto,
-- mas necessárias para evitar bloqueio acidental.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE categorias   ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE variacoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE kits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_itens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cidades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bairros      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;

-- Leitura pública do catálogo
CREATE POLICY "pub_select_categorias"
  ON categorias   FOR SELECT TO anon USING (true);

CREATE POLICY "pub_select_produtos"
  ON produtos     FOR SELECT TO anon USING (true);

CREATE POLICY "pub_select_variacoes"
  ON variacoes    FOR SELECT TO anon USING (true);

CREATE POLICY "pub_select_cidades"
  ON cidades      FOR SELECT TO anon USING (true);

CREATE POLICY "pub_select_bairros"
  ON bairros      FOR SELECT TO anon USING (true);

-- Criação de pedido pelo site (anon pode inserir)
CREATE POLICY "pub_insert_pedidos"
  ON pedidos      FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "pub_insert_pedido_itens"
  ON pedido_itens FOR INSERT TO anon WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- 4. DADOS INICIAIS
-- ══════════════════════════════════════════════════════════════

-- Cidades de entrega
INSERT INTO cidades (id, nome) VALUES
  (1, 'Carangola'),
  (2, 'Varinhas'),
  (3, 'Lacerdina')
ON CONFLICT (id) DO NOTHING;

-- Bairros com frete
INSERT INTO bairros (cidade_id, nome, frete) VALUES
  (1, 'Centro',        7.00),
  (1, 'São Cristóvão', 7.00),
  (1, 'Bom Jesus',     9.00),
  (1, 'Rancho Fundo',  9.00),
  (2, 'Centro',       12.00),
  (3, 'Centro',       12.00)
ON CONFLICT DO NOTHING;

-- Categorias do catálogo
INSERT INTO categorias (nome, slug, ordem) VALUES
  ('Kits Sushi Preguiçoso',     'kits',       1),
  ('Peixes e Frutos do Mar',    'peixes',     2),
  ('Algas',                     'algas',      3),
  ('Temperos e Molhos',         'temperos',   4),
  ('Arroz e Bases',             'arroz',      5),
  ('Cream Cheese e Laticínios', 'laticinios', 6),
  ('Acessórios',                'acessorios', 7)
ON CONFLICT (slug) DO NOTHING;

-- Corrigir sequências após INSERTs com IDs explícitos
SELECT setval('cidades_id_seq',    (SELECT MAX(id) FROM cidades));
SELECT setval('bairros_id_seq',    (SELECT MAX(id) FROM bairros));
SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));


-- ══════════════════════════════════════════════════════════════
-- FIM DO SCHEMA
--
-- Após executar este SQL:
--
-- 1. Storage bucket
--    Supabase → Storage → New bucket
--    Nome: produtos   Visibilidade: Public (marcar "Public bucket")
--
-- 2. Variáveis de ambiente (.env.local e Vercel)
--    SUPABASE_URL=https://<novo-projeto-id>.supabase.co
--    SUPABASE_SERVICE_ROLE_KEY=<service_role key do novo projeto>
--    ADMIN_TOKEN=<senha que quiser para o painel admin>
--
--    As chaves ficam em:
--    Supabase → Project Settings → API
--      - URL              → SUPABASE_URL
--      - service_role key → SUPABASE_SERVICE_ROLE_KEY
--      (NÃO usar anon key nas variáveis de servidor)
--
-- 3. Redeployar na Vercel após atualizar as env vars
-- ══════════════════════════════════════════════════════════════
