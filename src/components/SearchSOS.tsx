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
  loading?: boolean;
}

export function SearchSOS({ resources, onSelect, loading }: SearchSOSProps) {
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
      <div className="relative">
        <Search className={cn(
          "absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors",
          isFocused ? "text-amber-500" : "text-gray-400"
        )} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Buscar ajuda... (ex: desânimo, luto, ansiedade)"
          className={cn(
            "w-full h-14 pl-14 pr-6 text-lg rounded-2xl border bg-white",
            "text-gray-900 placeholder:text-gray-400",
            "focus:outline-none transition-all duration-300",
            isFocused 
              ? "border-amber-400 ring-4 ring-amber-100 shadow-lg" 
              : "border-gray-200 shadow-sm hover:border-gray-300"
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
                  <div className="flex items-center gap-2 text-amber-600">
                    <Video className="w-5 h-5" />
                    <h3 className="font-display font-semibold">Vídeos</h3>
                    <span className="text-xs text-gray-400">
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
                  <div className="flex items-center gap-2 text-orange-600">
                    <FileText className="w-5 h-5" />
                    <h3 className="font-display font-semibold">PDFs de Apoio</h3>
                    <span className="text-xs text-gray-400">
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
              <p className="text-gray-500">
                Nenhum resultado encontrado para "{query}"
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Tente buscar por termos como: luto, ansiedade, pecado, desânimo
              </p>
            </div>
          )}
        </div>
      )}

      {/* Popular Tags */}
      {!showResults && (
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-sm text-gray-500 mb-4">Buscas populares:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Desânimo', 'Luto', 'Ansiedade', 'Pecado', 'Perdão', 'Dúvida'].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-all cursor-pointer"
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
      className="w-full group bg-white rounded-xl p-4 text-left border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          resource.type === 'video' ? "bg-amber-100" : "bg-orange-100"
        )}>
          <Icon className={cn(
            "w-5 h-5",
            resource.type === 'video' ? "text-amber-600" : "text-orange-600"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-1">
            {resource.titulo}
          </h4>
          {resource.descricao && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {resource.descricao}
            </p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            {resource.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
      </div>
    </button>
  );
}