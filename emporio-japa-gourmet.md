# Empório Japa Gourmet — Documentação do Projeto

## Visão geral

Loja virtual de ingredientes e acessórios para fazer sushi em casa, operada pelo restaurante **Sushi Gourmet** de Carangola/MG. O cliente monta o pedido, escolhe a forma de entrega e finaliza pelo WhatsApp. Não há gateway de pagamento — o pagamento é combinado diretamente.

---

## URLs

| Ambiente | URL |
|---|---|
| Loja (cliente) | `emporio.sushigourmet.com.br` |
| Painel admin | `emporio.sushigourmet.com.br/emporio` |
| Senha admin | `SushiGourmet@2025` (variável `ADMIN_TOKEN`) |
| Repositório GitHub | `https://github.com/n8nsushigourmet/emporio-do-japa-gourmet` |

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Front-end loja | HTML5 + CSS3 + JS vanilla (zero frameworks) |
| Front-end admin | HTML5 + CSS3 + JS vanilla (SPA single-file `emporio/index.html`) |
| Back-end | Node.js — Vercel Serverless Functions (`api/` directory) |
| Banco de dados | PostgreSQL via **Supabase JS SDK** (`@supabase/supabase-js`) |
| Storage de imagens | Supabase Storage — bucket `produtos` (público) |
| Hospedagem | Vercel (plano Hobby — limite de **12 serverless functions**) |
| Repositório | GitHub (`n8nsushigourmet/emporio-do-japa-gourmet`) |
| Fontes | Google Fonts — Cormorant Garamond + DM Sans |

> **Nota:** A stack foi migrada de PHP + pg direto para Node.js + Supabase JS SDK. Não há mais arquivos `.php` nem conexão PDO/pg direta.

---

## Infraestrutura e variáveis de ambiente

### Variáveis no `.env.local` (nunca commitar) e na Vercel

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | `https://ladimbcsqhjajymvafqc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (ignora RLS, usado nas serverless functions) |
| `SUPABASE_ANON_KEY` | Anon key (leitura pública, não usado diretamente — referência) |
| `ADMIN_TOKEN` | `SushiGourmet@2025` — senha do painel admin (Bearer token) |
| `VERCEL_TOKEN` | Token pessoal da Vercel (usado para atualizações via API) |

O arquivo `.env.example` na raiz documenta as variáveis. O `.env.local` real está no `.gitignore`.

### Supabase

- **Project ID:** `ladimbcsqhjajymvafqc`
- **Nome do projeto:** Empório do Japa - Oficial
- **Organização:** Emporio do Japa
- **Conta:** `jaysondainese@gmail.com`
- **Região:** `sa-east-1` (São Paulo)
- **Schema de referência:** `supabase/schema-completo.sql` (commitado no repo)

### Vercel

- **Projeto:** `emporio-do-japa-gourmet` (`prj_qQsJJceHWfhBFXGSxjv4W7GCTKfm`)
- **Deploy automático:** push para `main` → Vercel detecta e deploya
- **Limite do plano Hobby:** 12 serverless functions (cada arquivo em `api/` conta como 1)

---

## Paleta de cores — Âmbar Gourmet

```css
--creme:          #F5F0E8   /* fundo principal */
--creme-escuro:   #EDE6D6   /* superfícies secundárias */
--marrom:         #6B4226   /* cor da logo */
--marrom-escuro:  #4A2C18   /* header, botões primários */
--ambar:          #C8920A   /* cor de ação, badges, preços promo */
--ambar-claro:    #EF9F27   /* destaques */
--ambar-fundo:    #FAEEDA   /* fundo de badges e alertas */
--preto:          #1A1209   /* textos sobre fundo âmbar */
--texto:          #2C1A0E   /* texto principal */
--texto-suave:    #7A5C42   /* texto secundário */
```

Admin (`admin.css`):
```css
--bg:       #0A0604  --bg-card:  #140C06  --bg-hover: #1C1008
--border:   #2A1A0C  --border2:  #3A2510  --ambar:    #C8920A
--text:     #F5EDD8  --text-dim: #8A6848  --red:      #c0392b
```

---

## Tipografia

- **Display / títulos:** Cormorant Garamond (serif, itálico nos títulos grandes)
- **Corpo / UI:** DM Sans (sans-serif)

---

## Breakpoints responsivos

| Breakpoint | Largura | Grid de produtos |
|---|---|---|
| Mobile | até 480px | 2 colunas |
| Tablet | 481–768px | 3 colunas |
| iPad | 769–1024px | 4 colunas |
| Desktop | 1025px+ | 5 colunas |

---

## Banco de dados — tabelas atuais

### `categorias`
```
id, nome, slug, ordem, ativo, criado_em
```

### `produtos`
```
id, categoria_id, nome, descricao,
foto          VARCHAR(500)   -- foto principal (legado / compat)
fotos         JSONB          -- galeria de até 4 fotos (array de URLs)
tipo          VARCHAR(20)    -- 'simples' | 'variacao' | 'peso'
preco         DECIMAL(10,2)
destaque      BOOLEAN
ativo         BOOLEAN
promo         BOOLEAN
preco_original, preco_promo, promo_inicio (DATE), promo_fim (DATE)
preco_unidade DECIMAL(10,2)  -- preço por unidade (ex: por 100g)
unidade_label VARCHAR(20)    -- ex: '100g', 'kg', 'un'
quantidade_minima INT
quantidade_maxima INT
multiplo_de   INT            -- ex: 50 → quantidades múltiplas de 50g
criado_em     TIMESTAMPTZ
```

### `variacoes`
```
id, produto_id, rotulo, preco
```

### `kits`
```
id, nome, descricao, foto, preco, ativo, criado_em
```

### `kit_itens`
```
id, kit_id, produto_id, variacao_id, quantidade
```

### `cidades`
```
id, nome, ativo
```

### `bairros`
```
id, cidade_id, nome, frete, ativo
```

### `pedidos`
```
id, criado_em, tipo_entrega, cidade, bairro,
subtotal, frete, total,
status   VARCHAR(20)  -- 'novo' | 'em_preparo' | 'pronto' | 'entregue'
whatsapp_msg
```

### `pedido_itens`
```
id, pedido_id, produto_id, nome, variacao_label, preco, quantidade
```

> **RLS:** habilitado em todas as tabelas. As serverless functions usam `SUPABASE_SERVICE_ROLE_KEY` que ignora RLS automaticamente.

> **Storage:** bucket `produtos` (público). URLs no formato `https://ladimbcsqhjajymvafqc.supabase.co/storage/v1/object/public/produtos/<filename>`.

---

## Serverless functions (`api/`)

| Arquivo | Método | Função |
|---|---|---|
| `api/_db.js` | — | Instância compartilhada do Supabase client |
| `api/produtos.js` | GET | Produtos ativos + variações (público) |
| `api/categorias.js` | GET | Categorias (público) |
| `api/cidades.js` | GET | Cidades ativas (público) |
| `api/bairros.js` | GET `?cidade_id=X` | Bairros ativos com frete (público) |
| `api/pedidos.js` | POST | Registrar pedido + itens (público) |
| `api/admin/_auth.js` | — | Middleware de autenticação (Bearer ADMIN_TOKEN) |
| `api/admin/produtos.js` | GET/POST/PUT/PATCH/DELETE + `?action=upload` | CRUD de produtos + upload de foto |
| `api/admin/categorias.js` | GET/POST/PUT/DELETE | CRUD de categorias |
| `api/admin/pedidos.js` | GET/PATCH | Listagem e troca de status de pedidos |
| `api/admin/fretes.js` | GET/POST/PUT/DELETE | CRUD de cidades e bairros |
| `api/admin/kits.js` | GET/POST/PUT/DELETE | CRUD de kits |

> **Limite Hobby:** 12 functions = 11 arquivos acima + 1 reserva.  
> `_db.js` e `_auth.js` são módulos auxiliares (não contam como functions separadas).

---

## Tipos de produto

### `simples`
Produto com preço fixo único.

### `variacao`
Produto com variações de tamanho/porção. Cada variação tem rótulo e preço próprio.
Ex: Salmão Fresco → [100g R$38] [200g R$72] [500g R$170]

### `peso`
Produto vendido por peso/quantidade arbitrária.
- `preco_unidade`: preço por `unidade_label` (ex: R$28,00/100g)
- `quantidade_minima`: mínimo aceitável
- `quantidade_maxima`: máximo aceitável (opcional)
- `multiplo_de`: sugestão de arredondamento (ex: 50 → múltiplos de 50g)
- Hint suave ao detectar valor não-múltiplo: "💡 Sugerimos arredondar para Xg"

---

## Funcionalidades implementadas

### Loja do cliente (`index.html` + `assets/js/app.js`)

- Header: logo + busca accent-insensitive + botão carrinho com badge
- Hero: foto de capa, título tipográfico, tags de horário e localização
- Navegação de categorias: pills deslizáveis, sticky
- Grid de produtos responsivo (2–5 colunas)
- Card de produto:
  - Foto (usa `fotos[0]` ou `foto` como fallback)
  - Badges: Promoção, Kit, Destaque
  - Seletor de variação (pills inline no card)
  - Input de quantidade para produtos `peso`
  - Hint de arredondamento para múltiplos
  - Botão "+" adicionar ao carrinho
  - Clique no card abre modal de produto
- Modal de produto (mobile-first):
  - **Mobile (≤480px):** bottom sheet 85dvh, foto 16/9, variações em pills antes do preço, botão fixo 52px no rodapé, swipe down no handle fecha
  - **Desktop (769px+):** modal 480px centralizado, foto à esquerda, info à direita, animação fade+scale
  - Pills de variação estilo ML/Shopee: `[rótulo  R$ preço]`, selecionado = marrom escuro + creme
  - Preço no rodapé do sheet atualiza ao trocar variação
- Carrinho:
  - Barra flutuante ao adicionar primeiro item
  - Modal com lista de itens, controle +/−/remover
  - Seção de entrega: Retirada / Domicílio
  - Select dinâmico de cidades e bairros (API)
  - Totais em tempo real
  - Finalizar pelo WhatsApp (registra pedido na API antes de abrir o WA)
- Fallback demo: se API falhar, exibe dados demo locais (Promise.allSettled)

### Painel admin (`emporio/index.html`)

- Autenticação: token Bearer (`ADMIN_TOKEN`) via header Authorization
- SPA: navegação por seções sem reload (hash-based)
- Tema escuro
- **Produtos:**
  - Listagem com busca, filtro por categoria
  - Toggle Ativo/Inativo clicável na tabela (PATCH imediato)
  - Toggle Destaque (⭐) clicável na tabela (PATCH imediato)
  - Badge "Promo expirada" (data atual > `promo_fim`)
  - Formulário completo: nome, descrição, categoria, tipo, preços
  - Galeria de até 4 fotos: upload por slot, foto principal (slot 0), remover por slot
  - Upload via `?action=upload` → Supabase Storage → URL salva no JSONB `fotos`
  - Variações dinâmicas: adicionar/remover rótulo+preço
  - Campos de promoção com datas início/fim
  - Campos específicos para tipo `peso`: preco_unidade, unidade_label, min/max/multiplo
- **Categorias:** CRUD básico
- **Pedidos:** listagem, troca de status
- **Fretes:** CRUD de cidades e bairros

---

## Entrega e frete

### Fluxo no carrinho
1. Cliente escolhe **Retirada na loja** ou **Entrega em domicílio**
2. Se domicílio: seleciona cidade → bairro (carregado via API)
3. Frete aparece automaticamente com o bairro
4. Total = subtotal + frete

### Dados padrão

| Cidade | Bairro | Frete |
|---|---|---|
| Carangola | Centro | R$ 7,00 |
| Carangola | São Cristóvão | R$ 7,00 |
| Carangola | Bom Jesus | R$ 9,00 |
| Carangola | Rancho Fundo | R$ 9,00 |
| Varinhas | Centro | R$ 12,00 |
| Lacerdina | Centro | R$ 12,00 |

### Retirada
**Grátis** — Rua Doutor Olímpio Teixeira, 290, Centro, Carangola/MG
**Horário:** segunda a sábado, 17h às 23h

### WhatsApp
(32) 99997-5892 → `https://wa.me/5532999975892`

---

## Categorias cadastradas

| Ordem | Nome | Slug |
|---|---|---|
| 1 | Kits Sushi Preguiçoso | `kits` |
| 2 | Peixes e Frutos do Mar | `peixes` |
| 3 | Algas | `algas` |
| 4 | Temperos e Molhos | `temperos` |
| 5 | Arroz e Bases | `arroz` |
| 6 | Cream Cheese e Laticínios | `laticinios` |
| 7 | Acessórios | `acessorios` |

---

## Estrutura de arquivos

```
emporio-do-japa-gourmet/
├── index.html                    ← loja do cliente
├── vercel.json                   ← rewrites Vercel
├── package.json                  ← dependência: @supabase/supabase-js
├── .gitignore
├── .env.example
├── .env.local                    ← variáveis reais (não commitado)
│
├── api/
│   ├── _db.js                    ← Supabase client singleton
│   ├── produtos.js               ← GET público
│   ├── categorias.js             ← GET público
│   ├── cidades.js                ← GET público
│   ├── bairros.js                ← GET ?cidade_id=X público
│   ├── pedidos.js                ← POST público
│   └── admin/
│       ├── _auth.js              ← middleware Bearer token
│       ├── produtos.js           ← CRUD + upload (bodyParser: false)
│       ├── categorias.js         ← CRUD
│       ├── pedidos.js            ← GET + PATCH status
│       ├── fretes.js             ← CRUD cidades e bairros
│       └── kits.js               ← CRUD kits
│
├── assets/
│   ├── css/
│   │   ├── style.css             ← loja (variáveis CSS, mobile-first)
│   │   └── admin.css             ← painel admin (tema escuro)
│   ├── js/
│   │   └── app.js                ← toda a lógica da loja
│   └── img/
│       └── logo-sushi-gourmet.jpg.jpeg
│
├── emporio/
│   └── index.html                ← painel admin (SPA)
│
└── supabase/
    ├── schema.sql                ← schema original (referência)
    └── schema-completo.sql       ← schema atual completo (migração)
```

---

## Pendências / roadmap

| Funcionalidade | Status |
|---|---|
| Modal mobile-first com bottom sheet e pills de variação | ✅ Implementado |
| Múltiplas fotos por produto (galeria 4 slots) | ✅ Implementado |
| Toggle ativo/destaque clicável na listagem admin | ✅ Implementado |
| Promoções com data início/fim + expiração automática | ✅ Implementado |
| Hint de arredondamento para produtos por peso | ✅ Implementado |
| Sugestão de valor ao cliente no produto peso | ✅ Implementado |
| **Gestão de pedidos no painel** (visualizar, trocar status) | 🔲 Pendente |
| **Fechamento de caixa** (resumo do dia/período) | 🔲 Pendente |
| **Importação CSV** de produtos em massa | 🔲 Pendente |
| **Gestão de frete por bairro** no painel | 🔲 Pendente |
| **Montador de kits** no painel | 🔲 Pendente |

---

## Contato / referências

- **WhatsApp restaurante:** (32) 99997-5892
- **Instagram:** @sushigourmet
- **Sistema financeiro interno:** Chefbox (referência visual para o painel admin)
- **Conta Vercel/GitHub:** `n8nsushigourmet`
- **Conta Supabase:** `jaysondainese@gmail.com`
