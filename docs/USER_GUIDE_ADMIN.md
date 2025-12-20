# Guia do Administrador - Metanoia Hub

## Visão Geral 🔧

Como administrador da igreja, você tem acesso total à gestão do Metanoia Hub para sua congregação. Este guia cobre todas as funcionalidades administrativas.

---

## Acesso ao Painel Admin

### Como Acessar
1. Faça login normalmente
2. No menu lateral, clique em **Admin**
3. Você verá o painel administrativo completo

### Estrutura do Painel
O painel admin possui várias abas:

| Aba | Função |
|-----|--------|
| **Dashboard** | Visão geral e métricas |
| **Usuários** | Gestão de membros |
| **Trilhas** | Gerenciar trilhas de estudo |
| **Cursos** | Gerenciar cursos |
| **Aulas** | Gerenciar lições |
| **Plano de Leitura** | Planos bíblicos |
| **Hábitos** | Hábitos diários |
| **Discipulado** | Relacionamentos |
| **Recursos** | Biblioteca de materiais |
| **Relatórios** | Análises e métricas |

---

## Gestão de Usuários

### Visualizando Usuários
1. Acesse **Admin > Usuários**
2. Veja a lista completa de membros
3. Use a busca para encontrar usuários específicos
4. Filtre por role (discípulo, discipulador, admin)

### Criando Novo Usuário
1. Clique em **Criar Usuário**
2. Preencha os dados:
   - Nome completo
   - Email
   - Senha temporária
   - Roles (pode selecionar múltiplos)
3. Clique em **Salvar**
4. O usuário receberá email de boas-vindas

### Importação em Massa
1. Clique em **Importar Usuários**
2. Baixe o modelo de planilha
3. Preencha com os dados dos usuários
4. Faça upload do arquivo
5. Revise e confirme a importação

### Editando Usuário
1. Clique no usuário na lista
2. Modifique os dados necessários
3. Altere roles se necessário
4. Salve as alterações

### Roles Disponíveis
| Role | Permissões |
|------|------------|
| **discipulo** | Acesso básico, estudar, completar lições |
| **discipulador** | Discípulo + acompanhar discípulos |
| **admin** | Acesso ao painel administrativo da igreja |
| **church_admin** | Admin com poderes especiais de igreja |

---

## Gestão de Trilhas

### Criando Nova Trilha
1. Acesse **Admin > Trilhas**
2. Clique em **Nova Trilha**
3. Preencha:
   - Título
   - Descrição
   - Imagem de capa
   - Público alvo (quais roles podem acessar)
   - Ordem de exibição
   - Se é trilha base (obrigatória)
4. Salve a trilha

### Trilha Base
- A **trilha base** é obrigatória para todos os discípulos
- Apenas uma trilha deve ser marcada como base
- Discípulos devem completá-la antes de outras

### Ordenando Trilhas
- Arraste e solte para reordenar
- A ordem afeta a exibição para os usuários

---

## Gestão de Cursos

### Criando Curso
1. Acesse **Admin > Cursos**
2. Clique em **Novo Curso**
3. Selecione a **trilha** onde o curso será incluído
4. Preencha título e descrição
5. Defina a ordem dentro da trilha
6. Adicione imagem de capa
7. Salve

### Associando a Trilha
- Todo curso deve pertencer a uma trilha
- Um curso só aparece em uma trilha

---

## Gestão de Aulas

### Tipos de Aula
| Tipo | Descrição |
|------|-----------|
| **Vídeo** | Aula em formato de vídeo |
| **Texto** | Conteúdo escrito/artigo |
| **Quiz** | Perguntas e respostas |

### Criando Aula de Vídeo
1. Acesse **Admin > Aulas**
2. Clique em **Nova Aula**
3. Selecione tipo **Vídeo**
4. Preencha:
   - Título
   - Descrição
   - URL do vídeo (YouTube, Vimeo, etc.)
   - Duração em minutos
   - Curso associado
5. Salve

### Criando Aula de Texto
1. Selecione tipo **Texto**
2. Use o editor rico para formatar o conteúdo
3. Adicione imagens, links e formatação
4. Salve

### Ordem das Aulas
- Defina a ordem dentro do curso
- Aulas aparecem sequencialmente para o usuário

---

## Planos de Leitura

### Criando Plano de Leitura
1. Acesse **Admin > Plano de Leitura**
2. Clique em **Novo Plano**
3. Defina:
   - Nome do plano
   - Descrição
   - Duração (anual, semestral, customizado)
   - Data de início
4. Adicione os dias de leitura

### Gerenciando Dias
1. Clique em **Gerenciar Dias**
2. Para cada dia, defina:
   - Número do dia
   - Passagem bíblica
   - Reflexão (opcional)
3. Salve as alterações

---

## Hábitos Diários

### Criando Hábito
1. Acesse **Admin > Hábitos**
2. Clique em **Novo Hábito**
3. Preencha:
   - Nome do hábito
   - Descrição
   - Ícone
   - XP concedido ao completar
4. Ative ou desative conforme necessário

### Hábitos Padrão
Hábitos comuns incluem:
- Oração matinal
- Leitura bíblica
- Devocional
- Jejum
- Evangelismo

---

## Gestão de Discipulado

### Visualizando Relacionamentos
1. Acesse **Admin > Discipulado**
2. Veja todos os relacionamentos ativos
3. Filtre por discipulador

### Atribuindo Discípulo
1. Clique em **Novo Relacionamento**
2. Selecione o **discípulo**
3. Selecione o **discipulador**
4. Confirme a atribuição

### Transferindo Discípulo
1. Encontre o relacionamento na lista
2. Clique em **Transferir**
3. Selecione o novo discipulador
4. Confirme a transferência
5. O histórico é preservado

### Limite de Discípulos
- Configure o limite máximo por discipulador
- Clique em **Configurações** (ícone de engrenagem)
- Defina o número máximo
- O sistema impedirá atribuições acima do limite

### Histórico
- Veja todo o histórico de atribuições e transferências
- Clique em **Ver Histórico** para detalhes

---

## Recursos e Biblioteca

### Adicionando Recurso
1. Acesse **Admin > Recursos**
2. Clique em **Novo Recurso**
3. Preencha:
   - Título
   - Descrição
   - Categoria
   - Arquivo (PDF, DOC, etc.)
   - Público alvo
4. Faça upload do arquivo
5. Salve

### Categorias de Recursos
- Estudos bíblicos
- Devocionais
- Materiais de apoio
- Apresentações
- Apostilas

---

## Relatórios

### Relatórios Disponíveis
| Relatório | Descrição |
|-----------|-----------|
| **Visão Geral** | Métricas gerais da igreja |
| **Cursos e Trilhas** | Progresso nos conteúdos |
| **Discipulado** | Performance dos discipuladores |
| **Performance** | Ranking e engajamento |
| **Compliance** | Adesão a checklists |

### Filtros
- **Período**: Últimos 7 dias, 30 dias, 90 dias, ano
- **Discipulador**: Filtrar por discipulador específico
- **Curso/Trilha**: Filtrar por conteúdo

### Exportando Dados
- Use o botão **Exportar** para baixar em CSV/Excel
- Útil para análises externas

---

## Configurações da Igreja

### Acessando Configurações
1. Clique no ícone de **Configurações** no painel
2. Modifique as opções disponíveis

### Opções Configuráveis
- **Limite de discípulos** por discipulador
- **Habilitar/desabilitar** funcionalidades
- **Logo** da igreja
- **Cores** personalizadas
- **Configurações de IA**

---

## Configurações de IA

### Mentor IA
1. Acesse **Admin > Config. IA**
2. Defina:
   - Prompt do sistema
   - Tom das respostas
   - Tópicos permitidos/bloqueados
3. Salve

### Personalização
O mentor IA pode ser configurado para:
- Responder de forma mais formal ou informal
- Focar em temas específicos
- Usar linguagem da denominação

---

## Boas Práticas

### Gestão de Usuários
- ✅ Mantenha dados atualizados
- ✅ Remova usuários inativos periodicamente
- ✅ Atribua roles corretas
- ✅ Use importação para grandes volumes

### Conteúdo
- ✅ Organize trilhas de forma lógica
- ✅ Mantenha aulas curtas e objetivas
- ✅ Use vídeos de boa qualidade
- ✅ Atualize conteúdos periodicamente

### Discipulado
- ✅ Distribua discípulos equilibradamente
- ✅ Monitore discipuladores sobrecarregados
- ✅ Acompanhe taxas de inatividade
- ✅ Faça reuniões periódicas com discipuladores

---

## Resolução de Problemas

### Usuário não Consegue Acessar
1. Verifique se o email está correto
2. Verifique se a role está atribuída
3. Resete a senha se necessário

### Conteúdo não Aparece para Usuário
1. Verifique o **público alvo** da trilha/curso
2. Confirme que a role do usuário está incluída
3. Verifique se está ativo

### Discipulador no Limite
1. Transfira alguns discípulos
2. Ou aumente o limite nas configurações

---

## Suporte

### Problemas Técnicos
- Contate o suporte Lovable
- Documente o problema com prints

### Dúvidas de Uso
- Consulte este guia
- Contate o administrador principal

---

*"Apascentai o rebanho de Deus que está entre vós, tendo cuidado dele..."* - 1 Pedro 5:2

**Obrigado por liderar com excelência!** 🙏
