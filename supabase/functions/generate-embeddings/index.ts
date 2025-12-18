import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all S.O.S. resources
    const { data: resources, error: fetchError } = await supabase
      .from('resources')
      .select('id, titulo, descricao, tags, autor')
      .eq('categoria', 'sos');

    if (fetchError) {
      throw new Error(`Failed to fetch resources: ${fetchError.message}`);
    }

    console.log(`Found ${resources?.length || 0} S.O.S. resources to process`);

    if (!resources || resources.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No S.O.S. resources found', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    const errors: string[] = [];

    for (const resource of resources) {
      try {
        // Create content string for embedding
        const content = [
          `Título: ${resource.titulo}`,
          resource.descricao ? `Descrição: ${resource.descricao}` : '',
          resource.autor ? `Autor: ${resource.autor}` : '',
          resource.tags?.length ? `Tags: ${resource.tags.join(', ')}` : '',
        ].filter(Boolean).join('\n');

        // Generate embedding using OpenAI
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: content,
          }),
        });

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          throw new Error(`OpenAI API error: ${errorText}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Upsert embedding into database
        const { error: upsertError } = await supabase
          .from('resource_embeddings')
          .upsert({
            resource_id: resource.id,
            content: content,
            embedding: embedding,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'resource_id',
          });

        if (upsertError) {
          throw new Error(`Failed to upsert embedding: ${upsertError.message}`);
        }

        processed++;
        console.log(`Processed resource: ${resource.titulo}`);
      } catch (resourceError) {
        const errorMsg = `Error processing ${resource.titulo}: ${resourceError instanceof Error ? resourceError.message : 'Unknown error'}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Embeddings generated successfully',
        processed,
        total: resources.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-embeddings function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
