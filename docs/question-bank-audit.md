# Full question-bank audit

Every case checks the HTTP/API adapter, source-backed graph evidence, and table/narrative contract. Answered is NOT proof of semantic correctness. Expected ambiguity/no-evidence requires case review. Parameter fixtures cover two actual values, not all possible combinations. No live OpenAI model is tested when the API uses heuristic planning.

```json
{
  "total": 1491,
  "contractFailures": 0,
  "completedAt": "2026-09-21T10:25:31.794Z",
  "baseUrl": "http://127.0.0.1:4173",
  "fingerprints": [
    "67965e858cabc21745cdbda0b95872023a2cf9b67e3178d46869d27955e34af7"
  ],
  "outcomes": {
    "sample": {
      "answered": 78,
      "no_evidence": 10,
      "unsupported": 98,
      "clarification_required": 132,
      "no_match": 2
    },
    "template-filled": {
      "answered": 325,
      "no_evidence": 72,
      "unsupported": 241,
      "clarification_required": 203,
      "no_match": 9
    },
    "template-unfilled": {
      "clarification_required": 321
    }
  },
  "clarificationRetries": {
    "answered": 47,
    "no_evidence": 25
  },
  "plannerCoverageFailures": 602,
  "limitation": "Every case checks the HTTP/API adapter, source-backed graph evidence, and table/narrative contract. Answered is NOT proof of semantic correctness. Expected ambiguity/no-evidence requires case review. Parameter fixtures cover two actual values, not all possible combinations. No live OpenAI model is tested when the API uses heuristic planning."
}
```

| Case | Kind | Status | After selection | Contract | Question |
|---|---|---|---|---|---|
| 1 | sample | answered |  | pass | Which business areas, business domains, service domains, business capabilities, and teams exist? |
| 2 | sample | answered |  | pass | How many nodes of each Business-layer type exist? |
| 3 | sample | answered |  | pass | Which Business-layer nodes match fraud? |
| 4 | sample | answered |  | pass | Which business domains belong to more than one business area? |
| 5 | sample | no_evidence |  | pass | Which service domains have no parent business domain, or more than one parent? |
| 6 | sample | answered |  | pass | Which business capabilities have no owning team, exactly one owner, or multiple owning teams? |
| 7 | sample | no_evidence |  | pass | Which teams own no capabilities? |
| 8 | sample | answered |  | pass | Which capabilities have no implementing application? |
| 9 | sample | unsupported |  | pass | What percentage of each business hierarchy level is linked to its expected parent and child types? |
| 10 | sample | unsupported |  | pass | Which Business-layer nodes are orphaned or disconnected from the API and Runtime estate? |
| 11 | sample | answered |  | pass | Which business domains does Accounts and Deposits contain? |
| 12 | sample | answered |  | pass | How many business domains does each business area contain? |
| 13 | sample | answered |  | pass | Which service domains does Account Management contain? |
| 14 | sample | unsupported |  | pass | Which business domains share or overlap in service-domain membership? |
| 15 | sample | answered |  | pass | How many capabilities does each service domain contain? |
| 16 | sample | answered |  | pass | Which business capabilities does Beneficiary & Payee Platform Team own? |
| 17 | sample | answered |  | pass | How many capabilities does each team own? |
| 18 | sample | answered |  | pass | Which business capabilities does channel-integration-service implement? |
| 19 | sample | unsupported |  | pass | Which applications span multiple service domains, business domains, or business areas through the capabilities they implement? |
| 20 | sample | answered |  | pass | How many APIs does each application expose? |
| 21 | sample | answered |  | pass | Which business area or areas contain Core Banking? |
| 22 | sample | answered |  | pass | Does Channel Specific have one parent area, multiple parent areas, or no parent? |
| 23 | sample | answered |  | pass | Which business domain contains ACH Operations? |
| 24 | sample | unsupported |  | pass | Which service domains are referenced by multiple business domains? |
| 25 | sample | unsupported |  | pass | Which capabilities cross service-domain boundaries? |
| 26 | sample | answered |  | pass | Which team or teams own Administer counterparties? |
| 27 | sample | answered |  | pass | Which capabilities have shared ownership, and who are all the owners? |
| 28 | sample | answered |  | pass | Which capabilities are implemented by multiple applications? |
| 29 | sample | answered |  | pass | Which capability has the largest application implementation footprint? |
| 30 | sample | clarification_required | answered | pass | Which application or applications expose Identity and API Security Services API? |
| 31 | sample | answered |  | pass | What is the complete capability, application, API, endpoint, and operation estate under Accounts and Deposits? |
| 32 | sample | clarification_required |  | pass | Which applications implement capabilities in Account Reconciliation, and which APIs, versions, endpoints, and operations are associated through those applications? |
| 33 | sample | answered |  | pass | Which APIs and operations are associated with capabilities owned by Core Accounts & Ledger Team? |
| 34 | sample | clarification_required |  | pass | Which GATEWAY, MICROSERVICE, or WORKFLOW category nodes are linked by DEPLOYED-TO from operations associated with Administer card terminals? |
| 35 | sample | clarification_required |  | pass | Which events are produced by operations associated with Administer collateral assets through its implementing applications? |
| 36 | sample | clarification_required |  | pass | Which request headers, parameters, schemas, and fields occur in APIs associated with Administer counterparties? |
| 37 | sample | clarification_required | answered | pass | Which operations associated with Payments and Cards are External, Internal, or Partner exposed? |
| 38 | sample | clarification_required |  | pass | Which security controls are implemented by operations associated with Account Reconciliation? |
| 39 | sample | unsupported |  | pass | Which business areas have the largest conservative application-level counts of associated APIs, operations, consumers, databases, or events? |
| 40 | sample | clarification_required |  | pass | Which teams own capabilities whose application-level associated operation sets share a runtime dependency? |
| 41 | sample | clarification_required |  | pass | Which business capabilities are implemented by cards-merchant-app, and which service domains, business domains, and business areas contain them? |
| 42 | sample | answered |  | pass | Which teams own capabilities implemented by operations-openfinance-app? |
| 43 | sample | unsupported |  | pass | Which business hierarchy and capability-owning teams are associated upstream of the v1 Identity and API Security Services API version? |
| 44 | sample | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations linked to GATEWAY by DEPLOYED-TO? |
| 45 | sample | clarification_required |  | pass | Which business capabilities, capability-owning teams, and areas are associated with operations that produce or are called by banking.api.events-unknown? |
| 46 | sample | clarification_required |  | pass | Which business areas are associated with operations that read from banking_demo-postgres? |
| 47 | sample | clarification_required |  | pass | Which business areas are associated with operations that write or update oauth_db-postgres? |
| 48 | sample | clarification_required |  | pass | Which capabilities are associated through implementing applications with APIs that expose 422 for Create Banking Compliance Fraud Resolution Resolution? |
| 49 | sample | clarification_required |  | pass | Which teams own capabilities associated through applications with External operations governed by OAuth 2? |
| 50 | sample | unsupported |  | pass | How many distinct business areas, domains, capabilities, teams, applications, and APIs converge on banking_demo-postgres? |
| 51 | sample | answered |  | pass | What current hierarchy and application-level technology estate falls into review scope if Accounts and Deposits is reorganized or retired? |
| 52 | sample | answered |  | pass | Which domains, service domains, capabilities, teams, applications, APIs, operations, consumers, deployments, databases, and events fall under the change scope of Payments and Cards? |
| 53 | sample | clarification_required |  | pass | Which current parent paths, descendants, owners, implementers, and application-level technology associations fall into structural review scope before moving Account Management? |
| 54 | sample | clarification_required |  | pass | Which current parents, descendant capabilities, owners, implementers, and application-level technology associations fall into structural review scope before splitting or merging Asset Securitization? |
| 55 | sample | unsupported |  | pass | What is affected if Administer collateral assets is renamed, redefined, consolidated, or retired? |
| 56 | sample | clarification_required |  | pass | Which API consumers and runtime dependencies are conservatively associated through applications with a change to Administer counterparties? |
| 57 | sample | answered |  | pass | Which currently owned capabilities and application-level technology associations enter review scope if Consumer Lending Platform Team gives up ownership of Account Information Service? |
| 58 | sample | unsupported |  | pass | Which capabilities become ownerless if Core Accounts & Ledger Team is removed? |
| 59 | sample | clarification_required |  | pass | Which multi-parent descendants and shared implementing applications show that a proposed business-area split may not be structurally isolated? |
| 60 | sample | unsupported |  | pass | Which shared applications and their associated APIs, databases, or events extend conservative review scope beyond Payments? |
| 61 | sample | clarification_required | answered | pass | Which business areas, domains, capabilities, and capability-owning teams appear in the reverse business-context rollup of operations-openfinance-app? |
| 62 | sample | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations in the reverse outage radius of oauth_db-postgres? |
| 63 | sample | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations in the reverse outage radius of sms-events-unknown? |
| 64 | sample | unsupported |  | pass | For operations linked by DEPLOYED-TO to GATEWAY, which capability-owning teams appear in the reverse business-context rollup? |
| 65 | sample | clarification_required | answered | pass | Which business areas appear in the reverse context rollup of a contract change to Customer Billing API? |
| 66 | sample | unsupported |  | pass | Which capabilities and capability-owning teams appear in the context rollup if the v5 Current Account API version is deprecated? |
| 67 | sample | clarification_required | answered | pass | Which business capabilities are associated with operations governed by OAuth 2? |
| 68 | sample | no_match |  | pass | Which business areas are associated with operations in the reverse data-change radius of redis-redis? |
| 69 | sample | clarification_required | answered | pass | Which business capabilities are associated with operations in the reverse change radius of routing or call changes to Create Aggregation Customer Account? |
| 70 | sample | unsupported |  | pass | Which technical root node has the widest reverse-mapped business-context rollup? |
| 71 | sample | clarification_required | no_evidence | pass | How do business areas rank by the number of distinct applications, APIs, operations, consumers, deployments, databases, and events in their blast radius? |
| 72 | sample | clarification_required | no_evidence | pass | How do capabilities rank by the number of dependent consumers and shared runtime resources in their blast radius? |
| 73 | sample | answered |  | pass | Which teams have the largest cross-domain or cross-area change blast radius? |
| 74 | sample | clarification_required |  | pass | Which capabilities have exactly one implementing application, and what application-level runtime resources are associated with it? |
| 75 | sample | clarification_required |  | pass | Which capabilities have multiple implementing applications, and how many distinct application-level runtime paths are associated with them? |
| 76 | sample | unsupported |  | pass | What is the overlap between the blast radii of Accounts and Deposits and Payments and Cards? |
| 77 | sample | unsupported |  | pass | What are the union, intersection, and root-specific remainders of the structural scopes of Cards and Payments? |
| 78 | sample | no_evidence |  | pass | How does the direct impact differ from the transitive impact for Risk and Compliance? |
| 79 | sample | unsupported |  | pass | Which impact paths cross Business, API, and Runtime layer boundaries, and at which edge does each crossing occur? |
| 80 | sample | clarification_required |  | pass | Which nodes are reached by the selected propagation-edge policy versus included only as contextual rollups? |
| 81 | sample | answered |  | pass | Which applications, APIs, API versions, endpoints, operations, and consumers exist? |
| 82 | sample | answered |  | pass | How many nodes of each API-layer type exist? |
| 83 | sample | unsupported |  | pass | Which API version names are present, and how many APIs, endpoints, and operations use each version? |
| 84 | sample | answered |  | pass | Which exposure values are present, and how many operations are External, Internal, or Partner exposed? |
| 85 | sample | answered |  | pass | How many operations are classified as PII, PCI, both, or neither? |
| 86 | sample | unsupported |  | pass | Which APIs, versions, endpoints, or operations have no expected containment parent or child? |
| 87 | sample | unsupported |  | pass | Which status-code nodes lack a response schema or response headers? |
| 88 | sample | unsupported |  | pass | Which consumers have no API or operation subscriptions? |
| 89 | sample | clarification_required |  | pass | Which API names occur in several versions or contexts, and what exact node ids disambiguate them? |
| 90 | sample | clarification_required |  | pass | Which operations are not contained by an endpoint? |
| 91 | sample | answered |  | pass | What set of APIs is exposed by cards-merchant-app? |
| 92 | sample | clarification_required | answered | pass | Which endpoints does the v5 Account Reconciliation API version contain? |
| 93 | sample | clarification_required | answered | pass | Which HTTP method does Create Security Oauth Token support? |
| 94 | sample | clarification_required |  | pass | Is Create Aggregation Customer Account classified as PII, PCI, both, or neither? |
| 95 | sample | clarification_required |  | pass | Where is Create Payments Validate deployed? |
| 96 | sample | answered |  | pass | How many request headers does Create Banking Account Bill Payment accept? |
| 97 | sample | answered |  | pass | How many query parameters does Create Banking Account Management Account Reconciliation accept? |
| 98 | sample | unsupported |  | pass | Which operations return multiple modeled status codes? |
| 99 | sample | clarification_required |  | pass | How many response headers are associated with 202 for Create Banking Account Bill Payment? |
| 100 | sample | clarification_required | answered | pass | What is the complete nested field tree beneath the customerId field? |
| 101 | sample | clarification_required | answered | pass | Which applications expose Customer Billing API? |
| 102 | sample | clarification_required | answered | pass | Does the v5 Account Reconciliation API version have a unique parent API? |
| 103 | sample | unsupported |  | pass | Is Create Security Oauth Token contained by more than one endpoint? |
| 104 | sample | clarification_required |  | pass | Which consumers, APIs, and applications are structurally associated with operations implementing OAuth 2? |
| 105 | sample | answered |  | pass | Which operations have External exposure? |
| 106 | sample | clarification_required | answered | pass | Which operations accept x-mock-response as a request header? |
| 107 | sample | clarification_required | answered | pass | Which operations accept customerId? |
| 108 | sample | unsupported |  | pass | Across which consumers and APIs is limit used? |
| 109 | sample | unsupported |  | pass | Which APIs and versions expose 202 for Create Banking Account Bill Payment? |
| 110 | sample | unsupported |  | pass | What are all ancestor fields and the root schema of the customerId field? |
| 111 | sample | answered |  | pass | What is the complete API tree exposed by cards-merchant-app, from API through version, endpoint, and operation? |
| 112 | sample | clarification_required |  | pass | How do the endpoint and operation sets of the v1 and v5 API-version nodes compare? |
| 113 | sample | answered |  | pass | Which operationIds or paths repeat across gateway and microservice services? |
| 114 | sample | unsupported |  | pass | For /v5/banking/cards/{cardId}/loss-reports, what are the method, operationId, path, service, service category, security, exposure, sensitivity, and deployment target of every operation? |
| 115 | sample | clarification_required | answered | pass | What status codes, response headers, response schemas, and nested fields can Create Payments Validate return? |
| 116 | sample | unsupported |  | pass | Which required fields occur at each canonical path in CreateBankingAccountBillPaymentRequest? |
| 117 | sample | unsupported |  | pass | Which object or array fields have no nested child fields? |
| 118 | sample | clarification_required |  | pass | Which schemas or fields share the same canonicalPath, and where are they exposed? |
| 119 | sample | unsupported |  | pass | Which APIs return non-success or error status-code nodes in addition to success responses? |
| 120 | sample | unsupported |  | pass | Which request and response headers appear most widely across the API estate? |
| 121 | sample | unsupported |  | pass | What APIs and operations form Bank Sync's complete subscription footprint? |
| 122 | sample | clarification_required |  | pass | Does API Operations Console subscribe both at API and operation level, and where do those subscriptions overlap? |
| 123 | sample | clarification_required |  | pass | Which subscribed operations of Business Banking Pro are PII or PCI classified? |
| 124 | sample | unsupported |  | pass | Which GATEWAY, MICROSERVICE, or WORKFLOW category nodes are linked by DEPLOYED-TO from Card Management Portal's subscribed operations? |
| 125 | sample | unsupported |  | pass | Which databases and events are reached transitively from Account Linker's subscriptions? |
| 126 | sample | answered |  | pass | Which APIs mix External, Internal, and Partner operations? |
| 127 | sample | clarification_required |  | pass | Which APIs include both PII-classified and non-PII operations? |
| 128 | sample | clarification_required |  | pass | Which APIs include PCI-classified operations, and who consumes them? |
| 129 | sample | clarification_required |  | pass | Which operations have a DEPLOYED-TO target inconsistent with their serviceCategory? |
| 130 | sample | unsupported |  | pass | Which APIs depend on the same called or routed-to operation? |
| 131 | sample | unsupported |  | pass | Starting from the correlationId field, which parent field tree, schema, request or response, status code, operation, endpoint, version, API, and application expose it? |
| 132 | sample | clarification_required |  | pass | Is the phoneNumber field request-only, response-only, or present in both directions? |
| 133 | sample | clarification_required |  | pass | Starting from CreateBankingAccountTransferRequest, which operations accept it and which status-code responses return it? |
| 134 | sample | clarification_required |  | pass | Starting from x-mock-response, where is it used as a request header versus a response header? |
| 135 | sample | clarification_required |  | pass | Starting from 201 for Create Banking Account Direct Debit Mandate, which response schema and headers does it carry, and which operation returns it? |
| 136 | sample | unsupported |  | pass | Starting from OAuth 2, which operations, endpoints, APIs, applications, consumers, capabilities, and teams are in scope? |
| 137 | sample | clarification_required |  | pass | Starting from oauth_db-postgres, which operations use it and which API contracts and consumers sit above those operations? |
| 138 | sample | unsupported |  | pass | Starting from sms-events-unknown, which producing operations and subscribed consumers sit upstream? |
| 139 | sample | unsupported |  | pass | Which field, schema, operation, endpoint, or API has the greatest reverse fan-in from consumers? |
| 140 | sample | unsupported |  | pass | Which database, event, or deployment target has the greatest reverse fan-in from APIs? |
| 141 | sample | clarification_required |  | pass | Which External operations are classified as PII? |
| 142 | sample | clarification_required |  | pass | Which External operations are classified as PCI? |
| 143 | sample | clarification_required |  | pass | Which Partner operations are classified as PII or PCI? |
| 144 | sample | answered |  | pass | Which PII or PCI operations are deployed to GATEWAY? |
| 145 | sample | unsupported |  | pass | Which PII or PCI operations produce banking.api.events-unknown? |
| 146 | sample | answered |  | pass | Which operations satisfying DELETE, Internal, PII, OAuth 2, and MICROSERVICE all at once exist? |
| 147 | sample | unsupported |  | pass | Which operations lack one or more of method, OAuth 2, exposure, and deployment relationships? |
| 148 | sample | unsupported |  | pass | Which PII or PCI operations have no subscribing consumer? |
| 149 | sample | clarification_required |  | pass | Which applications have the largest sensitive API footprint, and which capabilities, capability-owning teams, and business areas are associated through those applications? |
| 150 | sample | clarification_required |  | pass | Where does an identical field name or canonical path cross both PII-classified and non-PII operations? |
| 151 | sample | answered |  | pass | What is affected if cards-merchant-app stops exposing its APIs? |
| 152 | sample | clarification_required | answered | pass | What is the deprecation blast radius of Open Banking Access Services API? |
| 153 | sample | unsupported |  | pass | Which versions, endpoints, operations, consumers, contracts, deployments, databases, events, applications, capabilities, teams, and business areas are in Current Account API's deprecation radius? |
| 154 | sample | clarification_required | answered | pass | What is affected if the v6 Payment Confirmation Services API version is retired? |
| 155 | sample | clarification_required | answered | pass | Which consumers depend directly on the v1 Identity and API Security Services API version's operations even if they subscribe to the parent API separately? |
| 156 | sample | clarification_required | answered | pass | What is affected if /v5/aggregation/customers/{customerId}/accounts is removed or moved? |
| 157 | sample | answered |  | pass | What is affected if Create Banking Account Management Account Reconciliation's path, method, operationId, service, or serviceCategory changes? |
| 158 | sample | clarification_required | answered | pass | Which called or routed operations expand the transitive blast radius of deprecating Create Security Oauth Token? |
| 159 | sample | clarification_required | answered | pass | Which business capabilities and capability-owning teams are in the reverse context rollup of Identity and API Security Services API's deprecation? |
| 160 | sample | answered |  | pass | What is affected if payments-app stops exposing its APIs? |
| 161 | sample | clarification_required | answered | pass | What is the contract-change blast radius of changing or removing request header x-mock-response? |
| 162 | sample | unsupported |  | pass | What is the contract-change blast radius of renaming, adding, or removing customerId? |
| 163 | sample | unsupported |  | pass | What is the contract-change blast radius of changing limit? |
| 164 | sample | clarification_required | answered | pass | What is the contract-change blast radius of CreateBankingAccountBillPaymentRequest? |
| 165 | sample | unsupported |  | pass | Which operations and consumers are affected if the customerId field changes type or format? |
| 166 | sample | clarification_required | answered | pass | Which operations and consumers are affected if the correlationId field changes required status? |
| 167 | sample | clarification_required | no_evidence | pass | Which operations and consumers are affected if additionalProperties changes on CreateBankingAccountTransferRequest? |
| 168 | sample | clarification_required |  | pass | How far does a nested-field change propagate through parent fields, root schema, operation, endpoint, API, application, and consumer? |
| 169 | sample | clarification_required |  | pass | Which APIs share the exact affected schema or field node, and which additional APIs are only heuristic review candidates because distinct nodes share a schema name, field name, or canonical path? |
| 170 | sample | clarification_required | answered | pass | What is the contract-change blast radius of changing or removing request header idempotency-key? |
| 171 | sample | answered |  | pass | What is affected if 200 for Create Banking Card Cash Withdrawal is added, removed, or changes meaning? |
| 172 | sample | clarification_required | answered | pass | What is affected if response X-Workflow-Execution-Id changes or is removed? |
| 173 | sample | clarification_required | answered | pass | What is the response-contract blast radius of CreateBankingAccountTransferResponse_202? |
| 174 | sample | clarification_required | answered | pass | Which consumers and callers are affected if the sourceSystem field changes in a response schema? |
| 175 | sample | unsupported |  | pass | Which operations are impacted if a shared response field changes at any nesting depth? |
| 176 | sample | clarification_required | no_evidence | pass | What is the combined request-and-response blast radius when CreateBankingAccountBillPaymentResponse_202 appears in both directions? |
| 177 | sample | clarification_required | no_evidence | pass | Which APIs and consumers are affected by changing all occurrences of /Data/Account/*/Currency? |
| 178 | sample | clarification_required | answered | pass | What is affected if 502 for Create Banking Compliance Regulatory Compliance Operational Action is added, removed, or changes meaning? |
| 179 | sample | clarification_required | answered | pass | What is affected if response header X-Endpoint-Id changes or is removed? |
| 180 | sample | clarification_required | answered | pass | What is the response-contract blast radius of CreateBankingCardDisputeResponse_201? |
| 181 | sample | unsupported |  | pass | What is the security-change blast radius of OAuth 2? |
| 182 | sample | clarification_required | no_evidence | pass | Which operations, consumers, APIs, applications, capabilities, and teams are affected if OAuth 2 behavior changes? |
| 183 | sample | clarification_required | answered | pass | What is the policy-change blast radius of reclassifying Create Security Oauth Token as PII or PCI? |
| 184 | sample | clarification_required | no_evidence | pass | What is the estate-wide blast radius of changing the PII classification policy? |
| 185 | sample | clarification_required | no_evidence | pass | What is the estate-wide blast radius of changing the PCI classification policy? |
| 186 | sample | unsupported |  | pass | Which consumers, associated business capabilities, and capability-owning teams enter review scope if Create Banking Account Bill Payment's exposure changes from Internal or Partner to External? |
| 187 | sample | answered |  | pass | Which databases, events, called operations, and deployments sit downstream of External PII or PCI operations affected by a policy change? |
| 188 | sample | clarification_required |  | pass | Which sensitive operations share a dependency that makes the security blast radius cross API boundaries? |
| 189 | sample | clarification_required | answered | pass | What is the policy-change blast radius of reclassifying Create Payments Validate as PII or PCI? |
| 190 | sample | unsupported |  | pass | Which consumers, associated business capabilities, and capability-owning teams enter review scope if Create Aggregation Customer Account's exposure changes from Internal or Partner to External? |
| 191 | sample | answered |  | pass | For operations linked by DEPLOYED-TO to MICROSERVICE, which endpoints, APIs, consumers, applications, capabilities, and capability-owning teams are in structural scope? |
| 192 | sample | answered |  | pass | What is affected if Create Banking Account Management Account Reconciliation moves between gateway and microservice deployment categories? |
| 193 | sample | clarification_required | answered | pass | Which consumers are affected by a service or serviceCategory change to Create Security Oauth Token? |
| 194 | sample | answered |  | pass | Which API contracts are in the reverse outage radius of redis-redis? |
| 195 | sample | no_match |  | pass | Which APIs and consumers are in the reverse outage radius of banking.api.events-unknown? |
| 196 | sample | answered |  | pass | Which APIs and consumers are affected by a data change to oauth_db-postgres? |
| 197 | sample | answered |  | pass | Which APIs and consumers are affected if a called or routed-to Create Banking Account Management Account Reconciliation changes or fails? |
| 198 | sample | unsupported |  | pass | Which cross-API call or route dependencies enlarge the deployment blast radius? |
| 199 | sample | unsupported |  | pass | For operations linked by DEPLOYED-TO to GATEWAY, which endpoints, APIs, consumers, applications, capabilities, and capability-owning teams are in structural scope? |
| 200 | sample | clarification_required | answered | pass | What is affected if Create Payments Validate moves between gateway and microservice deployment categories? |
| 201 | sample | unsupported |  | pass | What is the union and intersection of the blast radii of Customer Billing API and Direct Debit API? |
| 202 | sample | clarification_required |  | pass | Which consumers are common to every root in Payment Confirmation Services API and Open Banking Access Services API, and which are unique to one root? |
| 203 | sample | unsupported |  | pass | Which applications, capabilities, and teams appear in multiple API blast radii? |
| 204 | sample | answered |  | pass | How do APIs, schemas, fields, deployment targets, databases, and events rank by distinct consumer blast radius? |
| 205 | sample | clarification_required |  | pass | Which affected nodes are one hop away versus transitively affected within 10 hops? |
| 206 | sample | clarification_required |  | pass | Which blast-radius paths cross from API contracts into Runtime and then back to another API? |
| 207 | sample | unsupported |  | pass | Which blast-radius results are truncated by depth or result limits? |
| 208 | sample | unsupported |  | pass | Which result nodes are contextual portfolio rollups rather than propagating failures? |
| 209 | sample | unsupported |  | pass | What is the union and intersection of the blast radii of Identity and API Security Services API and Card Case API? |
| 210 | sample | clarification_required |  | pass | Which consumers are common to every root in Account Reconciliation API and Customer Position API, and which are unique to one root? |
| 211 | sample | clarification_required |  | pass | Which operations exist, and what are their operationId, HTTP method, path, service, and serviceCategory? |
| 212 | sample | unsupported |  | pass | Which services are recorded on the broadest mix of GET, POST, PUT, PATCH, and DELETE operations? |
| 213 | sample | unsupported |  | pass | Which operations have missing or blank httpMethod, path, service, serviceCategory, or operationId properties? |
| 214 | sample | unsupported |  | pass | Which endpoints map to one, two, three, or four runtime operation nodes? |
| 215 | sample | unsupported |  | pass | Which database nodes share a type, host, logical name, or connection endpoint? |
| 216 | sample | clarification_required |  | pass | Which event destinations exist, and what transport type and host are recorded for each? |
| 217 | sample | answered |  | pass | How many CALLS, ROUTES-TO, CONNECTS-TO, READS-FROM, WRITES-TO, UPDATES-TO, PRODUCES, and CONSUMES edges exist? |
| 218 | sample | unsupported |  | pass | Which less common populated Runtime signatures use DATABASE or EVENT as the source of CALLS, CONNECTS-TO, or PRODUCES? |
| 219 | sample | unsupported |  | pass | Which Runtime edges are self-loops? |
| 220 | sample | unsupported |  | pass | Which edge properties are populated for each Runtime relationship type? |
| 221 | sample | clarification_required | no_evidence | pass | Which operations does Create Banking Account Bill Payment call directly? |
| 222 | sample | no_evidence |  | pass | Which operations does Create Banking Account Management Account Reconciliation route to directly? |
| 223 | sample | clarification_required | no_evidence | pass | Which databases does Create Security Oauth Token connect to? |
| 224 | sample | answered |  | pass | Which databases and tables does Create Aggregation Customer Account write to? |
| 225 | sample | clarification_required | answered | pass | Which captured queries support the update dependencies of Create Payments Validate? |
| 226 | sample | unsupported |  | pass | Is the CONSUMES edge a self-loop or a cross-event dependency? |
| 227 | sample | no_evidence |  | pass | Which operations does banking.workflow.events-unknown call? |
| 228 | sample | clarification_required |  | pass | Is the connection direct, and what telemetry was observed? |
| 229 | sample | clarification_required |  | pass | Which captured queries are associated with those event writes? |
| 230 | sample | clarification_required |  | pass | Which operation does payment_validation-mongo call according to the populated DATABASE -[CALLS]-> OPERATION edge? |
| 231 | sample | clarification_required | no_evidence | pass | Which operations call Create Banking Account Bill Payment directly? |
| 232 | sample | no_evidence |  | pass | Which gateway paths and methods feed Create Banking Account Management Account Reconciliation? |
| 233 | sample | no_evidence |  | pass | Which operations read from hierarchy_v6-postgres? |
| 234 | sample | clarification_required |  | pass | Which writers touch accounts_deposits.business_state, and which query is recorded for each? |
| 235 | sample | answered |  | pass | Which operations produce banking.api.events-unknown? |
| 236 | sample | no_evidence |  | pass | Which event produces banking.workflow.commands-unknown? |
| 237 | sample | clarification_required |  | pass | What type and host values are recorded on the event nodes that make those calls? |
| 238 | sample | no_evidence |  | pass | Which events read from hierarchy_v6-postgres? |
| 239 | sample | unsupported |  | pass | Which event writes use payment_transactions? |
| 240 | sample | clarification_required | no_evidence | pass | Which database calls Create Payments Validate through the observed extension edge? |
| 241 | sample | clarification_required |  | pass | Starting from Accounts and Deposits, which runtime operations are conservatively associated through applications with its descendant capabilities? |
| 242 | sample | unsupported |  | pass | For Account Information Service, which applications, APIs, endpoints, runtime services, and operations form its conservative implementation scope? |
| 243 | sample | answered |  | pass | For channel-integration-service, which exposed APIs terminate in which gateway or microservice operations? |
| 244 | sample | unsupported |  | pass | For the v6 Payment Confirmation Services API version, which services, databases, tables, and events are downstream? |
| 245 | sample | unsupported |  | pass | For /v5/banking/account-management/account-reconciliation, what call chain, database access, and event production can follow execution? |
| 246 | sample | unsupported |  | pass | For an API-level subscription held by Bank Sync, which contained operations and dependencies enter scope? |
| 247 | sample | clarification_required |  | pass | For PII- or PCI-classified operations, which databases, tables, events, and called operations may participate in processing? |
| 248 | sample | clarification_required | answered | pass | For operations accepting the CreateBankingAccountBillPaymentRequest schema, which runtime dependencies execute behind them? |
| 249 | sample | unsupported |  | pass | Across versions of Customer Position API, how do service assignments, routes, calls, database dependencies, and event outputs differ? |
| 250 | sample | clarification_required |  | pass | Where do two top-down paths converge on the same database, event, or callee operation? |
| 251 | sample | unsupported |  | pass | Starting from Create Banking Account Bill Payment, which endpoint, version, API, application, capability, business hierarchy, and team are upstream? |
| 252 | sample | answered |  | pass | Starting from oauth_db-postgres, which operations and events connect, read, write, or update it, separated by access mode? |
| 253 | sample | unsupported |  | pass | Starting from hierarchy_v6-postgres, which applications, capabilities, business areas, and teams depend on it? |
| 254 | sample | unsupported |  | pass | Starting from the captured fraud-evaluation idempotency query, which edge, operation or event, database, and upstream context produced it? |
| 255 | sample | unsupported |  | pass | Starting from banking.api.events-unknown, which APIs, consumers, applications, capabilities, and teams sit upstream of its producers? |
| 256 | sample | clarification_required | no_evidence | pass | Starting from callee Create Banking Account Bill Payment, which operations, events, or databases call it directly or transitively? |
| 257 | sample | clarification_required |  | pass | Starting from Create Banking Account Management Account Reconciliation, which consumers subscribe directly and which subscribe to its parent API? |
| 258 | sample | unsupported |  | pass | Starting from redis-redis, which request and response contract elements are attached to its upstream operations? |
| 259 | sample | answered |  | pass | Starting from a concrete-path operation, which wildcard, canonical, gateway, or microservice variants represent the same logical operation? |
| 260 | sample | unsupported |  | pass | Which runtime dependency has the largest reverse fan-in from operations, APIs, consumers, capabilities, or teams? |
| 261 | sample | answered |  | pass | Which Runtime edges have the highest observed callCount? |
| 262 | sample | answered |  | pass | What is errorCount divided by callCount for each error-bearing edge? |
| 263 | sample | unsupported |  | pass | Which relationships appear stale relative to the graph's generatedAt timestamp and a supplied threshold? |
| 264 | sample | answered |  | pass | How are callCount and errorCount distributed by source service, service category, database, event, API, or business area? |
| 265 | sample | clarification_required |  | pass | Which services have the highest aggregate observed callCount on their route and call edges, with the aggregation rule stated? |
| 266 | sample | clarification_required |  | pass | Which tables have the highest aggregate observed read or write callCount where tableName is populated, with the aggregation rule stated? |
| 267 | sample | unsupported |  | pass | Which consumers' reachable operation sets include error-bearing routes? |
| 268 | sample | unsupported |  | pass | Which teams or business capabilities roll up to the observed error-bearing paths? |
| 269 | sample | answered |  | pass | What are the stored edge-depth distribution and the independently computed graph-hop distribution when reported as non-equivalent measures? |
| 270 | sample | unsupported |  | pass | Which runtime relationships have telemetry attributes missing or structurally inconsistent for their edge type? |
| 271 | sample | clarification_required | no_evidence | pass | If Create Banking Account Bill Payment is used as an outage root, which direct callers, routed callers, event-call paths, consumers, APIs, applications, capabilities, domains, areas, and teams are structurally in scope? |
| 272 | sample | answered |  | pass | If Create Banking Account Management Account Reconciliation fails, which downstream operations, databases, tables, and event destinations fall within its dependency-side impact scope? |
| 273 | sample | clarification_required | answered | pass | What are the separate upstream-dependent and downstream-dependency sides of Create Security Oauth Token's blast radius within 6 hops? |
| 274 | sample | clarification_required |  | pass | If every operation belonging to payments-app fails, which consumers, APIs, applications, capabilities, databases, and events are in scope? |
| 275 | sample | clarification_required | no_evidence | pass | If a gateway operation fails, which routed gateway or microservice operations and downstream data/event dependencies are affected? |
| 276 | sample | unsupported |  | pass | For the generic GATEWAY deployment category, which linked operations, endpoints, APIs, consumers, and capability rollups form its structural scope? |
| 277 | sample | answered |  | pass | For the generic MICROSERVICE deployment category, which linked operations and upstream API entry points form its structural scope? |
| 278 | sample | answered |  | pass | Which operations have both gateway and microservice deployment edges, and how should their radius be deduplicated? |
| 279 | sample | unsupported |  | pass | If a high-fan-in callee is used as an outage root, which caller operations and application-level associated business capabilities are in its reverse structural scope? |
| 280 | sample | clarification_required |  | pass | If a route target fails, which gateway paths, methods, consumers, APIs, and capabilities are in its reverse dependency radius? |
| 281 | sample | answered |  | pass | If banking_demo-postgres fails, which operations and events are affected, separated by connect, read, write, and update relationship? |
| 282 | sample | answered |  | pass | If oauth_db-postgres fails, which upstream callers, routes, consumers, APIs, applications, capabilities, areas, and teams are transitively affected? |
| 283 | sample | clarification_required |  | pass | If host oracle fails, which distinct logical databases and Runtime paths share that host? |
| 284 | sample | clarification_required | no_evidence | pass | If accounts_deposits.business_state changes or becomes unavailable, which readers, writers, updaters, APIs, capabilities, and consumers are exposed? |
| 285 | sample | clarification_required |  | pass | If a database schema change invalidates GET channel-rule:CASA:10, which exact operations or events execute it and what is their reverse blast radius? |
| 286 | sample | unsupported |  | pass | Which databases are single points of concentration by distinct operation, API, consumer, or capability fan-in? |
| 287 | sample | answered |  | pass | Which business areas share oauth_db-postgres, causing an outage radius to cross organizational boundaries? |
| 288 | sample | clarification_required |  | pass | How does hierarchy_v6-postgres's outage radius differ when restricted to direct users versus callers of those users? |
| 289 | sample | clarification_required |  | pass | Which data-change impact paths reach PII-, PCI-, External-, or Partner-classified operations? |
| 290 | sample | unsupported |  | pass | What part of table-level blast radius is unknown because tableName is absent on relevant edges? |
| 291 | sample | answered |  | pass | If banking.workflow.commands-unknown is unavailable, which producer operations, event flows, called operations, databases, APIs, and capabilities are affected? |
| 292 | sample | unsupported |  | pass | If banking.workflow.events-unknown's contract changes, which producers, consuming events, called operations, and upstream consumers require review? |
| 293 | sample | unsupported |  | pass | If a Kafka or RabbitMQ host fails, which event destinations and producer/called-operation paths share it? |
| 294 | sample | answered |  | pass | If an operation called by rabbitmq-unknown is used as an outage root, which event-call edge and downstream database writes or produced events fall within structural scope? |
| 295 | sample | unsupported |  | pass | Which event self-loops or event cycles require cycle-safe handling in a blast-radius calculation? |
| 296 | sample | answered |  | pass | Which business areas and teams share banking.workflow.commands-unknown through different producer operations? |
| 297 | sample | unsupported |  | pass | Which event has the broadest reverse producer, API, consumer, and business radius? |
| 298 | sample | unsupported |  | pass | What part of event blast radius is unknowable because message schemas, consumer groups, or delivery semantics are absent? |
| 299 | sample | answered |  | pass | If rabbitmq-unknown is unavailable, which producer operations, event flows, called operations, databases, APIs, and capabilities are affected? |
| 300 | sample | unsupported |  | pass | If banking.api.events-unknown's contract changes, which producers, consuming events, called operations, and upstream consumers require review? |
| 301 | sample | clarification_required | answered | pass | If the v5 Current Account API version is retired, which runtime operations, services, routes, callees, databases, events, and consumers are affected? |
| 302 | sample | clarification_required | answered | pass | If request x-mock-response changes, which operations and downstream Runtime paths may be affected? |
| 303 | sample | answered |  | pass | If response 200 for Create Banking Card Cash Withdrawal changes, which operations, APIs, and subscribed consumers are affected? |
| 304 | sample | unsupported |  | pass | If OAuth 2 changes, which operations, consumers, APIs, capabilities, and downstream dependencies are in scope? |
| 305 | sample | answered |  | pass | Which databases, events, and callees lie in the downstream radius of External PII or PCI operations? |
| 306 | sample | unsupported |  | pass | If Bank Sync is removed or compromised, which subscribed operations and API-derived Runtime paths are in scope? |
| 307 | sample | answered |  | pass | If operations-openfinance-app is decommissioned, which operations, shared callees, databases, events, consumers, and capabilities are affected? |
| 308 | sample | clarification_required |  | pass | If Account Reconciliation is retired, which services and shared Runtime resources are exclusively or jointly associated with it? |
| 309 | sample | clarification_required | answered | pass | Which team's owned capabilities have the broadest Runtime blast radius by unique operations, services, databases, events, APIs, and consumers? |
| 310 | sample | clarification_required | answered | pass | If the v1 Identity and API Security Services API version is retired, which runtime operations, services, routes, callees, databases, events, and consumers are affected? |
| 311 | sample | answered |  | pass | Which dependency roots have the greatest callCount-weighted structural scope under an explicitly stated aggregation rule? |
| 312 | sample | no_evidence |  | pass | Which error-bearing routes have the greatest reverse consumer and business blast radius? |
| 313 | sample | answered |  | pass | Which stale dependencies have a broad blast radius if they remain active despite an old lastSeen value? |
| 314 | sample | unsupported |  | pass | Which cycles and self-loops could amplify or confuse an unbounded impact traversal? |
| 315 | sample | unsupported |  | pass | Which two or more failed databases, events, services, or operations affect the largest overlapping dependent set? |
| 316 | sample | unsupported |  | pass | Which dependencies look like structural single points of failure because they have high reverse fan-in and no alternate path represented? |
| 317 | sample | answered |  | pass | How does the radius change when duplicate gateway and microservice representations of one logical operation are collapsed? |
| 318 | sample | clarification_required |  | pass | What blast-radius calculations omit or terminate at the isolated operation and telemetry-only operation? |
| 319 | sample | clarification_required |  | pass | What is the blast radius of all database or event nodes whose host is unknown, and which impacts cannot be assigned to concrete infrastructure? |
| 320 | sample | clarification_required |  | pass | Which affected nodes are direct, which are transitive, and which are business/API context rollups only? |
| 321 | template-filled | answered |  | pass | Which business areas, business domains, service domains, business capabilities, and teams exist? |
| 322 | template-filled | answered |  | pass | How many nodes of each Business-layer type exist? |
| 323 | template-filled | answered |  | pass | Which Business-layer nodes match banking? |
| 324 | template-filled | answered |  | pass | Which Business-layer nodes match banking? |
| 325 | template-unfilled | clarification_required |  | pass | Which Business-layer nodes match {name_or_text}? |
| 326 | template-filled | answered |  | pass | What are the id, name, type, and direct relationships of Accounts and Deposits? |
| 327 | template-filled | answered |  | pass | What are the id, name, type, and direct relationships of Customer Platforms Team? |
| 328 | template-unfilled | clarification_required |  | pass | What are the id, name, type, and direct relationships of {business_area_or_domain_or_capability_or_team}? |
| 329 | template-filled | answered |  | pass | Which business domains belong to more than one business area? |
| 330 | template-filled | no_evidence |  | pass | Which service domains have no parent business domain, or more than one parent? |
| 331 | template-filled | answered |  | pass | Which business capabilities have no parent service domain, or more than one parent? |
| 332 | template-filled | answered |  | pass | Which business capabilities have no owning team, exactly one owner, or multiple owning teams? |
| 333 | template-filled | no_evidence |  | pass | Which teams own no capabilities? |
| 334 | template-filled | answered |  | pass | Which capabilities have no implementing application? |
| 335 | template-filled | unsupported |  | pass | Which applications implement no business capability? |
| 336 | template-filled | unsupported |  | pass | What percentage of each business hierarchy level is linked to its expected parent and child types? |
| 337 | template-filled | unsupported |  | pass | Which Business-layer nodes are orphaned or disconnected from the API and Runtime estate? |
| 338 | template-filled | clarification_required |  | pass | Where do names repeat across business areas, domains, service domains, capabilities, or teams? |
| 339 | template-filled | answered |  | pass | Which business domains does Accounts and Deposits contain? |
| 340 | template-filled | answered |  | pass | Which business domains does Operations and Execution contain? |
| 341 | template-unfilled | clarification_required |  | pass | Which business domains does {business_area} contain? |
| 342 | template-filled | answered |  | pass | How many business domains does each business area contain? |
| 343 | template-filled | unsupported |  | pass | Which business area has the broadest directly contained domain portfolio? |
| 344 | template-filled | answered |  | pass | Which service domains does Channel Specific contain? |
| 345 | template-filled | answered |  | pass | Which service domains does Payments contain? |
| 346 | template-unfilled | clarification_required |  | pass | Which service domains does {business_domain} contain? |
| 347 | template-filled | answered |  | pass | How many service domains does each business domain contain? |
| 348 | template-filled | unsupported |  | pass | Which business domains share or overlap in service-domain membership? |
| 349 | template-filled | answered |  | pass | Which business capabilities does Open Banking Access Services contain? |
| 350 | template-filled | answered |  | pass | Which business capabilities does Digital and Assisted Channel Services contain? |
| 351 | template-unfilled | clarification_required |  | pass | Which business capabilities does {service_domain} contain? |
| 352 | template-filled | answered |  | pass | How many capabilities does each service domain contain? |
| 353 | template-filled | clarification_required |  | pass | Which service domains contain multiple capabilities, and which contain only one? |
| 354 | template-filled | answered |  | pass | Which business capabilities does Customer Platforms Team own? |
| 355 | template-filled | answered |  | pass | Which business capabilities does Data Science & Analytics Platform Team own? |
| 356 | template-unfilled | clarification_required |  | pass | Which business capabilities does {team} own? |
| 357 | template-filled | answered |  | pass | How many capabilities does each team own? |
| 358 | template-filled | unsupported |  | pass | Which teams have overlapping ownership of the same capability? |
| 359 | template-filled | answered |  | pass | Which business capabilities does payments-app implement? |
| 360 | template-filled | answered |  | pass | Which business capabilities does customer-channel-app implement? |
| 361 | template-unfilled | clarification_required |  | pass | Which business capabilities does {application} implement? |
| 362 | template-filled | answered |  | pass | How many capabilities does each application implement? |
| 363 | template-filled | unsupported |  | pass | Which applications span multiple service domains, business domains, or business areas through the capabilities they implement? |
| 364 | template-filled | answered |  | pass | Which APIs does payments-app expose? |
| 365 | template-filled | answered |  | pass | Which APIs does customer-channel-app expose? |
| 366 | template-unfilled | clarification_required |  | pass | Which APIs does {application} expose? |
| 367 | template-filled | answered |  | pass | How many APIs does each application expose? |
| 368 | template-filled | answered |  | pass | Which APIs are exposed by more than one application? |
| 369 | template-filled | answered |  | pass | Which business area or areas contain Channel Specific? |
| 370 | template-filled | answered |  | pass | Which business area or areas contain Payments? |
| 371 | template-unfilled | clarification_required |  | pass | Which business area or areas contain {business_domain}? |
| 372 | template-filled | answered |  | pass | Does Channel Specific have one parent area, multiple parent areas, or no parent? |
| 373 | template-filled | answered |  | pass | Does Payments have one parent area, multiple parent areas, or no parent? |
| 374 | template-unfilled | clarification_required |  | pass | Does {business_domain} have one parent area, multiple parent areas, or no parent? |
| 375 | template-filled | answered |  | pass | Which business domain contains Open Banking Access Services? |
| 376 | template-filled | answered |  | pass | Which business domain contains Digital and Assisted Channel Services? |
| 377 | template-unfilled | clarification_required |  | pass | Which business domain contains {service_domain}? |
| 378 | template-filled | unsupported |  | pass | Which service domains are referenced by multiple business domains? |
| 379 | template-filled | answered |  | pass | Which service domain or domains contain Manage customer billing? |
| 380 | template-filled | answered |  | pass | Which service domain or domains contain Manage card service cases? |
| 381 | template-unfilled | clarification_required |  | pass | Which service domain or domains contain {business_capability}? |
| 382 | template-filled | unsupported |  | pass | Which capabilities cross service-domain boundaries? |
| 383 | template-filled | answered |  | pass | Which team or teams own Manage customer billing? |
| 384 | template-filled | answered |  | pass | Which team or teams own Manage card service cases? |
| 385 | template-unfilled | clarification_required |  | pass | Which team or teams own {business_capability}? |
| 386 | template-filled | answered |  | pass | Which capabilities have shared ownership, and who are all the owners? |
| 387 | template-filled | answered |  | pass | Which applications implement Manage customer billing? |
| 388 | template-filled | answered |  | pass | Which applications implement Manage card service cases? |
| 389 | template-unfilled | clarification_required |  | pass | Which applications implement {business_capability}? |
| 390 | template-filled | answered |  | pass | Which capabilities are implemented by multiple applications? |
| 391 | template-filled | answered |  | pass | Which capability has the largest application implementation footprint? |
| 392 | template-filled | answered |  | pass | Which application or applications expose Mortgage Loan API? |
| 393 | template-filled | answered |  | pass | Which application or applications expose Mortgage Loan API? |
| 394 | template-unfilled | clarification_required |  | pass | Which application or applications expose {api}? |
| 395 | template-filled | answered |  | pass | Which APIs have multiple exposing applications? |
| 396 | template-filled | answered |  | pass | What is the complete capability, application, API, endpoint, and operation estate under Accounts and Deposits? |
| 397 | template-filled | answered |  | pass | What is the complete capability, application, API, endpoint, and operation estate under Operations and Execution? |
| 398 | template-unfilled | clarification_required |  | pass | What is the complete capability, application, API, endpoint, and operation estate under {business_area}? |
| 399 | template-filled | answered |  | pass | What is the complete technology estate under Channel Specific, including applications, APIs, deployments, databases, and events? |
| 400 | template-filled | answered |  | pass | What is the complete technology estate under Payments, including applications, APIs, deployments, databases, and events? |
| 401 | template-unfilled | clarification_required |  | pass | What is the complete technology estate under {business_domain}, including applications, APIs, deployments, databases, and events? |
| 402 | template-filled | clarification_required |  | pass | Which applications implement capabilities in Open Banking Access Services, and which APIs, versions, endpoints, and operations are associated through those applications? |
| 403 | template-filled | clarification_required |  | pass | Which applications implement capabilities in Digital and Assisted Channel Services, and which APIs, versions, endpoints, and operations are associated through those applications? |
| 404 | template-unfilled | clarification_required |  | pass | Which applications implement capabilities in {service_domain}, and which APIs, versions, endpoints, and operations are associated through those applications? |
| 405 | template-filled | answered |  | pass | Which APIs and operations are associated with Manage customer billing through its implementing applications? |
| 406 | template-filled | answered |  | pass | Which APIs and operations are associated with Manage card service cases through its implementing applications? |
| 407 | template-unfilled | clarification_required |  | pass | Which APIs and operations are associated with {business_capability} through its implementing applications? |
| 408 | template-filled | answered |  | pass | Which APIs and operations are associated with capabilities owned by Customer Platforms Team? |
| 409 | template-filled | answered |  | pass | Which APIs and operations are associated with capabilities owned by Data Science & Analytics Platform Team? |
| 410 | template-unfilled | clarification_required |  | pass | Which APIs and operations are associated with capabilities owned by {team}? |
| 411 | template-filled | clarification_required |  | pass | Which consumers subscribe to APIs or operations associated with Accounts and Deposits through exposing applications? |
| 412 | template-filled | clarification_required |  | pass | Which consumers subscribe to APIs or operations associated with Customer Platforms Team through exposing applications? |
| 413 | template-unfilled | clarification_required |  | pass | Which consumers subscribe to APIs or operations associated with {business_area_or_domain_or_capability_or_team} through exposing applications? |
| 414 | template-filled | clarification_required |  | pass | Which GATEWAY, MICROSERVICE, or WORKFLOW category nodes are linked by DEPLOYED-TO from operations associated with Manage customer billing? |
| 415 | template-filled | clarification_required |  | pass | Which GATEWAY, MICROSERVICE, or WORKFLOW category nodes are linked by DEPLOYED-TO from operations associated with Manage card service cases? |
| 416 | template-unfilled | clarification_required |  | pass | Which GATEWAY, MICROSERVICE, or WORKFLOW category nodes are linked by DEPLOYED-TO from operations associated with {business_capability}? |
| 417 | template-filled | clarification_required |  | pass | Which databases are read, connected to, written, or updated by operations associated with Manage customer billing through its implementing applications? |
| 418 | template-filled | clarification_required |  | pass | Which databases are read, connected to, written, or updated by operations associated with Manage card service cases through its implementing applications? |
| 419 | template-unfilled | clarification_required |  | pass | Which databases are read, connected to, written, or updated by operations associated with {business_capability} through its implementing applications? |
| 420 | template-filled | clarification_required |  | pass | Which events are produced by operations associated with Manage customer billing through its implementing applications? |
| 421 | template-filled | clarification_required |  | pass | Which events are produced by operations associated with Manage card service cases through its implementing applications? |
| 422 | template-unfilled | clarification_required |  | pass | Which events are produced by operations associated with {business_capability} through its implementing applications? |
| 423 | template-filled | clarification_required |  | pass | Which downstream operations are called or routed to by operations associated with Accounts and Deposits? |
| 424 | template-filled | clarification_required |  | pass | Which downstream operations are called or routed to by operations associated with Operations and Execution? |
| 425 | template-unfilled | clarification_required |  | pass | Which downstream operations are called or routed to by operations associated with {business_area}? |
| 426 | template-filled | clarification_required |  | pass | Which HTTP methods are used by operations associated with Open Banking Access Services? |
| 427 | template-filled | clarification_required |  | pass | Which HTTP methods are used by operations associated with Digital and Assisted Channel Services? |
| 428 | template-unfilled | clarification_required |  | pass | Which HTTP methods are used by operations associated with {service_domain}? |
| 429 | template-filled | clarification_required |  | pass | Which request headers, parameters, schemas, and fields occur in APIs associated with Manage customer billing? |
| 430 | template-filled | clarification_required |  | pass | Which request headers, parameters, schemas, and fields occur in APIs associated with Manage card service cases? |
| 431 | template-unfilled | clarification_required |  | pass | Which request headers, parameters, schemas, and fields occur in APIs associated with {business_capability}? |
| 432 | template-filled | clarification_required |  | pass | Which response status codes, headers, schemas, and fields occur in APIs associated with Channel Specific? |
| 433 | template-filled | clarification_required |  | pass | Which response status codes, headers, schemas, and fields occur in APIs associated with Payments? |
| 434 | template-unfilled | clarification_required |  | pass | Which response status codes, headers, schemas, and fields occur in APIs associated with {business_domain}? |
| 435 | template-filled | answered |  | pass | Which operations associated with Accounts and Deposits are External, Internal, or Partner exposed? |
| 436 | template-filled | answered |  | pass | Which operations associated with Operations and Execution are External, Internal, or Partner exposed? |
| 437 | template-unfilled | clarification_required |  | pass | Which operations associated with {business_area} are External, Internal, or Partner exposed? |
| 438 | template-filled | answered |  | pass | Which operations associated with Accounts and Deposits are classified as PII or PCI? |
| 439 | template-filled | answered |  | pass | Which operations associated with Customer Platforms Team are classified as PII or PCI? |
| 440 | template-unfilled | clarification_required |  | pass | Which operations associated with {business_area_or_domain_or_capability_or_team} are classified as PII or PCI? |
| 441 | template-filled | clarification_required |  | pass | Which security controls are implemented by operations associated with Manage customer billing? |
| 442 | template-filled | clarification_required |  | pass | Which security controls are implemented by operations associated with Manage card service cases? |
| 443 | template-unfilled | clarification_required |  | pass | Which security controls are implemented by operations associated with {business_capability}? |
| 444 | template-filled | clarification_required |  | pass | Which externally exposed PII or PCI operations are associated with capabilities owned by Customer Platforms Team? |
| 445 | template-filled | clarification_required |  | pass | Which externally exposed PII or PCI operations are associated with capabilities owned by Data Science & Analytics Platform Team? |
| 446 | template-unfilled | clarification_required |  | pass | Which externally exposed PII or PCI operations are associated with capabilities owned by {team}? |
| 447 | template-filled | unsupported |  | pass | Which business areas have the largest conservative application-level counts of associated APIs, operations, consumers, databases, or events? |
| 448 | template-filled | clarification_required |  | pass | Which capabilities have application-level associated operation sets that share a database, event, deployment category, or downstream operation? |
| 449 | template-filled | clarification_required |  | pass | Which teams own capabilities whose application-level associated operation sets share a runtime dependency? |
| 450 | template-filled | clarification_required |  | pass | Where does a business hierarchy branch into multiple applications and later converge on the same API or database? |
| 451 | template-filled | answered |  | pass | What is the shortest evidence path from Accounts and Deposits to banking_demo-postgres? |
| 452 | template-filled | answered |  | pass | What is the shortest evidence path from Customer Platforms Team to Mortgage Loan API? |
| 453 | template-unfilled | clarification_required |  | pass | What is the shortest evidence path from {business_area_or_capability_or_team} to {api_or_operation_or_database_or_event}? |
| 454 | template-filled | clarification_required |  | pass | Which business capabilities are implemented by payments-app, and which service domains, business domains, and business areas contain them? |
| 455 | template-filled | clarification_required |  | pass | Which business capabilities are implemented by customer-channel-app, and which service domains, business domains, and business areas contain them? |
| 456 | template-unfilled | clarification_required |  | pass | Which business capabilities are implemented by {application}, and which service domains, business domains, and business areas contain them? |
| 457 | template-filled | answered |  | pass | Which teams own capabilities implemented by payments-app? |
| 458 | template-filled | answered |  | pass | Which teams own capabilities implemented by customer-channel-app? |
| 459 | template-unfilled | clarification_required |  | pass | Which teams own capabilities implemented by {application}? |
| 460 | template-filled | clarification_required |  | pass | Which capabilities and capability-owning teams are associated with Mortgage Loan API through its exposing applications? |
| 461 | template-filled | clarification_required |  | pass | Which capabilities and capability-owning teams are associated with Mortgage Loan API through its exposing applications? |
| 462 | template-unfilled | clarification_required |  | pass | Which capabilities and capability-owning teams are associated with {api} through its exposing applications? |
| 463 | template-filled | unsupported |  | pass | Which business hierarchy and capability-owning teams are associated upstream of List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 464 | template-filled | unsupported |  | pass | Which business hierarchy and capability-owning teams are associated upstream of Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 465 | template-unfilled | clarification_required |  | pass | Which business hierarchy and capability-owning teams are associated upstream of {api_version_or_endpoint_or_operation}? |
| 466 | template-filled | answered |  | pass | Which business capabilities are associated with Open Finance Gateway's subscribed APIs or operations through their exposing applications? |
| 467 | template-filled | answered |  | pass | Which business capabilities are associated with Loan Bridge's subscribed APIs or operations through their exposing applications? |
| 468 | template-unfilled | clarification_required |  | pass | Which business capabilities are associated with {consumer}'s subscribed APIs or operations through their exposing applications? |
| 469 | template-filled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations linked to MICROSERVICE by DEPLOYED-TO? |
| 470 | template-filled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations linked to GATEWAY by DEPLOYED-TO? |
| 471 | template-unfilled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations linked to {gateway_or_microservice_or_workflow} by DEPLOYED-TO? |
| 472 | template-filled | clarification_required |  | pass | Which business capabilities, capability-owning teams, and areas are associated with operations that use banking_demo-postgres? |
| 473 | template-filled | clarification_required |  | pass | Which business capabilities, capability-owning teams, and areas are associated with operations that use redis-redis? |
| 474 | template-unfilled | clarification_required |  | pass | Which business capabilities, capability-owning teams, and areas are associated with operations that use {database}? |
| 475 | template-filled | clarification_required |  | pass | Which business capabilities, capability-owning teams, and areas are associated with operations that produce or are called by banking.api.events-unknown? |
| 476 | template-filled | clarification_required |  | pass | Which business capabilities, capability-owning teams, and areas are associated with operations that produce or are called by banking.workflow.commands-unknown? |
| 477 | template-unfilled | clarification_required |  | pass | Which business capabilities, capability-owning teams, and areas are associated with operations that produce or are called by {event}? |
| 478 | template-filled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations that call or route to List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 479 | template-filled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations that call or route to Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 480 | template-unfilled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations that call or route to {operation}? |
| 481 | template-filled | clarification_required |  | pass | Which business areas are associated with operations that read from banking_demo-postgres? |
| 482 | template-filled | clarification_required |  | pass | Which business areas are associated with operations that read from redis-redis? |
| 483 | template-unfilled | clarification_required |  | pass | Which business areas are associated with operations that read from {database}? |
| 484 | template-filled | clarification_required |  | pass | Which business areas are associated with operations that write or update banking_demo-postgres? |
| 485 | template-filled | clarification_required |  | pass | Which business areas are associated with operations that write or update redis-redis? |
| 486 | template-unfilled | clarification_required |  | pass | Which business areas are associated with operations that write or update {database}? |
| 487 | template-filled | clarification_required |  | pass | Which teams own capabilities whose application-level associated operations produce banking.api.events-unknown? |
| 488 | template-filled | clarification_required |  | pass | Which teams own capabilities whose application-level associated operations produce banking.workflow.commands-unknown? |
| 489 | template-unfilled | clarification_required |  | pass | Which teams own capabilities whose application-level associated operations produce {event}? |
| 490 | template-filled | clarification_required |  | pass | Which capabilities are associated through implementing applications with APIs that expose institution? |
| 491 | template-filled | clarification_required |  | pass | Which capabilities are associated through implementing applications with APIs that expose GetAggregationCustomerTransactionByTransactionIdResponse_200? |
| 492 | template-unfilled | clarification_required |  | pass | Which capabilities are associated through implementing applications with APIs that expose {field_or_schema_or_header_or_parameter_or_status_code}? |
| 493 | template-filled | clarification_required |  | pass | Which business areas are associated through applications with operations classified as PII? |
| 494 | template-filled | clarification_required |  | pass | Which business areas are associated through applications with operations classified as PCI? |
| 495 | template-unfilled | clarification_required |  | pass | Which business areas are associated through applications with operations classified as {classification}? |
| 496 | template-filled | clarification_required |  | pass | Which teams own capabilities associated through applications with External operations governed by OAuth 2? |
| 497 | template-filled | clarification_required |  | pass | Which teams own capabilities associated through applications with External operations governed by OAuth 2? |
| 498 | template-unfilled | clarification_required |  | pass | Which teams own capabilities associated through applications with External operations governed by {security_control}? |
| 499 | template-filled | no_evidence |  | pass | What is the shortest evidence path from banking_demo-postgres back to Accounts and Deposits? |
| 500 | template-filled | answered |  | pass | What is the shortest evidence path from redis-redis back to Customer Platforms Team? |
| 501 | template-unfilled | clarification_required |  | pass | What is the shortest evidence path from {database_or_event_or_field} back to {team_or_capability_or_business_area}? |
| 502 | template-filled | unsupported |  | pass | How many distinct business areas, domains, capabilities, teams, applications, and APIs converge on banking_demo-postgres? |
| 503 | template-filled | unsupported |  | pass | How many distinct business areas, domains, capabilities, teams, applications, and APIs converge on redis-redis? |
| 504 | template-unfilled | clarification_required |  | pass | How many distinct business areas, domains, capabilities, teams, applications, and APIs converge on {database_or_event}? |
| 505 | template-filled | unsupported |  | pass | Which low-level dependencies have the widest associated business-context rollup? |
| 506 | template-filled | answered |  | pass | What current hierarchy and application-level technology estate falls into review scope if Accounts and Deposits is reorganized or retired? |
| 507 | template-filled | answered |  | pass | What current hierarchy and application-level technology estate falls into review scope if Operations and Execution is reorganized or retired? |
| 508 | template-unfilled | clarification_required |  | pass | What current hierarchy and application-level technology estate falls into review scope if {business_area} is reorganized or retired? |
| 509 | template-filled | unsupported |  | pass | Which domains, service domains, capabilities, teams, applications, APIs, operations, consumers, deployments, databases, and events fall under Accounts and Deposits's change scope? |
| 510 | template-filled | unsupported |  | pass | Which domains, service domains, capabilities, teams, applications, APIs, operations, consumers, deployments, databases, and events fall under Operations and Execution's change scope? |
| 511 | template-unfilled | clarification_required |  | pass | Which domains, service domains, capabilities, teams, applications, APIs, operations, consumers, deployments, databases, and events fall under {business_area}'s change scope? |
| 512 | template-filled | clarification_required |  | pass | Which current parent paths, descendants, owners, implementers, and application-level technology associations fall into structural review scope before moving Channel Specific? |
| 513 | template-filled | clarification_required |  | pass | Which current parent paths, descendants, owners, implementers, and application-level technology associations fall into structural review scope before moving Payments? |
| 514 | template-unfilled | clarification_required |  | pass | Which current parent paths, descendants, owners, implementers, and application-level technology associations fall into structural review scope before moving {business_domain}? |
| 515 | template-filled | clarification_required |  | pass | Which current parents, descendant capabilities, owners, implementers, and application-level technology associations fall into structural review scope before splitting or merging Open Banking Access Services? |
| 516 | template-filled | clarification_required |  | pass | Which current parents, descendant capabilities, owners, implementers, and application-level technology associations fall into structural review scope before splitting or merging Digital and Assisted Channel Services? |
| 517 | template-unfilled | clarification_required |  | pass | Which current parents, descendant capabilities, owners, implementers, and application-level technology associations fall into structural review scope before splitting or merging {service_domain}? |
| 518 | template-filled | unsupported |  | pass | What is affected if Manage customer billing is renamed, redefined, consolidated, or retired? |
| 519 | template-filled | unsupported |  | pass | What is affected if Manage card service cases is renamed, redefined, consolidated, or retired? |
| 520 | template-unfilled | clarification_required |  | pass | What is affected if {business_capability} is renamed, redefined, consolidated, or retired? |
| 521 | template-filled | unsupported |  | pass | Which implementing applications and their exposed APIs fall into conservative portfolio-review scope if Manage customer billing changes? |
| 522 | template-filled | unsupported |  | pass | Which implementing applications and their exposed APIs fall into conservative portfolio-review scope if Manage card service cases changes? |
| 523 | template-unfilled | clarification_required |  | pass | Which implementing applications and their exposed APIs fall into conservative portfolio-review scope if {business_capability} changes? |
| 524 | template-filled | clarification_required |  | pass | Which API consumers and runtime dependencies are conservatively associated through applications with a change to Manage customer billing? |
| 525 | template-filled | clarification_required |  | pass | Which API consumers and runtime dependencies are conservatively associated through applications with a change to Manage card service cases? |
| 526 | template-unfilled | clarification_required |  | pass | Which API consumers and runtime dependencies are conservatively associated through applications with a change to {business_capability}? |
| 527 | template-filled | answered |  | pass | Which currently owned capabilities and application-level technology associations enter review scope if Customer Platforms Team gives up ownership of Manage customer billing? |
| 528 | template-filled | answered |  | pass | Which currently owned capabilities and application-level technology associations enter review scope if Data Science & Analytics Platform Team gives up ownership of Manage card service cases? |
| 529 | template-unfilled | clarification_required |  | pass | Which currently owned capabilities and application-level technology associations enter review scope if {team} gives up ownership of {business_capability}? |
| 530 | template-filled | unsupported |  | pass | Which capabilities become ownerless if Customer Platforms Team is removed? |
| 531 | template-filled | unsupported |  | pass | Which capabilities become ownerless if Data Science & Analytics Platform Team is removed? |
| 532 | template-unfilled | clarification_required |  | pass | Which capabilities become ownerless if {team} is removed? |
| 533 | template-filled | clarification_required |  | pass | Which multi-parent descendants and shared implementing applications show that a proposed business-area split may not be structurally isolated? |
| 534 | template-filled | unsupported |  | pass | Which shared applications and their associated APIs, databases, or events extend conservative review scope beyond Channel Specific? |
| 535 | template-filled | unsupported |  | pass | Which shared applications and their associated APIs, databases, or events extend conservative review scope beyond Payments? |
| 536 | template-unfilled | clarification_required |  | pass | Which shared applications and their associated APIs, databases, or events extend conservative review scope beyond {business_domain}? |
| 537 | template-filled | no_evidence |  | pass | Which externally exposed, PII, or PCI operations fall inside the change radius of Accounts and Deposits? |
| 538 | template-filled | no_evidence |  | pass | Which externally exposed, PII, or PCI operations fall inside the change radius of Customer Platforms Team? |
| 539 | template-unfilled | clarification_required |  | pass | Which externally exposed, PII, or PCI operations fall inside the change radius of {business_area_or_capability_or_team}? |
| 540 | template-filled | answered |  | pass | Which business areas, domains, capabilities, and capability-owning teams appear in the reverse business-context rollup of payments-app? |
| 541 | template-filled | answered |  | pass | Which business areas, domains, capabilities, and capability-owning teams appear in the reverse business-context rollup of Mortgage Loan API? |
| 542 | template-unfilled | clarification_required |  | pass | Which business areas, domains, capabilities, and capability-owning teams appear in the reverse business-context rollup of {application_or_api_or_operation}? |
| 543 | template-filled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations in the reverse outage radius of banking_demo-postgres? |
| 544 | template-filled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations in the reverse outage radius of redis-redis? |
| 545 | template-unfilled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations in the reverse outage radius of {database}? |
| 546 | template-filled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations in the reverse outage radius of banking.api.events-unknown? |
| 547 | template-filled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations in the reverse outage radius of banking.workflow.commands-unknown? |
| 548 | template-unfilled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated with operations in the reverse outage radius of {event}? |
| 549 | template-filled | answered |  | pass | For operations linked by DEPLOYED-TO to MICROSERVICE, which capability-owning teams appear in the reverse business-context rollup? |
| 550 | template-filled | unsupported |  | pass | For operations linked by DEPLOYED-TO to GATEWAY, which capability-owning teams appear in the reverse business-context rollup? |
| 551 | template-unfilled | clarification_required |  | pass | For operations linked by DEPLOYED-TO to {gateway_or_microservice_or_workflow}, which capability-owning teams appear in the reverse business-context rollup? |
| 552 | template-filled | answered |  | pass | Which business areas appear in the reverse context rollup of a contract change to Mortgage Loan API? |
| 553 | template-filled | answered |  | pass | Which business areas appear in the reverse context rollup of a contract change to Mortgage Loan API? |
| 554 | template-unfilled | clarification_required |  | pass | Which business areas appear in the reverse context rollup of a contract change to {api_or_endpoint_or_schema_or_field}? |
| 555 | template-filled | clarification_required | answered | pass | Which capabilities and capability-owning teams appear in the context rollup if v1 is deprecated? |
| 556 | template-filled | clarification_required | answered | pass | Which capabilities and capability-owning teams appear in the context rollup if v5 is deprecated? |
| 557 | template-unfilled | clarification_required |  | pass | Which capabilities and capability-owning teams appear in the context rollup if {api_version} is deprecated? |
| 558 | template-filled | clarification_required | answered | pass | Which business capabilities are associated with operations governed by OAuth 2? |
| 559 | template-filled | no_match |  | pass | Which business capabilities are associated with operations governed by External? |
| 560 | template-unfilled | clarification_required |  | pass | Which business capabilities are associated with operations governed by {security_control_or_classification_or_exposure}? |
| 561 | template-filled | no_match |  | pass | Which business areas are associated with operations in the reverse data-change radius of banking_demo-postgres? |
| 562 | template-filled | no_match |  | pass | Which business areas are associated with operations in the reverse data-change radius of redis-redis? |
| 563 | template-unfilled | clarification_required |  | pass | Which business areas are associated with operations in the reverse data-change radius of {database_or_event}? |
| 564 | template-filled | answered |  | pass | Which business capabilities are associated with operations in the reverse change radius of routing or call changes to List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 565 | template-filled | answered |  | pass | Which business capabilities are associated with operations in the reverse change radius of routing or call changes to Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 566 | template-unfilled | clarification_required |  | pass | Which business capabilities are associated with operations in the reverse change radius of routing or call changes to {operation}? |
| 567 | template-filled | unsupported |  | pass | Which technical root node has the widest reverse-mapped business-context rollup? |
| 568 | template-filled | clarification_required | no_evidence | pass | How do business areas rank by the number of distinct applications, APIs, operations, consumers, deployments, databases, and events in their blast radius? |
| 569 | template-filled | clarification_required | no_evidence | pass | How do capabilities rank by the number of dependent consumers and shared runtime resources in their blast radius? |
| 570 | template-filled | answered |  | pass | Which teams have the largest cross-domain or cross-area change blast radius? |
| 571 | template-filled | clarification_required |  | pass | Which capabilities have exactly one implementing application, and what application-level runtime resources are associated with it? |
| 572 | template-filled | clarification_required |  | pass | Which capabilities have multiple implementing applications, and how many distinct application-level runtime paths are associated with them? |
| 573 | template-filled | unsupported |  | pass | What is the overlap between the blast radii of BUSINESS-AREA:accounts-and-deposits, TEAMS:customer-platforms-team? |
| 574 | template-filled | unsupported |  | pass | What is the overlap between the blast radii of TEAMS:customer-platforms-team, TEAMS:data-science-analytics-platform-team? |
| 575 | template-unfilled | clarification_required |  | pass | What is the overlap between the blast radii of {business_node_set}? |
| 576 | template-filled | unsupported |  | pass | What are the union, intersection, and root-specific remainders of the structural scopes of BUSINESS-AREA:accounts-and-deposits, TEAMS:customer-platforms-team? |
| 577 | template-filled | unsupported |  | pass | What are the union, intersection, and root-specific remainders of the structural scopes of TEAMS:customer-platforms-team, TEAMS:data-science-analytics-platform-team? |
| 578 | template-unfilled | clarification_required |  | pass | What are the union, intersection, and root-specific remainders of the structural scopes of {business_node_set}? |
| 579 | template-filled | no_evidence |  | pass | How does the direct impact differ from the transitive impact for Accounts and Deposits? |
| 580 | template-filled | answered |  | pass | How does the direct impact differ from the transitive impact for Customer Platforms Team? |
| 581 | template-unfilled | clarification_required |  | pass | How does the direct impact differ from the transitive impact for {business_area_or_capability_or_team}? |
| 582 | template-filled | unsupported |  | pass | Which impact paths cross Business, API, and Runtime layer boundaries, and at which edge does each crossing occur? |
| 583 | template-filled | clarification_required |  | pass | Which nodes are reached by the selected propagation-edge policy versus included only as contextual rollups? |
| 584 | template-filled | answered |  | pass | Which applications, APIs, API versions, endpoints, operations, and consumers exist? |
| 585 | template-filled | answered |  | pass | How many nodes of each API-layer type exist? |
| 586 | template-filled | answered |  | pass | Which APIs, endpoints, operations, schemas, fields, headers, or parameters match banking? |
| 587 | template-filled | answered |  | pass | Which APIs, endpoints, operations, schemas, fields, headers, or parameters match banking? |
| 588 | template-unfilled | clarification_required |  | pass | Which APIs, endpoints, operations, schemas, fields, headers, or parameters match {name_or_text}? |
| 589 | template-filled | unsupported |  | pass | Which API version names are present, and how many APIs, endpoints, and operations use each version? |
| 590 | template-filled | answered |  | pass | Which operation HTTP methods are present, and how many operations support each method? |
| 591 | template-filled | answered |  | pass | Which exposure values are present, and how many operations are External, Internal, or Partner exposed? |
| 592 | template-filled | clarification_required |  | pass | Which security controls are modeled, and what percentage of operations implements each control? |
| 593 | template-filled | answered |  | pass | How many operations are classified as PII, PCI, both, or neither? |
| 594 | template-filled | clarification_required |  | pass | Which deployment target types exist, and what percentage of operations is deployed to each? |
| 595 | template-filled | unsupported |  | pass | Which APIs, versions, endpoints, or operations have no expected containment parent or child? |
| 596 | template-filled | unsupported |  | pass | Which operations lack a method, security control, exposure, deployment target, request contract, or response status? |
| 597 | template-filled | unsupported |  | pass | Which status-code nodes lack a response schema or response headers? |
| 598 | template-filled | clarification_required |  | pass | Which schemas have no fields, and which fields have no parent schema or field? |
| 599 | template-filled | unsupported |  | pass | Which consumers have no API or operation subscriptions? |
| 600 | template-filled | unsupported |  | pass | Which APIs or operations have no subscribing consumers? |
| 601 | template-filled | clarification_required |  | pass | Which API names occur in several versions or contexts, and what exact node ids disambiguate them? |
| 602 | template-filled | answered |  | pass | Which endpoints contain more than one operation? |
| 603 | template-filled | clarification_required |  | pass | Which operations are not contained by an endpoint? |
| 604 | template-filled | unsupported |  | pass | Which source-type, relationship-type, and target-type signatures are populated in the API subgraph? |
| 605 | template-filled | answered |  | pass | What set of APIs is exposed by payments-app? |
| 606 | template-filled | answered |  | pass | What set of APIs is exposed by customer-channel-app? |
| 607 | template-unfilled | clarification_required |  | pass | What set of APIs is exposed by {application}? |
| 608 | template-filled | clarification_required | answered | pass | Which application exposes the largest API portfolio? |
| 609 | template-filled | answered |  | pass | Which API versions does Mortgage Loan API contain? |
| 610 | template-filled | answered |  | pass | Which API versions does Mortgage Loan API contain? |
| 611 | template-unfilled | clarification_required |  | pass | Which API versions does {api} contain? |
| 612 | template-filled | answered |  | pass | Does Mortgage Loan API contain more than one version node? |
| 613 | template-filled | answered |  | pass | Does Mortgage Loan API contain more than one version node? |
| 614 | template-unfilled | clarification_required |  | pass | Does {api} contain more than one version node? |
| 615 | template-filled | answered |  | pass | Which endpoints does v1 contain? |
| 616 | template-filled | answered |  | pass | Which endpoints does v5 contain? |
| 617 | template-unfilled | clarification_required |  | pass | Which endpoints does {api_version} contain? |
| 618 | template-filled | unsupported |  | pass | How many endpoints are present in each API version? |
| 619 | template-filled | answered |  | pass | Which operations does /v5/banking/accounts/{accountId}/bill-payments contain? |
| 620 | template-filled | answered |  | pass | Which operations does /v5/banking/account-management/fraud-evaluation/evaluations/{evaluationId} contain? |
| 621 | template-unfilled | clarification_required |  | pass | Which operations does {endpoint} contain? |
| 622 | template-filled | unsupported |  | pass | Which endpoint contains multiple concrete or service-specific operations? |
| 623 | template-filled | answered |  | pass | Which HTTP method does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications support? |
| 624 | template-filled | answered |  | pass | Which HTTP method does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id support? |
| 625 | template-unfilled | clarification_required |  | pass | Which HTTP method does {operation} support? |
| 626 | template-filled | clarification_required |  | pass | Does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications's SUPPORTS edge agree with its properties.httpMethod value? |
| 627 | template-filled | clarification_required |  | pass | Does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id's SUPPORTS edge agree with its properties.httpMethod value? |
| 628 | template-unfilled | clarification_required |  | pass | Does {operation}'s SUPPORTS edge agree with its properties.httpMethod value? |
| 629 | template-filled | answered |  | pass | Which security control does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications implement? |
| 630 | template-filled | answered |  | pass | Which security control does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id implement? |
| 631 | template-unfilled | clarification_required |  | pass | Which security control does {operation} implement? |
| 632 | template-filled | no_evidence |  | pass | Which operations implement more than one security control? |
| 633 | template-filled | clarification_required |  | pass | Is List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications classified as PII, PCI, both, or neither? |
| 634 | template-filled | clarification_required |  | pass | Is Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id classified as PII, PCI, both, or neither? |
| 635 | template-unfilled | clarification_required |  | pass | Is {operation} classified as PII, PCI, both, or neither? |
| 636 | template-filled | unsupported |  | pass | Which data-sensitivity classifications apply to List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 637 | template-filled | unsupported |  | pass | Which data-sensitivity classifications apply to Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 638 | template-unfilled | clarification_required |  | pass | Which data-sensitivity classifications apply to {operation}? |
| 639 | template-filled | unsupported |  | pass | What exposure classification applies to List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 640 | template-filled | unsupported |  | pass | What exposure classification applies to Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 641 | template-unfilled | clarification_required |  | pass | What exposure classification applies to {operation}? |
| 642 | template-filled | answered |  | pass | Does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications have more than one exposure classification? |
| 643 | template-filled | no_evidence |  | pass | Does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id have more than one exposure classification? |
| 644 | template-unfilled | clarification_required |  | pass | Does {operation} have more than one exposure classification? |
| 645 | template-filled | clarification_required |  | pass | Where is List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications deployed? |
| 646 | template-filled | clarification_required |  | pass | Where is Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id deployed? |
| 647 | template-unfilled | clarification_required |  | pass | Where is {operation} deployed? |
| 648 | template-filled | clarification_required |  | pass | Is List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications linked to GATEWAY, MICROSERVICE, both populated categories, or neither? |
| 649 | template-filled | clarification_required |  | pass | Is Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id linked to GATEWAY, MICROSERVICE, both populated categories, or neither? |
| 650 | template-unfilled | clarification_required |  | pass | Is {operation} linked to GATEWAY, MICROSERVICE, both populated categories, or neither? |
| 651 | template-filled | clarification_required |  | pass | Does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications's DEPLOYED-TO edge agree with its properties.serviceCategory value? |
| 652 | template-filled | clarification_required |  | pass | Does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id's DEPLOYED-TO edge agree with its properties.serviceCategory value? |
| 653 | template-unfilled | clarification_required |  | pass | Does {operation}'s DEPLOYED-TO edge agree with its properties.serviceCategory value? |
| 654 | template-filled | answered |  | pass | Which request headers does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications accept? |
| 655 | template-filled | answered |  | pass | Which request headers does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id accept? |
| 656 | template-unfilled | clarification_required |  | pass | Which request headers does {operation} accept? |
| 657 | template-filled | answered |  | pass | How many request headers does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications accept? |
| 658 | template-filled | answered |  | pass | How many request headers does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id accept? |
| 659 | template-unfilled | clarification_required |  | pass | How many request headers does {operation} accept? |
| 660 | template-filled | answered |  | pass | Which path parameters does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications accept? |
| 661 | template-filled | answered |  | pass | Which path parameters does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id accept? |
| 662 | template-unfilled | clarification_required |  | pass | Which path parameters does {operation} accept? |
| 663 | template-filled | unsupported |  | pass | Do the accepted path-parameter names correspond to placeholders in List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications's path property? |
| 664 | template-filled | unsupported |  | pass | Do the accepted path-parameter names correspond to placeholders in Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id's path property? |
| 665 | template-unfilled | clarification_required |  | pass | Do the accepted path-parameter names correspond to placeholders in {operation}'s path property? |
| 666 | template-filled | no_evidence |  | pass | Which query parameters does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications accept? |
| 667 | template-filled | no_evidence |  | pass | Which query parameters does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id accept? |
| 668 | template-unfilled | clarification_required |  | pass | Which query parameters does {operation} accept? |
| 669 | template-filled | answered |  | pass | How many query parameters does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications accept? |
| 670 | template-filled | answered |  | pass | How many query parameters does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id accept? |
| 671 | template-unfilled | clarification_required |  | pass | How many query parameters does {operation} accept? |
| 672 | template-filled | answered |  | pass | Which request schema or schemas does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications accept? |
| 673 | template-filled | answered |  | pass | Which request schema or schemas does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id accept? |
| 674 | template-unfilled | clarification_required |  | pass | Which request schema or schemas does {operation} accept? |
| 675 | template-filled | answered |  | pass | Which operations accept more than one request schema? |
| 676 | template-filled | answered |  | pass | Which status codes can List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications return? |
| 677 | template-filled | answered |  | pass | Which status codes can Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id return? |
| 678 | template-unfilled | clarification_required |  | pass | Which status codes can {operation} return? |
| 679 | template-filled | unsupported |  | pass | Which operations return multiple modeled status codes? |
| 680 | template-filled | answered |  | pass | Which response schema does 200 return? |
| 681 | template-filled | answered |  | pass | Which response schema does 200 return? |
| 682 | template-unfilled | clarification_required |  | pass | Which response schema does {status_code} return? |
| 683 | template-filled | answered |  | pass | Which status-code nodes return more than one schema? |
| 684 | template-filled | answered |  | pass | Which response headers does 200 return? |
| 685 | template-filled | answered |  | pass | Which response headers does 200 return? |
| 686 | template-unfilled | clarification_required |  | pass | Which response headers does {status_code} return? |
| 687 | template-filled | clarification_required |  | pass | How many response headers are associated with 200? |
| 688 | template-filled | clarification_required |  | pass | How many response headers are associated with 200? |
| 689 | template-unfilled | clarification_required |  | pass | How many response headers are associated with {status_code}? |
| 690 | template-filled | unsupported |  | pass | Which top-level fields does GetAggregationCustomerTransactionByTransactionIdResponse_200 contain? |
| 691 | template-filled | unsupported |  | pass | Which top-level fields does CreateBankingCustomerPersonalLoanApplicationResponse_201 contain? |
| 692 | template-unfilled | clarification_required |  | pass | Which top-level fields does {schema} contain? |
| 693 | template-filled | clarification_required |  | pass | Which fields of GetAggregationCustomerTransactionByTransactionIdResponse_200 are required, and what are their types and formats? |
| 694 | template-filled | clarification_required |  | pass | Which fields of CreateBankingCustomerPersonalLoanApplicationResponse_201 are required, and what are their types and formats? |
| 695 | template-unfilled | clarification_required |  | pass | Which fields of {schema} are required, and what are their types and formats? |
| 696 | template-filled | unsupported |  | pass | Which nested fields does institution contain? |
| 697 | template-filled | unsupported |  | pass | Which nested fields does items contain? |
| 698 | template-unfilled | clarification_required |  | pass | Which nested fields does {field} contain? |
| 699 | template-filled | answered |  | pass | What is the complete nested field tree beneath institution? |
| 700 | template-filled | unsupported |  | pass | What is the complete nested field tree beneath items? |
| 701 | template-unfilled | clarification_required |  | pass | What is the complete nested field tree beneath {field}? |
| 702 | template-filled | answered |  | pass | Which APIs does Open Finance Gateway subscribe to? |
| 703 | template-filled | answered |  | pass | Which APIs does Loan Bridge subscribe to? |
| 704 | template-unfilled | clarification_required |  | pass | Which APIs does {consumer} subscribe to? |
| 705 | template-filled | answered |  | pass | How many APIs does each consumer subscribe to? |
| 706 | template-filled | answered |  | pass | Which operations does Open Finance Gateway subscribe to? |
| 707 | template-filled | answered |  | pass | Which operations does Loan Bridge subscribe to? |
| 708 | template-unfilled | clarification_required |  | pass | Which operations does {consumer} subscribe to? |
| 709 | template-filled | answered |  | pass | How many operations does each consumer subscribe to? |
| 710 | template-filled | answered |  | pass | Which applications expose Mortgage Loan API? |
| 711 | template-filled | answered |  | pass | Which applications expose Mortgage Loan API? |
| 712 | template-unfilled | clarification_required |  | pass | Which applications expose {api}? |
| 713 | template-filled | unsupported |  | pass | Is Mortgage Loan API shared by multiple applications? |
| 714 | template-filled | unsupported |  | pass | Is Mortgage Loan API shared by multiple applications? |
| 715 | template-unfilled | clarification_required |  | pass | Is {api} shared by multiple applications? |
| 716 | template-filled | answered |  | pass | Which API contains v1? |
| 717 | template-filled | answered |  | pass | Which API contains v5? |
| 718 | template-unfilled | clarification_required |  | pass | Which API contains {api_version}? |
| 719 | template-filled | answered |  | pass | Does v1 have a unique parent API? |
| 720 | template-filled | unsupported |  | pass | Does v5 have a unique parent API? |
| 721 | template-unfilled | clarification_required |  | pass | Does {api_version} have a unique parent API? |
| 722 | template-filled | answered |  | pass | Which API version contains /v5/banking/accounts/{accountId}/bill-payments? |
| 723 | template-filled | answered |  | pass | Which API version contains /v5/banking/account-management/fraud-evaluation/evaluations/{evaluationId}? |
| 724 | template-unfilled | clarification_required |  | pass | Which API version contains {endpoint}? |
| 725 | template-filled | answered |  | pass | Does /v5/banking/accounts/{accountId}/bill-payments have a unique parent version? |
| 726 | template-filled | answered |  | pass | Does /v5/banking/account-management/fraud-evaluation/evaluations/{evaluationId} have a unique parent version? |
| 727 | template-unfilled | clarification_required |  | pass | Does {endpoint} have a unique parent version? |
| 728 | template-filled | answered |  | pass | Which endpoint contains List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 729 | template-filled | answered |  | pass | Which endpoint contains Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 730 | template-unfilled | clarification_required |  | pass | Which endpoint contains {operation}? |
| 731 | template-filled | unsupported |  | pass | Is List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications contained by more than one endpoint? |
| 732 | template-filled | unsupported |  | pass | Is Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id contained by more than one endpoint? |
| 733 | template-unfilled | clarification_required |  | pass | Is {operation} contained by more than one endpoint? |
| 734 | template-filled | answered |  | pass | Which operations support GET? |
| 735 | template-filled | answered |  | pass | Which operations support POST? |
| 736 | template-unfilled | clarification_required |  | pass | Which operations support {http_method}? |
| 737 | template-filled | unsupported |  | pass | Which APIs and applications expose operations supporting GET? |
| 738 | template-filled | unsupported |  | pass | Which APIs and applications expose operations supporting POST? |
| 739 | template-unfilled | clarification_required |  | pass | Which APIs and applications expose operations supporting {http_method}? |
| 740 | template-filled | answered |  | pass | Which operations implement OAuth 2? |
| 741 | template-filled | answered |  | pass | Which operations implement OAuth 2? |
| 742 | template-unfilled | clarification_required |  | pass | Which operations implement {security_control}? |
| 743 | template-filled | clarification_required |  | pass | Which consumers, APIs, and applications are structurally associated with operations implementing OAuth 2? |
| 744 | template-filled | clarification_required |  | pass | Which consumers, APIs, and applications are structurally associated with operations implementing OAuth 2? |
| 745 | template-unfilled | clarification_required |  | pass | Which consumers, APIs, and applications are structurally associated with operations implementing {security_control}? |
| 746 | template-filled | answered |  | pass | Which operations are classified as PII? |
| 747 | template-filled | answered |  | pass | Which operations are classified as PCI? |
| 748 | template-unfilled | clarification_required |  | pass | Which operations are classified as {classification}? |
| 749 | template-filled | unsupported |  | pass | Which APIs, applications, consumers, and business capabilities are in scope for PII? |
| 750 | template-filled | unsupported |  | pass | Which APIs, applications, consumers, and business capabilities are in scope for PCI? |
| 751 | template-unfilled | clarification_required |  | pass | Which APIs, applications, consumers, and business capabilities are in scope for {classification}? |
| 752 | template-filled | answered |  | pass | Which operations have External exposure? |
| 753 | template-filled | answered |  | pass | Which operations have Partner exposure? |
| 754 | template-unfilled | clarification_required |  | pass | Which operations have {exposure} exposure? |
| 755 | template-filled | clarification_required |  | pass | Which APIs and applications contain or expose External operations, and which business capabilities are associated through those applications? |
| 756 | template-filled | clarification_required |  | pass | Which APIs and applications contain or expose Partner operations, and which business capabilities are associated through those applications? |
| 757 | template-unfilled | clarification_required |  | pass | Which APIs and applications contain or expose {exposure} operations, and which business capabilities are associated through those applications? |
| 758 | template-filled | answered |  | pass | Which operations are deployed to MICROSERVICE? |
| 759 | template-filled | answered |  | pass | Which operations are deployed to GATEWAY? |
| 760 | template-unfilled | clarification_required |  | pass | Which operations are deployed to {deployment_target}? |
| 761 | template-filled | no_match |  | pass | Which APIs, applications, consumers, and capabilities are associated with operations linked to MICROSERVICE by DEPLOYED-TO? |
| 762 | template-filled | no_match |  | pass | Which APIs, applications, consumers, and capabilities are associated with operations linked to GATEWAY by DEPLOYED-TO? |
| 763 | template-unfilled | clarification_required |  | pass | Which APIs, applications, consumers, and capabilities are associated with operations linked to {deployment_target} by DEPLOYED-TO? |
| 764 | template-filled | answered |  | pass | Which operations accept x-mock-response as a request header? |
| 765 | template-filled | answered |  | pass | Which operations accept x-mock-response as a request header? |
| 766 | template-unfilled | clarification_required |  | pass | Which operations accept {header} as a request header? |
| 767 | template-filled | unsupported |  | pass | In which APIs and versions is x-mock-response accepted? |
| 768 | template-filled | unsupported |  | pass | In which APIs and versions is x-mock-response accepted? |
| 769 | template-unfilled | clarification_required |  | pass | In which APIs and versions is {header} accepted? |
| 770 | template-filled | no_evidence |  | pass | Which status-code responses return x-mock-response? |
| 771 | template-filled | no_evidence |  | pass | Which status-code responses return x-mock-response? |
| 772 | template-unfilled | clarification_required |  | pass | Which status-code responses return {header}? |
| 773 | template-filled | unsupported |  | pass | Which operations, endpoints, and APIs can return x-mock-response? |
| 774 | template-filled | unsupported |  | pass | Which operations, endpoints, and APIs can return x-mock-response? |
| 775 | template-unfilled | clarification_required |  | pass | Which operations, endpoints, and APIs can return {header}? |
| 776 | template-filled | answered |  | pass | Which operations accept accountId? |
| 777 | template-filled | answered |  | pass | Which operations accept accountId? |
| 778 | template-unfilled | clarification_required |  | pass | Which operations accept {path_parameter}? |
| 779 | template-filled | unsupported |  | pass | Across which paths, versions, and APIs is accountId used? |
| 780 | template-filled | unsupported |  | pass | Across which paths, versions, and APIs is accountId used? |
| 781 | template-unfilled | clarification_required |  | pass | Across which paths, versions, and APIs is {path_parameter} used? |
| 782 | template-filled | answered |  | pass | Which operations accept limit? |
| 783 | template-filled | answered |  | pass | Which operations accept offset? |
| 784 | template-unfilled | clarification_required |  | pass | Which operations accept {query_parameter}? |
| 785 | template-filled | unsupported |  | pass | Across which consumers and APIs is limit used? |
| 786 | template-filled | unsupported |  | pass | Across which consumers and APIs is offset used? |
| 787 | template-unfilled | clarification_required |  | pass | Across which consumers and APIs is {query_parameter} used? |
| 788 | template-filled | no_evidence |  | pass | Which operations accept GetAggregationCustomerTransactionByTransactionIdResponse_200 as a request schema? |
| 789 | template-filled | no_evidence |  | pass | Which operations accept CreateBankingCustomerPersonalLoanApplicationResponse_201 as a request schema? |
| 790 | template-unfilled | clarification_required |  | pass | Which operations accept {schema} as a request schema? |
| 791 | template-filled | clarification_required |  | pass | Which consumers subscribe to operations that accept GetAggregationCustomerTransactionByTransactionIdResponse_200? |
| 792 | template-filled | clarification_required |  | pass | Which consumers subscribe to operations that accept CreateBankingCustomerPersonalLoanApplicationResponse_201? |
| 793 | template-unfilled | clarification_required |  | pass | Which consumers subscribe to operations that accept {schema}? |
| 794 | template-filled | answered |  | pass | Which operations return 200? |
| 795 | template-filled | answered |  | pass | Which operations return 200? |
| 796 | template-unfilled | clarification_required |  | pass | Which operations return {status_code}? |
| 797 | template-filled | unsupported |  | pass | Which APIs and versions expose 200? |
| 798 | template-filled | unsupported |  | pass | Which APIs and versions expose 200? |
| 799 | template-unfilled | clarification_required |  | pass | Which APIs and versions expose {status_code}? |
| 800 | template-filled | answered |  | pass | Which status codes and operations return GetAggregationCustomerTransactionByTransactionIdResponse_200 as a response? |
| 801 | template-filled | answered |  | pass | Which status codes and operations return CreateBankingCustomerPersonalLoanApplicationResponse_201 as a response? |
| 802 | template-unfilled | clarification_required |  | pass | Which status codes and operations return {schema} as a response? |
| 803 | template-filled | clarification_required |  | pass | Which consumers subscribe to operations that return GetAggregationCustomerTransactionByTransactionIdResponse_200? |
| 804 | template-filled | clarification_required |  | pass | Which consumers subscribe to operations that return CreateBankingCustomerPersonalLoanApplicationResponse_201? |
| 805 | template-unfilled | clarification_required |  | pass | Which consumers subscribe to operations that return {schema}? |
| 806 | template-filled | unsupported |  | pass | Which schema or parent field contains institution? |
| 807 | template-filled | unsupported |  | pass | Which schema or parent field contains items? |
| 808 | template-unfilled | clarification_required |  | pass | Which schema or parent field contains {field}? |
| 809 | template-filled | unsupported |  | pass | What are all ancestor fields and the root schema of institution? |
| 810 | template-filled | unsupported |  | pass | What are all ancestor fields and the root schema of items? |
| 811 | template-unfilled | clarification_required |  | pass | What are all ancestor fields and the root schema of {field}? |
| 812 | template-filled | unsupported |  | pass | Which request or response operations expose institution? |
| 813 | template-filled | unsupported |  | pass | Which request or response operations expose items? |
| 814 | template-unfilled | clarification_required |  | pass | Which request or response operations expose {field}? |
| 815 | template-filled | answered |  | pass | Which consumers subscribe to Mortgage Loan API? |
| 816 | template-filled | answered |  | pass | Which consumers subscribe to Mortgage Loan API? |
| 817 | template-unfilled | clarification_required |  | pass | Which consumers subscribe to {api_or_operation}? |
| 818 | template-filled | unsupported |  | pass | How many distinct consumers depend directly on Mortgage Loan API? |
| 819 | template-filled | unsupported |  | pass | How many distinct consumers depend directly on Mortgage Loan API? |
| 820 | template-unfilled | clarification_required |  | pass | How many distinct consumers depend directly on {api_or_operation}? |
| 821 | template-filled | answered |  | pass | What is the complete API tree exposed by payments-app, from API through version, endpoint, and operation? |
| 822 | template-filled | answered |  | pass | What is the complete API tree exposed by customer-channel-app, from API through version, endpoint, and operation? |
| 823 | template-unfilled | clarification_required |  | pass | What is the complete API tree exposed by {application}, from API through version, endpoint, and operation? |
| 824 | template-filled | unsupported |  | pass | What is the complete contract of Mortgage Loan API, including every operation's request and response elements? |
| 825 | template-filled | unsupported |  | pass | What is the complete contract of Mortgage Loan API, including every operation's request and response elements? |
| 826 | template-unfilled | clarification_required |  | pass | What is the complete contract of {api}, including every operation's request and response elements? |
| 827 | template-filled | clarification_required |  | pass | How do the endpoint and operation sets of API-VERSION:GATEWAY-createSecurityOauthToken:POST:/v1/security/oauth-token:v1, API-VERSION:GATEWAY-deleteBankingCardLossReport:DELETE:/v5/banking/cards/{cardId}/loss-reports:v5 compare? |
| 828 | template-filled | clarification_required |  | pass | How do the endpoint and operation sets of API-VERSION:GATEWAY-deleteBankingCardLossReport:DELETE:/v5/banking/cards/{cardId}/loss-reports:v5, API-VERSION:GATEWAY-listSecurityOauthTokens:GET:/v1/security/oauth-token:v1 compare? |
| 829 | template-unfilled | clarification_required |  | pass | How do the endpoint and operation sets of {api_version_set} compare? |
| 830 | template-filled | clarification_required |  | pass | Which endpoints or operations appear in one selected version but not another? |
| 831 | template-filled | answered |  | pass | Which operationIds or paths repeat across gateway and microservice services? |
| 832 | template-filled | clarification_required |  | pass | Which operations have wildcard or concrete identifiers in their ids but templated paths in properties.path? |
| 833 | template-filled | unsupported |  | pass | For /v5/banking/accounts/{accountId}/bill-payments, what are the method, operationId, path, service, service category, security, exposure, sensitivity, and deployment target of every operation? |
| 834 | template-filled | unsupported |  | pass | For /v5/banking/account-management/fraud-evaluation/evaluations/{evaluationId}, what are the method, operationId, path, service, service category, security, exposure, sensitivity, and deployment target of every operation? |
| 835 | template-unfilled | clarification_required |  | pass | For {endpoint}, what are the method, operationId, path, service, service category, security, exposure, sensitivity, and deployment target of every operation? |
| 836 | template-filled | answered |  | pass | What request headers, path parameters, query parameters, request schemas, and nested fields does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications accept? |
| 837 | template-filled | answered |  | pass | What request headers, path parameters, query parameters, request schemas, and nested fields does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id accept? |
| 838 | template-unfilled | clarification_required |  | pass | What request headers, path parameters, query parameters, request schemas, and nested fields does {operation} accept? |
| 839 | template-filled | answered |  | pass | What status codes, response headers, response schemas, and nested fields can List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications return? |
| 840 | template-filled | answered |  | pass | What status codes, response headers, response schemas, and nested fields can Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id return? |
| 841 | template-unfilled | clarification_required |  | pass | What status codes, response headers, response schemas, and nested fields can {operation} return? |
| 842 | template-filled | unsupported |  | pass | What is the maximum request or response field nesting depth for Mortgage Loan API? |
| 843 | template-filled | unsupported |  | pass | What is the maximum request or response field nesting depth for Mortgage Loan API? |
| 844 | template-unfilled | clarification_required |  | pass | What is the maximum request or response field nesting depth for {operation_or_api}? |
| 845 | template-filled | unsupported |  | pass | Which required fields occur at each canonical path in GetAggregationCustomerTransactionByTransactionIdResponse_200? |
| 846 | template-filled | unsupported |  | pass | Which required fields occur at each canonical path in CreateBankingCustomerPersonalLoanApplicationResponse_201? |
| 847 | template-unfilled | clarification_required |  | pass | Which required fields occur at each canonical path in {schema}? |
| 848 | template-filled | unsupported |  | pass | Which fields in GetAggregationCustomerTransactionByTransactionIdResponse_200 allow additional properties? |
| 849 | template-filled | unsupported |  | pass | Which fields in CreateBankingCustomerPersonalLoanApplicationResponse_201 allow additional properties? |
| 850 | template-unfilled | clarification_required |  | pass | Which fields in {schema} allow additional properties? |
| 851 | template-filled | unsupported |  | pass | Which object or array fields have no nested child fields? |
| 852 | template-filled | unsupported |  | pass | Which field names have inconsistent type, format, required, or additionalProperties values across API contracts? |
| 853 | template-filled | clarification_required |  | pass | Which schemas or fields share the same canonicalPath, and where are they exposed? |
| 854 | template-filled | unsupported |  | pass | Which API contracts use string, integer, number, boolean, object, or array fields? |
| 855 | template-filled | unsupported |  | pass | Which APIs return non-success or error status-code nodes in addition to success responses? |
| 856 | template-filled | clarification_required |  | pass | Which operations have a request schema but no modeled response schema, or vice versa? |
| 857 | template-filled | unsupported |  | pass | Which request and response headers appear most widely across the API estate? |
| 858 | template-filled | unsupported |  | pass | Which path or query parameters are reused by the most operations? |
| 859 | template-filled | answered |  | pass | What APIs and operations form Open Finance Gateway's complete subscription footprint? |
| 860 | template-filled | unsupported |  | pass | What APIs and operations form Loan Bridge's complete subscription footprint? |
| 861 | template-unfilled | clarification_required |  | pass | What APIs and operations form {consumer}'s complete subscription footprint? |
| 862 | template-filled | clarification_required |  | pass | Does Open Finance Gateway subscribe both at API and operation level, and where do those subscriptions overlap? |
| 863 | template-filled | clarification_required |  | pass | Does Loan Bridge subscribe both at API and operation level, and where do those subscriptions overlap? |
| 864 | template-unfilled | clarification_required |  | pass | Does {consumer} subscribe both at API and operation level, and where do those subscriptions overlap? |
| 865 | template-filled | answered |  | pass | Which subscribed operations of Open Finance Gateway are External, Internal, or Partner exposed? |
| 866 | template-filled | answered |  | pass | Which subscribed operations of Loan Bridge are External, Internal, or Partner exposed? |
| 867 | template-unfilled | clarification_required |  | pass | Which subscribed operations of {consumer} are External, Internal, or Partner exposed? |
| 868 | template-filled | clarification_required |  | pass | Which subscribed operations of Open Finance Gateway are PII or PCI classified? |
| 869 | template-filled | clarification_required |  | pass | Which subscribed operations of Loan Bridge are PII or PCI classified? |
| 870 | template-unfilled | clarification_required |  | pass | Which subscribed operations of {consumer} are PII or PCI classified? |
| 871 | template-filled | unsupported |  | pass | Which security controls are implemented by the operations used by Open Finance Gateway? |
| 872 | template-filled | unsupported |  | pass | Which security controls are implemented by the operations used by Loan Bridge? |
| 873 | template-unfilled | clarification_required |  | pass | Which security controls are implemented by the operations used by {consumer}? |
| 874 | template-filled | unsupported |  | pass | Which GATEWAY, MICROSERVICE, or WORKFLOW category nodes are linked by DEPLOYED-TO from Open Finance Gateway's subscribed operations? |
| 875 | template-filled | unsupported |  | pass | Which GATEWAY, MICROSERVICE, or WORKFLOW category nodes are linked by DEPLOYED-TO from Loan Bridge's subscribed operations? |
| 876 | template-unfilled | clarification_required |  | pass | Which GATEWAY, MICROSERVICE, or WORKFLOW category nodes are linked by DEPLOYED-TO from {consumer}'s subscribed operations? |
| 877 | template-filled | unsupported |  | pass | Which databases and events are reached transitively from Open Finance Gateway's subscriptions? |
| 878 | template-filled | unsupported |  | pass | Which databases and events are reached transitively from Loan Bridge's subscriptions? |
| 879 | template-unfilled | clarification_required |  | pass | Which databases and events are reached transitively from {consumer}'s subscriptions? |
| 880 | template-filled | clarification_required | answered | pass | Which operations used by Open Finance Gateway call or route to other operations? |
| 881 | template-filled | unsupported |  | pass | Which operations used by Loan Bridge call or route to other operations? |
| 882 | template-unfilled | clarification_required |  | pass | Which operations used by {consumer} call or route to other operations? |
| 883 | template-filled | answered |  | pass | Which APIs mix External, Internal, and Partner operations? |
| 884 | template-filled | answered |  | pass | Which APIs mix gateway- and microservice-deployed operations? |
| 885 | template-filled | clarification_required |  | pass | Which APIs include both PII-classified and non-PII operations? |
| 886 | template-filled | clarification_required |  | pass | Which APIs include PCI-classified operations, and who consumes them? |
| 887 | template-filled | unsupported |  | pass | Which API versions are served by more than one service or service category? |
| 888 | template-filled | clarification_required |  | pass | Which operations have a DEPLOYED-TO target inconsistent with their serviceCategory? |
| 889 | template-filled | clarification_required |  | pass | Which operations share a database or event but belong to different APIs or applications? |
| 890 | template-filled | unsupported |  | pass | Which APIs depend on the same called or routed-to operation? |
| 891 | template-filled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated through exposing applications with the APIs consumed by Open Finance Gateway? |
| 892 | template-filled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated through exposing applications with the APIs consumed by Loan Bridge? |
| 893 | template-unfilled | clarification_required |  | pass | Which business capabilities and capability-owning teams are associated through exposing applications with the APIs consumed by {consumer}? |
| 894 | template-filled | unsupported |  | pass | Starting from institution, which parent field tree, schema, request or response, status code, operation, endpoint, version, API, and application expose it? |
| 895 | template-filled | unsupported |  | pass | Starting from items, which parent field tree, schema, request or response, status code, operation, endpoint, version, API, and application expose it? |
| 896 | template-unfilled | clarification_required |  | pass | Starting from {field}, which parent field tree, schema, request or response, status code, operation, endpoint, version, API, and application expose it? |
| 897 | template-filled | clarification_required |  | pass | Is institution request-only, response-only, or present in both directions? |
| 898 | template-filled | clarification_required |  | pass | Is items request-only, response-only, or present in both directions? |
| 899 | template-unfilled | clarification_required |  | pass | Is {field} request-only, response-only, or present in both directions? |
| 900 | template-filled | unsupported |  | pass | Which consumers ultimately depend on institution? |
| 901 | template-filled | unsupported |  | pass | Which consumers ultimately depend on GetAggregationCustomerTransactionByTransactionIdResponse_200? |
| 902 | template-unfilled | clarification_required |  | pass | Which consumers ultimately depend on {field_or_schema_or_header_or_parameter_or_status_code}? |
| 903 | template-filled | clarification_required |  | pass | Starting from GetAggregationCustomerTransactionByTransactionIdResponse_200, which operations accept it and which status-code responses return it? |
| 904 | template-filled | clarification_required |  | pass | Starting from CreateBankingCustomerPersonalLoanApplicationResponse_201, which operations accept it and which status-code responses return it? |
| 905 | template-unfilled | clarification_required |  | pass | Starting from {schema}, which operations accept it and which status-code responses return it? |
| 906 | template-filled | clarification_required |  | pass | Starting from x-mock-response, where is it used as a request header versus a response header? |
| 907 | template-filled | clarification_required |  | pass | Starting from x-mock-response, where is it used as a request header versus a response header? |
| 908 | template-unfilled | clarification_required |  | pass | Starting from {header}, where is it used as a request header versus a response header? |
| 909 | template-filled | unsupported |  | pass | Starting from accountId, which operations, paths, versions, and APIs use it? |
| 910 | template-filled | unsupported |  | pass | Starting from accountId, which operations, paths, versions, and APIs use it? |
| 911 | template-unfilled | clarification_required |  | pass | Starting from {path_parameter_or_query_parameter}, which operations, paths, versions, and APIs use it? |
| 912 | template-filled | clarification_required |  | pass | Starting from 200, which response schema and headers does it carry, and which operation returns it? |
| 913 | template-filled | clarification_required |  | pass | Starting from 200, which response schema and headers does it carry, and which operation returns it? |
| 914 | template-unfilled | clarification_required |  | pass | Starting from {status_code}, which response schema and headers does it carry, and which operation returns it? |
| 915 | template-filled | unsupported |  | pass | Starting from OAuth 2, which operations, endpoints, APIs, applications, consumers, capabilities, and teams are in scope? |
| 916 | template-filled | answered |  | pass | Starting from External, which operations, endpoints, APIs, applications, consumers, capabilities, and teams are in scope? |
| 917 | template-unfilled | clarification_required |  | pass | Starting from {security_control_or_exposure_or_classification}, which operations, endpoints, APIs, applications, consumers, capabilities, and teams are in scope? |
| 918 | template-filled | clarification_required |  | pass | Starting from MICROSERVICE, which operations are linked to it and which APIs, applications, consumers, capabilities, and capability-owning teams roll up from those operations? |
| 919 | template-filled | clarification_required |  | pass | Starting from GATEWAY, which operations are linked to it and which APIs, applications, consumers, capabilities, and capability-owning teams roll up from those operations? |
| 920 | template-unfilled | clarification_required |  | pass | Starting from {deployment_target}, which operations are linked to it and which APIs, applications, consumers, capabilities, and capability-owning teams roll up from those operations? |
| 921 | template-filled | clarification_required |  | pass | Starting from banking_demo-postgres, which operations use it and which API contracts and consumers sit above those operations? |
| 922 | template-filled | clarification_required |  | pass | Starting from redis-redis, which operations use it and which API contracts and consumers sit above those operations? |
| 923 | template-unfilled | clarification_required |  | pass | Starting from {database}, which operations use it and which API contracts and consumers sit above those operations? |
| 924 | template-filled | unsupported |  | pass | Starting from banking.api.events-unknown, which producing operations and subscribed consumers sit upstream? |
| 925 | template-filled | unsupported |  | pass | Starting from banking.workflow.commands-unknown, which producing operations and subscribed consumers sit upstream? |
| 926 | template-unfilled | clarification_required |  | pass | Starting from {event}, which producing operations and subscribed consumers sit upstream? |
| 927 | template-filled | answered |  | pass | Starting from List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications, which callers, routers, endpoints, APIs, consumers, applications, capabilities, and teams depend on it? |
| 928 | template-filled | answered |  | pass | Starting from Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id, which callers, routers, endpoints, APIs, consumers, applications, capabilities, and teams depend on it? |
| 929 | template-unfilled | clarification_required |  | pass | Starting from {operation}, which callers, routers, endpoints, APIs, consumers, applications, capabilities, and teams depend on it? |
| 930 | template-filled | unsupported |  | pass | Which field, schema, operation, endpoint, or API has the greatest reverse fan-in from consumers? |
| 931 | template-filled | unsupported |  | pass | Which database, event, or deployment target has the greatest reverse fan-in from APIs? |
| 932 | template-filled | unsupported |  | pass | What is the shortest evidence path between Mortgage Loan API and banking_demo-postgres? |
| 933 | template-filled | unsupported |  | pass | What is the shortest evidence path between Mortgage Loan API and redis-redis? |
| 934 | template-unfilled | clarification_required |  | pass | What is the shortest evidence path between {consumer_or_api} and {field_or_database_or_event}? |
| 935 | template-filled | clarification_required |  | pass | Which External operations are classified as PII? |
| 936 | template-filled | clarification_required |  | pass | Which External operations are classified as PCI? |
| 937 | template-filled | answered |  | pass | Which operations are classified as both PII and PCI? |
| 938 | template-filled | clarification_required |  | pass | Which Partner operations are classified as PII or PCI? |
| 939 | template-filled | answered |  | pass | Which PII or PCI operations are consumed by Open Finance Gateway? |
| 940 | template-filled | answered |  | pass | Which PII or PCI operations are consumed by Loan Bridge? |
| 941 | template-unfilled | clarification_required |  | pass | Which PII or PCI operations are consumed by {consumer}? |
| 942 | template-filled | answered |  | pass | Which PII or PCI operations are deployed to MICROSERVICE? |
| 943 | template-filled | answered |  | pass | Which PII or PCI operations are deployed to GATEWAY? |
| 944 | template-unfilled | clarification_required |  | pass | Which PII or PCI operations are deployed to {deployment_target}? |
| 945 | template-filled | answered |  | pass | Which PII or PCI operations read from, connect to, write to, or update banking_demo-postgres? |
| 946 | template-filled | answered |  | pass | Which PII or PCI operations read from, connect to, write to, or update redis-redis? |
| 947 | template-unfilled | clarification_required |  | pass | Which PII or PCI operations read from, connect to, write to, or update {database}? |
| 948 | template-filled | unsupported |  | pass | Which PII or PCI operations produce banking.api.events-unknown? |
| 949 | template-filled | unsupported |  | pass | Which PII or PCI operations produce banking.workflow.commands-unknown? |
| 950 | template-unfilled | clarification_required |  | pass | Which PII or PCI operations produce {event}? |
| 951 | template-filled | clarification_required |  | pass | Which External write or update operations are classified as PII or PCI? |
| 952 | template-filled | answered |  | pass | Which operations satisfying GET, External, PII, OAuth 2, and MICROSERVICE all at once exist? |
| 953 | template-filled | answered |  | pass | Which operations satisfying POST, Partner, PCI, OAuth 2, and GATEWAY all at once exist? |
| 954 | template-unfilled | clarification_required |  | pass | Which operations satisfying {http_method}, {exposure}, {classification}, {security_control}, and {deployment_target} all at once exist? |
| 955 | template-filled | unsupported |  | pass | Which operations lack one or more of method, OAuth 2, exposure, and deployment relationships? |
| 956 | template-filled | answered |  | pass | Which External operations have no modeled PII or PCI classification? |
| 957 | template-filled | unsupported |  | pass | Which PII or PCI operations have no subscribing consumer? |
| 958 | template-filled | unsupported |  | pass | Which APIs have the highest number of External PII or PCI operations? |
| 959 | template-filled | clarification_required |  | pass | Which applications have the largest sensitive API footprint, and which capabilities, capability-owning teams, and business areas are associated through those applications? |
| 960 | template-filled | unsupported |  | pass | Which consumers have the broadest sensitive or externally exposed subscription footprint? |
| 961 | template-filled | clarification_required |  | pass | Where does an identical field name or canonical path cross both PII-classified and non-PII operations? |
| 962 | template-filled | unsupported |  | pass | Which sensitive operations depend on shared databases, events, deployments, or downstream operations? |
| 963 | template-filled | answered |  | pass | What is affected if payments-app stops exposing its APIs? |
| 964 | template-filled | answered |  | pass | What is affected if customer-channel-app stops exposing its APIs? |
| 965 | template-unfilled | clarification_required |  | pass | What is affected if {application} stops exposing its APIs? |
| 966 | template-filled | answered |  | pass | What is the deprecation blast radius of Mortgage Loan API? |
| 967 | template-filled | answered |  | pass | What is the deprecation blast radius of Mortgage Loan API? |
| 968 | template-unfilled | clarification_required |  | pass | What is the deprecation blast radius of {api}? |
| 969 | template-filled | unsupported |  | pass | Which versions, endpoints, operations, consumers, contracts, deployments, databases, events, applications, capabilities, teams, and business areas are in Mortgage Loan API's deprecation radius? |
| 970 | template-filled | unsupported |  | pass | Which versions, endpoints, operations, consumers, contracts, deployments, databases, events, applications, capabilities, teams, and business areas are in Mortgage Loan API's deprecation radius? |
| 971 | template-unfilled | clarification_required |  | pass | Which versions, endpoints, operations, consumers, contracts, deployments, databases, events, applications, capabilities, teams, and business areas are in {api}'s deprecation radius? |
| 972 | template-filled | answered |  | pass | What is affected if v1 is retired? |
| 973 | template-filled | unsupported |  | pass | What is affected if v5 is retired? |
| 974 | template-unfilled | clarification_required |  | pass | What is affected if {api_version} is retired? |
| 975 | template-filled | unsupported |  | pass | Which consumers depend directly on v1's operations even if they subscribe to the parent API separately? |
| 976 | template-filled | answered |  | pass | Which consumers depend directly on v5's operations even if they subscribe to the parent API separately? |
| 977 | template-unfilled | clarification_required |  | pass | Which consumers depend directly on {api_version}'s operations even if they subscribe to the parent API separately? |
| 978 | template-filled | answered |  | pass | What is affected if /v5/banking/accounts/{accountId}/bill-payments is removed or moved? |
| 979 | template-filled | answered |  | pass | What is affected if /v5/banking/account-management/fraud-evaluation/evaluations/{evaluationId} is removed or moved? |
| 980 | template-unfilled | clarification_required |  | pass | What is affected if {endpoint} is removed or moved? |
| 981 | template-filled | answered |  | pass | What is affected if List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications's path, method, operationId, service, or serviceCategory changes? |
| 982 | template-filled | answered |  | pass | What is affected if Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id's path, method, operationId, service, or serviceCategory changes? |
| 983 | template-unfilled | clarification_required |  | pass | What is affected if {operation}'s path, method, operationId, service, or serviceCategory changes? |
| 984 | template-filled | answered |  | pass | Which called or routed operations expand the transitive blast radius of deprecating List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 985 | template-filled | answered |  | pass | Which called or routed operations expand the transitive blast radius of deprecating Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 986 | template-unfilled | clarification_required |  | pass | Which called or routed operations expand the transitive blast radius of deprecating {operation}? |
| 987 | template-filled | answered |  | pass | Which business capabilities and capability-owning teams are in the reverse context rollup of Mortgage Loan API's deprecation? |
| 988 | template-filled | answered |  | pass | Which business capabilities and capability-owning teams are in the reverse context rollup of Mortgage Loan API's deprecation? |
| 989 | template-unfilled | clarification_required |  | pass | Which business capabilities and capability-owning teams are in the reverse context rollup of {api_or_version_or_endpoint_or_operation}'s deprecation? |
| 990 | template-filled | answered |  | pass | What is the contract-change blast radius of changing or removing request x-mock-response? |
| 991 | template-filled | answered |  | pass | What is the contract-change blast radius of changing or removing request x-mock-response? |
| 992 | template-unfilled | clarification_required |  | pass | What is the contract-change blast radius of changing or removing request {header}? |
| 993 | template-filled | unsupported |  | pass | What is the contract-change blast radius of renaming, adding, or removing accountId? |
| 994 | template-filled | unsupported |  | pass | What is the contract-change blast radius of renaming, adding, or removing accountId? |
| 995 | template-unfilled | clarification_required |  | pass | What is the contract-change blast radius of renaming, adding, or removing {path_parameter}? |
| 996 | template-filled | unsupported |  | pass | What is the contract-change blast radius of changing limit? |
| 997 | template-filled | unsupported |  | pass | What is the contract-change blast radius of changing offset? |
| 998 | template-unfilled | clarification_required |  | pass | What is the contract-change blast radius of changing {query_parameter}? |
| 999 | template-filled | answered |  | pass | What is the contract-change blast radius of GetAggregationCustomerTransactionByTransactionIdResponse_200? |
| 1000 | template-filled | answered |  | pass | What is the contract-change blast radius of CreateBankingCustomerPersonalLoanApplicationResponse_201? |
| 1001 | template-unfilled | clarification_required |  | pass | What is the contract-change blast radius of {schema}? |
| 1002 | template-filled | no_evidence |  | pass | Which operations and consumers are affected if institution changes type or format? |
| 1003 | template-filled | no_evidence |  | pass | Which operations and consumers are affected if items changes type or format? |
| 1004 | template-unfilled | clarification_required |  | pass | Which operations and consumers are affected if {field} changes type or format? |
| 1005 | template-filled | no_evidence |  | pass | Which operations and consumers are affected if institution changes required status? |
| 1006 | template-filled | no_evidence |  | pass | Which operations and consumers are affected if items changes required status? |
| 1007 | template-unfilled | clarification_required |  | pass | Which operations and consumers are affected if {field} changes required status? |
| 1008 | template-filled | no_evidence |  | pass | Which operations and consumers are affected if additionalProperties changes on institution? |
| 1009 | template-filled | no_evidence |  | pass | Which operations and consumers are affected if additionalProperties changes on GetAggregationCustomerTransactionByTransactionIdResponse_200? |
| 1010 | template-unfilled | clarification_required |  | pass | Which operations and consumers are affected if additionalProperties changes on {schema_or_field}? |
| 1011 | template-filled | clarification_required |  | pass | How far does a nested-field change propagate through parent fields, root schema, operation, endpoint, API, application, and consumer? |
| 1012 | template-filled | clarification_required |  | pass | Which APIs share the exact affected schema or field node, and which additional APIs are only heuristic review candidates because distinct nodes share a schema name, field name, or canonical path? |
| 1013 | template-filled | unsupported |  | pass | What is affected if 200 is added, removed, or changes meaning? |
| 1014 | template-filled | unsupported |  | pass | What is affected if 200 is added, removed, or changes meaning? |
| 1015 | template-unfilled | clarification_required |  | pass | What is affected if {status_code} is added, removed, or changes meaning? |
| 1016 | template-filled | no_evidence |  | pass | What is affected if response x-mock-response changes or is removed? |
| 1017 | template-filled | no_evidence |  | pass | What is affected if response x-mock-response changes or is removed? |
| 1018 | template-unfilled | clarification_required |  | pass | What is affected if response {header} changes or is removed? |
| 1019 | template-filled | answered |  | pass | What is the response-contract blast radius of GetAggregationCustomerTransactionByTransactionIdResponse_200? |
| 1020 | template-filled | answered |  | pass | What is the response-contract blast radius of CreateBankingCustomerPersonalLoanApplicationResponse_201? |
| 1021 | template-unfilled | clarification_required |  | pass | What is the response-contract blast radius of {schema}? |
| 1022 | template-filled | answered |  | pass | Which consumers and callers are affected if institution changes in a response schema? |
| 1023 | template-filled | unsupported |  | pass | Which consumers and callers are affected if items changes in a response schema? |
| 1024 | template-unfilled | clarification_required |  | pass | Which consumers and callers are affected if {field} changes in a response schema? |
| 1025 | template-filled | unsupported |  | pass | Which operations are impacted if a shared response field changes at any nesting depth? |
| 1026 | template-filled | no_evidence |  | pass | What is the combined request-and-response blast radius when institution appears in both directions? |
| 1027 | template-filled | no_evidence |  | pass | What is the combined request-and-response blast radius when GetAggregationCustomerTransactionByTransactionIdResponse_200 appears in both directions? |
| 1028 | template-unfilled | clarification_required |  | pass | What is the combined request-and-response blast radius when {schema_or_field} appears in both directions? |
| 1029 | template-filled | no_evidence |  | pass | Which APIs and consumers are affected by changing all occurrences of /institution? |
| 1030 | template-filled | no_evidence |  | pass | Which APIs and consumers are affected by changing all occurrences of /institution? |
| 1031 | template-unfilled | clarification_required |  | pass | Which APIs and consumers are affected by changing all occurrences of {canonical_path}? |
| 1032 | template-filled | unsupported |  | pass | What is the security-change blast radius of OAuth 2? |
| 1033 | template-filled | unsupported |  | pass | What is the security-change blast radius of OAuth 2? |
| 1034 | template-unfilled | clarification_required |  | pass | What is the security-change blast radius of {security_control}? |
| 1035 | template-filled | clarification_required | no_evidence | pass | Which operations, consumers, APIs, applications, capabilities, and teams are affected if OAuth 2 behavior changes? |
| 1036 | template-filled | answered |  | pass | What is the policy-change blast radius of reclassifying List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications as PII or PCI? |
| 1037 | template-filled | answered |  | pass | What is the policy-change blast radius of reclassifying Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id as PII or PCI? |
| 1038 | template-unfilled | clarification_required |  | pass | What is the policy-change blast radius of reclassifying {operation} as PII or PCI? |
| 1039 | template-filled | clarification_required | no_evidence | pass | What is the estate-wide blast radius of changing the PII classification policy? |
| 1040 | template-filled | clarification_required | no_evidence | pass | What is the estate-wide blast radius of changing the PCI classification policy? |
| 1041 | template-filled | unsupported |  | pass | Which consumers, associated business capabilities, and capability-owning teams enter review scope if List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications's exposure changes from Internal or Partner to External? |
| 1042 | template-filled | unsupported |  | pass | Which consumers, associated business capabilities, and capability-owning teams enter review scope if Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id's exposure changes from Internal or Partner to External? |
| 1043 | template-unfilled | clarification_required |  | pass | Which consumers, associated business capabilities, and capability-owning teams enter review scope if {operation}'s exposure changes from Internal or Partner to External? |
| 1044 | template-filled | answered |  | pass | Which databases, events, called operations, and deployments sit downstream of External PII or PCI operations affected by a policy change? |
| 1045 | template-filled | clarification_required |  | pass | Which sensitive operations share a dependency that makes the security blast radius cross API boundaries? |
| 1046 | template-filled | answered |  | pass | For operations linked by DEPLOYED-TO to MICROSERVICE, which endpoints, APIs, consumers, applications, capabilities, and capability-owning teams are in structural scope? |
| 1047 | template-filled | unsupported |  | pass | For operations linked by DEPLOYED-TO to GATEWAY, which endpoints, APIs, consumers, applications, capabilities, and capability-owning teams are in structural scope? |
| 1048 | template-unfilled | clarification_required |  | pass | For operations linked by DEPLOYED-TO to {gateway_or_microservice_or_workflow}, which endpoints, APIs, consumers, applications, capabilities, and capability-owning teams are in structural scope? |
| 1049 | template-filled | answered |  | pass | What is affected if List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications moves between gateway and microservice deployment categories? |
| 1050 | template-filled | answered |  | pass | What is affected if Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id moves between gateway and microservice deployment categories? |
| 1051 | template-unfilled | clarification_required |  | pass | What is affected if {operation} moves between gateway and microservice deployment categories? |
| 1052 | template-filled | answered |  | pass | Which consumers are affected by a service or serviceCategory change to List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 1053 | template-filled | answered |  | pass | Which consumers are affected by a service or serviceCategory change to Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 1054 | template-unfilled | clarification_required |  | pass | Which consumers are affected by a service or serviceCategory change to {operation}? |
| 1055 | template-filled | answered |  | pass | Which API contracts are in the reverse outage radius of banking_demo-postgres? |
| 1056 | template-filled | answered |  | pass | Which API contracts are in the reverse outage radius of redis-redis? |
| 1057 | template-unfilled | clarification_required |  | pass | Which API contracts are in the reverse outage radius of {database}? |
| 1058 | template-filled | no_match |  | pass | Which APIs and consumers are in the reverse outage radius of banking.api.events-unknown? |
| 1059 | template-filled | no_match |  | pass | Which APIs and consumers are in the reverse outage radius of banking.workflow.commands-unknown? |
| 1060 | template-unfilled | clarification_required |  | pass | Which APIs and consumers are in the reverse outage radius of {event}? |
| 1061 | template-filled | answered |  | pass | Which APIs and consumers are affected by a data change to banking_demo-postgres? |
| 1062 | template-filled | answered |  | pass | Which APIs and consumers are affected by a data change to redis-redis? |
| 1063 | template-unfilled | clarification_required |  | pass | Which APIs and consumers are affected by a data change to {database_or_event}? |
| 1064 | template-filled | answered |  | pass | Which APIs and consumers are affected if a called or routed-to List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications changes or fails? |
| 1065 | template-filled | answered |  | pass | Which APIs and consumers are affected if a called or routed-to Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id changes or fails? |
| 1066 | template-unfilled | clarification_required |  | pass | Which APIs and consumers are affected if a called or routed-to {operation} changes or fails? |
| 1067 | template-filled | unsupported |  | pass | Which cross-API call or route dependencies enlarge the deployment blast radius? |
| 1068 | template-filled | answered |  | pass | What is the union and intersection of the blast radii of SECURITY:OAuth 2, EXPOSURE:External? |
| 1069 | template-filled | answered |  | pass | What is the union and intersection of the blast radii of EXPOSURE:External, APPLICATION:payments-app? |
| 1070 | template-unfilled | clarification_required |  | pass | What is the union and intersection of the blast radii of {api_node_set}? |
| 1071 | template-filled | clarification_required |  | pass | Which consumers are common to every root in SECURITY:OAuth 2, EXPOSURE:External, and which are unique to one root? |
| 1072 | template-filled | clarification_required |  | pass | Which consumers are common to every root in EXPOSURE:External, APPLICATION:payments-app, and which are unique to one root? |
| 1073 | template-unfilled | clarification_required |  | pass | Which consumers are common to every root in {api_node_set}, and which are unique to one root? |
| 1074 | template-filled | unsupported |  | pass | Which applications, capabilities, and teams appear in multiple API blast radii? |
| 1075 | template-filled | answered |  | pass | How do APIs, schemas, fields, deployment targets, databases, and events rank by distinct consumer blast radius? |
| 1076 | template-filled | clarification_required |  | pass | Which affected nodes are one hop away versus transitively affected within 3? |
| 1077 | template-filled | clarification_required |  | pass | Which affected nodes are one hop away versus transitively affected within 0? |
| 1078 | template-unfilled | clarification_required |  | pass | Which affected nodes are one hop away versus transitively affected within {max_depth}? |
| 1079 | template-filled | clarification_required |  | pass | Which blast-radius paths cross from API contracts into Runtime and then back to another API? |
| 1080 | template-filled | unsupported |  | pass | Which blast-radius results are truncated by depth or result limits? |
| 1081 | template-filled | unsupported |  | pass | Which result nodes are contextual portfolio rollups rather than propagating failures? |
| 1082 | template-filled | clarification_required |  | pass | Which operations exist, and what are their operationId, HTTP method, path, service, and serviceCategory? |
| 1083 | template-filled | answered |  | pass | How many operations are implemented by each service, service category, and HTTP method? |
| 1084 | template-filled | unsupported |  | pass | Which services are recorded on the broadest mix of GET, POST, PUT, PATCH, and DELETE operations? |
| 1085 | template-filled | answered |  | pass | Which logical operations occur in gateway and microservice forms when grouped by operationId, method, and path? |
| 1086 | template-filled | unsupported |  | pass | Which operations have missing or blank httpMethod, path, service, serviceCategory, or operationId properties? |
| 1087 | template-filled | unsupported |  | pass | Which operations have no containing endpoint, method, security, exposure, or deployment edge? |
| 1088 | template-filled | unsupported |  | pass | Which endpoints map to one, two, three, or four runtime operation nodes? |
| 1089 | template-filled | clarification_required |  | pass | Which databases exist, and what type, host, logical name, and connection string are recorded for each? |
| 1090 | template-filled | unsupported |  | pass | Which database nodes share a type, host, logical name, or connection endpoint? |
| 1091 | template-filled | unsupported |  | pass | Which databases have an unknown host or no recorded connection string? |
| 1092 | template-filled | clarification_required |  | pass | Which event destinations exist, and what transport type and host are recorded for each? |
| 1093 | template-filled | unsupported |  | pass | Which events have an unknown host? |
| 1094 | template-filled | answered |  | pass | How many CALLS, ROUTES-TO, CONNECTS-TO, READS-FROM, WRITES-TO, UPDATES-TO, PRODUCES, and CONSUMES edges exist? |
| 1095 | template-filled | clarification_required |  | pass | Does any DELETE-FROM edge exist in this snapshot, and what deletion behavior is therefore unrepresented? |
| 1096 | template-filled | unsupported |  | pass | Which less common populated Runtime signatures use DATABASE or EVENT as the source of CALLS, CONNECTS-TO, or PRODUCES? |
| 1097 | template-filled | unsupported |  | pass | Which Runtime nodes or subgraphs are orphaned from the API hierarchy? |
| 1098 | template-filled | unsupported |  | pass | Which Runtime edges are self-loops? |
| 1099 | template-filled | unsupported |  | pass | Which CALLS, ROUTES-TO, event, or database subgraphs contain cycles? |
| 1100 | template-filled | unsupported |  | pass | Which edge properties are populated for each Runtime relationship type? |
| 1101 | template-filled | unsupported |  | pass | Which data-access edges lack tableName even though they carry a captured query? |
| 1102 | template-filled | answered |  | pass | Which operations does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications call directly? |
| 1103 | template-filled | no_evidence |  | pass | Which operations does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id call directly? |
| 1104 | template-unfilled | clarification_required |  | pass | Which operations does {operation} call directly? |
| 1105 | template-filled | answered |  | pass | What method and path were recorded for each call from List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 1106 | template-filled | no_evidence |  | pass | What method and path were recorded for each call from Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 1107 | template-unfilled | clarification_required |  | pass | What method and path were recorded for each call from {operation}? |
| 1108 | template-filled | answered |  | pass | What callCount, errorCount, lastSeen, and recorded depth accompany each direct call? |
| 1109 | template-filled | no_evidence |  | pass | Which operations does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications route to directly? |
| 1110 | template-filled | no_evidence |  | pass | Which operations does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id route to directly? |
| 1111 | template-unfilled | clarification_required |  | pass | Which operations does {operation} route to directly? |
| 1112 | template-filled | no_evidence |  | pass | What path and HTTP method were recorded for each route from List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 1113 | template-filled | no_evidence |  | pass | What path and HTTP method were recorded for each route from Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 1114 | template-unfilled | clarification_required |  | pass | What path and HTTP method were recorded for each route from {operation}? |
| 1115 | template-filled | answered |  | pass | Does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications route to itself, to a gateway operation, or to a microservice operation? |
| 1116 | template-filled | answered |  | pass | Does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id route to itself, to a gateway operation, or to a microservice operation? |
| 1117 | template-unfilled | clarification_required |  | pass | Does {operation} route to itself, to a gateway operation, or to a microservice operation? |
| 1118 | template-filled | answered |  | pass | Which databases does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications connect to? |
| 1119 | template-filled | answered |  | pass | Which databases does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id connect to? |
| 1120 | template-unfilled | clarification_required |  | pass | Which databases does {operation} connect to? |
| 1121 | template-filled | answered |  | pass | What observed callCount, errorCount, lastSeen, and depth apply to each connection? |
| 1122 | template-filled | answered |  | pass | Which databases and tables does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications read from? |
| 1123 | template-filled | no_evidence |  | pass | Which databases and tables does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id read from? |
| 1124 | template-unfilled | clarification_required |  | pass | Which databases and tables does {operation} read from? |
| 1125 | template-filled | unsupported |  | pass | Which captured queries support the read dependencies of List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 1126 | template-filled | answered |  | pass | Which captured queries support the read dependencies of Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 1127 | template-unfilled | clarification_required |  | pass | Which captured queries support the read dependencies of {operation}? |
| 1128 | template-filled | answered |  | pass | Which databases and tables does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications write to? |
| 1129 | template-filled | answered |  | pass | Which databases and tables does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id write to? |
| 1130 | template-unfilled | clarification_required |  | pass | Which databases and tables does {operation} write to? |
| 1131 | template-filled | unsupported |  | pass | Which captured queries support the write dependencies of List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 1132 | template-filled | answered |  | pass | Which captured queries support the write dependencies of Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 1133 | template-unfilled | clarification_required |  | pass | Which captured queries support the write dependencies of {operation}? |
| 1134 | template-filled | answered |  | pass | Which databases and tables does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications update? |
| 1135 | template-filled | no_evidence |  | pass | Which databases and tables does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id update? |
| 1136 | template-unfilled | clarification_required |  | pass | Which databases and tables does {operation} update? |
| 1137 | template-filled | unsupported |  | pass | Which captured queries support the update dependencies of List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 1138 | template-filled | answered |  | pass | Which captured queries support the update dependencies of Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 1139 | template-unfilled | clarification_required |  | pass | Which captured queries support the update dependencies of {operation}? |
| 1140 | template-filled | answered |  | pass | Which events does List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications produce? |
| 1141 | template-filled | no_evidence |  | pass | Which events does Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id produce? |
| 1142 | template-unfilled | clarification_required |  | pass | Which events does {operation} produce? |
| 1143 | template-filled | unsupported |  | pass | What destinationName and observed telemetry are recorded for each event produced by List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 1144 | template-filled | unsupported |  | pass | What destinationName and observed telemetry are recorded for each event produced by Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 1145 | template-unfilled | clarification_required |  | pass | What destinationName and observed telemetry are recorded for each event produced by {operation}? |
| 1146 | template-filled | no_evidence |  | pass | Which events does banking.api.events-unknown consume? |
| 1147 | template-filled | no_evidence |  | pass | Which events does banking.workflow.commands-unknown consume? |
| 1148 | template-unfilled | clarification_required |  | pass | Which events does {event} consume? |
| 1149 | template-filled | unsupported |  | pass | Is the CONSUMES edge a self-loop or a cross-event dependency? |
| 1150 | template-filled | no_evidence |  | pass | Which events does banking.api.events-unknown produce? |
| 1151 | template-filled | answered |  | pass | Which events does banking.workflow.commands-unknown produce? |
| 1152 | template-unfilled | clarification_required |  | pass | Which events does {event} produce? |
| 1153 | template-filled | unsupported |  | pass | What event-to-event production chain starts at banking.api.events-unknown? |
| 1154 | template-filled | unsupported |  | pass | What event-to-event production chain starts at banking.workflow.commands-unknown? |
| 1155 | template-unfilled | clarification_required |  | pass | What event-to-event production chain starts at {event}? |
| 1156 | template-filled | no_evidence |  | pass | Which operations does banking.api.events-unknown call? |
| 1157 | template-filled | answered |  | pass | Which operations does banking.workflow.commands-unknown call? |
| 1158 | template-unfilled | clarification_required |  | pass | Which operations does {event} call? |
| 1159 | template-filled | answered |  | pass | What path, method, callCount, errorCount, lastSeen, and depth are recorded for each event-originated call? |
| 1160 | template-filled | no_evidence |  | pass | Which databases does banking.api.events-unknown connect to? |
| 1161 | template-filled | answered |  | pass | Which databases does banking.workflow.commands-unknown connect to? |
| 1162 | template-unfilled | clarification_required |  | pass | Which databases does {event} connect to? |
| 1163 | template-filled | clarification_required |  | pass | Is the connection direct, and what telemetry was observed? |
| 1164 | template-filled | no_evidence |  | pass | Which databases and tables does banking.api.events-unknown read from? |
| 1165 | template-filled | answered |  | pass | Which databases and tables does banking.workflow.commands-unknown read from? |
| 1166 | template-unfilled | clarification_required |  | pass | Which databases and tables does {event} read from? |
| 1167 | template-filled | clarification_required |  | pass | Which captured queries are associated with those event reads? |
| 1168 | template-filled | no_evidence |  | pass | Which databases and tables does banking.api.events-unknown write to? |
| 1169 | template-filled | answered |  | pass | Which databases and tables does banking.workflow.commands-unknown write to? |
| 1170 | template-unfilled | clarification_required |  | pass | Which databases and tables does {event} write to? |
| 1171 | template-filled | clarification_required |  | pass | Which captured queries are associated with those event writes? |
| 1172 | template-filled | no_evidence |  | pass | Which databases and tables does banking.api.events-unknown update? |
| 1173 | template-filled | answered |  | pass | Which databases and tables does banking.workflow.commands-unknown update? |
| 1174 | template-unfilled | clarification_required |  | pass | Which databases and tables does {event} update? |
| 1175 | template-filled | clarification_required |  | pass | Which captured queries are associated with those event updates? |
| 1176 | template-filled | clarification_required |  | pass | Which operation does banking_demo-postgres call according to the populated DATABASE -[CALLS]-> OPERATION edge? |
| 1177 | template-filled | clarification_required |  | pass | Which operation does redis-redis call according to the populated DATABASE -[CALLS]-> OPERATION edge? |
| 1178 | template-unfilled | clarification_required |  | pass | Which operation does {database} call according to the populated DATABASE -[CALLS]-> OPERATION edge? |
| 1179 | template-filled | clarification_required |  | pass | Which telemetry fields are present, and which path or method fields are absent, on the database-originated call? |
| 1180 | template-filled | no_evidence |  | pass | Which database, including itself, does banking_demo-postgres connect to? |
| 1181 | template-filled | no_evidence |  | pass | Which database, including itself, does redis-redis connect to? |
| 1182 | template-unfilled | clarification_required |  | pass | Which database, including itself, does {database} connect to? |
| 1183 | template-filled | clarification_required |  | pass | Is the database connection a self-loop, and what telemetry is recorded? |
| 1184 | template-filled | answered |  | pass | Which operations call List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications directly? |
| 1185 | template-filled | answered |  | pass | Which operations call Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id directly? |
| 1186 | template-unfilled | clarification_required |  | pass | Which operations call {operation} directly? |
| 1187 | template-filled | answered |  | pass | Which caller has the highest callCount or errorCount toward List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 1188 | template-filled | answered |  | pass | Which caller has the highest callCount or errorCount toward Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 1189 | template-unfilled | clarification_required |  | pass | Which caller has the highest callCount or errorCount toward {operation}? |
| 1190 | template-filled | no_evidence |  | pass | Which operations route to List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications directly? |
| 1191 | template-filled | no_evidence |  | pass | Which operations route to Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id directly? |
| 1192 | template-unfilled | clarification_required |  | pass | Which operations route to {operation} directly? |
| 1193 | template-filled | answered |  | pass | Which gateway paths and methods feed List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 1194 | template-filled | no_evidence |  | pass | Which gateway paths and methods feed Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 1195 | template-unfilled | clarification_required |  | pass | Which gateway paths and methods feed {operation}? |
| 1196 | template-filled | answered |  | pass | Which operations connect to banking_demo-postgres? |
| 1197 | template-filled | no_evidence |  | pass | Which operations connect to redis-redis? |
| 1198 | template-unfilled | clarification_required |  | pass | Which operations connect to {database}? |
| 1199 | template-filled | unsupported |  | pass | Which service and serviceCategory values are recorded on those connecting operations? |
| 1200 | template-filled | answered |  | pass | Which operations read from banking_demo-postgres? |
| 1201 | template-filled | answered |  | pass | Which operations read from redis-redis? |
| 1202 | template-unfilled | clarification_required |  | pass | Which operations read from {database}? |
| 1203 | template-filled | clarification_required |  | pass | Which readers touch operations_openfinance.business_state, and which query is recorded for each? |
| 1204 | template-filled | clarification_required |  | pass | Which readers touch operations_openfinance.business_state, and which query is recorded for each? |
| 1205 | template-unfilled | clarification_required |  | pass | Which readers touch {table_name}, and which query is recorded for each? |
| 1206 | template-filled | answered |  | pass | Which operations write to banking_demo-postgres? |
| 1207 | template-filled | answered |  | pass | Which operations write to redis-redis? |
| 1208 | template-unfilled | clarification_required |  | pass | Which operations write to {database}? |
| 1209 | template-filled | clarification_required |  | pass | Which writers touch operations_openfinance.business_state, and which query is recorded for each? |
| 1210 | template-filled | clarification_required |  | pass | Which writers touch operations_openfinance.business_state, and which query is recorded for each? |
| 1211 | template-unfilled | clarification_required |  | pass | Which writers touch {table_name}, and which query is recorded for each? |
| 1212 | template-filled | no_evidence |  | pass | Which operations update banking_demo-postgres? |
| 1213 | template-filled | answered |  | pass | Which operations update redis-redis? |
| 1214 | template-unfilled | clarification_required |  | pass | Which operations update {database}? |
| 1215 | template-filled | clarification_required |  | pass | Which updaters touch operations_openfinance.business_state, and which query is recorded for each? |
| 1216 | template-filled | clarification_required |  | pass | Which updaters touch operations_openfinance.business_state, and which query is recorded for each? |
| 1217 | template-unfilled | clarification_required |  | pass | Which updaters touch {table_name}, and which query is recorded for each? |
| 1218 | template-filled | answered |  | pass | Which operations produce banking.api.events-unknown? |
| 1219 | template-filled | answered |  | pass | Which operations produce banking.workflow.commands-unknown? |
| 1220 | template-unfilled | clarification_required |  | pass | Which operations produce {event}? |
| 1221 | template-filled | answered |  | pass | Which producing operation has the highest callCount, errorCount, or most recent lastSeen? |
| 1222 | template-filled | no_evidence |  | pass | Which events consume banking.api.events-unknown? |
| 1223 | template-filled | no_evidence |  | pass | Which events consume banking.workflow.commands-unknown? |
| 1224 | template-unfilled | clarification_required |  | pass | Which events consume {event}? |
| 1225 | template-filled | unsupported |  | pass | Does banking.api.events-unknown participate in a self-consuming or cross-event loop? |
| 1226 | template-filled | unsupported |  | pass | Does banking.workflow.commands-unknown participate in a self-consuming or cross-event loop? |
| 1227 | template-unfilled | clarification_required |  | pass | Does {event} participate in a self-consuming or cross-event loop? |
| 1228 | template-filled | answered |  | pass | Which event produces banking.api.events-unknown? |
| 1229 | template-filled | no_evidence |  | pass | Which event produces banking.workflow.commands-unknown? |
| 1230 | template-unfilled | clarification_required |  | pass | Which event produces {event}? |
| 1231 | template-filled | unsupported |  | pass | What event chain leads into banking.api.events-unknown? |
| 1232 | template-filled | unsupported |  | pass | What event chain leads into banking.workflow.commands-unknown? |
| 1233 | template-unfilled | clarification_required |  | pass | What event chain leads into {event}? |
| 1234 | template-filled | answered |  | pass | Which events call List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications? |
| 1235 | template-filled | no_evidence |  | pass | Which events call Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id? |
| 1236 | template-unfilled | clarification_required |  | pass | Which events call {operation}? |
| 1237 | template-filled | clarification_required |  | pass | What type and host values are recorded on the event nodes that make those calls? |
| 1238 | template-filled | answered |  | pass | Which events connect to banking_demo-postgres? |
| 1239 | template-filled | no_evidence |  | pass | Which events connect to redis-redis? |
| 1240 | template-unfilled | clarification_required |  | pass | Which events connect to {database}? |
| 1241 | template-filled | clarification_required |  | pass | What event destination and telemetry are associated with that connection? |
| 1242 | template-filled | answered |  | pass | Which events read from banking_demo-postgres? |
| 1243 | template-filled | answered |  | pass | Which events read from redis-redis? |
| 1244 | template-unfilled | clarification_required |  | pass | Which events read from {database}? |
| 1245 | template-filled | unsupported |  | pass | Which event reads use operations_openfinance.business_state? |
| 1246 | template-filled | unsupported |  | pass | Which event reads use operations_openfinance.business_state? |
| 1247 | template-unfilled | clarification_required |  | pass | Which event reads use {table_name_or_query}? |
| 1248 | template-filled | answered |  | pass | Which events write to banking_demo-postgres? |
| 1249 | template-filled | answered |  | pass | Which events write to redis-redis? |
| 1250 | template-unfilled | clarification_required |  | pass | Which events write to {database}? |
| 1251 | template-filled | unsupported |  | pass | Which event writes use operations_openfinance.business_state? |
| 1252 | template-filled | unsupported |  | pass | Which event writes use operations_openfinance.business_state? |
| 1253 | template-unfilled | clarification_required |  | pass | Which event writes use {table_name_or_query}? |
| 1254 | template-filled | no_evidence |  | pass | Which events update banking_demo-postgres? |
| 1255 | template-filled | answered |  | pass | Which events update redis-redis? |
| 1256 | template-unfilled | clarification_required |  | pass | Which events update {database}? |
| 1257 | template-filled | no_match |  | pass | Which event updates use operations_openfinance.business_state? |
| 1258 | template-filled | no_match |  | pass | Which event updates use operations_openfinance.business_state? |
| 1259 | template-unfilled | clarification_required |  | pass | Which event updates use {table_name_or_query}? |
| 1260 | template-filled | no_evidence |  | pass | Which database calls List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications through the observed extension edge? |
| 1261 | template-filled | no_evidence |  | pass | Which database calls Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id through the observed extension edge? |
| 1262 | template-unfilled | clarification_required |  | pass | Which database calls {operation} through the observed extension edge? |
| 1263 | template-filled | clarification_required |  | pass | How does that database-originated call connect back to API or business context? |
| 1264 | template-filled | no_evidence |  | pass | Which database connects to banking_demo-postgres? |
| 1265 | template-filled | no_evidence |  | pass | Which database connects to redis-redis? |
| 1266 | template-unfilled | clarification_required |  | pass | Which database connects to {database}? |
| 1267 | template-filled | answered |  | pass | Is banking_demo-postgres the source and target of the same connection edge? |
| 1268 | template-filled | no_evidence |  | pass | Is redis-redis the source and target of the same connection edge? |
| 1269 | template-unfilled | clarification_required |  | pass | Is {database} the source and target of the same connection edge? |
| 1270 | template-filled | clarification_required |  | pass | Starting from Accounts and Deposits, which runtime operations are conservatively associated through applications with its descendant capabilities? |
| 1271 | template-filled | clarification_required |  | pass | Starting from Operations and Execution, which runtime operations are conservatively associated through applications with its descendant capabilities? |
| 1272 | template-unfilled | clarification_required |  | pass | Starting from {business_area}, which runtime operations are conservatively associated through applications with its descendant capabilities? |
| 1273 | template-filled | unsupported |  | pass | Starting from Channel Specific, which services, operations, databases, and events are reachable? |
| 1274 | template-filled | unsupported |  | pass | Starting from Payments, which services, operations, databases, and events are reachable? |
| 1275 | template-unfilled | clarification_required |  | pass | Starting from {business_domain_or_service_domain}, which services, operations, databases, and events are reachable? |
| 1276 | template-filled | unsupported |  | pass | For Manage customer billing, which applications, APIs, endpoints, runtime services, and operations form its conservative implementation scope? |
| 1277 | template-filled | unsupported |  | pass | For Manage card service cases, which applications, APIs, endpoints, runtime services, and operations form its conservative implementation scope? |
| 1278 | template-unfilled | clarification_required |  | pass | For {business_capability}, which applications, APIs, endpoints, runtime services, and operations form its conservative implementation scope? |
| 1279 | template-filled | answered |  | pass | For Customer Platforms Team, what runtime estate is reachable through the capabilities it owns? |
| 1280 | template-filled | answered |  | pass | For Data Science & Analytics Platform Team, what runtime estate is reachable through the capabilities it owns? |
| 1281 | template-unfilled | clarification_required |  | pass | For {team}, what runtime estate is reachable through the capabilities it owns? |
| 1282 | template-filled | answered |  | pass | For payments-app, which exposed APIs terminate in which gateway or microservice operations? |
| 1283 | template-filled | answered |  | pass | For customer-channel-app, which exposed APIs terminate in which gateway or microservice operations? |
| 1284 | template-unfilled | clarification_required |  | pass | For {application}, which exposed APIs terminate in which gateway or microservice operations? |
| 1285 | template-filled | unsupported |  | pass | For Mortgage Loan API, which endpoints have multiple runtime implementations? |
| 1286 | template-filled | unsupported |  | pass | For Mortgage Loan API, which endpoints have multiple runtime implementations? |
| 1287 | template-unfilled | clarification_required |  | pass | For {api}, which endpoints have multiple runtime implementations? |
| 1288 | template-filled | unsupported |  | pass | For v1, which services, databases, tables, and events are downstream? |
| 1289 | template-filled | unsupported |  | pass | For v5, which services, databases, tables, and events are downstream? |
| 1290 | template-unfilled | clarification_required |  | pass | For {api_version}, which services, databases, tables, and events are downstream? |
| 1291 | template-filled | answered |  | pass | For /v5/banking/accounts/{accountId}/bill-payments, what gateway-to-gateway or gateway-to-microservice route chain handles it? |
| 1292 | template-filled | unsupported |  | pass | For /v5/banking/account-management/fraud-evaluation/evaluations/{evaluationId}, what gateway-to-gateway or gateway-to-microservice route chain handles it? |
| 1293 | template-unfilled | clarification_required |  | pass | For {endpoint}, what gateway-to-gateway or gateway-to-microservice route chain handles it? |
| 1294 | template-filled | unsupported |  | pass | For /v5/banking/accounts/{accountId}/bill-payments, what call chain, database access, and event production can follow execution? |
| 1295 | template-filled | unsupported |  | pass | For /v5/banking/account-management/fraud-evaluation/evaluations/{evaluationId}, what call chain, database access, and event production can follow execution? |
| 1296 | template-unfilled | clarification_required |  | pass | For {endpoint}, what call chain, database access, and event production can follow execution? |
| 1297 | template-filled | unsupported |  | pass | For Open Finance Gateway, which directly subscribed operations and transitive runtime dependencies are reachable? |
| 1298 | template-filled | unsupported |  | pass | For Loan Bridge, which directly subscribed operations and transitive runtime dependencies are reachable? |
| 1299 | template-unfilled | clarification_required |  | pass | For {consumer}, which directly subscribed operations and transitive runtime dependencies are reachable? |
| 1300 | template-filled | unsupported |  | pass | For an API-level subscription held by Open Finance Gateway, which contained operations and dependencies enter scope? |
| 1301 | template-filled | unsupported |  | pass | For an API-level subscription held by Loan Bridge, which contained operations and dependencies enter scope? |
| 1302 | template-unfilled | clarification_required |  | pass | For an API-level subscription held by {consumer}, which contained operations and dependencies enter scope? |
| 1303 | template-filled | answered |  | pass | For External or Partner operations, which internal services, databases, tables, and events lie downstream? |
| 1304 | template-filled | clarification_required |  | pass | For PII- or PCI-classified operations, which databases, tables, events, and called operations may participate in processing? |
| 1305 | template-filled | unsupported |  | pass | For operations protected by OAuth 2, which downstream services and data stores are reachable? |
| 1306 | template-filled | unsupported |  | pass | For operations protected by OAuth 2, which downstream services and data stores are reachable? |
| 1307 | template-unfilled | clarification_required |  | pass | For operations protected by {security_control}, which downstream services and data stores are reachable? |
| 1308 | template-filled | unsupported |  | pass | For operations accepting institution, which runtime dependencies execute behind them? |
| 1309 | template-filled | answered |  | pass | For operations accepting GetAggregationCustomerTransactionByTransactionIdResponse_200, which runtime dependencies execute behind them? |
| 1310 | template-unfilled | clarification_required |  | pass | For operations accepting {contract_element}, which runtime dependencies execute behind them? |
| 1311 | template-filled | clarification_required |  | pass | For operations returning institution, which services, databases, and events are associated with them? |
| 1312 | template-filled | clarification_required |  | pass | For operations returning GetAggregationCustomerTransactionByTransactionIdResponse_200, which services, databases, and events are associated with them? |
| 1313 | template-unfilled | clarification_required |  | pass | For operations returning {response_element}, which services, databases, and events are associated with them? |
| 1314 | template-filled | unsupported |  | pass | Across versions of Mortgage Loan API, how do service assignments, routes, calls, database dependencies, and event outputs differ? |
| 1315 | template-filled | unsupported |  | pass | Across versions of Mortgage Loan API, how do service assignments, routes, calls, database dependencies, and event outputs differ? |
| 1316 | template-unfilled | clarification_required |  | pass | Across versions of {api_name}, how do service assignments, routes, calls, database dependencies, and event outputs differ? |
| 1317 | template-filled | clarification_required |  | pass | Which application-level operation sets associated with a capability call or route to operations whose containing APIs are exposed by a different application? |
| 1318 | template-filled | clarification_required |  | pass | Where do two top-down paths converge on the same database, event, or callee operation? |
| 1319 | template-filled | answered |  | pass | What is the shortest complete path from payments-app to banking_demo-postgres? |
| 1320 | template-filled | answered |  | pass | What is the shortest complete path from Mortgage Loan API to redis-redis? |
| 1321 | template-unfilled | clarification_required |  | pass | What is the shortest complete path from {business_or_api_root} to {runtime_target}? |
| 1322 | template-filled | unsupported |  | pass | Starting from List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications, which endpoint, version, API, application, capability, business hierarchy, and team are upstream? |
| 1323 | template-filled | unsupported |  | pass | Starting from Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id, which endpoint, version, API, application, capability, business hierarchy, and team are upstream? |
| 1324 | template-unfilled | clarification_required |  | pass | Starting from {operation}, which endpoint, version, API, application, capability, business hierarchy, and team are upstream? |
| 1325 | template-filled | unsupported |  | pass | Starting from customer-channel-app, which operations, APIs, applications, capabilities, areas, and teams map back to it? |
| 1326 | template-filled | unsupported |  | pass | Starting from customer-channel-app, which operations, APIs, applications, capabilities, areas, and teams map back to it? |
| 1327 | template-unfilled | clarification_required |  | pass | Starting from {service}, which operations, APIs, applications, capabilities, areas, and teams map back to it? |
| 1328 | template-filled | no_evidence |  | pass | Starting from banking_demo-postgres, which operations and events connect, read, write, or update it, separated by access mode? |
| 1329 | template-filled | answered |  | pass | Starting from redis-redis, which operations and events connect, read, write, or update it, separated by access mode? |
| 1330 | template-unfilled | clarification_required |  | pass | Starting from {database}, which operations and events connect, read, write, or update it, separated by access mode? |
| 1331 | template-filled | no_evidence |  | pass | Starting from banking_demo-postgres, which callers and routes lead back to API entry points and consumers? |
| 1332 | template-filled | no_evidence |  | pass | Starting from redis-redis, which callers and routes lead back to API entry points and consumers? |
| 1333 | template-unfilled | clarification_required |  | pass | Starting from {database}, which callers and routes lead back to API entry points and consumers? |
| 1334 | template-filled | unsupported |  | pass | Starting from banking_demo-postgres, which applications, capabilities, business areas, and teams depend on it? |
| 1335 | template-filled | unsupported |  | pass | Starting from redis-redis, which applications, capabilities, business areas, and teams depend on it? |
| 1336 | template-unfilled | clarification_required |  | pass | Starting from {database}, which applications, capabilities, business areas, and teams depend on it? |
| 1337 | template-filled | unsupported |  | pass | Starting from operations_openfinance.business_state, which queries, operations, services, APIs, consumers, capabilities, and teams touch it? |
| 1338 | template-filled | unsupported |  | pass | Starting from operations_openfinance.business_state, which queries, operations, services, APIs, consumers, capabilities, and teams touch it? |
| 1339 | template-unfilled | clarification_required |  | pass | Starting from {table_name}, which queries, operations, services, APIs, consumers, capabilities, and teams touch it? |
| 1340 | template-filled | clarification_required |  | pass | Starting from INSERT INTO operations_openfinance.business_state(business_key,endpoint_id,correlation_id,state,payload) VALUES($1,$2,$3,'PROCESSED',$4::jsonb) ON CONFLICT(business_key) DO UPDATE SET state='PROCESSED',payload=EXCLUDED.payload,version=business_state.version+1,updated_at=now(), which edge, operation or event, database, and upstream context produced it? |
| 1341 | template-filled | clarification_required |  | pass | Starting from INSERT INTO operations_openfinance.business_state(business_key,endpoint_id,correlation_id,state,payload) VALUES($1,$2,$3,'PROCESSED',$4::jsonb) ON CONFLICT(business_key) DO UPDATE SET state='PROCESSED',payload=EXCLUDED.payload,version=business_state.version+1,updated_at=now(), which edge, operation or event, database, and upstream context produced it? |
| 1342 | template-unfilled | clarification_required |  | pass | Starting from {query}, which edge, operation or event, database, and upstream context produced it? |
| 1343 | template-filled | unsupported |  | pass | Starting from banking.api.events-unknown, which operations or events produced it? |
| 1344 | template-filled | unsupported |  | pass | Starting from banking.workflow.commands-unknown, which operations or events produced it? |
| 1345 | template-unfilled | clarification_required |  | pass | Starting from {event}, which operations or events produced it? |
| 1346 | template-filled | unsupported |  | pass | Starting from banking.api.events-unknown, which APIs, consumers, applications, capabilities, and teams sit upstream of its producers? |
| 1347 | template-filled | unsupported |  | pass | Starting from banking.workflow.commands-unknown, which APIs, consumers, applications, capabilities, and teams sit upstream of its producers? |
| 1348 | template-unfilled | clarification_required |  | pass | Starting from {event}, which APIs, consumers, applications, capabilities, and teams sit upstream of its producers? |
| 1349 | template-filled | no_evidence |  | pass | Starting from an operation called by banking.api.events-unknown, which downstream database and event effects follow? |
| 1350 | template-filled | answered |  | pass | Starting from an operation called by banking.workflow.commands-unknown, which downstream database and event effects follow? |
| 1351 | template-unfilled | clarification_required |  | pass | Starting from an operation called by {event}, which downstream database and event effects follow? |
| 1352 | template-filled | answered |  | pass | Starting from callee List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications, which operations, events, or databases call it directly or transitively? |
| 1353 | template-filled | answered |  | pass | Starting from callee Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id, which operations, events, or databases call it directly or transitively? |
| 1354 | template-unfilled | clarification_required |  | pass | Starting from callee {operation}, which operations, events, or databases call it directly or transitively? |
| 1355 | template-filled | answered |  | pass | Starting from routed target List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications, which gateway or intermediate operations feed it? |
| 1356 | template-filled | answered |  | pass | Starting from routed target Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id, which gateway or intermediate operations feed it? |
| 1357 | template-unfilled | clarification_required |  | pass | Starting from routed target {operation}, which gateway or intermediate operations feed it? |
| 1358 | template-filled | clarification_required |  | pass | Starting from List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications, which consumers subscribe directly and which subscribe to its parent API? |
| 1359 | template-filled | clarification_required |  | pass | Starting from Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id, which consumers subscribe directly and which subscribe to its parent API? |
| 1360 | template-unfilled | clarification_required |  | pass | Starting from {operation}, which consumers subscribe directly and which subscribe to its parent API? |
| 1361 | template-filled | answered |  | pass | Starting from banking_demo-postgres, which External, Partner, PII, or PCI operation surfaces can reach it? |
| 1362 | template-filled | answered |  | pass | Starting from redis-redis, which External, Partner, PII, or PCI operation surfaces can reach it? |
| 1363 | template-unfilled | clarification_required |  | pass | Starting from {database_or_event}, which External, Partner, PII, or PCI operation surfaces can reach it? |
| 1364 | template-filled | unsupported |  | pass | Starting from banking_demo-postgres, which request and response contract elements are attached to its upstream operations? |
| 1365 | template-filled | unsupported |  | pass | Starting from redis-redis, which request and response contract elements are attached to its upstream operations? |
| 1366 | template-unfilled | clarification_required |  | pass | Starting from {database_or_event}, which request and response contract elements are attached to its upstream operations? |
| 1367 | template-filled | unsupported |  | pass | Starting from an error-bearing route or call, which consumers, APIs, applications, capabilities, and teams lie upstream? |
| 1368 | template-filled | answered |  | pass | Starting from a concrete-path operation, which wildcard, canonical, gateway, or microservice variants represent the same logical operation? |
| 1369 | template-filled | unsupported |  | pass | Starting from an unknown-host database or event, which runtime and business contexts rely on the unresolved infrastructure identity? |
| 1370 | template-filled | unsupported |  | pass | Which runtime dependency has the largest reverse fan-in from operations, APIs, consumers, capabilities, or teams? |
| 1371 | template-filled | no_evidence |  | pass | What is the shortest evidence path from banking_demo-postgres back to Accounts and Deposits? |
| 1372 | template-filled | no_evidence |  | pass | What is the shortest evidence path from redis-redis back to Open Finance Gateway? |
| 1373 | template-unfilled | clarification_required |  | pass | What is the shortest evidence path from {runtime_target} back to {consumer_or_business_owner}? |
| 1374 | template-filled | answered |  | pass | Which Runtime edges have the highest observed callCount? |
| 1375 | template-filled | answered |  | pass | Which Runtime edges have a nonzero errorCount? |
| 1376 | template-filled | answered |  | pass | What is errorCount divided by callCount for each error-bearing edge? |
| 1377 | template-filled | clarification_required |  | pass | Which relationships were seen most recently or least recently according to lastSeen? |
| 1378 | template-filled | unsupported |  | pass | Which relationships appear stale relative to the graph's generatedAt timestamp and a supplied threshold? |
| 1379 | template-filled | answered |  | pass | How are callCount and errorCount distributed by relationship type? |
| 1380 | template-filled | answered |  | pass | How are callCount and errorCount distributed by source service, service category, database, event, API, or business area? |
| 1381 | template-filled | answered |  | pass | Which path and method combinations have the highest observed callCount on ROUTES-TO or CALLS edges? |
| 1382 | template-filled | clarification_required |  | pass | Which services have the highest aggregate observed callCount on their route and call edges, with the aggregation rule stated? |
| 1383 | template-filled | clarification_required |  | pass | Which databases have the highest aggregate observed read, write, update, or connection callCount, with the aggregation rule stated? |
| 1384 | template-filled | clarification_required |  | pass | Which tables have the highest aggregate observed read or write callCount where tableName is populated, with the aggregation rule stated? |
| 1385 | template-filled | clarification_required |  | pass | Which event destinations have the highest aggregate observed production callCount, with the aggregation rule stated? |
| 1386 | template-filled | unsupported |  | pass | Which consumers' reachable operation sets include error-bearing routes? |
| 1387 | template-filled | answered |  | pass | Which External, PII, or PCI operations have an error-bearing Runtime path? |
| 1388 | template-filled | unsupported |  | pass | Which teams or business capabilities roll up to the observed error-bearing paths? |
| 1389 | template-filled | clarification_required |  | pass | Which edges have the greatest stored depth, and which source and target does each edge connect? |
| 1390 | template-filled | answered |  | pass | What are the stored edge-depth distribution and the independently computed graph-hop distribution when reported as non-equivalent measures? |
| 1391 | template-filled | answered |  | pass | Which duplicate logical operations have divergent callCount, errorCount, or lastSeen observations? |
| 1392 | template-filled | unsupported |  | pass | Which runtime relationships have telemetry attributes missing or structurally inconsistent for their edge type? |
| 1393 | template-filled | clarification_required |  | pass | What portion of the Runtime topology has any observed telemetry versus only static relationship evidence? |
| 1394 | template-filled | answered |  | pass | If List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications is used as an outage root, which direct callers, routed callers, event-call paths, consumers, APIs, applications, capabilities, domains, areas, and teams are structurally in scope? |
| 1395 | template-filled | answered |  | pass | If Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id is used as an outage root, which direct callers, routed callers, event-call paths, consumers, APIs, applications, capabilities, domains, areas, and teams are structurally in scope? |
| 1396 | template-unfilled | clarification_required |  | pass | If {operation} is used as an outage root, which direct callers, routed callers, event-call paths, consumers, APIs, applications, capabilities, domains, areas, and teams are structurally in scope? |
| 1397 | template-filled | answered |  | pass | If List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications fails, which downstream operations, databases, tables, and event destinations fall within its dependency-side impact scope? |
| 1398 | template-filled | answered |  | pass | If Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id fails, which downstream operations, databases, tables, and event destinations fall within its dependency-side impact scope? |
| 1399 | template-unfilled | clarification_required |  | pass | If {operation} fails, which downstream operations, databases, tables, and event destinations fall within its dependency-side impact scope? |
| 1400 | template-filled | answered |  | pass | What are the separate upstream-dependent and downstream-dependency sides of List Banking Cross Channel Party Authentication Operations Tion Create Party Authentications's blast radius within 3? |
| 1401 | template-filled | answered |  | pass | What are the separate upstream-dependent and downstream-dependency sides of Get Banking Treasury Balance Sheet Management By Balance Sheet Management Id's blast radius within 0? |
| 1402 | template-unfilled | clarification_required |  | pass | What are the separate upstream-dependent and downstream-dependency sides of {operation}'s blast radius within {max_depth}? |
| 1403 | template-filled | clarification_required |  | pass | If every operation belonging to customer-channel-app fails, which consumers, APIs, applications, capabilities, databases, and events are in scope? |
| 1404 | template-filled | clarification_required |  | pass | If every operation belonging to customer-channel-app fails, which consumers, APIs, applications, capabilities, databases, and events are in scope? |
| 1405 | template-unfilled | clarification_required |  | pass | If every operation belonging to {service} fails, which consumers, APIs, applications, capabilities, databases, and events are in scope? |
| 1406 | template-filled | clarification_required | no_evidence | pass | If a gateway operation fails, which routed gateway or microservice operations and downstream data/event dependencies are affected? |
| 1407 | template-filled | unsupported |  | pass | For the generic GATEWAY deployment category, which linked operations, endpoints, APIs, consumers, and capability rollups form its structural scope? |
| 1408 | template-filled | answered |  | pass | For the generic MICROSERVICE deployment category, which linked operations and upstream API entry points form its structural scope? |
| 1409 | template-filled | answered |  | pass | Which operations have both gateway and microservice deployment edges, and how should their radius be deduplicated? |
| 1410 | template-filled | unsupported |  | pass | If a high-fan-in callee is used as an outage root, which caller operations and application-level associated business capabilities are in its reverse structural scope? |
| 1411 | template-filled | clarification_required |  | pass | If a route target fails, which gateway paths, methods, consumers, APIs, and capabilities are in its reverse dependency radius? |
| 1412 | template-filled | unsupported |  | pass | If customer-channel-app is migrated, which routes, calls, data access, event production, API contracts, and business-owner rollups fall within migration or retest scope? |
| 1413 | template-filled | unsupported |  | pass | If customer-channel-app is migrated, which routes, calls, data access, event production, API contracts, and business-owner rollups fall within migration or retest scope? |
| 1414 | template-unfilled | clarification_required |  | pass | If {service} is migrated, which routes, calls, data access, event production, API contracts, and business-owner rollups fall within migration or retest scope? |
| 1415 | template-filled | answered |  | pass | If banking_demo-postgres fails, which operations and events are affected, separated by connect, read, write, and update relationship? |
| 1416 | template-filled | answered |  | pass | If redis-redis fails, which operations and events are affected, separated by connect, read, write, and update relationship? |
| 1417 | template-unfilled | clarification_required |  | pass | If {database} fails, which operations and events are affected, separated by connect, read, write, and update relationship? |
| 1418 | template-filled | answered |  | pass | If banking_demo-postgres fails, which upstream callers, routes, consumers, APIs, applications, capabilities, areas, and teams are transitively affected? |
| 1419 | template-filled | answered |  | pass | If redis-redis fails, which upstream callers, routes, consumers, APIs, applications, capabilities, areas, and teams are transitively affected? |
| 1420 | template-unfilled | clarification_required |  | pass | If {database} fails, which upstream callers, routes, consumers, APIs, applications, capabilities, areas, and teams are transitively affected? |
| 1421 | template-filled | clarification_required |  | pass | If host postgres fails, which distinct logical databases and Runtime paths share that host? |
| 1422 | template-filled | clarification_required |  | pass | If host postgres fails, which distinct logical databases and Runtime paths share that host? |
| 1423 | template-unfilled | clarification_required |  | pass | If host {host} fails, which distinct logical databases and Runtime paths share that host? |
| 1424 | template-filled | clarification_required | no_evidence | pass | If operations_openfinance.business_state changes or becomes unavailable, which readers, writers, updaters, APIs, capabilities, and consumers are exposed? |
| 1425 | template-filled | clarification_required | no_evidence | pass | If operations_openfinance.business_state changes or becomes unavailable, which readers, writers, updaters, APIs, capabilities, and consumers are exposed? |
| 1426 | template-unfilled | clarification_required |  | pass | If {table_name} changes or becomes unavailable, which readers, writers, updaters, APIs, capabilities, and consumers are exposed? |
| 1427 | template-filled | clarification_required |  | pass | If a database schema change invalidates INSERT INTO operations_openfinance.business_state(business_key,endpoint_id,correlation_id,state,payload) VALUES($1,$2,$3,'PROCESSED',$4::jsonb) ON CONFLICT(business_key) DO UPDATE SET state='PROCESSED',payload=EXCLUDED.payload,version=business_state.version+1,updated_at=now(), which exact operations or events execute it and what is their reverse blast radius? |
| 1428 | template-filled | clarification_required |  | pass | If a database schema change invalidates INSERT INTO operations_openfinance.business_state(business_key,endpoint_id,correlation_id,state,payload) VALUES($1,$2,$3,'PROCESSED',$4::jsonb) ON CONFLICT(business_key) DO UPDATE SET state='PROCESSED',payload=EXCLUDED.payload,version=business_state.version+1,updated_at=now(), which exact operations or events execute it and what is their reverse blast radius? |
| 1429 | template-unfilled | clarification_required |  | pass | If a database schema change invalidates {query}, which exact operations or events execute it and what is their reverse blast radius? |
| 1430 | template-filled | unsupported |  | pass | Which databases are single points of concentration by distinct operation, API, consumer, or capability fan-in? |
| 1431 | template-filled | answered |  | pass | Which business areas share banking_demo-postgres, causing an outage radius to cross organizational boundaries? |
| 1432 | template-filled | answered |  | pass | Which business areas share redis-redis, causing an outage radius to cross organizational boundaries? |
| 1433 | template-unfilled | clarification_required |  | pass | Which business areas share {database}, causing an outage radius to cross organizational boundaries? |
| 1434 | template-filled | clarification_required |  | pass | How does banking_demo-postgres's outage radius differ when restricted to direct users versus callers of those users? |
| 1435 | template-filled | clarification_required |  | pass | How does redis-redis's outage radius differ when restricted to direct users versus callers of those users? |
| 1436 | template-unfilled | clarification_required |  | pass | How does {database}'s outage radius differ when restricted to direct users versus callers of those users? |
| 1437 | template-filled | clarification_required |  | pass | Which data-change impact paths reach PII-, PCI-, External-, or Partner-classified operations? |
| 1438 | template-filled | unsupported |  | pass | What part of table-level blast radius is unknown because tableName is absent on relevant edges? |
| 1439 | template-filled | answered |  | pass | If banking.api.events-unknown is unavailable, which producer operations, event flows, called operations, databases, APIs, and capabilities are affected? |
| 1440 | template-filled | answered |  | pass | If banking.workflow.commands-unknown is unavailable, which producer operations, event flows, called operations, databases, APIs, and capabilities are affected? |
| 1441 | template-unfilled | clarification_required |  | pass | If {event} is unavailable, which producer operations, event flows, called operations, databases, APIs, and capabilities are affected? |
| 1442 | template-filled | unsupported |  | pass | If banking.api.events-unknown's contract changes, which producers, consuming events, called operations, and upstream consumers require review? |
| 1443 | template-filled | unsupported |  | pass | If banking.workflow.commands-unknown's contract changes, which producers, consuming events, called operations, and upstream consumers require review? |
| 1444 | template-unfilled | clarification_required |  | pass | If {event}'s contract changes, which producers, consuming events, called operations, and upstream consumers require review? |
| 1445 | template-filled | unsupported |  | pass | If a Kafka or RabbitMQ host fails, which event destinations and producer/called-operation paths share it? |
| 1446 | template-filled | no_evidence |  | pass | If an operation called by banking.api.events-unknown is used as an outage root, which event-call edge and downstream database writes or produced events fall within structural scope? |
| 1447 | template-filled | answered |  | pass | If an operation called by banking.workflow.commands-unknown is used as an outage root, which event-call edge and downstream database writes or produced events fall within structural scope? |
| 1448 | template-unfilled | clarification_required |  | pass | If an operation called by {event} is used as an outage root, which event-call edge and downstream database writes or produced events fall within structural scope? |
| 1449 | template-filled | unsupported |  | pass | Which event self-loops or event cycles require cycle-safe handling in a blast-radius calculation? |
| 1450 | template-filled | answered |  | pass | Which business areas and teams share banking.api.events-unknown through different producer operations? |
| 1451 | template-filled | answered |  | pass | Which business areas and teams share banking.workflow.commands-unknown through different producer operations? |
| 1452 | template-unfilled | clarification_required |  | pass | Which business areas and teams share {event} through different producer operations? |
| 1453 | template-filled | unsupported |  | pass | Which event has the broadest reverse producer, API, consumer, and business radius? |
| 1454 | template-filled | unsupported |  | pass | What part of event blast radius is unknowable because message schemas, consumer groups, or delivery semantics are absent? |
| 1455 | template-filled | answered |  | pass | If v1 is retired, which runtime operations, services, routes, callees, databases, events, and consumers are affected? |
| 1456 | template-filled | answered |  | pass | If v5 is retired, which runtime operations, services, routes, callees, databases, events, and consumers are affected? |
| 1457 | template-unfilled | clarification_required |  | pass | If {api_version} is retired, which runtime operations, services, routes, callees, databases, events, and consumers are affected? |
| 1458 | template-filled | no_evidence |  | pass | If request institution changes, which operations and downstream Runtime paths may be affected? |
| 1459 | template-filled | no_evidence |  | pass | If request GetAggregationCustomerTransactionByTransactionIdResponse_200 changes, which operations and downstream Runtime paths may be affected? |
| 1460 | template-unfilled | clarification_required |  | pass | If request {schema_or_field_or_header_or_parameter} changes, which operations and downstream Runtime paths may be affected? |
| 1461 | template-filled | unsupported |  | pass | If response institution changes, which operations, APIs, and subscribed consumers are affected? |
| 1462 | template-filled | no_evidence |  | pass | If response GetAggregationCustomerTransactionByTransactionIdResponse_200 changes, which operations, APIs, and subscribed consumers are affected? |
| 1463 | template-unfilled | clarification_required |  | pass | If response {schema_or_field_or_header_or_status_code} changes, which operations, APIs, and subscribed consumers are affected? |
| 1464 | template-filled | unsupported |  | pass | If OAuth 2 changes, which operations, consumers, APIs, capabilities, and downstream dependencies are in scope? |
| 1465 | template-filled | unsupported |  | pass | If OAuth 2 changes, which operations, consumers, APIs, capabilities, and downstream dependencies are in scope? |
| 1466 | template-unfilled | clarification_required |  | pass | If {security_control} changes, which operations, consumers, APIs, capabilities, and downstream dependencies are in scope? |
| 1467 | template-filled | answered |  | pass | Which databases, events, and callees lie in the downstream radius of External PII or PCI operations? |
| 1468 | template-filled | unsupported |  | pass | If Open Finance Gateway is removed or compromised, which subscribed operations and API-derived Runtime paths are in scope? |
| 1469 | template-filled | unsupported |  | pass | If Loan Bridge is removed or compromised, which subscribed operations and API-derived Runtime paths are in scope? |
| 1470 | template-unfilled | clarification_required |  | pass | If {consumer} is removed or compromised, which subscribed operations and API-derived Runtime paths are in scope? |
| 1471 | template-filled | unsupported |  | pass | If payments-app is decommissioned, which operations, shared callees, databases, events, consumers, and capabilities are affected? |
| 1472 | template-filled | answered |  | pass | If customer-channel-app is decommissioned, which operations, shared callees, databases, events, consumers, and capabilities are affected? |
| 1473 | template-unfilled | clarification_required |  | pass | If {application} is decommissioned, which operations, shared callees, databases, events, consumers, and capabilities are affected? |
| 1474 | template-filled | clarification_required |  | pass | If Manage customer billing is retired, which services and shared Runtime resources are exclusively or jointly associated with it? |
| 1475 | template-filled | clarification_required |  | pass | If Manage card service cases is retired, which services and shared Runtime resources are exclusively or jointly associated with it? |
| 1476 | template-unfilled | clarification_required |  | pass | If {business_capability} is retired, which services and shared Runtime resources are exclusively or jointly associated with it? |
| 1477 | template-filled | clarification_required | answered | pass | Which team's owned capabilities have the broadest Runtime blast radius by unique operations, services, databases, events, APIs, and consumers? |
| 1478 | template-filled | answered |  | pass | Which dependency roots have the greatest callCount-weighted structural scope under an explicitly stated aggregation rule? |
| 1479 | template-filled | no_evidence |  | pass | Which error-bearing routes have the greatest reverse consumer and business blast radius? |
| 1480 | template-filled | answered |  | pass | Which stale dependencies have a broad blast radius if they remain active despite an old lastSeen value? |
| 1481 | template-filled | unsupported |  | pass | Which cycles and self-loops could amplify or confuse an unbounded impact traversal? |
| 1482 | template-filled | unsupported |  | pass | Which two or more failed databases, events, services, or operations affect the largest overlapping dependent set? |
| 1483 | template-filled | unsupported |  | pass | What is the union, intersection, and root-specific remainder of the blast radii for database:postgresql:banking_demo:postgres, database:redis:unspecified:redis? |
| 1484 | template-filled | unsupported |  | pass | What is the union, intersection, and root-specific remainder of the blast radii for database:redis:unspecified:redis, event:kafka:banking.api.events:unknown? |
| 1485 | template-unfilled | clarification_required |  | pass | What is the union, intersection, and root-specific remainder of the blast radii for {runtime_node_set}? |
| 1486 | template-filled | unsupported |  | pass | Which dependencies look like structural single points of failure because they have high reverse fan-in and no alternate path represented? |
| 1487 | template-filled | answered |  | pass | How does the radius change when duplicate gateway and microservice representations of one logical operation are collapsed? |
| 1488 | template-filled | clarification_required |  | pass | What blast-radius calculations omit or terminate at the isolated operation and telemetry-only operation? |
| 1489 | template-filled | clarification_required |  | pass | What is the blast radius of all database or event nodes whose host is unknown, and which impacts cannot be assigned to concrete infrastructure? |
| 1490 | template-filled | clarification_required |  | pass | Which affected nodes are direct, which are transitive, and which are business/API context rollups only? |
| 1491 | template-filled | clarification_required | no_evidence | pass | Which impact evidence paths have nonzero errorCount, high callCount, recent lastSeen, or high stored depth? |
