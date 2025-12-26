import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ExternalLink, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Playbook {
  id: string;
  titulo: string;
  descricao: string | null;
  url_pdf: string | null;
  video_url: string | null;
  link_externo: string | null;
  imagem_capa: string | null;
  ministry_id: string | null;
  ministry?: {
    nome: string;
    cor: string | null;
    icone: string | null;
  };
}

interface VolunteerPlaybooksProps {
  userId: string;
  churchId: string | null;
}

export function VolunteerPlaybooks({ userId, churchId }: VolunteerPlaybooksProps) {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) return;
    fetchPlaybooks();
  }, [churchId, userId]);

  const fetchPlaybooks = async () => {
    try {
      // Fetch playbooks - RLS will filter based on user's ministries
      const { data, error } = await supabase
        .from('resources')
        .select(`
          id,
          titulo,
          descricao,
          url_pdf,
          video_url,
          link_externo,
          imagem_capa,
          ministry_id
        `)
        .eq('categoria', 'playbook')
        .eq('church_id', churchId);

      if (error) {
        console.error('Error fetching playbooks:', error);
        return;
      }

      if (data && data.length > 0) {
        // Fetch ministry details for each playbook
        const ministryIds = [...new Set(data.filter(p => p.ministry_id).map(p => p.ministry_id))];
        
        if (ministryIds.length > 0) {
          const { data: ministries } = await supabase
            .from('ministries')
            .select('id, nome, cor, icone')
            .in('id', ministryIds);

          const ministryMap = new Map(ministries?.map(m => [m.id, m]) || []);
          
          const playbooksWithMinistry = data.map(p => ({
            ...p,
            ministry: p.ministry_id ? ministryMap.get(p.ministry_id) : undefined
          }));
          
          setPlaybooks(playbooksWithMinistry);
        } else {
          setPlaybooks(data);
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (playbooks.length === 0) {
    return null; // Don't show section if no playbooks
  }

  return (
    <div className="space-y-3">
      {playbooks.map((playbook) => (
        <div
          key={playbook.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
        >
          {/* Cover Image or Icon */}
          <div 
            className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: playbook.ministry?.cor ? `${playbook.ministry.cor}20` : 'hsl(var(--muted))' }}
          >
            {playbook.imagem_capa ? (
              <img 
                src={playbook.imagem_capa} 
                alt={playbook.titulo} 
                className="w-full h-full object-cover"
              />
            ) : (
              <FileText 
                className="w-5 h-5" 
                style={{ color: playbook.ministry?.cor || 'hsl(var(--primary))' }}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">{playbook.titulo}</p>
            {playbook.ministry && (
              <span 
                className="inline-flex px-2 py-0.5 text-[10px] rounded-full mt-1"
                style={{ 
                  backgroundColor: `${playbook.ministry.cor || 'hsl(var(--primary))'}20`,
                  color: playbook.ministry.cor || 'hsl(var(--primary))'
                }}
              >
                {playbook.ministry.nome}
              </span>
            )}
            {playbook.descricao && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{playbook.descricao}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1 flex-shrink-0">
            {playbook.url_pdf && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(playbook.url_pdf!, '_blank')}
                title="Abrir PDF"
              >
                <FileText className="h-4 w-4 text-amber-500" />
              </Button>
            )}
            {playbook.video_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(playbook.video_url!, '_blank')}
                title="Assistir vídeo"
              >
                <Play className="h-4 w-4 text-red-500" />
              </Button>
            )}
            {playbook.link_externo && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(playbook.link_externo!, '_blank')}
                title="Link externo"
              >
                <ExternalLink className="h-4 w-4 text-blue-500" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
