import { useState, useMemo, useEffect } from "react";
import { Search, FileText, Video, ArrowRight, GraduationCap, Loader2 } from "lucide-react";
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
  initialQuery?: string;
}

export function SearchSOS({ resources, onSelect, loading, initialQuery = '' }: SearchSOSProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Get all unique tags from resources for suggestions
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    resources.forEach(r => {
      r.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).slice(0, 8);
  }, [resources]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return { videos: [], pdfs: [], aulas: [], all: [] };
    
    const lowerQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const matchScore = (r: Resource): number => {
      let score = 0;
      const titleNorm = r.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const descNorm = r.descricao?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
      const courseNorm = r.courseName?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
      
      // Exact title match
      if (titleNorm.includes(lowerQuery)) score += 100;
      
      // Tag match
      if (r.tags.some(tag => {
        const tagNorm = tag.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return tagNorm.includes(lowerQuery) || lowerQuery.includes(tagNorm);
      })) score += 80;
      
      // Description match
      if (descNorm.includes(lowerQuery)) score += 50;
      
      // Course name match
      if (courseNorm.includes(lowerQuery)) score += 40;
      
      // Partial word match in title
      const queryWords = lowerQuery.split(' ').filter(w => w.length > 2);
      queryWords.forEach(word => {
        if (titleNorm.includes(word)) score += 30;
        if (descNorm.includes(word)) score += 10;
      });
      
      return score;
    };

    const scored = resources
      .map(r => ({ resource: r, score: matchScore(r) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const filtered = scored.map(s => s.resource);

    return {
      videos: filtered.filter(r => r.type === 'video' && r.source === 'resource'),
      pdfs: filtered.filter(r => r.type === 'pdf'),
      aulas: filtered.filter(r => r.source === 'lesson'),
      all: filtered
    };
  }, [query, resources]);

  const hasResults = filteredResults.all.length > 0;
  const showResults = query.trim().length > 0;

  const handleTagClick = (tag: string) => {
    setQuery(tag);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground animate-spin" />
        ) : (
          <Search className={cn(
            "absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors",
            isFocused ? "text-primary" : "text-muted-foreground"
          )} />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Digite sua busca ou selecione uma tag abaixo..."
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
      {showResults && !loading && (
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

              {/* Show all results if only misc types */}
              {filteredResults.aulas.length === 0 && 
               filteredResults.videos.length === 0 && 
               filteredResults.pdfs.length === 0 && 
               filteredResults.all.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-display font-semibold text-foreground">Resultados</h3>
                  <div className="grid md:grid-cols-2 gap-2">
                    {filteredResults.all.map((resource) => (
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
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">
                Nenhum resultado encontrado para "{query}"
              </p>
              {availableTags.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground/70 mb-3">
                    Tente buscar por:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Available Tags - Show when not searching */}
      {!showResults && !loading && (
        <div className="mt-8 text-center animate-fade-in">
          {resources.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">Busque por tags disponíveis:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {availableTags.length > 0 ? (
                  availableTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className="px-4 py-2 rounded-full text-sm font-medium bg-card border border-border text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma tag disponível</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum conteúdo disponível no momento
            </p>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-8 text-center animate-fade-in">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando conteúdo...</p>
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
