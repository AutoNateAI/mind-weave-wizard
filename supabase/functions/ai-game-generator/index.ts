import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Helper function to fetch and process prompts from the AI prompt library
async function getPromptTemplate(supabase: any, promptName: string, variables: Record<string, any> = {}) {
  try {
    const { data: prompt, error } = await supabase
      .from('ai_prompts')
      .select('id, prompt_template, variables, usage_count')
      .eq('prompt_name', promptName)
      .eq('is_active', true)
      .single();

    if (error || !prompt) {
      console.warn(`Prompt not found in library: ${promptName}`);
      return null;
    }

    // Replace variables in the template; support both {var} and {{var}}
    let processedTemplate = prompt.prompt_template as string;
    Object.entries(variables).forEach(([key, value]) => {
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      const curlyOnce = new RegExp(`\\{${key}\\}`, 'g');
      const curlyTwice = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedTemplate = processedTemplate.replace(curlyOnce, valueStr);
      processedTemplate = processedTemplate.replace(curlyTwice, valueStr);
    });

    // Update usage tracking safely
    const newUsage = (prompt.usage_count || 0) + 1;
    await supabase
      .from('ai_prompts')
      .update({ usage_count: newUsage, last_used_at: new Date().toISOString() })
      .eq('id', prompt.id);

    return processedTemplate;
  } catch (err) {
    console.error(`Error fetching prompt ${promptName}:`, err);
    return null;
  }
}

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

  // TWO-PASS APPROACH using DB-managed prompts (no hardcoded prompts)
  
  // PASS 1: Generate full game_data using exact node IDs from the template via Prompt Manager
  const exactNodeIds = (template.template_data?.nodes || []).map((n: any) => n.id);

  const pass1Variables = {
    sessionNumber,
    lectureNumber,
    lectureContent,
    templateMechanics: template.mechanics || {},
    templateSlots: template.content_slots || [],
    templateValidationRules: template.validation_rules || {},
    templateWinConditions: template.win_conditions || {},
    exactNodeIds
  };

  const pass1Prompt = await getPromptTemplate(supabase, 'pass1-generate-game-graph', pass1Variables);
  if (!pass1Prompt) {
    throw new Error('Pass 1 prompt not found or inactive in ai_prompts');
  }

  const pass1Response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Return ONLY valid JSON. Do not include markdown, code fences, or commentary.' },
        { role: 'user', content: pass1Prompt }
      ],
      temperature: 0.4,
    }),
  });

  const pass1DataRaw = await pass1Response.json();
  if (!pass1Response.ok) {
    console.error('Pass 1 OpenAI error:', pass1DataRaw);
    throw new Error(pass1DataRaw.error?.message || 'OpenAI error in Pass 1');
  }
  const pass1Data = pass1DataRaw;
  let pass1Text = pass1Data.choices?.[0]?.message?.content || '';
  pass1Text = pass1Text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

  let gameData;
  try {
    gameData = JSON.parse(pass1Text);
  } catch (e) {
    console.error('Pass 1 JSON parse error:', e, pass1Text);
    throw new Error('AI response for Pass 1 was not valid JSON');
  }

  // PASS 2: Generate instructor solution using the actual node IDs present in gameData
  const finalNodeIds = (gameData.nodes || []).map((n: any) => n.id);

  const pass2Variables = {
    gameData,
    exactNodeIds: finalNodeIds
  };

  const pass2Prompt = await getPromptTemplate(supabase, 'pass2-generate-instructor-solution', pass2Variables);
  if (!pass2Prompt) {
    throw new Error('Pass 2 prompt not found or inactive in ai_prompts');
  }

  const pass2Response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Return ONLY valid JSON. Use ONLY provided node IDs. No markdown or extra text.' },
        { role: 'user', content: pass2Prompt }
      ],
      temperature: 0.2,
    }),
  });

  const pass2DataRaw = await pass2Response.json();
  if (!pass2Response.ok) {
    console.error('Pass 2 OpenAI error:', pass2DataRaw);
    throw new Error(pass2DataRaw.error?.message || 'OpenAI error in Pass 2');
  }
  const pass2Data = pass2DataRaw;
  let pass2Text = pass2Data.choices?.[0]?.message?.content || '';
  pass2Text = pass2Text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

  let gameSolution;
  try {
    gameSolution = JSON.parse(pass2Text);
  } catch (e) {
    console.error('Pass 2 JSON parse error:', e, pass2Text);
    throw new Error('AI response for Pass 2 was not valid JSON');
  }

  // VALIDATION: Ensure all solution node IDs exist in the actual game
  const validateConnection = (connection: any) => {
    if (!connection) return null;
    const s = connection.source;
    const t = connection.target;
    const sourceExists = (gameData.nodes || []).some((node: any) => node.id === s);
    const targetExists = (gameData.nodes || []).some((node: any) => node.id === t);
    if (!sourceExists || !targetExists) {
      console.warn(`Invalid connection: ${s} -> ${t}`);
      return null;
    }
    return connection;
  };

  const instructorSolutionRaw = gameSolution.instructor_solution;
  const instructorConnections = Array.isArray(instructorSolutionRaw)
    ? instructorSolutionRaw
    : (instructorSolutionRaw?.correct_connections || []);

  const wrongConnectionsRaw = gameSolution.wrong_connections 
    || instructorSolutionRaw?.wrong_connections 
    || [];

  const validInstructorSolution = (instructorConnections || [])
    .map(validateConnection)
    .filter(Boolean);

  const validWrongConnections = (wrongConnectionsRaw || [])
    .map(validateConnection)
    .filter(Boolean);

  const gradingRubric = gameSolution.grading_rubric 
    || instructorSolutionRaw?.grading_rubric 
    || null;

  // Attach validated solutions back onto the game data for instructor view
  gameData.instructorSolution = validInstructorSolution;
  gameData.wrongConnections = validWrongConnections;

  return new Response(JSON.stringify({
    gameData,
    generatedContent: null,
    instructions: gameSolution.instructions || '',
    hints: gameSolution.hints || [],
    instructorSolution: validInstructorSolution,
    gradingRubric,
    wrongConnections: validWrongConnections,
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

You are an expert game designer creating learning experiences for software engineers in their first 0-7 years of professional experience. Generate a coordinated suite of three CONNECTION-BASED puzzle games that help junior developers practice critical thinking through REAL-WORLD SOFTWARE ENGINEERING scenarios.

**TARGET AUDIENCE:** Junior software engineers (0-7 years experience) working in tech companies, startups, or product teams.

**CONTEXT:** Create scenarios that junior developers actually face - debugging production issues, planning feature releases, managing technical debt, code reviews, team collaboration, sprint planning, incident response, architecture decisions, etc.

Generate a coordinated suite of three CONNECTION-BASED puzzle games for this lecture content:

${lectureContent}${contextSection}

**CRITICAL DECISION PATH REQUIREMENTS:**
Create complex software engineering decision scenarios with:
- At least 18-20 interconnected nodes
- Layers: Engineering Scenario → Technical Context/Stakes → Resources → Engineering Decisions → Code/System Consequences → Team/User Impacts → Project Outcomes  
- Multiple resource constraints (sprint time, technical debt, team capacity, user impact, system performance)
- Competing objectives that create real trade-offs (speed vs quality, features vs stability, etc.)
- At least 12 required connections for optimal solution
- Progressive complexity where early technical decisions affect later implementation options

**PROBLEM ANALYSIS WEB REQUIREMENTS:**
Create systematic software problem breakdown with:
- Central technical problem with 4+ observable symptoms (bugs, performance issues, user complaints, system failures)
- 4+ root causes that explain the symptoms (code issues, architecture problems, process gaps, team dynamics)
- 3+ impacts/consequences of the problem (user experience, business metrics, team morale)
- 4+ solution strategies targeting root causes (code fixes, architecture changes, process improvements, team training)
- 2+ expected outcomes from implementing solutions
- Clear causal relationships between all technical elements

**SYSTEM MAPPING REQUIREMENTS:**
Create interconnected software system analysis with:
- Central system core with 3+ inputs (user requests, data feeds, external APIs), 4+ processes (authentication, business logic, data processing, notifications), 3+ outputs (user responses, database updates, external integrations)
- 2+ feedback loops connecting outputs back to processes (monitoring, user feedback, performance metrics)
- 3+ constraints affecting the system (infrastructure limits, compliance requirements, performance SLAs)
- 2+ stakeholder groups (users, product team, operations team, business stakeholders)
- 2+ system outcomes (user satisfaction, business value, system reliability)
- Clear flow and influence relationships

**CRITICAL: Include scenario_description field for each game that provides a clear, context-rich overview of the real-world software engineering situation.**

**Response Format (JSON ONLY):**
{
  "critical_decision_path": {
    "title": "Complex software engineering decision scenario title",
    "description": "Multi-layered technical decision scenario with resource constraints",
    "scenario_description": "Detailed real-world software engineering scenario description that sets the context - describe the company, product, technical challenge, and why this decision matters for a junior developer learning experience",
    "context_factor_1": "First technical/business contextual factor",
    "context_factor_2": "Second technical/business contextual factor",
    "stakes_description": "What is at stake technically and business-wise",
    "resource_constraint_1": "Sprint time limitation (specific constraint)",
    "resource_constraint_2": "Technical debt/infrastructure limitation", 
    "resource_constraint_3": "Team capacity/expertise limitation",
    "resource_constraint_4": "User impact/system performance limitation",
    "primary_decision_1": "First major technical decision point with trade-offs",
    "primary_decision_2": "Second major technical decision point with trade-offs",
    "consequence_1a": "Technical consequence of first decision path A",
    "consequence_1b": "Technical consequence of first decision path B", 
    "consequence_2a": "Technical consequence of second decision path A",
    "consequence_2b": "Technical consequence of second decision path B",
    "stakeholder_impact_1": "Impact on users/customer experience",
    "stakeholder_impact_2": "Impact on development team",
    "stakeholder_impact_3": "Impact on product/business team", 
    "stakeholder_impact_4": "Impact on operations/infrastructure team",
    "optimal_outcome": "Best technical and business outcome",
    "suboptimal_outcome": "Outcome when key technical connections are missed",
    "instructor_solution": [
      {"source": "scenario_description", "target": "context_factor_1", "relationship": "requires understanding", "points": 5},
      {"source": "scenario_description", "target": "stakes_description", "relationship": "establishes", "points": 5},
      {"source": "context_factor_1", "target": "resource_constraint_1", "relationship": "constrains", "points": 8},
      {"source": "context_factor_2", "target": "resource_constraint_2", "relationship": "constrains", "points": 8},
      {"source": "stakes_description", "target": "primary_decision_1", "relationship": "influences", "points": 10},
      {"source": "resource_constraint_1", "target": "primary_decision_1", "relationship": "limits", "points": 10},
      {"source": "resource_constraint_2", "target": "primary_decision_2", "relationship": "limits", "points": 10},
      {"source": "primary_decision_1", "target": "consequence_1a", "relationship": "leads to", "points": 15},
      {"source": "primary_decision_2", "target": "consequence_2a", "relationship": "leads to", "points": 15},
      {"source": "consequence_1a", "target": "stakeholder_impact_1", "relationship": "impacts", "points": 12},
      {"source": "consequence_2a", "target": "stakeholder_impact_2", "relationship": "impacts", "points": 12},
      {"source": "stakeholder_impact_1", "target": "optimal_outcome", "relationship": "enables", "points": 20},
      {"source": "stakeholder_impact_2", "target": "optimal_outcome", "relationship": "enables", "points": 20}
    ],
    "connection_rules": [
      "Scenario must connect to context and stakes before decisions",
      "All resource constraints must be considered in decisions", 
      "Decisions must connect to appropriate consequences",
      "Consequences must connect to stakeholder impacts",
      "Multiple stakeholder impacts required for optimal outcome"
    ],
    "wrong_connections": [
      {"source": "scenario_description", "target": "primary_decision_1", "why_wrong": "Decisions cannot be made without understanding context and resources", "penalty": -10},
      {"source": "primary_decision_1", "target": "optimal_outcome", "why_wrong": "Decisions must go through consequences and stakeholder impacts first", "penalty": -15},
      {"source": "resource_constraint_1", "target": "stakeholder_impact_1", "why_wrong": "Resources don't directly impact stakeholders without decisions", "penalty": -8}
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
    "title": "Software Engineering Problem Analysis",
    "description": "Systematic breakdown of complex technical problem",
    "scenario_description": "Detailed real-world software engineering problem scenario - describe the system, the problem manifestation, and why understanding this problem breakdown is critical for junior developers",
    "central_problem": "Core technical problem statement requiring analysis",
    "symptom_1": "First observable technical symptom",
    "symptom_2": "Second observable technical symptom",
    "symptom_3": "Third observable technical symptom", 
    "symptom_4": "Fourth observable technical symptom",
    "root_cause_1": "First underlying technical root cause",
    "root_cause_2": "Second underlying technical root cause",
    "root_cause_3": "Third underlying technical root cause",
    "root_cause_4": "Fourth underlying technical root cause",
    "impact_1": "First technical/business consequence",
    "impact_2": "Second technical/business consequence",
    "impact_3": "Third technical/business consequence",
    "solution_1": "First technical solution strategy",
    "solution_2": "Second technical solution strategy", 
    "solution_3": "Third technical solution strategy",
    "solution_4": "Fourth technical solution strategy",
    "expected_outcome_1": "First expected positive technical outcome",
    "expected_outcome_2": "Second expected positive business outcome",
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
    "title": "Software System Analysis",
    "description": "Analysis of software system components and interactions",
    "scenario_description": "Detailed real-world software system scenario - describe the product, the system architecture challenge, and why system thinking is important for junior developers in this context",
    "system_core": "Central software system being analyzed",
    "input_1": "First system input (APIs, user requests, data)",
    "input_2": "Second system input", 
    "input_3": "Third system input",
    "process_1": "First system process (authentication, validation, etc.)",
    "process_2": "Second system process",
    "process_3": "Third system process",
    "process_4": "Fourth system process",
    "output_1": "First system output (responses, data, notifications)",
    "output_2": "Second system output",
    "output_3": "Third system output",
    "feedback_1": "First feedback mechanism (monitoring, metrics)",
    "feedback_2": "Second feedback mechanism",
    "constraint_1": "First system constraint (performance, compliance)",
    "constraint_2": "Second system constraint",
    "constraint_3": "Third system constraint",
    "stakeholder_1": "First stakeholder group (users, developers)",
    "stakeholder_2": "Second stakeholder group",
    "system_outcome_1": "First system outcome (user satisfaction, performance)",
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

Focus on real scenarios junior developers encounter: production incidents, feature planning, code reviews, technical debt decisions, system design, debugging complex issues, sprint planning, team collaboration challenges, etc.
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
        'central_problem': contentForTemplate.central_problem || 'Main problem to analyze',
        'symptom_1': contentForTemplate.symptom_1 || 'First symptom',
        'symptom_2': contentForTemplate.symptom_2 || 'Second symptom',
        'symptom_3': contentForTemplate.symptom_3 || 'Third symptom',
        'symptom_4': contentForTemplate.symptom_4 || 'Fourth symptom',
        'root_cause_1': contentForTemplate.root_cause_1 || 'First root cause',
        'root_cause_2': contentForTemplate.root_cause_2 || 'Second root cause',
        'root_cause_3': contentForTemplate.root_cause_3 || 'Third root cause',
        'root_cause_4': contentForTemplate.root_cause_4 || 'Fourth root cause',
        'impact_1': contentForTemplate.impact_1 || 'First impact',
        'impact_2': contentForTemplate.impact_2 || 'Second impact',
        'impact_3': contentForTemplate.impact_3 || 'Third impact',
        'solution_1': contentForTemplate.solution_1 || 'First solution',
        'solution_2': contentForTemplate.solution_2 || 'Second solution',
        'solution_3': contentForTemplate.solution_3 || 'Third solution',
        'solution_4': contentForTemplate.solution_4 || 'Fourth solution',
        'expected_outcome_1': contentForTemplate.expected_outcome_1 || 'First expected outcome',
        'expected_outcome_2': contentForTemplate.expected_outcome_2 || 'Second expected outcome'
      };
    } else if (templateKey === 'system_mapping') {
      replacementMap = {
        'system_core': contentForTemplate.system_core || 'Central system',
        'input_1': contentForTemplate.input_1 || 'First input',
        'input_2': contentForTemplate.input_2 || 'Second input',
        'input_3': contentForTemplate.input_3 || 'Third input',
        'process_1': contentForTemplate.process_1 || 'First process',
        'process_2': contentForTemplate.process_2 || 'Second process',
        'process_3': contentForTemplate.process_3 || 'Third process',
        'process_4': contentForTemplate.process_4 || 'Fourth process',
        'output_1': contentForTemplate.output_1 || 'First output',
        'output_2': contentForTemplate.output_2 || 'Second output',
        'output_3': contentForTemplate.output_3 || 'Third output',
        'feedback_1': contentForTemplate.feedback_1 || 'First feedback',
        'feedback_2': contentForTemplate.feedback_2 || 'Second feedback',
        'constraint_1': contentForTemplate.constraint_1 || 'First constraint',
        'constraint_2': contentForTemplate.constraint_2 || 'Second constraint',
        'constraint_3': contentForTemplate.constraint_3 || 'Third constraint',
        'stakeholder_1': contentForTemplate.stakeholder_1 || 'First stakeholder',
        'stakeholder_2': contentForTemplate.stakeholder_2 || 'Second stakeholder',
        'system_outcome_1': contentForTemplate.system_outcome_1 || 'First outcome',
        'system_outcome_2': contentForTemplate.system_outcome_2 || 'Second outcome'
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

    // TWO-PASS APPROACH FOR SUITE: Generate instructor solution using actual node IDs
    const finalNodeIds = gameData.nodes.map((node: any) => node.id);
    const nodeLabelsMap = gameData.nodes.reduce((acc: any, node: any) => {
      acc[node.id] = node.data.label;
      return acc;
    }, {});

    const solutionPrompt = `
**CRITICAL: Use ONLY the exact node IDs provided below. Do not create new node names or IDs.**

Based on this ${template.name} game scenario, create instructor solution using ONLY these exact node IDs:

**AVAILABLE NODE IDS:** ${finalNodeIds.join(', ')}

**NODE LABELS FOR REFERENCE:**
${JSON.stringify(nodeLabelsMap, null, 2)}

Game Type: ${template.name}
Template Content: ${JSON.stringify(contentForTemplate)}

Create:
1. Complete instructor solution with optimal connections using ONLY the node IDs listed above
2. Comprehensive grading rubric with performance criteria  
3. Wrong connections (common student mistakes) using ONLY the node IDs listed above

**CRITICAL: Return ONLY valid JSON with no additional text or formatting. Use EXACT node IDs from the list above.**

Return JSON format:
{
  "instructor_solution": [
    {"source": "exact_node_id_from_list", "target": "exact_node_id_from_list", "relationship": "relationship_type", "points": 10}
  ],
  "grading_rubric": {
    "excellent": {"min_score": 120, "criteria": "Complete understanding demonstrated"},
    "good": {"min_score": 90, "criteria": "Strong performance with minor gaps"},
    "satisfactory": {"min_score": 60, "criteria": "Basic understanding shown"},
    "needs_improvement": {"min_score": 30, "criteria": "Limited understanding"},
    "unsatisfactory": {"min_score": 0, "criteria": "Little to no understanding"}
  },
  "wrong_connections": [
    {"source": "exact_node_id_from_list", "target": "exact_node_id_from_list", "why_wrong": "explanation", "penalty": -5}
  ]
}
`;

    const solutionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert educational assessment designer. Generate instructor solutions using ONLY the exact node IDs provided. Return ONLY valid JSON with no additional text or formatting.' },
          { role: 'user', content: solutionPrompt }
        ],
        temperature: 0.2,
      }),
    });

    const solutionDataRaw = await solutionResponse.json();
    if (!solutionResponse.ok) {
      console.error('Suite solution OpenAI error:', solutionDataRaw);
      throw new Error(solutionDataRaw.error?.message || 'OpenAI error in suite solution');
    }
    const solutionData = solutionDataRaw;
    let solutionText = solutionData.choices[0].message.content;
    
    // Remove markdown code block formatting if present
    solutionText = solutionText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    
    const gameSolution = JSON.parse(solutionText);

    // VALIDATION: Ensure all solution node IDs exist in the actual game
    const validateConnection = (connection: any) => {
      const sourceExists = gameData.nodes.some((node: any) => node.id === connection.source);
      const targetExists = gameData.nodes.some((node: any) => node.id === connection.target);
      
      if (!sourceExists || !targetExists) {
        console.warn(`Invalid connection in ${template.name}: ${connection.source} -> ${connection.target}`);
        return null;
      }
      return connection;
    };

    const validInstructorSolution = (gameSolution.instructor_solution || [])
      .map(validateConnection)
      .filter(Boolean);
      
    const validWrongConnections = (gameSolution.wrong_connections || [])
      .map(validateConnection)
      .filter(Boolean);

    // Update game data with validated instructor solution
    gameData.instructorSolution = validInstructorSolution;
    gameData.wrongConnections = validWrongConnections;
    
    const gradingRubric = gameSolution.grading_rubric || {
      excellent: { min_score: 100, criteria: "Excellent understanding demonstrated" },
      good: { min_score: 75, criteria: "Good understanding shown" },
      satisfactory: { min_score: 50, criteria: "Basic understanding evident" },
      needs_improvement: { min_score: 25, criteria: "Limited understanding" },
      unsatisfactory: { min_score: 0, criteria: "Poor understanding" }
    };

    return {
      templateId: template.id,
      templateName: template.name,
      gameData,
      generatedContent: contentForTemplate,
      scenarioDescription: contentForTemplate.scenario_description || '',
      instructions: suiteInstructions.individual_instructions?.[templateKey] || `Play this ${template.name} game to enhance your thinking skills.`,
      hints: suiteInstructions.individual_hints?.[templateKey] || template.mechanics?.hints || [],
      instructorSolution: validInstructorSolution,
      gradingRubric,
      wrongConnections: validWrongConnections,
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