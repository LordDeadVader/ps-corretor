# PS Corretor de Imóveis

Site institucional e painel administrativo para a imobiliária **PS Corretor de Imóveis**. Projeto estático (HTML, CSS e JavaScript puro), sem necessidade de build, pronto para publicação no GitHub Pages.

## Estrutura

```
├── index.html              # Landing page (visão do cliente)
├── imovel.html             # Página de detalhes do imóvel (dinâmica)
├── privacidade.html        # Central de Privacidade (LGPD)
├── robots.txt              # Regras de indexação para buscadores (bloqueio de /admin)
├── sitemap.xml             # Sitemap canônico do site
├── vercel.json             # Deploy na Vercel, cleanUrls, headers de segurança (CSP/HSTS) e cache
├── admin/
│   ├── dashboard.html       # Dashboard do corretor
│   ├── properties.html      # Gestão de imóveis
│   ├── add-property.html    # Cadastro e edição de imóveis
│   ├── bairros.html         # Gestão dos bairros em destaque
│   ├── locacao-proprietarios.html # Cadastro de proprietários
│   ├── locacao-inquilinos.html    # Cadastro de inquilinos
│   ├── locacao-contratos.html     # Gestão de contratos de locação
│   ├── recibo-view.html     # Emissão, visualização e impressão de recibos com Pix
│   ├── privacidade-solicitacoes.html # Gestão de solicitações LGPD
│   ├── leads.html           # Leads / mensagens
│   ├── settings.html        # Configurações do perfil
│   └── login.html           # Autenticação do corretor
├── css/
│   ├── tokens.css           # Design tokens (cores, tipografia, espaçamento)
│   ├── style.css            # Estilos da landing page
│   ├── imovel.css           # Estilos da página de imóvel
│   ├── privacidade.css      # Estilos da Central de Privacidade
│   └── admin.css            # Estilos do painel administrativo
├── js/
│   ├── supabase-config.js   # Credenciais e cliente Supabase
│   ├── auth-guard.js        # Proteção de rotas do painel admin
│   ├── consent.js           # Gerenciador de consentimento e cookies LGPD
│   ├── main.js              # Interações e busca da landing page
│   ├── imovel.js            # Carregamento dinâmico e SEO do imóvel
│   └── admin.js             # Interações do painel
└── assets/                  # Logos, ícones, imagens dos bairros e fotos dos imóveis
```

## Rodar localmente

Qualquer servidor estático funciona. Exemplo com Python:

```bash
python -m http.server 5500
```

Depois acesse `http://localhost:5500`.

## Publicar na Vercel (Recomendado)

O projeto conta com `vercel.json` pré-configurado com cabeçalhos de segurança HTTP (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy), `cleanUrls` e cache de 1 ano para arquivos estáticos.

1. Conecte o repositório ao seu painel na Vercel (ou use `vercel` no terminal).
2. O deploy é automático como site estático.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (ex.: `ps-corretor`).
2. Suba este projeto:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/ps-corretor.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings → Pages**, selecione a branch `main` e a pasta raiz (`/`).
4. O site ficará disponível em `https://SEU_USUARIO.github.io/ps-corretor/`.

## Design System

- **Cores:** fundo off-white, azul-marinho como cor primária, dourado/cobre como cor de destaque (CTAs).
- **Tipografia:** Inter (Google Fonts).
- **Componentes:** cantos arredondados (8–16px), sombras suaves, transições em hover.

## LGPD

O projeto tem uma estrutura de conformidade com a LGPD (banner de cookies com bloqueio
real de scripts, Central de Privacidade em `/privacidade.html`, formulário de
solicitação de direitos dos titulares, registro de consentimento). Documentação
completa em [`docs/lgpd/README.md`](docs/lgpd/README.md) — inclui o que precisa ser
rodado no Supabase (`supabase/schema-lgpd.sql`) e o que ainda depende de preenchimento
pelo responsável (CNPJ, DPO, prazos de retenção).
