// PS Corretor — Otimiza as fotos JÁ ENVIADAS ao Supabase Storage.
//
// Garantias para não perder nada:
//   • Mantém o MESMO caminho/nome de arquivo → as URLs gravadas no banco
//     (imoveis.fotos, capa, bairros_destaque.foto_url, corretor_perfil.foto_url)
//     continuam funcionando. O banco de dados NÃO é tocado.
//   • Mantém o MESMO formato (JPG continua JPG, PNG continua PNG, WebP continua WebP).
//   • Antes de substituir, salva o ORIGINAL em backup-originais/<bucket>/<arquivo>.
//   • Só substitui se o arquivo novo ficar pelo menos 15% menor.
//   • É seguro rodar mais de uma vez (o que já foi otimizado é ignorado).
//   • Por padrão só SIMULA. Para aplicar de verdade: node otimizar.mjs --apply
//
// Uso:
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<chave service_role do painel do Supabase>"
//   node otimizar.mjs            (simulação: mostra quanto economizaria)
//   node otimizar.mjs --apply    (aplica)
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zbnnwriwfnvcmsduxtti.supabase.co';
const BUCKETS = [
  { name: 'imoveis-fotos', maxSize: 1600 },
  { name: 'bairros', maxSize: 1600 },
  { name: 'avatares', maxSize: 512 },
];
const MIN_BYTES = 200 * 1024;     // abaixo disso não vale mexer
const MIN_GAIN = 0.15;            // só substitui se economizar >= 15%
const BACKUP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'backup-originais');

const fmt = (n) => (n / 1024 / 1024).toFixed(2) + ' MB';

/** Redimensiona (sem ampliar) e recomprime no mesmo formato. Retorna Buffer ou null se formato não suportado. */
export async function otimizarBuffer(buf, ext, maxSize) {
  let img = sharp(buf, { failOn: 'none' })
    .rotate() // aplica a rotação EXIF; (também remove metadados como GPS)
    .resize({ width: maxSize, height: maxSize, fit: 'inside', withoutEnlargement: true });
  switch (ext) {
    case 'jpg':
    case 'jpeg': return img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    case 'png':  return img.png({ compressionLevel: 9, effort: 10 }).toBuffer(); // sem perda de cor
    case 'webp': return img.webp({ quality: 80 }).toBuffer();
    default: return null;
  }
}

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

async function listarTudo(storage, prefix = '') {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.list(prefix, { limit: 1000, offset });
    if (error) throw new Error(`Falha ao listar "${prefix}": ${error.message}`);
    if (!data || !data.length) break;
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) out.push(...await listarTudo(storage, full)); // pasta
      else out.push({ path: full, size: item.metadata?.size ?? 0 });
    }
    if (data.length < 1000) break;
  }
  return out;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.error('Defina SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API Keys → service_role).');
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, key, { auth: { persistSession: false } });

  console.log(apply ? '>>> MODO APLICAR (vai substituir arquivos; originais vão para backup-originais/)\n'
                    : '>>> MODO SIMULAÇÃO (nada é alterado no Supabase)\n');

  let totalAntes = 0, totalDepois = 0, trocados = 0, ignorados = 0, erros = 0;

  for (const { name: bucket, maxSize } of BUCKETS) {
    console.log(`=== Bucket: ${bucket} ===`);
    const storage = supabase.storage.from(bucket);
    let arquivos;
    try { arquivos = await listarTudo(storage); }
    catch (e) { console.error('  ' + e.message); erros++; continue; }

    for (const f of arquivos) {
      const ext = f.path.split('.').pop().toLowerCase();
      if (!MIME[ext]) { ignorados++; continue; }
      if (f.size && f.size <= MIN_BYTES) { ignorados++; continue; }

      try {
        // Usa o backup local se já existir (evita baixar de novo); senão baixa e salva.
        const backupPath = path.join(BACKUP_DIR, bucket, f.path);
        let original;
        try { original = await fs.readFile(backupPath); }
        catch {
          const { data, error } = await storage.download(f.path);
          if (error) throw new Error('download: ' + error.message);
          original = Buffer.from(await data.arrayBuffer());
          await fs.mkdir(path.dirname(backupPath), { recursive: true });
          await fs.writeFile(backupPath, original);
        }
        if (original.length <= MIN_BYTES) { ignorados++; continue; }

        const novo = await otimizarBuffer(original, ext, maxSize);
        if (!novo || novo.length > original.length * (1 - MIN_GAIN)) {
          console.log(`  = ${f.path}  (${fmt(original.length)}) já está otimizada`);
          ignorados++;
          continue;
        }

        totalAntes += original.length; totalDepois += novo.length;
        const pct = Math.round((1 - novo.length / original.length) * 100);
        console.log(`  ${apply ? '✓' : '~'} ${f.path}  ${fmt(original.length)} → ${fmt(novo.length)}  (-${pct}%)`);

        if (apply) {
          const { error } = await storage.upload(f.path, novo, {
            upsert: true, contentType: MIME[ext], cacheControl: '2592000',
          });
          if (error) throw new Error('upload: ' + error.message);
          trocados++;
        }
      } catch (e) {
        console.error(`  ✗ ${f.path}: ${e.message}`);
        erros++;
      }
    }
  }

  console.log('\n──────── RESUMO ────────');
  console.log(`Antes:   ${fmt(totalAntes)}`);
  console.log(`Depois:  ${fmt(totalDepois)}   (economia de ${fmt(totalAntes - totalDepois)})`);
  console.log(apply ? `Arquivos substituídos: ${trocados}` : 'Simulação: nada foi alterado. Rode com --apply para aplicar.');
  console.log(`Ignorados (pequenos/já otimizados/outros formatos): ${ignorados} | Erros: ${erros}`);
  console.log(`Backup dos originais: ${BACKUP_DIR}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
