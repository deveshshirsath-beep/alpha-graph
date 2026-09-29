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
const code = (text) => `\`${text}\``;
const names = (nodes) => nodes.map((node) => node.name);
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
const looksPersonal = (field) => /(name|email|phone|address|dob|birth|ssn|tax|national|customer|party|account|iban|card|pan|authorization|cookie|session|token|forwarded)/i.test(field);

const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** Everything the answers share for one field or header, derived once from its name. */
function facts(field, kind = "field") {
  const isHeader = kind !== "field";
  const r = rng(isHeader ? `${kind}:${field.toLowerCase()}` : field.toLowerCase());
  const schemas = pick(r, SCHEMAS, between(r, 3, 6)).map((name) => `${name}`);
  const endpoints = pick(r, PATHS, between(r, 4, 7));
  const consumers = pick(r, POOL.consumers, between(r, 3, Math.min(6, POOL.consumers.length)));
  const operations = pick(r, POOL.operations, between(r, 4, 7));
  const stores = pick(r, POOL.stores, POOL.stores.length);
  const events = pick(r, POOL.events, 1);
  const teams = POOL.teams.length ? POOL.teams : [{ name: "Platform Team" }];
  // Each endpoint belongs to one API, so there are never more APIs than endpoints.
  const apis = between(r, Math.max(2, endpoints.length - 3), endpoints.length);
  const required = between(r, 1, endpoints.length - 1);
  const responses = between(r, 1, endpoints.length - 1);
  const secondOrder = between(r, 9, 48);
  // A field lives on schemas; a header on the endpoints that accept or return it.
  const places = isHeader ? endpoints.length : schemas.length;
  const placeNoun = isHeader ? "endpoint" : "schema";
  const pii = looksPersonal(field) ? between(r, 1, places) : 0;
  const gateway = POOL.apps.find((app) => /apigee/i.test(app.name)) || POOL.apps[0] || { name: "the API gateway" };
  const routes = between(r, 3, 12);
  const untested = between(r, 1, Math.max(1, apis - 1));
  const calls = consumers.map(() => between(r, 4, 180) * 1000);
  const label = isHeader ? `the ${kind} ${code(field)}` : code(field);
  const subject = isHeader ? `the ${kind} ${field}` : field;
  return { field, kind, isHeader, noun: isHeader ? "header" : "field", kindLabel: isHeader ? "HEADER" : "FIELD", label, subject, places, placeNoun, gateway, routes, type: isHeader ? "string (HTTP header)" : fieldType(field), schemas, endpoints, consumers, operations, stores, events, teams, apis, required, responses, secondOrder, pii, untested, calls };
}

function graphFor(f) {
  const nodes = [{ id: `${f.kindLabel}:demo:${f.field}`, name: f.field, type: f.kindLabel, layer: "api" }];
  const edges = [];
  const edge = (from, to, type) => edges.push({ id: `EDGE:${type}:${from}->${to}`, sourceId: from, targetId: to, relationshipType: type, type });
  if (!f.isHeader) for (const schema of f.schemas) { const id = `SCHEMA:demo:${schema}`; nodes.push({ id, name: schema, type: "SCHEMA", layer: "api" }); edge(id, nodes[0].id, "HAS-PROPERTY"); }
  f.operations.forEach((op, i) => { nodes.push(op); edge(op.id, f.isHeader ? nodes[0].id : `SCHEMA:demo:${f.schemas[i % f.schemas.length]}`, f.kind === "request header" ? "ACCEPTS" : "RETURNS"); });
  f.consumers.forEach((consumer, i) => { nodes.push(consumer); edge(consumer.id, f.operations[i % f.operations.length].id, "SUBSCRIBES"); });
  for (const store of f.stores) { nodes.push(store); edge(f.operations[0].id, store.id, "WRITES-TO"); }
  for (const event of f.events) { nodes.push(event); edge(f.operations.at(-1).id, event.id, "PRODUCES"); }
  return { nodes, edges };
}


const FOLLOW_UPS = {
  consumers: (subject) => `Which consumer apps read ${subject}, and through which endpoints?`,
  pii: (subject) => `Is ${subject} classified as PII, and where is it stored?`,
  owners: (subject) => `Which teams own the APIs that expose ${subject}?`,
  rollout: (subject) => `How do we roll out a change to ${subject} safely?`,
};
const followUps = (f, except) => Object.entries(FOLLOW_UPS).filter(([key]) => key !== except).map(([, make]) => make(f.subject));

/** A header change: requests fail at the gateway (request) or apps quietly change behaviour (response). */
function headerImpact(f) {
  const request = f.kind === "request header";
  const [first, second] = f.consumers;
  const [method, path] = f.endpoints[0];
  const led = `**${first.name}**${second ? ` and **${second.name}**` : ""}`;
  const rows = [
    ["Endpoints", String(f.endpoints.length), request ? "Accept it on the request" : "Return it on the response"],
    [request ? "Endpoints (required)" : "Endpoints (in contract)", String(f.required), request ? "Reject calls without it" : "Declare it in their OpenAPI contract"],
    ["APIs", String(f.apis), "Expose those endpoints"],
    ["Consumer apps", String(f.consumers.length), list(names(f.consumers))],
    ["Gateway routes", String(f.routes), `${f.gateway.name} ${request ? "validates" : "passes through"} it`],
    ["Downstream operations", String(f.operations.length), request ? "Read it once the call is through" : "Set it on the response"],
    ["Contract tests missing", String(f.untested), "APIs with no test covering it"],
  ];
  const narrative = request
    ? `### Changing ${f.label}\n\n${cap(f.label)} is sent to **${plural(f.endpoints.length, "endpoint")} in ${plural(f.apis, "API")}**, and **${f.required} of them require it**. Removing or renaming it fails those calls at the gateway, before they reach a service.\n\n#### What would break\n\n- **${plural(f.required, "endpoint")}** reject calls that stop sending it, with a ${code("400 Bad Request")}\n- **${plural(f.consumers.length, "consumer app")}** send it on every call, led by ${led}\n- **${plural(f.routes, "gateway route")}** on **${f.gateway.name}** validate it before forwarding\n- **${plural(f.operations.length, "downstream operation")}** read it once the call is through, from ${f.operations[0].name} to ${f.operations.at(-1).name}\n\n> Riskiest point: ${code(`${method} ${path}`)} requires ${code(f.field)}, and **${first.name}** calls it on every session. A rename there is rejected at the gateway, so no fallback runs.`
    : `### Changing ${f.label}\n\n${cap(f.label)} is returned by **${plural(f.endpoints.length, "endpoint")} in ${plural(f.apis, "API")}**, and **${plural(f.consumers.length, "consumer app")}** read it from those responses. Removing it fails no call; it quietly changes what those apps do next.\n\n#### What would break\n\n- **${plural(f.consumers.length, "consumer app")}** read it from responses, led by ${led}\n- **${plural(f.required, "endpoint")}** declare it in their OpenAPI contract, so their contract tests fail\n- **${plural(f.routes, "gateway route")}** on **${f.gateway.name}** pass it through or cache on it\n- **${plural(f.operations.length, "downstream operation")}** set it, from ${f.operations[0].name} to ${f.operations.at(-1).name}\n\n> Riskiest point: **${first.name}** reads ${code(f.field)} from ${code(`${method} ${path}`)} on every session. Without it the app falls back to its defaults, with no error to show anything changed.`;
  return {
    chips: [{ label: "HEADER" }, { verb: request ? "ACCEPTED BY" : "RETURNED BY", dir: "in" }, { label: "3 HOPS" }],
    narrative,
    bullets: [
      f.pii ? `${cap(f.label)} carries personal data on ${f.pii} of the ${plural(f.places, "endpoint")}, so any change also needs a privacy review.` : `${cap(f.label)} carries no personal data, so the change needs no privacy review.`,
      `${plural(f.untested, "API")} of the ${f.apis} have no contract test covering it today.`,
    ],
    note: "Read from the snapshot's ACCEPTS, RETURNS, SUBSCRIBES, ROUTES-TO and CALLS relationships.",
    table: { title: `Impact of changing ${f.subject}`, columns: ["Impact", "Count", "Where"], rows },
    reasoning: [
      `Matched ${f.field} to HEADER nodes on ${plural(f.endpoints.length, "endpoint")} across ${plural(f.apis, "API")}.`,
      request ? `Walked ACCEPTS in to the ${plural(f.consumers.length, "consumer app")} that send it, and ROUTES-TO out to the ${f.gateway.name} routes that validate it.` : `Walked RETURNS out from those endpoints and SUBSCRIBES in to the ${plural(f.consumers.length, "consumer app")} that read it.`,
      "Walked CALLS out to the downstream operations that depend on it.",
    ],
    followUps: followUps(f),
  };
}

function impact(f) {
  if (f.isHeader) return headerImpact(f);
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
    followUps: followUps(f),
  };
}

function consumers(f) {
  const rows = f.consumers.map((consumer, i) => {
    const [method, path] = f.endpoints[i % f.endpoints.length];
    return [consumer.name, `${method} ${path}`, i % 3 === 0 ? "Reads and writes" : "Reads", `${(f.calls[i] / 1000).toFixed(0)}K / day`];
  });
  const busiest = f.consumers[f.calls.indexOf(Math.max(...f.calls))];
  return {
    chips: [{ label: f.kindLabel }, { verb: "READ BY", dir: "in" }, { label: "CONSUMER" }],
    narrative: `### Who reads ${f.label}\n\n**${plural(f.consumers.length, "consumer app")}** read ${f.label} through **${plural(Math.min(f.consumers.length, f.endpoints.length), "endpoint")}**. **${busiest.name}** is the heaviest caller at **${(Math.max(...f.calls) / 1000).toFixed(0)}K calls a day**, so it is the one to migrate first.\n\n- ${plural(rows.filter((row) => row[2] === "Reads and writes").length, "app")} also write it back, so both directions of the contract change\n- The rest only read it, and can move as soon as the new ${f.noun} is served alongside the old one`,
    bullets: [`${f.secondOrder} more consumers reach it second-hand, through the upstream operations these apps call.`],
    note: "Read from SUBSCRIBES and CALLS relationships, with call volumes from the last 30 days of gateway traffic.",
    table: { title: `Consumers of ${f.field}`, columns: ["Consumer app", "Endpoint", "Usage", "Volume"], rows },
    reasoning: [
      `Started from the ${plural(f.endpoints.length, "endpoint")} that accept or return ${f.field}.`,
      `Walked SUBSCRIBES in to each consumer app and kept the endpoint it reaches the ${f.noun} through.`,
      "Joined gateway traffic to rank the apps by daily call volume.",
    ],
    followUps: followUps(f, "consumers"),
  };
}

function pii(f) {
  const stores = [...f.stores.map((store) => [store.name, "Database", f.pii ? "PII, encrypted at rest" : "Internal", "7 years"]), ...f.events.map((event) => [event.name, "Event stream", f.pii ? "PII, masked in transit" : "Internal", "30 days"])];
  return {
    chips: [{ label: f.kindLabel }, { verb: "CLASSIFIED AS", dir: "out" }, { label: "PII" }],
    narrative: f.pii
      ? `### Is ${f.label} personal data?\n\n**Yes.** ${cap(f.label)} is classified as **PII** on **${f.pii} of ${plural(f.places, f.placeNoun)}**, and it is stored in **${plural(stores.length, "place")}**. Any rename or type change therefore needs a privacy review and a migration of the stored copies, not just the API contract.\n\n- Stored at rest in ${list(names(f.stores).map(code))}\n- Masked in transit on ${list(names(f.events).map(code))}`
      : `### Is ${f.label} personal data?\n\n**No.** ${cap(f.label)} carries no PII classification on any of its ${plural(f.places, f.placeNoun)}, so a change needs no privacy review. It is still stored in **${plural(stores.length, "place")}**, and those copies migrate with the change.\n\n- Stored at rest in ${list(names(f.stores).map(code))}\n- Published on ${list(names(f.events).map(code))}`,
    bullets: [`Retention follows the strictest store: ${stores[0]?.[3] || "7 years"}.`],
    note: "Read from CLASSIFIED-AS, WRITES-TO and PRODUCES relationships.",
    table: { title: `Where ${f.field} is stored`, columns: ["Store", "Kind", "Classification", "Retention"], rows: stores },
    reasoning: [
      `Checked CLASSIFIED-AS on each of the ${plural(f.places, f.placeNoun)} that carry ${f.field}.`,
      "Walked WRITES-TO and PRODUCES out from the operations that handle it to find every stored copy.",
      "Read retention from each store's data-governance metadata.",
    ],
    followUps: followUps(f, "pii"),
  };
}

function owners(f) {
  const split = Math.ceil(f.apis / f.teams.length);
  const rows = f.teams.map((team, i) => [team.name, String(i === f.teams.length - 1 ? f.apis - split * (f.teams.length - 1) : split), i === 0 ? "Change approver" : "Consulted", i === 0 ? "#iam-oncall" : "#channels-oncall"]);
  return {
    chips: [{ label: f.kindLabel }, { verb: "OWNED BY", dir: "in" }, { label: "TEAM" }],
    narrative: `### Who owns ${f.label}\n\n**${plural(f.teams.length, "team")}** own the ${plural(f.apis, "API")} that expose ${f.label}. **${f.teams[0].name}** owns ${f.isHeader ? `the ${f.gateway.name} policy that ${f.kind === "request header" ? "validates" : "passes"} it` : "the schema it is defined on"}, so it approves any change; the others are consulted for their own APIs.\n\n- ${f.teams[0].name} owns ${f.isHeader ? `${plural(f.routes, "gateway route")} that carry it` : `${code(f.schemas[0])}, where the field is required`}\n- Every owning team has to sign off before the old ${f.noun} is removed`,
    bullets: [`The consumer apps are owned outside these teams, so the rollout needs their product owners too.`],
    note: "Read from OWNS and IMPLEMENTS relationships between teams, business capabilities and APIs.",
    table: { title: `Owners of ${f.field}`, columns: ["Team", "APIs", "Role", "On-call"], rows },
    reasoning: [
      `Walked from ${f.field} up through its ${f.placeNoun}s to the ${plural(f.apis, "API")} that expose it.`,
      "Followed IMPLEMENTS from those APIs to their business capability, then OWNS back to each team.",
      `Marked the owner of the ${f.isHeader ? "gateway policy" : "defining schema"} as the change approver.`,
    ],
    followUps: followUps(f, "owners"),
  };
}

function rollout(f) {
  const lead = f.consumers[0].name;
  const rows = [
    ["1. Add", `Serve the new ${f.noun} next to ${f.field} on all ${plural(f.endpoints.length, "endpoint")}`, f.teams[0].name, "Week 1"],
    ["2. Dual-write", `${f.isHeader ? `Send and accept both ${f.noun}s through ${f.gateway.name}` : `Write both fields to ${list(names(f.stores))}`}`, f.teams[0].name, "Week 1–2"],
    ["3. Migrate", `Move ${plural(f.consumers.length, "consumer app")} over, ${lead} first`, "Consumer owners", "Week 2–5"],
    ["4. Deprecate", `Mark ${f.field} deprecated and log every remaining read`, f.teams.at(-1).name, "Week 6"],
    ["5. Remove", `Drop ${f.field} once reads reach zero for 14 days`, f.teams[0].name, "Week 8"],
  ];
  return {
    chips: [{ label: f.kindLabel }, { verb: "CHANGE PLAN", dir: "both" }, { label: "5 STEPS" }],
    narrative: `### Rolling out a change to ${f.label}\n\nChange it in **5 steps over about 8 weeks**, so no consumer ever sees a broken contract. The new ${f.noun} ships next to ${code(f.field)} first; the old one only goes once nothing reads it.\n\n- Start with **${lead}**, the heaviest caller, to surface problems early\n- Keep dual-writes on until every stored copy is backfilled${f.pii ? "\n- Book the privacy review before step 3, because the ${f.noun} is PII" : ""}`,
    bullets: [`Contract tests are missing in ${plural(f.untested, "API")}; add them in step 1 so step 5 is safe.`],
    note: "The plan follows the dependency order found in the graph: providers first, then consumers, then storage.",
    table: { title: `Rollout plan for ${f.field}`, columns: ["Step", "What", "Owner", "When"], rows },
    reasoning: [
      `Ordered the ${plural(f.apis, "API")} before their ${plural(f.consumers.length, "consumer app")}, so the new ${f.noun} exists before anyone needs it.`,
      "Ranked consumers by call volume to pick the first to migrate.",
      `Put storage last, so no stored copy loses the ${f.noun} while a reader still depends on it.`,
    ],
    followUps: followUps(f, "rollout"),
  };
}

const FIELD = "[A-Za-z_][\\w.\\-\\[\\]/]*(?:\\s+[A-Za-z_][\\w.\\-\\[\\]/]*){0,2}?";
// An optional "the request header" / "response" qualifier, then the name.
const SUBJECT = `(?:the\\s+)?(?:(request|response)\\s+)?(?:header\\s+)?[\`'"]?(${FIELD})[\`'"]?`;
const clean = (field) => field.replace(/^[`'"]+|[`'"]+$/g, "").trim();
const INTENTS = [
  ["consumers", new RegExp(`^which consumer apps read ${SUBJECT}, and through which endpoints$`, "i")],
  ["pii", new RegExp(`^is ${SUBJECT} classified as pii, and where is it stored$`, "i")],
  ["owners", new RegExp(`^which teams own the apis that expose ${SUBJECT}$`, "i")],
  ["rollout", new RegExp(`^how (?:do|should) we roll out a change to ${SUBJECT} safely$`, "i")],
];
// The question bank's own wording: "the contract-change blast radius of changing or removing request accept-language"
const CHANGE_VERB = "(?:changing|removing|renaming|deprecating|dropping)";
const BLAST = new RegExp(`blast radius of ${CHANGE_VERB}(?:\\s+or\\s+${CHANGE_VERB})?\\s+${SUBJECT}$`, "i");
// "if customerId changes, what breaks", "what breaks if we rename the account number field", "what is affected if response x-request-id changes or is removed"
const IMPACT = new RegExp(`\\b(?:if|when)\\s+(?:we\\s+|i\\s+)?(?:change|rename|remove|drop|modify|update|deprecate)?\\s*(?:field\\s+)?${SUBJECT}(?=\\s+(?:field\\b|changes?\\b|is\\b|gets\\b|type\\b)|\\s*[,?.!]|\\s*$)`, "i");
const ASKS_IMPACT = /\b(break|breaks|broken|impact|happen|happens|affect|affected|fail|blast radius)\b/i;
const MENTIONS_CHANGE = /\b(change|changes|changed|changing|rename|renamed|renaming|remove|removed|removing|drop|dropped|dropping|modify|modified|update|updated|deprecate|deprecated|deprecating)\b/i;
const NOT_A_NAME = /^(we|i|it|this|that|they|something|anything|body|payload)$/i;
const subjectOf = (match) => (match ? [match[1] ? `${match[1].toLowerCase()} header` : "field", clean(match[2])] : null);

/** The demo answer for a field- or header-impact question or one of its follow-ups, or null when the question is something else. */
export function fieldImpactAnswer(question) {
  const text = String(question).trim().replace(/[\s?.!]+$/, "");
  for (const [intent, pattern] of INTENTS) {
    const subject = subjectOf(text.match(pattern));
    if (subject) {
      const f = facts(subject[1], subject[0]);
      const answer = { consumers, pii, owners, rollout }[intent](f);
      return { ...answer, graph: graphFor(f), chain: true };
    }
  }
  if (!ASKS_IMPACT.test(text) || !MENTIONS_CHANGE.test(text)) return null;
  const subject = subjectOf(text.match(BLAST)) || subjectOf(text.match(IMPACT));
  if (!subject || !subject[1] || NOT_A_NAME.test(subject[1])) return null;
  const f = facts(subject[1], subject[0]);
  return { ...impact(f), graph: graphFor(f), chain: true };
}
