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
  genero?: string;
  is_transferido?: boolean;
  is_novo_convertido?: boolean;
  is_batizado?: boolean;
  batizou_na_igreja?: boolean;
  data_batismo?: string;
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

    // Check if user is admin or super_admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRoles = roles?.map(r => r.role) || [];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');

    if (!isAdmin) {
      throw new Error('User is not an admin');
    }

    const { users, church_id } = await req.json() as { users: UserImport[]; church_id: string };
    
    if (!users || !Array.isArray(users)) {
      throw new Error('Invalid users data');
    }

    if (!church_id) {
      throw new Error('church_id is required');
    }

    // Validate church exists
    const { data: churchData, error: churchError } = await supabaseAdmin
      .from('churches')
      .select('id, nome')
      .eq('id', church_id)
      .single();

    if (churchError || !churchData) {
      throw new Error('Invalid church_id');
    }

    // For non-super_admin, verify they belong to the church
    const isSuperAdmin = userRoles.includes('super_admin');
    if (!isSuperAdmin) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('church_id')
        .eq('id', user.id)
        .single();

      if (profile?.church_id !== church_id) {
        throw new Error('You can only import users to your own church');
      }
    }

    console.log(`Starting import of ${users.length} users to church: ${churchData.nome} (${church_id})`);

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

        // Default password for imported users
        const defaultPassword = 'mudar123';

        // Create user in auth with church_id in metadata
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: defaultPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            nome: userData.nome,
            church_id: church_id
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

        // Validate genero if provided
        const validGeneros = ['masculino', 'feminino'];
        const genero = userData.genero?.toLowerCase().trim();
        const validGenero = genero && validGeneros.includes(genero) ? genero : null;

        // Update profile with nome, church_id, genero, spiritual status, set needs_password_change flag and mark onboarding as completed
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            nome: userData.nome, 
            needs_password_change: true,
            church_id: church_id,
            onboarding_completed: true,
            genero: validGenero,
            is_transferido: userData.is_transferido || false,
            is_novo_convertido: userData.is_novo_convertido || false,
            is_batizado: userData.is_batizado || false,
            batizou_na_igreja: userData.batizou_na_igreja || false,
            data_batismo: userData.batizou_na_igreja && userData.data_batismo ? userData.data_batismo : null
          })
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

        console.log(`Successfully imported user: ${userData.email} to church ${churchData.nome}`);
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
        failed: failCount,
        church: churchData.nome
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
