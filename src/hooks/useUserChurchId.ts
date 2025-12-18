import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useUserChurchId() {
  const [churchId, setChurchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChurchId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .maybeSingle();

      setChurchId(profile?.church_id || null);
      setLoading(false);
    };

    fetchChurchId();
  }, []);

  return { churchId, loading };
}
