import { icon } from "./ui-controls.js";

const PLACEHOLDERS = /\{([a-z][a-z0-9_]*)\}/g;
const mentionOf = (target) => (target instanceof Element ? /** @type {HTMLElement | null} */ (target.closest(".mention")) : null);

/**
 * Sigma's composer: plain text that can hold inline entity tokens, like mentions in Slack.
 * Question templates insert one token per placeholder; clicking a token lets the user choose its entity.
 * @param {HTMLElement} element contenteditable host
 * @param {{ onSubmit: () => void, onTokenClick: (token: HTMLElement) => void, onChange?: () => void }} options
 */
export function createComposer(element, { onSubmit, onTokenClick, onChange = () => {} }) {
  const sync = () => {
    element.classList.toggle("is-empty", !element.textContent.trim() && !element.querySelector(".mention"));
    onChange();
  };
  element.addEventListener("input", sync);
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      onSubmit();
    }
  });
  // Pasted content stays plain text so no foreign markup lands in the question.
  element.addEventListener("paste", (event) => {
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData?.getData("text/plain") || "");
  });
  element.addEventListener("click", (event) => {
    const token = mentionOf(event.target);
    if (token) onTokenClick(token);
  });
  element.addEventListener("keydown", (event) => {
    const token = mentionOf(event.target);
    if (token && ["Enter", " ", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
      onTokenClick(token);
    }
  }, true);

  const makeToken = (name, label) => {
    const token = document.createElement("span");
    token.className = "mention is-empty";
    token.contentEditable = "false";
    token.tabIndex = 0;
    token.setAttribute("role", "button");
    token.setAttribute("aria-haspopup", "listbox");
    token.setAttribute("aria-label", `${label}, choose a value`);
    token.dataset.token = name;
    token.dataset.label = label;
    const lead = document.createElement("span");
    lead.className = "mention-lead";
    const text = document.createElement("span");
    text.className = "mention-label";
    text.textContent = label;
    const caret = icon("chevron");
    caret.classList.add("mention-caret");
    token.append(lead, text, caret);
    return token;
  };

  const placeCaretAtEnd = () => {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  return {
    element,
    focus() {
      element.focus({ preventScroll: true });
      placeCaretAtEnd();
    },
    clear() {
      element.replaceChildren();
      sync();
    },
    /**
     * Replaces the content with a question. `{name}` placeholders with a label become tokens;
     * the rest stay as typed text.
     * @param {string} template
     * @param {(name: string) => string | null} labelFor
     */
    setTemplate(template, labelFor) {
      element.replaceChildren();
      let last = 0;
      for (const match of String(template).matchAll(PLACEHOLDERS)) {
        const label = labelFor(match[1]);
        if (!label) continue;
        if (match.index > last) element.append(document.createTextNode(template.slice(last, match.index)));
        element.append(makeToken(match[1], label));
        last = match.index + match[0].length;
      }
      if (last < template.length) element.append(document.createTextNode(template.slice(last)));
      if (element.querySelector(".mention")) element.append(document.createTextNode(" "));
      sync();
    },
    /**
     * @param {HTMLElement} token
     * @param {{ id: string, name?: string, type?: string }} entity
     * @param {Element | null} lead
     */
    fillToken(token, entity, lead = null) {
      const name = String(entity.name || entity.id);
      token.classList.remove("is-empty");
      token.dataset.id = String(entity.id);
      token.dataset.name = name;
      token.dataset.type = entity.type || "";
      token.querySelector(".mention-lead")?.replaceChildren(...(lead ? [lead] : []));
      const label = token.querySelector(".mention-label");
      if (label) label.textContent = name;
      token.setAttribute("aria-label", `${name}, change`);
      sync();
    },
    emptyTokens() {
      return /** @type {HTMLElement[]} */ ([...element.querySelectorAll(".mention.is-empty")]);
    },
    /** IDs of the entities chosen into tokens. */
    filledIds() {
      return /** @type {HTMLElement[]} */ ([...element.querySelectorAll(".mention:not(.is-empty)")]).map((token) => token.dataset.id || "");
    },
    /** The question text: chosen names in place of filled tokens, `{placeholder}` for empty ones. */
    value() {
      const parts = [];
      const walk = (node) => {
        for (const child of node.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) parts.push(child.textContent.replace(/ /g, " "));
          else if (child instanceof HTMLElement && child.classList.contains("mention")) parts.push(child.classList.contains("is-empty") ? `{${child.dataset.token}}` : child.dataset.name);
          else if (child instanceof HTMLElement && child.tagName === "BR") parts.push("\n");
          else if (child instanceof HTMLElement) { if (parts.length) parts.push("\n"); walk(child); }
        }
      };
      walk(element);
      return parts.join("").replace(/[ \t]+/g, " ").trim();
    },
  };
}
