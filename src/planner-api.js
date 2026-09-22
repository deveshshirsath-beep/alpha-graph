/** Enterprise Graph QA 0.1 / presentation 1.0 transport boundary. */
const statuses = new Set(["answered", "no_evidence", "clarification_required", "no_match", "unsupported"]);
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const strings = value => Array.isArray(value) ? value.filter(item => typeof item === "string") : [];
const graphIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export class PlannerApiError extends Error {
  constructor(message, code = "planner_error", status = 0) {
    super(message);
    this.name = "PlannerApiError";
    this.code = code;
    this.status = status;
  }
}

export function answerRequest(graphId, question, selectedIds = []) {
  if (typeof graphId !== "string" || !graphIdPattern.test(graphId)) throw new PlannerApiError("Select a valid graph snapshot.", "invalid_graph");
  const text = typeof question === "string" ? question.trim() : "";
  if (!text || text.length > 5000) throw new PlannerApiError("Questions must contain 1–5,000 characters.", "invalid_question");
  if (!Array.isArray(selectedIds) || selectedIds.some(id => typeof id !== "string" || !id.trim())) throw new PlannerApiError("Entity selections must be exact, non-empty IDs.", "invalid_selection");
  const ids = [...new Set(selectedIds)];
  if (ids.length > 64) throw new PlannerApiError("Select at most 64 entities for one question.", "invalid_selection");
  return { graph_id: graphId, question: text, selected_entity_ids: ids,
    options: { result_limit: 100, result_offset: 0, include_plan: true, include_evidence: true, include_matched_graph: true, include_presentation: true, include_mermaid: false } };
}

export function normalizeApiResponse(payload, graphId, query = false) {
  if (!object(payload) || !statuses.has(payload.status) || payload.graphId !== graphId || typeof payload.requestId !== "string" || (!query && typeof payload.answer !== "string")) {
    throw new PlannerApiError("The planner returned an incompatible response or a different graph. No results were applied.", "invalid_response");
  }
  const graph = payload.matchedGraph || payload.evidence?.matchedGraph;
  if (graph && (!object(graph) || graph.schemaVersion !== "1.0" || (graph.graphId && graph.graphId !== graphId) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges))) {
    throw new PlannerApiError("The planner returned an unsupported graph format.", "invalid_response");
  }
  if (graph && (graph.nodes.some(node => !object(node) || typeof node.id !== "string") || graph.edges.some(edge => !object(edge) || typeof edge.sourceId !== "string" || typeof edge.targetId !== "string"))) {
    throw new PlannerApiError("The planner returned invalid graph entities.", "invalid_response");
  }
  const presentation = payload.presentation;
  const validTable = table => object(table) && typeof table.title === "string"
    && Array.isArray(table.columns) && table.columns.every(column => typeof column === "string")
    && Array.isArray(table.rows) && table.rows.every(row => Array.isArray(row)
      && row.length === table.columns.length && row.every(cell => typeof cell === "string"));
  if (presentation && (!object(presentation) || presentation.schemaVersion !== "1.0" || !Array.isArray(presentation.tables) || !presentation.tables.every(validTable))) {
    throw new PlannerApiError("The planner returned an unsupported presentation format.", "invalid_response");
  }
  const validResolution = resolution => object(resolution) && typeof resolution.key === "string" && Array.isArray(resolution.selectedIds) && Array.isArray(resolution.candidates) && resolution.candidates.every(candidate => object(candidate) && typeof candidate.id === "string");
  if ((payload.resolvedEntities && (!Array.isArray(payload.resolvedEntities) || !payload.resolvedEntities.every(validResolution))) || (payload.clarification && (!object(payload.clarification) || !Array.isArray(payload.clarification.entities) || !payload.clarification.entities.every(validResolution))) || (payload.evidence?.result && (!object(payload.evidence.result) || !Array.isArray(payload.evidence.result.rows) || !payload.evidence.result.rows.every(object)))) {
    throw new PlannerApiError("The planner returned invalid evidence or clarification data.", "invalid_response");
  }
  return {
    graphId, requestId: payload.requestId, status: payload.status,
    answer: payload.answer || payload.message || "", plannerProvider: payload.plannerProvider || "caller", answerProvider: payload.answerProvider || "",
    matchedGraph: graph || { nodes: [], edges: [], rootNodeIds: [], resultNodeIds: [] },
    snapshotFingerprint: graph?.fingerprint || payload.evidence?.snapshot?.fingerprint || "",
    plan: object(payload.plan) ? payload.plan : null,
    evidenceResult: object(payload.evidence?.result) ? payload.evidence.result : null,
    presentation: presentation || null,
    warnings: [...new Set([...strings(payload.warnings), ...strings(payload.evidence?.warnings)])],
    resolvedEntities: Array.isArray(payload.resolvedEntities) ? payload.resolvedEntities.filter(object) : [],
    clarification: object(payload.clarification) ? payload.clarification : null,
  };
}

export function resultPagination(result) {
  const page = result?.evidenceResult?.metadata?.pagination;
  if (!object(page) || ![page.totalItems, page.offset, page.returnedItems].every(value => Number.isSafeInteger(value) && value >= 0)) return null;
  return { ...page, totalIsExact: page.totalIsExact !== false,
    nextOffset: Number.isSafeInteger(page.nextOffset) && page.nextOffset > page.offset && page.nextOffset <= 10000000 ? page.nextOffset : null };
}

/** Freeze resolution choices before reusing the plan; never ask an LLM to re-plan a page. */
export function resultPageRequest(result, offset) {
  if (!result.plan || result.plan.disposition !== "execute" || result.plan.dsl_version !== "1.0" || !result.snapshotFingerprint) {
    throw new PlannerApiError("This answer has no reusable plan or snapshot fingerprint. Run the question again to retrieve more results.", "paging_unavailable");
  }
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10000000) throw new PlannerApiError("Invalid result page offset.", "invalid_offset");
  const plan = structuredClone(result.plan);
  for (const entity of plan.entities || []) {
    const resolution = result.resolvedEntities?.find(item => item.key === entity.key);
    const ids = strings(resolution?.selectedIds);
    if (ids.length === 1) { entity.node_id = ids[0]; entity.mention = null; }
    else if (ids.length > 1) {
      // EntityRef is singular in DSL 1.0. Do not silently re-resolve a selected set.
      throw new PlannerApiError("This plan has a multi-entity resolution that cannot be pinned for paging. Narrow the question to one entity.", "paging_unavailable");
    }
  }
  plan.output = { ...plan.output, offset, limit: 100 };
  return { graph_id: result.graphId, plan };
}

function apiError(payload, status) {
  const detail = payload?.detail;
  const validation = Array.isArray(detail) ? detail.map(item => item?.msg).filter(Boolean).join("; ") : "";
  const messages = {
    401: "Planner authentication failed. Configure the server-side API token or sign in through your deployment’s gateway.",
    403: "You do not have access to this graph query service.",
    429: "The planner is rate limited. Wait before trying again.",
    502: "The planner API is unreachable. Check the service and proxy configuration.",
    503: "The selected graph or planner service is unavailable. Try again when it is ready.",
    504: "The planner exceeded the server timeout. Try a narrower question.",
  };
  return new PlannerApiError(messages[status] || validation || (typeof detail === "string" ? detail : payload?.message) || `Planner request failed (${status}).`, typeof payload?.error === "string" ? payload.error : "http_error", status);
}

export class PlannerApi {
  constructor({ fetchImpl = globalThis.fetch.bind(globalThis), timeoutMs = 180000 } = {}) {
    this.fetch = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  async request(path, body = undefined, signal = undefined) {
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    if (signal?.aborted) cancel();
    signal?.addEventListener("abort", cancel, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeoutMs);
    try {
      const response = await this.fetch(path, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store",
        headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
      const text = await response.text();
      if (text.length > 20000000) throw new PlannerApiError("The API response is too large to display safely. Narrow the question.", "response_too_large");
      let payload;
      try { payload = JSON.parse(text); } catch {
        if (!response.ok) throw apiError(null, response.status);
        throw new PlannerApiError("The planner returned a non-JSON response. Check the API proxy configuration.", "invalid_response");
      }
      if (!response.ok) throw apiError(payload, response.status);
      return payload;
    } catch (error) {
      if (timedOut) throw new PlannerApiError("The planner timed out. Try a narrower question or retry when the service is ready.", "timeout");
      if (signal?.aborted) throw new DOMException("Query cancelled", "AbortError");
      if (error instanceof PlannerApiError) throw error;
      throw new PlannerApiError("Unable to reach the planner. Check your connection and the API service, then retry.", "network_error");
    } finally { clearTimeout(timer); signal?.removeEventListener("abort", cancel); }
  }

  async answer(graphId, question, selectedIds, signal) {
    const request = answerRequest(graphId, question, selectedIds);
    const catalog = await this.request("/v1/graphs", undefined, signal);
    if (!Array.isArray(catalog?.snapshots)) throw new PlannerApiError("The API does not expose the current graph snapshot contract.", "invalid_response");
    if (!catalog.snapshots.some(snapshot => snapshot.graphId === graphId)) throw new PlannerApiError(`The selected dataset “${graphId}” is not registered with the planner API. Select or register its matching snapshot; no default graph was substituted.`, "graph_snapshot_not_found");
    return normalizeApiResponse(await this.request("/v1/answer", request, signal), graphId);
  }

  async page(result, offset, signal) {
    const payload = await this.request("/v1/query", resultPageRequest(result, offset), signal);
    const next = normalizeApiResponse(payload, result.graphId, true);
    if (next.snapshotFingerprint !== result.snapshotFingerprint) throw new PlannerApiError("The graph snapshot changed since this answer. Run the question again; pages from different snapshots were not combined.", "snapshot_changed");
    if (!["answered", "no_evidence"].includes(next.status)) throw new PlannerApiError("This plan can no longer be paged without clarification. Run the original question again.", "paging_unavailable");
    if (resultPagination(next)?.offset !== offset) throw new PlannerApiError("The API returned an unexpected result offset. The existing page was preserved.", "invalid_response");
    return next;
  }
}
