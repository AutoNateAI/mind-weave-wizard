import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sessionNumber, 
      lectureNumber, 
      lectureContent, 
      templateId,
      gameType = 'critical-thinking'
    } = await req.json();

    console.log('Generating game for:', { sessionNumber, lectureNumber, gameType });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the template
    const { data: template, error: templateError } = await supabase
      .from('game_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    // Generate game content with AI
    const prompt = `
Based on this lecture content and template, create an engaging game scenario:

Lecture Content: ${lectureContent}
Template: ${template.name} - ${template.description}
Content Slots: ${JSON.stringify(template.content_slots)}

Generate realistic, thought-provoking content for each slot. Make it:
1. Relevant to the lecture material
2. Challenging but solvable
3. Realistic scenario-based
4. Engaging for students

Return ONLY a JSON object with keys matching the slot names and values being the generated content.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert educational game designer. Generate engaging, realistic scenarios for learning games.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await response.json();
    let generatedContentText = aiData.choices[0].message.content;
    
    // Remove markdown code block formatting if present
    generatedContentText = generatedContentText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    
    const generatedContent = JSON.parse(generatedContentText);

    // Replace placeholders in template data
    let gameData = JSON.parse(JSON.stringify(template.template_data));
    
    // Replace placeholders in nodes
    gameData.nodes = gameData.nodes.map((node: any) => {
      let label = node.data.label;
      Object.entries(generatedContent).forEach(([key, value]) => {
        label = label.replace(`{{${key}}}`, value as string);
      });
      return {
        ...node,
        data: { ...node.data, label }
      };
    });

    // Generate instructions and hints
    const instructionsPrompt = `
Based on this game scenario, create:
1. Clear, engaging instructions (2-3 sentences)
2. 3 helpful hints that guide thinking without giving away answers

Game Type: ${template.name}
Scenario: ${JSON.stringify(generatedContent)}

Return JSON with "instructions" and "hints" arrays.
`;

    const instructionsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Generate clear, helpful game instructions and hints.' },
          { role: 'user', content: instructionsPrompt }
        ],
        temperature: 0.6,
      }),
    });

    const instructionsData = await instructionsResponse.json();
    let instructionsText = instructionsData.choices[0].message.content;
    
    // Remove markdown code block formatting if present
    instructionsText = instructionsText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    
    const gameInstructions = JSON.parse(instructionsText);

    return new Response(JSON.stringify({
      gameData,
      generatedContent,
      instructions: gameInstructions.instructions,
      hints: gameInstructions.hints,
      templateName: template.name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-game-generator:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate game',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});