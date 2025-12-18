import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, RotateCcw, Bot, Sparkles } from 'lucide-react';

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

export function AdminAISettings() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrompt();
  }, []);

  const fetchPrompt = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .select('value')
        .eq('key', 'mentor_system_prompt')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

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

  const handleSave = async () => {
    setSaving(true);
    try {
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
    </div>
  );
}
