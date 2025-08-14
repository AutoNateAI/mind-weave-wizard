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
      gameType = 'critical-thinking',
      mode = 'single', // 'single' or 'batch'
      allTemplates = null
    } = await req.json();

    console.log('Generating game for:', { sessionNumber, lectureNumber, gameType, mode });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (mode === 'batch') {
      return await generateGameSuite(supabase, openAIApiKey, {
        sessionNumber,
        lectureNumber,
        lectureContent,
        allTemplates
      });
    } else {
      return await generateSingleGame(supabase, openAIApiKey, {
        sessionNumber,
        lectureNumber,
        lectureContent,
        templateId
      });
    }

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

async function generateSingleGame(supabase: any, openAIApiKey: string, params: any) {
  const { sessionNumber, lectureNumber, lectureContent, templateId } = params;

  // Get the template
  const { data: template, error: templateError } = await supabase
    .from('game_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    throw new Error('Template not found');
  }

  const heuristicContext = template.heuristic_targets ? 
    `Focus on enhancing these cognitive heuristics: ${template.heuristic_targets.join(', ')}` : '';

  // Generate game content with AI
  const prompt = `
Based on this lecture content and template, create an engaging game scenario that enhances critical thinking:

Lecture Content: ${lectureContent}
Template: ${template.name} - ${template.description}
${heuristicContext}
Content Slots: ${JSON.stringify(template.content_slots)}

Generate realistic, thought-provoking content for each slot. Make it:
1. Relevant to the lecture material
2. Challenging but solvable with the target heuristics
3. Realistic scenario-based that requires the specific thinking skills
4. Engaging for students learning critical thinking

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
          content: 'You are an expert educational game designer specializing in critical thinking heuristic development. Generate engaging, realistic scenarios that specifically target cognitive skills enhancement.' 
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

  // Generate heuristic-specific instructions and hints
  const instructionsPrompt = `
Based on this game scenario for critical thinking development, create:
1. Clear, engaging instructions that explain how to enhance the target heuristics (2-3 sentences)
2. 3 helpful hints that guide cognitive application without giving away answers

Game Type: ${template.name}
Target Heuristics: ${template.heuristic_targets?.join(', ') || 'General critical thinking'}
Scenario: ${JSON.stringify(generatedContent)}
Validation Requirements: ${JSON.stringify(template.validation_rules)}

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
        { role: 'system', content: 'Generate clear, helpful game instructions and hints that focus on cognitive heuristic development.' },
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
    templateName: template.name,
    heuristicTargets: template.heuristic_targets,
    validationRules: template.validation_rules,
    winConditions: template.win_conditions
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateGameSuite(supabase: any, openAIApiKey: string, params: any) {
  const { sessionNumber, lectureNumber, lectureContent, allTemplates } = params;

  // Get all game templates
  const { data: templates, error: templateError } = await supabase
    .from('game_templates')
    .select('*')
    .order('name');

  if (templateError || !templates) {
    throw new Error('Templates not found');
  }

  const orchestratedPrompt = `
Create a comprehensive game suite for Session ${sessionNumber}, Lecture ${lectureNumber} that develops critical thinking through three different approaches.

Lecture Content: ${lectureContent}

Generate content for ALL THREE game types that complement each other:

1. CRITICAL DECISION PATH - Enhances Sequential Reasoning & Consequence Evaluation
   Content Slots: ${JSON.stringify(templates.find(t => t.name === 'Critical Decision Path')?.content_slots)}

2. PROBLEM ANALYSIS WEB - Enhances Systematic Decomposition & Root Cause Analysis  
   Content Slots: ${JSON.stringify(templates.find(t => t.name === 'Problem Analysis Web')?.content_slots)}

3. SYSTEM MAPPING - Enhances Holistic Thinking & Relationship Recognition
   Content Slots: ${JSON.stringify(templates.find(t => t.name === 'System Mapping')?.content_slots)}

Create ONE cohesive scenario that can be adapted for all three games, ensuring:
- Each game targets different cognitive heuristics
- Content progresses in logical complexity
- All three games relate to the same core concept from the lecture
- Games complement rather than duplicate each other

Return JSON with THREE objects: "critical_decision_path", "problem_analysis_web", and "system_mapping", each containing content for their respective slots.
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
          content: 'You are an expert in orchestrated educational game design. Create coordinated game suites that systematically develop different critical thinking heuristics through complementary experiences.' 
        },
        { role: 'user', content: orchestratedPrompt }
      ],
      temperature: 0.7,
    }),
  });

  const aiData = await response.json();
  let orchestratedContentText = aiData.choices[0].message.content;
  
  // Remove markdown code block formatting if present
  orchestratedContentText = orchestratedContentText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  
  const orchestratedContent = JSON.parse(orchestratedContentText);

  // Generate instructions for the complete suite
  const suiteInstructionsPrompt = `
Create instructions and hints for a complete game suite designed to enhance critical thinking heuristics:

Suite Content: ${JSON.stringify(orchestratedContent)}

Generate:
1. Suite overview instructions explaining the cognitive development journey
2. Individual instructions for each game type
3. Hints for each game that guide heuristic application

Return JSON with "suite_overview", "individual_instructions" object, and "individual_hints" object.
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
        { role: 'system', content: 'Generate comprehensive instructions for cognitive heuristic development game suites.' },
        { role: 'user', content: suiteInstructionsPrompt }
      ],
      temperature: 0.6,
    }),
  });

  const instructionsData = await instructionsResponse.json();
  let instructionsText = instructionsData.choices[0].message.content;
  
  // Remove markdown code block formatting if present
  instructionsText = instructionsText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  
  const suiteInstructions = JSON.parse(instructionsText);

  // Process each template
  const processedGames = await Promise.all(templates.map(async (template) => {
    const templateKey = template.name.toLowerCase().replace(/\s+/g, '_');
    const contentForTemplate = orchestratedContent[templateKey];
    
    if (!contentForTemplate) return null;

    // Replace placeholders in template data
    let gameData = JSON.parse(JSON.stringify(template.template_data));
    
    // Replace placeholders in nodes
    gameData.nodes = gameData.nodes.map((node: any) => {
      let label = node.data.label;
      Object.entries(contentForTemplate).forEach(([key, value]) => {
        label = label.replace(`{{${key}}}`, value as string);
      });
      return {
        ...node,
        data: { ...node.data, label }
      };
    });

    return {
      templateId: template.id,
      templateName: template.name,
      gameData,
      generatedContent: contentForTemplate,
      instructions: suiteInstructions.individual_instructions?.[templateKey] || `Play this ${template.name} game to enhance your thinking skills.`,
      hints: suiteInstructions.individual_hints?.[templateKey] || template.mechanics?.hints || [],
      heuristicTargets: template.heuristic_targets,
      validationRules: template.validation_rules,
      winConditions: template.win_conditions
    };
  }));

  return new Response(JSON.stringify({
    mode: 'batch',
    suiteOverview: suiteInstructions.suite_overview,
    games: processedGames.filter(game => game !== null),
    sessionNumber,
    lectureNumber
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}