# PS Corretor de Imóveis

Site institucional e painel administrativo para a imobiliária **PS Corretor de Imóveis**. Projeto estático (HTML, CSS e JavaScript puro), sem necessidade de build, pronto para publicação no GitHub Pages.

## Estrutura

```
├── index.html              # Landing page (visão do cliente)
├── admin/
│   ├── dashboard.html       # Dashboard do corretor
│   ├── properties.html      # Meus Imóveis
│   ├── add-property.html    # Cadastro de novo imóvel
│   ├── leads.html           # Leads / mensagens
│   └── settings.html        # Configurações
├── css/
│   ├── tokens.css           # Design tokens (cores, tipografia, espaçamento)
│   ├── style.css            # Estilos da landing page
│   └── admin.css            # Estilos do painel administrativo
├── js/
│   ├── main.js               # Interações da landing page
│   └── admin.js               # Interações do painel (sidebar, upload de mídia)
└── assets/
    └── logo.jpeg
```

## Rodar localmente

Qualquer servidor estático funciona. Exemplo com Python:

```bash
python -m http.server 5500
```

Depois acesse `http://localhost:5500`.

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
