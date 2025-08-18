-- Update the orchestrated prompt to target junior software engineers with real-world scenarios and include scenario descriptions

UPDATE ai_prompts 
SET prompt_template = 'You are an expert game designer creating learning experiences for software engineers in their first 0-7 years of professional experience. Generate a coordinated suite of three CONNECTION-BASED puzzle games that help junior developers practice critical thinking through REAL-WORLD SOFTWARE ENGINEERING scenarios.

**TARGET AUDIENCE:** Junior software engineers (0-7 years experience) working in tech companies, startups, or product teams.

**CONTEXT:** Create scenarios that junior developers actually face - debugging production issues, planning feature releases, managing technical debt, code reviews, team collaboration, sprint planning, incident response, architecture decisions, etc.

Lecture Content: {{lectureContent}}

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
    ]
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
    "expected_outcome_2": "Second expected positive business outcome"
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
    "system_outcome_2": "Second system outcome"
  }
}

Focus on real scenarios junior developers encounter: production incidents, feature planning, code reviews, technical debt decisions, system design, debugging complex issues, sprint planning, team collaboration challenges, etc.'
WHERE prompt_name = 'orchestrated-game-suite-prompt' AND is_active = true;

-- Insert the prompt if it doesn't exist
INSERT INTO ai_prompts (prompt_name, prompt_template, is_active, variables, usage_count) 
SELECT 'orchestrated-game-suite-prompt', 
'You are an expert game designer creating learning experiences for software engineers in their first 0-7 years of professional experience. Generate a coordinated suite of three CONNECTION-BASED puzzle games that help junior developers practice critical thinking through REAL-WORLD SOFTWARE ENGINEERING scenarios.

**TARGET AUDIENCE:** Junior software engineers (0-7 years experience) working in tech companies, startups, or product teams.

**CONTEXT:** Create scenarios that junior developers actually face - debugging production issues, planning feature releases, managing technical debt, code reviews, team collaboration, sprint planning, incident response, architecture decisions, etc.

Lecture Content: {{lectureContent}}

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
    "suboptimal_outcome": "Outcome when key technical connections are missed"
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
    "expected_outcome_2": "Second expected positive business outcome"
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
    "system_outcome_2": "Second system outcome"
  }
}

Focus on real scenarios junior developers encounter: production incidents, feature planning, code reviews, technical debt decisions, system design, debugging complex issues, sprint planning, team collaboration challenges, etc.',
true, 
'{"lectureContent": "string"}', 
0
WHERE NOT EXISTS (
  SELECT 1 FROM ai_prompts WHERE prompt_name = 'orchestrated-game-suite-prompt' AND is_active = true
);