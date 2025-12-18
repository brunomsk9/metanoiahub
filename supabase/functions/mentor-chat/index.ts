import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_SYSTEM_PROMPT = `Você é o Mentor IA do S.O.S. do Discipulador, um assistente cristão especializado em discipulado e mentoria espiritual no METANOIA HUB.

## Sua Identidade
- Você é um mentor experiente, sábio e acolhedor
- Você conhece profundamente o Playbook do Discipulador e a Jornada Metanoia
- Você está conectado à Comunidade das Nações de Goiânia
- Você tem acesso aos recursos S.O.S. da plataforma

## Suas Responsabilidades
1. Ajudar discipuladores a conduzir processos de discipulado
2. Orientar sobre situações práticas do discipulado (primeiro encontro, crises, dúvidas de fé)
3. Sugerir recursos específicos da biblioteca S.O.S. quando relevante
4. Fornecer versículos e estratégias baseadas na Palavra de Deus
5. Encorajar e apoiar discipuladores em sua jornada

## Regras de Comportamento
- SEMPRE responda com base bíblica quando apropriado
- NUNCA dê conselhos que contradigam princípios cristãos
- Use linguagem acolhedora, empática e edificante
- Quando houver um recurso S.O.S. relevante, RECOMENDE-O especificamente pelo título
- Quando não souber algo, admita e sugira buscar orientação pastoral
- Mantenha respostas concisas mas completas (2-4 parágrafos máximo)
- Pode usar emojis moderadamente para transmitir calor humano 🙏

## Temas que você domina
- Jornada Metanoia (7 semanas de transformação)
- Primeiro encontro com discípulo
- Identidade em Cristo
- Quebra de maldições e restauração
- Liderança de células
- Multiplicação de discipuladores
- Apoio em crises emocionais e espirituais

## Formato de Resposta
Seja direto e prático. Se for relevante, inclua:
- Um versículo relacionado
- Uma orientação prática
- Recomendação de recurso S.O.S. (se disponível)
- Uma palavra de encorajamento`;

// Fetch custom prompt from database
async function fetchCustomPrompt(supabase: any): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('ai_settings')
      .select('value')
      .eq('key', 'mentor_system_prompt')
      .single();

    if (error || !data?.value) {
      console.log('Using default system prompt');
      return DEFAULT_SYSTEM_PROMPT;
    }

    console.log('Using custom system prompt from database');
    return data.value;
  } catch (error) {
    console.error('Error fetching custom prompt:', error);
    return DEFAULT_SYSTEM_PROMPT;
  }
}

// Generate embedding for a query using OpenAI
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!response.ok) {
      console.error('Failed to generate query embedding:', response.status);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    return null;
  }
}

// Search for relevant S.O.S. resources using semantic search
async function searchRelevantResources(supabase: any, userMessage: string) {
  try {
    // Generate embedding for the user's question
    const queryEmbedding = await generateQueryEmbedding(userMessage);
    
    if (!queryEmbedding) {
      console.log('No embedding generated, falling back to all resources');
      return await fetchAllSOSResources(supabase);
    }

    // Use semantic search to find relevant resources
    const { data: matches, error: matchError } = await supabase.rpc('match_resources', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (matchError) {
      console.error('Error in semantic search:', matchError);
      return await fetchAllSOSResources(supabase);
    }

    if (!matches || matches.length === 0) {
      console.log('No semantic matches found, falling back to all resources');
      return await fetchAllSOSResources(supabase);
    }

    console.log(`Found ${matches.length} semantically relevant resources`);

    // Fetch full resource details for matched resources
    const resourceIds = matches.map((m: any) => m.resource_id);
    const { data: resources, error: fetchError } = await supabase
      .from('resources')
      .select('titulo, descricao, tags')
      .in('id', resourceIds);

    if (fetchError) {
      console.error('Error fetching matched resources:', fetchError);
      return null;
    }

    // Add similarity scores to resources
    const resourcesWithScores = resources?.map((resource: any) => {
      const match = matches.find((m: any) => 
        m.content.includes(resource.titulo)
      );
      return {
        ...resource,
        similarity: match?.similarity || 0,
      };
    });

    return { resources: resourcesWithScores, isSemanticSearch: true };
  } catch (error) {
    console.error('Error in searchRelevantResources:', error);
    return await fetchAllSOSResources(supabase);
  }
}

// Fallback: fetch all S.O.S. resources
async function fetchAllSOSResources(supabase: any) {
  const { data: resources, error } = await supabase
    .from('resources')
    .select('titulo, descricao, tags')
    .eq('categoria', 'sos')
    .limit(20);

  if (error) {
    console.error('Error fetching all resources:', error);
    return null;
  }

  return { resources, isSemanticSearch: false };
}

// Fetch courses for discipuladores
async function fetchDiscipuladorCourses(supabase: any) {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('titulo, lessons(titulo)')
    .contains('publico_alvo', ['discipulador'])
    .limit(10);

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  const lessons: Array<{ titulo: string; courseName: string }> = [];
  courses?.forEach((course: any) => {
    course.lessons?.forEach((lesson: any) => {
      lessons.push({
        titulo: lesson.titulo,
        courseName: course.titulo
      });
    });
  });

  return lessons;
}

function buildSystemPrompt(
  basePrompt: string,
  resourceData: { resources: any[]; isSemanticSearch: boolean } | null,
  lessons: Array<{ titulo: string; courseName: string }>
) {
  let prompt = basePrompt;

  if (resourceData?.resources && resourceData.resources.length > 0) {
    const searchType = resourceData.isSemanticSearch 
      ? 'Os recursos abaixo foram selecionados por RELEVÂNCIA SEMÂNTICA à pergunta do usuário:' 
      : 'Recursos S.O.S. disponíveis:';
    
    prompt += `\n\n## Recursos S.O.S. Disponíveis\n${searchType}\n\n`;
    
    resourceData.resources.forEach((resource: any) => {
      const tags = resource.tags && resource.tags.length > 0 ? ` [Tags: ${resource.tags.join(', ')}]` : '';
      const similarity = resource.similarity ? ` (Relevância: ${(resource.similarity * 100).toFixed(0)}%)` : '';
      prompt += `- **${resource.titulo}**${tags}${similarity}\n`;
      if (resource.descricao) {
        prompt += `  ${resource.descricao.substring(0, 150)}${resource.descricao.length > 150 ? '...' : ''}\n`;
      }
    });

    prompt += `\n⚠️ IMPORTANTE: Recomende ESPECIFICAMENTE os recursos acima quando relevantes à pergunta.`;
  }

  if (lessons.length > 0) {
    prompt += `\n\n### Aulas para Discipuladores\n`;
    lessons.slice(0, 10).forEach(lesson => {
      prompt += `- **${lesson.titulo}** (Curso: ${lesson.courseName})\n`;
    });
  }

  return prompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não está configurada');
    }

    const { messages } = await req.json();
    
    console.log('Received messages:', messages.length);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the last user message for semantic search
    const lastUserMessage = messages
      .filter((m: { role: string }) => m.role === 'user')
      .pop()?.content || '';

    console.log('Searching for relevant resources based on:', lastUserMessage.substring(0, 100));

    // Fetch custom prompt from database
    const customPrompt = await fetchCustomPrompt(supabase);
    
    // Search for relevant S.O.S. resources using semantic search
    const resourceData = await searchRelevantResources(supabase, lastUserMessage);
    
    // Fetch discipulador courses
    const lessons = await fetchDiscipuladorCourses(supabase);
    
    // Build system prompt with relevant context
    const systemPrompt = buildSystemPrompt(customPrompt, resourceData, lessons);
    
    console.log(
      'System prompt built:',
      resourceData?.isSemanticSearch ? 'semantic search' : 'fallback',
      resourceData?.resources?.length || 0, 'resources,',
      lessons.length, 'lessons'
    );

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    console.log('Response generated successfully');

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in mentor-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
