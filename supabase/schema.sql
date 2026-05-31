-- Empório Japa Gourmet — Schema PostgreSQL
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)

CREATE TABLE IF NOT EXISTS categorias (
  id        SERIAL PRIMARY KEY,
  nome      VARCHAR(100) NOT NULL,
  slug      VARCHAR(100) NOT NULL UNIQUE,
  ordem     INT          DEFAULT 0,
  ativo     BOOLEAN      DEFAULT true,
  criado_em TIMESTAMPTZ  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS produtos (
  id             SERIAL PRIMARY KEY,
  categoria_id   INT REFERENCES categorias(id) ON DELETE SET NULL,
  nome           VARCHAR(200) NOT NULL,
  descricao      TEXT,
  foto           VARCHAR(500),
  tipo           VARCHAR(20)   NOT NULL DEFAULT 'simples' CHECK (tipo IN ('simples','variacao','peso')),
  preco          DECIMAL(10,2),
  destaque       BOOLEAN DEFAULT false,
  ativo          BOOLEAN DEFAULT true,
  promo          BOOLEAN DEFAULT false,
  preco_original DECIMAL(10,2),
  preco_promo    DECIMAL(10,2),
  promo_inicio   DATE,
  promo_fim      DATE,
  criado_em      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS variacoes (
  id         SERIAL PRIMARY KEY,
  produto_id INT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  rotulo     VARCHAR(100)  NOT NULL,
  preco      DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS kits (
  id        SERIAL PRIMARY KEY,
  nome      VARCHAR(200) NOT NULL,
  descricao TEXT,
  foto      VARCHAR(500),
  preco     DECIMAL(10,2),
  ativo     BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kit_itens (
  id          SERIAL PRIMARY KEY,
  kit_id      INT NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  produto_id  INT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  variacao_id INT REFERENCES variacoes(id) ON DELETE SET NULL,
  quantidade  INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cidades (
  id    SERIAL PRIMARY KEY,
  nome  VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS bairros (
  id        SERIAL PRIMARY KEY,
  cidade_id INT NOT NULL REFERENCES cidades(id) ON DELETE CASCADE,
  nome      VARCHAR(100)  NOT NULL,
  frete     DECIMAL(8,2)  NOT NULL,
  ativo     BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS pedidos (
  id           SERIAL PRIMARY KEY,
  criado_em    TIMESTAMPTZ DEFAULT now(),
  tipo_entrega VARCHAR(50),
  cidade       VARCHAR(100),
  bairro       VARCHAR(100),
  subtotal     DECIMAL(10,2),
  frete        DECIMAL(10,2) DEFAULT 0,
  total        DECIMAL(10,2),
  status       VARCHAR(20) DEFAULT 'novo' CHECK (status IN ('novo','em_preparo','pronto','entregue')),
  whatsapp_msg TEXT
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id             SERIAL PRIMARY KEY,
  pedido_id      INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id     INT,
  nome           VARCHAR(200) NOT NULL,
  variacao_label VARCHAR(100),
  preco          DECIMAL(10,2) NOT NULL,
  quantidade     INT NOT NULL
);

-- ── Dados iniciais ──────────────────────────────────────────────
INSERT INTO cidades (id, nome) VALUES
  (1,'Carangola'), (2,'Varinhas'), (3,'Lacerdina')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bairros (cidade_id, nome, frete) VALUES
  (1,'Centro',        7.00),
  (1,'São Cristóvão', 7.00),
  (1,'Bom Jesus',     9.00),
  (1,'Rancho Fundo',  9.00),
  (2,'Centro',       12.00),
  (3,'Centro',       12.00)
ON CONFLICT DO NOTHING;

INSERT INTO categorias (nome, slug, ordem) VALUES
  ('Kits Sushi Preguiçoso',    'kits',       1),
  ('Peixes e Frutos do Mar',   'peixes',     2),
  ('Algas',                    'algas',      3),
  ('Temperos e Molhos',        'temperos',   4),
  ('Arroz e Bases',            'arroz',      5),
  ('Cream Cheese e Laticínios','laticinios', 6),
  ('Acessórios',               'acessorios', 7)
ON CONFLICT (slug) DO NOTHING;

SELECT setval('cidades_id_seq',  (SELECT MAX(id) FROM cidades));
SELECT setval('bairros_id_seq',  (SELECT MAX(id) FROM bairros));
SELECT setval('categorias_id_seq',(SELECT MAX(id) FROM categorias));

-- ── Tipo por peso/quantidade ──────────────────────────────────
ALTER TABLE produtos
  ADD COLUMN IF NOT EXISTS preco_unidade     DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS unidade_label     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS quantidade_minima INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_maxima INT,
  ADD COLUMN IF NOT EXISTS multiplo_de       INT DEFAULT 1;

ALTER TABLE produtos DROP CONSTRAINT IF EXISTS produtos_tipo_check;
ALTER TABLE produtos ADD CONSTRAINT produtos_tipo_check
  CHECK (tipo IN ('simples','variacao','peso'));
