-- Create table for capturing public game leads
CREATE TABLE public.public_game_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  game_template_id uuid NOT NULL,
  game_title text NOT NULL,
  completion_score numeric,
  analytics_data jsonb DEFAULT '{}',
  completion_time_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.public_game_leads ENABLE ROW LEVEL SECURITY;

-- Create policy for lead capture (public can insert)
CREATE POLICY "Anyone can create game leads" 
ON public.public_game_leads 
FOR INSERT 
WITH CHECK (true);

-- Admin can view all leads
CREATE POLICY "Admin can view all game leads" 
ON public.public_game_leads 
FOR SELECT 
USING (COALESCE((auth.jwt() ->> 'email'::text), ''::text) = 'admin@gmail.com'::text);

-- Insert AI Agent Architecture Challenge game template
INSERT INTO public.game_templates (
  name,
  description,
  category,
  content_slots,
  mechanics,
  template_data,
  validation_rules,
  win_conditions,
  heuristic_targets
) VALUES (
  'AI Agent Architecture Challenge',
  'Navigate the complexities of building an agentic AI system that can autonomously handle customer support, from planning to deployment.',
  'ai-engineering',
  '[
    {"name": "scenario_description", "type": "text", "description": "The AI agent system challenge scenario"},
    {"name": "requirement_1", "type": "text", "description": "Core functional requirement"},
    {"name": "requirement_2", "type": "text", "description": "Performance requirement"},
    {"name": "requirement_3", "type": "text", "description": "Integration requirement"},
    {"name": "architecture_option_1", "type": "text", "description": "Microservices architecture approach"},
    {"name": "architecture_option_2", "type": "text", "description": "Monolithic architecture approach"},
    {"name": "tool_selection_1", "type": "text", "description": "LLM selection decision"},
    {"name": "tool_selection_2", "type": "text", "description": "Vector database selection"},
    {"name": "tool_selection_3", "type": "text", "description": "Orchestration framework choice"},
    {"name": "integration_challenge_1", "type": "text", "description": "API integration complexity"},
    {"name": "integration_challenge_2", "type": "text", "description": "Data pipeline challenges"},
    {"name": "performance_concern_1", "type": "text", "description": "Latency requirements"},
    {"name": "performance_concern_2", "type": "text", "description": "Cost optimization needs"},
    {"name": "deployment_strategy", "type": "text", "description": "Production deployment approach"},
    {"name": "monitoring_setup", "type": "text", "description": "Observability and monitoring strategy"},
    {"name": "success_outcome", "type": "text", "description": "Optimal system performance"},
    {"name": "failure_outcome", "type": "text", "description": "System failure consequences"}
  ]',
  '{
    "interaction_type": "connection_based",
    "scoring": "architecture_quality",
    "validation": "system_coherence",
    "hints": [
      "Consider the data flow between components",
      "Think about scaling bottlenecks",
      "Evaluate integration complexity"
    ]
  }',
  '{
    "nodes": [
      {"id": "scenario", "type": "scenario", "position": {"x": 400, "y": 50}, "data": {"label": "Your startup needs an AI agent that can handle 10,000+ customer support tickets daily, escalating complex issues to humans while maintaining 95% accuracy.", "type": "scenario"}},
      {"id": "req1", "type": "information", "position": {"x": 200, "y": 150}, "data": {"label": "Must handle multi-turn conversations with context retention across sessions", "type": "requirement"}},
      {"id": "req2", "type": "information", "position": {"x": 400, "y": 150}, "data": {"label": "Response time under 2 seconds with 99.9% uptime SLA", "type": "requirement"}},
      {"id": "req3", "type": "information", "position": {"x": 600, "y": 150}, "data": {"label": "Integrate with existing CRM, ticketing system, and knowledge base", "type": "requirement"}},
      {"id": "arch1", "type": "decision", "position": {"x": 150, "y": 250}, "data": {"label": "Microservices: Separate services for NLP, context management, and integrations", "type": "architecture"}},
      {"id": "arch2", "type": "decision", "position": {"x": 650, "y": 250}, "data": {"label": "Monolithic: Single service handling all agent functions", "type": "architecture"}},
      {"id": "tool1", "type": "decision", "position": {"x": 100, "y": 350}, "data": {"label": "GPT-4 via OpenAI API with function calling capabilities", "type": "tool"}},
      {"id": "tool2", "type": "decision", "position": {"x": 300, "y": 350}, "data": {"label": "Pinecone vector database for semantic search and RAG", "type": "tool"}},
      {"id": "tool3", "type": "decision", "position": {"x": 500, "y": 350}, "data": {"label": "LangGraph for complex agent workflow orchestration", "type": "tool"}},
      {"id": "integration1", "type": "information", "position": {"x": 200, "y": 450}, "data": {"label": "REST API complexity with rate limiting and authentication", "type": "challenge"}},
      {"id": "integration2", "type": "information", "position": {"x": 600, "y": 450}, "data": {"label": "Real-time data synchronization across multiple systems", "type": "challenge"}},
      {"id": "perf1", "type": "information", "position": {"x": 150, "y": 550}, "data": {"label": "Sub-2-second response requires optimized prompt caching", "type": "performance"}},
      {"id": "perf2", "type": "information", "position": {"x": 650, "y": 550}, "data": {"label": "10,000 daily tickets = $2000+ monthly in API costs", "type": "performance"}},
      {"id": "deployment", "type": "decision", "position": {"x": 300, "y": 650}, "data": {"label": "Kubernetes deployment with auto-scaling and circuit breakers", "type": "deployment"}},
      {"id": "monitoring", "type": "decision", "position": {"x": 500, "y": 650}, "data": {"label": "Comprehensive logging: conversation flows, API latency, error rates", "type": "monitoring"}},
      {"id": "success", "type": "outcome", "position": {"x": 250, "y": 750}, "data": {"label": "Agent handles 95%+ tickets automatically, customers satisfied, costs under control", "type": "success"}},
      {"id": "failure", "type": "outcome", "position": {"x": 550, "y": 750}, "data": {"label": "System crashes under load, customers frustrated, manual escalation chaos", "type": "failure"}}
    ],
    "edges": [],
    "instructorSolution": [
      {"source": "scenario", "target": "req1", "relationship": "defines"},
      {"source": "scenario", "target": "req2", "relationship": "defines"},
      {"source": "scenario", "target": "req3", "relationship": "defines"},
      {"source": "req1", "target": "arch1", "relationship": "influences"},
      {"source": "req2", "target": "arch2", "relationship": "influences"},
      {"source": "arch1", "target": "tool1", "relationship": "requires"},
      {"source": "arch1", "target": "tool2", "relationship": "requires"},
      {"source": "arch1", "target": "tool3", "relationship": "requires"},
      {"source": "tool1", "target": "integration1", "relationship": "creates"},
      {"source": "req3", "target": "integration2", "relationship": "creates"},
      {"source": "req2", "target": "perf1", "relationship": "demands"},
      {"source": "scenario", "target": "perf2", "relationship": "implies"},
      {"source": "arch1", "target": "deployment", "relationship": "enables"},
      {"source": "tool3", "target": "monitoring", "relationship": "enables"},
      {"source": "deployment", "target": "success", "relationship": "leads_to"},
      {"source": "monitoring", "target": "success", "relationship": "ensures"},
      {"source": "perf1", "target": "failure", "relationship": "risks"}
    ],
    "connectionRules": [
      "Scenario must connect to all requirements",
      "Requirements should influence architecture decisions",
      "Architecture choices must connect to specific tools",
      "Tool selections create integration challenges",
      "Performance concerns must be addressed",
      "Deployment and monitoring are essential for success"
    ]
  }',
  '{}',
  '{
    "completion_threshold": 0.75,
    "required_connections": 12,
    "success_criteria": ["All critical paths connected", "Architecture coherence maintained", "Performance concerns addressed"]
  }',
  '["Systems Thinking", "Architecture Design", "Performance Optimization", "Integration Strategy"]'
);

-- Insert Prompt Engineering Crisis game template
INSERT INTO public.game_templates (
  name,
  description,
  category,
  content_slots,
  mechanics,
  template_data,
  validation_rules,
  win_conditions,
  heuristic_targets
) VALUES (
  'The Prompt Engineering Crisis',
  'A critical prompt is failing in production, causing AI-generated content to miss the mark. Navigate the complexities of prompt optimization under pressure.',
  'ai-engineering',
  '[]',
  '{
    "interaction_type": "connection_based",
    "scoring": "optimization_quality",
    "validation": "prompt_coherence",
    "hints": [
      "Consider the prompt structure and context",
      "Think about edge cases and failure modes",
      "Evaluate testing and validation strategies"
    ]
  }',
  '{
    "nodes": [
      {"id": "crisis", "type": "scenario", "position": {"x": 400, "y": 50}, "data": {"label": "Your AI-powered content generation system is producing off-brand responses. Customer complaints are flooding in. The prompt worked in testing but fails at scale.", "type": "scenario"}},
      {"id": "symptom1", "type": "information", "position": {"x": 200, "y": 150}, "data": {"label": "AI responses lack brand voice and tone consistency", "type": "symptom"}},
      {"id": "symptom2", "type": "information", "position": {"x": 400, "y": 150}, "data": {"label": "Hallucinations appearing in 15% of responses", "type": "symptom"}},
      {"id": "symptom3", "type": "information", "position": {"x": 600, "y": 150}, "data": {"label": "Response quality degrades with longer conversations", "type": "symptom"}},
      {"id": "analysis1", "type": "decision", "position": {"x": 150, "y": 250}, "data": {"label": "Analyze prompt structure: missing context window management", "type": "analysis"}},
      {"id": "analysis2", "type": "decision", "position": {"x": 400, "y": 250}, "data": {"label": "Review training data: identify distribution shift from production", "type": "analysis"}},
      {"id": "analysis3", "type": "decision", "position": {"x": 650, "y": 250}, "data": {"label": "Test prompt variations: A/B testing reveals context sensitivity", "type": "analysis"}},
      {"id": "fix1", "type": "decision", "position": {"x": 100, "y": 350}, "data": {"label": "Implement few-shot examples with brand-specific responses", "type": "fix"}},
      {"id": "fix2", "type": "decision", "position": {"x": 300, "y": 350}, "data": {"label": "Add explicit constraints and output format specifications", "type": "fix"}},
      {"id": "fix3", "type": "decision", "position": {"x": 500, "y": 350}, "data": {"label": "Implement dynamic context truncation and memory management", "type": "fix"}},
      {"id": "fix4", "type": "decision", "position": {"x": 700, "y": 350}, "data": {"label": "Create robust validation pipeline with automated quality checks", "type": "fix"}},
      {"id": "test1", "type": "information", "position": {"x": 200, "y": 450}, "data": {"label": "Shadow testing with 10% live traffic for safety", "type": "testing"}},
      {"id": "test2", "type": "information", "position": {"x": 600, "y": 450}, "data": {"label": "Comprehensive edge case evaluation and stress testing", "type": "testing"}},
      {"id": "deploy", "type": "decision", "position": {"x": 300, "y": 550}, "data": {"label": "Gradual rollout with real-time monitoring and rollback capability", "type": "deployment"}},
      {"id": "monitor", "type": "decision", "position": {"x": "500", "y": 550}, "data": {"label": "Continuous quality metrics: brand adherence, hallucination rate, user satisfaction", "type": "monitoring"}},
      {"id": "success", "type": "outcome", "position": {"x": 250, "y": 650}, "data": {"label": "Brand-consistent AI responses, 95%+ quality score, customer complaints resolved", "type": "success"}},
      {"id": "failure", "type": "outcome", "position": {"x": 550, "y": 650}, "data": {"label": "Continued quality issues, brand reputation damage, emergency manual override", "type": "failure"}}
    ],
    "edges": [],
    "instructorSolution": [
      {"source": "crisis", "target": "symptom1", "relationship": "manifests_as"},
      {"source": "crisis", "target": "symptom2", "relationship": "manifests_as"},
      {"source": "crisis", "target": "symptom3", "relationship": "manifests_as"},
      {"source": "symptom1", "target": "analysis1", "relationship": "requires"},
      {"source": "symptom2", "target": "analysis2", "relationship": "requires"},
      {"source": "symptom3", "target": "analysis3", "relationship": "requires"},
      {"source": "analysis1", "target": "fix1", "relationship": "leads_to"},
      {"source": "analysis1", "target": "fix2", "relationship": "leads_to"},
      {"source": "analysis2", "target": "fix3", "relationship": "leads_to"},
      {"source": "analysis3", "target": "fix4", "relationship": "leads_to"},
      {"source": "fix1", "target": "test1", "relationship": "requires"},
      {"source": "fix2", "target": "test1", "relationship": "requires"},
      {"source": "fix3", "target": "test2", "relationship": "requires"},
      {"source": "fix4", "target": "test2", "relationship": "requires"},
      {"source": "test1", "target": "deploy", "relationship": "enables"},
      {"source": "test2", "target": "deploy", "relationship": "enables"},
      {"source": "deploy", "target": "monitor", "relationship": "requires"},
      {"source": "monitor", "target": "success", "relationship": "ensures"},
      {"source": "analysis2", "target": "failure", "relationship": "risks_if_ignored"}
    ],
    "connectionRules": [
      "Crisis must connect to all symptoms",
      "Each symptom requires specific analysis",
      "Analysis must lead to targeted fixes",
      "Fixes require thorough testing",
      "Deployment needs monitoring for success"
    ]
  }',
  '{}',
  '{
    "completion_threshold": 0.80,
    "required_connections": 14,
    "success_criteria": ["All symptoms analyzed", "Fixes properly tested", "Deployment strategy sound"]
  }',
  '["Problem Analysis", "Solution Design", "Testing Strategy", "Risk Management"]'
);

-- Insert Cloud Infrastructure Scaling game template  
INSERT INTO public.game_templates (
  name,
  description,
  category,
  content_slots,
  mechanics,
  template_data,
  validation_rules,
  win_conditions,
  heuristic_targets
) VALUES (
  'The Cloud Infrastructure Scaling Nightmare',
  'Your AI application just got featured on TechCrunch. Traffic is spiking 100x and your infrastructure is buckling. Navigate the chaos of real-time scaling decisions.',
  'ai-engineering',
  '[]',
  '{
    "interaction_type": "connection_based", 
    "scoring": "scaling_efficiency",
    "validation": "infrastructure_coherence",
    "hints": [
      "Consider the bottleneck cascade effects",
      "Think about cost vs performance trade-offs", 
      "Evaluate monitoring and alerting needs"
    ]
  }',
  '{
    "nodes": [
      {"id": "viral", "type": "scenario", "position": {"x": 400, "y": 50}, "data": {"label": "TechCrunch just featured your AI app! Traffic jumping from 1K to 100K users. Your single-server setup is dying. You have 2 hours before the CEO demo to investors.", "type": "scenario"}},
      {"id": "bottleneck1", "type": "information", "position": {"x": 150, "y": 150}, "data": {"label": "Database connections maxed out at 100, queries timing out", "type": "bottleneck"}},
      {"id": "bottleneck2", "type": "information", "position": {"x": 400, "y": 150}, "data": {"label": "API server CPU at 98%, response times >30 seconds", "type": "bottleneck"}},
      {"id": "bottleneck3", "type": "information", "position": {"x": 650, "y": 150}, "data": {"label": "OpenAI API rate limits hit, 429 errors cascading", "type": "bottleneck"}},
      {"id": "decision1", "type": "decision", "position": {"x": 100, "y": 250}, "data": {"label": "Emergency database scaling: Read replicas + connection pooling", "type": "scaling"}},
      {"id": "decision2", "type": "decision", "position": {"x": 300, "y": 250}, "data": {"label": "Horizontal server scaling: Auto-scaling groups + load balancer", "type": "scaling"}},
      {"id": "decision3", "type": "decision", "position": {"x": 500, "y": 250}, "data": {"label": "API optimization: Caching layer + request batching", "type": "scaling"}},
      {"id": "decision4", "type": "decision", "position": {"x": 700, "y": 250}, "data": {"label": "Traffic management: Rate limiting + queue system", "type": "scaling"}},
      {"id": "implementation1", "type": "information", "position": {"x": 150, "y": 350}, "data": {"label": "Redis cluster for session caching and API response caching", "type": "implementation"}},
      {"id": "implementation2", "type": "information", "position": {"x": 350, "y": 350}, "data": {"label": "Kubernetes deployment with HPA based on CPU and memory", "type": "implementation"}},
      {"id": "implementation3", "type": "information", "position": {"x": 550, "y": 350}, "data": {"label": "CDN for static assets + aggressive API response caching", "type": "implementation"}},
      {"id": "implementation4", "type": "information", "position": {"x": 750, "y": 350}, "data": {"label": "Circuit breakers + graceful degradation for AI features", "type": "implementation"}},
      {"id": "monitoring", "type": "decision", "position": {"x": 300, "y": 450}, "data": {"label": "Real-time monitoring: Grafana dashboards + PagerDuty alerts", "type": "monitoring"}},
      {"id": "cost", "type": "information", "position": {"x": 500, "y": 450}, "data": {"label": "Infrastructure costs jump from $200 to $2000/month", "type": "cost"}},
      {"id": "optimization", "type": "decision", "position": {"x": 400, "y": 550}, "data": {"label": "Cost optimization: Spot instances + scheduled scaling + resource right-sizing", "type": "optimization"}},
      {"id": "success", "type": "outcome", "position": {"x": 250, "y": 650}, "data": {"label": "Demo succeeds! App handles 100K users smoothly, investors impressed, team promoted", "type": "success"}},
      {"id": "failure", "type": "outcome", "position": {"x": 550, "y": 650}, "data": {"label": "App crashes during demo, investors leave, engineering team works all weekend", "type": "failure"}}
    ],
    "edges": [],
    "instructorSolution": [
      {"source": "viral", "target": "bottleneck1", "relationship": "causes"},
      {"source": "viral", "target": "bottleneck2", "relationship": "causes"},
      {"source": "viral", "target": "bottleneck3", "relationship": "causes"},
      {"source": "bottleneck1", "target": "decision1", "relationship": "requires"},
      {"source": "bottleneck2", "target": "decision2", "relationship": "requires"},
      {"source": "bottleneck3", "target": "decision3", "relationship": "requires"},
      {"source": "viral", "target": "decision4", "relationship": "requires"},
      {"source": "decision1", "target": "implementation1", "relationship": "enables"},
      {"source": "decision2", "target": "implementation2", "relationship": "enables"},
      {"source": "decision3", "target": "implementation3", "relationship": "enables"},
      {"source": "decision4", "target": "implementation4", "relationship": "enables"},
      {"source": "implementation1", "target": "monitoring", "relationship": "requires"},
      {"source": "implementation2", "target": "monitoring", "relationship": "requires"},
      {"source": "decision2", "target": "cost", "relationship": "increases"},
      {"source": "cost", "target": "optimization", "relationship": "demands"},
      {"source": "monitoring", "target": "success", "relationship": "enables"},
      {"source": "optimization", "target": "success", "relationship": "ensures"},
      {"source": "bottleneck1", "target": "failure", "relationship": "risks_if_unaddressed"}
    ],
    "connectionRules": [
      "Viral moment must connect to all bottlenecks",
      "Each bottleneck requires specific scaling decision", 
      "Scaling decisions must have implementation strategies",
      "Implementations require monitoring",
      "Cost concerns demand optimization",
      "Success requires addressing all critical paths"
    ]
  }',
  '{}',
  '{
    "completion_threshold": 0.85,
    "required_connections": 16,
    "success_criteria": ["All bottlenecks addressed", "Implementations properly planned", "Monitoring and optimization in place"]
  }',
  '["Crisis Management", "Infrastructure Design", "Performance Optimization", "Cost Management"]'
);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_public_game_leads_updated_at
  BEFORE UPDATE ON public.public_game_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();