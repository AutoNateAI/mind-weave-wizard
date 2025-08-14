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

  // Generate instructor solution and rubric
  const solutionPrompt = `
Based on this ${template.name} game scenario, create:
1. Complete instructor solution with all optimal connections/relationships
2. Comprehensive grading rubric with performance criteria
3. Game instructions and hints for students

Game Type: ${template.name}
Target Heuristics: ${template.heuristic_targets?.join(', ') || 'General critical thinking'}
Scenario Content: ${JSON.stringify(generatedContent)}
Template Structure: ${JSON.stringify(template.template_data)}

**CRITICAL: Return ONLY valid JSON with no additional text or formatting.**

Return JSON format:
{
  "instructor_solution": [
    {"source": "node_id", "target": "node_id", "relationship": "relationship_type", "points": 10}
  ],
  "grading_rubric": {
    "excellent": {"min_score": 120, "criteria": "Complete understanding demonstrated"},
    "good": {"min_score": 90, "criteria": "Strong performance with minor gaps"},
    "satisfactory": {"min_score": 60, "criteria": "Basic understanding shown"},
    "needs_improvement": {"min_score": 30, "criteria": "Limited understanding"},
    "unsatisfactory": {"min_score": 0, "criteria": "Little to no understanding"}
  },
  "wrong_connections": [
    {"source": "node_id", "target": "node_id", "why_wrong": "explanation", "penalty": -5}
  ],
  "instructions": "Clear game instructions for students",
  "hints": ["Hint 1", "Hint 2", "Hint 3"]
}
`;

  const solutionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: 'You are an expert educational assessment designer. Generate comprehensive instructor solutions and grading rubrics for critical thinking games. Return ONLY valid JSON with no additional text or formatting.' },
        { role: 'user', content: solutionPrompt }
      ],
      temperature: 0.3,
    }),
  });

  const solutionData = await solutionResponse.json();
  let solutionText = solutionData.choices[0].message.content;
  
  // Remove markdown code block formatting if present
  solutionText = solutionText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  
  const gameSolution = JSON.parse(solutionText);

  // Update game data with instructor solution
  gameData.instructorSolution = gameSolution.instructor_solution || [];
  gameData.wrongConnections = gameSolution.wrong_connections || [];

  return new Response(JSON.stringify({
    gameData,
    generatedContent,
    instructions: gameSolution.instructions,
    hints: gameSolution.hints,
    instructorSolution: gameSolution.instructor_solution,
    gradingRubric: gameSolution.grading_rubric,
    wrongConnections: gameSolution.wrong_connections,
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

**CRITICAL DECISION PATH REQUIREMENTS:**
Create complex hierarchical decision scenarios with:
- At least 18-20 interconnected nodes
- Layers: Scenario → Context/Stakes → Resources → Decisions → Consequences → Stakeholder Impacts → Final Outcomes  
- Multiple resource constraints (time, budget, personnel, reputation)
- Competing objectives that create real trade-offs
- At least 12 required connections for optimal solution
- Progressive complexity where early decisions affect later options

**PROBLEM ANALYSIS WEB REQUIREMENTS:**
Create systematic problem breakdown with:
- Central problem with 4+ observable symptoms
- 4+ root causes that explain the symptoms
- 3+ impacts/consequences of the problem
- 4+ solution strategies targeting root causes
- 2+ expected outcomes from implementing solutions
- Clear causal relationships between all elements

**SYSTEM MAPPING REQUIREMENTS:**
Create interconnected system analysis with:
- Central system core with 3+ inputs, 4+ processes, 3+ outputs
- 2+ feedback loops connecting outputs back to processes
- 3+ constraints affecting the system
- 2+ stakeholder groups
- 2+ system outcomes
- Clear flow and influence relationships

**Response Format (JSON ONLY):**
{
  "critical_decision_path": {
    "title": "Complex strategic scenario title",
    "description": "Multi-layered decision scenario with resource constraints",
    "scenario_description": "Detailed scenario requiring strategic thinking",
    "context_factor_1": "First contextual factor that influences decisions",
    "context_factor_2": "Second contextual factor that influences decisions", 
    "stakes_description": "What's at stake in this scenario",
    "resource_constraint_1": "Time limitation (specific constraint)",
    "resource_constraint_2": "Budget limitation (specific constraint)", 
    "resource_constraint_3": "Personnel limitation (specific constraint)",
    "resource_constraint_4": "Reputation/trust limitation (specific constraint)",
    "primary_decision_1": "First major decision point with trade-offs",
    "primary_decision_2": "Second major decision point with trade-offs",
    "consequence_1a": "Consequence of first decision path A",
    "consequence_1b": "Consequence of first decision path B", 
    "consequence_2a": "Consequence of second decision path A",
    "consequence_2b": "Consequence of second decision path B",
    "stakeholder_impact_1": "Impact on first stakeholder group",
    "stakeholder_impact_2": "Impact on second stakeholder group",
    "stakeholder_impact_3": "Impact on third stakeholder group", 
    "stakeholder_impact_4": "Impact on fourth stakeholder group",
    "optimal_outcome": "Best possible outcome considering all factors",
    "suboptimal_outcome": "Outcome when key connections are missed",
    "instructor_solution": [
      {"source": "scenario", "target": "context1", "relationship": "requires understanding", "points": 5},
      {"source": "scenario", "target": "stakes", "relationship": "establishes", "points": 5},
      {"source": "context1", "target": "resource1", "relationship": "constrains", "points": 8},
      {"source": "context2", "target": "resource2", "relationship": "constrains", "points": 8},
      {"source": "stakes", "target": "decision1", "relationship": "influences", "points": 10},
      {"source": "resource1", "target": "decision1", "relationship": "limits", "points": 10},
      {"source": "resource2", "target": "decision2", "relationship": "limits", "points": 10},
      {"source": "decision1", "target": "consequence1a", "relationship": "leads to", "points": 15},
      {"source": "decision2", "target": "consequence2a", "relationship": "leads to", "points": 15},
      {"source": "consequence1a", "target": "stakeholder1", "relationship": "impacts", "points": 12},
      {"source": "consequence2a", "target": "stakeholder2", "relationship": "impacts", "points": 12},
      {"source": "stakeholder1", "target": "outcome_optimal", "relationship": "enables", "points": 20},
      {"source": "stakeholder2", "target": "outcome_optimal", "relationship": "enables", "points": 20}
    ],
    "connection_rules": [
      "Scenario must connect to context and stakes before decisions",
      "All resource constraints must be considered in decisions", 
      "Decisions must connect to appropriate consequences",
      "Consequences must connect to stakeholder impacts",
      "Multiple stakeholder impacts required for optimal outcome"
    ],
    "wrong_connections": [
      {"source": "scenario", "target": "decision1", "why_wrong": "Decisions cannot be made without understanding context and resources", "penalty": -10},
      {"source": "decision1", "target": "outcome_optimal", "why_wrong": "Decisions must go through consequences and stakeholder impacts first", "penalty": -15},
      {"source": "resource1", "target": "stakeholder1", "why_wrong": "Resources don't directly impact stakeholders without decisions", "penalty": -8}
    ],
    "grading_rubric": {
      "excellent": {"min_score": 130, "criteria": "All critical connections made, optimal path followed, demonstrates strategic thinking"},
      "good": {"min_score": 100, "criteria": "Most critical connections made, minor gaps in strategic flow"},
      "satisfactory": {"min_score": 70, "criteria": "Key connections identified, some logical flow present"},
      "needs_improvement": {"min_score": 40, "criteria": "Some connections made but significant gaps in understanding"},
      "unsatisfactory": {"min_score": 0, "criteria": "Few or no meaningful connections, lacks strategic coherence"}
    }
  },
  "problem_analysis_web": {
    "title": "Problem Analysis Web title",
    "description": "Systematic breakdown of complex problem",
    "central_problem": "Core problem statement requiring analysis",
    "symptom_1": "First observable symptom of the problem",
    "symptom_2": "Second observable symptom",
    "symptom_3": "Third observable symptom", 
    "symptom_4": "Fourth observable symptom",
    "root_cause_1": "First underlying root cause",
    "root_cause_2": "Second underlying root cause",
    "root_cause_3": "Third underlying root cause",
    "root_cause_4": "Fourth underlying root cause",
    "impact_1": "First consequence/impact",
    "impact_2": "Second consequence/impact",
    "impact_3": "Third consequence/impact",
    "solution_1": "First solution strategy",
    "solution_2": "Second solution strategy", 
    "solution_3": "Third solution strategy",
    "solution_4": "Fourth solution strategy",
    "expected_outcome_1": "First expected positive outcome",
    "expected_outcome_2": "Second expected positive outcome",
    "instructor_solution": [
      {"source": "problem_1", "target": "symptom_1", "relationship": "manifests as", "points": 5},
      {"source": "problem_1", "target": "symptom_2", "relationship": "manifests as", "points": 5},
      {"source": "problem_1", "target": "symptom_3", "relationship": "manifests as", "points": 5},
      {"source": "problem_1", "target": "symptom_4", "relationship": "manifests as", "points": 5},
      {"source": "symptom_1", "target": "root_cause_1", "relationship": "caused by", "points": 8},
      {"source": "symptom_2", "target": "root_cause_2", "relationship": "caused by", "points": 8},
      {"source": "symptom_3", "target": "root_cause_3", "relationship": "caused by", "points": 8},
      {"source": "symptom_4", "target": "root_cause_4", "relationship": "caused by", "points": 8},
      {"source": "root_cause_1", "target": "impact_1", "relationship": "leads to", "points": 6},
      {"source": "root_cause_2", "target": "impact_2", "relationship": "leads to", "points": 6},
      {"source": "root_cause_3", "target": "impact_3", "relationship": "leads to", "points": 6},
      {"source": "root_cause_1", "target": "solution_1", "relationship": "addressed by", "points": 10},
      {"source": "root_cause_2", "target": "solution_2", "relationship": "addressed by", "points": 10},
      {"source": "root_cause_3", "target": "solution_3", "relationship": "addressed by", "points": 10},
      {"source": "root_cause_4", "target": "solution_4", "relationship": "addressed by", "points": 10},
      {"source": "solution_1", "target": "outcome_1", "relationship": "achieves", "points": 12},
      {"source": "solution_2", "target": "outcome_2", "relationship": "achieves", "points": 12},
      {"source": "solution_3", "target": "outcome_1", "relationship": "supports", "points": 8},
      {"source": "solution_4", "target": "outcome_2", "relationship": "supports", "points": 8}
    ],
    "connection_rules": [
      "Problems must connect to all observable symptoms",
      "Symptoms must trace back to root causes", 
      "Root causes must connect to impacts and solutions",
      "Solutions must lead to expected outcomes"
    ],
    "wrong_connections": [
      {"source": "symptom_1", "target": "solution_1", "why_wrong": "Solutions address root causes, not symptoms directly", "penalty": -8},
      {"source": "impact_1", "target": "root_cause_1", "why_wrong": "Root causes lead to impacts, not the reverse", "penalty": -6},
      {"source": "outcome_1", "target": "problem_1", "why_wrong": "Outcomes don't cause problems", "penalty": -5}
    ],
    "grading_rubric": {
      "excellent": {"min_score": 140, "criteria": "Complete causal analysis, all connections logical and well-reasoned"},
      "good": {"min_score": 110, "criteria": "Strong causal understanding, minor gaps in connection logic"},
      "satisfactory": {"min_score": 80, "criteria": "Basic causal relationships identified, some logical flow"},
      "needs_improvement": {"min_score": 50, "criteria": "Limited understanding of causal relationships"},
      "unsatisfactory": {"min_score": 0, "criteria": "Poor or no understanding of problem structure"}
    }
  },
  "system_mapping": {
    "title": "System Mapping title",
    "description": "Analysis of system components and interactions",
    "system_core": "Central system being analyzed",
    "input_1": "First system input",
    "input_2": "Second system input", 
    "input_3": "Third system input",
    "process_1": "First system process",
    "process_2": "Second system process",
    "process_3": "Third system process",
    "process_4": "Fourth system process",
    "output_1": "First system output",
    "output_2": "Second system output",
    "output_3": "Third system output",
    "feedback_1": "First feedback mechanism",
    "feedback_2": "Second feedback mechanism",
    "constraint_1": "First system constraint",
    "constraint_2": "Second system constraint",
    "constraint_3": "Third system constraint",
    "stakeholder_1": "First stakeholder group",
    "stakeholder_2": "Second stakeholder group",
    "system_outcome_1": "First system outcome",
    "system_outcome_2": "Second system outcome",
    "instructor_solution": [
      {"source": "input_1", "target": "process_1", "relationship": "feeds into", "points": 6},
      {"source": "input_2", "target": "process_1", "relationship": "feeds into", "points": 6},
      {"source": "input_3", "target": "process_2", "relationship": "feeds into", "points": 6},
      {"source": "process_1", "target": "system_core", "relationship": "supports", "points": 8},
      {"source": "process_2", "target": "system_core", "relationship": "supports", "points": 8},
      {"source": "system_core", "target": "process_3", "relationship": "drives", "points": 10},
      {"source": "system_core", "target": "process_4", "relationship": "drives", "points": 10},
      {"source": "process_3", "target": "output_1", "relationship": "produces", "points": 8},
      {"source": "process_4", "target": "output_2", "relationship": "produces", "points": 8},
      {"source": "output_1", "target": "output_3", "relationship": "enables", "points": 6},
      {"source": "output_2", "target": "feedback_1", "relationship": "generates", "points": 10},
      {"source": "output_3", "target": "feedback_2", "relationship": "generates", "points": 10},
      {"source": "feedback_1", "target": "process_1", "relationship": "improves", "points": 12},
      {"source": "feedback_2", "target": "process_2", "relationship": "improves", "points": 12},
      {"source": "constraint_1", "target": "process_1", "relationship": "limits", "points": 5},
      {"source": "constraint_2", "target": "process_3", "relationship": "limits", "points": 5},
      {"source": "constraint_3", "target": "output_1", "relationship": "affects", "points": 5},
      {"source": "stakeholder_1", "target": "system_core", "relationship": "influences", "points": 8},
      {"source": "stakeholder_2", "target": "outcome_2", "relationship": "benefits from", "points": 8},
      {"source": "output_1", "target": "outcome_1", "relationship": "contributes to", "points": 10},
      {"source": "output_2", "target": "outcome_1", "relationship": "supports", "points": 8},
      {"source": "feedback_1", "target": "outcome_2", "relationship": "enhances", "points": 10}
    ],
    "connection_rules": [
      "Inputs must flow into processes",
      "Processes must connect to system core",
      "System core drives other processes and outputs",
      "Outputs must generate feedback loops back to processes",
      "Constraints affect processes and outputs",
      "Stakeholders influence core and benefit from outcomes"
    ],
    "wrong_connections": [
      {"source": "output_1", "target": "input_1", "why_wrong": "Outputs don't directly become inputs without feedback loops", "penalty": -8},
      {"source": "constraint_1", "target": "outcome_1", "why_wrong": "Constraints affect processes, not outcomes directly", "penalty": -6},
      {"source": "feedback_1", "target": "constraint_1", "why_wrong": "Feedback improves processes, doesn't create constraints", "penalty": -5}
    ],
    "grading_rubric": {
      "excellent": {"min_score": 160, "criteria": "Complete systems thinking, all flows and feedback loops identified"},
      "good": {"min_score": 125, "criteria": "Strong systems understanding, minor gaps in flow logic"},
      "satisfactory": {"min_score": 90, "criteria": "Basic systems relationships identified"},
      "needs_improvement": {"min_score": 60, "criteria": "Limited understanding of system interactions"},
      "unsatisfactory": {"min_score": 0, "criteria": "Poor or no systems thinking demonstrated"}
    }
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
        'scenario_description': contentForTemplate.scenario_description || 'Make critical decisions in this scenario',
        'context_factor_1': contentForTemplate.context_factor_1 || 'First contextual factor',
        'context_factor_2': contentForTemplate.context_factor_2 || 'Second contextual factor',
        'stakes_description': contentForTemplate.stakes_description || 'What is at stake',
        'resource_constraint_1': contentForTemplate.resource_constraint_1 || 'Time constraint',
        'resource_constraint_2': contentForTemplate.resource_constraint_2 || 'Budget constraint',
        'resource_constraint_3': contentForTemplate.resource_constraint_3 || 'Personnel constraint', 
        'resource_constraint_4': contentForTemplate.resource_constraint_4 || 'Reputation constraint',
        'primary_decision_1': contentForTemplate.primary_decision_1 || 'First decision point',
        'primary_decision_2': contentForTemplate.primary_decision_2 || 'Second decision point',
        'consequence_1a': contentForTemplate.consequence_1a || 'First consequence A',
        'consequence_1b': contentForTemplate.consequence_1b || 'First consequence B',
        'consequence_2a': contentForTemplate.consequence_2a || 'Second consequence A',
        'consequence_2b': contentForTemplate.consequence_2b || 'Second consequence B',
        'stakeholder_impact_1': contentForTemplate.stakeholder_impact_1 || 'Impact on stakeholder 1',
        'stakeholder_impact_2': contentForTemplate.stakeholder_impact_2 || 'Impact on stakeholder 2',
        'stakeholder_impact_3': contentForTemplate.stakeholder_impact_3 || 'Impact on stakeholder 3',
        'stakeholder_impact_4': contentForTemplate.stakeholder_impact_4 || 'Impact on stakeholder 4',
        'optimal_outcome': contentForTemplate.optimal_outcome || 'Best outcome',
        'suboptimal_outcome': contentForTemplate.suboptimal_outcome || 'Suboptimal outcome'
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

    // Add instructor solution and grading rubric from orchestrated content
    const instructorSolution = contentForTemplate.instructor_solution || [];
    const gradingRubric = contentForTemplate.grading_rubric || {
      excellent: { min_score: 100, criteria: "Excellent understanding demonstrated" },
      good: { min_score: 75, criteria: "Good understanding shown" },
      satisfactory: { min_score: 50, criteria: "Basic understanding evident" },
      needs_improvement: { min_score: 25, criteria: "Limited understanding" },
      unsatisfactory: { min_score: 0, criteria: "Poor understanding" }
    };
    const wrongConnections = contentForTemplate.wrong_connections || [];

    // Update game data with instructor solution
    gameData.instructorSolution = instructorSolution;
    gameData.wrongConnections = wrongConnections;

    return {
      templateId: template.id,
      templateName: template.name,
      gameData,
      generatedContent: contentForTemplate,
      instructions: suiteInstructions.individual_instructions?.[templateKey] || `Play this ${template.name} game to enhance your thinking skills.`,
      hints: suiteInstructions.individual_hints?.[templateKey] || template.mechanics?.hints || [],
      instructorSolution,
      gradingRubric,
      wrongConnections,
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