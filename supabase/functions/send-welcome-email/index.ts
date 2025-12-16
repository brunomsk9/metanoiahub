import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  users: Array<{
    email: string;
    nome: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { users }: WelcomeEmailRequest = await req.json();

    if (!users || !Array.isArray(users) || users.length === 0) {
      throw new Error("Lista de usuários inválida");
    }

    console.log(`Sending welcome emails to ${users.length} users`);

    const results = await Promise.all(
      users.map(async (user) => {
        try {
          const emailResponse = await resend.emails.send({
            from: "Metanoia Hub <onboarding@resend.dev>",
            to: [user.email],
            subject: "Bem-vindo ao Metanoia Hub!",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0b;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <div style="background: linear-gradient(135deg, #1a1a1d 0%, #0a0a0b 100%); border-radius: 16px; padding: 40px; border: 1px solid #2a2a2d;">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <h1 style="color: #4fd1c5; margin: 0; font-size: 28px; font-weight: 600;">Metanoia Hub</h1>
                    </div>
                    
                    <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 24px;">Olá, ${user.nome}!</h2>
                    
                    <p style="color: #a0aec0; line-height: 1.6; margin: 0 0 24px 0;">
                      Sua conta no <strong style="color: #4fd1c5;">Metanoia Hub</strong> foi criada com sucesso. 
                      Você agora faz parte de uma comunidade dedicada ao discipulado e crescimento espiritual.
                    </p>
                    
                    <div style="background-color: #1a1a1d; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #2a2a2d;">
                      <h3 style="color: #ffffff; margin: 0 0 16px 0; font-size: 16px;">📋 Instruções de Acesso</h3>
                      <ul style="color: #a0aec0; margin: 0; padding-left: 20px; line-height: 2;">
                        <li><strong style="color: #ffffff;">Email:</strong> ${user.email}</li>
                        <li><strong style="color: #ffffff;">Senha inicial:</strong> mudar123</li>
                      </ul>
                      <p style="color: #f6ad55; font-size: 14px; margin: 16px 0 0 0;">
                        ⚠️ Por segurança, você será solicitado a alterar sua senha no primeiro acesso.
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="https://metanoia-hub.lovable.app/auth" 
                         style="display: inline-block; background: linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%); color: #0a0a0b; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Acessar Plataforma
                      </a>
                    </div>
                    
                    <p style="color: #718096; font-size: 14px; margin: 24px 0 0 0; text-align: center; border-top: 1px solid #2a2a2d; padding-top: 24px;">
                      Se você não solicitou esta conta, por favor ignore este email.
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          console.log(`Email sent to ${user.email}:`, emailResponse);
          return { email: user.email, success: true };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to send email to ${user.email}:`, error);
          return { email: user.email, success: false, error: errorMessage };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Email sending completed: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        results,
        summary: {
          total: users.length,
          sent: successCount,
          failed: failCount
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
