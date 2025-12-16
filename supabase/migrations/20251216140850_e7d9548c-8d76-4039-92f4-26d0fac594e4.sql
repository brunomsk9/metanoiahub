-- Insert Annual Bible Reading Plans

-- 1. Plano Cronológico (365 dias)
INSERT INTO public.reading_plans (titulo, descricao, duracao_dias, categoria, cover_image)
VALUES (
  'Plano Cronológico Anual',
  'Leia toda a Bíblia em um ano seguindo a ordem cronológica dos eventos. Este plano organiza as passagens na sequência em que os eventos ocorreram historicamente.',
  365,
  'leitura bíblica',
  'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&auto=format&fit=crop'
);

-- 2. Plano M'Cheyne (365 dias)
INSERT INTO public.reading_plans (titulo, descricao, duracao_dias, categoria, cover_image)
VALUES (
  'Plano M''Cheyne Anual',
  'Desenvolvido pelo pastor Robert Murray M''Cheyne no século 19. Leia o Antigo Testamento uma vez e o Novo Testamento e Salmos duas vezes ao longo do ano com 4 leituras diárias.',
  365,
  'leitura bíblica',
  'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=800&auto=format&fit=crop'
);

-- 3. Plano Capa-a-Capa (365 dias)
INSERT INTO public.reading_plans (titulo, descricao, duracao_dias, categoria, cover_image)
VALUES (
  'Plano Capa-a-Capa Anual',
  'Leia a Bíblia inteira do Gênesis ao Apocalipse em um ano. Um plano simples e direto que segue a ordem tradicional dos livros bíblicos.',
  365,
  'leitura bíblica',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop'
);

-- Insert first 30 days for Plano Cronológico as sample (full plan would have 365 days)
INSERT INTO public.reading_plan_days (plan_id, dia, titulo, versiculo_referencia, conteudo)
SELECT 
  (SELECT id FROM public.reading_plans WHERE titulo = 'Plano Cronológico Anual'),
  dia,
  titulo,
  versiculo_referencia,
  conteudo
FROM (VALUES
  (1, 'Criação', 'Gênesis 1-3', 'A criação do mundo, do homem e da mulher. A queda no pecado.'),
  (2, 'Caim e Abel', 'Gênesis 4-5', 'O primeiro homicídio e a genealogia de Adão até Noé.'),
  (3, 'Noé e o Dilúvio', 'Gênesis 6-7', 'A corrupção da humanidade e a construção da arca.'),
  (4, 'Após o Dilúvio', 'Gênesis 8-9', 'O fim do dilúvio e a aliança de Deus com Noé.'),
  (5, 'Torre de Babel', 'Gênesis 10-11', 'A dispersão das nações e a genealogia de Sem até Abrão.'),
  (6, 'Chamado de Abraão', 'Gênesis 12-13', 'Deus chama Abrão para uma nova terra.'),
  (7, 'Abraão e Ló', 'Gênesis 14-15', 'Abraão resgata Ló e recebe a promessa de Deus.'),
  (8, 'Hagar e Ismael', 'Gênesis 16-17', 'O nascimento de Ismael e a aliança da circuncisão.'),
  (9, 'Sodoma e Gomorra', 'Gênesis 18-19', 'A visita dos anjos e a destruição das cidades.'),
  (10, 'Isaque Prometido', 'Gênesis 20-21', 'O nascimento de Isaque e a expulsão de Hagar.'),
  (11, 'Prova de Abraão', 'Gênesis 22-23', 'O sacrifício de Isaque e a morte de Sara.'),
  (12, 'Esposa para Isaque', 'Gênesis 24', 'Rebeca é escolhida como esposa de Isaque.'),
  (13, 'Jacó e Esaú', 'Gênesis 25-26', 'O nascimento dos gêmeos e as promessas renovadas.'),
  (14, 'Bênção Roubada', 'Gênesis 27-28', 'Jacó engana Isaque e foge para Harã.'),
  (15, 'Jacó em Harã', 'Gênesis 29-30', 'Jacó casa com Lia e Raquel, seus filhos nascem.'),
  (16, 'Jacó Retorna', 'Gênesis 31-32', 'Jacó foge de Labão e luta com o anjo.'),
  (17, 'Jacó e Esaú', 'Gênesis 33-34', 'O reencontro dos irmãos e o incidente em Siquém.'),
  (18, 'Israel', 'Gênesis 35-36', 'Deus renova a aliança com Jacó em Betel.'),
  (19, 'José Vendido', 'Gênesis 37; 39', 'José é vendido pelos irmãos e vai para o Egito.'),
  (20, 'Judá e Tamar', 'Gênesis 38', 'A história de Judá e sua nora Tamar.'),
  (21, 'José na Prisão', 'Gênesis 40-41', 'José interpreta sonhos e se torna governador.'),
  (22, 'Irmãos no Egito', 'Gênesis 42-43', 'Os irmãos de José vão ao Egito comprar trigo.'),
  (23, 'José Revelado', 'Gênesis 44-45', 'José se revela aos seus irmãos.'),
  (24, 'Jacó no Egito', 'Gênesis 46-47', 'Toda a família de Jacó se muda para o Egito.'),
  (25, 'Bênçãos de Jacó', 'Gênesis 48-49', 'Jacó abençoa seus filhos e netos.'),
  (26, 'Morte de José', 'Gênesis 50; Jó 1-2', 'A morte de José. Início da história de Jó.'),
  (27, 'Sofrimento de Jó', 'Jó 3-5', 'O lamento de Jó e a resposta de Elifaz.'),
  (28, 'Diálogos de Jó', 'Jó 6-9', 'Jó responde aos seus amigos.'),
  (29, 'Jó Questiona', 'Jó 10-13', 'Jó questiona a justiça de Deus.'),
  (30, 'Esperança de Jó', 'Jó 14-17', 'Jó expressa sua esperança em Deus.')
) AS t(dia, titulo, versiculo_referencia, conteudo);

-- Insert first 30 days for Plano M'Cheyne
INSERT INTO public.reading_plan_days (plan_id, dia, titulo, versiculo_referencia, conteudo)
SELECT 
  (SELECT id FROM public.reading_plans WHERE titulo = 'Plano M''Cheyne Anual'),
  dia,
  titulo,
  versiculo_referencia,
  conteudo
FROM (VALUES
  (1, 'Dia 1', 'Gn 1; Mt 1; Ed 1; At 1', 'Quatro leituras: Criação, Genealogia de Jesus, Retorno do exílio, Ascensão de Jesus.'),
  (2, 'Dia 2', 'Gn 2; Mt 2; Ed 2; At 2', 'Jardim do Éden, Magos visitam Jesus, Lista dos exilados, Pentecostes.'),
  (3, 'Dia 3', 'Gn 3; Mt 3; Ed 3; At 3', 'A Queda, Batismo de Jesus, Reconstrução do altar, Cura do coxo.'),
  (4, 'Dia 4', 'Gn 4; Mt 4; Ed 4; At 4', 'Caim e Abel, Tentação de Jesus, Oposição à obra, Pedro e João presos.'),
  (5, 'Dia 5', 'Gn 5; Mt 5; Ed 5; At 5', 'Genealogia, Sermão do Monte, Carta ao rei, Ananias e Safira.'),
  (6, 'Dia 6', 'Gn 6; Mt 6; Ed 6; At 6', 'Corrupção, Oração do Pai Nosso, Dedicação do templo, Escolha dos diáconos.'),
  (7, 'Dia 7', 'Gn 7; Mt 7; Ed 7; At 7', 'O Dilúvio, Porta estreita, Esdras chega, Discurso de Estêvão.'),
  (8, 'Dia 8', 'Gn 8; Mt 8; Ed 8; At 8', 'Fim do dilúvio, Curas de Jesus, Família de Esdras, Filipe em Samaria.'),
  (9, 'Dia 9', 'Gn 9; Mt 9; Ed 9; At 9', 'Aliança com Noé, Chamado de Mateus, Oração de confissão, Conversão de Saulo.'),
  (10, 'Dia 10', 'Gn 10; Mt 10; Ed 10; At 10', 'Nações, Envio dos doze, Casamentos mistos, Cornélio.'),
  (11, 'Dia 11', 'Gn 11; Mt 11; Ne 1; At 11', 'Torre de Babel, João Batista, Oração de Neemias, Igreja em Antioquia.'),
  (12, 'Dia 12', 'Gn 12; Mt 12; Ne 2; At 12', 'Chamado de Abrão, Senhor do sábado, Neemias em Jerusalém, Morte de Tiago.'),
  (13, 'Dia 13', 'Gn 13; Mt 13; Ne 3; At 13', 'Abrão e Ló, Parábolas, Reconstrução do muro, Primeira viagem missionária.'),
  (14, 'Dia 14', 'Gn 14; Mt 14; Ne 4; At 14', 'Guerra dos reis, Morte de João Batista, Oposição, Paulo em Listra.'),
  (15, 'Dia 15', 'Gn 15; Mt 15; Ne 5; At 15', 'Aliança com Abrão, Tradições, Reforma social, Concílio de Jerusalém.'),
  (16, 'Dia 16', 'Gn 16; Mt 16; Ne 6; At 16', 'Hagar, Confissão de Pedro, Conclusão do muro, Filipe na Macedônia.'),
  (17, 'Dia 17', 'Gn 17; Mt 17; Ne 7; At 17', 'Circuncisão, Transfiguração, Lista do povo, Paulo em Atenas.'),
  (18, 'Dia 18', 'Gn 18; Mt 18; Ne 8; At 18', 'Visita dos anjos, Humildade, Leitura da Lei, Paulo em Corinto.'),
  (19, 'Dia 19', 'Gn 19; Mt 19; Ne 9; At 19', 'Sodoma destruída, Divórcio, Confissão nacional, Paulo em Éfeso.'),
  (20, 'Dia 20', 'Gn 20; Mt 20; Ne 10; At 20', 'Abraão e Abimeleque, Trabalhadores, Aliança renovada, Viagem a Jerusalém.'),
  (21, 'Dia 21', 'Gn 21; Mt 21; Ne 11; At 21', 'Nascimento de Isaque, Entrada triunfal, Habitantes, Paulo preso.'),
  (22, 'Dia 22', 'Gn 22; Mt 22; Ne 12; At 22', 'Sacrifício de Isaque, Tributo a César, Dedicação, Defesa de Paulo.'),
  (23, 'Dia 23', 'Gn 23; Mt 23; Ne 13; At 23', 'Morte de Sara, Ai dos fariseus, Reformas finais, Conspiração.'),
  (24, 'Dia 24', 'Gn 24; Mt 24; Et 1; At 24', 'Rebeca, Sinais do fim, Banquete de Xerxes, Paulo perante Félix.'),
  (25, 'Dia 25', 'Gn 25; Mt 25; Et 2; At 25', 'Jacó e Esaú, Parábolas, Ester rainha, Paulo perante Festo.'),
  (26, 'Dia 26', 'Gn 26; Mt 26; Et 3; At 26', 'Isaque em Gerar, Última ceia, Plano de Hamã, Defesa perante Agripa.'),
  (27, 'Dia 27', 'Gn 27; Mt 27; Et 4; At 27', 'Bênção roubada, Crucificação, Ester intervém, Naufrágio.'),
  (28, 'Dia 28', 'Gn 28; Mt 28; Et 5; At 28', 'Escada de Jacó, Ressurreição, Banquete de Ester, Paulo em Roma.'),
  (29, 'Dia 29', 'Gn 29; Mc 1; Et 6; Rm 1', 'Jacó em Harã, Início do ministério, Honra a Mordecai, Evangelho.'),
  (30, 'Dia 30', 'Gn 30; Mc 2; Et 7; Rm 2', 'Filhos de Jacó, Perdão de pecados, Morte de Hamã, Julgamento.')
) AS t(dia, titulo, versiculo_referencia, conteudo);

-- Insert first 30 days for Plano Capa-a-Capa
INSERT INTO public.reading_plan_days (plan_id, dia, titulo, versiculo_referencia, conteudo)
SELECT 
  (SELECT id FROM public.reading_plans WHERE titulo = 'Plano Capa-a-Capa Anual'),
  dia,
  titulo,
  versiculo_referencia,
  conteudo
FROM (VALUES
  (1, 'Criação', 'Gênesis 1-3', 'Deus cria o mundo em seis dias. Adão e Eva no jardim. A tentação e a queda.'),
  (2, 'Primeiras gerações', 'Gênesis 4-6', 'Caim mata Abel. Genealogia de Adão. A humanidade se corrompe.'),
  (3, 'O Dilúvio', 'Gênesis 7-9', 'Noé entra na arca. As águas cobrem a terra. Aliança do arco-íris.'),
  (4, 'Nações e Babel', 'Gênesis 10-12', 'Descendentes de Noé. Torre de Babel. Chamado de Abrão.'),
  (5, 'Abraão e Ló', 'Gênesis 13-15', 'Separação de Abrão e Ló. Resgate de Ló. Aliança com Abrão.'),
  (6, 'Ismael e Circuncisão', 'Gênesis 16-18', 'Nascimento de Ismael. Aliança da circuncisão. Visita dos três homens.'),
  (7, 'Sodoma e Isaque', 'Gênesis 19-21', 'Destruição de Sodoma. Nascimento de Isaque. Expulsão de Hagar.'),
  (8, 'Prova e Sara', 'Gênesis 22-24', 'Sacrifício de Isaque. Morte de Sara. Rebeca escolhida.'),
  (9, 'Jacó e Esaú', 'Gênesis 25-27', 'Nascimento dos gêmeos. Esaú vende sua primogenitura. Bênção roubada.'),
  (10, 'Jacó em Harã', 'Gênesis 28-30', 'Escada de Jacó. Casamento com Lia e Raquel. Os doze filhos.'),
  (11, 'Retorno de Jacó', 'Gênesis 31-33', 'Fuga de Labão. Luta com o anjo. Reconciliação com Esaú.'),
  (12, 'José vendido', 'Gênesis 34-36', 'Incidente em Siquém. Morte de Raquel. Descendentes de Esaú.'),
  (13, 'José no Egito', 'Gênesis 37-39', 'Sonhos de José. Vendido como escravo. Na casa de Potifar.'),
  (14, 'Sonhos e poder', 'Gênesis 40-42', 'José interpreta sonhos. Governador do Egito. Irmãos chegam.'),
  (15, 'Reconciliação', 'Gênesis 43-45', 'Segunda viagem. José se revela aos irmãos.'),
  (16, 'Família no Egito', 'Gênesis 46-48', 'Jacó vai ao Egito. Estabelecem-se em Gósen. Bênçãos.'),
  (17, 'Fim de Gênesis', 'Gênesis 49-50; Êxodo 1', 'Bênçãos de Jacó. Morte de José. Escravidão no Egito.'),
  (18, 'Moisés nasce', 'Êxodo 2-4', 'Nascimento de Moisés. Fuga para Midiã. A sarça ardente.'),
  (19, 'Pragas começam', 'Êxodo 5-7', 'Moisés perante Faraó. As primeiras pragas.'),
  (20, 'Mais pragas', 'Êxodo 8-10', 'Pragas continuam. Coração de Faraó endurecido.'),
  (21, 'Páscoa e Êxodo', 'Êxodo 11-13', 'Morte dos primogênitos. Instituição da Páscoa. Saída do Egito.'),
  (22, 'Mar Vermelho', 'Êxodo 14-16', 'Travessia do Mar Vermelho. Cântico de Moisés. Maná do céu.'),
  (23, 'Sinai', 'Êxodo 17-19', 'Água da rocha. Batalha contra Amaleque. Chegada ao Sinai.'),
  (24, 'Dez Mandamentos', 'Êxodo 20-22', 'Os Dez Mandamentos. Leis sobre escravos, violência, propriedade.'),
  (25, 'Leis e Aliança', 'Êxodo 23-25', 'Leis diversas. Confirmação da aliança. Ofertas para o tabernáculo.'),
  (26, 'Tabernáculo', 'Êxodo 26-28', 'Instruções para o tabernáculo, a arca e as vestes sacerdotais.'),
  (27, 'Sacerdócio', 'Êxodo 29-31', 'Consagração dos sacerdotes. Incenso sagrado. Bezalel e Ooliabe.'),
  (28, 'Bezerro de ouro', 'Êxodo 32-34', 'Idolatria do povo. Moisés intercede. Novas tábuas da lei.'),
  (29, 'Construção', 'Êxodo 35-37', 'Ofertas do povo. Construção do tabernáculo e seus utensílios.'),
  (30, 'Conclusão', 'Êxodo 38-40', 'Término do tabernáculo. A glória do Senhor o enche.')
) AS t(dia, titulo, versiculo_referencia, conteudo);