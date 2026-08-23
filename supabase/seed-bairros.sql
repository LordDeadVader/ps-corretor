-- PS Corretor de Imóveis — Importação dos bairros já usados na galeria da home
-- Rode DEPOIS do schema.sql, no SQL Editor do Supabase, já logado com seu usuário.

insert into bairros_destaque (corretor_id, nome, slug, foto_url, ordem)
values
((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'Centro', 'centro', 'assets/bairros/centro.jpg', 0),
((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'Jardim Carvalho', 'jardim-carvalho', 'assets/bairros/jardim-carvalho.jpg', 1),
((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'Nova Rússia', 'nova-russia', 'assets/bairros/nova-russia.jpg', 2),
((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'Oficinas', 'oficinas', 'assets/bairros/oficinas.jpg', 3),
((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'Uvaranas', 'uvaranas', 'assets/bairros/uvaranas.jpg', 4),
((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'Boa Vista', 'boa-vista', 'assets/bairros/boa-vista.jpg', 5),
((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'Vila Estrela', 'vila-estrela', 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1200&auto=format&fit=crop', 6),
((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'Contorno', 'contorno', 'https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200&auto=format&fit=crop', 7),
((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'Colônia Dona Luiza', 'colonia-dona-luiza', 'https://images.unsplash.com/photo-1500076656116-558758c991c1?q=80&w=1200&auto=format&fit=crop', 8)

on conflict (slug) do update set
  nome = excluded.nome, foto_url = excluded.foto_url, ordem = excluded.ordem;
