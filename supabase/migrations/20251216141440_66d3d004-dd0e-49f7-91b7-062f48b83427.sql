-- Add 6-month reading plans
INSERT INTO public.reading_plans (titulo, descricao, duracao_dias, categoria, cover_image) VALUES
  ('Novo Testamento em 6 Meses', 'Leia todo o Novo Testamento em 6 meses com uma leitura diária de 5-7 minutos. Perfeito para quem está começando.', 180, 'semestral', 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&auto=format&fit=crop'),
  ('Bíblia Completa em 6 Meses', 'Um plano intensivo para ler toda a Bíblia em 6 meses. Ideal para quem deseja um mergulho profundo nas Escrituras.', 184, 'semestral', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop');

-- Insert days for "Novo Testamento em 6 Meses" (first 30 days)
INSERT INTO public.reading_plan_days (plan_id, dia, titulo, versiculo_referencia, conteudo)
SELECT 
  (SELECT id FROM public.reading_plans WHERE titulo = 'Novo Testamento em 6 Meses'),
  d.dia,
  d.titulo,
  d.versiculo_referencia,
  d.conteudo
FROM (VALUES
  (1, 'O início de tudo', 'Mateus 1-2', 'A genealogia de Jesus e o nascimento do Salvador.'),
  (2, 'Preparação do ministério', 'Mateus 3-4', 'O batismo de Jesus e o início de seu ministério.'),
  (3, 'Sermão do Monte I', 'Mateus 5', 'As bem-aventuranças e ensinamentos fundamentais.'),
  (4, 'Sermão do Monte II', 'Mateus 6', 'Sobre oração, jejum e tesouros no céu.'),
  (5, 'Sermão do Monte III', 'Mateus 7', 'Não julgar, a porta estreita e os fundamentos.'),
  (6, 'Milagres de Jesus I', 'Mateus 8', 'Curas e demonstrações do poder de Cristo.'),
  (7, 'Milagres de Jesus II', 'Mateus 9', 'Mais curas e o chamado dos discípulos.'),
  (8, 'Envio dos doze', 'Mateus 10', 'Instruções para os discípulos em missão.'),
  (9, 'Jesus e João Batista', 'Mateus 11', 'Testemunho sobre João e convite ao descanso.'),
  (10, 'Senhor do Sábado', 'Mateus 12', 'Controvérsias e o pecado imperdoável.'),
  (11, 'Parábolas do Reino I', 'Mateus 13:1-30', 'O semeador e o joio entre o trigo.'),
  (12, 'Parábolas do Reino II', 'Mateus 13:31-58', 'O tesouro escondido e a pérola.'),
  (13, 'Morte de João Batista', 'Mateus 14', 'Martírio de João e multiplicação dos pães.'),
  (14, 'Tradições humanas', 'Mateus 15', 'O que contamina o homem.'),
  (15, 'Confissão de Pedro', 'Mateus 16', 'Tu és o Cristo, o Filho do Deus vivo.'),
  (16, 'Transfiguração', 'Mateus 17', 'A glória de Cristo revelada.'),
  (17, 'O maior no Reino', 'Mateus 18', 'Humildade e perdão.'),
  (18, 'Ensinos sobre casamento', 'Mateus 19', 'Divórcio e o jovem rico.'),
  (19, 'Trabalhadores na vinha', 'Mateus 20', 'Os últimos serão primeiros.'),
  (20, 'Entrada em Jerusalém', 'Mateus 21', 'Hosana ao Filho de Davi!'),
  (21, 'Parábolas de juízo', 'Mateus 22', 'As bodas e a pergunta sobre impostos.'),
  (22, 'Ai dos fariseus', 'Mateus 23', 'Denúncia contra a hipocrisia.'),
  (23, 'Sinais do fim', 'Mateus 24', 'O discurso profético de Jesus.'),
  (24, 'Parábolas da vigilância', 'Mateus 25', 'As virgens, os talentos e o juízo.'),
  (25, 'Última Ceia', 'Mateus 26:1-35', 'A instituição da Ceia do Senhor.'),
  (26, 'Getsêmani', 'Mateus 26:36-75', 'Oração, prisão e negação de Pedro.'),
  (27, 'Crucificação', 'Mateus 27', 'A morte de Jesus na cruz.'),
  (28, 'Ressurreição', 'Mateus 28', 'Cristo vive! A Grande Comissão.'),
  (29, 'Início do Evangelho', 'Marcos 1', 'O começo do evangelho de Jesus Cristo.'),
  (30, 'Curas e chamado', 'Marcos 2', 'O paralítico e o chamado de Levi.')
) AS d(dia, titulo, versiculo_referencia, conteudo);

-- Insert days for "Bíblia Completa em 6 Meses" (first 30 days)
INSERT INTO public.reading_plan_days (plan_id, dia, titulo, versiculo_referencia, conteudo)
SELECT 
  (SELECT id FROM public.reading_plans WHERE titulo = 'Bíblia Completa em 6 Meses'),
  d.dia,
  d.titulo,
  d.versiculo_referencia,
  d.conteudo
FROM (VALUES
  (1, 'Criação', 'Gênesis 1-7', 'Da criação ao dilúvio.'),
  (2, 'Noé e Abraão', 'Gênesis 8-14', 'A aliança com Noé e chamado de Abrão.'),
  (3, 'Promessas de Deus', 'Gênesis 15-21', 'A aliança com Abraão e nascimento de Isaque.'),
  (4, 'Isaque e Jacó', 'Gênesis 22-28', 'O sacrifício de Isaque e a bênção de Jacó.'),
  (5, 'Jacó e Esaú', 'Gênesis 29-35', 'Jacó em Harã e reconciliação com Esaú.'),
  (6, 'José no Egito I', 'Gênesis 36-42', 'A história de José começa.'),
  (7, 'José no Egito II', 'Gênesis 43-50', 'Reunião da família e morte de Jacó.'),
  (8, 'Escravidão no Egito', 'Êxodo 1-7', 'Moisés e as primeiras pragas.'),
  (9, 'As pragas', 'Êxodo 8-14', 'Pragas e saída do Egito.'),
  (10, 'No deserto I', 'Êxodo 15-21', 'Maná, água da rocha e Sinai.'),
  (11, 'A Lei', 'Êxodo 22-28', 'Leis e instruções para o tabernáculo.'),
  (12, 'O tabernáculo', 'Êxodo 29-35', 'Consagração dos sacerdotes.'),
  (13, 'Conclusão do tabernáculo', 'Êxodo 36-40', 'Construção e glória de Deus.'),
  (14, 'Sacrifícios', 'Levítico 1-7', 'Os diferentes tipos de ofertas.'),
  (15, 'Sacerdócio', 'Levítico 8-14', 'Consagração e leis de pureza.'),
  (16, 'Santidade', 'Levítico 15-21', 'Leis de santidade.'),
  (17, 'Festas e votos', 'Levítico 22-27', 'As festas do Senhor.'),
  (18, 'Censo', 'Números 1-7', 'Organização do povo.'),
  (19, 'Levitas e Páscoa', 'Números 8-14', 'Serviço dos levitas e os espias.'),
  (20, 'Rebelião', 'Números 15-21', 'Corá, a serpente de bronze.'),
  (21, 'Balaão', 'Números 22-28', 'A história de Balaão.'),
  (22, 'Preparação para Canaã', 'Números 29-36', 'Leis e divisão da terra.'),
  (23, 'Revisão da história', 'Deuteronômio 1-7', 'Moisés reconta a jornada.'),
  (24, 'Exortações', 'Deuteronômio 8-14', 'Lembrar e obedecer.'),
  (25, 'Leis diversas', 'Deuteronômio 15-21', 'Leis sociais e religiosas.'),
  (26, 'Bênçãos e maldições', 'Deuteronômio 22-28', 'Consequências da obediência.'),
  (27, 'Renovação da aliança', 'Deuteronômio 29-34', 'Morte de Moisés.'),
  (28, 'Conquista I', 'Josué 1-7', 'Entrada em Canaã e Jericó.'),
  (29, 'Conquista II', 'Josué 8-14', 'Campanhas militares.'),
  (30, 'Divisão da terra', 'Josué 15-21', 'Herança das tribos.')
) AS d(dia, titulo, versiculo_referencia, conteudo);

-- Add reminder_enabled column to user_reading_progress
ALTER TABLE public.user_reading_progress 
ADD COLUMN IF NOT EXISTS reminder_enabled boolean DEFAULT false;

-- Add reminder_time column to user_reading_progress
ALTER TABLE public.user_reading_progress 
ADD COLUMN IF NOT EXISTS reminder_time time DEFAULT '08:00:00';