# Otimizar as fotos que já estão no Supabase

Recomprime as fotos já enviadas (buckets `imoveis-fotos`, `bairros` e `avatares`) para
reduzir o tráfego (egress) do plano gratuito do Supabase.

## O que NÃO muda (nada se perde)

- **Mesmo nome/caminho** de cada arquivo → as URLs gravadas no banco continuam valendo.
  O banco de dados **não é tocado**.
- **Mesmo formato** (JPG segue JPG, PNG segue PNG, WebP segue WebP).
- O **original é salvo** em `backup-originais/<bucket>/<arquivo>` antes de qualquer troca.
- Só substitui se o arquivo novo ficar **pelo menos 15% menor**. Fotos já pequenas são ignoradas.
- Pode rodar mais de uma vez com segurança.

O que muda: fotos acima de 1600 px (512 px nos avatares) são reduzidas a esse tamanho, e a
compressão é ajustada (qualidade ~80). Na tela do site a diferença não é perceptível.
A rotação EXIF é aplicada e os metadados (como GPS da foto) são removidos.

## Como usar

1. O serviço do Supabase precisa estar **liberado** (fora do bloqueio por cota).
2. Pegue a chave **service_role** em *Supabase → Project Settings → API Keys*.
   ⚠️ Ela é secreta: **nunca** coloque no código nem envie a ninguém.
3. No PowerShell, dentro desta pasta:

```powershell
npm install
$env:SUPABASE_SERVICE_ROLE_KEY = "COLE_A_CHAVE_AQUI"

npm run simular    # só mostra quanto economizaria (nada é alterado)
npm run aplicar    # aplica de verdade
```

## Como desfazer

Os originais ficam em `backup-originais/` (na raiz do projeto, fora do Git e fora do deploy).
Para restaurar um arquivo, basta reenviá-lo ao bucket com o mesmo nome.
