import { DEMO_CHAT } from "./planner-demo.js";

/**
 * Demo answers for "if <field> changes, what breaks" and its follow-ups, for any field name.
 * The numbers are made up but stable: the same field always gets the same answer. Consumers,
 * operations, data stores and teams are real nodes from the demo graph, so the answer's
 * snapshot still opens onto them in the canvas.
 */

const POOL = (() => {
  const nodes = new Map();
  for (const turn of DEMO_CHAT.turns) for (const node of turn.answer.graph.nodes) nodes.set(node.id, node);
  const of = (type) => [...nodes.values()].filter((node) => node.type === type);
  return { consumers: of("CONSUMER"), operations: of("OPERATION"), apps: of("APPLICATION"), stores: of("DATABASE"), events: of("EVENT"), teams: of("TEAMS") };
})();

const SCHEMAS = ["CustomerProfile", "PartyAuthenticationRequest", "AccountSummary", "PaymentInstruction", "KycCase", "CardLimitUpdate", "LoanApplication", "BeneficiaryRecord", "StatementLine", "ConsentGrant", "TransactionEvent", "SessionContext"];
const PATHS = [
  ["GET", "/v5/banking/cross-channel/party-authentication/{partyAuthenticationId}"],
  ["POST", "/v3/accounts/{accountId}/transactions/search"],
  ["POST", "/v2/payments/domestic"],
  ["GET", "/v1/customers/{customerId}/profile"],
  ["PUT", "/v4/cards/{cardId}/limits"],
  ["POST", "/v2/loans/applications"],
  ["GET", "/v1/kyc/cases/{caseId}"],
  ["PATCH", "/v3/beneficiaries/{beneficiaryId}"],
  ["GET", "/v2/statements/{statementId}/lines"],
  ["POST", "/v1/consents"],
];

function rng(seed) {
  let h = 2166136261;
  for (const char of seed) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const between = (r, min, max) => min + Math.floor(r() * (max - min + 1));
function pick(r, list, count) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy.slice(0, Math.min(count, copy.length));
}
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
const list = (items) => items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

function fieldType(field) {
  const f = field.toLowerCase();
  if (/(^|[._])id$|id$/.test(f)) return "string (UUID)";
  if (/(date|at|time)$/.test(f)) return "date-time";
  if (/(amount|balance|limit|rate|price|fee)/.test(f)) return "decimal";
  if (/(is|has|enabled|flag)/.test(f)) return "boolean";
  return "string";
}
const looksPersonal = (field) => /(name|email|phone|address|dob|birth|ssn|tax|national|customer|party|account|iban|card|pan)/i.test(field);

/** Everything the answers share for one field, derived once from its name. */
function facts(field) {
  const r = rng(field.toLowerCase());
  const schemas = pick(r, SCHEMAS, between(r, 3, 6)).map((name) => `${name}`);
  const endpoints = pick(r, PATHS, between(r, 4, 7));
  const consumers = pick(r, POOL.consumers, between(r, 3, Math.min(6, POOL.consumers.length)));
  const operations = pick(r, POOL.operations, between(r, 4, 7));
  const stores = pick(r, POOL.stores, POOL.stores.length);
  const events = pick(r, POOL.events, 1);
  const teams = POOL.teams.length ? POOL.teams : [{ name: "Platform Team" }];
  const apis = between(r, Math.max(2, endpoints.length - 2), endpoints.length + 3);
  const required = between(r, 1, endpoints.length - 1);
  const responses = between(r, 1, endpoints.length - 1);
  const secondOrder = between(r, 9, 48);
  const pii = looksPersonal(field) ? between(r, 1, schemas.length) : 0;
  const untested = between(r, 1, Math.max(1, apis - 1));
  const calls = consumers.map(() => between(r, 4, 180) * 1000);
  return { field, type: fieldType(field), schemas, endpoints, consumers, operations, stores, events, teams, apis, required, responses, secondOrder, pii, untested, calls };
}

function graphFor(f) {
  const nodes = [{ id: `FIELD:demo:${f.field}`, name: f.field, type: "FIELD", layer: "api" }];
  const edges = [];
  const edge = (from, to, type) => edges.push({ id: `EDGE:${type}:${from}->${to}`, sourceId: from, targetId: to, relationshipType: type, type });
  for (const schema of f.schemas) { const id = `SCHEMA:demo:${schema}`; nodes.push({ id, name: schema, type: "SCHEMA", layer: "api" }); edge(id, nodes[0].id, "HAS-PROPERTY"); }
  f.operations.forEach((op, i) => { nodes.push(op); edge(op.id, `SCHEMA:demo:${f.schemas[i % f.schemas.length]}`, "RETURNS"); });
  f.consumers.forEach((consumer, i) => { nodes.push(consumer); edge(consumer.id, f.operations[i % f.operations.length].id, "SUBSCRIBES"); });
  for (const store of f.stores) { nodes.push(store); edge(f.operations[0].id, store.id, "WRITES-TO"); }
  for (const event of f.events) { nodes.push(event); edge(f.operations.at(-1).id, event.id, "PRODUCES"); }
  return { nodes, edges };
}

const code = (text) => `\`${text}\``;
const names = (nodes) => nodes.map((node) => node.name);

const FOLLOW_UPS = {
  consumers: (field) => `Which consumer apps read ${field}, and through which endpoints?`,
  pii: (field) => `Is ${field} classified as PII, and where is it stored?`,
  owners: (field) => `Which teams own the APIs that expose ${field}?`,
  rollout: (field) => `How do we roll out a change to ${field} safely?`,
};
const followUps = (field, except) => Object.entries(FOLLOW_UPS).filter(([key]) => key !== except).map(([, make]) => make(field));

function impact(f) {
  const [first, second] = f.consumers;
  const [method, path] = f.endpoints[0];
  const rows = [
    ["Schemas", String(f.schemas.length), list(f.schemas.map((s) => `${s}.${f.field}`))],
    ["Endpoints (request)", String(f.required), "Required in the request body"],
    ["Endpoints (response)", String(f.responses), "Returned to callers"],
    ["APIs", String(f.apis), "Expose those endpoints"],
    ["Consumer apps", String(f.consumers.length), list(names(f.consumers))],
    ["Second-order consumers", String(f.secondOrder), "Subscribe to the upstream operations"],
    ["Downstream operations", String(f.operations.length), "Map it into their own payloads"],
    ["Data stores", String(f.stores.length), list(names(f.stores))],
    ["Event streams", String(f.events.length), list(names(f.events))],
  ];
  return {
    chips: [{ label: "FIELD" }, { verb: "USED BY", dir: "in" }, { label: "3 HOPS" }],
    narrative: `### Changing ${code(f.field)}\n\n${code(f.field)} is a ${code(f.type)} field on **${plural(f.schemas.length, "schema")}** (${f.schemas.length > 2 ? `${f.schemas.slice(0, 2).map(code).join(", ")} and ${f.schemas.length - 2} more` : list(f.schemas.map(code))}). It travels through **${plural(f.endpoints.length, "endpoint")} in ${plural(f.apis, "API")}**, so a rename or type change reaches well past the schema that owns it.\n\n#### What would break\n\n- **${plural(f.required, "endpoint")}** reject requests that still send the old shape, because the field is required there\n- **${plural(f.consumers.length, "consumer app")}** read it, led by **${first.name}**${second ? ` and **${second.name}**` : ""}\n- **${plural(f.operations.length, "downstream operation")}** map it into their own payloads, from ${f.operations[0].name} to ${f.operations.at(-1).name}\n- **${plural(f.stores.length, "data store")}** and **${plural(f.events.length, "event stream")}** persist it: ${list([...names(f.stores), ...names(f.events)].map(code))}\n\n> Riskiest point: ${code(`${f.schemas[0]}.${f.field}`)} is required in ${code(`${method} ${path}`)}, which **${first.name}** calls on every session. A rename there fails validation before any fallback runs.`,
    bullets: [
      f.pii ? `${code(f.field)} is classified as PII in ${f.pii} of the ${f.schemas.length} schemas, so any change also needs a privacy review.` : `${code(f.field)} carries no PII classification, so the change needs no privacy review.`,
      `${plural(f.untested, "API")} of the ${f.apis} have no contract test covering ${code(f.field)} today.`,
    ],
    note: "Read from the snapshot's HAS-PROPERTY, ACCEPTS, RETURNS, SUBSCRIBES, CALLS and WRITES-TO relationships.",
    table: { title: `Impact of changing ${f.field}`, columns: ["Impact", "Count", "Where"], rows },
    reasoning: [
      `Matched ${f.field} to FIELD nodes on ${plural(f.schemas.length, "schema")} by name and JSON path.`,
      `Walked ACCEPTS and RETURNS in from those schemas to ${plural(f.endpoints.length, "endpoint")} across ${plural(f.apis, "API")}, then SUBSCRIBES in to ${plural(f.consumers.length, "consumer app")}.`,
      `Walked CALLS, WRITES-TO and PRODUCES out to the downstream operations, data stores and event streams.`,
    ],
    followUps: followUps(f.field),
  };
}

function consumers(f) {
  const rows = f.consumers.map((consumer, i) => {
    const [method, path] = f.endpoints[i % f.endpoints.length];
    return [consumer.name, `${method} ${path}`, i % 3 === 0 ? "Reads and writes" : "Reads", `${(f.calls[i] / 1000).toFixed(0)}K / day`];
  });
  const busiest = f.consumers[f.calls.indexOf(Math.max(...f.calls))];
  return {
    chips: [{ label: "FIELD" }, { verb: "READ BY", dir: "in" }, { label: "CONSUMER" }],
    narrative: `### Who reads ${code(f.field)}\n\n**${plural(f.consumers.length, "consumer app")}** read ${code(f.field)} through **${plural(Math.min(f.consumers.length, f.endpoints.length), "endpoint")}**. **${busiest.name}** is the heaviest caller at **${(Math.max(...f.calls) / 1000).toFixed(0)}K calls a day**, so it is the one to migrate first.\n\n- ${plural(rows.filter((row) => row[2] === "Reads and writes").length, "app")} also write it back, so both directions of the contract change\n- The rest only read it, and can move as soon as the new field is served alongside the old one`,
    bullets: [`${f.secondOrder} more consumers reach it second-hand, through the upstream operations these apps call.`],
    note: "Read from SUBSCRIBES and CALLS relationships, with call volumes from the last 30 days of gateway traffic.",
    table: { title: `Consumers of ${f.field}`, columns: ["Consumer app", "Endpoint", "Usage", "Volume"], rows },
    reasoning: [
      `Started from the ${plural(f.endpoints.length, "endpoint")} that accept or return ${f.field}.`,
      "Walked SUBSCRIBES in to each consumer app and kept the endpoint it reaches the field through.",
      "Joined gateway traffic to rank the apps by daily call volume.",
    ],
    followUps: followUps(f.field, "consumers"),
  };
}

function pii(f) {
  const stores = [...f.stores.map((store) => [store.name, "Database", f.pii ? "PII, encrypted at rest" : "Internal", "7 years"]), ...f.events.map((event) => [event.name, "Event stream", f.pii ? "PII, masked in transit" : "Internal", "30 days"])];
  return {
    chips: [{ label: "FIELD" }, { verb: "CLASSIFIED AS", dir: "out" }, { label: "PII" }],
    narrative: f.pii
      ? `### Is ${code(f.field)} personal data?\n\n**Yes.** ${code(f.field)} is classified as **PII** in **${f.pii} of ${plural(f.schemas.length, "schema")}**, and it is stored in **${plural(stores.length, "place")}**. Any rename or type change therefore needs a privacy review and a migration of the stored copies, not just the API contract.\n\n- Stored at rest in ${list(names(f.stores).map(code))}\n- Masked in transit on ${list(names(f.events).map(code))}`
      : `### Is ${code(f.field)} personal data?\n\n**No.** ${code(f.field)} carries no PII classification on any of its ${plural(f.schemas.length, "schema")}, so a change needs no privacy review. It is still stored in **${plural(stores.length, "place")}**, and those copies migrate with the change.\n\n- Stored at rest in ${list(names(f.stores).map(code))}\n- Published on ${list(names(f.events).map(code))}`,
    bullets: [`Retention follows the strictest store: ${stores[0]?.[3] || "7 years"}.`],
    note: "Read from CLASSIFIED-AS, WRITES-TO and PRODUCES relationships.",
    table: { title: `Where ${f.field} is stored`, columns: ["Store", "Kind", "Classification", "Retention"], rows: stores },
    reasoning: [
      `Checked CLASSIFIED-AS on each of the ${plural(f.schemas.length, "schema")} that define ${f.field}.`,
      "Walked WRITES-TO and PRODUCES out from the operations that handle it to find every stored copy.",
      "Read retention from each store's data-governance metadata.",
    ],
    followUps: followUps(f.field, "pii"),
  };
}

function owners(f) {
  const split = Math.ceil(f.apis / f.teams.length);
  const rows = f.teams.map((team, i) => [team.name, String(i === f.teams.length - 1 ? f.apis - split * (f.teams.length - 1) : split), i === 0 ? "Change approver" : "Consulted", i === 0 ? "#iam-oncall" : "#channels-oncall"]);
  return {
    chips: [{ label: "FIELD" }, { verb: "OWNED BY", dir: "in" }, { label: "TEAM" }],
    narrative: `### Who owns ${code(f.field)}\n\n**${plural(f.teams.length, "team")}** own the ${plural(f.apis, "API")} that expose ${code(f.field)}. **${f.teams[0].name}** owns the schema it is defined on, so it approves any change; the others are consulted for their own APIs.\n\n- ${f.teams[0].name} owns ${code(f.schemas[0])}, where the field is required\n- Every owning team has to sign off before the old field is removed`,
    bullets: [`The consumer apps are owned outside these teams, so the rollout needs their product owners too.`],
    note: "Read from OWNS and IMPLEMENTS relationships between teams, business capabilities and APIs.",
    table: { title: `Owners of ${f.field}`, columns: ["Team", "APIs", "Role", "On-call"], rows },
    reasoning: [
      `Walked from ${f.field} up through its schemas to the ${plural(f.apis, "API")} that expose it.`,
      "Followed IMPLEMENTS from those APIs to their business capability, then OWNS back to each team.",
      "Marked the owner of the defining schema as the change approver.",
    ],
    followUps: followUps(f.field, "owners"),
  };
}

function rollout(f) {
  const lead = f.consumers[0].name;
  const rows = [
    ["1. Add", `Serve the new field next to ${f.field} on all ${plural(f.endpoints.length, "endpoint")}`, f.teams[0].name, "Week 1"],
    ["2. Dual-write", `Write both fields to ${list(names(f.stores))}`, f.teams[0].name, "Week 1–2"],
    ["3. Migrate", `Move ${plural(f.consumers.length, "consumer app")} over, ${lead} first`, "Consumer owners", "Week 2–5"],
    ["4. Deprecate", `Mark ${f.field} deprecated and log every remaining read`, f.teams.at(-1).name, "Week 6"],
    ["5. Remove", `Drop ${f.field} once reads reach zero for 14 days`, f.teams[0].name, "Week 8"],
  ];
  return {
    chips: [{ label: "FIELD" }, { verb: "CHANGE PLAN", dir: "both" }, { label: "5 STEPS" }],
    narrative: `### Rolling out a change to ${code(f.field)}\n\nChange it in **5 steps over about 8 weeks**, so no consumer ever sees a broken contract. The new field ships next to ${code(f.field)} first; the old one only goes once nothing reads it.\n\n- Start with **${lead}**, the heaviest caller, to surface problems early\n- Keep dual-writes on until every stored copy is backfilled${f.pii ? "\n- Book the privacy review before step 3, because the field is PII" : ""}`,
    bullets: [`Contract tests are missing in ${plural(f.untested, "API")}; add them in step 1 so step 5 is safe.`],
    note: "The plan follows the dependency order found in the graph: providers first, then consumers, then storage.",
    table: { title: `Rollout plan for ${f.field}`, columns: ["Step", "What", "Owner", "When"], rows },
    reasoning: [
      `Ordered the ${plural(f.apis, "API")} before their ${plural(f.consumers.length, "consumer app")}, so the new field exists before anyone needs it.`,
      "Ranked consumers by call volume to pick the first to migrate.",
      "Put storage last, so no stored copy loses the field while a reader still depends on it.",
    ],
    followUps: followUps(f.field, "rollout"),
  };
}

const FIELD = "[A-Za-z_][\\w.\\-\\[\\]/]*(?:\\s+[A-Za-z_][\\w.\\-\\[\\]/]*){0,2}?";
const clean = (field) => field.replace(/^[`'"]+|[`'"]+$/g, "").trim();
const INTENTS = [
  ["consumers", new RegExp(`^which consumer apps read (${FIELD}), and through which endpoints$`, "i")],
  ["pii", new RegExp(`^is (${FIELD}) classified as pii, and where is it stored$`, "i")],
  ["owners", new RegExp(`^which teams own the apis that expose (${FIELD})$`, "i")],
  ["rollout", new RegExp(`^how (?:do|should) we roll out a change to (${FIELD}) safely$`, "i")],
];
// "if customerId changes, what breaks", "what breaks if we rename the account number field", "what happens when party_id is removed"
const IMPACT = new RegExp(`\\b(?:if|when)\\s+(?:we\\s+|i\\s+)?(?:change|rename|remove|drop|modify|update|deprecate)?\\s*(?:the\\s+)?(?:field\\s+)?[\`'"]?(${FIELD})[\`'"]?(?=\\s+(?:field\\b|changes?\\b|is\\b|gets\\b|type\\b)|\\s*[,?.!]|\\s*$)`, "i");
const ASKS_IMPACT = /\b(break|breaks|broken|impact|happen|happens|affect|affected|fail)\b/i;
const MENTIONS_CHANGE = /\b(change|changes|changed|rename|renamed|remove|removed|drop|dropped|modify|modified|update|updated|deprecate|deprecated)\b/i;

/** The demo answer for a field-impact question or one of its follow-ups, or null when the question is something else. */
export function fieldImpactAnswer(question) {
  const text = String(question).trim().replace(/[\s?.!]+$/, "");
  for (const [intent, pattern] of INTENTS) {
    const match = text.match(pattern);
    if (match) {
      const f = facts(clean(match[1]));
      const answer = { consumers, pii, owners, rollout }[intent](f);
      return { ...answer, graph: graphFor(f), chain: true };
    }
  }
  if (!ASKS_IMPACT.test(text) || !MENTIONS_CHANGE.test(text)) return null;
  const match = text.match(IMPACT);
  const field = match && clean(match[1]);
  if (!field || /^(we|i|it|this|that|they|something|anything)$/i.test(field)) return null;
  const f = facts(field);
  return { ...impact(f), graph: graphFor(f), chain: true };
}
