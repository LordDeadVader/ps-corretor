// PS Corretor de Imóveis — Configuração do Supabase
// A chave abaixo é a "publishable key" (pública por design). O acesso aos
// dados é controlado pelas políticas de Row Level Security no banco, não
// pelo sigilo desta chave.
const SUPABASE_URL = 'https://zbnnwriwfnvcmsduxtti.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_TJ0J6CiP-InJm92Gw-VZbA_jkI4GVzJ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
