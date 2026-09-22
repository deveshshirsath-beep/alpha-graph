# Atlas V2 Graph Studio

Atlas V2 Graph Studio combines the Sigma-based Atlas V2 graph viewer with the signed-off Graph Query Planner UI. The viewer remains the default surface; choose **Ask** in its tool rail to open the planner and **Graph** to return without losing viewer state.

## Features

- All Atlas V2 viewer features, including discovery, layers, entities, relationships, conditional queries, traversal, minimap, layouts, panel resizing, and text-size settings.
- The original Light, Midnight, Ocean, and Sunset themes shared by both viewer and planner modes.
- An active-dataset selector shared by both modes.
- A dataset-aware YAML question catalog.
- A Graph explorer above Workspaces: browse the active graph’s entity types by layer, search a type’s entities by name or exact ID, and filter by populated relationship signatures. Entity lists are loaded on demand from the same V2 graph catalogs; graph/type-level relationship counts are explicitly distinguished from an individual entity’s connections.
- Entity-aware question discovery from all 529 parameterized YAML templates, alongside relevant unchanged catalog examples. Selecting an entity fills compatible placeholders and supplies its exact ID as prompt context. Remaining property values, other entities and set/depth parameters must be filled before a query can run. Reset restores the original catalog; the composer’s context chip can remove the selected ID independently.
- **Assist** in the composer finds catalog questions from topic phrases, with layer filters and suggested topics. It guides parameter entry using graph-backed entity search, multi-entity sets, property text and hop limits, then previews the completed question. **Use Question** replaces the draft without running it; exact selected entity IDs accompany the eventual query. Assist uses the active catalog locally, not a generative assistant or a separate API call.
- JSON document CRUD for workspaces, projects, and project chat history.
- Query result views for Entity Map, Map, navigable Entity folders, and generated Follow Up Questions.
- A grid-backed Map diagram with color-coded nodes, directed relationship labels, self-loops, connection pages and an all-returned-nodes overview. Expand the map for more space; pan, zoom, Fit, or use 1:1 for readable labels. Click a node or relationship for its full details; double-click a node to explore its connections.
- The composer is centered in an empty chat and docked below the independently scrolling conversation after the first question. Each dated question and answer displays its local timestamp (including seconds); messages are ordered by their saved ISO timestamps. Legacy messages without timestamps retain their position without invented dates.
- Each new answer stores suggested next questions in `result.followUpQuestions` and its originating question ID in `replyTo`. Suggestions remain with their answer as references; choosing one fills the composer and supplies that result’s root entity IDs to the API. Questions store `selectedEntityIds` to document this context. These are suggested investigations, not guarantees that the graph contains an answer.
- Searchable result tables with local row paging and explicit API-page navigation. Inventory summaries and presentation preferences are preserved, and the returned evidence rows expand the API's 20-row presentation preview. API execution and evidence limits still apply.
- A focused entity map with readable names, directed relationships, connection paging, an entity picker, and pan/zoom/fit controls. Double-click an entity or choose Explore connections to follow its neighborhood.
- The original planner composer with clear/copy actions and a round submit button, plus catalog and workspace panels with persistent draggable widths.
- Same-origin proxying to the adjacent Query Planner API.
- Eight starter investigations progress from inventory/counts to prefilled business/database examples, Boolean classification filters, and portfolio comparison. Cards fill an editable draft without executing it. Named examples target `merged-graph-v4`; other datasets use unscoped alternatives, whose results depend on their data. See [starter validation](docs/starter-question-validation.md).

## Viewer Query and Paths

The viewer query builder starts with no conditions. Add numbered drafts, select an entity type, a specific entity and a directed relationship, then run. The counter distinguishes ready conditions from unfinished drafts. AND intersects matches and OR unions them, in displayed order. Editing drafts does not apply them; Clear removes every draft and restores the selected entity-type view.

The former **Activity** shortcut is now called **Paths**: it navigates to Path explorer, not an activity/history log. Select an entity in the graph or search, choose **Add to traversal**, pick a direction and depth, and choose **Trace paths**. Traversals respect enabled relationship types and are bounded to 5,000 entities. These viewer conditions, starting entities and results live only in tab memory and disappear on reload or dataset change. They are not written to the planner's JSON chat documents. Separately, diagnostic event metadata is buffered in memory (up to 200 entries); exporting diagnostics requires a configured `VITE_OBSERVABILITY_ENDPOINT`.

Panel widths, visibility, theme and font size remain browser-local preferences. In both Graph and Query Planner, each side panel has a header toggle and a visible edge control to reopen it. Collapsing a panel preserves its content and saved width; desktop and compact layouts remember visibility independently. Both side panels can be resized with the grip or arrow keys. Settings toggles open/closed on repeated clicks.

The window-style controls operate inside Atlas: red hides the workspace behind a Resume dialog without discarding drafts or cancelling queries; yellow temporarily hides side panels and restores their individual visibility without overwriting preferences; green enters/exits browser fullscreen. Opening a panel exits focus mode. Unsupported or denied fullscreen requests show a notice. These are not native operating-system close/minimize controls. The landing logo makes two complete rotations, then stops; reduced-motion users see a static logo.

## Run locally

Start the signed-off planner API in one terminal:

```bash
cd "../Query Planner"
.venv/bin/graph-qa serve --host 127.0.0.1 --port 8000
```

Build and start Atlas in another terminal. Node 24 or newer is required by the v2 toolchain.

```bash
npm install
npm run build
python3 serve.py
```

Open `http://127.0.0.1:4173`. Override the planner endpoint with `GRAPH_QA_API_URL`. Override the document root with `GRAPH_STUDIO_DATA_DIR`.

## Graph Query Planner compatibility

The adapter targets the adjacent Enterprise Graph QA API **0.1.0**, with Query DSL, matched-graph and presentation schemas **1.0**. The checked-in `../Query Planner/docs/openapi.yaml` and backend implementation are the contract references. Catalog regression fixes are in the adjacent backend as well as this UI; restart it after updating its source.

- Before answering, the UI checks `/v1/graphs` for the active dataset's exact graph ID. Register the same snapshot name in both applications; it never substitutes the API's default snapshot for a missing dataset.
- `/v1/answer` receives the graph ID, question, exact selected entity IDs and explicit bounded options. The question limit is 5,000 characters and at most 64 selected IDs. Answers, no evidence, no match, clarification and unsupported requests remain distinct outcomes.
- Clarification choices show their exact IDs so same-name entities are distinguishable. Selecting a candidate prepares the original question and chosen IDs for review; only Run executes it.
- Pagination follows `evidence.result.metadata.pagination.nextOffset`, including evidence-compaction adjustments. It replays the returned plan through `/v1/query`, without asking the model to plan again. Single-entity resolutions are pinned, and a changed snapshot fingerprint rejects the page. DSL 1.0 cannot pin a multi-ID entity reference, so such plans ask the user to narrow the question before paging.
- Totals distinguish exact counts from lower bounds. Search and “Show loaded rows” apply only to the loaded API page. Subsequent API pages are transient; reopening a saved chat starts from its original answer. Paging changes the table only, with an explicit note that the saved answer text and evidence map are unchanged. The map continues to represent the chat's latest answer.
- Every presentation table is retained, including inventory summaries. Count-only answers omit redundant tables and diagrams. The UI respects `show_tables` and `show_diagrams`, renders API text without executable HTML, and exposes evidence warnings and request IDs.
- Requests have a 180-second timeout, cancellation, same-origin transport and no automatic retries. Switching chats or datasets cancels pending work; late responses do not update the new context. Cancellation stops waiting in the browser but does **not** guarantee that backend processing stops. Failed requests offer a restore-to-draft action. Failed chat persistence is reported separately, with Retry Saving, without discarding a successful answer.

### Deployment boundary

Set `GRAPH_QA_API_URL` and, when required, `GRAPH_QA_BEARER_TOKEN` **on the server**, using your deployment's secret manager. Tokens are not included in browser code or local storage. The former browser-local `graphqa.endpoint` override is no longer used. Restart `serve.py` after changing Python code or environment settings; rebuilding alone only updates the frontend.

The UI proxy allows query/discovery routes, blocks snapshot administration, rejects cross-origin API/document access, bounds request and response bodies, disables response caching and forwards useful authentication/rate-limit/request-ID headers. Gateway failures do not expose internal connection details.

`serve.py` is a local/single-user server, **not an internet-facing multi-user security boundary**. For production, put it behind a supervised TLS gateway with authentication, authorization, rate/concurrency limits and request timeouts. Preserve the external Host header for same-origin checks; protect both `/v1/` and `/app-api/`. A shared upstream token does not provide per-user graph/workspace authorization. Restrict network access to the backend, provide durable backed-up document storage, and enforce deployment-level access isolation. Vite dev/preview alone does not provide the API or document proxy.

### Verification

```bash
npm run test:all       # lint, typecheck, unit/integration tests and production build
npm run test:proxy     # Python proxy boundary tests; no running server required
GRAPH_QA_API_URL=http://127.0.0.1:8000 npm run test:api
GRAPH_QA_API_URL=http://127.0.0.1:8000 npm run test:starters
npm run test:catalog   # all 320 samples, 529 templates, and filled/unfinished parameter cases through port 4173
npm run test:catalog-regressions # independent graph joins and exact results across all API pages
GRAPH_QA_API_URL=http://127.0.0.1:4173 npm run test:release # all checks above; fails while catalog coverage is unresolved
```

The read-only API smoke test uses `merged-graph-v4` by default (`GRAPH_QA_TEST_GRAPH_ID` overrides it, but the fixture must contain the same Loan API ambiguity and >100 operations). It checks counts against every inventory page, duplicate-free paging, multiple presentation tables, clarification with exact IDs, no-match, no-evidence and unsupported-write outcomes. It can also target `http://127.0.0.1:4173` to exercise the UI proxy. For deterministic tests without paid model calls, start the API with `PLANNER_MODE=heuristic ANSWER_MODE=deterministic EMBEDDING_PROVIDER=none`. These checks do not certify provider-specific LLM behavior or production load capacity.

The full question-bank audit fills each parameterized template with two graph-backed variants using the same Assist code as the UI, tests unfinished templates, retries offered ambiguity choices, and checks graph evidence and table/narrative contracts. It writes [the full matrix](docs/question-bank-audit.md) and a detailed JSONL report. It does **not** treat `answered` or HTTP 200 as proof of semantic correctness. The command exits nonzero for contract failures or unresolved planner coverage; `--contracts-only` explicitly limits the gate to contracts. Example: `npm run test:catalog -- --base-url http://127.0.0.1:4173 --workers 4`. Complex questions in the YAML are graph investigations, not a guarantee that the local heuristic grammar supports every phrasing. Live LLM behavior and every possible parameter combination require separate validation.

The [compound-planner follow-up](docs/planner-coverage-followup.md) records the latest implementation, exact-result checks, and remaining coverage. The audit now breaks down clarification reasons and also fails coverage when a candidate-selection retry remains unresolved; simply offering or choosing a candidate is not counted as success. The semantic regression suite verifies exposure/classification intersections, event producers, missing metadata, distinct status-code neighbors, shared hierarchy membership, multi-domain applications, and hierarchy coverage denominators against independent source-graph joins. Run the adjacent backend's pytest suite as well before releasing.

## Add graph datasets and catalogs

`graph.config.json` supports a primary `source`, an explicit `sources` array, and automatic discovery of every `.json` file in `graphs/`. Run `npm run prepare-data` after adding a graph. The Atlas dataset selector is populated from the generated registry.

Add the matching catalog at:

```text
public/question-catalogs/<graph-name>-questions.yaml
```

For example, `merged-graph-v4.json` uses `public/question-catalogs/merged-graph-v4-questions.yaml`. Selecting a different graph immediately switches the planner graph id and loads its matching catalog.

## JSON document API

Planner documents are stored as individual JSON files under `.planner-data/workspaces/` by default.

```text
GET, POST                 /app-api/workspaces
GET, PATCH, DELETE        /app-api/workspaces/{workspaceId}
GET, POST                 /app-api/workspaces/{workspaceId}/projects
GET, PATCH, DELETE        /app-api/workspaces/{workspaceId}/projects/{projectId}
GET, POST                 /app-api/workspaces/{workspaceId}/projects/{projectId}/chats
GET, PATCH, DELETE        /app-api/workspaces/{workspaceId}/projects/{projectId}/chats/{chatId}
```

On static-only hosting, the same document model falls back to browser local storage. Local `serve.py` provides the filesystem APIs and proxies the allowlisted query/discovery routes under `/v1/`, plus `/health/live` and `/health/ready`, to the Graph Query Planner service.
