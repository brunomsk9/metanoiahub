import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, User, ChevronDown, ChevronRight, Search, ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserChurchId } from '@/hooks/useUserChurchId';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  nome: string;
  avatar_url: string | null;
}

interface DiscipleshipRelationship {
  id: string;
  discipulador_id: string;
  discipulo_id: string;
  status: string;
}

interface TreeNode {
  id: string;
  nome: string;
  avatar_url: string | null;
  disciples: TreeNode[];
  discipleCount: number;
}

export function DiscipleshipOrganogram() {
  const { churchId, loading: loadingChurch } = useUserChurchId();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [relationships, setRelationships] = useState<DiscipleshipRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(100);
  const [selectedDiscipulador, setSelectedDiscipulador] = useState<string>('all');

  useEffect(() => {
    if (churchId) {
      fetchData();
    }
  }, [churchId]);

  const fetchData = async () => {
    if (!churchId) return;
    setLoading(true);

    const [profilesRes, relationshipsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .eq('church_id', churchId),
      supabase
        .from('discipleship_relationships')
        .select('id, discipulador_id, discipulo_id, status')
        .eq('church_id', churchId)
        .eq('status', 'active')
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (relationshipsRes.data) setRelationships(relationshipsRes.data);
    
    setLoading(false);
  };

  // Get all discipuladores for filter
  const discipuladores = useMemo(() => {
    const discipuladorIds = new Set(relationships.map(r => r.discipulador_id));
    return profiles
      .filter(p => discipuladorIds.has(p.id))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [profiles, relationships]);

  // Build tree structure
  const tree = useMemo(() => {
    const profileMap = new Map<string, Profile>();
    profiles.forEach(p => profileMap.set(p.id, p));

    // Find all discipulos (people who are being discipled)
    const discipleIds = new Set(relationships.map(r => r.discipulo_id));
    
    // Find root discipuladores (people who disciple others but are not discipled by anyone)
    const rootDiscipuladores = new Set<string>();
    relationships.forEach(r => {
      if (!discipleIds.has(r.discipulador_id)) {
        rootDiscipuladores.add(r.discipulador_id);
      }
    });

    // Build tree recursively
    const buildNode = (userId: string, visited: Set<string>): TreeNode | null => {
      if (visited.has(userId)) return null; // Prevent cycles
      visited.add(userId);

      const profile = profileMap.get(userId);
      if (!profile) return null;

      const userRelationships = relationships.filter(r => r.discipulador_id === userId);
      const disciples: TreeNode[] = [];
      
      userRelationships.forEach(r => {
        const childNode = buildNode(r.discipulo_id, new Set(visited));
        if (childNode) disciples.push(childNode);
      });

      // Count total disciples recursively
      const countDisciples = (node: TreeNode): number => {
        return node.disciples.length + node.disciples.reduce((sum, d) => sum + countDisciples(d), 0);
      };

      const node: TreeNode = {
        id: profile.id,
        nome: profile.nome,
        avatar_url: profile.avatar_url,
        disciples,
        discipleCount: 0
      };
      node.discipleCount = countDisciples(node);

      return node;
    };

    const roots: TreeNode[] = [];
    
    // If a specific discipulador is selected, start from that person
    if (selectedDiscipulador && selectedDiscipulador !== 'all') {
      const node = buildNode(selectedDiscipulador, new Set());
      if (node) roots.push(node);
    } else {
      // Show all root discipuladores
      rootDiscipuladores.forEach(id => {
        const node = buildNode(id, new Set());
        if (node) roots.push(node);
      });
    }

    // Sort roots by disciple count
    roots.sort((a, b) => b.discipleCount - a.discipleCount);

    return roots;
  }, [profiles, relationships, selectedDiscipulador]);

  // Expand all nodes initially
  useEffect(() => {
    const allIds = new Set<string>();
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach(n => {
        allIds.add(n.id);
        collectIds(n.disciples);
      });
    };
    collectIds(tree);
    setExpandedNodes(allIds);
  }, [tree]);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach(n => {
        allIds.add(n.id);
        collectIds(n.disciples);
      });
    };
    collectIds(tree);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Filter nodes based on search
  const filterTree = (nodes: TreeNode[], searchTerm: string): TreeNode[] => {
    if (!searchTerm) return nodes;
    
    const term = searchTerm.toLowerCase();
    
    const nodeMatches = (node: TreeNode): boolean => {
      if (node.nome.toLowerCase().includes(term)) return true;
      return node.disciples.some(d => nodeMatches(d));
    };

    return nodes.filter(n => nodeMatches(n)).map(n => ({
      ...n,
      disciples: filterTree(n.disciples, searchTerm)
    }));
  };

  const filteredTree = useMemo(() => filterTree(tree, search), [tree, search]);

  const renderNode = (node: TreeNode, level: number = 0, isLast: boolean = true, parentLines: boolean[] = []) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasDisciples = node.disciples.length > 0;
    const searchMatch = search && node.nome.toLowerCase().includes(search.toLowerCase());

    return (
      <div key={node.id} className="relative">
        <div 
          className={cn(
            "flex items-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer hover:bg-muted/50",
            searchMatch && "bg-primary/10 ring-1 ring-primary/30"
          )}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => hasDisciples && toggleNode(node.id)}
        >
          {/* Expand/Collapse button */}
          <div className="w-5 h-5 flex items-center justify-center">
            {hasDisciples ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            )}
          </div>

          {/* Avatar */}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
            level === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {node.avatar_url ? (
              <img src={node.avatar_url} alt={node.nome} className="w-full h-full rounded-full object-cover" />
            ) : (
              node.nome.charAt(0).toUpperCase()
            )}
          </div>

          {/* Name and info */}
          <div className="flex-1 min-w-0">
            <span className="font-medium text-foreground truncate block">{node.nome}</span>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 shrink-0">
            {node.disciples.length > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Users className="h-3 w-3" />
                {node.disciples.length}
              </Badge>
            )}
            {level === 0 && (
              <Badge variant="default" className="text-xs">
                Raiz
              </Badge>
            )}
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasDisciples && (
          <div className="relative">
            {/* Vertical line */}
            <div 
              className="absolute left-[34px] top-0 bottom-4 w-px bg-border"
              style={{ marginLeft: `${level * 24}px` }}
            />
            {node.disciples.map((disciple, index) => (
              <div key={disciple.id} className="relative">
                {/* Horizontal connector */}
                <div 
                  className="absolute left-[34px] top-[22px] w-4 h-px bg-border"
                  style={{ marginLeft: `${level * 24}px` }}
                />
                {renderNode(
                  disciple, 
                  level + 1, 
                  index === node.disciples.length - 1,
                  [...parentLines, index !== node.disciples.length - 1]
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Stats
  const stats = useMemo(() => {
    const totalDiscipuladores = new Set(relationships.map(r => r.discipulador_id)).size;
    const totalDiscipulos = new Set(relationships.map(r => r.discipulo_id)).size;
    const totalRelationships = relationships.length;
    return { totalDiscipuladores, totalDiscipulos, totalRelationships };
  }, [relationships]);

  if (loading || loadingChurch) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Organograma de Discipulado
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Visualize a hierarquia de discipuladores e discípulos
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalDiscipuladores}</div>
          <div className="text-sm text-muted-foreground">Discipuladores</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalDiscipulos}</div>
          <div className="text-sm text-muted-foreground">Discípulos</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalRelationships}</div>
          <div className="text-sm text-muted-foreground">Relacionamentos</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Filter by Discipulador */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={selectedDiscipulador} onValueChange={setSelectedDiscipulador}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Filtrar por discipulador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os discipuladores</SelectItem>
                {discipuladores.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pessoa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <Maximize2 className="h-4 w-4 mr-1" />
            Expandir
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Recolher
          </Button>
          <div className="flex items-center gap-1 border border-border rounded-md">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setZoom(z => Math.max(50, z - 10))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setZoom(z => Math.min(150, z + 10))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tree View */}
      <div className="bg-card border border-border rounded-lg">
        <ScrollArea className="h-[500px]">
          <div 
            className="p-4"
            style={{ fontSize: `${zoom}%` }}
          >
            {filteredTree.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {search ? (
                  <>Nenhuma pessoa encontrada com "{search}"</>
                ) : relationships.length === 0 ? (
                  <>Nenhum relacionamento de discipulado cadastrado</>
                ) : (
                  <>Nenhum discipulador raiz encontrado</>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTree.map((node, index) => renderNode(node, 0, index === filteredTree.length - 1))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Legend */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-3">Legenda</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">A</div>
            <span className="text-muted-foreground">Discipulador raiz</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">B</div>
            <span className="text-muted-foreground">Discípulo/Discipulador</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              3
            </Badge>
            <span className="text-muted-foreground">Número de discípulos diretos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
