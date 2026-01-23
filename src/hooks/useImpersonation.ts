import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  setImpersonationData, 
  clearImpersonationData,
  getImpersonationData 
} from '@/components/ImpersonationBanner';

interface TargetUser {
  id: string;
  nome: string;
  email: string;
}

export function useImpersonation() {
  const [impersonating, setImpersonating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const impersonateUser = async (targetUser: TargetUser) => {
    setImpersonating(true);

    try {
      // Get current session before impersonating
      const { data: currentSession } = await supabase.auth.getSession();
      
      if (!currentSession.session) {
        throw new Error('Você precisa estar logado para impersonar usuários');
      }

      // Get current user profile
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', currentSession.session.user.id)
        .single();

      // Call edge function to get impersonation link
      const { data, error } = await supabase.functions.invoke('impersonate-user', {
        body: { target_user_id: targetUser.id }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao impersonar usuário');
      }

      if (!data.success || !data.action_link) {
        throw new Error(data.error || 'Erro ao gerar sessão');
      }

      // Store original session data before switching
      setImpersonationData({
        originalSession: {
          access_token: currentSession.session.access_token,
          refresh_token: currentSession.session.refresh_token,
        },
        originalUser: {
          id: currentSession.session.user.id,
          email: currentSession.session.user.email || '',
          nome: currentProfile?.nome || 'Super Admin',
        },
        impersonatedUser: {
          id: targetUser.id,
          email: targetUser.email,
          nome: targetUser.nome,
        },
      });

      // Sign out current user
      await supabase.auth.signOut();

      // Extract token from action_link and verify
      // The action_link format is like: https://xxx.supabase.co/auth/v1/verify?token=xxx&type=magiclink&redirect_to=xxx
      const url = new URL(data.action_link);
      const token = url.searchParams.get('token');
      const type = url.searchParams.get('type');

      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Verify the OTP to create a session
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type === 'magiclink' ? 'magiclink' : 'email',
      });

      if (verifyError) {
        console.error('Error verifying OTP:', verifyError);
        // If verification fails, try to restore original session
        clearImpersonationData();
        throw new Error('Erro ao criar sessão do usuário');
      }

      toast({
        title: 'Impersonação ativa',
        description: `Você está agora logado como ${targetUser.nome}`,
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error impersonating user:', error);
      
      // Try to restore original session on error
      const impersonationData = getImpersonationData();
      if (impersonationData) {
        try {
          await supabase.auth.setSession({
            access_token: impersonationData.originalSession.access_token,
            refresh_token: impersonationData.originalSession.refresh_token,
          });
        } catch (restoreError) {
          console.error('Error restoring session:', restoreError);
        }
        clearImpersonationData();
      }

      toast({
        variant: 'destructive',
        title: 'Erro ao impersonar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setImpersonating(false);
    }
  };

  return {
    impersonateUser,
    impersonating,
  };
}
