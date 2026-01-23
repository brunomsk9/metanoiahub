import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  MessageCircle, 
  Download, 
  Share2, 
  Check,
  Loader2,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2pdf from 'html2pdf.js';

interface Service {
  id: string;
  nome: string;
  data_hora: string;
}

interface Ministry {
  id: string;
  nome: string;
  cor: string;
}

interface Position {
  id: string;
  nome: string;
  ministry_id: string;
}

interface Schedule {
  id: string;
  service_id: string;
  ministry_id: string;
  position_id: string;
  volunteer_id: string;
  status: string;
}

interface UserProfile {
  id: string;
  nome: string;
}

interface ScheduleExportProps {
  service: Service | null;
  ministries: Ministry[];
  positions: Position[];
  schedules: Schedule[];
  users: UserProfile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleExport({
  service,
  ministries,
  positions,
  schedules,
  users,
  open,
  onOpenChange,
}: ScheduleExportProps) {
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [exportType, setExportType] = useState<'whatsapp' | 'pdf' | null>(null);
  const [generating, setGenerating] = useState(false);

  const getVolunteerName = (volunteerId: string) => {
    return users.find(u => u.id === volunteerId)?.nome || 'Desconhecido';
  };

  const getPositionName = (positionId: string) => {
    return positions.find(p => p.id === positionId)?.nome || 'Posição';
  };

  const getMinistryPositions = (ministryId: string) => {
    return positions.filter(p => p.ministry_id === ministryId);
  };

  const getPositionSchedules = (positionId: string) => {
    return schedules.filter(s => s.position_id === positionId);
  };

  const ministriesWithSchedules = ministries.filter(m => {
    const ministryPositions = getMinistryPositions(m.id);
    return ministryPositions.some(p => getPositionSchedules(p.id).length > 0);
  });

  const toggleMinistry = (ministryId: string) => {
    setSelectedMinistries(prev => 
      prev.includes(ministryId) 
        ? prev.filter(id => id !== ministryId)
        : [...prev, ministryId]
    );
  };

  const selectAll = () => {
    setSelectedMinistries(ministriesWithSchedules.map(m => m.id));
  };

  const clearAll = () => {
    setSelectedMinistries([]);
  };

  const generateWhatsAppText = (ministryId?: string) => {
    if (!service) return '';
    
    const targetMinistries = ministryId 
      ? ministries.filter(m => m.id === ministryId)
      : ministries.filter(m => selectedMinistries.includes(m.id));
    
    const serviceDate = format(new Date(service.data_hora), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
    
    let text = `📋 *ESCALA - ${service.nome.toUpperCase()}*\n`;
    text += `📅 ${serviceDate}\n\n`;
    
    targetMinistries.forEach(ministry => {
      const ministryPositions = getMinistryPositions(ministry.id);
      const hasSchedules = ministryPositions.some(p => getPositionSchedules(p.id).length > 0);
      
      if (hasSchedules) {
        text += `*${ministry.nome}*\n`;
        
        ministryPositions.forEach(position => {
          const positionSchedules = getPositionSchedules(position.id);
          if (positionSchedules.length > 0) {
            text += `  📌 ${position.nome}:\n`;
            positionSchedules.forEach(schedule => {
              const volunteerName = getVolunteerName(schedule.volunteer_id);
              const statusEmoji = schedule.status === 'confirmed' ? '✅' : schedule.status === 'declined' ? '❌' : '⏳';
              text += `     ${statusEmoji} ${volunteerName}\n`;
            });
          }
        });
        text += '\n';
      }
    });
    
    text += `\n_Escala gerada automaticamente_`;
    
    return text;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copiado para a área de transferência!');
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  const shareWhatsApp = (text: string) => {
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const generatePDF = async () => {
    if (!service) return;
    setGenerating(true);
    
    const targetMinistries = ministries.filter(m => selectedMinistries.includes(m.id));
    const serviceDate = format(new Date(service.data_hora), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
    
    // Create HTML content for PDF
    let htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0d9488; padding-bottom: 20px;">
          <h1 style="color: #0d9488; margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px;">Escala de Voluntários</h1>
          <h2 style="color: #333; margin: 10px 0 0 0; font-size: 20px; font-weight: 500;">${service.nome}</h2>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">${serviceDate}</p>
        </div>
    `;
    
    targetMinistries.forEach(ministry => {
      const ministryPositions = getMinistryPositions(ministry.id);
      const hasSchedules = ministryPositions.some(p => getPositionSchedules(p.id).length > 0);
      
      if (hasSchedules) {
        htmlContent += `
          <div style="margin-bottom: 25px; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: ${ministry.cor || '#0d9488'}; color: white; padding: 12px 20px; font-weight: 600; font-size: 16px;">
              ${ministry.nome}
            </div>
            <div style="padding: 15px 20px;">
        `;
        
        ministryPositions.forEach(position => {
          const positionSchedules = getPositionSchedules(position.id);
          if (positionSchedules.length > 0) {
            htmlContent += `
              <div style="margin-bottom: 12px;">
                <div style="font-weight: 600; color: #374151; font-size: 14px; margin-bottom: 6px; border-left: 3px solid ${ministry.cor || '#0d9488'}; padding-left: 10px;">
                  ${position.nome}
                </div>
                <div style="padding-left: 15px;">
            `;
            
            positionSchedules.forEach(schedule => {
              const volunteerName = getVolunteerName(schedule.volunteer_id);
              const statusColor = schedule.status === 'confirmed' ? '#22c55e' : schedule.status === 'declined' ? '#ef4444' : '#f59e0b';
              const statusText = schedule.status === 'confirmed' ? '✓' : schedule.status === 'declined' ? '✗' : '?';
              
              htmlContent += `
                <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 14px; color: #4b5563;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: ${statusColor}; color: white; font-size: 12px; font-weight: bold;">${statusText}</span>
                  <span>${volunteerName}</span>
                </div>
              `;
            });
            
            htmlContent += `</div></div>`;
          }
        });
        
        htmlContent += `</div></div>`;
      }
    });
    
    htmlContent += `
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #9ca3af; font-size: 12px;">
          Escala gerada em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      </div>
    `;
    
    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    document.body.appendChild(container);
    
    try {
      const opt = {
        margin: 10,
        filename: `escala-${service.nome.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(service.data_hora), 'dd-MM-yyyy')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(container).save();
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      document.body.removeChild(container);
      setGenerating(false);
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Share2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">Exportar Escala</DialogTitle>
              <DialogDescription className="mt-0.5">
                {service.nome} - {format(new Date(service.data_hora), "dd/MM/yyyy", { locale: ptBR })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Ministry Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Selecione os Ministérios</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">
                    Todos
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
                    Limpar
                  </Button>
                </div>
              </div>
              
              {ministriesWithSchedules.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Nenhum ministério com escala cadastrada
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {ministriesWithSchedules.map(ministry => {
                    const isSelected = selectedMinistries.includes(ministry.id);
                    const positionsCount = getMinistryPositions(ministry.id).length;
                    const schedulesCount = getMinistryPositions(ministry.id)
                      .reduce((acc, p) => acc + getPositionSchedules(p.id).length, 0);
                    
                    return (
                      <div
                        key={ministry.id}
                        onClick={() => toggleMinistry(ministry.id)}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200
                          ${isSelected 
                            ? 'bg-primary/5 border-primary shadow-sm' 
                            : 'bg-card border-transparent hover:border-muted-foreground/20 hover:bg-muted/30'
                          }
                        `}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${ministry.cor || 'hsl(var(--primary))'}20` }}
                        >
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: ministry.cor || 'hsl(var(--primary))' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{ministry.nome}</span>
                          <p className="text-xs text-muted-foreground">
                            {schedulesCount} voluntário(s) escalado(s)
                          </p>
                        </div>
                        <Checkbox checked={isSelected} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Export Options */}
            {selectedMinistries.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Formato de Exportação</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={() => setExportType('whatsapp')}
                  >
                    <MessageCircle className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium">WhatsApp</span>
                    <span className="text-xs text-muted-foreground">Texto para envio</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={generatePDF}
                    disabled={generating}
                  >
                    {generating ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <FileText className="h-6 w-6 text-red-600" />
                    )}
                    <span className="text-sm font-medium">PDF</span>
                    <span className="text-xs text-muted-foreground">Download documento</span>
                  </Button>
                </div>
              </div>
            )}
            
            {/* WhatsApp Preview */}
            {exportType === 'whatsapp' && selectedMinistries.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Prévia do Texto</Label>
                <Card>
                  <CardContent className="p-4">
                    <ScrollArea className="h-[200px]">
                      <pre className="text-xs whitespace-pre-wrap font-sans">
                        {generateWhatsAppText()}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => copyToClipboard(generateWhatsAppText())}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Texto
                  </Button>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => shareWhatsApp(generateWhatsAppText())}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Abrir WhatsApp
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex-shrink-0 px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
