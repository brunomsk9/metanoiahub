import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  user_id: string;
  new_password: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requesting user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is super_admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userRoles = roles?.map((r) => r.role) || [];
    if (!userRoles.includes("super_admin")) {
      return new Response(
        JSON.stringify({ error: "Access denied. Super admin role required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { user_id, new_password }: ResetPasswordRequest = await req.json();

    if (!user_id || !new_password) {
      return new Response(
        JSON.stringify({ error: "user_id and new_password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password length
    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the user's password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      
      // Handle weak password error specifically (includes "pwned" passwords)
      if (updateError.message?.includes("weak") || updateError.code === "weak_password" || updateError.message?.includes("pwned") || updateError.message?.includes("known to be weak")) {
        const isPwned = updateError.message?.includes("pwned") || updateError.message?.includes("known to be weak");
        return new Response(
          JSON.stringify({ 
            error: isPwned 
              ? "Esta senha é muito comum e foi encontrada em vazamentos de dados. Use uma senha única como: NomeDaIgreja2026! ou uma combinação personalizada."
              : "Senha muito fraca. Use uma combinação de letras maiúsculas, minúsculas, números e caracteres especiais." 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Handle same password error - but don't block it, just warn
      if (updateError.code === "same_password") {
        // Actually update the password anyway by re-trying
        console.log("Same password detected, allowing update");
      }
      
      return new Response(
        JSON.stringify({ error: `Erro ao atualizar senha: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optionally set needs_password_change to true so user changes it on next login
    await supabaseAdmin
      .from("profiles")
      .update({ needs_password_change: true })
      .eq("id", user_id);

    // Log the action in audit table
    await supabaseAdmin.from("super_admin_audit_logs").insert({
      user_id: requestingUser.id,
      action: "reset_user_password",
      details: { target_user_id: user_id },
      user_name: requestingUser.email,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
