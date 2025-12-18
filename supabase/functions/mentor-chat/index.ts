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

const BASE_SYSTEM_PROMPT = `Você é o Mentor IA do S.O.S. do Discipulador, um assistente cristão especializado em discipulado e mentoria espiritual no METANOIA HUB.

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

async function fetchSOSResources() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch S.O.S. resources
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('titulo, descricao, tags')
      .eq('categoria', 'sos')
      .limit(50);
    
    if (resourcesError) {
      console.error('Error fetching resources:', resourcesError);
      return null;
    }

    // Fetch courses for discipuladores with their lessons
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('titulo, lessons(titulo)')
      .contains('publico_alvo', ['discipulador'])
      .limit(10);

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
    }

    // Flatten lessons with course info
    const relevantLessons: Array<{ titulo: string; courseName: string }> = [];
    courses?.forEach((course: any) => {
      course.lessons?.forEach((lesson: any) => {
        relevantLessons.push({
          titulo: lesson.titulo,
          courseName: course.titulo
        });
      });
    });

    return { resources, lessons: relevantLessons };
  } catch (error) {
    console.error('Error in fetchSOSResources:', error);
    return null;
  }
}

function buildSystemPrompt(sosData: { resources: any[], lessons: Array<{ titulo: string; courseName: string }> } | null) {
  let prompt = BASE_SYSTEM_PROMPT;

  if (sosData) {
    prompt += `\n\n## Recursos S.O.S. Disponíveis na Plataforma\n`;
    prompt += `Use estes recursos para recomendar materiais específicos ao discipulador:\n\n`;

    if (sosData.resources && sosData.resources.length > 0) {
      prompt += `### Materiais S.O.S.\n`;
      sosData.resources.forEach(resource => {
        const tags = resource.tags?.length > 0 ? ` [Tags: ${resource.tags.join(', ')}]` : '';
        prompt += `- **${resource.titulo}**${tags}\n`;
        if (resource.descricao) {
          prompt += `  ${resource.descricao.substring(0, 100)}${resource.descricao.length > 100 ? '...' : ''}\n`;
        }
      });
    }

    if (sosData.lessons && sosData.lessons.length > 0) {
      prompt += `\n### Aulas para Discipuladores\n`;
      sosData.lessons.slice(0, 15).forEach(lesson => {
        prompt += `- **${lesson.titulo}** (Curso: ${lesson.courseName})\n`;
      });
    }

    prompt += `\nQuando recomendar um recurso, mencione-o pelo nome exato para que o discipulador possa encontrá-lo na página S.O.S.`;
  }

  return prompt;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não está configurada');
    }

    const { messages } = await req.json();
    
    console.log('Received messages:', messages.length);

    // Fetch S.O.S. resources for context
    const sosData = await fetchSOSResources();
    const systemPrompt = buildSystemPrompt(sosData);
    
    console.log('System prompt built with', sosData?.resources?.length || 0, 'resources and', sosData?.lessons?.length || 0, 'lessons');

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
