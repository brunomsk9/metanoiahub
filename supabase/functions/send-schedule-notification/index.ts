import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduleNotificationRequest {
  volunteerEmail: string;
  volunteerName: string;
  serviceName: string;
  serviceDate: string;
  positionName: string;
  ministryName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      volunteerEmail, 
      volunteerName, 
      serviceName, 
      serviceDate, 
      positionName, 
      ministryName 
    }: ScheduleNotificationRequest = await req.json();

    if (!volunteerEmail || !volunteerName || !serviceName || !serviceDate) {
      throw new Error("Dados obrigatórios não informados");
    }

    console.log(`Sending schedule notification to ${volunteerEmail} for ${serviceName}`);

    const formattedDate = new Date(serviceDate).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailResponse = await resend.emails.send({
      from: "Metanoia Hub <onboarding@resend.dev>",
      to: [volunteerEmail],
      subject: `Você foi escalado para: ${serviceName}`,
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
              
              <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 24px;">Olá, ${volunteerName}!</h2>
              
              <p style="color: #a0aec0; line-height: 1.6; margin: 0 0 24px 0;">
                Você foi escalado para servir em um culto/evento. Confira os detalhes abaixo:
              </p>
              
              <div style="background-color: #1a1a1d; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #2a2a2d;">
                <h3 style="color: #4fd1c5; margin: 0 0 20px 0; font-size: 18px;">📋 Detalhes da Escala</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #718096; padding: 8px 0; font-size: 14px;">Evento:</td>
                    <td style="color: #ffffff; padding: 8px 0; font-size: 14px; font-weight: 600;">${serviceName}</td>
                  </tr>
                  <tr>
                    <td style="color: #718096; padding: 8px 0; font-size: 14px;">Data/Hora:</td>
                    <td style="color: #ffffff; padding: 8px 0; font-size: 14px; font-weight: 600;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #718096; padding: 8px 0; font-size: 14px;">Ministério:</td>
                    <td style="color: #ffffff; padding: 8px 0; font-size: 14px; font-weight: 600;">${ministryName}</td>
                  </tr>
                  <tr>
                    <td style="color: #718096; padding: 8px 0; font-size: 14px;">Posição:</td>
                    <td style="color: #ffffff; padding: 8px 0; font-size: 14px; font-weight: 600;">${positionName}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #f6ad55; font-size: 14px; margin: 16px 0;">
                ⚠️ Por favor, confirme sua participação acessando a plataforma.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://metanoia-hub.lovable.app/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%); color: #0a0a0b; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Acessar Plataforma
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin: 24px 0 0 0; text-align: center; border-top: 1px solid #2a2a2d; padding-top: 24px;">
                Se você tiver algum impedimento, por favor comunique seu líder o mais rápido possível.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`Email sent to ${volunteerEmail}:`, emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-schedule-notification function:", error);
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
