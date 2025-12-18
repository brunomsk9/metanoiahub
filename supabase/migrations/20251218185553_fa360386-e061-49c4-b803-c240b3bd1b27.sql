
-- =============================================
-- FASE 1A: ADICIONAR NOVOS ROLES AO ENUM
-- =============================================

-- Adicionar novos valores ao enum (serão commitados separadamente)
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'church_admin';
