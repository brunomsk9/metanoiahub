-- Remove unused columns for Conexão Inicial (only 2 levels needed)
ALTER TABLE public.discipleship_relationships
DROP COLUMN conexao_inicial_3,
DROP COLUMN conexao_inicial_4;