export type SessionContent = {
  number: number;
  theme: string;
  lectures: { id: string; title: string; content: string }[];
  reflections: string[];
};

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
  ...Array.from({ length: 9 }).map((_, i) => ({
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
