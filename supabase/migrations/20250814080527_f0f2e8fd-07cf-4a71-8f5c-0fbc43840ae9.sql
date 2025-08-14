-- Update Critical Decision Path template with complex 20-node hierarchical structure
UPDATE game_templates 
SET template_data = '{
  "nodes": [
    {"id": "scenario", "data": {"type": "scenario", "label": "{{scenario_description}}"}, "type": "scenario", "position": {"x": 400, "y": 50}},
    
    {"id": "context1", "data": {"type": "context", "label": "{{context_factor_1}}"}, "type": "information", "position": {"x": 200, "y": 150}},
    {"id": "context2", "data": {"type": "context", "label": "{{context_factor_2}}"}, "type": "information", "position": {"x": 600, "y": 150}},
    {"id": "stakes", "data": {"type": "stakes", "label": "{{stakes_description}}"}, "type": "information", "position": {"x": 400, "y": 150}},
    
    {"id": "resource1", "data": {"type": "resource", "label": "{{resource_constraint_1}}"}, "type": "information", "position": {"x": 100, "y": 250}},
    {"id": "resource2", "data": {"type": "resource", "label": "{{resource_constraint_2}}"}, "type": "information", "position": {"x": 300, "y": 250}},
    {"id": "resource3", "data": {"type": "resource", "label": "{{resource_constraint_3}}"}, "type": "information", "position": {"x": 500, "y": 250}},
    {"id": "resource4", "data": {"type": "resource", "label": "{{resource_constraint_4}}"}, "type": "information", "position": {"x": 700, "y": 250}},
    
    {"id": "decision1", "data": {"type": "decision", "label": "{{primary_decision_1}}"}, "type": "decision", "position": {"x": 200, "y": 350}},
    {"id": "decision2", "data": {"type": "decision", "label": "{{primary_decision_2}}"}, "type": "decision", "position": {"x": 600, "y": 350}},
    
    {"id": "consequence1a", "data": {"type": "consequence", "label": "{{consequence_1a}}"}, "type": "outcome", "position": {"x": 100, "y": 450}},
    {"id": "consequence1b", "data": {"type": "consequence", "label": "{{consequence_1b}}"}, "type": "outcome", "position": {"x": 300, "y": 450}},
    {"id": "consequence2a", "data": {"type": "consequence", "label": "{{consequence_2a}}"}, "type": "outcome", "position": {"x": 500, "y": 450}},
    {"id": "consequence2b", "data": {"type": "consequence", "label": "{{consequence_2b}}"}, "type": "outcome", "position": {"x": 700, "y": 450}},
    
    {"id": "stakeholder1", "data": {"type": "stakeholder", "label": "{{stakeholder_impact_1}}"}, "type": "outcome", "position": {"x": 150, "y": 550}},
    {"id": "stakeholder2", "data": {"type": "stakeholder", "label": "{{stakeholder_impact_2}}"}, "type": "outcome", "position": {"x": 350, "y": 550}},
    {"id": "stakeholder3", "data": {"type": "stakeholder", "label": "{{stakeholder_impact_3}}"}, "type": "outcome", "position": {"x": 450, "y": 550}},
    {"id": "stakeholder4", "data": {"type": "stakeholder", "label": "{{stakeholder_impact_4}}"}, "type": "outcome", "position": {"x": 650, "y": 550}},
    
    {"id": "outcome_optimal", "data": {"type": "outcome", "label": "{{optimal_outcome}}"}, "type": "result", "position": {"x": 300, "y": 650}},
    {"id": "outcome_suboptimal", "data": {"type": "outcome", "label": "{{suboptimal_outcome}}"}, "type": "result", "position": {"x": 500, "y": 650}}
  ],
  "edges": [],
  "instructorSolution": [
    {"source": "scenario", "target": "context1", "relationship": "requires understanding"},
    {"source": "scenario", "target": "stakes", "relationship": "establishes"},
    {"source": "context1", "target": "resource1", "relationship": "constrains"},
    {"source": "context2", "target": "resource2", "relationship": "constrains"},
    {"source": "stakes", "target": "decision1", "relationship": "influences"},
    {"source": "resource1", "target": "decision1", "relationship": "limits"},
    {"source": "resource2", "target": "decision2", "relationship": "limits"},
    {"source": "decision1", "target": "consequence1a", "relationship": "leads to"},
    {"source": "decision2", "target": "consequence2a", "relationship": "leads to"},
    {"source": "consequence1a", "target": "stakeholder1", "relationship": "impacts"},
    {"source": "consequence2a", "target": "stakeholder2", "relationship": "impacts"},
    {"source": "stakeholder1", "target": "outcome_optimal", "relationship": "enables"},
    {"source": "stakeholder2", "target": "outcome_optimal", "relationship": "enables"}
  ],
  "connectionRules": [
    "Scenario must connect to context and stakes before decisions",
    "All resource constraints must be considered in decisions", 
    "Decisions must connect to appropriate consequences",
    "Consequences must connect to stakeholder impacts",
    "Multiple stakeholder impacts required for optimal outcome"
  ],
  "wrongConnections": [
    {"source": "scenario", "target": "decision1", "why_wrong": "Decisions cannot be made without understanding context and resources"},
    {"source": "decision1", "target": "outcome_optimal", "why_wrong": "Decisions must go through consequences and stakeholder impacts first"},
    {"source": "resource1", "target": "stakeholder1", "why_wrong": "Resources don''t directly impact stakeholders without decisions"}
  ]
}'::jsonb,
content_slots = '[
  {"name": "scenario_description", "type": "text", "description": "Complex scenario requiring strategic thinking"},
  {"name": "context_factor_1", "type": "text", "description": "First contextual factor that influences decisions"},
  {"name": "context_factor_2", "type": "text", "description": "Second contextual factor that influences decisions"},
  {"name": "stakes_description", "type": "text", "description": "What is at stake in this scenario"},
  {"name": "resource_constraint_1", "type": "text", "description": "Time limitation (specific constraint)"},
  {"name": "resource_constraint_2", "type": "text", "description": "Budget limitation (specific constraint)"},
  {"name": "resource_constraint_3", "type": "text", "description": "Personnel limitation (specific constraint)"},
  {"name": "resource_constraint_4", "type": "text", "description": "Reputation/trust limitation (specific constraint)"},
  {"name": "primary_decision_1", "type": "text", "description": "First major decision point with trade-offs"},
  {"name": "primary_decision_2", "type": "text", "description": "Second major decision point with trade-offs"},
  {"name": "consequence_1a", "type": "text", "description": "Consequence of first decision path A"},
  {"name": "consequence_1b", "type": "text", "description": "Consequence of first decision path B"},
  {"name": "consequence_2a", "type": "text", "description": "Consequence of second decision path A"},
  {"name": "consequence_2b", "type": "text", "description": "Consequence of second decision path B"},
  {"name": "stakeholder_impact_1", "type": "text", "description": "Impact on first stakeholder group"},
  {"name": "stakeholder_impact_2", "type": "text", "description": "Impact on second stakeholder group"},
  {"name": "stakeholder_impact_3", "type": "text", "description": "Impact on third stakeholder group"},
  {"name": "stakeholder_impact_4", "type": "text", "description": "Impact on fourth stakeholder group"},
  {"name": "optimal_outcome", "type": "text", "description": "Best possible outcome considering all factors"},
  {"name": "suboptimal_outcome", "type": "text", "description": "Outcome when key connections are missed"}
]'::jsonb,
description = 'Complex hierarchical decision-making scenario requiring strategic thinking about resources, stakeholders, and consequences. Players must wire together 20 nodes representing the full decision ecosystem from context through final outcomes.'
WHERE name = 'Critical Decision Path';