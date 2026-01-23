import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { UserCog, ArrowLeft, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ImpersonationData {
  originalSession: {
    access_token: string;
    refresh_token: string;
  };
  originalUser: {
    id: string;
    email: string;
    nome: string;
  };
  impersonatedUser: {
    id: string;
    email: string;
    nome: string;
  };
}

const IMPERSONATION_KEY = 'metanoia_impersonation_data';

export function getImpersonationData(): ImpersonationData | null {
  try {
    const data = sessionStorage.getItem(IMPERSONATION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setImpersonationData(data: ImpersonationData): void {
  sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(data));
}

export function clearImpersonationData(): void {
  sessionStorage.removeItem(IMPERSONATION_KEY);
}

export function isImpersonating(): boolean {
  return getImpersonationData() !== null;
}

export function ImpersonationBanner() {
  const [impersonationData, setImpersonationDataState] = useState<ImpersonationData | null>(null);
  const [returning, setReturning] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const data = getImpersonationData();
    setImpersonationDataState(data);

    // Listen for storage changes (in case opened in multiple tabs)
    const handleStorageChange = () => {
      setImpersonationDataState(getImpersonationData());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleReturnToSuperAdmin = async () => {
    if (!impersonationData) return;
    
    setReturning(true);
    
    try {
      // Sign out current impersonated session
      await supabase.auth.signOut();
      
      // Restore original super admin session
      const { error } = await supabase.auth.setSession({
        access_token: impersonationData.originalSession.access_token,
        refresh_token: impersonationData.originalSession.refresh_token,
      });

      if (error) {
        throw error;
      }

      // Clear impersonation data
      clearImpersonationData();
      setImpersonationDataState(null);

      toast({
        title: 'Sessão restaurada',
        description: `Você voltou para a conta de ${impersonationData.originalUser.nome}`,
      });

      // Navigate to super admin page
      navigate('/super-admin');
    } catch (error) {
      console.error('Error returning to super admin:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível restaurar a sessão. Faça login novamente.',
      });
      
      // Clear everything and redirect to auth
      clearImpersonationData();
      await supabase.auth.signOut();
      navigate('/auth');
    } finally {
      setReturning(false);
    }
  };

  if (!impersonationData) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-warning text-warning-foreground py-2 px-4 shadow-lg border-b border-warning/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserCog className="h-5 w-5 flex-shrink-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-semibold text-sm">Modo Impersonação</span>
            <span className="text-xs sm:text-sm opacity-90">
              Você está logado como <strong>{impersonationData.impersonatedUser.nome}</strong>
              <span className="hidden sm:inline"> ({impersonationData.impersonatedUser.email})</span>
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReturnToSuperAdmin}
          disabled={returning}
          className="bg-background/80 hover:bg-background text-foreground border-border flex-shrink-0"
        >
          {returning ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Voltando...
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Voltar para</span>
              <span className="sm:hidden">Voltar</span>
              <span className="hidden sm:inline ml-1">{impersonationData.originalUser.nome}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
