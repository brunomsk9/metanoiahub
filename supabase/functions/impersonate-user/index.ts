import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Verify requesting user is super_admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.error("Invalid token:", authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is super_admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id);

    const userRoles = roles?.map(r => r.role) || [];
    const isSuperAdmin = userRoles.includes('super_admin');

    if (!isSuperAdmin) {
      console.error("User is not super_admin:", requestingUser.id);
      return new Response(
        JSON.stringify({ error: 'Apenas super admins podem usar esta funcionalidade' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { target_user_id } = await req.json();

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: 'ID do usuário alvo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent impersonating yourself
    if (target_user_id === requestingUser.id) {
      return new Response(
        JSON.stringify({ error: 'Você não pode impersonar a si mesmo' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get target user info
    const { data: targetUserData, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(target_user_id);
    
    if (targetUserError || !targetUserData.user) {
      console.error("Error getting target user:", targetUserError);
      return new Response(
        JSON.stringify({ error: 'Usuário alvo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magic link for the target user (this creates a valid session)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUserData.user.email!,
      options: {
        redirectTo: `${supabaseUrl.replace('.supabase.co', '.supabase.co')}/auth/v1/callback`,
      }
    });

    if (linkError) {
      console.error("Error generating link:", linkError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar sessão para o usuário' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the token from the link properties
    const tokenHash = linkData.properties?.hashed_token;
    const actionLink = linkData.properties?.action_link;

    // Log the impersonation action
    const { error: logError } = await supabaseAdmin
      .from('super_admin_audit_logs')
      .insert({
        user_id: requestingUser.id,
        action: 'impersonate_user',
        details: {
          target_user_id: target_user_id,
          target_user_email: targetUserData.user.email,
          timestamp: new Date().toISOString(),
        },
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

    if (logError) {
      console.error("Error logging impersonation:", logError);
      // Don't fail the request, just log the error
    }

    // Get target user profile for display
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('nome')
      .eq('id', target_user_id)
      .single();

    console.log(`Super admin ${requestingUser.email} impersonating user ${targetUserData.user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        action_link: actionLink,
        target_user: {
          id: target_user_id,
          email: targetUserData.user.email,
          nome: targetProfile?.nome || 'Usuário',
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('Error in impersonate-user function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
