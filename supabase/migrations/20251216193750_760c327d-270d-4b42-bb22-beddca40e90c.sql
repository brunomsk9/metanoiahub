-- Add Conexão Inicial tracking columns to discipleship_relationships
ALTER TABLE public.discipleship_relationships
ADD COLUMN conexao_inicial_1 boolean DEFAULT false,
ADD COLUMN conexao_inicial_2 boolean DEFAULT false,
ADD COLUMN conexao_inicial_3 boolean DEFAULT false,
ADD COLUMN conexao_inicial_4 boolean DEFAULT false;