// Pure graph operations shared by the viewer and its regression tests.
export function conditionReadiness(conditions) {
  const ready = conditions.filter(({ entityType, nodeId, ruleKey }) => entityType && nodeId && ruleKey).length;
  const drafts = conditions.length - ready;
  return { ready, drafts, canRun: ready > 0 && drafts === 0,
    label: !conditions.length ? "0 conditions" : `${ready} ready${drafts ? ` · ${drafts} draft${drafts === 1 ? "" : "s"}` : ""}` };
}

export function evaluateGraphConditions(graph, conditions, rules) {
  if (!conditionReadiness(conditions).canRun) throw new Error("Complete every condition before running the query.");
  const evaluations = conditions.map(condition => {
    const [direction, rawIndex] = condition.ruleKey.split(":");
    const rule = rules[Number(rawIndex)];
    if (!rule || !["in", "out"].includes(direction) || !graph.hasNode(condition.nodeId)) throw new Error("The selected entity or relationship is no longer available. Choose it again.");
    const [sourceType, relationship, targetType] = rule;
    const matches = new Set();
    const edges = new Map();
    for (const edge of direction === "out" ? graph.outEdges(condition.nodeId) : graph.inEdges(condition.nodeId)) {
      if (graph.getEdgeAttribute(edge, "relationshipType") !== relationship) continue;
      const counterpart = direction === "out" ? graph.target(edge) : graph.source(edge);
      if (graph.getNodeAttribute(counterpart, "entityType") !== (direction === "out" ? targetType : sourceType)) continue;
      matches.add(counterpart);
      if (!edges.has(counterpart)) edges.set(counterpart, new Set());
      edges.get(counterpart).add(edge);
    }
    return { condition, matches, edges, relationship };
  });
  // Conditions are combined in displayed order; AND intersects, OR unions.
  let matches = new Set(evaluations[0].matches);
  for (const evaluation of evaluations.slice(1)) {
    matches = evaluation.condition.operator === "AND"
      ? new Set([...matches].filter(node => evaluation.matches.has(node)))
      : new Set([...matches, ...evaluation.matches]);
  }
  const nodes = new Set([...conditions.map(condition => condition.nodeId), ...matches]);
  const edges = new Set();
  for (const evaluation of evaluations) for (const node of matches) {
    for (const edge of evaluation.edges.get(node) || []) edges.add(edge);
  }
  return { nodes, edges, matches, relationships: new Set(evaluations.map(item => item.relationship)) };
}

export function traceGraphPaths(graph, roots, direction, depth, edgeTypes, limit = 5000) {
  const nodes = new Set(roots);
  if (!nodes.size || [...nodes].some(node => !graph.hasNode(node))) throw new Error("Select an available starting entity before tracing paths.");
  const edges = new Set();
  let frontier = [...nodes];
  let truncated = false;
  for (let level = 0; level < depth && frontier.length; level += 1) {
    const next = [];
    for (const node of frontier) {
      const candidates = new Set([
        ...(direction !== "in" ? graph.outEdges(node) : []),
        ...(direction !== "out" ? graph.inEdges(node) : []),
      ]);
      for (const edge of candidates) {
        if (!edgeTypes.has(graph.getEdgeAttribute(edge, "relationshipType"))) continue;
        const target = graph.opposite(node, edge);
        if (!nodes.has(target)) {
          if (nodes.size >= limit) { truncated = true; continue; }
          nodes.add(target);
          next.push(target);
        }
        edges.add(edge);
      }
    }
    frontier = next;
  }
  return { nodes, edges, truncated };
}
