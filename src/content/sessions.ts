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
        title: "What is a graph?",
        content: `Graphs are structures made of nodes (things) and edges (relationships).\n\nFrom biology to social networks, graphs reveal structure. In Thinking Wizard, you'll **build** and **explore** graphs to train your brain to see connections.`,
      },
      {
        id: "s1-l2",
        title: "Directed, undirected, weighted",
        content: `Edges can have direction (A → B) and weight (strength).\n\nWe'll use these to model influence, importance, and flow.`,
      },
      {
        id: "s1-l3",
        title: "Why graphs matter",
        content: `Intelligence traverses relationships. Seeing edges clearly = clearer thinking.\n\nYou'll map your interests, decisions, and systems.`,
      },
    ],
    reflections: [
      "Where in my life have I focused on dots, not connections?",
      "What invisible links shape my daily decisions?",
      "Build a dashboard of your inner mental web—what stands out?",
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
