-- PS Corretor de Imóveis — Importação dos 12 imóveis reais repassados pelo cliente
-- Rode DEPOIS do schema.sql, no SQL Editor do Supabase, já logado com seu usuário.
-- Pode rodar de novo sem duplicar (upsert por slug).

insert into imoveis (corretor_id, slug, titulo, tipo, operacao, bairro, cidade, endereco, preco_valor, preco_label, quartos, suites, banheiros, vagas, area_util, area_terreno, destaques, badges, descricao, status, capa, fotos)
values

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'apartamento-av-carlos-cavalcante', 'Apartamento na Av. Carlos Cavalcante', 'apartamento', 'aluguel', 'Uvaranas', 'Ponta Grossa',
 'Av. Carlos Cavalcante — Uvaranas', 1700.00, 'R$ 1.700,00/mês + IPTU', 3, 1, 1, 0, 77, null,
 '["77 m² de área útil","3 quartos, sendo 1 suíte","Sala ampla para 2 ambientes","Banheiro social","Cozinha com armários","Área de serviço","Ideal para moradia ou uso comercial (escritórios, clínicas, consultórios)"]',
 '["Comercial ou Residencial"]',
 'Excelente oportunidade para quem busca um imóvel amplo, muito bem localizado e com grande visibilidade. Localizado de frente para a Avenida Carlos Cavalcante, uma das principais vias de Uvaranas — perfeito para profissionais liberais e empresas que desejam um endereço de fácil acesso. Locação mediante comprovação de renda e aprovação de seguro fiança.',
 'ativo', 'assets/imoveis/apartamento-av-carlos-cavalcante/01.jpeg',
 '["assets/imoveis/apartamento-av-carlos-cavalcante/01.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/02.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/03.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/04.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/05.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/06.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/07.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/08.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/09.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/10.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/11.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/12.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/13.jpeg","assets/imoveis/apartamento-av-carlos-cavalcante/14.jpeg"]'),

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'casa-vila-estrela', 'Casa na Vila Estrela', 'casa', 'aluguel', 'Vila Estrela', 'Ponta Grossa',
 'Vila Estrela — próximo ao Colégio Santa Terezinha', 2500.00, 'R$ 2.500,00/mês + taxas', 3, 0, 1, 0, 199, 462,
 '["3 quartos","Sala","Copa","Banheiro social","Edícula com banheiro","≈199 m² de área construída","462 m² de terreno","Ideal para clínica, escritório, consultório, empresa ou residência"]',
 '["Comercial ou Residencial"]',
 'Casa espaçosa, bem localizada e com dupla possibilidade de uso — residencial ou comercial. Próxima ao Colégio Santa Terezinha. Locação com garantia de seguro fiança e comprovação de renda necessária.',
 'ativo', 'assets/imoveis/casa-vila-estrela/01.jpeg',
 '["assets/imoveis/casa-vila-estrela/01.jpeg","assets/imoveis/casa-vila-estrela/02.jpeg","assets/imoveis/casa-vila-estrela/03.jpeg","assets/imoveis/casa-vila-estrela/04.jpeg","assets/imoveis/casa-vila-estrela/05.jpeg","assets/imoveis/casa-vila-estrela/06.jpeg","assets/imoveis/casa-vila-estrela/07.jpeg","assets/imoveis/casa-vila-estrela/08.jpeg","assets/imoveis/casa-vila-estrela/09.jpeg","assets/imoveis/casa-vila-estrela/10.jpeg","assets/imoveis/casa-vila-estrela/11.jpeg","assets/imoveis/casa-vila-estrela/12.jpeg"]'),

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'chacara-colonia-dona-luiza', 'Chácara na Colônia Dona Luiza', 'chacara', 'venda', 'Colônia Dona Luiza', 'Ponta Grossa',
 'Colônia Dona Luiza', 1800000.00, 'R$ 1.800.000,00', 0, 0, 0, 0, null, 30000,
 '["Aproximadamente 30.000 m² de área","02 lagos","Salão de festas","Espaço com fogo de chão","Galinheiro","Aprisco para ovelhas","Horta com sombrite e sistema de irrigação automatizado","Riacho na divisa da propriedade","Toda cercada com alambrado","Sistema de câmeras de segurança","Propriedade totalmente automatizada"]',
 '["Investimento","Lazer"]',
 'Uma propriedade completa para quem busca qualidade de vida, contato com a natureza e excelente estrutura para moradia, lazer ou investimento. Um verdadeiro refúgio, unindo tranquilidade, segurança, tecnologia e infraestrutura em uma das regiões bem valorizadas.',
 'ativo', 'assets/imoveis/chacara-colonia-dona-luiza/01.jpeg',
 '["assets/imoveis/chacara-colonia-dona-luiza/01.jpeg","assets/imoveis/chacara-colonia-dona-luiza/02.jpeg","assets/imoveis/chacara-colonia-dona-luiza/03.jpeg","assets/imoveis/chacara-colonia-dona-luiza/04.jpeg","assets/imoveis/chacara-colonia-dona-luiza/05.jpeg","assets/imoveis/chacara-colonia-dona-luiza/06.jpeg","assets/imoveis/chacara-colonia-dona-luiza/07.jpeg","assets/imoveis/chacara-colonia-dona-luiza/08.jpeg","assets/imoveis/chacara-colonia-dona-luiza/09.jpeg","assets/imoveis/chacara-colonia-dona-luiza/10.jpeg","assets/imoveis/chacara-colonia-dona-luiza/11.jpeg","assets/imoveis/chacara-colonia-dona-luiza/12.jpeg","assets/imoveis/chacara-colonia-dona-luiza/13.jpeg","assets/imoveis/chacara-colonia-dona-luiza/14.jpeg","assets/imoveis/chacara-colonia-dona-luiza/15.jpeg","assets/imoveis/chacara-colonia-dona-luiza/16.jpeg","assets/imoveis/chacara-colonia-dona-luiza/17.jpeg","assets/imoveis/chacara-colonia-dona-luiza/18.jpeg","assets/imoveis/chacara-colonia-dona-luiza/19.jpeg","assets/imoveis/chacara-colonia-dona-luiza/20.jpeg","assets/imoveis/chacara-colonia-dona-luiza/21.jpeg","assets/imoveis/chacara-colonia-dona-luiza/22.jpeg"]'),

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'eos-mirante-residence-casa-venda', 'Casa Nova no Condomínio EOS Mirante Residence', 'condominio', 'venda', 'Contorno', 'Ponta Grossa',
 'Condomínio EOS Mirante Residence — Contorno', 799000.00, 'R$ 799.000,00', 3, 1, 1, 2, 140, 200,
 '["140 m² de área construída","Terreno com 200 m²","3 quartos, sendo 1 suíte","Sala, copa e cozinha em conceito integrado","Área gourmet perfeita para reunir família e amigos","Pé-direito duplo e rebaixo em gesso","Garagem coberta para 2 carros","Lavanderia","Banheiro social","Aquecimento a gás nos chuveiros e em todas as torneiras","Iluminação especial em LED","Janelas automatizadas nos quartos","Preparação para ar-condicionado"]',
 '["Novo","Alto Padrão","Condomínio Fechado"]',
 'Modernidade, sofisticação e conforto em um só lugar! Imóvel pronto para morar, com excelente padrão de acabamento e ambientes integrados, dentro de um dos condomínios mais completos e valorizados de Ponta Grossa.',
 'ativo', 'assets/imoveis/eos-mirante-residence-casa-venda/01.jpeg',
 '["assets/imoveis/eos-mirante-residence-casa-venda/01.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/02.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/03.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/04.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/05.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/06.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/07.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/08.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/09.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/10.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/11.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/12.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/13.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/14.jpeg","assets/imoveis/eos-mirante-residence-casa-venda/15.jpeg"]'),

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'eos-mirante-residence-terrenos', 'Terrenos no Condomínio EOS Mirante Residence', 'terreno', 'venda', 'Contorno', 'Ponta Grossa',
 'Rua Eduardo Burgardt, nº 1555 — Contorno', null, 'Lotes a partir de 200 m² — consulte valores', 0, 0, 0, 0, null, 200,
 '["Lotes a partir de 200 m²","Infraestrutura de condomínio clube","Portaria e segurança 24 horas","Entrada única para maior controle de acesso","02 salões de festas","Quiosques com churrasqueira","Piscina","Lago com deck","Praça de convivência","Mirante com vista privilegiada","Academia com vista panorâmica","Campo de futebol","Quadra poliesportiva","Pista de caminhada integrada à mata","35% da área com mata nativa preservada"]',
 '["Investimento","Condomínio Fechado"]',
 'Viva a natureza todos os dias do ano! Construa a casa dos seus sonhos em um dos condomínios mais completos e valorizados de Ponta Grossa. Invista em qualidade de vida, segurança e valorização para sua família.',
 'ativo', 'assets/imoveis/eos-mirante-residence-terrenos/01.jpeg',
 '["assets/imoveis/eos-mirante-residence-terrenos/01.jpeg","assets/imoveis/eos-mirante-residence-terrenos/02.jpeg","assets/imoveis/eos-mirante-residence-terrenos/03.jpeg","assets/imoveis/eos-mirante-residence-terrenos/04.jpeg","assets/imoveis/eos-mirante-residence-terrenos/05.jpeg","assets/imoveis/eos-mirante-residence-terrenos/06.jpeg","assets/imoveis/eos-mirante-residence-terrenos/07.jpeg","assets/imoveis/eos-mirante-residence-terrenos/08.jpeg"]'),

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'eos-mirante-residence-casa-locacao', 'Casa Nova para Locação no EOS Mirante Residence', 'condominio', 'aluguel', 'Contorno', 'Ponta Grossa',
 'Condomínio EOS Mirante Residence — Contorno', 4400.00, 'R$ 4.400,00/mês + taxas', 3, 1, 1, 2, null, null,
 '["Casa moderna com pé-direito alto","3 quartos, sendo 1 suíte","Sala para 2 ambientes integrada","Cozinha em conceito aberto","Área gourmet com churrasqueira","Lavanderia","02 vagas de garagem","Acabamento sofisticado","Piso porcelanato","Esquadrias em alumínio","Infraestrutura para ar-condicionado","Condomínio com piscina, academia, salão de festas, quadra esportiva e lagos"]',
 '["Condomínio Fechado"]',
 'Imagine viver cercado pela natureza, com lagos, áreas verdes e toda a tranquilidade de um condomínio completo, sem abrir mão do conforto e da sofisticação. Conforto, modernidade e qualidade de vida em um dos condomínios mais desejados da região.',
 'ativo', 'assets/imoveis/eos-mirante-residence-casa-locacao/01.jpeg',
 '["assets/imoveis/eos-mirante-residence-casa-locacao/01.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/02.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/03.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/04.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/05.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/06.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/07.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/08.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/09.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/10.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/11.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/12.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/13.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/14.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/15.jpeg","assets/imoveis/eos-mirante-residence-casa-locacao/16.jpeg"]'),

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'ed-hans-kelsen', 'Apartamento Mobiliado no Ed. Hans Kelsen', 'apartamento', 'venda', 'Jardim Carvalho', 'Ponta Grossa',
 'Rua Profa. Izaura Torres Cruz — Jardim Carvalho', 630000.00, 'R$ 630.000,00', 3, 1, 1, 2, 84, null,
 '["Apartamento novo, mobiliado e com móveis planejados","3 quartos, sendo 1 suíte","≈84 m² de área útil","2 vagas de garagem","Sala aconchegante","Cozinha planejada","Banheiro social","A 2 minutos da UEPG Centro e 5 minutos de supermercado"]',
 '["Mobiliado","Novo"]',
 'Quer entrar em um apartamento novo, moderno e pronto para morar? Essa é a oportunidade que você estava esperando, com localização privilegiada no Jardim Carvalho — a poucos minutos da UEPG Centro.',
 'ativo', 'assets/imoveis/ed-hans-kelsen/01.jpeg',
 '["assets/imoveis/ed-hans-kelsen/01.jpeg","assets/imoveis/ed-hans-kelsen/02.jpeg","assets/imoveis/ed-hans-kelsen/03.jpeg","assets/imoveis/ed-hans-kelsen/04.jpeg","assets/imoveis/ed-hans-kelsen/05.jpeg","assets/imoveis/ed-hans-kelsen/06.jpeg","assets/imoveis/ed-hans-kelsen/07.jpeg","assets/imoveis/ed-hans-kelsen/08.jpeg","assets/imoveis/ed-hans-kelsen/09.jpeg","assets/imoveis/ed-hans-kelsen/10.jpeg","assets/imoveis/ed-hans-kelsen/11.jpeg","assets/imoveis/ed-hans-kelsen/12.jpeg","assets/imoveis/ed-hans-kelsen/13.jpeg","assets/imoveis/ed-hans-kelsen/14.jpeg","assets/imoveis/ed-hans-kelsen/15.jpeg","assets/imoveis/ed-hans-kelsen/16.jpeg","assets/imoveis/ed-hans-kelsen/17.jpeg","assets/imoveis/ed-hans-kelsen/18.jpeg","assets/imoveis/ed-hans-kelsen/19.jpeg"]'),

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'edificio-michelangelo', 'Apartamento no Edifício Michelangelo', 'apartamento', 'venda', 'Jardim Carvalho', 'Ponta Grossa',
 'Próximo ao Colégio Marista — Jardim Carvalho', 530000.00, 'R$ 530.000,00', 3, 1, 1, 2, 110, null,
 '["≈110 m² de área privativa","3 quartos, sendo 1 suíte com móveis planejados","Sala de estar ampla","Sala de jantar","Sacada com churrasqueira","Cozinha com móveis planejados","Área de serviço","Banheiro social com móveis","2 vagas de garagem","Condomínio com portaria 24 horas, elevador, piscina e quadra de esportes"]',
 '["Alto Padrão"]',
 'Excelente localização, próximo ao Colégio Marista! Se você procura conforto, espaço e praticidade para sua família, este apartamento é a escolha ideal.',
 'ativo', 'assets/imoveis/edificio-michelangelo/01.jpeg',
 '["assets/imoveis/edificio-michelangelo/01.jpeg","assets/imoveis/edificio-michelangelo/02.jpeg","assets/imoveis/edificio-michelangelo/03.jpeg","assets/imoveis/edificio-michelangelo/04.jpeg","assets/imoveis/edificio-michelangelo/05.jpeg","assets/imoveis/edificio-michelangelo/06.jpeg","assets/imoveis/edificio-michelangelo/07.jpeg","assets/imoveis/edificio-michelangelo/08.jpeg","assets/imoveis/edificio-michelangelo/09.jpeg","assets/imoveis/edificio-michelangelo/10.jpeg","assets/imoveis/edificio-michelangelo/11.jpeg","assets/imoveis/edificio-michelangelo/12.jpeg","assets/imoveis/edificio-michelangelo/13.jpeg","assets/imoveis/edificio-michelangelo/14.jpeg","assets/imoveis/edificio-michelangelo/15.jpeg","assets/imoveis/edificio-michelangelo/16.jpeg","assets/imoveis/edificio-michelangelo/17.jpeg"]'),

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'loja-esquina-centro', 'Loja de Esquina no Centro', 'comercial', 'aluguel', 'Centro', 'Ponta Grossa',
 'Rua Doutor Colares, esquina com Rua Coronel Dulcídio — Centro', 3800.00, 'R$ 3.800,00/mês + IPTU R$ 310,00', 0, 0, 1, 0, 102.64, null,
 '["≈102,64 m²","Ampla vitrine voltada para a Rua Doutor Colares","Loja de esquina com excelente visibilidade","Salão principal espaçoso","Área de estoque","Banheiro social","Próxima ao Banco Sicredi e a 160 m da Av. Vicente Machado"]',
 '["Ponto Comercial"]',
 'Excelente ponto comercial, em uma das regiões mais movimentadas do Centro de Ponta Grossa! Ideal para comércio, serviços e diversas atividades que buscam visibilidade e fluxo constante de pessoas.',
 'ativo', 'assets/imoveis/loja-esquina-centro/01.jpeg',
 '["assets/imoveis/loja-esquina-centro/01.jpeg","assets/imoveis/loja-esquina-centro/02.jpeg","assets/imoveis/loja-esquina-centro/03.jpeg","assets/imoveis/loja-esquina-centro/04.jpeg","assets/imoveis/loja-esquina-centro/05.jpeg","assets/imoveis/loja-esquina-centro/06.jpeg"]'),

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'residencial-acacia-oficinas', 'Apartamento no Residencial Acácia I', 'apartamento', 'venda', 'Oficinas', 'Ponta Grossa',
 'Rua Franco Grilo, nº 320 — Oficinas', null, 'Consulte-nos', 2, 0, 1, 1, 60, null,
 '["60 m² de área privativa","2 quartos","Sala de estar e jantar integradas","Cozinha com área de serviço conjugada","Banheiro social","1 vaga de garagem","Condomínio com quadra de esportes, parque infantil, salão de festas, interfone e portaria 24 horas"]',
 '[]',
 'Seu novo lar está em uma das regiões mais valorizadas de Oficinas! Um apartamento bem distribuído, em condomínio completo e cercado por toda a infraestrutura que faz a diferença no dia a dia — próximo a escolas, centro de educação infantil, supermercados, bancos e praças.',
 'ativo', 'assets/imoveis/residencial-acacia-oficinas/01.jpeg',
 '["assets/imoveis/residencial-acacia-oficinas/01.jpeg","assets/imoveis/residencial-acacia-oficinas/02.jpeg","assets/imoveis/residencial-acacia-oficinas/03.jpeg","assets/imoveis/residencial-acacia-oficinas/04.jpeg","assets/imoveis/residencial-acacia-oficinas/05.jpeg","assets/imoveis/residencial-acacia-oficinas/06.jpeg","assets/imoveis/residencial-acacia-oficinas/07.jpeg","assets/imoveis/residencial-acacia-oficinas/08.jpeg","assets/imoveis/residencial-acacia-oficinas/09.jpeg","assets/imoveis/residencial-acacia-oficinas/10.jpeg","assets/imoveis/residencial-acacia-oficinas/11.jpeg","assets/imoveis/residencial-acacia-oficinas/12.jpeg","assets/imoveis/residencial-acacia-oficinas/13.jpeg","assets/imoveis/residencial-acacia-oficinas/14.jpeg","assets/imoveis/residencial-acacia-oficinas/15.jpeg","assets/imoveis/residencial-acacia-oficinas/16.jpeg"]'),

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'sobrado-oficinas', 'Sobrado Mobiliado em Oficinas', 'casa', 'aluguel', 'Oficinas', 'Ponta Grossa',
 'Oficinas', 3000.00, 'R$ 3.000,00/mês (total)', 0, 2, 0, 2, null, null,
 '["2 suítes com camas (sendo 1 com closet)","Sala para 2 ambientes mobiliada","Cozinha planejada com armários, geladeira e cooktop","Espaço gourmet com churrasqueira","Área de serviço","2 vagas de garagem"]',
 '["Mobiliado"]',
 'Chegue com as malas e comece a aproveitar! Este lindo sobrado totalmente mobiliado oferece conforto, praticidade e excelente localização em Oficinas. Ideal para quem busca um imóvel pronto para morar.',
 'ativo', 'assets/imoveis/sobrado-oficinas/01.jpeg',
 '["assets/imoveis/sobrado-oficinas/01.jpeg","assets/imoveis/sobrado-oficinas/02.jpeg","assets/imoveis/sobrado-oficinas/03.jpeg","assets/imoveis/sobrado-oficinas/04.jpeg","assets/imoveis/sobrado-oficinas/05.jpeg","assets/imoveis/sobrado-oficinas/06.jpeg","assets/imoveis/sobrado-oficinas/07.jpeg","assets/imoveis/sobrado-oficinas/08.jpeg","assets/imoveis/sobrado-oficinas/09.jpeg","assets/imoveis/sobrado-oficinas/10.jpeg","assets/imoveis/sobrado-oficinas/11.jpeg","assets/imoveis/sobrado-oficinas/12.jpeg","assets/imoveis/sobrado-oficinas/13.jpeg","assets/imoveis/sobrado-oficinas/14.jpeg","assets/imoveis/sobrado-oficinas/15.jpeg","assets/imoveis/sobrado-oficinas/16.jpeg","assets/imoveis/sobrado-oficinas/17.jpeg","assets/imoveis/sobrado-oficinas/18.jpeg","assets/imoveis/sobrado-oficinas/19.jpeg"]'),

((select id from auth.users where email = 'davihenriqueded@gmail.com'), 'terreno-central', 'Terreno no Centro', 'terreno', 'venda', 'Centro', 'Ponta Grossa',
 'Próximo à Catedral Sant''Ana — Centro', 5900000.00, 'R$ 5.900.000,00', 0, 0, 0, 0, null, 1872.36,
 '["Terreno com 1.872,36 m²","Localização estratégica","Ideal para empreendimentos comerciais ou residenciais","Próximo à Catedral Sant''Ana, Corpo de Bombeiros, escolas, comércios e serviços"]',
 '["Investimento"]',
 'Invista em uma das regiões mais valorizadas da cidade! Espaço ideal para construtores e investidores que buscam um terreno amplo, com excelente potencial de valorização e diversas possibilidades de desenvolvimento.',
 'ativo', 'assets/imoveis/terreno-central/01.jpeg',
 '["assets/imoveis/terreno-central/01.jpeg","assets/imoveis/terreno-central/02.jpeg","assets/imoveis/terreno-central/03.jpeg","assets/imoveis/terreno-central/04.jpeg","assets/imoveis/terreno-central/05.jpeg","assets/imoveis/terreno-central/06.jpeg","assets/imoveis/terreno-central/07.jpeg","assets/imoveis/terreno-central/08.jpeg"]')

on conflict (slug) do update set
  titulo = excluded.titulo, tipo = excluded.tipo, operacao = excluded.operacao, bairro = excluded.bairro,
  cidade = excluded.cidade, endereco = excluded.endereco, preco_valor = excluded.preco_valor, preco_label = excluded.preco_label,
  quartos = excluded.quartos, suites = excluded.suites, banheiros = excluded.banheiros, vagas = excluded.vagas,
  area_util = excluded.area_util, area_terreno = excluded.area_terreno, destaques = excluded.destaques, badges = excluded.badges,
  descricao = excluded.descricao, status = excluded.status, capa = excluded.capa, fotos = excluded.fotos;
