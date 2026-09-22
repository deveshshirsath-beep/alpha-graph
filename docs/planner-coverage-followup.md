# Planner coverage follow-up

This is a measured coverage improvement, **not certification that the entire question bank is supported**. The full catalog release gate remains nonzero while unsupported intents or unresolved clarification cases remain. No model credentials or external model calls were added.

## What changed

The adjacent `Query Planner` backend now has a reusable, fully consumed compound compiler. It composes the existing typed graph algebra rather than looking up YAML strings or canned answers. Established executable selection plans retain precedence, including the scoped XOR starter.

- Exposure/classification intersections, classification plus relationship filters, and two-clause AND/OR/negative relationship selections.
- Direct and API-derived consumer subscriptions; explicit database read/connect/write/update unions.
- Missing or whitespace-only safe properties and missing requested relationships.
- Distinct neighbor counts, avoiding inflation from parallel edges; typed per-root multi-hop counts through the new bounded `correlate` operation.
- Shared hierarchy membership, multi-domain applications, and expected-parent/child coverage ratios with explicit denominators.
- Typed business context and request-contract joins, preserving the distinction between application-level capability associations and actual operational ownership.
- Database-upstream investigations include bounded reverse runtime paths through callers/events before collecting business context; the response states the six-hop bound.
- Explicitly bounded structural-scope comparisons and change scenarios; validation now follows the executor's reverse-impact/context policies instead of treating impact as an outbound-only traversal.
- Computed counts and comparison membership survive projection, sorting, re-projection, and pagination with row provenance intact.
- Unsupported classification suffixes cannot fall through to a broader legacy answer that omits conditions.

`correlate` validates every typed hop, per-route depth, and cumulative route size. Its executor uses a shared expansion-work budget and fails explicitly on exhaustion, rather than returning incomplete counts as exact zeros. The generated OpenAPI contract includes the additive operation and was regenerated and checked.

## Measured before and after

The final run completed at **2026-09-21 11:51:57 UTC**, through the UI proxy at `http://127.0.0.1:4173`. Both runs used the same 1,491 fixtures and snapshot fingerprint `67965e858cabc21745cdbda0b95872023a2cf9b67e3178d46869d27955e34af7`.

| Metric | Earlier baseline | Updated planner |
|---|---:|---:|
| Sample questions directly answered | 78 / 320 | 101 / 320 |
| Sample questions unsupported | 98 / 320 | 72 / 320 |
| Filled-template cases directly answered | 325 / 850 | 365 / 850 |
| Filled-template cases unsupported | 241 / 850 | 213 / 850 |
| Flagged coverage cases | 602 | 531 |
| API/adapter/evidence-contract failures | 0 / 1,491 | 0 / 1,491 |

See [all 320 sample questions, grouped by outcome](question-bank-sample-outcomes.md) for the complete answered, no-evidence, and unresolved lists behind these sample counts.

Across samples and filled templates, **77 previously non-executable cases now execute** (including candidate-selection retries). Five previously executable but condition-dropping cases now stop for clarification: audit cases 537, 538, 1361, 1362, and 1387. The net increase is 72 executable cases. An executable `no_evidence` result means the represented graph has no matches; it does not imply the question was unsupported.

All 321 unfinished templates still request parameters rather than executing literal placeholders. Of 82 candidate-selection retries, 77 execute, four still require clarification, and one has no match. The stricter gate retains those five unresolved retries. There are also ten primary `no_match` outcomes, which require fixture/entity review rather than being treated as a compiler success.

**The full release gate remains failing: 531 flagged cases.** This consists of 285 unsupported sample/filled-template cases and 246 unresolved clarification cases. Clarifications include genuine missing-input/ambiguity cases as well as missing grammar support; 228 primary responses specifically report unconsumed constraints. None are relabeled as successful answers to improve the numbers. See the preserved [baseline audit](question-bank-audit.md) and the [final audit](question-bank-improved.md) for case-level outcomes.

## Independent full-snapshot checks

These expected answers are calculated directly from source-graph edges, not from the returned plan or the planner's path-finding code. Membership comparisons include every API result page.

| Investigation | Independently verified result |
|---|---:|
| External AND PII operations | 724 |
| External AND PCI operations | 16 |
| PII OR PCI producers of `banking.api.events-unknown` | 1,349 |
| Classified operations with no subscribing consumer | 0 |
| Operations with any required metadata property missing/blank | 1 |
| Operations returning multiple distinct status codes | 71 |
| Service domains referenced by multiple business domains | 0 |
| Capabilities crossing service-domain boundaries | 1 (`Digital Channel`, two parents) |
| Business domains sharing service-domain membership | 0 |
| Applications spanning multiple business hierarchy groups | 17 |
| Business capabilities associated with OAuth 2-governed operations | 337 |
| Operations upstream of `banking_demo-postgres` through reverse runtime paths (six-hop bound) | 1,631 (33 pages) |

The suite also checks hierarchy coverage denominators, security-governed business context, the earlier Mortgage API rollups, parent exceptions, complete business estates, and existing starter counts. Zero matches are legitimate snapshot results, not planner failures or proof of real-world absence.

## Verification and release gate

- Backend: 229 passing tests, including 48 focused compound/DSL cases covering exact sets, duplicate edges, zero matches, ambiguous names, selected IDs, all-page/count consistency, malformed suffixes, safe property fields, route validation, expansion budgets, reverse caller paths, and computed row identity/provenance.
- Frontend: lint, type checking, 108 unit/integration tests and production build.
- Proxy: seven boundary/security tests.
- All eight starters and the live API paging/ambiguity/status smoke suite.
- Browser: rendered External/PCI answer (16), correlated parent count (two), XOR starter (169), and safe non-execution of an unconsumed destructive suffix. No browser console errors were observed. A separate test conversation was used; existing conversations were not rewritten or deleted.
- Full catalog: 1,491 primary cases, comprising all 320 concrete samples, all 529 templates, two graph-backed values for every parameterized template, and all 321 unfinished templates. See [the current full audit](question-bank-improved.md) and [raw records](question-bank-improved.jsonl).

The bulk audit checks response/evidence/rendering contracts; its records deliberately retain `semanticVerified: false`. The independent semantic oracles cover the families listed above, not every catalog intent. The audit separates clarification reason codes and no longer treats a still-unresolved candidate-selection retry as a successful coverage result.

`GRAPH_QA_API_URL=http://127.0.0.1:4173 npm run test:release` combines frontend/build, proxy, live API, starters, semantic regressions, and the full catalog gate. Run backend pytest separately. The release command is intentionally not green while the catalog backlog remains; do not use `--contracts-only` to claim release readiness.

## Remaining work

Remaining unsupported families include more general grouped cross-layer statistics, nested contract lineage, transitive event/consumer joins, advanced multi-root rankings/comparisons, cycle/alternate-path analysis, and specialized telemetry investigations. Some require additional bounded graph operators, not only language recognition. Other questions genuinely need a root, threshold, or an exact duplicate-name selection.

Several old `answered` responses were false positives: legacy plans selected External operations without applying the requested PII/PCI or runtime-path predicate, or applied a security scenario to a business-change question. Those unsafe paths are now either compiled with explicit conditions or stopped. An unchanged count of successful HTTP responses would therefore be the wrong quality target.

Optional model-assisted planning remains available for phrasing outside the deterministic grammar, but enabling it is a separate configuration and evaluation step. It cannot supply missing graph facts or operators, and its plans still require validation and evidence-based execution. No live-provider behavior, load capacity, or internet-facing deployment security was certified by these local checks.
