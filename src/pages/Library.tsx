import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout";
import { MentorChatButton } from "@/components/MentorChat";
import { PageTransition } from "@/components/PageTransition";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Book, 
  Music, 
  Video, 
  Download, 
  ExternalLink, 
  Search,
  User
} from "lucide-react";
import { LibrarySkeleton } from "@/components/skeletons/PageSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

interface Resource {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string;
  url_pdf: string | null;
  video_url: string | null;
  link_externo: string | null;
  autor: string | null;
  imagem_capa: string | null;
  tags: string[] | null;
}

export default function Library() {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("livro");

  useEffect(() => {
    const fetchResources = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .in('categoria', ['livro', 'musica', 'pregacao'])
        .order('titulo');

      if (!error && data) {
        setResources(data);
      }
      setLoading(false);
    };

    fetchResources();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const filteredResources = resources.filter(r => {
    const matchesCategory = r.categoria === activeTab;
    const matchesSearch = searchQuery === "" || 
      r.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.autor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.descricao?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'livro': return Book;
      case 'musica': return Music;
      case 'pregacao': return Video;
      default: return Book;
    }
  };

  const getCategoryLabel = (categoria: string) => {
    switch (categoria) {
      case 'livro': return 'Livros';
      case 'musica': return 'Músicas';
      case 'pregacao': return 'Pregações';
      default: return categoria;
    }
  };

  const openResource = (resource: Resource) => {
    if (resource.video_url) {
      window.open(resource.video_url, '_blank');
    } else if (resource.link_externo) {
      window.open(resource.link_externo, '_blank');
    }
  };

  const downloadPdf = (resource: Resource) => {
    if (resource.url_pdf) {
      window.open(resource.url_pdf, '_blank');
    }
  };

  return (
    <AppShell headerTitle="Biblioteca" onLogout={handleLogout}>
      <PageTransition>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <PageBreadcrumb items={[{ label: 'Biblioteca' }]} />

          {/* Header */}
          <header className="section-pattern rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Book className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-display font-bold">
                  <span className="text-gradient">Biblioteca</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Livros, músicas e pregações para edificar sua fé
                </p>
              </div>
            </div>
          </header>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, autor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 rounded-xl bg-card/50 border-border/50 focus:border-primary/50"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6 h-12 p-1 bg-card/50 rounded-xl">
              <TabsTrigger value="livro" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Book className="w-4 h-4" />
                <span className="hidden sm:inline">Livros</span>
              </TabsTrigger>
              <TabsTrigger value="musica" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Music className="w-4 h-4" />
                <span className="hidden sm:inline">Músicas</span>
              </TabsTrigger>
              <TabsTrigger value="pregacao" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Pregações</span>
              </TabsTrigger>
            </TabsList>

            {['livro', 'musica', 'pregacao'].map((categoria) => (
              <TabsContent key={categoria} value={categoria}>
                {loading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="glass-effect rounded-2xl p-4 border border-border/50">
                        <Skeleton className="h-32 w-full mb-3 rounded-xl" />
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : filteredResources.length === 0 ? (
                  <div className="glass-effect rounded-2xl p-12 border border-border/50 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      {(() => {
                        const Icon = getCategoryIcon(categoria);
                        return <Icon className="w-8 h-8 text-muted-foreground" />;
                      })()}
                    </div>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? `Nenhum resultado para "${searchQuery}"` 
                        : `Nenhum ${getCategoryLabel(categoria).toLowerCase().slice(0, -1)} cadastrado ainda`}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredResources.map((resource) => (
                      <ResourceCard 
                        key={resource.id} 
                        resource={resource}
                        onOpen={() => openResource(resource)}
                        onDownload={() => downloadPdf(resource)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </PageTransition>

      <MentorChatButton />
    </AppShell>
  );
}

interface ResourceCardProps {
  resource: Resource;
  onOpen: () => void;
  onDownload: () => void;
}

function ResourceCard({ resource, onOpen, onDownload }: ResourceCardProps) {
  const hasLink = resource.video_url || resource.link_externo;
  const hasPdf = resource.url_pdf;

  return (
    <div className="glass-effect rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 group">
      {resource.imagem_capa && (
        <div className="aspect-[16/9] bg-muted/50 overflow-hidden">
          <img 
            src={resource.imagem_capa} 
            alt={resource.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-medium text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {resource.titulo}
        </h3>
        {resource.autor && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
            <User className="w-3 h-3" />
            {resource.autor}
          </p>
        )}
        {resource.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {resource.descricao}
          </p>
        )}
        <div className="flex gap-2">
          {hasLink && (
            <Button 
              size="sm" 
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              onClick={onOpen}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Acessar
            </Button>
          )}
          {hasPdf && (
            <Button 
              variant="outline"
              size="sm" 
              className={`rounded-xl ${hasLink ? "" : "flex-1"}`}
              onClick={onDownload}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              PDF
            </Button>
          )}
          {!hasLink && !hasPdf && (
            <p className="text-xs text-muted-foreground italic">
              Em breve disponível
            </p>
          )}
        </div>
      </div>
    </div>
  );
}