import { useState, useMemo } from "react";
import { Search, FileText, Video, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Resource {
  id: string;
  titulo: string;
  descricao?: string;
  type: 'video' | 'pdf';
  tags: string[];
  url: string;
}

interface SearchSOSProps {
  resources: Resource[];
  onSelect: (resource: Resource) => void;
}

export function SearchSOS({ resources, onSelect }: SearchSOSProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return { videos: [], pdfs: [] };
    
    const lowerQuery = query.toLowerCase();
    const filtered = resources.filter(r => 
      r.titulo.toLowerCase().includes(lowerQuery) ||
      r.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      r.descricao?.toLowerCase().includes(lowerQuery)
    );

    return {
      videos: filtered.filter(r => r.type === 'video'),
      pdfs: filtered.filter(r => r.type === 'pdf'),
    };
  }, [query, resources]);

  const hasResults = filteredResults.videos.length > 0 || filteredResults.pdfs.length > 0;
  const showResults = query.trim().length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Input */}
      <div className="search-premium relative">
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
          placeholder="Buscar ajuda... (ex: desânimo, luto, ansiedade)"
          className={cn(
            "w-full h-16 pl-14 pr-6 text-lg rounded-2xl border-2 bg-card/80 backdrop-blur-sm",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none transition-all duration-300",
            isFocused 
              ? "border-primary ring-4 ring-primary/20 shadow-glow" 
              : "border-border hover:border-border/80"
          )}
        />
      </div>

      {/* Results */}
      {showResults && (
        <div className="mt-6 animate-slide-up">
          {hasResults ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Videos Section */}
              {filteredResults.videos.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Video className="w-5 h-5" />
                    <h3 className="font-display font-semibold">Vídeos</h3>
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
                  <div className="flex items-center gap-2 text-accent">
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
          ) : (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground">
                Nenhum resultado encontrado para "{query}"
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Tente buscar por termos como: luto, ansiedade, pecado, desânimo
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
            {['Desânimo', 'Luto', 'Ansiedade', 'Pecado', 'Perdão', 'Dúvida'].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="tag-pill hover:bg-primary/20 hover:text-primary hover:border-primary/30 cursor-pointer"
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
  const Icon = resource.type === 'video' ? Video : FileText;
  
  return (
    <button
      onClick={() => onSelect(resource)}
      className="w-full group card-premium p-4 text-left transition-all duration-200 hover:border-primary/30"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          resource.type === 'video' ? "bg-primary/20" : "bg-accent/20"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            resource.type === 'video' ? "text-primary" : "text-accent"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {resource.titulo}
          </h4>
          {resource.descricao && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {resource.descricao}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {resource.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
      </div>
    </button>
  );
}
