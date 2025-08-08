-- Create function to update timestamps (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for flashcard concepts
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_number INTEGER NOT NULL,
  lecture_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  concept_type TEXT DEFAULT 'definition',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user reflections
CREATE TABLE public.user_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  lecture_number INTEGER NOT NULL,
  reflection_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reflections ENABLE ROW LEVEL SECURITY;

-- Flashcards policies (readable by everyone, writable by admins)
CREATE POLICY "Flashcards are viewable by authenticated users" 
ON public.flashcards 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admins can manage flashcards" 
ON public.flashcards 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@gmail.com'
  )
);

-- User reflections policies
CREATE POLICY "Users can view their own reflections" 
ON public.user_reflections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reflections" 
ON public.user_reflections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections" 
ON public.user_reflections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reflections" 
ON public.user_reflections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_flashcards_updated_at
BEFORE UPDATE ON public.flashcards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_reflections_updated_at
BEFORE UPDATE ON public.user_reflections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial flashcards for Session 1
INSERT INTO public.flashcards (session_number, lecture_number, title, content, order_index) VALUES
(1, 1, 'What is a Graph?', 'A graph is a structure made of nodes (things) and edges (relationships). It''s a way to represent how different elements connect and influence each other.', 1),
(1, 1, 'Nodes', 'Nodes are the individual elements or "things" in a graph. They can represent people, concepts, objects, or any entity you want to study.', 2),
(1, 1, 'Edges', 'Edges are the connections or relationships between nodes. They show how one thing relates to, influences, or connects to another.', 3),
(1, 1, 'Real-World Examples', 'Social networks (people connected by friendships), brain neural maps (neurons connected by synapses), decision trees (choices connected by outcomes).', 4),

(1, 2, 'Directed Graphs', 'In directed graphs, edges have direction (A → B). This shows that influence or relationship flows from one node to another, but not necessarily back.', 1),
(1, 2, 'Undirected Graphs', 'In undirected graphs, edges work both ways (A ↔ B). The relationship or connection flows equally in both directions.', 2),
(1, 2, 'Weighted Relationships', 'Edges can have weight or strength. A heavy weight means a strong relationship or influence. Light weight means weak connection.', 3),
(1, 2, 'Network Examples', 'Social media connections (who influences whom), website links (which pages connect), transportation routes (cities connected by roads).', 4),

(1, 3, 'Intelligence as Graph Traversal', 'Intelligence works by moving through relationships between concepts. When you think, you''re literally traversing a graph in your mind.', 1),
(1, 3, 'Seeing Connections Clearly', 'The better you can see and understand edges (relationships), the clearer your thinking becomes. Most problems exist in the connections, not the things themselves.', 2),
(1, 3, 'Systems Thinking', 'Everything in your life connects to everything else. Your habits connect to your results, your beliefs connect to your actions, your environment connects to your mood.', 3),
(1, 3, 'Mental Mapping', 'By mapping your interests, decisions, and systems as graphs, you can understand how everything influences everything else in your life.', 4);