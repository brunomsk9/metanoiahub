import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  nome: string;
  current_streak: number;
  xp_points: number;
}

interface BulkAssignDisciplesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discipulador: Profile | null;
  availableDisciples: Profile[];
  currentDiscipleCount: number;
  maxDisciplesLimit: number;
  churchId: string | null;
  onSuccess: () => void;
}

export function BulkAssignDisciplesModal({
  open,
  onOpenChange,
  discipulador,
  availableDisciples,
  currentDiscipleCount,
  maxDisciplesLimit,
  churchId,
  onSuccess
}: BulkAssignDisciplesModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingSlots = maxDisciplesLimit - currentDiscipleCount;

  const filteredDisciples = useMemo(() => {
    if (!searchTerm) return availableDisciples;
    const search = searchTerm.toLowerCase();
    return availableDisciples.filter(d => 
      d.nome?.toLowerCase().includes(search)
    );
  }, [availableDisciples, searchTerm]);

  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      // Check if adding would exceed limit
      if (newSelected.size >= remainingSlots) {
        toast.error(`Você só pode selecionar mais ${remainingSlots} discípulos`);
        return;
      }
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredDisciples.length || selectedIds.size >= remainingSlots) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set<string>();
      filteredDisciples.slice(0, remainingSlots).forEach(d => newSelected.add(d.id));
      setSelectedIds(newSelected);
    }
  };

  const handleSubmit = async () => {
    if (!discipulador || selectedIds.size === 0 || !churchId) {
      toast.error("Selecione ao menos um discípulo");
      return;
    }

    setIsSubmitting(true);

    try {
      const insertData = Array.from(selectedIds).map(discipuloId => ({
        discipulador_id: discipulador.id,
        discipulo_id: discipuloId,
        status: 'active',
        church_id: churchId
      }));

      const { error } = await supabase
        .from('discipleship_relationships')
        .insert(insertData);

      if (error) {
        console.error('Error bulk assigning:', error);
        if (error.message?.includes('limite máximo')) {
          toast.error(`Limite máximo de ${maxDisciplesLimit} discípulos atingido`);
        } else if (error.code === '23505') {
          toast.error('Alguns discípulos já estão vinculados a outro discipulador');
        } else {
          toast.error('Erro ao vincular discípulos');
        }
        return;
      }

      toast.success(`${selectedIds.size} discípulo(s) vinculado(s) a ${discipulador.nome}`);
      setSelectedIds(new Set());
      setSearchTerm("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao vincular discípulos');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearchTerm("");
    onOpenChange(false);
  };

  if (!discipulador) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Vincular Discípulos em Massa
          </DialogTitle>
          <DialogDescription>
            Selecione os discípulos para vincular a <strong>{discipulador.nome}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              Atual: {currentDiscipleCount}/{maxDisciplesLimit}
            </Badge>
            <Badge 
              variant={remainingSlots > 0 ? "secondary" : "destructive"} 
              className="text-xs"
            >
              Disponíveis: {remainingSlots} vagas
            </Badge>
            {selectedIds.size > 0 && (
              <Badge className="text-xs bg-primary">
                Selecionados: {selectedIds.size}
              </Badge>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar discípulos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select all */}
          {filteredDisciples.length > 0 && (
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={selectedIds.size > 0 && selectedIds.size === Math.min(filteredDisciples.length, remainingSlots)}
                onCheckedChange={handleSelectAll}
                disabled={remainingSlots === 0}
              />
              <Label htmlFor="select-all" className="text-sm cursor-pointer">
                Selecionar todos ({Math.min(filteredDisciples.length, remainingSlots)})
              </Label>
            </div>
          )}

          {/* Disciples list */}
          <ScrollArea className="h-[300px] pr-4">
            {filteredDisciples.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {searchTerm ? 'Nenhum discípulo encontrado' : 'Não há discípulos disponíveis'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDisciples.map((disciple) => {
                  const isSelected = selectedIds.has(disciple.id);
                  const isDisabled = !isSelected && selectedIds.size >= remainingSlots;
                  
                  return (
                    <div
                      key={disciple.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : isDisabled 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-muted/50 cursor-pointer'
                      }`}
                      onClick={() => !isDisabled && handleToggle(disciple.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => handleToggle(disciple.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{disciple.nome || 'Sem nome'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>🔥 {disciple.current_streak} dias</span>
                          <span>⭐ {disciple.xp_points} XP</span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedIds.size === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vinculando...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Vincular {selectedIds.size} Discípulo(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
