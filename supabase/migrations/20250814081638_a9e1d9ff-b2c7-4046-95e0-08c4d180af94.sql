-- Update Problem Analysis Web template with complex 18-node structure
UPDATE game_templates 
SET 
  template_name = 'Problem Analysis Web',
  node_count = 18,
  template_data = '{
    "nodes": [
      {"id": "problem_1", "position": {"x": 300, "y": 50}, "data": {"label": "Core Problem: [AI_GENERATED]", "nodeType": "problem", "points": 5}},
      {"id": "symptom_1", "position": {"x": 100, "y": 150}, "data": {"label": "Symptom: [AI_GENERATED]", "nodeType": "symptom", "points": 2}},
      {"id": "symptom_2", "position": {"x": 200, "y": 150}, "data": {"label": "Symptom: [AI_GENERATED]", "nodeType": "symptom", "points": 2}},
      {"id": "symptom_3", "position": {"x": 400, "y": 150}, "data": {"label": "Symptom: [AI_GENERATED]", "nodeType": "symptom", "points": 2}},
      {"id": "symptom_4", "position": {"x": 500, "y": 150}, "data": {"label": "Symptom: [AI_GENERATED]", "nodeType": "symptom", "points": 2}},
      
      {"id": "root_cause_1", "position": {"x": 50, "y": 250}, "data": {"label": "Root Cause: [AI_GENERATED]", "nodeType": "root_cause", "points": 8}},
      {"id": "root_cause_2", "position": {"x": 200, "y": 250}, "data": {"label": "Root Cause: [AI_GENERATED]", "nodeType": "root_cause", "points": 8}},
      {"id": "root_cause_3", "position": {"x": 350, "y": 250}, "data": {"label": "Root Cause: [AI_GENERATED]", "nodeType": "root_cause", "points": 8}},
      {"id": "root_cause_4", "position": {"x": 500, "y": 250}, "data": {"label": "Root Cause: [AI_GENERATED]", "nodeType": "root_cause", "points": 8}},
      
      {"id": "impact_1", "position": {"x": 100, "y": 350}, "data": {"label": "Impact: [AI_GENERATED]", "nodeType": "impact", "points": 3}},
      {"id": "impact_2", "position": {"x": 250, "y": 350}, "data": {"label": "Impact: [AI_GENERATED]", "nodeType": "impact", "points": 3}},
      {"id": "impact_3", "position": {"x": 400, "y": 350}, "data": {"label": "Impact: [AI_GENERATED]", "nodeType": "impact", "points": 3}},
      
      {"id": "solution_1", "position": {"x": 50, "y": 450}, "data": {"label": "Solution Strategy: [AI_GENERATED]", "nodeType": "solution", "points": 10}},
      {"id": "solution_2", "position": {"x": 200, "y": 450}, "data": {"label": "Solution Strategy: [AI_GENERATED]", "nodeType": "solution", "points": 10}},
      {"id": "solution_3", "position": {"x": 350, "y": 450}, "data": {"label": "Solution Strategy: [AI_GENERATED]", "nodeType": "solution", "points": 10}},
      {"id": "solution_4", "position": {"x": 500, "y": 450}, "data": {"label": "Solution Strategy: [AI_GENERATED]", "nodeType": "solution", "points": 10}},
      
      {"id": "outcome_1", "position": {"x": 200, "y": 550}, "data": {"label": "Expected Outcome: [AI_GENERATED]", "nodeType": "outcome", "points": 5}},
      {"id": "outcome_2", "position": {"x": 400, "y": 550}, "data": {"label": "Expected Outcome: [AI_GENERATED]", "nodeType": "outcome", "points": 5}}
    ],
    "edges": [],
    "instructorSolution": [],
    "connectionRules": [],
    "wrongConnections": []
  }'
WHERE template_name = 'Problem Analysis Web';

-- Update System Mapping template with complex 20-node structure  
UPDATE game_templates 
SET 
  template_name = 'System Mapping',
  node_count = 20,
  template_data = '{
    "nodes": [
      {"id": "system_core", "position": {"x": 300, "y": 250}, "data": {"label": "System Core: [AI_GENERATED]", "nodeType": "system_core", "points": 8}},
      
      {"id": "input_1", "position": {"x": 50, "y": 100}, "data": {"label": "Input: [AI_GENERATED]", "nodeType": "input", "points": 3}},
      {"id": "input_2", "position": {"x": 150, "y": 80}, "data": {"label": "Input: [AI_GENERATED]", "nodeType": "input", "points": 3}},
      {"id": "input_3", "position": {"x": 100, "y": 150}, "data": {"label": "Input: [AI_GENERATED]", "nodeType": "input", "points": 3}},
      
      {"id": "process_1", "position": {"x": 150, "y": 200}, "data": {"label": "Process: [AI_GENERATED]", "nodeType": "process", "points": 5}},
      {"id": "process_2", "position": {"x": 200, "y": 300}, "data": {"label": "Process: [AI_GENERATED]", "nodeType": "process", "points": 5}},
      {"id": "process_3", "position": {"x": 400, "y": 200}, "data": {"label": "Process: [AI_GENERATED]", "nodeType": "process", "points": 5}},
      {"id": "process_4", "position": {"x": 450, "y": 300}, "data": {"label": "Process: [AI_GENERATED]", "nodeType": "process", "points": 5}},
      
      {"id": "output_1", "position": {"x": 550, "y": 100}, "data": {"label": "Output: [AI_GENERATED]", "nodeType": "output", "points": 4}},
      {"id": "output_2", "position": {"x": 500, "y": 150}, "data": {"label": "Output: [AI_GENERATED]", "nodeType": "output", "points": 4}},
      {"id": "output_3", "position": {"x": 600, "y": 200}, "data": {"label": "Output: [AI_GENERATED]", "nodeType": "output", "points": 4}},
      
      {"id": "feedback_1", "position": {"x": 350, "y": 350}, "data": {"label": "Feedback Loop: [AI_GENERATED]", "nodeType": "feedback", "points": 6}},
      {"id": "feedback_2", "position": {"x": 250, "y": 380}, "data": {"label": "Feedback Loop: [AI_GENERATED]", "nodeType": "feedback", "points": 6}},
      
      {"id": "constraint_1", "position": {"x": 100, "y": 50}, "data": {"label": "Constraint: [AI_GENERATED]", "nodeType": "constraint", "points": 4}},
      {"id": "constraint_2", "position": {"x": 500, "y": 50}, "data": {"label": "Constraint: [AI_GENERATED]", "nodeType": "constraint", "points": 4}},
      {"id": "constraint_3", "position": {"x": 300, "y": 400}, "data": {"label": "Constraint: [AI_GENERATED]", "nodeType": "constraint", "points": 4}},
      
      {"id": "stakeholder_1", "position": {"x": 50, "y": 300}, "data": {"label": "Stakeholder: [AI_GENERATED]", "nodeType": "stakeholder", "points": 3}},
      {"id": "stakeholder_2", "position": {"x": 550, "y": 300}, "data": {"label": "Stakeholder: [AI_GENERATED]", "nodeType": "stakeholder", "points": 3}},
      
      {"id": "outcome_1", "position": {"x": 200, "y": 450}, "data": {"label": "System Outcome: [AI_GENERATED]", "nodeType": "outcome", "points": 5}},
      {"id": "outcome_2", "position": {"x": 400, "y": 450}, "data": {"label": "System Outcome: [AI_GENERATED]", "nodeType": "outcome", "points": 5}}
    ],
    "edges": [],
    "instructorSolution": [],
    "connectionRules": [],
    "wrongConnections": []
  }'
WHERE template_name = 'System Mapping';