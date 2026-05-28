-- Empório Japa Gourmet — Schema PostgreSQL (Supabase)
-- Execute este arquivo no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS usuarios (
  id         SERIAL PRIMARY KEY,
  usuario    VARCHAR(50)  NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  nome       VARCHAR(100) NOT NULL,
  criado_em  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
  id    SERIAL PRIMARY KEY,
  nome  VARCHAR(100) NOT NULL,
  slug  VARCHAR(100) NOT NULL UNIQUE,
  ordem INT          DEFAULT 0,
  ativo SMALLINT     DEFAULT 1
);

CREATE TABLE IF NOT EXISTS produtos (
  id             SERIAL PRIMARY KEY,
  categoria_id   INT,
  nome           VARCHAR(200) NOT NULL,
  descricao      TEXT,
  foto           VARCHAR(255),
  tipo           VARCHAR(20)   NOT NULL DEFAULT 'simples' CHECK (tipo IN ('simples','variacao')),
  preco          DECIMAL(10,2),
  destaque       SMALLINT DEFAULT 0,
  ativo          SMALLINT DEFAULT 1,
  promo          SMALLINT DEFAULT 0,
  preco_original DECIMAL(10,2),
  preco_promo    DECIMAL(10,2),
  promo_inicio   DATE,
  promo_fim      DATE,
  criado_em      TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS variacoes (
  id         SERIAL PRIMARY KEY,
  produto_id INT NOT NULL,
  rotulo     VARCHAR(100)  NOT NULL,
  preco      DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kits (
  id        SERIAL PRIMARY KEY,
  nome      VARCHAR(200) NOT NULL,
  descricao TEXT,
  foto      VARCHAR(255),
  preco     DECIMAL(10,2),
  ativo     SMALLINT DEFAULT 1,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kit_itens (
  id          SERIAL PRIMARY KEY,
  kit_id      INT NOT NULL,
  produto_id  INT NOT NULL,
  variacao_id INT,
  quantidade  INT DEFAULT 1,
  FOREIGN KEY (kit_id)      REFERENCES kits(id)      ON DELETE CASCADE,
  FOREIGN KEY (produto_id)  REFERENCES produtos(id)  ON DELETE CASCADE,
  FOREIGN KEY (variacao_id) REFERENCES variacoes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pedidos (
  id           SERIAL PRIMARY KEY,
  criado_em    TIMESTAMP DEFAULT NOW(),
  tipo_entrega VARCHAR(50),
  cidade       VARCHAR(100),
  bairro       VARCHAR(100),
  subtotal     DECIMAL(10,2),
  frete        DECIMAL(10,2),
  total        DECIMAL(10,2),
  status       VARCHAR(20) DEFAULT 'novo' CHECK (status IN ('novo','em_preparo','pronto','entregue')),
  whatsapp_msg TEXT
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id             SERIAL PRIMARY KEY,
  pedido_id      INT NOT NULL,
  produto_id     INT,
  variacao_id    INT,
  nome           VARCHAR(200) NOT NULL,
  variacao_label VARCHAR(100),
  preco          DECIMAL(10,2) NOT NULL,
  quantidade     INT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cidades (
  id    SERIAL PRIMARY KEY,
  nome  VARCHAR(100) NOT NULL,
  ativo SMALLINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bairros (
  id        SERIAL PRIMARY KEY,
  cidade_id INT NOT NULL,
  nome      VARCHAR(100)  NOT NULL,
  frete     DECIMAL(8,2)  NOT NULL,
  ativo     SMALLINT DEFAULT 1,
  FOREIGN KEY (cidade_id) REFERENCES cidades(id) ON DELETE CASCADE
);

-- ── Dados iniciais ──────────────────────────────────────────────

INSERT INTO cidades (id, nome) VALUES
  (1,'Carangola'), (2,'Varinhas'), (3,'Lacerdina')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bairros (cidade_id, nome, frete) VALUES
  (1,'Centro',         7.00),
  (1,'São Cristóvão',  7.00),
  (1,'Bom Jesus',      9.00),
  (1,'Rancho Fundo',   9.00),
  (2,'Centro',        12.00),
  (3,'Centro',        12.00)
ON CONFLICT DO NOTHING;

INSERT INTO categorias (nome, slug, ordem) VALUES
  ('Kits Sushi Preguiçoso',       'kits',       1),
  ('Peixes e Frutos do Mar',       'peixes',     2),
  ('Algas',                        'algas',      3),
  ('Temperos e Molhos',            'temperos',   4),
  ('Arroz e Bases',                'arroz',      5),
  ('Cream Cheese e Laticínios',    'laticinios', 6),
  ('Acessórios',                   'acessorios', 7)
ON CONFLICT (slug) DO NOTHING;

-- Atualizar sequences após inserções com ID explícito
SELECT setval('cidades_id_seq',  (SELECT MAX(id) FROM cidades));
SELECT setval('bairros_id_seq',  (SELECT MAX(id) FROM bairros));

-- Admin: acesse /emporio/setup.php após o deploy para criar o primeiro usuário
