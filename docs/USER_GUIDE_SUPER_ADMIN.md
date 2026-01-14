# Guia do Super Administrador - Metanoia Hub

## Acesso Total ao Sistema 👑

Como Super Admin, você tem controle completo sobre todas as igrejas e funcionalidades do Metanoia Hub.

---

## Acesso ao Painel Super Admin

### Como Acessar
1. Faça login com suas credenciais de super admin
2. No menu lateral, clique em **Super Admin**
3. Você verá o painel com visão de todas as igrejas

---

## Gestão de Igrejas

### Visualizando Igrejas
1. No painel Super Admin, veja a lista de igrejas
2. Cada card mostra:
   - Nome da igreja
   - Número de membros
   - Status (ativa/inativa)
   - Data de criação
   - Configurações atuais

### Criando Nova Igreja
1. Clique em **Nova Igreja**
2. Preencha:
   - Nome da igreja
   - Slug (URL amigável)
   - Logo
   - Cores (primária e secundária)
   - Configurações iniciais
3. Salve a igreja
4. Crie o primeiro usuário admin da igreja

### Editando Igreja
1. Clique na igreja
2. Modifique:
   - Nome e slug
   - Logo
   - Cores do tema
   - Configurações (JSON)
   - Status
3. Salve as alterações

### Desativando Igreja
1. Clique em **Desativar**
2. Confirme a ação
3. Usuários da igreja perderão acesso
4. Dados são preservados para reativação futura

---

## Gestão Global de Usuários

### Visão de Todos os Usuários
- Acesse todos os usuários de todas as igrejas
- Filtre por:
  - Igreja
  - Role
  - Status
  - Data de criação
- Pesquise por nome ou email

### Ações Disponíveis
| Ação | Descrição |
|------|-----------|
| **Resetar senha** | Define senha padrão |
| **Transferir igreja** | Move usuário entre igrejas |
| **Atribuir super_admin** | Concede acesso total |
| **Desativar conta** | Bloqueia acesso |

### Criando Super Admin
1. Encontre o usuário
2. Clique em **Editar Roles**
3. Adicione a role **super_admin**
4. Salve

⚠️ **Cuidado**: Super admins têm acesso total ao sistema!

---

## Conexão com Banco de Dados

### Painel de Conexão
1. Acesse **Super Admin > Banco de Dados**
2. Veja as opções de conexão:
   - String de conexão admin
   - String de conexão read-only
   - Pooler (para muitas conexões)

### Segurança
- Credenciais são ocultadas por padrão
- Requer verificação de senha para revelar
- Todas as visualizações são registradas no audit log

### Tipos de Conexão
| Tipo | Uso |
|------|-----|
| **Admin (direct)** | Operações administrativas |
| **Admin (pooler)** | Conexões simultâneas |
| **Read-only (direct)** | Consultas apenas |
| **Read-only (pooler)** | Relatórios |

---

## Conteúdo Global

### Trilhas Globais
Você pode criar trilhas disponíveis para todas as igrejas:
1. Crie uma trilha sem church_id
2. Ela aparecerá em todas as igrejas
3. Igrejas não podem editar, apenas usar

### Recursos Compartilhados
- Crie recursos acessíveis por todas as igrejas
- Útil para materiais padrão da rede
- Mantenha consistência doutrinária

---

## Relatórios Consolidados

### Métricas Globais
| Métrica | Descrição |
|---------|-----------|
| **Total de Igrejas** | Igrejas ativas e inativas |
| **Total de Usuários** | Usuários em todas as igrejas |
| **Lições Completadas** | Total global de conclusões |
| **Engajamento Médio** | Taxa de atividade geral |

### Comparativo entre Igrejas
- Ranking de igrejas por engajamento
- Crescimento mês a mês
- Taxas de conclusão de trilhas
- Média de discípulos por discipulador

### Exportação
- Exporte relatórios consolidados
- Formatos: CSV, PDF
- Útil para relatórios de rede

---

## Audit Log

### O que é Registrado
- Todas as ações de super admin
- Acessos a dados sensíveis
- Modificações em igrejas
- Alterações de roles

### Visualizando Logs
1. Acesse **Super Admin > Audit Log**
2. Filtre por:
   - Data/período
   - Tipo de ação
   - Usuário que executou
   - Igreja afetada

### Informações do Log
| Campo | Descrição |
|-------|-----------|
| **Ação** | Tipo de operação |
| **Usuário** | Quem executou |
| **Data/Hora** | Timestamp preciso |
| **IP** | Endereço de origem |
| **Detalhes** | JSON com informações |

---

## Configurações Globais

### Limites Padrão
- Discípulos por discipulador (padrão: 15)
- Tamanho máximo de upload
- Configurações de IA

### Configurações de IA
1. Acesse **Super Admin > Config. IA**
2. Defina:
   - Prompt global do mentor
   - Limites de uso por igreja
   - Modelos permitidos

### Funcionalidades
- Habilite/desabilite módulos globalmente
- Defina funcionalidades experimentais
- Configure integrações

---

## Operações Avançadas

### Transferência de Dados
1. Selecione usuários
2. Escolha igreja de destino
3. Confirme transferência
4. Histórico é preservado

### Backup e Restauração
- Backups são automáticos
- Acesse histórico de backups
- Solicite restauração se necessário

### Limpeza de Dados
- Remova dados antigos
- Arquive igrejas inativas
- Limpe logs antigos (>1 ano)

---

## Segurança

### Boas Práticas
- ✅ Limite o número de super admins
- ✅ Use senhas fortes e únicas
- ✅ Revise audit logs semanalmente
- ✅ Documente alterações importantes
- ✅ Faça logout ao terminar

### Monitoramento
- Verifique acessos suspeitos
- Monitore tentativas de login falhas
- Revise alterações de roles

---

## Checklist de Manutenção

### Diário
- [ ] Verificar alertas do sistema
- [ ] Monitorar performance
- [ ] Responder tickets urgentes

### Semanal
- [ ] Revisar novas igrejas/usuários
- [ ] Verificar relatórios de engajamento
- [ ] Analisar audit logs
- [ ] Responder solicitações de suporte

### Mensal
- [ ] Analisar métricas consolidadas
- [ ] Revisar configurações de segurança
- [ ] Planejar melhorias
- [ ] Atualizar documentação

### Trimestral
- [ ] Revisão completa de acessos
- [ ] Limpeza de dados desnecessários
- [ ] Avaliação de funcionalidades
- [ ] Treinamento de novos admins

---

## Emergências

### Problemas Críticos
1. **Identifique** o escopo do problema
2. **Isole** se necessário (desativar igreja/funcionalidade)
3. **Investigue** a causa raiz
4. **Corrija** o problema
5. **Documente** e comunique

### Prioridades
| Nível | Resposta |
|-------|----------|
| **Crítico** | Imediato (sistema fora do ar) |
| **Alto** | 4 horas (funcionalidade crítica) |
| **Médio** | 24 horas (funcionalidade secundária) |
| **Baixo** | 1 semana (melhorias) |

### Comunicação
- Notifique admins de igreja afetados
- Atualize status se necessário
- Documente resolução

---

## Suporte Técnico

### Recursos
- Documentação técnica
- Logs do sistema
- Métricas de performance
- Histórico de mudanças

### Contatos
- Suporte Lovable (plataforma)
- Supabase (banco de dados)
- Documentação técnica do projeto

---

*"A quem muito foi dado, muito será exigido"* - Lucas 12:48

**Use seu acesso com sabedoria e responsabilidade!** 🙏
