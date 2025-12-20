import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Track {
  id: string;
  titulo: string;
  descricao: string | null;
  cover_image: string | null;
  coursesCount: number;
}

interface ReadingPlanWithProgress {
  id: string;
  titulo: string;
  descricao: string | null;
  duracao_dias: number;
  cover_image: string | null;
  categoria: string;
  currentDay: number;
  completedDays: number[];
  hasProgress: boolean;
}

interface BaseTrackProgress {
  trackId: string;
  trackTitle: string;
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  completedPresencial: boolean;
}

interface UserProfile {
  nome: string;
  current_streak: number;
  xp_points: number;
  onboarding_completed: boolean;
}

async function fetchUserSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

async function fetchDashboardData(userId: string) {
  const [profileRes, tracksRes, plansRes, progressRes, baseTrackRes, baseCompletedRes, presencialRes, rolesRes] = await Promise.all([
    supabase.from('profiles').select('nome, current_streak, xp_points, onboarding_completed').eq('id', userId).maybeSingle(),
    supabase.from('tracks').select(`id, titulo, descricao, cover_image, courses(count)`).order('ordem').limit(4),
    supabase.from('reading_plans').select('*').order('duracao_dias', { ascending: false }),
    supabase.from('user_reading_progress').select('*').eq('user_id', userId),
    supabase.from('tracks').select('id, titulo').eq('is_base', true).maybeSingle(),
    supabase.rpc('user_completed_base_track', { _user_id: userId }),
    supabase.from('discipleship_relationships').select('alicerce_completed_presencial').eq('discipulo_id', userId).eq('alicerce_completed_presencial', true).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', userId)
  ]);

  return {
    profile: profileRes.data as UserProfile | null,
    tracks: tracksRes.data,
    plans: plansRes.data,
    progress: progressRes.data,
    baseTrack: baseTrackRes.data,
    baseCompleted: baseCompletedRes.data,
    presencial: presencialRes.data,
    roles: rolesRes.data
  };
}

async function fetchBaseTrackLessons(baseTrackId: string, userId: string) {
  const { data: lessonsData } = await supabase
    .from('courses')
    .select('id')
    .eq('track_id', baseTrackId);
  
  if (!lessonsData || lessonsData.length === 0) return null;

  const courseIds = lessonsData.map(c => c.id);
  
  const { data: lessonIds } = await supabase
    .from('lessons')
    .select('id')
    .in('course_id', courseIds);

  const [totalLessonsRes, completedLessonsRes] = await Promise.all([
    supabase.from('lessons').select('id', { count: 'exact' }).in('course_id', courseIds),
    supabase.from('user_progress')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('completed', true)
      .in('lesson_id', lessonIds?.map(l => l.id) || [])
  ]);

  return {
    completedLessons: completedLessonsRes.count || 0,
    totalLessons: totalLessonsRes.count || 0
  };
}

export function useDashboardData() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');
  const [sessionChecked, setSessionChecked] = useState(false);

  // Check session first
  useEffect(() => {
    fetchUserSession().then(session => {
      if (!session) {
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);
      setSessionChecked(true);
    });
  }, [navigate]);

  // Fetch all dashboard data with react-query for caching
  const { data: dashboardData, isLoading: loadingData } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => fetchDashboardData(userId),
    enabled: !!userId && sessionChecked,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch base track lessons separately to avoid blocking main data
  const { data: baseTrackLessons } = useQuery({
    queryKey: ['baseTrackLessons', dashboardData?.baseTrack?.id, userId],
    queryFn: () => fetchBaseTrackLessons(dashboardData!.baseTrack!.id, userId),
    enabled: !!dashboardData?.baseTrack?.id && !!userId,
    staleTime: 1000 * 60 * 5,
  });

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (dashboardData?.profile && !dashboardData.profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [dashboardData?.profile, navigate]);

  // Derived state
  const isDiscipulador = useMemo(() => {
    const userRoles = dashboardData?.roles?.map(r => r.role) || [];
    return userRoles.includes('discipulador');
  }, [dashboardData?.roles]);

  const userName = useMemo(() => {
    return dashboardData?.profile?.nome || 'Discípulo';
  }, [dashboardData?.profile]);

  const streak = dashboardData?.profile?.current_streak || 0;
  const xpPoints = dashboardData?.profile?.xp_points || 0;

  const tracks: Track[] = useMemo(() => {
    if (!dashboardData?.tracks) return [];
    return dashboardData.tracks.map(track => ({
      id: track.id,
      titulo: track.titulo,
      descricao: track.descricao,
      cover_image: track.cover_image,
      coursesCount: track.courses?.[0]?.count || 0,
    }));
  }, [dashboardData?.tracks]);

  const readingPlans: ReadingPlanWithProgress[] = useMemo(() => {
    if (!dashboardData?.plans) return [];
    return dashboardData.plans.map(plan => {
      const userProgress = dashboardData.progress?.find(p => p.plan_id === plan.id);
      return {
        id: plan.id,
        titulo: plan.titulo,
        descricao: plan.descricao,
        duracao_dias: plan.duracao_dias,
        cover_image: plan.cover_image,
        categoria: plan.categoria || 'leitura bíblica',
        currentDay: userProgress?.current_day || 1,
        completedDays: userProgress?.completed_days || [],
        hasProgress: !!userProgress
      };
    });
  }, [dashboardData?.plans, dashboardData?.progress]);

  const baseTrackProgress: BaseTrackProgress | null = useMemo(() => {
    if (!dashboardData?.baseTrack || !baseTrackLessons) return null;
    
    const isCompleted = dashboardData.baseCompleted === true || !!dashboardData.presencial;
    
    return {
      trackId: dashboardData.baseTrack.id,
      trackTitle: dashboardData.baseTrack.titulo,
      completedLessons: baseTrackLessons.completedLessons,
      totalLessons: baseTrackLessons.totalLessons,
      isCompleted,
      completedPresencial: !!dashboardData.presencial
    };
  }, [dashboardData?.baseTrack, dashboardData?.baseCompleted, dashboardData?.presencial, baseTrackLessons]);

  // Categorized plans
  const annualPlans = useMemo(() => readingPlans.filter(p => p.duracao_dias >= 365), [readingPlans]);
  const semesterPlans = useMemo(() => readingPlans.filter(p => p.duracao_dias >= 180 && p.duracao_dias < 365), [readingPlans]);
  const otherPlans = useMemo(() => readingPlans.filter(p => p.duracao_dias < 180), [readingPlans]);
  const plansInProgress = useMemo(() => readingPlans.filter(p => p.hasProgress && p.completedDays.length > 0 && p.completedDays.length < p.duracao_dias), [readingPlans]);

  const getDurationLabel = useCallback((days: number) => {
    if (days >= 365) return `${Math.round(days / 365)} ano`;
    if (days >= 180) return `${Math.round(days / 30)} meses`;
    if (days >= 30) return `${Math.round(days / 7)} semanas`;
    return `${days} dias`;
  }, []);

  return {
    userId,
    userName,
    streak,
    xpPoints,
    tracks,
    readingPlans,
    baseTrackProgress,
    isDiscipulador,
    loading: !sessionChecked || loadingData,
    annualPlans,
    semesterPlans,
    otherPlans,
    plansInProgress,
    getDurationLabel,
  };
}
