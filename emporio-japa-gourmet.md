# Empório Japa Gourmet — Documentação do Projeto

## Visão geral

Loja virtual de ingredientes e acessórios para fazer sushi em casa, operada pelo restaurante **Sushi Gourmet** de Carangola/MG. O cliente monta o pedido, escolhe a forma de entrega e finaliza pelo WhatsApp. Não há gateway de pagamento — o pagamento é combinado diretamente.

---

## URLs

| Ambiente | URL |
|---|---|
| Loja (cliente) | `emporio.sushigourmet.com.br` |
| Painel admin | `emporio.sushigourmet.com.br/emporio` |
| Repositório GitHub | `https://github.com/n8nsushigourmet/emporio-do-japa-gourmet` |

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Front-end | HTML5 + CSS3 + JS vanilla (zero frameworks) |
| Back-end | PHP (serverless via Vercel + `vercel-php`) |
| Banco de dados | PostgreSQL — Supabase |
| Hospedagem | Vercel (frontend + PHP serverless) |
| Repositório | GitHub |
| Fontes | Google Fonts — Cormorant Garamond + DM Sans |

**Requisitos de performance:** meta 90+ PageSpeed. Zero dependências externas além das fontes. Mobile-first, responsivo em 4 breakpoints.

---

## Infraestrutura e variáveis de ambiente

### Variáveis configuradas (`.env.local` — nunca commitar)

| Variável | Valor |
|---|---|
| `DB_HOST` | `aws-1-sa-east-1.pooler.supabase.com` |
| `DB_PORT` | `5432` |
| `DB_NAME` | `postgres` |
| `DB_USER` | `postgres.tecpmlrhrbvjvqevdcke` |
| `DB_PASS` | *(ver `.env.local`)* |
| `GITHUB_TOKEN` | *(ver `.env.local`)* |
| `VERCEL_TOKEN` | *(a configurar)* |

O arquivo `.env.example` na raiz documenta as variáveis. O `.env.local` real está no `.gitignore`.

### Supabase

- **Project ID:** `tecpmlrhrbvjvqevdcke`
- **Região:** `sa-east-1` (São Paulo)
- **Schema:** executado em 2026-05-29 — todas as tabelas criadas com dados iniciais

---

## Paleta de cores — Âmbar Gourmet

```css
--creme:          #F5F0E8   /* fundo principal */
--creme-escuro:   #EDE6D6   /* superfícies secundárias */
--marrom:         #6B4226   /* cor da logo */
--marrom-escuro:  #4A2C18   /* header, botões primários */
--ambar:          #C8920A   /* cor de ação, badges */
--ambar-claro:    #EF9F27   /* destaques, preços em promoção */
--ambar-fundo:    #FAEEDA   /* fundo de badges e alertas */
--preto:          #1A1209   /* textos sobre fundo âmbar */
--texto:          #2C1A0E   /* texto principal */
--texto-suave:    #7A5C42   /* texto secundário */
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

## Entrega e frete

O sistema de frete é dinâmico, gerenciado pelo painel admin em **Fretes**.

### Fluxo no carrinho

1. O cliente escolhe **Retirada na loja** ou **Entrega em domicílio**
2. Se domicílio: seleciona a **cidade** (carregada via `GET /api/cidades.php`)
3. Após escolher a cidade: seleciona o **bairro** (carregado via `GET /api/bairros.php?cidade_id=X`)
4. O valor do frete aparece automaticamente ao selecionar o bairro
5. Total = subtotal + frete do bairro

### Dados padrão cadastrados

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

## Categorias de produtos

1. Kits Sushi Preguiçoso
2. Peixes e Frutos do Mar
3. Algas
4. Temperos e Molhos
5. Arroz e Bases
6. Cream Cheese e Laticínios
7. Acessórios

---

## Funcionalidades — Loja do cliente (`index.html`)

### Cabeçalho
- Logo circular do Sushi Gourmet (fundo creme, borda âmbar)
- Barra de busca — accent-insensitive (normalização NFD, busca "salmao" encontra "Salmão")
- Botão do carrinho com badge de quantidade

### Hero
- Foto de capa com overlay escuro
- Eyebrow, título tipográfico (Cormorant itálico)
- Tags de horário e localização

### Navegação de categorias
- Pills horizontais deslizáveis, sticky abaixo do header
- Filtros: Todos, ⭐ Destaques, + cada categoria com produtos ativos

### Cards de produto
- Foto WebP (lazy loading)
- Nome, descrição curta
- Seletor de variação quando aplicável (ex: 100g / 200g / 500g)
- Preço normal ou preço riscado + preço promocional
- Badges: Promoção (âmbar) e Kit (marrom escuro)
- Botão "+" para adicionar ao carrinho

### Carrinho e checkout

**Barra flutuante** — aparece ao adicionar o primeiro item, mostra subtotal  
**Modal de pedido:**
- Lista de itens com controle de quantidade (+/−/remover)
- Seção de entrega em 2 passos:
  - Botões **Retirada na loja** / **Entrega em domicílio**
  - Se retirada: exibe endereço e horário
  - Se domicílio: select de cidade → select de bairro (dinâmico via API) → frete exibido automaticamente
- Totais: subtotal / frete / total (atualizados em tempo real)
- Botão "Finalizar pelo WhatsApp"

### Mensagem WhatsApp gerada (exemplos)

**Retirada:**
```
🍣 Pedido — Empório Japa Gourmet

• Salmão Fresco (200g) x1 — R$ 72,00
• Alga Nori x2 — R$ 48,00

*Subtotal:* R$ 120,00
*Entrega:* Retirada na loja (Grátis)
*Total:* R$ 120,00

📍 Retirada: Rua Dr. Olímpio Teixeira, 290, Centro, Carangola/MG
🕐 Seg–Sáb · 17h às 23h
```

**Entrega:**
```
🍣 Pedido — Empório Japa Gourmet

• Salmão Fresco (200g) x1 — R$ 72,00

*Subtotal:* R$ 72,00
*Entrega:* Centro, Carangola — R$ 7,00
*Total:* R$ 79,00
```

---

## Funcionalidades — Painel admin (`/emporio`)

### Autenticação
- Login com usuário + senha (bcrypt)
- Sessão PHP com timeout de 8 horas
- CSRF token em todos os formulários POST
- Tema escuro: fundo `#0A0604`, destaques âmbar

### Páginas do painel

| Rota | Função |
|---|---|
| `/emporio/` | Login / logout |
| `/emporio/dashboard.php` | Resumo de vendas e pedidos recentes |
| `/emporio/produtos.php` | CRUD de produtos (foto, preços, promoção, variações) |
| `/emporio/categorias.php` | CRUD de categorias com reordenação |
| `/emporio/kits.php` | Montador de kits (produtos agrupados) |
| `/emporio/pedidos.php` | Lista de pedidos, troca de status |
| `/emporio/importar.php` | Importação em massa via CSV |
| `/emporio/frete.php` | Gestão de cidades e bairros com fretes |
| `/emporio/setup.php` | Criação do primeiro usuário admin |

### Cadastro de produtos

| Campo | Tipo |
|---|---|
| Nome | texto |
| Descrição | textarea |
| Categoria | select |
| Foto | upload → converte para WebP 900px max, 5MB max |
| Tipo | `simples` ou `variacao` |
| Preço (simples) | decimal |
| Variações | lista: rótulo + preço (ex: "200g — R$ 72,00") |
| Ativo | toggle |
| Destaque | toggle |
| Em promoção | toggle + preço original + preço promo + data início/fim |

### Gestão de fretes

- **Cidades:** criar, ativar/desativar, excluir
- **Bairros:** criar por cidade, definir valor de frete, ativar/desativar, editar
- Cidades/bairros inativos não aparecem nos selects da loja

### Gestão de pedidos
- Lista cronológica de pedidos recebidos
- Troca de status: `novo` → `em_preparo` → `pronto` → `entregue`
- Exibe cidade, bairro e frete de cada pedido

---

## Estrutura de arquivos

```
emporio-do-japa-gourmet/
├── index.html                  ← loja do cliente
├── vercel.json                 ← configuração Vercel + PHP runtime
├── .gitignore
├── .env.example                ← modelo das variáveis de ambiente
├── .env.local                  ← variáveis reais (não commitado)
├── .htaccess                   ← HTTPS, segurança, cache (Apache/Hostinger)
│
├── api/
│   ├── produtos.php            ← GET → JSON com produtos ativos + variações
│   ├── categorias.php          ← GET → JSON com categorias
│   ├── cidades.php             ← GET → JSON com cidades ativas
│   ├── bairros.php             ← GET ?cidade_id=X → JSON com bairros + fretes
│   ├── pedido.php              ← POST → registra pedido no banco
│   └── emporio/                ← painel admin (movido para cá em 2026-05-29)
│       ├── index.php           ← login
│       ├── dashboard.php
│       ├── produtos.php
│       ├── categorias.php
│       ├── kits.php
│       ├── pedidos.php
│       ├── importar.php
│       ├── frete.php           ← gestão de cidades e bairros
│       ├── setup.php           ← criação do primeiro admin
│       ├── logout.php
│       └── includes/
│           ├── auth.php        ← sessão, CSRF, flash messages
│           ├── db.php          ← PDO PostgreSQL (usa env vars)
│           ├── helpers.php     ← h(), brl(), uploadImagem(), promoAtiva()…
│           ├── head.php        ← layout: sidebar + topbar
│           └── foot.php        ← fechamento do layout
│
├── assets/
│   ├── css/
│   │   ├── style.css           ← loja do cliente
│   │   └── admin.css           ← painel admin (tema escuro)
│   └── js/
│       └── app.js              ← toda a lógica da loja (estado, render, carrinho)
│
├── uploads/
│   ├── logo-sushi-gourmet.png.jpeg   ← logo circular do header
│   └── produtos/               ← fotos WebP geradas pelo admin
│       └── .htaccess
│
└── database/
    ├── schema.sql              ← schema MySQL (referência / Hostinger)
    └── schema-postgres.sql     ← schema PostgreSQL (Supabase — executado)
```

---

## Banco de dados — tabelas

```
usuarios         (id, usuario, senha_hash, nome, criado_em)
categorias       (id, nome, slug, ordem, ativo)
produtos         (id, categoria_id, nome, descricao, foto, tipo, preco,
                  destaque, ativo, promo, preco_original, preco_promo,
                  promo_inicio, promo_fim, criado_em)
variacoes        (id, produto_id, rotulo, preco)
kits             (id, nome, descricao, foto, preco, ativo, criado_em)
kit_itens        (id, kit_id, produto_id, variacao_id, quantidade)
pedidos          (id, criado_em, tipo_entrega, cidade, bairro,
                  subtotal, frete, total, status, whatsapp_msg)
pedido_itens     (id, pedido_id, produto_id, variacao_id, nome,
                  variacao_label, preco, quantidade)
cidades          (id, nome, ativo)
bairros          (id, cidade_id, nome, frete, ativo)
```

---

## Deploy — GitHub + Vercel + Supabase

### Status atual (2026-05-29)

| Etapa | Status |
|---|---|
| Repositório GitHub | ✅ `github.com/n8nsushigourmet/emporio-do-japa-gourmet` |
| Schema Supabase | ✅ Executado — 10 tabelas + dados iniciais |
| Vercel — projeto | ⏳ Aguardando token da Vercel |
| Vercel — env vars | ⏳ Aguardando deploy |
| Primeiro usuário admin | ⏳ Após deploy: acessar `/emporio/setup.php` |

### Próximos deploys (fluxo normal)

Com tudo configurado, o fluxo é totalmente automático:
1. Faça alterações no código
2. Claude Code faz `git push`
3. Vercel detecta o push e deploya automaticamente

### Criar o primeiro usuário admin

Após o primeiro deploy bem-sucedido, acesse:
```
https://SEU_DOMINIO.vercel.app/emporio/setup.php
```

### Limitação de uploads no Vercel

O Vercel é serverless — **arquivos enviados pelo admin não persistem entre deploys**. Para produção, integrar o upload ao **Supabase Storage** e salvar apenas a URL no banco.

---

## Contato / referências

- **WhatsApp restaurante:** (32) 99997-5892
- **Instagram:** @sushigourmet
- **Sistema financeiro interno:** Chefbox (referência visual para o painel admin)
