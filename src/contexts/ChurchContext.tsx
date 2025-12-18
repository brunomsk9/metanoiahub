import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Church {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
}

interface ChurchContextType {
  church: Church | null;
  churchId: string | null;
  isLoading: boolean;
  setChurchId: (id: string | null) => void;
  churches: Church[];
  loadChurches: () => Promise<void>;
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [church, setChurch] = useState<Church | null>(null);
  const [churchId, setChurchIdState] = useState<string | null>(null);
  const [churches, setChurches] = useState<Church[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadChurches = async () => {
    const { data, error } = await supabase
      .from('churches')
      .select('id, nome, slug, logo_url, cor_primaria, cor_secundaria')
      .eq('is_active', true)
      .order('nome');
    
    if (!error && data) {
      setChurches(data);
    }
  };

  const setChurchId = (id: string | null) => {
    setChurchIdState(id);
    if (id) {
      localStorage.setItem('selected_church_id', id);
    } else {
      localStorage.removeItem('selected_church_id');
    }
  };

  // Load user's church on auth state change
  useEffect(() => {
    const loadUserChurch = async () => {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if user is super_admin - they don't need a church
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);
        
        const isSuperAdmin = roles?.some(r => r.role === 'super_admin');
        
        if (!isSuperAdmin) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('church_id')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.church_id) {
            setChurchIdState(profile.church_id);
            
            const { data: churchData } = await supabase
              .from('churches')
              .select('id, nome, slug, logo_url, cor_primaria, cor_secundaria')
              .eq('id', profile.church_id)
              .single();
            
            if (churchData) {
              setChurch(churchData);
            }
          }
        }
      } else {
        // For signup, check localStorage for pre-selected church
        const storedChurchId = localStorage.getItem('selected_church_id');
        if (storedChurchId) {
          setChurchIdState(storedChurchId);
        }
      }
      
      setIsLoading(false);
    };

    loadUserChurch();
    loadChurches();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Use setTimeout to avoid deadlock
        setTimeout(async () => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);
          
          const isSuperAdmin = roles?.some(r => r.role === 'super_admin');
          
          if (!isSuperAdmin) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('church_id')
              .eq('id', session.user.id)
              .single();
            
            if (profile?.church_id) {
              setChurchIdState(profile.church_id);
              
              const { data: churchData } = await supabase
                .from('churches')
                .select('id, nome, slug, logo_url, cor_primaria, cor_secundaria')
                .eq('id', profile.church_id)
                .single();
              
              if (churchData) {
                setChurch(churchData);
              }
            }
          }
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setChurch(null);
        setChurchIdState(null);
        localStorage.removeItem('selected_church_id');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <ChurchContext.Provider value={{ church, churchId, isLoading, setChurchId, churches, loadChurches }}>
      {children}
    </ChurchContext.Provider>
  );
}

export function useChurch() {
  const context = useContext(ChurchContext);
  if (context === undefined) {
    throw new Error('useChurch must be used within a ChurchProvider');
  }
  return context;
}
