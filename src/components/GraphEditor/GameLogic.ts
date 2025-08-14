// Game logic handlers for different node types and interactions

export const handleDecisionNode = (node: any, gameState: any, setGameState: any, setNodes: any, toast: any) => {
  // Decision nodes require player choice and reveal consequences
  const consequences = node.data.consequences || [];
  
  // Unlock connected nodes
  const connectedNodes = node.data.connectedNodes || [];
  
  setNodes((nds: any[]) => nds.map(n => {
    if (connectedNodes.includes(n.id)) {
      return { ...n, data: { ...n.data, unlocked: true } };
    }
    return n;
  }));

  // Add points for making a decision
  const points = node.data.points || 10;
  setGameState((prev: any) => ({
    ...prev,
    score: prev.score + points,
    selectedPath: [...prev.selectedPath, node.id]
  }));

  toast.success(`Decision made! +${points} points`, {
    description: consequences.length > 0 ? consequences[0] : "Path unlocked"
  });
};

export const handleScenarioNode = (node: any, gameState: any, setGameState: any, toast: any) => {
  // Scenario nodes set the context and reveal decision options
  setGameState((prev: any) => ({
    ...prev,
    currentScenario: node.id
  }));

  toast.info("Scenario analyzed", {
    description: "Consider your options carefully"
  });
};

export const handleOutcomeNode = (node: any, gameState: any, setGameState: any, toast: any) => {
  // Outcome nodes show results and may complete sections
  const points = node.data.points || 20;
  
  setGameState((prev: any) => ({
    ...prev,
    score: prev.score + points
  }));

  toast.success(`Outcome reached! +${points} points`, {
    description: "You've completed this path"
  });
};

export const checkGameCompletion = (gameState: any, totalNodes: number) => {
  // Check if enough nodes have been revealed or specific end conditions met
  const completionThreshold = Math.ceil(totalNodes * 0.7); // 70% of nodes
  return gameState.revealedNodes.size >= completionThreshold;
};

export const calculateDynamicScore = (gameState: any, timeSpent: number) => {
  let score = gameState.score;
  
  // Time bonus (5 minutes or less)
  if (timeSpent < 300) {
    score += 25;
  }
  
  // Efficiency bonus (fewer hints used)
  if (gameState.hintsUsed === 0) {
    score += 20;
  } else if (gameState.hintsUsed <= 1) {
    score += 10;
  }
  
  // Path optimization bonus
  const pathEfficiency = gameState.decisionPath.length > 0 ? 
    (gameState.revealedNodes.size / gameState.decisionPath.length) : 0;
  
  if (pathEfficiency > 0.8) {
    score += 15;
  }
  
  return Math.min(100, Math.max(0, score));
};