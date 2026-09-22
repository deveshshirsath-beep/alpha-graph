# Starter investigation validation

Verified on 2026-09-21 against the current local Query Planner source, the `merged-graph-v4` snapshot, and the same request/response adapter used by the UI. An isolated API ran with `PLANNER_MODE=heuristic`, `ANSWER_MODE=deterministic`, and `EMBEDDING_PROVIDER=none`. No external model calls were used; these results do not certify live LLM narrative quality or other datasets.

| Starter question | Verified result |
| --- | --- |
| Which applications and APIs exist? | 1,868 items: 1,842 APIs and 26 applications |
| How many APIs exist? | 1,842 APIs |
| Which APIs are associated with Accounts and Deposits? | 243 APIs |
| Which operations read from banking_demo-postgres? | 1,538 operations |
| Which operations under Accounts and Deposits are classified as PII and PCI? | 3 operations |
| Which operations under Accounts and Deposits are classified as PII but not PCI? | 168 operations |
| Which operations under Accounts and Deposits are classified as (PII or PCI) and not (PII and PCI)? | 169 operations |
| Compare operations under Accounts and Deposits versus business domain Cards | 666 distinct operations; 157 shared |

The portfolio and database examples are filled from parameterized templates, not unresolved placeholders. Choosing a card only fills the draft; users can edit it before Run. Other datasets get unscoped alternatives rather than names copied from this fixture.

## What is checked

`npm run test:starters` sends all eight questions through the production API adapter. It independently reads the source graph to assert exact totals, nonempty answers/evidence, uniqueness of returned rows, and membership in the requested sets. For Boolean questions this verifies all requested conditions, including exclusions; for comparison it checks the intersection count and returned rows' membership counts. It also checks that matched-graph nodes and edges exist in the source and that edges have both endpoints in the returned graph. The complex plans must contain the relevant intersection/union/difference or comparison operations.

Large answers are paginated and evidence previews may be compacted. This check validates each returned page's rows and the exact total, not retrieval of every page. The UI retains the API's paging and truncation warnings. Business scope follows containment → capabilities → implementing applications → exposed APIs → operations; it is an application-level association, not a claim of exclusive ownership. “Not PCI” means absence of the relevant classification edge in this snapshot, not proof of regulatory compliance.

The old “Which external operations handle PII?” prompt was excluded: the tested heuristic response selected External operations without enforcing the PII condition. An `answered` status alone was therefore not accepted as sufficient validation. Backend source was not changed by this UI task.

To reproduce, start the current API with the modes above and run:

```sh
GRAPH_QA_API_URL=http://127.0.0.1:8001 npm run test:starters
```

`GRAPH_QA_TEST_GRAPH_PATH` can override the source-file location, but the named entities and snapshot must still be the same fixture. The running API needs a restart to pick up backend source changes; rebuilding the frontend does not restart it.
