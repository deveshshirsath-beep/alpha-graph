# All 320 sample questions: answered and unanswered

Source: the completed [full question-bank audit](question-bank-improved.md), **2026-09-21 11:51:57 UTC**. This is a reorganization of the saved results, not a new API run. It covers every sample question in the selected **101 / 320** metric, preserving its original audit case number and exact question wording. The full audit additionally lists all 850 filled-template cases and 321 unfinished-template cases.

## How the counts fit together

| Outcome after any recorded retry | Questions |
|---|---:|
| Directly answered | 101 |
| Answered after candidate selection | 46 |
| Executed successfully, no matching evidence | 31 |
| Unsupported | 72 |
| Still requires clarification | 68 |
| No matching root entity | 2 |
| **Total** | **320** |

The selected metric counts **101 immediate answers**; the other **219 were not directly answered**. Of those 219, 46 subsequently answered, 31 executed with no matching evidence, and 142 remain unresolved. Therefore, “not directly answered” is not the same as “failed.”

The audit selected a returned candidate automatically for clarification retries. That selection is not proof of the user's intended entity, and an `answered` status alone does not certify semantic correctness. An empty graph result also does not prove real-world absence.

## Complete question lists

### Directly answered — 101

These are the 101 questions counted in “Sample questions directly answered.”

| Case | Question |
|---|---|
| 1 | Which business areas, business domains, service domains, business capabilities, and teams exist? |
| 2 | How many nodes of each Business-layer type exist? |
| 3 | Which Business-layer nodes match fraud? |
| 4 | Which business domains belong to more than one business area? |
| 6 | Which business capabilities have no owning team, exactly one owner, or multiple owning teams? |
| 8 | Which capabilities have no implementing application? |
| 9 | What percentage of each business hierarchy level is linked to its expected parent and child types? |
| 11 | Which business domains does Accounts and Deposits contain? |
| 12 | How many business domains does each business area contain? |
| 13 | Which service domains does Account Management contain? |
| 15 | How many capabilities does each service domain contain? |
| 16 | Which business capabilities does Beneficiary &amp; Payee Platform Team own? |
| 17 | How many capabilities does each team own? |
| 18 | Which business capabilities does channel-integration-service implement? |
| 19 | Which applications span multiple service domains, business domains, or business areas through the capabilities they implement? |
| 20 | How many APIs does each application expose? |
| 21 | Which business area or areas contain Core Banking? |
| 22 | Does Channel Specific have one parent area, multiple parent areas, or no parent? |
| 23 | Which business domain contains ACH Operations? |
| 25 | Which capabilities cross service-domain boundaries? |
| 26 | Which team or teams own Administer counterparties? |
| 27 | Which capabilities have shared ownership, and who are all the owners? |
| 28 | Which capabilities are implemented by multiple applications? |
| 29 | Which capability has the largest application implementation footprint? |
| 31 | What is the complete capability, application, API, endpoint, and operation estate under Accounts and Deposits? |
| 33 | Which APIs and operations are associated with capabilities owned by Core Accounts &amp; Ledger Team? |
| 35 | Which events are produced by operations associated with Administer collateral assets through its implementing applications? |
| 36 | Which request headers, parameters, schemas, and fields occur in APIs associated with Administer counterparties? |
| 41 | Which business capabilities are implemented by cards-merchant-app, and which service domains, business domains, and business areas contain them? |
| 42 | Which teams own capabilities implemented by operations-openfinance-app? |
| 46 | Which business areas are associated with operations that read from banking_demo-postgres? |
| 51 | What current hierarchy and application-level technology estate falls into review scope if Accounts and Deposits is reorganized or retired? |
| 52 | Which domains, service domains, capabilities, teams, applications, APIs, operations, consumers, deployments, databases, and events fall under the change scope of Payments and Cards? |
| 55 | What is affected if Administer collateral assets is renamed, redefined, consolidated, or retired? |
| 57 | Which currently owned capabilities and application-level technology associations enter review scope if Consumer Lending Platform Team gives up ownership of Account Information Service? |
| 66 | Which capabilities and capability-owning teams appear in the context rollup if the v5 Current Account API version is deprecated? |
| 67 | Which business capabilities are associated with operations governed by OAuth 2? |
| 73 | Which teams have the largest cross-domain or cross-area change blast radius? |
| 76 | What is the overlap between the blast radii of Accounts and Deposits and Payments and Cards? |
| 81 | Which applications, APIs, API versions, endpoints, operations, and consumers exist? |
| 82 | How many nodes of each API-layer type exist? |
| 84 | Which exposure values are present, and how many operations are External, Internal, or Partner exposed? |
| 85 | How many operations are classified as PII, PCI, both, or neither? |
| 91 | What set of APIs is exposed by cards-merchant-app? |
| 96 | How many request headers does Create Banking Account Bill Payment accept? |
| 97 | How many query parameters does Create Banking Account Management Account Reconciliation accept? |
| 98 | Which operations return multiple modeled status codes? |
| 105 | Which operations have External exposure? |
| 111 | What is the complete API tree exposed by cards-merchant-app, from API through version, endpoint, and operation? |
| 113 | Which operationIds or paths repeat across gateway and microservice services? |
| 121 | What APIs and operations form Bank Sync's complete subscription footprint? |
| 126 | Which APIs mix External, Internal, and Partner operations? |
| 136 | Starting from OAuth 2, which operations, endpoints, APIs, applications, consumers, capabilities, and teams are in scope? |
| 141 | Which External operations are classified as PII? |
| 142 | Which External operations are classified as PCI? |
| 143 | Which Partner operations are classified as PII or PCI? |
| 144 | Which PII or PCI operations are deployed to GATEWAY? |
| 145 | Which PII or PCI operations produce banking.api.events-unknown? |
| 146 | Which operations satisfying DELETE, Internal, PII, OAuth 2, and MICROSERVICE all at once exist? |
| 147 | Which operations lack one or more of method, OAuth 2, exposure, and deployment relationships? |
| 151 | What is affected if cards-merchant-app stops exposing its APIs? |
| 157 | What is affected if Create Banking Account Management Account Reconciliation's path, method, operationId, service, or serviceCategory changes? |
| 160 | What is affected if payments-app stops exposing its APIs? |
| 171 | What is affected if 200 for Create Banking Card Cash Withdrawal is added, removed, or changes meaning? |
| 181 | What is the security-change blast radius of OAuth 2? |
| 187 | Which databases, events, called operations, and deployments sit downstream of External PII or PCI operations affected by a policy change? |
| 190 | Which consumers, associated business capabilities, and capability-owning teams enter review scope if Create Aggregation Customer Account's exposure changes from Internal or Partner to External? |
| 191 | For operations linked by DEPLOYED-TO to MICROSERVICE, which endpoints, APIs, consumers, applications, capabilities, and capability-owning teams are in structural scope? |
| 192 | What is affected if Create Banking Account Management Account Reconciliation moves between gateway and microservice deployment categories? |
| 194 | Which API contracts are in the reverse outage radius of redis-redis? |
| 196 | Which APIs and consumers are affected by a data change to oauth_db-postgres? |
| 197 | Which APIs and consumers are affected if a called or routed-to Create Banking Account Management Account Reconciliation changes or fails? |
| 204 | How do APIs, schemas, fields, deployment targets, databases, and events rank by distinct consumer blast radius? |
| 213 | Which operations have missing or blank httpMethod, path, service, serviceCategory, or operationId properties? |
| 217 | How many CALLS, ROUTES-TO, CONNECTS-TO, READS-FROM, WRITES-TO, UPDATES-TO, PRODUCES, and CONSUMES edges exist? |
| 224 | Which databases and tables does Create Aggregation Customer Account write to? |
| 235 | Which operations produce banking.api.events-unknown? |
| 243 | For channel-integration-service, which exposed APIs terminate in which gateway or microservice operations? |
| 252 | Starting from oauth_db-postgres, which operations and events connect, read, write, or update it, separated by access mode? |
| 253 | Starting from hierarchy_v6-postgres, which applications, capabilities, business areas, and teams depend on it? |
| 259 | Starting from a concrete-path operation, which wildcard, canonical, gateway, or microservice variants represent the same logical operation? |
| 261 | Which Runtime edges have the highest observed callCount? |
| 262 | What is errorCount divided by callCount for each error-bearing edge? |
| 264 | How are callCount and errorCount distributed by source service, service category, database, event, API, or business area? |
| 269 | What are the stored edge-depth distribution and the independently computed graph-hop distribution when reported as non-equivalent measures? |
| 272 | If Create Banking Account Management Account Reconciliation fails, which downstream operations, databases, tables, and event destinations fall within its dependency-side impact scope? |
| 277 | For the generic MICROSERVICE deployment category, which linked operations and upstream API entry points form its structural scope? |
| 278 | Which operations have both gateway and microservice deployment edges, and how should their radius be deduplicated? |
| 281 | If banking_demo-postgres fails, which operations and events are affected, separated by connect, read, write, and update relationship? |
| 282 | If oauth_db-postgres fails, which upstream callers, routes, consumers, APIs, applications, capabilities, areas, and teams are transitively affected? |
| 287 | Which business areas share oauth_db-postgres, causing an outage radius to cross organizational boundaries? |
| 291 | If banking.workflow.commands-unknown is unavailable, which producer operations, event flows, called operations, databases, APIs, and capabilities are affected? |
| 294 | If an operation called by rabbitmq-unknown is used as an outage root, which event-call edge and downstream database writes or produced events fall within structural scope? |
| 296 | Which business areas and teams share banking.workflow.commands-unknown through different producer operations? |
| 299 | If rabbitmq-unknown is unavailable, which producer operations, event flows, called operations, databases, APIs, and capabilities are affected? |
| 303 | If response 200 for Create Banking Card Cash Withdrawal changes, which operations, APIs, and subscribed consumers are affected? |
| 305 | Which databases, events, and callees lie in the downstream radius of External PII or PCI operations? |
| 307 | If operations-openfinance-app is decommissioned, which operations, shared callees, databases, events, consumers, and capabilities are affected? |
| 311 | Which dependency roots have the greatest callCount-weighted structural scope under an explicitly stated aggregation rule? |
| 313 | Which stale dependencies have a broad blast radius if they remain active despite an old lastSeen value? |
| 317 | How does the radius change when duplicate gateway and microservice representations of one logical operation are collapsed? |

### Answered after candidate selection — 46

The initial response asked for clarification. The audit chose a returned entity candidate, retried, and recorded `answered`; these do not count toward the 101 immediate answers.

| Case | Question |
|---|---|
| 30 | Which application or applications expose Identity and API Security Services API? |
| 32 | Which applications implement capabilities in Account Reconciliation, and which APIs, versions, endpoints, and operations are associated through those applications? |
| 37 | Which operations associated with Payments and Cards are External, Internal, or Partner exposed? |
| 38 | Which security controls are implemented by operations associated with Account Reconciliation? |
| 61 | Which business areas, domains, capabilities, and capability-owning teams appear in the reverse business-context rollup of operations-openfinance-app? |
| 65 | Which business areas appear in the reverse context rollup of a contract change to Customer Billing API? |
| 69 | Which business capabilities are associated with operations in the reverse change radius of routing or call changes to Create Aggregation Customer Account? |
| 77 | What are the union, intersection, and root-specific remainders of the structural scopes of Cards and Payments? |
| 92 | Which endpoints does the v5 Account Reconciliation API version contain? |
| 93 | Which HTTP method does Create Security Oauth Token support? |
| 100 | What is the complete nested field tree beneath the customerId field? |
| 101 | Which applications expose Customer Billing API? |
| 102 | Does the v5 Account Reconciliation API version have a unique parent API? |
| 106 | Which operations accept x-mock-response as a request header? |
| 107 | Which operations accept customerId? |
| 115 | What status codes, response headers, response schemas, and nested fields can Create Payments Validate return? |
| 152 | What is the deprecation blast radius of Open Banking Access Services API? |
| 154 | What is affected if the v6 Payment Confirmation Services API version is retired? |
| 155 | Which consumers depend directly on the v1 Identity and API Security Services API version's operations even if they subscribe to the parent API separately? |
| 156 | What is affected if /v5/aggregation/customers/{customerId}/accounts is removed or moved? |
| 158 | Which called or routed operations expand the transitive blast radius of deprecating Create Security Oauth Token? |
| 159 | Which business capabilities and capability-owning teams are in the reverse context rollup of Identity and API Security Services API's deprecation? |
| 161 | What is the contract-change blast radius of changing or removing request header x-mock-response? |
| 162 | What is the contract-change blast radius of renaming, adding, or removing customerId? |
| 163 | What is the contract-change blast radius of changing limit? |
| 164 | What is the contract-change blast radius of CreateBankingAccountBillPaymentRequest? |
| 165 | Which operations and consumers are affected if the customerId field changes type or format? |
| 166 | Which operations and consumers are affected if the correlationId field changes required status? |
| 170 | What is the contract-change blast radius of changing or removing request header idempotency-key? |
| 172 | What is affected if response X-Workflow-Execution-Id changes or is removed? |
| 173 | What is the response-contract blast radius of CreateBankingAccountTransferResponse_202? |
| 174 | Which consumers and callers are affected if the sourceSystem field changes in a response schema? |
| 178 | What is affected if 502 for Create Banking Compliance Regulatory Compliance Operational Action is added, removed, or changes meaning? |
| 179 | What is affected if response header X-Endpoint-Id changes or is removed? |
| 180 | What is the response-contract blast radius of CreateBankingCardDisputeResponse_201? |
| 183 | What is the policy-change blast radius of reclassifying Create Security Oauth Token as PII or PCI? |
| 186 | Which consumers, associated business capabilities, and capability-owning teams enter review scope if Create Banking Account Bill Payment's exposure changes from Internal or Partner to External? |
| 189 | What is the policy-change blast radius of reclassifying Create Payments Validate as PII or PCI? |
| 193 | Which consumers are affected by a service or serviceCategory change to Create Security Oauth Token? |
| 200 | What is affected if Create Payments Validate moves between gateway and microservice deployment categories? |
| 225 | Which captured queries support the update dependencies of Create Payments Validate? |
| 248 | For operations accepting the CreateBankingAccountBillPaymentRequest schema, which runtime dependencies execute behind them? |
| 273 | What are the separate upstream-dependent and downstream-dependency sides of Create Security Oauth Token's blast radius within 6 hops? |
| 301 | If the v5 Current Account API version is retired, which runtime operations, services, routes, callees, databases, events, and consumers are affected? |
| 309 | Which team's owned capabilities have the broadest Runtime blast radius by unique operations, services, databases, events, APIs, and consumers? |
| 310 | If the v1 Identity and API Security Services API version is retired, which runtime operations, services, routes, callees, databases, events, and consumers are affected? |

### Executed successfully, no matching evidence — 31

These are valid empty graph results, not unsupported questions: 14 directly and 17 after candidate selection.

| Case | Question | Response sequence |
|---|---|---|
| 5 | Which service domains have no parent business domain, or more than one parent? | No matching evidence |
| 7 | Which teams own no capabilities? | No matching evidence |
| 14 | Which business domains share or overlap in service-domain membership? | No matching evidence |
| 24 | Which service domains are referenced by multiple business domains? | No matching evidence |
| 71 | How do business areas rank by the number of distinct applications, APIs, operations, consumers, deployments, databases, and events in their blast radius? | Clarification required → No matching evidence |
| 72 | How do capabilities rank by the number of dependent consumers and shared runtime resources in their blast radius? | Clarification required → No matching evidence |
| 78 | How does the direct impact differ from the transitive impact for Risk and Compliance? | No matching evidence |
| 88 | Which consumers have no API or operation subscriptions? | No matching evidence |
| 148 | Which PII or PCI operations have no subscribing consumer? | No matching evidence |
| 167 | Which operations and consumers are affected if additionalProperties changes on CreateBankingAccountTransferRequest? | Clarification required → No matching evidence |
| 176 | What is the combined request-and-response blast radius when CreateBankingAccountBillPaymentResponse_202 appears in both directions? | Clarification required → No matching evidence |
| 177 | Which APIs and consumers are affected by changing all occurrences of /Data/Account/*/Currency? | Clarification required → No matching evidence |
| 182 | Which operations, consumers, APIs, applications, capabilities, and teams are affected if OAuth 2 behavior changes? | Clarification required → No matching evidence |
| 184 | What is the estate-wide blast radius of changing the PII classification policy? | Clarification required → No matching evidence |
| 185 | What is the estate-wide blast radius of changing the PCI classification policy? | Clarification required → No matching evidence |
| 221 | Which operations does Create Banking Account Bill Payment call directly? | Clarification required → No matching evidence |
| 222 | Which operations does Create Banking Account Management Account Reconciliation route to directly? | No matching evidence |
| 223 | Which databases does Create Security Oauth Token connect to? | Clarification required → No matching evidence |
| 227 | Which operations does banking.workflow.events-unknown call? | No matching evidence |
| 231 | Which operations call Create Banking Account Bill Payment directly? | Clarification required → No matching evidence |
| 232 | Which gateway paths and methods feed Create Banking Account Management Account Reconciliation? | No matching evidence |
| 233 | Which operations read from hierarchy_v6-postgres? | No matching evidence |
| 236 | Which event produces banking.workflow.commands-unknown? | No matching evidence |
| 238 | Which events read from hierarchy_v6-postgres? | No matching evidence |
| 240 | Which database calls Create Payments Validate through the observed extension edge? | Clarification required → No matching evidence |
| 256 | Starting from callee Create Banking Account Bill Payment, which operations, events, or databases call it directly or transitively? | Clarification required → No matching evidence |
| 271 | If Create Banking Account Bill Payment is used as an outage root, which direct callers, routed callers, event-call paths, consumers, APIs, applications, capabilities, domains, areas, and teams are structurally in scope? | Clarification required → No matching evidence |
| 275 | If a gateway operation fails, which routed gateway or microservice operations and downstream data/event dependencies are affected? | Clarification required → No matching evidence |
| 284 | If accounts_deposits.business_state changes or becomes unavailable, which readers, writers, updaters, APIs, capabilities, and consumers are exposed? | Clarification required → No matching evidence |
| 302 | If request x-mock-response changes, which operations and downstream Runtime paths may be affected? | Clarification required → No matching evidence |
| 312 | Which error-bearing routes have the greatest reverse consumer and business blast radius? | No matching evidence |

### Unresolved: unsupported — 72

The planner did not produce a supported executable investigation.

| Case | Question | Response sequence | Recorded reason |
|---|---|---|---|
| 10 | Which Business-layer nodes are orphaned or disconnected from the API and Runtime estate? | Unsupported | planner_could_not_map |
| 39 | Which business areas have the largest conservative application-level counts of associated APIs, operations, consumers, databases, or events? | Unsupported | planner_could_not_map |
| 43 | Which business hierarchy and capability-owning teams are associated upstream of the v1 Identity and API Security Services API version? | Unsupported | planner_could_not_map |
| 50 | How many distinct business areas, domains, capabilities, teams, applications, and APIs converge on banking_demo-postgres? | Unsupported | planner_could_not_map |
| 58 | Which capabilities become ownerless if Core Accounts &amp; Ledger Team is removed? | Unsupported | planner_could_not_map |
| 60 | Which shared applications and their associated APIs, databases, or events extend conservative review scope beyond Payments? | Unsupported | planner_could_not_map |
| 64 | For operations linked by DEPLOYED-TO to GATEWAY, which capability-owning teams appear in the reverse business-context rollup? | Unsupported | planner_could_not_map |
| 70 | Which technical root node has the widest reverse-mapped business-context rollup? | Unsupported | planner_could_not_map |
| 79 | Which impact paths cross Business, API, and Runtime layer boundaries, and at which edge does each crossing occur? | Unsupported | planner_could_not_map |
| 83 | Which API version names are present, and how many APIs, endpoints, and operations use each version? | Unsupported | planner_could_not_map |
| 86 | Which APIs, versions, endpoints, or operations have no expected containment parent or child? | Unsupported | planner_could_not_map |
| 87 | Which status-code nodes lack a response schema or response headers? | Unsupported | planner_could_not_map |
| 103 | Is Create Security Oauth Token contained by more than one endpoint? | Unsupported | planner_could_not_map |
| 108 | Across which consumers and APIs is limit used? | Unsupported | planner_could_not_map |
| 109 | Which APIs and versions expose 202 for Create Banking Account Bill Payment? | Unsupported | relationship_not_in_snapshot |
| 110 | What are all ancestor fields and the root schema of the customerId field? | Unsupported | planner_could_not_map |
| 114 | For /v5/banking/cards/{cardId}/loss-reports, what are the method, operationId, path, service, service category, security, exposure, sensitivity, and deployment target of every operation? | Unsupported | planner_could_not_map |
| 116 | Which required fields occur at each canonical path in CreateBankingAccountBillPaymentRequest? | Unsupported | planner_could_not_map |
| 117 | Which object or array fields have no nested child fields? | Unsupported | planner_could_not_map |
| 119 | Which APIs return non-success or error status-code nodes in addition to success responses? | Unsupported | planner_could_not_map |
| 120 | Which request and response headers appear most widely across the API estate? | Unsupported | planner_could_not_map |
| 124 | Which GATEWAY, MICROSERVICE, or WORKFLOW category nodes are linked by DEPLOYED-TO from Card Management Portal's subscribed operations? | Unsupported | planner_could_not_map |
| 125 | Which databases and events are reached transitively from Account Linker's subscriptions? | Unsupported | planner_could_not_map |
| 130 | Which APIs depend on the same called or routed-to operation? | Unsupported | planner_could_not_map |
| 131 | Starting from the correlationId field, which parent field tree, schema, request or response, status code, operation, endpoint, version, API, and application expose it? | Unsupported | planner_could_not_map |
| 138 | Starting from sms-events-unknown, which producing operations and subscribed consumers sit upstream? | Unsupported | planner_could_not_map |
| 139 | Which field, schema, operation, endpoint, or API has the greatest reverse fan-in from consumers? | Unsupported | planner_could_not_map |
| 140 | Which database, event, or deployment target has the greatest reverse fan-in from APIs? | Unsupported | planner_could_not_map |
| 153 | Which versions, endpoints, operations, consumers, contracts, deployments, databases, events, applications, capabilities, teams, and business areas are in Current Account API's deprecation radius? | Unsupported | planner_could_not_map |
| 175 | Which operations are impacted if a shared response field changes at any nesting depth? | Unsupported | planner_could_not_map |
| 198 | Which cross-API call or route dependencies enlarge the deployment blast radius? | Unsupported | planner_could_not_map |
| 199 | For operations linked by DEPLOYED-TO to GATEWAY, which endpoints, APIs, consumers, applications, capabilities, and capability-owning teams are in structural scope? | Unsupported | planner_could_not_map |
| 203 | Which applications, capabilities, and teams appear in multiple API blast radii? | Unsupported | planner_could_not_map |
| 207 | Which blast-radius results are truncated by depth or result limits? | Unsupported | planner_could_not_map |
| 208 | Which result nodes are contextual portfolio rollups rather than propagating failures? | Unsupported | planner_could_not_map |
| 212 | Which services are recorded on the broadest mix of GET, POST, PUT, PATCH, and DELETE operations? | Unsupported | planner_could_not_map |
| 214 | Which endpoints map to one, two, three, or four runtime operation nodes? | Unsupported | planner_could_not_map |
| 215 | Which database nodes share a type, host, logical name, or connection endpoint? | Unsupported | planner_could_not_map |
| 218 | Which less common populated Runtime signatures use DATABASE or EVENT as the source of CALLS, CONNECTS-TO, or PRODUCES? | Unsupported | planner_could_not_map |
| 219 | Which Runtime edges are self-loops? | Unsupported | planner_could_not_map |
| 220 | Which edge properties are populated for each Runtime relationship type? | Unsupported | planner_could_not_map |
| 226 | Is the CONSUMES edge a self-loop or a cross-event dependency? | Unsupported | planner_could_not_map |
| 239 | Which event writes use payment_transactions? | Unsupported | planner_could_not_map |
| 242 | For Account Information Service, which applications, APIs, endpoints, runtime services, and operations form its conservative implementation scope? | Unsupported | planner_could_not_map |
| 244 | For the v6 Payment Confirmation Services API version, which services, databases, tables, and events are downstream? | Unsupported | planner_could_not_map |
| 245 | For /v5/banking/account-management/account-reconciliation, what call chain, database access, and event production can follow execution? | Unsupported | planner_could_not_map |
| 246 | For an API-level subscription held by Bank Sync, which contained operations and dependencies enter scope? | Unsupported | planner_could_not_map |
| 249 | Across versions of Customer Position API, how do service assignments, routes, calls, database dependencies, and event outputs differ? | Unsupported | planner_could_not_map |
| 251 | Starting from Create Banking Account Bill Payment, which endpoint, version, API, application, capability, business hierarchy, and team are upstream? | Unsupported | planner_could_not_map |
| 254 | Starting from the captured fraud-evaluation idempotency query, which edge, operation or event, database, and upstream context produced it? | Unsupported | planner_could_not_map |
| 255 | Starting from banking.api.events-unknown, which APIs, consumers, applications, capabilities, and teams sit upstream of its producers? | Unsupported | planner_could_not_map |
| 258 | Starting from redis-redis, which request and response contract elements are attached to its upstream operations? | Unsupported | planner_could_not_map |
| 260 | Which runtime dependency has the largest reverse fan-in from operations, APIs, consumers, capabilities, or teams? | Unsupported | planner_could_not_map |
| 263 | Which relationships appear stale relative to the graph's generatedAt timestamp and a supplied threshold? | Unsupported | planner_could_not_map |
| 267 | Which consumers' reachable operation sets include error-bearing routes? | Unsupported | planner_could_not_map |
| 268 | Which teams or business capabilities roll up to the observed error-bearing paths? | Unsupported | planner_could_not_map |
| 270 | Which runtime relationships have telemetry attributes missing or structurally inconsistent for their edge type? | Unsupported | planner_could_not_map |
| 276 | For the generic GATEWAY deployment category, which linked operations, endpoints, APIs, consumers, and capability rollups form its structural scope? | Unsupported | planner_could_not_map |
| 279 | If a high-fan-in callee is used as an outage root, which caller operations and application-level associated business capabilities are in its reverse structural scope? | Unsupported | planner_could_not_map |
| 286 | Which databases are single points of concentration by distinct operation, API, consumer, or capability fan-in? | Unsupported | planner_could_not_map |
| 290 | What part of table-level blast radius is unknown because tableName is absent on relevant edges? | Unsupported | planner_could_not_map |
| 292 | If banking.workflow.events-unknown's contract changes, which producers, consuming events, called operations, and upstream consumers require review? | Unsupported | planner_could_not_map |
| 293 | If a Kafka or RabbitMQ host fails, which event destinations and producer/called-operation paths share it? | Unsupported | planner_could_not_map |
| 295 | Which event self-loops or event cycles require cycle-safe handling in a blast-radius calculation? | Unsupported | planner_could_not_map |
| 297 | Which event has the broadest reverse producer, API, consumer, and business radius? | Unsupported | planner_could_not_map |
| 298 | What part of event blast radius is unknowable because message schemas, consumer groups, or delivery semantics are absent? | Unsupported | planner_could_not_map |
| 300 | If banking.api.events-unknown's contract changes, which producers, consuming events, called operations, and upstream consumers require review? | Unsupported | planner_could_not_map |
| 304 | If OAuth 2 changes, which operations, consumers, APIs, capabilities, and downstream dependencies are in scope? | Unsupported | planner_could_not_map |
| 306 | If Bank Sync is removed or compromised, which subscribed operations and API-derived Runtime paths are in scope? | Unsupported | planner_could_not_map |
| 314 | Which cycles and self-loops could amplify or confuse an unbounded impact traversal? | Unsupported | planner_could_not_map |
| 315 | Which two or more failed databases, events, services, or operations affect the largest overlapping dependent set? | Unsupported | planner_could_not_map |
| 316 | Which dependencies look like structural single points of failure because they have high reverse fan-in and no alternate path represented? | Unsupported | planner_could_not_map |

### Unresolved: clarification still required — 68

These did not reach an executable answer. Some need user input or an exact entity choice; others need additional planner grammar. Four still required clarification after a candidate-selection retry; 64 had no recorded candidate-selection retry.

| Case | Question | Response sequence | Recorded reason |
|---|---|---|---|
| 34 | Which GATEWAY, MICROSERVICE, or WORKFLOW category nodes are linked by DEPLOYED-TO from operations associated with Administer card terminals? | Clarification required | unconsumed_constraints |
| 40 | Which teams own capabilities whose application-level associated operation sets share a runtime dependency? | Clarification required | unconsumed_constraints |
| 44 | Which business capabilities and capability-owning teams are associated with operations linked to GATEWAY by DEPLOYED-TO? | Clarification required → Clarification required | unconsumed_constraints |
| 45 | Which business capabilities, capability-owning teams, and areas are associated with operations that produce or are called by banking.api.events-unknown? | Clarification required | unconsumed_constraints |
| 47 | Which business areas are associated with operations that write or update oauth_db-postgres? | Clarification required | unconsumed_constraints |
| 48 | Which capabilities are associated through implementing applications with APIs that expose 422 for Create Banking Compliance Fraud Resolution Resolution? | Clarification required | unconsumed_constraints |
| 49 | Which teams own capabilities associated through applications with External operations governed by OAuth 2? | Clarification required | unconsumed_constraints |
| 53 | Which current parent paths, descendants, owners, implementers, and application-level technology associations fall into structural review scope before moving Account Management? | Clarification required | unconsumed_constraints |
| 54 | Which current parents, descendant capabilities, owners, implementers, and application-level technology associations fall into structural review scope before splitting or merging Asset Securitization? | Clarification required | unconsumed_constraints |
| 56 | Which API consumers and runtime dependencies are conservatively associated through applications with a change to Administer counterparties? | Clarification required | unconsumed_constraints |
| 59 | Which multi-parent descendants and shared implementing applications show that a proposed business-area split may not be structurally isolated? | Clarification required | unconsumed_constraints |
| 62 | Which business capabilities and capability-owning teams are associated with operations in the reverse outage radius of oauth_db-postgres? | Clarification required | unconsumed_constraints |
| 63 | Which business capabilities and capability-owning teams are associated with operations in the reverse outage radius of sms-events-unknown? | Clarification required → Clarification required | unconsumed_constraints |
| 74 | Which capabilities have exactly one implementing application, and what application-level runtime resources are associated with it? | Clarification required | unconsumed_constraints |
| 75 | Which capabilities have multiple implementing applications, and how many distinct application-level runtime paths are associated with them? | Clarification required | unconsumed_constraints |
| 80 | Which nodes are reached by the selected propagation-edge policy versus included only as contextual rollups? | Clarification required | unconsumed_constraints |
| 89 | Which API names occur in several versions or contexts, and what exact node ids disambiguate them? | Clarification required | unconsumed_constraints |
| 90 | Which operations are not contained by an endpoint? | Clarification required | unconsumed_constraints |
| 94 | Is Create Aggregation Customer Account classified as PII, PCI, both, or neither? | Clarification required | unconsumed_constraints |
| 95 | Where is Create Payments Validate deployed? | Clarification required | unconsumed_constraints |
| 99 | How many response headers are associated with 202 for Create Banking Account Bill Payment? | Clarification required | unconsumed_constraints |
| 104 | Which consumers, APIs, and applications are structurally associated with operations implementing OAuth 2? | Clarification required | unconsumed_constraints |
| 112 | How do the endpoint and operation sets of the v1 and v5 API-version nodes compare? | Clarification required | unconsumed_constraints |
| 118 | Which schemas or fields share the same canonicalPath, and where are they exposed? | Clarification required | unconsumed_constraints |
| 122 | Does API Operations Console subscribe both at API and operation level, and where do those subscriptions overlap? | Clarification required | unconsumed_constraints |
| 123 | Which subscribed operations of Business Banking Pro are PII or PCI classified? | Clarification required | selection_constraints_unclear |
| 127 | Which APIs include both PII-classified and non-PII operations? | Clarification required | unconsumed_constraints |
| 128 | Which APIs include PCI-classified operations, and who consumes them? | Clarification required | unconsumed_constraints |
| 129 | Which operations have a DEPLOYED-TO target inconsistent with their serviceCategory? | Clarification required | unconsumed_constraints |
| 132 | Is the phoneNumber field request-only, response-only, or present in both directions? | Clarification required | unconsumed_constraints |
| 133 | Starting from CreateBankingAccountTransferRequest, which operations accept it and which status-code responses return it? | Clarification required | unconsumed_constraints |
| 134 | Starting from x-mock-response, where is it used as a request header versus a response header? | Clarification required | unconsumed_constraints |
| 135 | Starting from 201 for Create Banking Account Direct Debit Mandate, which response schema and headers does it carry, and which operation returns it? | Clarification required | unconsumed_constraints |
| 137 | Starting from oauth_db-postgres, which operations use it and which API contracts and consumers sit above those operations? | Clarification required | unconsumed_constraints |
| 149 | Which applications have the largest sensitive API footprint, and which capabilities, capability-owning teams, and business areas are associated through those applications? | Clarification required | unconsumed_constraints |
| 150 | Where does an identical field name or canonical path cross both PII-classified and non-PII operations? | Clarification required | unconsumed_constraints |
| 168 | How far does a nested-field change propagate through parent fields, root schema, operation, endpoint, API, application, and consumer? | Clarification required | field_root_required |
| 169 | Which APIs share the exact affected schema or field node, and which additional APIs are only heuristic review candidates because distinct nodes share a schema name, field name, or canonical path? | Clarification required | unconsumed_constraints |
| 188 | Which sensitive operations share a dependency that makes the security blast radius cross API boundaries? | Clarification required | unconsumed_constraints |
| 201 | What is the union and intersection of the blast radii of Customer Billing API and Direct Debit API? | Clarification required → Clarification required | scope_not_resolved |
| 202 | Which consumers are common to every root in Payment Confirmation Services API and Open Banking Access Services API, and which are unique to one root? | Clarification required | unconsumed_constraints |
| 205 | Which affected nodes are one hop away versus transitively affected within 10 hops? | Clarification required | unconsumed_constraints |
| 206 | Which blast-radius paths cross from API contracts into Runtime and then back to another API? | Clarification required | unconsumed_constraints |
| 209 | What is the union and intersection of the blast radii of Identity and API Security Services API and Card Case API? | Clarification required → Clarification required | scope_not_resolved |
| 210 | Which consumers are common to every root in Account Reconciliation API and Customer Position API, and which are unique to one root? | Clarification required | unconsumed_constraints |
| 211 | Which operations exist, and what are their operationId, HTTP method, path, service, and serviceCategory? | Clarification required | unconsumed_constraints |
| 216 | Which event destinations exist, and what transport type and host are recorded for each? | Clarification required | unconsumed_constraints |
| 228 | Is the connection direct, and what telemetry was observed? | Clarification required | unconsumed_constraints |
| 229 | Which captured queries are associated with those event writes? | Clarification required | unconsumed_constraints |
| 230 | Which operation does payment_validation-mongo call according to the populated DATABASE -[CALLS]-&gt; OPERATION edge? | Clarification required | unconsumed_constraints |
| 234 | Which writers touch accounts_deposits.business_state, and which query is recorded for each? | Clarification required | unconsumed_constraints |
| 237 | What type and host values are recorded on the event nodes that make those calls? | Clarification required | unconsumed_constraints |
| 241 | Starting from Accounts and Deposits, which runtime operations are conservatively associated through applications with its descendant capabilities? | Clarification required | unconsumed_constraints |
| 247 | For PII- or PCI-classified operations, which databases, tables, events, and called operations may participate in processing? | Clarification required | unconsumed_constraints |
| 250 | Where do two top-down paths converge on the same database, event, or callee operation? | Clarification required | two_roots_required |
| 257 | Starting from Create Banking Account Management Account Reconciliation, which consumers subscribe directly and which subscribe to its parent API? | Clarification required | unconsumed_constraints |
| 265 | Which services have the highest aggregate observed callCount on their route and call edges, with the aggregation rule stated? | Clarification required | unconsumed_constraints |
| 266 | Which tables have the highest aggregate observed read or write callCount where tableName is populated, with the aggregation rule stated? | Clarification required | unconsumed_constraints |
| 274 | If every operation belonging to payments-app fails, which consumers, APIs, applications, capabilities, databases, and events are in scope? | Clarification required | selection_constraints_unclear |
| 280 | If a route target fails, which gateway paths, methods, consumers, APIs, and capabilities are in its reverse dependency radius? | Clarification required | route_target_required |
| 283 | If host oracle fails, which distinct logical databases and Runtime paths share that host? | Clarification required | unconsumed_constraints |
| 285 | If a database schema change invalidates GET channel-rule:CASA:10, which exact operations or events execute it and what is their reverse blast radius? | Clarification required | unconsumed_constraints |
| 288 | How does hierarchy_v6-postgres's outage radius differ when restricted to direct users versus callers of those users? | Clarification required | unconsumed_constraints |
| 289 | Which data-change impact paths reach PII-, PCI-, External-, or Partner-classified operations? | Clarification required | unconsumed_constraints |
| 308 | If Account Reconciliation is retired, which services and shared Runtime resources are exclusively or jointly associated with it? | Clarification required | unconsumed_constraints |
| 318 | What blast-radius calculations omit or terminate at the isolated operation and telemetry-only operation? | Clarification required | unconsumed_constraints |
| 319 | What is the blast radius of all database or event nodes whose host is unknown, and which impacts cannot be assigned to concrete infrastructure? | Clarification required | unconsumed_constraints |
| 320 | Which affected nodes are direct, which are transitive, and which are business/API context rollups only? | Clarification required | unconsumed_constraints |

### Unresolved: no matching root entity — 2

One failed to match a root initially; one had no match after a clarification retry. This is distinct from executing a valid investigation that returns no evidence.

| Case | Question | Response sequence | Recorded reason |
|---|---|---|---|
| 68 | Which business areas are associated with operations in the reverse data-change radius of redis-redis? | Clarification required → No matching root | scope_not_resolved |
| 195 | Which APIs and consumers are in the reverse outage radius of banking.api.events-unknown? | No matching root | scope_not_resolved |

## Full audit, including templates

See [all 1,491 tested cases](question-bank-improved.md) for the additional filled and unfinished templates, and [raw audit records](question-bank-improved.jsonl) for plans, response details, and selected entity IDs. The [coverage follow-up](planner-coverage-followup.md) explains implemented fixes and remaining coverage.

