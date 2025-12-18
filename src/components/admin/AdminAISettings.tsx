import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RotateCcw, Bot, Sparkles, History, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const DEFAULT_PROMPT = `Você é um mentor espiritual cristão sábio e compassivo do app Metanoia Hub. Seu papel é:
- Oferecer orientação baseada em princípios bíblicos
- Ser empático e acolhedor
- Responder de forma clara e prática
- Usar as escrituras quando apropriado
- Encorajar o crescimento espiritual
- Nunca julgar, sempre acolher

Quando receber contexto de recursos relevantes, use-os para enriquecer suas respostas.
Mantenha respostas concisas mas significativas (máximo 3 parágrafos).
Sempre termine com uma palavra de encorajamento ou versículo relevante.`;

interface PromptHistory {
  id: string;
  old_value: string | null;
  new_value: string;
  changed_at: string;
}

export function AdminAISettings() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchPrompt();
  }, []);

  useEffect(() => {
    if (historyOpen && history.length === 0) {
      fetchHistory();
    }
  }, [historyOpen]);

  const fetchPrompt = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('value')
        .eq('key', 'mentor_system_prompt')
        .maybeSingle();

      if (error) throw error;

      const currentPrompt = data?.value || DEFAULT_PROMPT;
      setPrompt(currentPrompt);
      setOriginalPrompt(currentPrompt);
    } catch (error) {
      console.error('Error fetching prompt:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o prompt.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('ai_prompt_history')
        .select('id, old_value, new_value, changed_at')
        .eq('setting_key', 'mentor_system_prompt')
        .order('changed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico.',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Save history entry
      const { error: historyError } = await supabase
        .from('ai_prompt_history')
        .insert({
          setting_key: 'mentor_system_prompt',
          old_value: originalPrompt,
          new_value: prompt,
          changed_by: user.id,
        });

      if (historyError) {
        console.error('Error saving history:', historyError);
      }

      // Update the prompt
      const { error } = await supabase
        .from('ai_settings')
        .upsert({
          key: 'mentor_system_prompt',
          value: prompt,
          description: 'Prompt do sistema usado pelo Mentor IA',
        }, {
          onConflict: 'key',
        });

      if (error) throw error;

      setOriginalPrompt(prompt);
      
      // Refresh history if panel is open
      if (historyOpen) {
        fetchHistory();
      }

      toast({
        title: 'Salvo!',
        description: 'O prompt foi atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o prompt.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPrompt(DEFAULT_PROMPT);
  };

  const handleUndo = () => {
    setPrompt(originalPrompt);
  };

  const handleRestoreVersion = (version: PromptHistory) => {
    setPrompt(version.new_value);
    toast({
      title: 'Versão restaurada',
      description: 'Clique em "Salvar Alterações" para aplicar.',
    });
  };

  const hasChanges = prompt !== originalPrompt;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Prompt do Mentor IA</CardTitle>
              <CardDescription>
                Configure as instruções que a IA seguirá ao responder perguntas no S.O.S.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Dicas para um bom prompt:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Defina a personalidade e tom de voz da IA</li>
                <li>Especifique limites (o que pode/não pode responder)</li>
                <li>Inclua instruções sobre uso de versículos</li>
                <li>Determine o tamanho ideal das respostas</li>
              </ul>
            </div>
          </div>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Digite o prompt do sistema..."
            className="min-h-[400px] font-mono text-sm"
          />

          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restaurar Padrão
              </Button>
              {hasChanges && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                >
                  Desfazer
                </Button>
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Alterações
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            As alterações serão aplicadas imediatamente nas novas conversas com o Mentor IA.
          </p>
        </CardContent>
      </Card>

      {/* History Section */}
      <Card>
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/50 rounded-lg">
                    <History className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Histórico de Alterações</CardTitle>
                    <CardDescription>
                      Visualize e restaure versões anteriores do prompt
                    </CardDescription>
                  </div>
                </div>
                {historyOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma alteração registrada ainda.</p>
                  <p className="text-sm">As alterações futuras aparecerão aqui.</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {history.map((item, index) => (
                      <div
                        key={item.id}
                        className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(new Date(item.changed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              {index === 0 && (
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                  Mais recente
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground line-clamp-3 font-mono bg-muted/50 p-2 rounded">
                              {item.new_value.substring(0, 200)}
                              {item.new_value.length > 200 && '...'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestoreVersion(item)}
                            className="flex-shrink-0"
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restaurar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
