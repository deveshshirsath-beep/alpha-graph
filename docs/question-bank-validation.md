# Question-bank validation — 21 September 2026

This report records the earlier baseline. See the [compound-planner coverage follow-up](planner-coverage-followup.md) and [latest full audit](question-bank-improved.md) for subsequent fixes and remaining failures.

The reported Mortgage Loan API question is fixed. **Full catalog coverage is not yet complete, and this is not a production-readiness certification.** The matrix deliberately distinguishes API/rendering contracts from correct question semantics.

## Why the query failed

The server was reachable. Its local planner had no grammar for the reverse business-context rollup wording, so it returned `unsupported`. The API is configured in `auto` mode, but no model API key is configured; these runs used heuristic planning and deterministic answers.

The fix compiles explicit context joins: API → exposing application → implemented capability → hierarchy and capability-owning teams. It does not traverse unrelated runtime calls or claim that a capability owner operationally owns an API. Mortgage Loan API has two distinct identities, so a name-only question correctly asks the user to choose one.

| Selected API | Exact context results | Live UI-adapter pages |
|---|---:|---:|
| Mortgage Loan API, v5 | 204 | 3 |
| Mortgage Loan API, v6 | 73 | 1 |

Expected memberships were independently calculated from the JSON snapshot and compared with every returned API page. The v5 result contains 9 business areas, 38 business domains, 105 capabilities, and 52 teams. Evidence compaction can shorten a page; the client follows `nextOffset`, not a fixed page size.

## Additional corrected regressions

- Layer-by-type counts are recognized, and their narrative counts entities rather than aggregate rows: Business 799 across 5 types, API 73,570 across 19 types, Runtime 1,946 across 3 types.
- Business-layer searches no longer include API or Runtime matches.
- “No parent or more than one parent” excludes ordinary one-parent nodes. This snapshot returns no service-domain exceptions and one capability exception.
- “Teams own no capabilities” is no longer interpreted as a capability literally named “no capabilities.”
- Complete named-type business estates include implementing applications and their API chains, not only containment descendants. The Accounts and Deposits example returns exactly 739 requested entities across 13 compacted API pages.
- Teams owning capabilities implemented by an application are resolved as a two-hop join. The payments-app example returns 15 teams.
- Unfinished catalog parameters request clarification without execution. Literal route parameters such as `/accounts/{account_id}` remain valid graph data in both UI and backend.

## Scope of the full audit

The read-only audit uses the UI's real catalog parser, Assist parameter binding, API adapter, and table/narrative adapters through the same-origin server on port 4173.

The UI and backend copies of both the YAML catalog and JSON graph were verified byte-identical by SHA-256; this was not a stale-catalog or mismatched-snapshot problem.

| Cases | Count |
|---|---:|
| Concrete YAML sample questions | 320 |
| Templates with no parameters | 208 |
| Parameterized templates, two graph-backed variants each | 642 |
| Parameterized templates deliberately left unfinished | 321 |
| Total primary cases | 1,491 |

The 529 templates comprise 208 unparameterized and 321 parameterized templates. Ambiguity retries are additional requests, not extra primary cases. For those smoke retries, the harness picks one offered candidate; it does not claim this is the user's intended identity. Fixtures include entity selectors, collections, property text and hop limits, but not every possible parameter combination.

Every case checks response identifiers, source-backed evidence nodes/edges, endpoint-complete preview graphs, and usable table/narrative shapes. The full [outcome matrix](question-bank-audit.md) and [raw records](question-bank-audit.jsonl) preserve unsupported questions and clarification outcomes. `semanticVerified: false` in those bulk records is intentional: response validity is not a proof of answer correctness.

The separate semantic regression suite compares exact expected node sets, counts, exclusions and all result pages against independent source-graph joins. It is narrower than the entire catalog. All eight starter questions also have independent expected totals and row predicates.

### Final bulk results

Completed at 2026-09-21 10:25:31 UTC against the current local API. All 1,491 response/evidence/rendering contracts passed. The coverage gate remains **nonzero**.

| Primary cases | Answered | Clarification | No evidence | No match | Unsupported |
|---|---:|---:|---:|---:|---:|
| 320 concrete samples | 78 | 132 | 10 | 2 | 98 |
| 850 filled-template cases | 325 | 203 | 72 | 9 | 241 |
| 321 unfinished templates | 0 | 321 | 0 | 0 | 0 |

Seventy-two additional candidate-selection retries returned 47 answers and 25 no-evidence outcomes. The 602 unresolved coverage cases comprise 339 unsupported cases and 263 clarification cases without an offered candidate retry; that latter group needs review because some questions genuinely omit required scope or thresholds. These counts refer to case instances, not unique question intents. No-match and no-evidence outcomes also require domain review before calling the entire catalog correct.

## Executed checks

- Backend: 182 tests passed, including real-snapshot semantic regressions.
- Frontend: lint, type checking, 108 unit/integration tests and production build passed.
- Proxy: 7 boundary tests passed, covering server-side authentication, cross-origin rejection, body limits, sanitized upstream errors and timeouts.
- Live API/proxy smoke: all 1,932 operation rows across 20 pages, ambiguity resolution, multi-table inventory, no-match, no-evidence and read-only rejection passed.
- Live starter regressions: all eight questions passed independent graph assertions.
- Live catalog regressions: exact Mortgage API rollups, business estate, owning teams, parent exceptions, grouped counts and layer search passed.
- Browser: duplicate-name selection and rerun; Assist search, required-value validation, exact-ID preservation and draft preview; method/path evidence; next/previous/final API pages; saved conversation after reload; unfinished-parameter blocking; valid no-evidence without a fabricated table; and PII/PCI breakdown. No browser console errors were observed in that test tab.

The browser PII/PCI breakdown was 1,458 PII-only, 1 PCI-only, 25 both, 448 neither, totaling 1,932. “Neither” means no recorded classification edge, not a compliance guarantee.

## Remaining limits

Many compound governance, cross-layer comparison, ranking and specialized impact questions remain outside the local planner grammar. Several catalog questions also omit an exact root or a needed threshold. These outcomes must be reviewed separately from legitimate name ambiguity and absent graph evidence.

`npm run test:catalog` exits nonzero while planner coverage remains unresolved, even if every transport/rendering contract passes. `--contracts-only` explicitly narrows that gate; it is not a full-catalog pass. No live model-provider behavior, external service credentials, internet-facing deployment security or production load capacity was certified.

Further coverage requires extending and validating deterministic intent families, or configuring and validating the existing LLM-backed planner. Enabling a model is not itself proof of complete coverage. No credentials or paid model calls were added during this audit.

## Reproduce

With both local servers running:

```sh
npm run test:all
npm run test:proxy
GRAPH_QA_API_URL=http://127.0.0.1:4173 npm run test:api
GRAPH_QA_API_URL=http://127.0.0.1:4173 npm run test:starters
npm run test:catalog-regressions
npm run test:catalog
```

Backend tests: run `.venv/bin/python -m pytest -p no:cacheprovider` in the adjacent `Query Planner` directory. The bulk audit is repeatable and records its graph fingerprint and completion timestamp.
