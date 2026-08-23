// PS Corretor de Imóveis — Configurações do corretor
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileForm');
  if (!form) return;

  const formError = document.getElementById('formError');
  const formSuccess = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarStatus = document.getElementById('avatarStatus');

  let avatarUrl = null;

  async function load() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return;

    document.getElementById('emailLogin').value = session.user.email;

    const { data: perfil } = await supabaseClient.from('corretor_perfil').select('*').eq('id', session.user.id).maybeSingle();

    if (perfil) {
      document.getElementById('nome').value = perfil.nome || '';
      document.getElementById('creci').value = perfil.creci || '';
      document.getElementById('telefone').value = perfil.telefone || '';
      if (perfil.foto_url) {
        avatarUrl = perfil.foto_url;
        avatarPreview.src = perfil.foto_url;
      }
    } else {
      document.getElementById('nome').value = 'Paulo Souza';
    }
  }

  avatarInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    avatarPreview.src = URL.createObjectURL(file);
    avatarStatus.textContent = 'Enviando foto...';

    const { data: { session } } = await supabaseClient.auth.getSession();
    const path = `${session.user.id}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabaseClient.storage.from('avatares').upload(path, file, { upsert: true });

    if (error) {
      avatarStatus.textContent = 'Erro ao enviar foto: ' + error.message;
      return;
    }

    const { data: pub } = supabaseClient.storage.from('avatares').getPublicUrl(path);
    avatarUrl = pub.publicUrl;
    avatarStatus.textContent = 'Foto atualizada. Clique em "Salvar Alterações" para confirmar.';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    formSuccess.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Salvando...';

    const { data: { session } } = await supabaseClient.auth.getSession();
    const payload = {
      id: session.user.id,
      nome: document.getElementById('nome').value.trim(),
      creci: document.getElementById('creci').value.trim() || null,
      telefone: document.getElementById('telefone').value.trim() || null,
      foto_url: avatarUrl,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseClient.from('corretor_perfil').upsert(payload);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar Alterações';

    if (error) {
      formError.textContent = 'Erro ao salvar: ' + error.message;
      formError.hidden = false;
      return;
    }

    formSuccess.textContent = 'Perfil atualizado com sucesso!';
    formSuccess.hidden = false;
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = payload.nome);
    document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = `Corretor${payload.creci ? ' · CRECI ' + payload.creci : ''}`);
    document.querySelectorAll('[data-user-avatar]').forEach(el => { if (avatarUrl) el.src = avatarUrl; });
  });

  load();
});
