-- Backfill: Add existing lider_principal as volunteers
INSERT INTO public.ministry_volunteers (ministry_id, user_id, church_id, funcao)
SELECT id, lider_principal_id, church_id, 'lider_principal'
FROM public.ministries
WHERE lider_principal_id IS NOT NULL
ON CONFLICT (ministry_id, user_id) DO NOTHING;

-- Backfill: Add existing lider_secundario as volunteers
INSERT INTO public.ministry_volunteers (ministry_id, user_id, church_id, funcao)
SELECT id, lider_secundario_id, church_id, 'lider_secundario'
FROM public.ministries
WHERE lider_secundario_id IS NOT NULL
ON CONFLICT (ministry_id, user_id) DO NOTHING;