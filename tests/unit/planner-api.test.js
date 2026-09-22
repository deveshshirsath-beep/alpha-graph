import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerApi, answerRequest, normalizeApiResponse, resultPageRequest, resultPagination } from "../../src/planner-api.js";

const graphId = "approved-v4";
const graph = { graphId, schemaVersion: "1.0", fingerprint: "immutable-one", nodes: [{ id: "root", name: "Root" }], edges: [], rootNodeIds: ["root"], resultNodeIds: [] };
const answer = (changes = {}) => ({ graphId, requestId: "request-1", status: "answered", answer: "An answer.", resolvedEntities: [], warnings: [], matchedGraph: graph,
  plan: { dsl_version: "1.0", disposition: "execute", entities: [], steps: [{ id: "all", op: "select", types: ["API"] }], output: { limit: 100, offset: 0 } },
  evidence: { result: { kind: "nodes", rows: [], metadata: { pagination: { totalItems: 350, offset: 0, returnedItems: 60, totalIsExact: false, hasMore: true, nextOffset: 60 } } } }, ...changes });
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
afterEach(() => vi.useRealTimers());

describe("Graph QA contract boundary", () => {
  it("sends explicit approved graph selection and bounded presentation controls", () => {
    expect(answerRequest(graphId, "  List APIs  ", ["root", "root"])).toMatchObject({ graph_id: graphId, question: "List APIs", selected_entity_ids: ["root"], options: { result_limit: 100, result_offset: 0, include_plan: true, include_mermaid: false } });
    expect(() => answerRequest("../graph", "x")).toThrow();
    expect(() => answerRequest(undefined, "x")).toThrow();
    expect(() => answerRequest(graphId, "x", [null])).toThrow();
    expect(() => answerRequest(graphId, "x".repeat(5001))).toThrow();
    expect(() => answerRequest(graphId, "x", Array.from({ length: 65 }, (_, i) => String(i)))).toThrow();
  });
  it("preserves all semantic outcomes, warnings, clarifications and snapshot identity", () => {
    for (const status of ["answered", "no_match", "unsupported", "no_evidence", "clarification_required"]) expect(normalizeApiResponse(answer({ status }), graphId).status).toBe(status);
    expect(normalizeApiResponse(answer({ warnings: ["Partial", "Partial"] }), graphId)).toMatchObject({ snapshotFingerprint: "immutable-one", warnings: ["Partial"], requestId: "request-1" });
  });
  it("rejects wrong snapshots, invalid semantic statuses and malformed optional data", () => {
    for (const payload of [null, {}, answer({ graphId: "other" }), answer({ status: "unexpected" }), answer({ matchedGraph: { ...graph, schemaVersion: "2.0" } }), answer({ evidence: { result: { rows: [null] } } }), answer({ clarification: { entities: [{}] } }), answer({ presentation: { schemaVersion: "1.0", tables: [{ title: "Invalid", columns: [null], rows: [] }] } })]) {
      expect(() => normalizeApiResponse(payload, graphId)).toThrow();
    }
    expect(normalizeApiResponse(answer({ matchedGraph: undefined, evidence: undefined }), graphId).matchedGraph.nodes).toEqual([]);
  });
  it("uses compaction-adjusted nextOffset and preserves lower-bound semantics", () => {
    const result = normalizeApiResponse(answer(), graphId);
    expect(resultPagination(result)).toMatchObject({ nextOffset: 60, totalIsExact: false, totalItems: 350 });
    expect(resultPageRequest(result, 60)).toMatchObject({ graph_id: graphId, plan: { output: { limit: 100, offset: 60 } } });
    expect(result.plan.output.offset).toBe(0);
    expect(resultPagination({ evidenceResult: { metadata: { pagination: { totalItems: 5, offset: 3, returnedItems: 0, nextOffset: 3 } } } }).nextOffset).toBeNull();
  });
  it("pins selected single-node resolutions and refuses unsafe multi-resolution replay", () => {
    const result = normalizeApiResponse(answer(), graphId);
    result.plan.entities = [{ key: "root", mention: "Duplicate name", allow_multiple: false }];
    result.resolvedEntities = [{ key: "root", selectedIds: ["chosen-id"] }];
    expect(resultPageRequest(result, 60).plan.entities[0]).toMatchObject({ node_id: "chosen-id", mention: null });
    result.resolvedEntities[0].selectedIds.push("another-id");
    expect(() => resultPageRequest(result, 60)).toThrow(/multi-entity/);
  });
});

describe("Graph QA transport", () => {
  it("checks API snapshots without silently substituting the default", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ snapshots: [{ graphId: "other" }] }));
    const api = new PlannerApi({ fetchImpl });
    await expect(api.answer(graphId, "List APIs", [], undefined)).rejects.toMatchObject({ code: "graph_snapshot_not_found" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("posts only after discovery, uses same-origin credentials and does not leak tokens", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(response({ snapshots: [{ graphId }] })).mockResolvedValueOnce(response(answer()));
    await new PlannerApi({ fetchImpl }).answer(graphId, "List APIs", [], undefined);
    expect(fetchImpl.mock.calls[1][0]).toBe("/v1/answer");
    expect(fetchImpl.mock.calls[1][1]).toMatchObject({ credentials: "same-origin", cache: "no-store", method: "POST" });
    expect(fetchImpl.mock.calls[1][1].headers.Authorization).toBeUndefined();
  });
  it.each([401, 403, 429, 502, 503, 504])("surfaces actionable HTTP %s errors without retrying automatically", async status => {
    const fetchImpl = vi.fn().mockResolvedValue(response({ error: "server_error" }, status));
    await expect(new PlannerApi({ fetchImpl }).request("/v1/answer", {})).rejects.toMatchObject({ status });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
  it("handles validation errors and HTML/non-JSON gateway responses", async () => {
    await expect(new PlannerApi({ fetchImpl: async () => response({ detail: [{ msg: "Too many selected IDs" }] }, 422) }).request("/v1/answer", {})).rejects.toThrow("Too many selected IDs");
    await expect(new PlannerApi({ fetchImpl: async () => new Response("<html>not the API</html>") }).request("/v1/answer", {})).rejects.toMatchObject({ code: "invalid_response" });
  });
  it("distinguishes timeout from cancellation and aborts the fetch", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_url, options) => new Promise((_resolve, reject) => {
      if (options.signal.aborted) reject(new DOMException("cancelled", "AbortError"));
      options.signal.addEventListener("abort", () => reject(new DOMException("cancelled", "AbortError")), { once: true });
    }));
    const api = new PlannerApi({ fetchImpl, timeoutMs: 100 });
    const timeout = expect(api.request("/v1/answer", {})).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(100); await timeout;
    const controller = new AbortController();
    const cancelled = expect(api.request("/v1/answer", {}, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    controller.abort(); await cancelled;
    expect(vi.getTimerCount()).toBe(0);
  });
  it("pages the stored plan and refuses fingerprint changes before applying data", async () => {
    const original = normalizeApiResponse(answer(), graphId);
    const payload = answer({ matchedGraph: { ...graph, fingerprint: "changed" } });
    const api = new PlannerApi({ fetchImpl: async () => response(payload) });
    await expect(api.page(original, 60, undefined)).rejects.toMatchObject({ code: "snapshot_changed" });
    expect(original.snapshotFingerprint).toBe("immutable-one");
  });
});
