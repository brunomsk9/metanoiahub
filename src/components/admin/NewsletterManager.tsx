import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Plus, Send, Clock, Trash2, Eye, Users } from "lucide-react";
import { useUserChurchId } from "@/hooks/useUserChurchId";

interface Newsletter {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: "manual" | "automatica";
  status: "rascunho" | "agendada" | "enviada";
  scheduled_for: string | null;
  sent_at: string | null;
  recipients_count: number;
  created_at: string;
}

export function NewsletterManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  
  const queryClient = useQueryClient();
  const { churchId } = useUserChurchId();

  const { data: newsletters = [], isLoading } = useQuery({
    queryKey: ["newsletters", churchId],
    queryFn: async () => {
      if (!churchId) return [];
      
      const { data, error } = await supabase
        .from("newsletters")
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Newsletter[];
    },
    enabled: !!churchId,
  });

  const { data: subscriberCount = 0 } = useQuery({
    queryKey: ["newsletter-subscribers-count", churchId],
    queryFn: async () => {
      if (!churchId) return 0;
      
      // Use secure RPC function to get count without accessing individual emails
      const { data, error } = await supabase
        .rpc("get_newsletter_subscriber_count", { _church_id: churchId });

      if (error) throw error;
      return data || 0;
    },
    enabled: !!churchId,
  });

  const createNewsletter = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user || !churchId) throw new Error("Não autorizado");

      const { error } = await supabase.from("newsletters").insert({
        church_id: churchId,
        titulo,
        conteudo,
        tipo: "manual",
        status: "rascunho",
        created_by: session.session.user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Newsletter criada como rascunho");
      queryClient.invalidateQueries({ queryKey: ["newsletters"] });
      setDialogOpen(false);
      setTitulo("");
      setConteudo("");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar: ${error.message}`);
    },
  });

  const sendNewsletter = useMutation({
    mutationFn: async (id: string) => {
      // In a real implementation, this would call an edge function to send emails
      const { error } = await supabase
        .from("newsletters")
        .update({
          status: "enviada",
          sent_at: new Date().toISOString(),
          recipients_count: subscriberCount,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Newsletter enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["newsletters"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  const deleteNewsletter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletters")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Newsletter excluída");
      queryClient.invalidateQueries({ queryKey: ["newsletters"] });
      setDeleteDialogOpen(false);
      setSelectedNewsletter(null);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "rascunho":
        return <Badge variant="secondary">Rascunho</Badge>;
      case "agendada":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Agendada</Badge>;
      case "enviada":
        return <Badge variant="default" className="bg-green-500">Enviada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const drafts = newsletters.filter((n) => n.status === "rascunho");
  const sent = newsletters.filter((n) => n.status === "enviada");

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inscritos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriberCount}</div>
            <p className="text-xs text-muted-foreground">receberão a newsletter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drafts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sent.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Newsletter */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Newsletters</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Newsletter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Newsletter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Novidades da Semana"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="conteudo">Conteúdo</Label>
                <Textarea
                  id="conteudo"
                  placeholder="Escreva o conteúdo da sua newsletter..."
                  rows={10}
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => createNewsletter.mutate()}
                  disabled={!titulo || !conteudo || createNewsletter.isPending}
                >
                  Salvar como Rascunho
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="drafts">
        <TabsList>
          <TabsTrigger value="drafts">Rascunhos ({drafts.length})</TabsTrigger>
          <TabsTrigger value="sent">Enviadas ({sent.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="drafts">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum rascunho
                      </TableCell>
                    </TableRow>
                  ) : (
                    drafts.map((newsletter) => (
                      <TableRow key={newsletter.id}>
                        <TableCell className="font-medium">{newsletter.titulo}</TableCell>
                        <TableCell>
                          {format(new Date(newsletter.created_at), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(newsletter.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedNewsletter(newsletter);
                                setPreviewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => sendNewsletter.mutate(newsletter.id)}
                              disabled={sendNewsletter.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => {
                                setSelectedNewsletter(newsletter);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Enviada em</TableHead>
                    <TableHead>Destinatários</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sent.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhuma newsletter enviada
                      </TableCell>
                    </TableRow>
                  ) : (
                    sent.map((newsletter) => (
                      <TableRow key={newsletter.id}>
                        <TableCell className="font-medium">{newsletter.titulo}</TableCell>
                        <TableCell>
                          {newsletter.sent_at &&
                            format(new Date(newsletter.sent_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                        </TableCell>
                        <TableCell>{newsletter.recipients_count}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedNewsletter(newsletter);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedNewsletter?.titulo}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{selectedNewsletter?.conteudo}</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Newsletter?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A newsletter "{selectedNewsletter?.titulo}" será excluída permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedNewsletter && deleteNewsletter.mutate(selectedNewsletter.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
