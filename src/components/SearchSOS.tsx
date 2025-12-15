import { useState, useMemo } from "react";
import { Search, FileText, Video, ArrowRight, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Resource {
  id: string;
  titulo: string;
  descricao?: string | null;
  type: 'video' | 'pdf' | 'aula';
  tags: string[];
  url: string;
  source: 'resource' | 'lesson';
  courseName?: string;
}

interface SearchSOSProps {
  resources: Resource[];
  onSelect: (resource: Resource) => void;
  loading?: boolean;
}

export function SearchSOS({ resources, onSelect, loading }: SearchSOSProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return { videos: [], pdfs: [], aulas: [] };
    
    const lowerQuery = query.toLowerCase();
    const filtered = resources.filter(r => 
      r.titulo.toLowerCase().includes(lowerQuery) ||
      r.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      r.descricao?.toLowerCase().includes(lowerQuery) ||
      r.courseName?.toLowerCase().includes(lowerQuery)
    );

    return {
      videos: filtered.filter(r => r.type === 'video' && r.source === 'resource'),
      pdfs: filtered.filter(r => r.type === 'pdf'),
      aulas: filtered.filter(r => r.source === 'lesson'),
    };
  }, [query, resources]);

  const hasResults = filteredResults.videos.length > 0 || filteredResults.pdfs.length > 0 || filteredResults.aulas.length > 0;
  const showResults = query.trim().length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className={cn(
          "absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors",
          isFocused ? "text-primary" : "text-muted-foreground"
        )} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Buscar ajuda... (ex: encontro, identidade, célula)"
          className={cn(
            "w-full h-14 pl-14 pr-6 text-lg rounded-2xl border bg-card",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none transition-all duration-300",
            isFocused 
              ? "border-primary ring-4 ring-primary/20 shadow-lg" 
              : "border-border shadow-sm hover:border-primary/30"
          )}
        />
      </div>

      {/* Results */}
      {showResults && (
        <div className="mt-6 animate-slide-up">
          {hasResults ? (
            <div className="space-y-6">
              {/* Aulas Section */}
              {filteredResults.aulas.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <GraduationCap className="w-5 h-5" />
                    <h3 className="font-display font-semibold">Aulas</h3>
                    <span className="text-xs text-muted-foreground">
                      ({filteredResults.aulas.length})
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {filteredResults.aulas.map((resource) => (
                      <ResourceCard 
                        key={resource.id} 
                        resource={resource} 
                        onSelect={onSelect} 
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Videos Section */}
                {filteredResults.videos.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-accent">
                      <Video className="w-5 h-5" />
                      <h3 className="font-display font-semibold">Vídeos S.O.S.</h3>
                      <span className="text-xs text-muted-foreground">
                        ({filteredResults.videos.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {filteredResults.videos.map((resource) => (
                        <ResourceCard 
                          key={resource.id} 
                          resource={resource} 
                          onSelect={onSelect} 
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* PDFs Section */}
                {filteredResults.pdfs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-warning">
                      <FileText className="w-5 h-5" />
                      <h3 className="font-display font-semibold">PDFs de Apoio</h3>
                      <span className="text-xs text-muted-foreground">
                        ({filteredResults.pdfs.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {filteredResults.pdfs.map((resource) => (
                        <ResourceCard 
                          key={resource.id} 
                          resource={resource} 
                          onSelect={onSelect} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">
                Nenhum resultado encontrado para "{query}"
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Tente buscar por: encontro, identidade, célula, multiplicação
              </p>
            </div>
          )}
        </div>
      )}

      {/* Popular Tags */}
      {!showResults && (
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-sm text-muted-foreground mb-4">Buscas populares:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Primeiro Encontro', 'Identidade', 'Célula', 'Restauração', 'Propósito', 'Multiplicação'].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-card border border-border text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ResourceCardProps {
  resource: Resource;
  onSelect: (resource: Resource) => void;
}

function ResourceCard({ resource, onSelect }: ResourceCardProps) {
  const getIcon = () => {
    if (resource.source === 'lesson') return GraduationCap;
    if (resource.type === 'video') return Video;
    return FileText;
  };
  
  const getIconColors = () => {
    if (resource.source === 'lesson') return { bg: 'bg-primary/10', text: 'text-primary' };
    if (resource.type === 'video') return { bg: 'bg-accent/10', text: 'text-accent' };
    return { bg: 'bg-warning/10', text: 'text-warning' };
  };
  
  const Icon = getIcon();
  const colors = getIconColors();
  
  return (
    <button
      onClick={() => onSelect(resource)}
      className="w-full group bg-card rounded-xl p-4 text-left border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          colors.bg
        )}>
          <Icon className={cn("w-5 h-5", colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {resource.titulo}
          </h4>
          {resource.courseName && (
            <p className="text-xs text-primary font-medium mt-0.5">
              {resource.courseName}
            </p>
          )}
          {resource.descricao && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {resource.descricao}
            </p>
          )}
          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
      </div>
    </button>
  );
}