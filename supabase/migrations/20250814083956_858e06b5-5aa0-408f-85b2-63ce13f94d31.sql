-- Revert Problem Analysis Web and System Mapping templates to use proper AI generation with placeholders
UPDATE game_templates 
SET 
  template_data = '{
    "nodes": [
      {"id": "problem_1", "position": {"x": 300, "y": 50}, "data": {"label": "{{central_problem}}", "nodeType": "problem", "points": 5}},
      {"id": "symptom_1", "position": {"x": 100, "y": 150}, "data": {"label": "Symptom: {{symptom_1}}", "nodeType": "symptom", "points": 2}},
      {"id": "symptom_2", "position": {"x": 200, "y": 150}, "data": {"label": "Symptom: {{symptom_2}}", "nodeType": "symptom", "points": 2}},
      {"id": "symptom_3", "position": {"x": 400, "y": 150}, "data": {"label": "Symptom: {{symptom_3}}", "nodeType": "symptom", "points": 2}},
      {"id": "symptom_4", "position": {"x": 500, "y": 150}, "data": {"label": "Symptom: {{symptom_4}}", "nodeType": "symptom", "points": 2}},
      
      {"id": "root_cause_1", "position": {"x": 50, "y": 250}, "data": {"label": "Root Cause: {{root_cause_1}}", "nodeType": "root_cause", "points": 8}},
      {"id": "root_cause_2", "position": {"x": 200, "y": 250}, "data": {"label": "Root Cause: {{root_cause_2}}", "nodeType": "root_cause", "points": 8}},
      {"id": "root_cause_3", "position": {"x": 350, "y": 250}, "data": {"label": "Root Cause: {{root_cause_3}}", "nodeType": "root_cause", "points": 8}},
      {"id": "root_cause_4", "position": {"x": 500, "y": 250}, "data": {"label": "Root Cause: {{root_cause_4}}", "nodeType": "root_cause", "points": 8}},
      
      {"id": "impact_1", "position": {"x": 100, "y": 350}, "data": {"label": "Impact: {{impact_1}}", "nodeType": "impact", "points": 3}},
      {"id": "impact_2", "position": {"x": 250, "y": 350}, "data": {"label": "Impact: {{impact_2}}", "nodeType": "impact", "points": 3}},
      {"id": "impact_3", "position": {"x": 400, "y": 350}, "data": {"label": "Impact: {{impact_3}}", "nodeType": "impact", "points": 3}},
      
      {"id": "solution_1", "position": {"x": 50, "y": 450}, "data": {"label": "Solution: {{solution_1}}", "nodeType": "solution", "points": 10}},
      {"id": "solution_2", "position": {"x": 200, "y": 450}, "data": {"label": "Solution: {{solution_2}}", "nodeType": "solution", "points": 10}},
      {"id": "solution_3", "position": {"x": 350, "y": 450}, "data": {"label": "Solution: {{solution_3}}", "nodeType": "solution", "points": 10}},
      {"id": "solution_4", "position": {"x": 500, "y": 450}, "data": {"label": "Solution: {{solution_4}}", "nodeType": "solution", "points": 10}},
      
      {"id": "outcome_1", "position": {"x": 200, "y": 550}, "data": {"label": "Expected: {{expected_outcome_1}}", "nodeType": "outcome", "points": 5}},
      {"id": "outcome_2", "position": {"x": 400, "y": 550}, "data": {"label": "Expected: {{expected_outcome_2}}", "nodeType": "outcome", "points": 5}}
    ],
    "edges": [],
    "instructorSolution": [],
    "connectionRules": [
      {"from": "problem", "to": ["symptom"], "points": 3},
      {"from": "symptom", "to": ["root_cause"], "points": 5},
      {"from": "root_cause", "to": ["impact", "solution"], "points": 8},
      {"from": "solution", "to": ["outcome"], "points": 10}
    ],
    "wrongConnections": []
  }',
  content_slots = '["central_problem", "symptom_1", "symptom_2", "symptom_3", "symptom_4", "root_cause_1", "root_cause_2", "root_cause_3", "root_cause_4", "impact_1", "impact_2", "impact_3", "solution_1", "solution_2", "solution_3", "solution_4", "expected_outcome_1", "expected_outcome_2"]'::jsonb
WHERE name = 'Problem Analysis Web';

-- Update System Mapping template
UPDATE game_templates 
SET 
  template_data = '{
    "nodes": [
      {"id": "system_core", "position": {"x": 300, "y": 250}, "data": {"label": "System Core: {{system_core}}", "nodeType": "system_core", "points": 8}},
      
      {"id": "input_1", "position": {"x": 50, "y": 100}, "data": {"label": "Input: {{input_1}}", "nodeType": "input", "points": 3}},
      {"id": "input_2", "position": {"x": 150, "y": 80}, "data": {"label": "Input: {{input_2}}", "nodeType": "input", "points": 3}},
      {"id": "input_3", "position": {"x": 100, "y": 150}, "data": {"label": "Input: {{input_3}}", "nodeType": "input", "points": 3}},
      
      {"id": "process_1", "position": {"x": 150, "y": 200}, "data": {"label": "Process: {{process_1}}", "nodeType": "process", "points": 5}},
      {"id": "process_2", "position": {"x": 200, "y": 300}, "data": {"label": "Process: {{process_2}}", "nodeType": "process", "points": 5}},
      {"id": "process_3", "position": {"x": 400, "y": 200}, "data": {"label": "Process: {{process_3}}", "nodeType": "process", "points": 5}},
      {"id": "process_4", "position": {"x": 450, "y": 300}, "data": {"label": "Process: {{process_4}}", "nodeType": "process", "points": 5}},
      
      {"id": "output_1", "position": {"x": 550, "y": 100}, "data": {"label": "Output: {{output_1}}", "nodeType": "output", "points": 4}},
      {"id": "output_2", "position": {"x": 500, "y": 150}, "data": {"label": "Output: {{output_2}}", "nodeType": "output", "points": 4}},
      {"id": "output_3", "position": {"x": 600, "y": 200}, "data": {"label": "Output: {{output_3}}", "nodeType": "output", "points": 4}},
      
      {"id": "feedback_1", "position": {"x": 350, "y": 350}, "data": {"label": "Feedback: {{feedback_1}}", "nodeType": "feedback", "points": 6}},
      {"id": "feedback_2", "position": {"x": 250, "y": 380}, "data": {"label": "Feedback: {{feedback_2}}", "nodeType": "feedback", "points": 6}},
      
      {"id": "constraint_1", "position": {"x": 100, "y": 50}, "data": {"label": "Constraint: {{constraint_1}}", "nodeType": "constraint", "points": 4}},
      {"id": "constraint_2", "position": {"x": 500, "y": 50}, "data": {"label": "Constraint: {{constraint_2}}", "nodeType": "constraint", "points": 4}},
      {"id": "constraint_3", "position": {"x": 300, "y": 400}, "data": {"label": "Constraint: {{constraint_3}}", "nodeType": "constraint", "points": 4}},
      
      {"id": "stakeholder_1", "position": {"x": 50, "y": 300}, "data": {"label": "Stakeholder: {{stakeholder_1}}", "nodeType": "stakeholder", "points": 3}},
      {"id": "stakeholder_2", "position": {"x": 550, "y": 300}, "data": {"label": "Stakeholder: {{stakeholder_2}}", "nodeType": "stakeholder", "points": 3}},
      
      {"id": "outcome_1", "position": {"x": 200, "y": 450}, "data": {"label": "Outcome: {{system_outcome_1}}", "nodeType": "outcome", "points": 5}},
      {"id": "outcome_2", "position": {"x": 400, "y": 450}, "data": {"label": "Outcome: {{system_outcome_2}}", "nodeType": "outcome", "points": 5}}
    ],
    "edges": [],
    "instructorSolution": [],
    "connectionRules": [
      {"from": "input", "to": ["process"], "points": 4},
      {"from": "process", "to": ["system_core", "output"], "points": 6},
      {"from": "system_core", "to": ["process", "output"], "points": 8},
      {"from": "output", "to": ["feedback", "outcome"], "points": 5},
      {"from": "feedback", "to": ["process"], "points": 7},
      {"from": "constraint", "to": ["process", "output"], "points": 3},
      {"from": "stakeholder", "to": ["system_core", "outcome"], "points": 4}
    ],
    "wrongConnections": []
  }',
  content_slots = '["system_core", "input_1", "input_2", "input_3", "process_1", "process_2", "process_3", "process_4", "output_1", "output_2", "output_3", "feedback_1", "feedback_2", "constraint_1", "constraint_2", "constraint_3", "stakeholder_1", "stakeholder_2", "system_outcome_1", "system_outcome_2"]'::jsonb
WHERE name = 'System Mapping';