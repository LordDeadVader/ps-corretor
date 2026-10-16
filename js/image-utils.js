// PS Corretor de Imóveis — Compressão de imagens no navegador
//
// Fotos de celular/câmera costumam ter 3–8 MB. Para exibir no site bastam
// ~150–300 KB. Reduzir o arquivo ANTES do upload é o que mais economiza a cota
// de tráfego (egress) do Supabase.
//
// Uso:  const { file, contentType } = await compressImage(file, { maxSize: 1600 });
//
// - Respeita a rotação EXIF (fotos de celular não ficam deitadas).
// - Converte para WebP (menor, e mantém transparência de PNG).
// - Se não conseguir comprimir (ou o resultado ficar maior), devolve o original.
(function () {
  var SKIP_BELOW_BYTES = 120 * 1024; // já é pequena (< 120 KB): não mexe

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

  window.compressImage = async function (file, opts) {
    var original = { file: file, contentType: file.type || 'application/octet-stream', compressed: false };
    opts = opts || {};
    var maxSize = opts.maxSize || 1280;
    var quality = opts.quality || 0.78;

    try {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return original; // gif/svg/heic etc.: mantém
      if (file.size <= SKIP_BELOW_BYTES) return original;

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

      var blob = await canvasToBlob(canvas, 'image/webp', quality);
      var type = 'image/webp';
      if (!blob || blob.type !== 'image/webp') { // navegador sem WebP no canvas
        blob = await canvasToBlob(canvas, 'image/jpeg', quality);
        type = 'image/jpeg';
      }
      if (!blob || blob.size >= file.size) return original;

      var ext = type === 'image/webp' ? 'webp' : 'jpg';
      var name = (file.name || 'foto').replace(/\.[^.]+$/, '') + '.' + ext;
      return { file: new File([blob], name, { type: type }), contentType: type, compressed: true };
    } catch (err) {
      console.warn('Não foi possível comprimir a imagem; enviando o original.', err);
      return original;
    }
  };
})();
