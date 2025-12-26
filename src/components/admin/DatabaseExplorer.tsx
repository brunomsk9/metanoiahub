import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, Table as TableIcon, Download, Play, AlertTriangle, 
  RefreshCw, Search, Loader2, Copy, Check, Trash2, Plus, Edit,
  X, Save
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// List of tables available in the public schema
const AVAILABLE_TABLES = [
  'profiles',
  'churches',
  'user_roles',
  'tracks',
  'courses',
  'lessons',
  'user_progress',
  'discipleship_relationships',
  'discipleship_notes',
  'discipleship_history',
  'meetings',
  'meeting_attendance',
  'resources',
  'reading_plans',
  'reading_plan_days',
  'user_reading_progress',
  'daily_habits',
  'habit_streaks',
  'habit_achievements',
  'habit_definitions',
  'weekly_checklist_items',
  'weekly_checklist_responses',
  'ministries',
  'ministry_positions',
  'ministry_volunteers',
  'services',
  'service_types',
  'schedules',
  'volunteer_availability',
  'ai_settings',
  'ai_prompt_history',
  'super_admin_audit_logs',
] as const;

type TableName = typeof AVAILABLE_TABLES[number];

interface TableData {
  columns: string[];
  rows: Record<string, unknown>[];
  count: number;
}

interface EditingCell {
  rowIndex: number;
  column: string;
  originalValue: unknown;
  currentValue: string;
  rowId: unknown;
}

export function DatabaseExplorer() {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<TableName>('profiles');
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  
  // SQL Query state
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM profiles LIMIT 10');
  const [queryResult, setQueryResult] = useState<Record<string, unknown>[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryType, setQueryType] = useState<'select' | 'insert' | 'update' | 'delete'>('select');
  
  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string>('');
  
  // Copy state
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [savingCell, setSavingCell] = useState(false);
  
  // Delete row state
  const [deletingRowId, setDeletingRowId] = useState<unknown>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeleteRowId, setPendingDeleteRowId] = useState<unknown>(null);
  
  // Multi-select state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  
  // Insert new row state
  const [showInsertDialog, setShowInsertDialog] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [insertingRow, setInsertingRow] = useState(false);

  useEffect(() => {
    loadTableData();
  }, [selectedTable, page]);

  const loadTableData = async () => {
    setLoading(true);
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from(selectedTable)
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
      setTableData({
        columns,
        rows: data || [],
        count: count || 0,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!tableData || tableData.rows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não há dados para exportar.',
      });
      return;
    }

    const headers = tableData.columns.join(',');
    const rows = tableData.rows.map(row => 
      tableData.columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTable}_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportado!',
      description: `${tableData.rows.length} registros exportados para CSV.`,
    });

    // Log the export action
    logAction('export_csv', { table: selectedTable, rows_exported: tableData.rows.length });
  };

  const logAction = async (action: string, details: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', user.id)
        .single();

      await supabase.from('super_admin_audit_logs').insert({
        user_id: user.id,
        user_name: profile?.nome || user.email || 'Desconhecido',
        action: `database_explorer_${action}`,
        details: { ...details, executed_at: new Date().toISOString() },
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const detectQueryType = (query: string): 'select' | 'insert' | 'update' | 'delete' => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith('insert')) return 'insert';
    if (trimmed.startsWith('update')) return 'update';
    if (trimmed.startsWith('delete')) return 'delete';
    return 'select';
  };

  const executeQuery = async (query: string) => {
    const type = detectQueryType(query);
    setQueryType(type);

    // For destructive operations, show confirmation
    if (type !== 'select') {
      setPendingQuery(query);
      setShowConfirmDialog(true);
      return;
    }

    await runQuery(query);
  };

  const runQuery = async (query: string) => {
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const type = detectQueryType(query);
      
      // Log the query execution
      await logAction('execute_query', { query, type });

      // For SELECT queries, we need to parse and execute via Supabase
      // For other queries, we'll provide guidance
      if (type === 'select') {
        // Try to parse simple SELECT queries
        const tableMatch = query.match(/from\s+(\w+)/i);
        if (!tableMatch) {
          throw new Error('Não foi possível identificar a tabela. Use: SELECT * FROM tabela');
        }

        const tableName = tableMatch[1];
        if (!AVAILABLE_TABLES.includes(tableName as TableName)) {
          throw new Error(`Tabela "${tableName}" não encontrada.`);
        }

        // Parse LIMIT
        const limitMatch = query.match(/limit\s+(\d+)/i);
        const limit = limitMatch ? parseInt(limitMatch[1]) : 100;

        // Parse WHERE (basic support)
        const whereMatch = query.match(/where\s+(.+?)(?:\s+order|\s+limit|$)/i);
        
        let queryBuilder = supabase.from(tableName as any).select('*').limit(limit);

        // Basic WHERE parsing (supports simple equality)
        if (whereMatch) {
          const conditions = whereMatch[1].split(/\s+and\s+/i);
          for (const condition of conditions) {
            const eqMatch = condition.match(/(\w+)\s*=\s*'([^']+)'/);
            if (eqMatch) {
              queryBuilder = queryBuilder.eq(eqMatch[1], eqMatch[2]) as any;
            }
            const eqMatch2 = condition.match(/(\w+)\s*=\s*(\w+)/);
            if (eqMatch2 && !eqMatch) {
              queryBuilder = queryBuilder.eq(eqMatch2[1], eqMatch2[2]) as any;
            }
          }
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;
        setQueryResult((data as unknown as Record<string, unknown>[]) || []);

      } else {
        // For INSERT, UPDATE, DELETE - execute via supabase
        const tableMatch = query.match(/(?:into|update|from|delete\s+from)\s+(\w+)/i);
        if (!tableMatch) {
          throw new Error('Não foi possível identificar a tabela.');
        }

        const tableName = tableMatch[1];
        
        if (type === 'insert') {
          // Parse INSERT INTO table (columns) VALUES (values)
          const columnsMatch = query.match(/\(([^)]+)\)\s*values\s*\(([^)]+)\)/i);
          if (!columnsMatch) {
            throw new Error('Formato INSERT inválido. Use: INSERT INTO tabela (col1, col2) VALUES (val1, val2)');
          }
          
          const columns = columnsMatch[1].split(',').map(c => c.trim());
          const values = columnsMatch[2].split(',').map(v => {
            const trimmed = v.trim();
            // Remove quotes for string values
            if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
              return trimmed.slice(1, -1);
            }
            // Parse numbers and booleans
            if (trimmed === 'true') return true;
            if (trimmed === 'false') return false;
            if (trimmed === 'null') return null;
            if (!isNaN(Number(trimmed))) return Number(trimmed);
            return trimmed;
          });

          const insertData: Record<string, unknown> = {};
          columns.forEach((col, i) => {
            insertData[col] = values[i];
          });

          // Use raw RPC or dynamic table access
          const { data, error } = await supabase
            .from(tableName as any)
            .insert(insertData as any)
            .select();

          if (error) throw error;
          setQueryResult((data as unknown as Record<string, unknown>[]) || []);
          toast({ title: 'Sucesso', description: 'Registro inserido com sucesso!' });

        } else if (type === 'update') {
          // Parse UPDATE table SET col = val WHERE condition
          const setMatch = query.match(/set\s+(.+?)\s+where\s+(.+)/i);
          if (!setMatch) {
            throw new Error('UPDATE requer cláusula WHERE. Use: UPDATE tabela SET col = val WHERE id = valor');
          }

          const setPairs = setMatch[1].split(',').map(pair => {
            const [col, val] = pair.split('=').map(s => s.trim());
            let parsedVal: unknown = val;
            if (val.startsWith("'") && val.endsWith("'")) {
              parsedVal = val.slice(1, -1);
            } else if (val === 'true') parsedVal = true;
            else if (val === 'false') parsedVal = false;
            else if (val === 'null') parsedVal = null;
            else if (!isNaN(Number(val))) parsedVal = Number(val);
            return { col, val: parsedVal };
          });

          const updateData: Record<string, unknown> = {};
          setPairs.forEach(({ col, val }) => {
            updateData[col] = val;
          });

          // Parse WHERE
          const whereCondition = setMatch[2];
          const whereMatch = whereCondition.match(/(\w+)\s*=\s*'?([^']+)'?/);
          if (!whereMatch) {
            throw new Error('Condição WHERE inválida.');
          }

          const { data, error } = await supabase
            .from(tableName as any)
            .update(updateData as any)
            .eq(whereMatch[1], whereMatch[2])
            .select();

          if (error) throw error;
          setQueryResult((data as unknown as Record<string, unknown>[]) || []);
          toast({ title: 'Sucesso', description: `${(data as any[])?.length || 0} registro(s) atualizado(s)!` });

        } else if (type === 'delete') {
          // Parse DELETE FROM table WHERE condition
          const whereMatch = query.match(/where\s+(\w+)\s*=\s*'?([^']+)'?/i);
          if (!whereMatch) {
            throw new Error('DELETE requer cláusula WHERE. Use: DELETE FROM tabela WHERE id = valor');
          }

          const { data, error } = await supabase
            .from(tableName as any)
            .delete()
            .eq(whereMatch[1], whereMatch[2])
            .select();

          if (error) throw error;
          setQueryResult((data as unknown as Record<string, unknown>[]) || []);
          toast({ title: 'Sucesso', description: `${(data as any[])?.length || 0} registro(s) deletado(s)!` });
        }

        // Refresh table data if we modified it
        if (tableName === selectedTable) {
          loadTableData();
        }
      }

    } catch (error: any) {
      setQueryError(error.message);
      toast({
        variant: 'destructive',
        title: 'Erro na query',
        description: error.message,
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const copyCell = async (value: unknown, cellId: string) => {
    try {
      const text = value === null ? 'null' : typeof value === 'object' ? JSON.stringify(value) : String(value);
      await navigator.clipboard.writeText(text);
      setCopiedCell(cellId);
      setTimeout(() => setCopiedCell(null), 2000);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível copiar.',
      });
    }
  };

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  };

  const startEditing = (rowIndex: number, column: string, value: unknown, row: Record<string, unknown>) => {
    // Don't allow editing 'id' column directly
    if (column === 'id') {
      toast({
        variant: 'destructive',
        title: 'Não permitido',
        description: 'O campo ID não pode ser editado diretamente.',
      });
      return;
    }
    
    // Get the row ID for the update
    const rowId = row['id'];
    if (!rowId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Esta linha não possui um ID válido para edição.',
      });
      return;
    }

    setEditingCell({
      rowIndex,
      column,
      originalValue: value,
      currentValue: formatCellValue(value),
      rowId,
    });
  };

  const cancelEditing = () => {
    setEditingCell(null);
  };

  const saveEditing = async () => {
    if (!editingCell) return;

    const { column, currentValue, originalValue, rowId } = editingCell;

    // Check if value actually changed
    if (currentValue === formatCellValue(originalValue)) {
      setEditingCell(null);
      return;
    }

    setSavingCell(true);

    try {
      // Parse the value appropriately
      let parsedValue: unknown = currentValue;
      
      if (currentValue === 'null') {
        parsedValue = null;
      } else if (currentValue === 'true') {
        parsedValue = true;
      } else if (currentValue === 'false') {
        parsedValue = false;
      } else if (currentValue.startsWith('{') || currentValue.startsWith('[')) {
        try {
          parsedValue = JSON.parse(currentValue);
        } catch {
          // Keep as string if not valid JSON
        }
      } else if (!isNaN(Number(currentValue)) && currentValue.trim() !== '') {
        // Check if original was a number type to preserve type
        if (typeof originalValue === 'number') {
          parsedValue = Number(currentValue);
        }
      }

      const updateData: Record<string, unknown> = {
        [column]: parsedValue,
      };

      const { error } = await supabase
        .from(selectedTable as any)
        .update(updateData as any)
        .eq('id', rowId);

      if (error) throw error;

      // Log the action
      await logAction('inline_edit', {
        table: selectedTable,
        column,
        row_id: rowId,
        old_value: originalValue,
        new_value: parsedValue,
      });

      toast({
        title: 'Atualizado!',
        description: `Campo "${column}" atualizado com sucesso.`,
      });

      // Reload table data
      await loadTableData();
      setEditingCell(null);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    } finally {
      setSavingCell(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const confirmDeleteRow = (rowId: unknown) => {
    setPendingDeleteRowId(rowId);
    setShowDeleteDialog(true);
  };

  const deleteRow = async () => {
    if (!pendingDeleteRowId) return;

    setDeletingRowId(pendingDeleteRowId);
    setShowDeleteDialog(false);

    try {
      const { error } = await supabase
        .from(selectedTable as any)
        .delete()
        .eq('id', pendingDeleteRowId);

      if (error) throw error;

      // Log the action
      await logAction('delete_row', {
        table: selectedTable,
        row_id: pendingDeleteRowId,
      });

      toast({
        title: 'Deletado!',
        description: 'Registro removido com sucesso.',
      });

      // Reload table data
      await loadTableData();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar',
        description: error.message,
      });
    } finally {
      setDeletingRowId(null);
      setPendingDeleteRowId(null);
    }
  };

  // Multi-select functions
  const toggleRowSelection = (rowId: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredRows.length) {
      setSelectedRows(new Set());
    } else {
      const allIds = new Set(filteredRows.map(row => String(row['id'])));
      setSelectedRows(allIds);
    }
  };

  const deleteBulkRows = async () => {
    if (selectedRows.size === 0) return;

    setDeletingBulk(true);
    setShowBulkDeleteDialog(false);

    try {
      const idsToDelete = Array.from(selectedRows);
      
      const { error } = await supabase
        .from(selectedTable as any)
        .delete()
        .in('id', idsToDelete);

      if (error) throw error;

      // Log the action
      await logAction('bulk_delete', {
        table: selectedTable,
        row_ids: idsToDelete,
        count: idsToDelete.length,
      });

      toast({
        title: 'Deletados!',
        description: `${idsToDelete.length} registro(s) removido(s) com sucesso.`,
      });

      setSelectedRows(new Set());
      await loadTableData();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar',
        description: error.message,
      });
    } finally {
      setDeletingBulk(false);
    }
  };

  // Insert new row functions
  const openInsertDialog = () => {
    if (!tableData?.columns) return;
    
    // Initialize with empty values for all columns except id and created_at
    const initialData: Record<string, string> = {};
    tableData.columns.forEach(col => {
      if (col !== 'id' && col !== 'created_at' && col !== 'updated_at') {
        initialData[col] = '';
      }
    });
    setNewRowData(initialData);
    setShowInsertDialog(true);
  };

  const insertNewRow = async () => {
    setInsertingRow(true);

    try {
      // Parse values appropriately
      const parsedData: Record<string, unknown> = {};
      
      Object.entries(newRowData).forEach(([key, value]) => {
        if (value === '' || value === 'null') {
          parsedData[key] = null;
        } else if (value === 'true') {
          parsedData[key] = true;
        } else if (value === 'false') {
          parsedData[key] = false;
        } else if (value.startsWith('{') || value.startsWith('[')) {
          try {
            parsedData[key] = JSON.parse(value);
          } catch {
            parsedData[key] = value;
          }
        } else if (!isNaN(Number(value)) && value.trim() !== '') {
          // Keep as string unless it looks like a number field
          parsedData[key] = value;
        } else {
          parsedData[key] = value;
        }
      });

      const { error } = await supabase
        .from(selectedTable as any)
        .insert(parsedData as any);

      if (error) throw error;

      // Log the action
      await logAction('insert_row', {
        table: selectedTable,
        data: parsedData,
      });

      toast({
        title: 'Inserido!',
        description: 'Novo registro adicionado com sucesso.',
      });

      setShowInsertDialog(false);
      setNewRowData({});
      await loadTableData();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao inserir',
        description: error.message,
      });
    } finally {
      setInsertingRow(false);
    }
  };

  const filteredRows = tableData?.rows.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(val => 
      formatCellValue(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];

  const totalPages = tableData ? Math.ceil(tableData.count / pageSize) : 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse" className="gap-2">
            <TableIcon className="h-4 w-4" />
            Explorar Tabelas
          </TabsTrigger>
          <TabsTrigger value="query" className="gap-2">
            <Play className="h-4 w-4" />
            Executar Query
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Explorador de Tabelas
                  </CardTitle>
                  <CardDescription>
                    Visualize e exporte dados de qualquer tabela do banco.
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={loadTableData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToCsv} disabled={!tableData?.rows.length}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button size="sm" onClick={openInsertDialog} disabled={!tableData}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Registro
                  </Button>
                  {selectedRows.size > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setShowBulkDeleteDialog(true)}
                      disabled={deletingBulk}
                    >
                      {deletingBulk ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Deletar ({selectedRows.size})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Select value={selectedTable} onValueChange={(v) => { setSelectedTable(v as TableName); setPage(0); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma tabela" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {AVAILABLE_TABLES.map(table => (
                        <SelectItem key={table} value={table}>
                          {table}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar nos dados..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {tableData && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {tableData.count} registro(s) • Mostrando {filteredRows.length} de {tableData.rows.length}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Edit className="h-3 w-3" />
                    Clique duplo para editar uma célula
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tableData && tableData.rows.length > 0 ? (
                <>
                  <ScrollArea className="h-[500px] border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap bg-muted/50 sticky top-0 w-[100px]">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedRows.size === filteredRows.length && filteredRows.length > 0}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 rounded border-border"
                                title="Selecionar todos"
                              />
                              <span className="text-xs">Ações</span>
                            </div>
                          </TableHead>
                          {tableData.columns.map((col) => (
                            <TableHead key={col} className="whitespace-nowrap bg-muted/50 sticky top-0">
                              {col}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.map((row, rowIndex) => {
                          const rowId = String(row['id']);
                          const isSelected = selectedRows.has(rowId);
                          
                          return (
                            <TableRow key={rowIndex} className={`hover:bg-muted/30 ${isSelected ? 'bg-primary/5' : ''}`}>
                              {/* Actions column */}
                              <TableCell className="w-[100px]">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleRowSelection(rowId)}
                                    className="h-4 w-4 rounded border-border"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => confirmDeleteRow(row['id'])}
                                    disabled={deletingRowId === row['id']}
                                    title="Deletar registro"
                                  >
                                    {deletingRowId === row['id'] ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            {tableData.columns.map((col) => {
                              const cellId = `${rowIndex}-${col}`;
                              const value = row[col];
                              const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.column === col;
                              const isIdColumn = col === 'id';
                              
                              return (
                                <TableCell 
                                  key={col} 
                                  className={`max-w-[200px] transition-colors ${
                                    isEditing 
                                      ? 'p-0' 
                                      : isIdColumn 
                                        ? 'cursor-pointer hover:bg-muted/50' 
                                        : 'cursor-pointer hover:bg-primary/10'
                                  }`}
                                  onClick={() => !isEditing && copyCell(value, cellId)}
                                  onDoubleClick={() => !isIdColumn && startEditing(rowIndex, col, value, row)}
                                  title={isIdColumn ? 'Clique para copiar' : 'Clique duplo para editar'}
                                >
                                  {isEditing ? (
                                    <div className="flex items-center gap-1 p-1">
                                      <Input
                                        value={editingCell.currentValue}
                                        onChange={(e) => setEditingCell({
                                          ...editingCell,
                                          currentValue: e.target.value,
                                        })}
                                        onKeyDown={handleEditKeyDown}
                                        className="h-7 text-xs min-w-[100px]"
                                        autoFocus
                                        disabled={savingCell}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 flex-shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          saveEditing();
                                        }}
                                        disabled={savingCell}
                                      >
                                        {savingCell ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Check className="h-3 w-3 text-green-500" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 flex-shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          cancelEditing();
                                        }}
                                        disabled={savingCell}
                                      >
                                        <X className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 truncate">
                                      <span className="truncate">
                                        {formatCellValue(value)}
                                      </span>
                                      {copiedCell === cellId && (
                                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  {/* Pagination */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Página {page + 1} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum dado encontrado nesta tabela.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Console SQL
              </CardTitle>
              <CardDescription>
                Execute queries SELECT, INSERT, UPDATE e DELETE diretamente no banco.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Cuidado</AlertTitle>
                <AlertDescription>
                  Queries UPDATE e DELETE modificam dados permanentemente. Use com cautela.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Textarea
                  placeholder="SELECT * FROM profiles LIMIT 10"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="font-mono min-h-[120px]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {detectQueryType(sqlQuery).toUpperCase()}
                    </Badge>
                    {detectQueryType(sqlQuery) !== 'select' && (
                      <Badge variant="destructive">Operação Destrutiva</Badge>
                    )}
                  </div>
                  <Button 
                    onClick={() => executeQuery(sqlQuery)}
                    disabled={queryLoading || !sqlQuery.trim()}
                  >
                    {queryLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Executar
                  </Button>
                </div>
              </div>

              {/* Query Examples */}
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <p className="text-sm font-medium">Exemplos rápidos:</p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSqlQuery("SELECT * FROM profiles LIMIT 20")}
                  >
                    <Search className="h-3 w-3 mr-1" /> Listar Perfis
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSqlQuery("SELECT * FROM user_roles WHERE role = 'admin'")}
                  >
                    <Search className="h-3 w-3 mr-1" /> Listar Admins
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSqlQuery("SELECT * FROM discipleship_relationships WHERE status = 'active'")}
                  >
                    <Search className="h-3 w-3 mr-1" /> Discipulados Ativos
                  </Button>
                </div>
              </div>

              {queryError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription className="font-mono text-sm">
                    {queryError}
                  </AlertDescription>
                </Alert>
              )}

              {queryResult && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {queryResult.length} resultado(s)
                  </div>
                  <ScrollArea className="h-[400px] border rounded-lg">
                    {queryResult.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {Object.keys(queryResult[0]).map((col) => (
                              <TableHead key={col} className="whitespace-nowrap bg-muted/50 sticky top-0">
                                {col}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {queryResult.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {Object.entries(row).map(([col, value]) => (
                                <TableCell 
                                  key={col} 
                                  className="max-w-[200px] truncate"
                                  title={formatCellValue(value)}
                                >
                                  {formatCellValue(value)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Query executada com sucesso. Nenhum resultado retornado.
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog for destructive operations */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar operação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a executar uma operação <strong>{queryType.toUpperCase()}</strong> que modificará dados no banco de dados. 
              Esta ação não pode ser desfeita facilmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted p-3 rounded-lg">
            <code className="text-sm break-all">{pendingQuery}</code>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                runQuery(pendingQuery);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Executar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for row deletion */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir permanentemente este registro da tabela <strong>{selectedTable}</strong>. 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted p-3 rounded-lg">
            <code className="text-sm break-all">ID: {String(pendingDeleteRowId)}</code>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteRowId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteRow}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for bulk deletion */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Confirmar exclusão em lote
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir permanentemente <strong>{selectedRows.size} registro(s)</strong> da tabela <strong>{selectedTable}</strong>. 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBulkRows}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir {selectedRows.size} registro(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for inserting new row */}
      <Dialog open={showInsertDialog} onOpenChange={setShowInsertDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Novo Registro - {selectedTable}
            </DialogTitle>
            <DialogDescription>
              Preencha os campos para inserir um novo registro. Campos vazios serão definidos como null.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {Object.entries(newRowData).map(([column, value]) => (
                <div key={column} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={column} className="text-right text-sm font-medium truncate" title={column}>
                    {column}
                  </Label>
                  <Input
                    id={column}
                    value={value}
                    onChange={(e) => setNewRowData(prev => ({
                      ...prev,
                      [column]: e.target.value,
                    }))}
                    className="col-span-3"
                    placeholder={`Valor para ${column}`}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInsertDialog(false)} disabled={insertingRow}>
              Cancelar
            </Button>
            <Button onClick={insertNewRow} disabled={insertingRow}>
              {insertingRow ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Inserir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
