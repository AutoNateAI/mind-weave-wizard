-- Update Problem Analysis Web template with actual content instead of placeholders
UPDATE game_templates 
SET 
  template_data = '{
    "nodes": [
      {"id": "problem_1", "position": {"x": 300, "y": 50}, "data": {"label": "Core Problem: Declining Team Productivity", "nodeType": "problem", "points": 5}},
      {"id": "symptom_1", "position": {"x": 100, "y": 150}, "data": {"label": "Symptom: Missed Deadlines", "nodeType": "symptom", "points": 2}},
      {"id": "symptom_2", "position": {"x": 200, "y": 150}, "data": {"label": "Symptom: Low Morale", "nodeType": "symptom", "points": 2}},
      {"id": "symptom_3", "position": {"x": 400, "y": 150}, "data": {"label": "Symptom: Poor Communication", "nodeType": "symptom", "points": 2}},
      {"id": "symptom_4", "position": {"x": 500, "y": 150}, "data": {"label": "Symptom: Quality Issues", "nodeType": "symptom", "points": 2}},
      
      {"id": "root_cause_1", "position": {"x": 50, "y": 250}, "data": {"label": "Root Cause: Unclear Priorities", "nodeType": "root_cause", "points": 8}},
      {"id": "root_cause_2", "position": {"x": 200, "y": 250}, "data": {"label": "Root Cause: Inadequate Tools", "nodeType": "root_cause", "points": 8}},
      {"id": "root_cause_3", "position": {"x": 350, "y": 250}, "data": {"label": "Root Cause: Lack of Training", "nodeType": "root_cause", "points": 8}},
      {"id": "root_cause_4", "position": {"x": 500, "y": 250}, "data": {"label": "Root Cause: Overwhelming Workload", "nodeType": "root_cause", "points": 8}},
      
      {"id": "impact_1", "position": {"x": 100, "y": 350}, "data": {"label": "Impact: Client Dissatisfaction", "nodeType": "impact", "points": 3}},
      {"id": "impact_2", "position": {"x": 250, "y": 350}, "data": {"label": "Impact: Revenue Loss", "nodeType": "impact", "points": 3}},
      {"id": "impact_3", "position": {"x": 400, "y": 350}, "data": {"label": "Impact: Team Turnover", "nodeType": "impact", "points": 3}},
      
      {"id": "solution_1", "position": {"x": 50, "y": 450}, "data": {"label": "Solution: Priority Framework", "nodeType": "solution", "points": 10}},
      {"id": "solution_2", "position": {"x": 200, "y": 450}, "data": {"label": "Solution: Tool Upgrade", "nodeType": "solution", "points": 10}},
      {"id": "solution_3", "position": {"x": 350, "y": 450}, "data": {"label": "Solution: Skills Development", "nodeType": "solution", "points": 10}},
      {"id": "solution_4", "position": {"x": 500, "y": 450}, "data": {"label": "Solution: Resource Planning", "nodeType": "solution", "points": 10}},
      
      {"id": "outcome_1", "position": {"x": 200, "y": 550}, "data": {"label": "Expected: Higher Efficiency", "nodeType": "outcome", "points": 5}},
      {"id": "outcome_2", "position": {"x": 400, "y": 550}, "data": {"label": "Expected: Better Quality", "nodeType": "outcome", "points": 5}}
    ],
    "edges": [],
    "instructorSolution": [
      {"source": "problem_1", "target": "symptom_1"},
      {"source": "problem_1", "target": "symptom_2"},
      {"source": "problem_1", "target": "symptom_3"},
      {"source": "problem_1", "target": "symptom_4"},
      {"source": "symptom_1", "target": "root_cause_1"},
      {"source": "symptom_2", "target": "root_cause_3"},
      {"source": "symptom_3", "target": "root_cause_2"},
      {"source": "symptom_4", "target": "root_cause_4"},
      {"source": "root_cause_1", "target": "impact_1"},
      {"source": "root_cause_2", "target": "impact_2"},
      {"source": "root_cause_3", "target": "impact_3"},
      {"source": "root_cause_4", "target": "impact_2"},
      {"source": "root_cause_1", "target": "solution_1"},
      {"source": "root_cause_2", "target": "solution_2"},
      {"source": "root_cause_3", "target": "solution_3"},
      {"source": "root_cause_4", "target": "solution_4"},
      {"source": "solution_1", "target": "outcome_1"},
      {"source": "solution_2", "target": "outcome_2"},
      {"source": "solution_3", "target": "outcome_1"},
      {"source": "solution_4", "target": "outcome_2"}
    ],
    "connectionRules": [
      {"from": "problem", "to": ["symptom"], "points": 3},
      {"from": "symptom", "to": ["root_cause"], "points": 5},
      {"from": "root_cause", "to": ["impact", "solution"], "points": 8},
      {"from": "solution", "to": ["outcome"], "points": 10}
    ],
    "wrongConnections": [
      {"source": "symptom_1", "target": "solution_1", "penalty": -5},
      {"source": "impact_1", "target": "root_cause_1", "penalty": -3},
      {"source": "outcome_1", "target": "problem_1", "penalty": -2}
    ]
  }'
WHERE name = 'Problem Analysis Web';

-- Update System Mapping template with actual content instead of placeholders  
UPDATE game_templates 
SET 
  template_data = '{
    "nodes": [
      {"id": "system_core", "position": {"x": 300, "y": 250}, "data": {"label": "System Core: Project Management", "nodeType": "system_core", "points": 8}},
      
      {"id": "input_1", "position": {"x": 50, "y": 100}, "data": {"label": "Input: Requirements", "nodeType": "input", "points": 3}},
      {"id": "input_2", "position": {"x": 150, "y": 80}, "data": {"label": "Input: Resources", "nodeType": "input", "points": 3}},
      {"id": "input_3", "position": {"x": 100, "y": 150}, "data": {"label": "Input: Team Skills", "nodeType": "input", "points": 3}},
      
      {"id": "process_1", "position": {"x": 150, "y": 200}, "data": {"label": "Process: Planning", "nodeType": "process", "points": 5}},
      {"id": "process_2", "position": {"x": 200, "y": 300}, "data": {"label": "Process: Execution", "nodeType": "process", "points": 5}},
      {"id": "process_3", "position": {"x": 400, "y": 200}, "data": {"label": "Process: Monitoring", "nodeType": "process", "points": 5}},
      {"id": "process_4", "position": {"x": 450, "y": 300}, "data": {"label": "Process: Review", "nodeType": "process", "points": 5}},
      
      {"id": "output_1", "position": {"x": 550, "y": 100}, "data": {"label": "Output: Deliverables", "nodeType": "output", "points": 4}},
      {"id": "output_2", "position": {"x": 500, "y": 150}, "data": {"label": "Output: Reports", "nodeType": "output", "points": 4}},
      {"id": "output_3", "position": {"x": 600, "y": 200}, "data": {"label": "Output: Insights", "nodeType": "output", "points": 4}},
      
      {"id": "feedback_1", "position": {"x": 350, "y": 350}, "data": {"label": "Feedback: Performance Data", "nodeType": "feedback", "points": 6}},
      {"id": "feedback_2", "position": {"x": 250, "y": 380}, "data": {"label": "Feedback: Team Input", "nodeType": "feedback", "points": 6}},
      
      {"id": "constraint_1", "position": {"x": 100, "y": 50}, "data": {"label": "Constraint: Budget Limits", "nodeType": "constraint", "points": 4}},
      {"id": "constraint_2", "position": {"x": 500, "y": 50}, "data": {"label": "Constraint: Time Pressure", "nodeType": "constraint", "points": 4}},
      {"id": "constraint_3", "position": {"x": 300, "y": 400}, "data": {"label": "Constraint: Quality Standards", "nodeType": "constraint", "points": 4}},
      
      {"id": "stakeholder_1", "position": {"x": 50, "y": 300}, "data": {"label": "Stakeholder: Project Team", "nodeType": "stakeholder", "points": 3}},
      {"id": "stakeholder_2", "position": {"x": 550, "y": 300}, "data": {"label": "Stakeholder: Clients", "nodeType": "stakeholder", "points": 3}},
      
      {"id": "outcome_1", "position": {"x": 200, "y": 450}, "data": {"label": "Outcome: Project Success", "nodeType": "outcome", "points": 5}},
      {"id": "outcome_2", "position": {"x": 400, "y": 450}, "data": {"label": "Outcome: Stakeholder Satisfaction", "nodeType": "outcome", "points": 5}}
    ],
    "edges": [],
    "instructorSolution": [
      {"source": "input_1", "target": "process_1"},
      {"source": "input_2", "target": "process_1"},
      {"source": "input_3", "target": "process_2"},
      {"source": "process_1", "target": "system_core"},
      {"source": "process_2", "target": "system_core"},
      {"source": "system_core", "target": "process_3"},
      {"source": "system_core", "target": "process_4"},
      {"source": "process_3", "target": "output_1"},
      {"source": "process_4", "target": "output_2"},
      {"source": "output_1", "target": "output_3"},
      {"source": "output_2", "target": "feedback_1"},
      {"source": "output_3", "target": "feedback_2"},
      {"source": "feedback_1", "target": "process_1"},
      {"source": "feedback_2", "target": "process_2"},
      {"source": "constraint_1", "target": "process_1"},
      {"source": "constraint_2", "target": "process_3"},
      {"source": "constraint_3", "target": "output_1"},
      {"source": "stakeholder_1", "target": "system_core"},
      {"source": "stakeholder_2", "target": "outcome_2"},
      {"source": "output_1", "target": "outcome_1"},
      {"source": "output_2", "target": "outcome_1"},
      {"source": "feedback_1", "target": "outcome_2"}
    ],
    "connectionRules": [
      {"from": "input", "to": ["process"], "points": 4},
      {"from": "process", "to": ["system_core", "output"], "points": 6},
      {"from": "system_core", "to": ["process", "output"], "points": 8},
      {"from": "output", "to": ["feedback", "outcome"], "points": 5},
      {"from": "feedback", "to": ["process"], "points": 7},
      {"from": "constraint", "to": ["process", "output"], "points": 3},
      {"from": "stakeholder", "to": ["system_core", "outcome"], "points": 4}
    ],
    "wrongConnections": [
      {"source": "output_1", "target": "input_1", "penalty": -4},
      {"source": "constraint_1", "target": "outcome_1", "penalty": -3},
      {"source": "feedback_1", "target": "constraint_1", "penalty": -2}
    ]
  }'
WHERE name = 'System Mapping';