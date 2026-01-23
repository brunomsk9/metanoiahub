import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Loader2, Presentation } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export function PresentationPdfGenerator() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-presentation-pdf');

      if (error) throw error;

      const { html } = data;

      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = html;
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Generate PDF
      const opt = {
        margin: 10,
        filename: 'Metanoia_Hub_Apresentacao.pdf',
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(container).save();

      // Cleanup
      document.body.removeChild(container);

      toast({
        title: 'PDF gerado!',
        description: 'O arquivo foi baixado automaticamente.',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PDF.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Presentation className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Material de Apresentação</CardTitle>
            <CardDescription>
              Gere um PDF profissional para apresentar o Metanoia Hub
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            O PDF inclui:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Propósito da plataforma</li>
            <li>Principais funcionalidades</li>
            <li>Benefícios para usuários</li>
            <li>Layout profissional e visual atraente</li>
          </ul>
        </div>
        
        <Button onClick={generatePdf} disabled={generating} className="w-full gap-2">
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4" />
              Baixar PDF de Apresentação
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
