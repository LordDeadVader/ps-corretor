// PS Corretor de Imóveis — Compressão e Marca d'Água automática no navegador
//
// Fotos de celular/câmera costumam ter 3–8 MB. Para exibir no site bastam
// ~100–180 KB. Reduzir o arquivo ANTES do upload economiza armazenamento e
// tráfego (egress) do Supabase, além de aplicar a marca d'água oficial em PNG
// cinza com 80% de opacidade.
//
// Uso:
//   const { file, contentType } = await compressImage(file, {
//     maxSize: 1280,
//     quality: 0.78,
//     maxBytes: 180 * 1024,
//     watermark: { opacity: 0.80, position: 'center' } // ou true
//   });
(function () {
  var SKIP_BELOW_BYTES = 120 * 1024; // já é pequena (< 120 KB): não mexe (exceto se tiver marca d'água)
  var cachedWatermarkPromise = null;

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve) { canvas.toBlob(resolve, type, quality); });
  }

  async function loadBitmap(file) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) { /* cai para <img> */ }
    }
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function (e) { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  }

  function getDefaultWatermarkUrl() {
    var inAdmin = window.location.pathname.indexOf('/admin/') !== -1;
    return (inAdmin ? '../' : '') + 'assets/watermark-logo.png?v=20261020b';
  }

  function loadWatermarkImage(customUrl) {
    var url = customUrl || getDefaultWatermarkUrl();
    if (!customUrl && cachedWatermarkPromise) return cachedWatermarkPromise;
    var p = new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { resolve(img); };
      img.onerror = function () {
        console.warn('Não foi possível carregar a marca d\'água:', url);
        resolve(null);
      };
      img.src = url;
    });
    if (!customUrl) cachedWatermarkPromise = p;
    return p;
  }

  async function drawWatermark(ctx, tw, th, wmConfig) {
    if (!wmConfig) return false;
    var opts = typeof wmConfig === 'object' ? wmConfig : {};
    var wmImg = await loadWatermarkImage(opts.url);
    if (!wmImg || !wmImg.width || !wmImg.height) return false;

    var opacity = typeof opts.opacity === 'number' ? opts.opacity : 0.80;
    var position = opts.position || 'center'; // 'center' | 'bottom-right' | 'bottom-left'
    var aspect = wmImg.width / wmImg.height;

    // Escala proporcional à foto
    var scaleRatio = position === 'center' ? 0.34 : 0.24;
    if (typeof opts.scale === 'number') scaleRatio = opts.scale;

    var baseRef = Math.min(tw, th);
    var wmW = Math.round(Math.max(110, Math.min(tw * 0.55, baseRef * scaleRatio * 1.25)));
    var wmH = Math.round(wmW / aspect);

    var pad = Math.round(Math.max(16, baseRef * 0.035));
    var x = Math.round((tw - wmW) / 2);
    var y = Math.round((th - wmH) / 2);

    if (position === 'bottom-right') {
      x = tw - wmW - pad;
      y = th - wmH - pad;
    } else if (position === 'bottom-left') {
      x = pad;
      y = th - wmH - pad;
    } else if (position === 'top-right') {
      x = tw - wmW - pad;
      y = pad;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0.05, Math.min(1, opacity));
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = Math.max(2, Math.round(wmW * 0.015));
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.drawImage(wmImg, x, y, wmW, wmH);
    ctx.restore();
    return true;
  }

  window.compressImage = async function (file, opts) {
    var original = { file: file, contentType: file.type || 'application/octet-stream', compressed: false };
    opts = opts || {};
    var maxSize = opts.maxSize || 1280;
    var quality = opts.quality || 0.78;
    var maxBytes = opts.maxBytes || (180 * 1024); // meta máxima: ~180 KB por foto
    var useWatermark = !!opts.watermark;

    try {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return original; // gif/svg/heic etc.: mantém
      if (!useWatermark && file.size <= SKIP_BELOW_BYTES && file.type === 'image/webp') return original;

      var bmp = await loadBitmap(file);
      var w = bmp.width, h = bmp.height;
      var scale = Math.min(1, maxSize / Math.max(w, h));
      var tw = Math.round(w * scale), th = Math.round(h * scale);

      var canvas = document.createElement('canvas');
      canvas.width = tw; canvas.height = th;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bmp, 0, 0, tw, th);
      if (bmp.close) bmp.close();

      var watermarkApplied = false;
      if (useWatermark) {
        watermarkApplied = await drawWatermark(ctx, tw, th, opts.watermark);
      }

      var blob = await canvasToBlob(canvas, 'image/webp', quality);
      var type = 'image/webp';
      if (!blob || blob.type !== 'image/webp') { // navegador sem WebP no canvas
        blob = await canvasToBlob(canvas, 'image/jpeg', quality);
        type = 'image/jpeg';
      }

      // Se a foto ainda ficou acima de maxBytes (180 KB), reduz a qualidade progressivamente
      var q = quality;
      while (blob && blob.size > maxBytes && q > 0.50) {
        q = Math.max(0.48, q - 0.12);
        var nextBlob = await canvasToBlob(canvas, type, q);
        if (!nextBlob || nextBlob.size >= blob.size) break;
        blob = nextBlob;
      }

      if (!blob) return original;
      // Só descarta o arquivo gerado se NÃO aplicou marca d'água e ele ficou maior que o original
      if (!watermarkApplied && blob.size >= file.size) return original;

      var ext = type === 'image/webp' ? 'webp' : 'jpg';
      var name = (file.name || 'foto').replace(/\.[^.]+$/, '') + '.' + ext;
      return {
        file: new File([blob], name, { type: type }),
        contentType: type,
        compressed: true,
        watermarked: watermarkApplied
      };
    } catch (err) {
      console.warn('Não foi possível processar/comprimir a imagem; enviando o original.', err);
      return original;
    }
  };
})();
