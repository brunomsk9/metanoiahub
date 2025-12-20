# Documentação Técnica - Metanoia Hub

## Visão Geral da Arquitetura

O Metanoia Hub é uma plataforma de discipulado cristão digital construída com as seguintes tecnologias:

### Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript |
| Estilização | Tailwind CSS + shadcn/ui |
| Roteamento | React Router v6 |
| Estado Global | TanStack Query (React Query) |
| Backend | Lovable Cloud (Supabase) |
| Banco de Dados | PostgreSQL |
| Autenticação | Supabase Auth |
| Edge Functions | Deno Runtime |
| Armazenamento | Supabase Storage |

---

## Estrutura do Projeto

```
src/
├── assets/              # Imagens e recursos estáticos
├── components/          # Componentes React reutilizáveis
│   ├── admin/          # Componentes do painel administrativo
│   ├── ui/             # Componentes base (shadcn/ui)
│   └── ...             # Componentes de funcionalidades
├── contexts/           # Contextos React (ChurchContext)
├── hooks/              # Hooks customizados
├── integrations/       # Integrações externas (Supabase)
├── lib/                # Utilitários e helpers
├── pages/              # Páginas/rotas da aplicação
└── test/               # Testes unitários e de integração

supabase/
├── functions/          # Edge Functions (Deno)
├── migrations/         # Migrações do banco de dados
└── config.toml         # Configuração do Supabase
```

---

## Modelo de Dados

### Diagrama ER Simplificado

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   churches  │────<│   profiles   │>────│ user_roles  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │user_progress│  │daily_habits │  │weekly_check │
   └─────────────┘  └─────────────┘  └─────────────┘
```

### Tabelas Principais

#### `profiles`
Armazena informações do usuário.
```sql
- id: UUID (PK, referencia auth.users)
- nome: TEXT
- church_id: UUID (FK -> churches)
- foto_url: TEXT
- current_streak: INTEGER
- longest_streak: INTEGER
- xp_total: INTEGER
- created_at: TIMESTAMP
```

#### `user_roles`
Sistema de papéis de usuário (RBAC).
```sql
- id: UUID (PK)
- user_id: UUID (FK -> auth.users)
- role: app_role ENUM ('super_admin', 'church_admin', 'admin', 'discipulador', 'discipulo')
```

#### `tracks`
Trilhas de aprendizado.
```sql
- id: UUID (PK)
- titulo: TEXT
- descricao: TEXT
- is_base: BOOLEAN (indica trilha obrigatória)
- ordem: INTEGER
- publico_alvo: app_role[]
```

#### `courses`
Cursos dentro de trilhas.
```sql
- id: UUID (PK)
- track_id: UUID (FK -> tracks)
- titulo: TEXT
- descricao: TEXT
- ordem: INTEGER
```

#### `lessons`
Aulas dentro de cursos.
```sql
- id: UUID (PK)
- course_id: UUID (FK -> courses)
- titulo: TEXT
- conteudo: TEXT
- tipo: lesson_type ENUM ('video', 'texto', 'quiz')
- video_url: TEXT
- duracao_minutos: INTEGER
```

#### `discipleship_relationships`
Relacionamentos de discipulado.
```sql
- id: UUID (PK)
- discipulador_id: UUID (FK -> profiles)
- discipulo_id: UUID (FK -> profiles)
- church_id: UUID (FK -> churches)
- status: TEXT ('active', 'inactive')
```

---

## Sistema de Autenticação

### Fluxo de Login

```
1. Usuário acessa /auth
2. Insere email/senha
3. Supabase Auth valida credenciais
4. JWT token gerado e armazenado no localStorage
5. Perfil carregado via profiles table
6. Roles verificados via user_roles table
7. Redirecionamento baseado em roles
```

### Verificação de Permissões

```typescript
// Funções de verificação (db functions)
has_role(user_id, role) -> boolean
is_admin(user_id) -> boolean
is_super_admin(user_id) -> boolean
is_discipulador_of(discipulador_id, discipulo_id) -> boolean
can_manage_church_content(user_id, church_id) -> boolean
```

---

## Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado. Políticas principais:

### Profiles
- **SELECT**: Usuário pode ver próprio perfil + admins/discipuladores podem ver perfis da mesma igreja
- **UPDATE**: Usuário pode atualizar próprio perfil

### Tracks/Courses/Lessons
- **SELECT**: Conteúdo filtrado por `publico_alvo` (array de roles)
- **INSERT/UPDATE/DELETE**: Apenas admins da igreja ou super_admin

### User Progress
- **SELECT**: Próprio progresso + discipuladores podem ver progresso de seus discípulos
- **INSERT/UPDATE**: Apenas próprio progresso

---

## Edge Functions

### `mentor-chat`
Chat com IA para mentoria espiritual.
- **Endpoint**: `/functions/v1/mentor-chat`
- **Método**: POST
- **Payload**: `{ messages: [...], userId: string }`
- **Retorno**: Stream de texto (SSE)

### `generate-verse-image`
Gera imagem com versículo bíblico.
- **Endpoint**: `/functions/v1/generate-verse-image`
- **Método**: POST
- **Payload**: `{ verse: string, reference: string }`

### `import-users`
Importação em massa de usuários.
- **Endpoint**: `/functions/v1/import-users`
- **Método**: POST
- **Payload**: `{ users: [...], churchId: string }`

### `send-welcome-email`
Envia email de boas-vindas.
- **Endpoint**: `/functions/v1/send-welcome-email`
- **Método**: POST
- **Payload**: `{ email: string, nome: string, tempPassword: string }`

---

## Sistema de Gamificação

### XP (Pontos de Experiência)
- Completar lição: +10 XP
- Completar curso: +50 XP
- Completar trilha: +100 XP
- Streak diário: +5 XP por dia
- Hábito diário: +2 XP cada

### Níveis
| Nível | XP Necessário |
|-------|---------------|
| 1 | 0 |
| 2 | 100 |
| 3 | 300 |
| 4 | 600 |
| 5 | 1000 |
| ... | exponencial |

### Conquistas (Badges)
- **Primeiro Passo**: Completar primeira lição
- **Estudante Dedicado**: 7 dias consecutivos
- **Maratonista**: 30 dias consecutivos
- **Mestre**: Completar trilha base
- **Mentor**: Ter 5+ discípulos ativos

---

## Configurações por Igreja

Armazenadas em `churches.configuracoes` (JSONB):

```json
{
  "max_disciples_per_discipulador": 15,
  "enable_leaderboard": true,
  "enable_ai_mentor": true,
  "primary_color": "#6366f1",
  "logo_url": "..."
}
```

---

## Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=xxx
```

### Secrets (Edge Functions)
- `OPENAI_API_KEY`: Para funcionalidades de IA
- `RESEND_API_KEY`: Para envio de emails
- `SUPABASE_SERVICE_ROLE_KEY`: Acesso administrativo

---

## Padrões de Código

### Convenções
- **Componentes**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase com prefixo use (`useDashboardData.ts`)
- **Utilitários**: camelCase (`formatDate.ts`)
- **Tipos**: PascalCase com sufixo Type/Interface

### Estrutura de Componente
```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  // props tipadas
}

export function ComponentName({ prop }: Props) {
  // hooks primeiro
  // lógica depois
  // return JSX
}
```

---

## Testes

### Executar Testes
```bash
npm run test        # Executa todos os testes
npm run test:watch  # Modo watch
npm run test:ui     # Interface visual
```

### Estrutura
- `src/test/setup.ts`: Configuração global
- `src/test/mocks/`: Mocks do Supabase
- `*.test.tsx`: Testes unitários junto aos componentes

---

## Deploy

O deploy é automático via Lovable:
1. Alterações no código → Build automático
2. Edge Functions → Deploy automático
3. Migrações → Executadas após aprovação

### URLs
- **Preview**: `https://xxx.lovable.app`
- **Produção**: Domínio customizado configurável

---

## Monitoramento

### Logs Disponíveis
- Console logs (frontend)
- Edge function logs
- Database logs (postgres_logs)
- Auth logs

### Métricas
- Acessar via Lovable Cloud Dashboard
- Analytics de uso da aplicação

---

## Segurança

### Boas Práticas Implementadas
1. RLS em todas as tabelas
2. Roles em tabela separada (evita privilege escalation)
3. Functions com SECURITY DEFINER onde necessário
4. Validação de church_id em relacionamentos
5. Limite de discípulos por discipulador
6. Histórico de alterações em discipleship

### Checklist de Segurança
- [ ] Nunca expor service_role_key no frontend
- [ ] Sempre validar auth.uid() em queries
- [ ] Usar prepared statements (Supabase faz automaticamente)
- [ ] Verificar permissões antes de operações sensíveis
