import { icon } from "./ui-controls.js";

/** Keep the bulk action in sync with both catalog trees and entity-scoped groups. */
export function connectCatalogExpansion(root, button, createIcon = icon) {
  const groups = () => [...root.querySelectorAll(".planner-tree-section, .planner-context-questions")];
  const isDetails = group => group.matches(".planner-context-questions");
  const isOpen = group => isDetails(group) ? group.open : group.classList.contains("expanded");
  // An open descendant under a closed layer is not visibly expanded.
  const hasOpenGroup = items => items.some(group => group.parentElement === root && isOpen(group));
  const sync = () => {
    const items = groups();
    const expanded = hasOpenGroup(items);
    const label = `${expanded ? "Collapse" : "Expand"} all question groups`;
    button.disabled = !items.length;
    button.setAttribute("aria-controls", root.id);
    button.setAttribute("aria-expanded", String(expanded));
    button.setAttribute("aria-label", label);
    button.title = label;
    button.replaceChildren(createIcon(expanded ? "collapse" : "expand"));
  };
  button.addEventListener("click", () => {
    const items = groups();
    const open = !hasOpenGroup(items);
    for (const group of items) {
      if (isDetails(group)) group.open = open;
      else {
        group.classList.toggle("expanded", open);
        group.querySelector(".planner-tree-toggle")?.setAttribute("aria-expanded", String(open));
      }
    }
    sync();
  });
  // Tree buttons update before this bubbling listener; native details use toggle.
  root.addEventListener("click", sync);
  root.addEventListener("toggle", sync, true);
  sync();
  return { sync };
}
