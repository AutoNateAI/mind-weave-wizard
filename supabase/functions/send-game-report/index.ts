import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GameReportRequest {
  name: string;
  email: string;
  gameTitle: string;
  analytics: {
    timeSpent: number;
    correctConnections: number;
    incorrectConnections: number;
    hintsUsed: number;
    completionScore: number;
    accuracyRate: number;
    efficiency: number;
    strategyScore: number;
    overallPerformance: number;
    performanceLevel: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, gameTitle, analytics }: GameReportRequest = await req.json();
    
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };

    const getPerformanceColor = (score: number) => {
      if (score >= 85) return "#10B981"; // green
      if (score >= 70) return "#3B82F6"; // blue  
      if (score >= 55) return "#F59E0B"; // yellow
      return "#EF4444"; // red
    };

    const getRecommendations = (analytics: any) => {
      const recommendations = [];
      
      if (analytics.accuracyRate < 70) {
        recommendations.push("Focus on understanding system relationships and dependencies");
      }
      if (analytics.hintsUsed > 1) {
        recommendations.push("Practice pattern recognition to build confidence in decision-making");
      }
      if (analytics.efficiency < 60) {
        recommendations.push("Work on identifying key connections faster through systematic analysis");
      }
      if (analytics.strategyScore < 70) {
        recommendations.push("Develop time management and strategic thinking skills");
      }
      
      return recommendations;
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Your AI Engineering Mind Game Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
            .content { padding: 30px; }
            .score-card { background: #f8fafc; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
            .metric { display: inline-block; margin: 0 15px; text-align: center; }
            .metric-value { font-size: 24px; font-weight: bold; color: ${getPerformanceColor(analytics.overallPerformance)}; }
            .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
            .insights { background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .recommendation { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; }
            .cta { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 25px; text-align: center; margin: 30px 0; }
            .cta-button { background: white; color: #667eea; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧠 Your AI Engineering Mind Game Report</h1>
              <p>Comprehensive analysis of your critical thinking performance</p>
            </div>
            
            <div class="content">
              <h2>Hi ${name}! 👋</h2>
              <p>Congratulations on completing the <strong>${gameTitle}</strong>! Here's your detailed performance analysis:</p>
              
              <div class="score-card">
                <h3>Overall Performance: ${analytics.performanceLevel} Level</h3>
                <div style="margin: 20px 0;">
                  <div class="metric">
                    <div class="metric-value">${Math.round(analytics.overallPerformance)}%</div>
                    <div class="metric-label">Overall Score</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">${formatTime(analytics.timeSpent)}</div>
                    <div class="metric-label">Time Spent</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">${analytics.correctConnections}</div>
                    <div class="metric-label">Correct Connections</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value">${analytics.hintsUsed}/3</div>
                    <div class="metric-label">Hints Used</div>
                  </div>
                </div>
              </div>

              <div class="insights">
                <h3>🎯 Critical Thinking Breakdown</h3>
                <p><strong>Accuracy:</strong> ${Math.round(analytics.accuracyRate)}% - Your decision-making precision</p>
                <p><strong>Efficiency:</strong> ${Math.round(analytics.efficiency)}% - How effectively you used your interactions</p>
                <p><strong>Strategy:</strong> ${Math.round(analytics.strategyScore)}% - Your approach to problem-solving</p>
              </div>

              ${getRecommendations(analytics).map(rec => 
                `<div class="recommendation">💡 <strong>Recommendation:</strong> ${rec}</div>`
              ).join('')}

              <div class="cta">
                <h3 style="color: white; margin-top: 0;">Ready to Master AI Engineering Critical Thinking?</h3>
                <p style="color: rgba(255,255,255,0.9);">Join AutoNate's complete course with 10 sessions, 30 interactive games, and personalized AI coaching.</p>
                <a href="https://autonateai.com/auth" class="cta-button">Start Your Free Trial →</a>
              </div>

              <p style="color: #64748b; font-size: 14px;">
                This report was generated from your performance on AutoNate's AI Engineering Mind Games. 
                <a href="https://autonateai.com/mind-games" style="color: #667eea;">Try more challenges</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "AutoNate AI <reports@autonateai.com>",
      to: [email],
      subject: `🧠 Your ${gameTitle} Performance Report - ${analytics.performanceLevel} Level!`,
      html: emailHtml,
    });

    console.log("Game report email sent successfully:", emailResponse);
    
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      throw new Error(`Email sending failed: ${emailResponse.error}`);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-game-report function:", error);
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