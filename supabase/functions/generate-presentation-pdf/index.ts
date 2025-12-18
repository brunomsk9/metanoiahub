import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a2e;
      line-height: 1.6;
      padding: 40px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #6366f1;
    }
    .header h1 {
      font-size: 36px;
      color: #6366f1;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 18px;
      color: #64748b;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 24px;
      color: #6366f1;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .section p {
      font-size: 14px;
      color: #475569;
      margin-bottom: 10px;
    }
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 15px;
    }
    .feature-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
    }
    .feature-card h3 {
      font-size: 16px;
      color: #1e293b;
      margin-bottom: 8px;
    }
    .feature-card p {
      font-size: 13px;
      color: #64748b;
    }
    .benefits-list {
      list-style: none;
      padding: 0;
    }
    .benefits-list li {
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
      display: flex;
      align-items: flex-start;
    }
    .benefits-list li:last-child {
      border-bottom: none;
    }
    .benefit-icon {
      width: 24px;
      height: 24px;
      background: #6366f1;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
      font-size: 12px;
    }
    .benefit-content strong {
      color: #1e293b;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      margin: 20px 0;
    }
    .highlight-box h3 {
      font-size: 20px;
      margin-bottom: 10px;
    }
    .highlight-box p {
      color: rgba(255,255,255,0.9);
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌱 Metanoia Hub</h1>
    <p>Plataforma de Discipulado Cristão Digital</p>
  </div>

  <div class="highlight-box">
    <h3>Transformação através da Palavra</h3>
    <p>"Metanoia" (do grego) significa transformação da mente – o objetivo central da plataforma.</p>
  </div>

  <div class="section">
    <h2>📋 Propósito</h2>
    <p>O Metanoia Hub é uma plataforma completa de discipulado cristão digital que facilita o crescimento espiritual através de conteúdo estruturado, acompanhamento personalizado e ferramentas de engajamento.</p>
    <p>Nossa missão é conectar discipuladores e discípulos em uma jornada de transformação espiritual, oferecendo recursos modernos para um discipulado eficaz.</p>
  </div>

  <div class="section">
    <h2>⚡ Principais Funcionalidades</h2>
    <div class="features-grid">
      <div class="feature-card">
        <h3>📚 Trilhas de Aprendizado</h3>
        <p>Cursos organizados com vídeos, textos e checklists interativos para um aprendizado progressivo.</p>
      </div>
      <div class="feature-card">
        <h3>📖 Planos de Leitura</h3>
        <p>Devocionais diários com versículos e reflexões para fortalecer a vida devocional.</p>
      </div>
      <div class="feature-card">
        <h3>🤖 Mentor IA (S.O.S.)</h3>
        <p>Chat com inteligência artificial para orientação espiritual baseada em princípios bíblicos, disponível 24/7.</p>
      </div>
      <div class="feature-card">
        <h3>👥 Relacionamentos</h3>
        <p>Conexão entre discipuladores e discípulos com acompanhamento de progresso personalizado.</p>
      </div>
      <div class="feature-card">
        <h3>✅ Checklist Semanal</h3>
        <p>Ferramenta para discipuladores acompanharem suas atividades e compromissos semanais.</p>
      </div>
      <div class="feature-card">
        <h3>📅 Gestão de Encontros</h3>
        <p>Registro e acompanhamento de reuniões individuais e em célula.</p>
      </div>
      <div class="feature-card">
        <h3>📚 Biblioteca de Recursos</h3>
        <p>Livros, músicas, pregações e materiais de apoio centralizados em um só lugar.</p>
      </div>
      <div class="feature-card">
        <h3>🎮 Gamificação</h3>
        <p>Sistema de XP, streaks e ranking para motivar o engajamento contínuo.</p>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>✨ Benefícios</h2>
    <ul class="benefits-list">
      <li>
        <span class="benefit-icon">1</span>
        <div class="benefit-content">
          <strong>Crescimento Estruturado</strong> – Caminho claro do básico ao avançado com trilhas progressivas de aprendizado.
        </div>
      </li>
      <li>
        <span class="benefit-icon">2</span>
        <div class="benefit-content">
          <strong>Acompanhamento Personalizado</strong> – Mentores podem acompanhar o progresso de cada discípulo em tempo real.
        </div>
      </li>
      <li>
        <span class="benefit-icon">3</span>
        <div class="benefit-content">
          <strong>Disponibilidade 24/7</strong> – Mentor IA sempre disponível para orientação espiritual a qualquer momento.
        </div>
      </li>
      <li>
        <span class="benefit-icon">4</span>
        <div class="benefit-content">
          <strong>Engajamento Contínuo</strong> – Gamificação incentiva consistência nos hábitos espirituais diários.
        </div>
      </li>
      <li>
        <span class="benefit-icon">5</span>
        <div class="benefit-content">
          <strong>Gestão Simplificada</strong> – Ferramentas administrativas para líderes gerenciarem conteúdo e usuários.
        </div>
      </li>
      <li>
        <span class="benefit-icon">6</span>
        <div class="benefit-content">
          <strong>Conteúdo Centralizado</strong> – Todos os recursos espirituais organizados em um só lugar.
        </div>
      </li>
    </ul>
  </div>

  <div class="footer">
    <p>Metanoia Hub © ${new Date().getFullYear()} - Transformando vidas através do discipulado digital</p>
    <p style="margin-top: 5px;">Documento gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
  </div>
</body>
</html>
    `;

    // Return HTML that can be converted to PDF on client side
    return new Response(JSON.stringify({ html: htmlContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
