/** Real-snapshot examples. Named templates are fully filled, but remain editable drafts. */
export const STARTER_QUESTIONS = [
  { id: "inventory", category: "Start Here", question: "Which applications and APIs exist?" },
  { id: "api-count", category: "Start Here", question: "How many APIs exist?" },
  { id: "portfolio", category: "Prefilled Example", template: "Which APIs are associated with {business_area}?", parameters: { business_area: "Accounts and Deposits" }, fallback: "Which applications expose APIs?" },
  { id: "database-readers", category: "Prefilled Example", template: "Which operations read from {database}?", parameters: { database: "banking_demo-postgres" }, fallback: "Which databases exist?" },
  { id: "both-classifications", category: "Multiple Conditions", question: "Which operations under Accounts and Deposits are classified as PII and PCI?", fallback: "Which operations are classified as PII and PCI?" },
  { id: "classification-exclusion", category: "Multiple Conditions", question: "Which operations under Accounts and Deposits are classified as PII but not PCI?", fallback: "Which operations are classified as PII but not PCI?" },
  { id: "exclusive-classifications", category: "Advanced Investigation", question: "Which operations under Accounts and Deposits are classified as (PII or PCI) and not (PII and PCI)?", fallback: "Which operations are classified as (PII or PCI) and not (PII and PCI)?" },
  { id: "portfolio-comparison", category: "Compare Portfolios", question: "Compare operations under Accounts and Deposits versus business domain Cards", fallback: "Which operations are classified as neither PII nor PCI?" },
];

export function starterQuestionsForGraph(graphId) {
  return STARTER_QUESTIONS.map(item => {
    const useFallback = graphId !== "merged-graph-v4" && Boolean(item.fallback);
    const question = useFallback ? item.fallback : item.template
      ? item.template.replace(/\{([^}]+)\}/g, (_match, key) => item.parameters[key]) : item.question;
    return { ...item, category: useFallback ? "Explore This Graph" : item.category, question };
  });
}

export function renderStarterQuestions(container, graphId, onSelect) {
  container.replaceChildren();
  for (const item of starterQuestionsForGraph(graphId)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.starterId = item.id;
    const copy = document.createElement("span");
    const category = document.createElement("small");
    category.textContent = item.category;
    const question = document.createElement("span");
    question.textContent = item.question;
    copy.append(category, question);
    const arrow = document.createElement("i");
    arrow.textContent = "↗";
    arrow.setAttribute("aria-hidden", "true");
    button.append(copy, arrow);
    button.title = "Use this question as an editable draft";
    button.addEventListener("click", () => onSelect(item.question));
    container.append(button);
  }
}
