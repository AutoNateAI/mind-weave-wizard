export type SessionContent = {
  number: number;
  theme: string;
  lectures: { id: string; title: string; content: string }[];
  reflections: string[];
};

// Updated session structure for marketing page
export const sessionOverview = [
  { 
    number: 1, 
    title: "Introduction to Graph Theory", 
    theme: "Everything is connected",
    description: "Discover how relationships and connections form the foundation of all logical thinking.",
    duration: "2.5 hours",
    keySkills: ["Pattern Recognition", "Visual Thinking", "Connection Mapping", "Systems Awareness"]
  },
  { 
    number: 2, 
    title: "Mental Models & Mapping", 
    theme: "You don't see with your eyes—you see with your models",
    description: "Learn to identify and construct powerful mental frameworks for complex problem-solving.",
    duration: "2.5 hours",
    keySkills: ["Model Construction", "Perspective Taking", "Framework Building", "Cognitive Flexibility"]
  },
  { 
    number: 3, 
    title: "The Space Between", 
    theme: "The meaning isn't in the nodes—it's in the edges",
    description: "Master the art of finding insights in relationships and hidden connections.",
    duration: "2.5 hours",
    keySkills: ["Relationship Analysis", "Gap Identification", "Inference Making", "Critical Analysis"]
  },
  { 
    number: 4, 
    title: "Research Decomposition", 
    theme: "Even the impossible becomes possible when you break it down right",
    description: "Develop systematic approaches to breaking down complex problems into manageable parts.",
    duration: "2.5 hours",
    keySkills: ["Problem Decomposition", "Research Methods", "Systematic Thinking", "Solution Architecture"]
  },
  { 
    number: 5, 
    title: "Advanced Applications & Mastery", 
    theme: "You are now the architect of your thinking",
    description: "Apply all learned skills to real-world scenarios and become a master of strategic thinking.",
    duration: "2.5 hours",
    keySkills: ["Strategic Integration", "Advanced Problem Solving", "Decision Architecture", "Thinking Mastery"]
  }
];

export const sessions: SessionContent[] = [
  {
    number: 1,
    theme: "Everything is connected.",
    lectures: [
      {
        id: "s1-l1",
        title: "What is a graph? Nodes, edges, and relationships",
        content: `Graphs are structures made of nodes (things) and edges (relationships).\n\nFrom biology to social networks, graphs reveal structure. In Thinking Wizard, you'll **build** and **explore** graphs to train your brain to see connections as the foundation of structured thinking.`,
      },
      {
        id: "s1-l2", 
        title: "Directed vs undirected graphs, weighted relationships",
        content: `Edges can have direction (A → B) and weight (strength).\n\nWe'll use these to model influence, importance, and flow. Network examples include social media connections, brain neural maps, and decision trees.`,
      },
      {
        id: "s1-l3",
        title: "Why this matters: Graphs mirror how intelligence operates",
        content: `Intelligence traverses relationships. Seeing edges clearly = clearer thinking.\n\nYou'll map your interests, decisions, and systems to understand how everything in your life connects and influences everything else.`,
      },
    ],
    reflections: [
      "Where in my life have I been focusing on dots, not the connections?",
      "What invisible links shape my daily decisions?", 
      "Build dashboard of your inner mental web—what patterns do you notice?",
    ],
  },
  ...Array.from({ length: 4 }).map((_, i) => ({
    number: i + 2,
    theme: "Coming soon",
    lectures: [
      { id: `s${i + 2}-l1`, title: "Lecture 1", content: "Content forthcoming." },
      { id: `s${i + 2}-l2`, title: "Lecture 2", content: "Content forthcoming." },
      { id: `s${i + 2}-l3`, title: "Lecture 3", content: "Content forthcoming." },
    ],
    reflections: [
      "Reflection A (coming soon)",
      "Reflection B (coming soon)",
      "Reflection C (coming soon)",
    ],
  })),
];
