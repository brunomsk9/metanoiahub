import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface User {
  id: string;
  nome: string;
}

interface SearchableUserSelectProps {
  users: User[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  excludeIds?: string[];
  disabled?: boolean;
}

export function SearchableUserSelect({
  users,
  value,
  onValueChange,
  placeholder = "Selecione um líder...",
  excludeIds = [],
  disabled = false,
}: SearchableUserSelectProps) {
  const [open, setOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter(user => !excludeIds.includes(user.id));
  }, [users, excludeIds]);

  const selectedUser = users.find(user => user.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedUser ? (
            <span className="truncate">{selectedUser.nome}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nome..." />
          <CommandList>
            <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onValueChange("");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="text-muted-foreground">Nenhum</span>
              </CommandItem>
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.nome}
                  onSelect={() => {
                    onValueChange(user.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {user.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
