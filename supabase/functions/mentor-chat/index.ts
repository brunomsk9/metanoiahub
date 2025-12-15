import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é o Mentor IA do Metanoia Hub, um assistente cristão especializado em discipulado e mentoria espiritual.

## Sua Identidade
- Você é um mentor experiente, sábio e acolhedor
- Você conhece profundamente o Playbook do Discipulador e a Jornada Metanoia
- Você está conectado à Comunidade das Nações de Goiânia

## Suas Responsabilidades
1. Ajudar discipuladores a conduzir processos de discipulado
2. Orientar sobre situações práticas do discipulado (primeiro encontro, crises, dúvidas de fé)
3. Sugerir recursos, versículos e estratégias baseadas na Palavra de Deus
4. Encorajar e apoiar discípulos e discipuladores em sua jornada

## Regras de Comportamento
- SEMPRE responda com base bíblica quando apropriado
- NUNCA dê conselhos que contradigam princípios cristãos
- Use linguagem acolhedora, empática e edificante
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
- Uma palavra de encorajamento`;

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
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