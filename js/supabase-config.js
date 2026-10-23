// PS Corretor de Imóveis — Configuração do Supabase
// A chave abaixo é a "publishable key" (pública por design). O acesso aos
// dados é controlado pelas políticas de Row Level Security no banco, não
// pelo sigilo desta chave.
const SUPABASE_URL = 'https://lxjltsbtupdeudscqkeu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4amx0c2J0dXBkZXVkc2Nxa2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMjkyMzUsImV4cCI6MjEwNzcwNTIzNX0.mH3ZfVoM8o-S9ttMTKOAl2XFW7WAaXM87FRUttg3i1U';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
window.supabaseClient = supabaseClient;
