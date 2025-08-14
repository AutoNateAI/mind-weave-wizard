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
      allTemplates = null,
      gameContexts = null
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
        allTemplates,
        gameContexts
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
  
  // Replace placeholders in nodes and add interactive properties
  gameData.nodes = gameData.nodes.map((node: any, index: number) => {
    let label = node.data.label;
    Object.entries(generatedContent).forEach(([key, value]) => {
      label = label.replace(`{{${key}}}`, value as string);
    });
    
    // Determine node type based on position and content
    let nodeType = 'information';
    const isFirstNode = index === 0;
    const hasDecisionWords = label.toLowerCase().includes('choose') || 
                           label.toLowerCase().includes('decide') || 
                           label.toLowerCase().includes('option');
    const hasOutcomeWords = label.toLowerCase().includes('result') || 
                          label.toLowerCase().includes('outcome') || 
                          label.toLowerCase().includes('consequence');
    
    if (isFirstNode) {
      nodeType = 'scenario';
    } else if (hasDecisionWords) {
      nodeType = 'decision';
    } else if (hasOutcomeWords) {
      nodeType = 'outcome';
    }
    
    return {
      ...node,
      data: { 
        ...node.data, 
        label,
        nodeType,
        unlocked: isFirstNode, // Only first node starts unlocked
        revealed: false,
        points: nodeType === 'decision' ? 15 : nodeType === 'outcome' ? 25 : 5,
        consequences: nodeType === 'decision' ? [`Choice made: ${label.substring(0, 50)}...`] : undefined
      }
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
  const { sessionNumber, lectureNumber, lectureContent, allTemplates, gameContexts } = params;

  // Get all game templates
  const { data: templates, error: templateError } = await supabase
    .from('game_templates')
    .select('*')
    .order('name');

  if (templateError || !templates) {
    throw new Error('Templates not found');
  }

  // Build context section
  let contextSection = '';
  if (gameContexts) {
    const contexts = [];
    if (gameContexts.criticalDecisionPath) contexts.push(`**Critical Decision Path Context:** ${gameContexts.criticalDecisionPath}`);
    if (gameContexts.problemAnalysisWeb) contexts.push(`**Problem Analysis Web Context:** ${gameContexts.problemAnalysisWeb}`);
    if (gameContexts.systemMapping) contexts.push(`**System Mapping Context:** ${gameContexts.systemMapping}`);
    
    if (contexts.length > 0) {
      contextSection = `\n\n**ADDITIONAL CONTEXT:**\n${contexts.join('\n')}\n\nUse this additional context to enhance the scenarios and make them more specific and engaging.`;
    }
  }

  const orchestratedPrompt = `
**CRITICAL: Your response must be ONLY a valid JSON object with no additional text, explanations, or markdown formatting.**

Generate a coordinated suite of three CONNECTION-BASED puzzle games for this lecture content:

${lectureContent}${contextSection}

**Template Analysis:**
${Object.values(templates).map(t => `
${t.name}: ${t.description}
- Heuristics: ${t.heuristic_targets.join(', ')}
- Content Slots: ${t.content_slots.map(slot => slot.name).join(', ')}
`).join('\n')}

**CRITICAL REQUIREMENTS:**
Create ONE cohesive scenario for CONNECTION-BASED games where students must:
- WIRE nodes together based on logical relationships 
- Each game has correct connection patterns that students must discover
- Students are judged on the CORRECTNESS of their wiring, not just clicking nodes
- Games require systematic thinking to find the right connections

**Response Format (JSON ONLY):**
{
  "critical_decision_path": {
    "title": "Game title here",
    "description": "Brief description",
    "scenario": "Main scenario text",
    "decision_points": ["Point 1", "Point 2", "Point 3"],
    "consequences": ["Consequence 1", "Consequence 2", "Consequence 3"],
    "optimal_path": "Description of optimal decision sequence",
    "instructor_solution": [{"source": "node1_id", "target": "node2_id", "relationship": "leads to"}],
    "connection_rules": ["Rule 1: Environmental factors must connect to outcomes", "Rule 2: Decisions lead to consequences"],
    "wrong_connections": [{"source": "node1_id", "target": "wrong_node", "why_wrong": "This connection ignores causality"}]
  },
  "problem_analysis_web": {
    "title": "Game title here", 
    "description": "Brief description",
    "central_problem": "Core problem statement",
    "connected_concepts": ["Concept 1", "Concept 2", "Concept 3"],
    "relationships": ["Relationship 1", "Relationship 2", "Relationship 3"],
    "analysis_framework": "Framework for systematic analysis",
    "instructor_solution": [{"source": "problem", "target": "root_cause", "relationship": "caused by"}],
    "connection_rules": ["Root causes must connect to problems", "Problems connect to effects"],
    "wrong_connections": [{"source": "symptom", "target": "unrelated_factor", "why_wrong": "Symptoms don't directly cause unrelated factors"}]
  },
  "system_mapping": {
    "title": "Game title here",
    "description": "Brief description", 
    "system_components": ["Component 1", "Component 2", "Component 3"],
    "interactions": ["Interaction 1", "Interaction 2", "Interaction 3"],
    "feedback_loops": ["Loop 1", "Loop 2"],
    "system_boundaries": "Description of system boundaries",
    "instructor_solution": [{"source": "component1", "target": "component2", "relationship": "influences"}],
    "connection_rules": ["Components must connect based on actual influence", "Feedback loops must form cycles"],
    "wrong_connections": [{"source": "input", "target": "unrelated_output", "why_wrong": "No direct influence relationship"}]
  }
}
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
          content: 'You are an expert game designer. Return ONLY valid JSON with no additional text, explanations, or formatting. Never include markdown code blocks or explanatory text.' 
        },
        { role: 'user', content: orchestratedPrompt }
      ],
      temperature: 0.7,
    }),
  });

  const aiData = await response.json();
  let orchestratedContentText = aiData.choices[0].message.content;
  
  // Clean up response text more thoroughly
  orchestratedContentText = orchestratedContentText
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^.*?({.*}.*?}.*?}).*$/s, '$1')
    .trim();
  
  console.log('Cleaned orchestrated content:', orchestratedContentText);
  
  let orchestratedContent;
  try {
    orchestratedContent = JSON.parse(orchestratedContentText);
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError);
    console.error('Raw content:', orchestratedContentText);
    throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
  }

  const suiteInstructionsPrompt = `
**CRITICAL: Your response must be ONLY a valid JSON object with no additional text or formatting.**

Create instructions and hints for this game suite:

Suite Content: ${JSON.stringify(orchestratedContent)}

Return JSON format:
{
  "suite_overview": "Overview instructions explaining the cognitive development journey",
  "individual_instructions": {
    "critical_decision_path": "Instructions for decision path game",
    "problem_analysis_web": "Instructions for analysis web game", 
    "system_mapping": "Instructions for system mapping game"
  },
  "individual_hints": {
    "critical_decision_path": ["Hint 1", "Hint 2", "Hint 3"],
    "problem_analysis_web": ["Hint 1", "Hint 2", "Hint 3"],
    "system_mapping": ["Hint 1", "Hint 2", "Hint 3"]
  }
}
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
        { role: 'system', content: 'Return ONLY valid JSON with no additional text, explanations, or formatting. Never include markdown code blocks.' },
        { role: 'user', content: suiteInstructionsPrompt }
      ],
      temperature: 0.3,
    }),
  });

  const instructionsData = await instructionsResponse.json();
  let instructionsText = instructionsData.choices[0].message.content;
  
  // Clean up instructions response thoroughly
  instructionsText = instructionsText
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^.*?({.*}).*$/s, '$1')
    .trim();
  
  console.log('Cleaned instructions:', instructionsText);
  
  let suiteInstructions;
  try {
    suiteInstructions = JSON.parse(instructionsText);
  } catch (parseError) {
    console.error('Instructions JSON Parse Error:', parseError);
    console.error('Raw instructions content:', instructionsText);
    throw new Error(`Failed to parse instructions as JSON: ${parseError.message}`);
  }

  // Process each template
  const processedGames = await Promise.all(templates.map(async (template) => {
    const templateKey = template.name.toLowerCase().replace(/\s+/g, '_');
    const contentForTemplate = orchestratedContent[templateKey];
    
    if (!contentForTemplate) {
      console.log(`No content found for template key: ${templateKey}`);
      console.log('Available content keys:', Object.keys(orchestratedContent));
      return null;
    }

    // Replace placeholders in template data
    let gameData = JSON.parse(JSON.stringify(template.template_data));
    
    console.log(`Processing template: ${template.name}`);
    console.log('Content for template:', contentForTemplate);
    console.log('Original game data:', gameData);
    
    // Create mapping based on template type
    let replacementMap = {};
    
    if (templateKey === 'critical_decision_path') {
      replacementMap = {
        'scenario_description': contentForTemplate.scenario || contentForTemplate.description || 'Make critical decisions in this scenario',
        'decision_point_1': contentForTemplate.decision_points?.[0] || 'First decision point',
        'option_1a': contentForTemplate.decision_points?.[0] || 'Option A',
        'option_1b': contentForTemplate.decision_points?.[1] || 'Option B',
        'final_outcome': contentForTemplate.optimal_path || contentForTemplate.consequences?.[0] || 'Final outcome'
      };
    } else if (templateKey === 'problem_analysis_web') {
      replacementMap = {
        'main_problem': contentForTemplate.central_problem || contentForTemplate.title || 'Main problem to analyze',
        'cause_1': contentForTemplate.connected_concepts?.[0] || 'First cause',
        'cause_2': contentForTemplate.connected_concepts?.[1] || 'Second cause',
        'effect_1': contentForTemplate.relationships?.[0] || 'First effect',
        'effect_2': contentForTemplate.relationships?.[1] || 'Second effect',
        'solution': contentForTemplate.analysis_framework || 'Proposed solution'
      };
    } else if (templateKey === 'system_mapping') {
      replacementMap = {
        'central_concept': contentForTemplate.system_boundaries || contentForTemplate.title || 'Central concept',
        'factor_1': contentForTemplate.system_components?.[0] || 'First factor',
        'factor_2': contentForTemplate.system_components?.[1] || 'Second factor',
        'factor_3': contentForTemplate.system_components?.[2] || 'Third factor',
        'factor_4': contentForTemplate.interactions?.[0] || 'Fourth factor'
      };
    }
    
    console.log('Replacement map:', replacementMap);
    
    // Replace placeholders in nodes
    gameData.nodes = gameData.nodes.map((node: any) => {
      let label = node.data.label;
      
      // Replace all placeholders using the mapping
      Object.entries(replacementMap).forEach(([placeholder, value]) => {
        const pattern = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
        label = label.replace(pattern, value as string);
      });
      
      console.log(`Node ${node.id} label transformed from "${node.data.label}" to "${label}"`);
      
      return {
        ...node,
        data: { ...node.data, label }
      };
    });

    console.log('Final processed game data:', gameData);

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