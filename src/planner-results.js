const humanize = (value) => String(value ?? "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bApi\b/g, "API");

function cellText(value, nodes) {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.map((item) => cellText(item, nodes)).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return nodes.get(String(value))?.name || String(value);
}

const columnLabel = value => {
  const label = humanize(value.replace(/^properties\./, "").replaceAll(".", " "));
  return ({ "Http Method": "HTTP method", "Impact Count": "Reachable targets", "Direct Impact Count": "Direct", "Transitive Impact Count": "Transitive", "Context Count": "Context only", "Target Counts": "Breakdown", "Relationship Type": "Relationship", "Present In": "Found in", "Present Count": "Occurrences" })[label] || label;
};

export function isScalarCount(result) {
  const profile = result?.presentation?.profile || result?.displayProfile;
  return profile?.kind === "count" && result.evidenceResult?.rows?.length === 1 && Object.keys(result.evidenceResult.rows[0]).join() === "count";
}

export function showResultDiagrams(result) {
  return result?.presentation?.profile?.show_diagrams !== false && !isScalarCount(result);
}

function readableRows(result) {
  const nodes = new Map((result.matchedGraph?.nodes || []).map(node => [node.id, node]));
  const technical = new Set(["id", "edgeId", "sourceId", "targetId", "source.id", "target.id", "source.name", "target.name", "source.type", "target.type", "name", "type", "context"]);
  return (result.evidenceResult?.rows || []).map(row => {
    const node = nodes.get(row.id);
    const out = {};
    if (row.name || node?.name) out.Name = row.name || node.name;
    if (row.type || node?.type) out.Type = humanize(row.type || node.type);
    if (row.context) out.Context = row.context;
    for (const side of ["source", "target"]) {
      const id = row[`${side}Id`] ?? row[`${side}.id`];
      const name = row[`${side}.name`] || nodes.get(id)?.name;
      if (name || id) out[humanize(side)] = name || `${humanize(side)} outside the graph preview`;
      if (row[`${side}.type`]) out[`${humanize(side)} type`] = humanize(row[`${side}.type`]);
    }
    for (const [key, value] of Object.entries(row)) {
      if (technical.has(key)) continue;
      if (key === "presentIn" && Array.isArray(value) && result.evidenceResult?.kind === "comparison") {
        out["Found in"] = value.map(id => `Group ${(result.evidenceResult.metadata?.inputStepIds || []).indexOf(id) + 1}`).join(", ");
      } else if (key === "targetCounts" && value && typeof value === "object") {
        out.Breakdown = Object.entries(value).map(([type, count]) => `${count} ${humanize(type)}`).join(", ");
      } else out[columnLabel(key)] = cellText(value, nodes);
    }
    if (!Object.keys(out).length && row.id) out.Name = "Item outside the graph preview";
    return out;
  });
}

/** Respect the response profile and every presentation table, including inventory summaries. */
export function returnedResultTables(result = {}) {
  const presentation = result.presentation;
  const profile = presentation?.profile || result.displayProfile;
  if (profile?.show_tables === false || isScalarCount(result)) return [];
  const pageData = returnedResultTable(result);
  if (presentation?.schemaVersion !== "1.0") {
    if (!result.graphId) return pageData ? [pageData] : [];
    if (!pageData) return [];
    if (result.evidenceResult?.rows?.length) {
      const rows = readableRows(result);
      const fields = [...new Set(rows.flatMap(row => Object.keys(row)))];
      return [...(result.summaryTables || []), { ...pageData, columns: fields, rows: rows.map(row => fields.map(field => row[field] ?? "—")) }];
    }
    return [pageData];
  }
  // An empty tables array is intentional (brief/count/existence/unsupported answers).
  return presentation.tables.map(table => {
    const prepared = { ...table, replacesPreview: true, summary: /inventory/i.test(table.title) };
    if (!prepared.summary && table.truncated && pageData?.rows.length > table.rows.length) {
      if (result.evidenceResult?.rows?.length) {
        const rows = readableRows(result);
        const keys = [...new Set(rows.flatMap(row => Object.keys(row)))];
        const fields = table.columns.map(column => keys.find(key => key.toLowerCase() === column.toLowerCase()));
        if (fields.every(Boolean)) return { ...prepared, rows: rows.map(row => fields.map(field => row[field] ?? "—")), truncated: pageData.rows.length < table.totalRows };
      } else if (["Matched entities", "Impact candidates"].includes(table.title)) {
        return { ...prepared, rows: pageData.rows, truncated: pageData.rows.length < table.totalRows };
      }
    }
    return prepared;
  });
}

/** Build the full returned table; the API's Markdown table is only a preview. */
export function returnedResultTable(result = {}) {
  const graph = result.matchedGraph || {};
  const nodes = new Map((graph.nodes || []).map((node) => [String(node.id), node]));
  const evidence = result.evidenceResult || {};
  const metadata = evidence.metadata || {};
  if (evidence.kind === "impact") {
    const rows = [];
    for (const [category, field] of [["Direct", "directImpactIds"], ["Transitive", "transitiveImpactIds"], ["Context", "contextRollupIds"]]) {
      for (const id of metadata[field] || []) {
        const node = nodes.get(String(id));
        rows.push([category, node?.name || String(id), humanize(node?.type || "Entity")]);
      }
    }
    if (rows.length) return { title: "Impact candidates", columns: ["Category", "Name", "Type"], rows, replacesPreview: true };
  }
  if (Array.isArray(evidence.rows) && evidence.rows.length) {
    const fields = [...new Set(evidence.rows.flatMap((row) => Object.keys(row)))];
    // Keep every returned field, including counts, paths and aggregate values.
    return {
      title: result.presentation?.tables?.[0]?.title || "Results",
      columns: fields.map(humanize),
      rows: evidence.rows.map((row) => fields.map((field) => /(^|\.)type$/.test(field) ? humanize(row[field]) : cellText(row[field], nodes))),
      replacesPreview: true,
    };
  }
  const ids = Array.isArray(graph.resultNodeIds) ? [...new Set(graph.resultNodeIds.map(String))] : [];
  const selected = ids.length ? ids.map((id) => nodes.get(id)).filter(Boolean) : [...nodes.values()];
  if (!selected.length) return null;
  const canReplace = result.presentation?.tables?.[0]?.title === "Matched entities" || !result.presentation;
  return {
    title: canReplace && ids.length ? "Matched entities" : "Returned entities",
    columns: ["Name", "Type"],
    rows: selected.map((node) => [node.name || node.label || String(node.id), humanize(node.type || "Entity")]),
    replacesPreview: canReplace,
  };
}

export function resultNarrative(message, table) {
  if (typeof message.result?.presentation?.narrative === "string") return message.result.presentation.narrative;
  // Old chats stored Markdown + graph, but no structured presentation. Only
  // replace the known entity preview; don't erase aggregate tables or caveats.
  if (table?.replacesPreview && table.title === "Matched entities") {
    return String(message.content || "").replace(/\n#{1,4} Matched entities\s*\n[\s\S]*$/, "");
  }
  return String(message.content || "");
}

export function resultPage(rows, search = "", page = 0, pageSize = 20) {
  const term = search.trim().toLowerCase();
  const filtered = term ? rows.filter((row) => row.some((cell) => String(cell).toLowerCase().includes(term))) : rows;
  const size = Math.max(1, pageSize);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.max(0, Math.min(pages - 1, page));
  const start = current * size;
  return { rows: filtered.slice(start, start + size), total: filtered.length, page: current, pages, start, end: Math.min(start + size, filtered.length) };
}

/** Each edge is reachable, including parallel, reverse and self relationships. */
export function entityConnections(graph, focusId) {
  const id = String(focusId);
  const nodes = new Map(graph.nodes.map((node) => [String(node.id), node]));
  return graph.edges.flatMap((edge) => {
    const source = String(edge.sourceId ?? edge.source);
    const target = String(edge.targetId ?? edge.target);
    if (source !== id && target !== id) return [];
    const neighbor = nodes.get(source === id ? target : source);
    return neighbor ? [{ edge, node: neighbor, direction: source === target ? "self" : source === id ? "out" : "in" }] : [];
  });
}
