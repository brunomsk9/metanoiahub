import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserImport {
  email: string;
  nome: string;
  role: string;
}

interface ImportResult {
  email: string;
  success: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify requesting user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (!roles || roles.length === 0) {
      throw new Error('User is not an admin');
    }

    const { users } = await req.json() as { users: UserImport[] };
    
    if (!users || !Array.isArray(users)) {
      throw new Error('Invalid users data');
    }

    console.log(`Starting import of ${users.length} users`);

    const results: ImportResult[] = [];

    for (const userData of users) {
      try {
        // Validate required fields
        if (!userData.email || !userData.nome) {
          results.push({
            email: userData.email || 'unknown',
            success: false,
            error: 'Email e nome são obrigatórios'
          });
          continue;
        }

        // Generate random password
        const randomPassword = crypto.randomUUID().slice(0, 16) + 'Aa1!';

        // Create user in auth
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: randomPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            nome: userData.nome
          }
        });

        if (createError) {
          console.error(`Error creating user ${userData.email}:`, createError);
          results.push({
            email: userData.email,
            success: false,
            error: createError.message
          });
          continue;
        }

        const userId = authData.user.id;

        // Update profile with nome
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ nome: userData.nome })
          .eq('id', userId);

        if (profileError) {
          console.error(`Error updating profile for ${userData.email}:`, profileError);
        }

        // Add role if specified and valid
        const validRoles = ['discipulo', 'discipulador', 'admin'];
        const role = userData.role?.toLowerCase().trim();
        
        if (role && validRoles.includes(role)) {
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: userId,
              role: role
            });

          if (roleError) {
            console.error(`Error adding role for ${userData.email}:`, roleError);
          }
        }

        console.log(`Successfully imported user: ${userData.email}`);
        results.push({
          email: userData.email,
          success: true
        });

      } catch (userError) {
        console.error(`Unexpected error for ${userData.email}:`, userError);
        results.push({
          email: userData.email,
          success: false,
          error: userError instanceof Error ? userError.message : 'Erro desconhecido'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Import completed: ${successCount} success, ${failCount} failed`);

    return new Response(JSON.stringify({ 
      results,
      summary: {
        total: users.length,
        success: successCount,
        failed: failCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-users function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao importar usuários' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
