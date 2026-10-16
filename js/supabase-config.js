// PS Corretor de Imóveis — Configuração do Supabase
// A chave abaixo é a "publishable key" (pública por design). O acesso aos
// dados é controlado pelas políticas de Row Level Security no banco, não
// pelo sigilo desta chave.
const SUPABASE_URL = 'https://lxjltsbtupdeudscqkeu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vScDV3dCHDsYsT2HPtBAEg_E7AdGc-Q';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
