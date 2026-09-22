import { icon } from "./ui-controls.js";
import { searchOptionPage } from "./search-options.js";

/** Editable combobox. The popup is portalled so scrolling panels never clip it. */
export class SearchDropdown {
  constructor({ input, button, label, getOptions, onSelect, emptyMessage = () => "No matches. Try another search." }) {
    this.input = input;
    this.button = button;
    this.getOptions = getOptions;
    this.onSelect = onSelect;
    this.emptyMessage = emptyMessage;
    this.active = -1;
    this.opened = false;
    this.suppressFocus = false;
    this.options = [];
    this.rows = [];
    this.wrapper = input.closest(".planner-search");
    this.popup = document.createElement("div");
    this.popup.className = "search-dropdown";
    this.popup.hidden = true;
    this.heading = document.createElement("div");
    this.heading.className = "search-dropdown-heading";
    this.heading.setAttribute("role", "status");
    this.list = document.createElement("div");
    this.list.className = "search-dropdown-list";
    this.list.id = `${input.id}-options`;
    this.list.setAttribute("role", "listbox");
    this.list.setAttribute("aria-label", label);
    this.popup.append(this.heading, this.list);
    document.querySelector("#app").append(this.popup);
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-haspopup", "listbox");
    for (const control of [input, button]) {
      control.setAttribute("aria-controls", this.list.id);
      control.setAttribute("aria-expanded", "false");
    }
    button.append(icon("chevron"));
    input.addEventListener("focus", () => { if (!this.suppressFocus) this.open(); });
    input.addEventListener("input", () => this.open());
    input.addEventListener("keydown", event => {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        if (!this.opened) this.open();
        this.activate(event.key === "ArrowDown" ? Math.min(this.active + 1, this.rows.length - 1) : this.active < 0 ? this.rows.length - 1 : Math.max(0, this.active - 1));
      } else if (event.key === "Enter" && this.opened && this.active >= 0) {
        event.preventDefault(); this.choose(this.active);
      } else if (event.key === "Escape" && this.opened) {
        event.preventDefault(); event.stopPropagation(); this.close();
      } else if (event.key === "Tab") this.close();
    });
    input.addEventListener("blur", event => { if (event.relatedTarget !== button) this.close(); });
    button.addEventListener("pointerdown", event => event.preventDefault());
    button.addEventListener("click", () => {
      const wasOpen = this.opened;
      this.suppressFocus = true;
      input.focus({ preventScroll: true });
      this.suppressFocus = false;
      if (wasOpen) this.close(); else this.open();
    });
    document.addEventListener("pointerdown", event => {
      if (event.target instanceof Node && !this.wrapper.contains(event.target) && !this.popup.contains(event.target)) this.close();
    });
    window.addEventListener("resize", () => { if (this.opened) this.position(); });
    document.addEventListener("scroll", event => {
      if (this.opened && event.target instanceof Node && !this.popup.contains(event.target)) this.close();
    }, true);
  }

  open() {
    if (this.input.disabled || !this.input.getClientRects().length) return;
    this.opened = true;
    this.popup.hidden = false;
    this.input.setAttribute("aria-expanded", "true");
    this.button.setAttribute("aria-expanded", "true");
    this.refresh();
  }

  close() {
    this.opened = false;
    this.popup.hidden = true;
    this.input.setAttribute("aria-expanded", "false");
    this.button.setAttribute("aria-expanded", "false");
    this.input.removeAttribute("aria-activedescendant");
    this.active = -1;
  }

  refresh() {
    if (!this.opened) return;
    const page = searchOptionPage(this.getOptions(this.input.value));
    this.options = page.options;
    this.active = -1;
    this.input.removeAttribute("aria-activedescendant");
    this.list.replaceChildren();
    this.rows = [];
    this.heading.textContent = page.total ? `${page.total.toLocaleString()} matches${page.total > page.options.length ? ` · first ${page.options.length} shown; type to narrow` : ""}` : this.emptyMessage();
    for (const [index, option] of this.options.entries()) {
      const row = document.createElement("div");
      row.className = "search-dropdown-option";
      row.id = `${this.list.id}-${index}`;
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", "false");
      const name = document.createElement("span");
      name.textContent = option.label;
      const detail = document.createElement("small");
      detail.textContent = option.detail || "";
      row.append(name, detail);
      row.addEventListener("pointerdown", event => event.preventDefault());
      row.addEventListener("click", () => this.choose(index));
      this.list.append(row);
      this.rows.push(row);
    }
    this.position();
  }

  activate(index) {
    if (!this.rows[index]) return;
    this.active = index;
    this.rows.forEach((row, position) => row.setAttribute("aria-selected", String(position === index)));
    this.input.setAttribute("aria-activedescendant", this.rows[index].id);
    const row = this.rows[index];
    if (row.offsetTop < this.list.scrollTop) this.list.scrollTop = row.offsetTop;
    else if (row.offsetTop + row.offsetHeight > this.list.scrollTop + this.list.clientHeight) this.list.scrollTop = row.offsetTop + row.offsetHeight - this.list.clientHeight;
  }

  choose(index) {
    const option = this.options[index];
    if (!option) return;
    this.close();
    this.onSelect(option);
  }

  position() {
    const rect = this.wrapper.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const useBelow = below >= 240 || below >= above;
    this.popup.style.width = `${Math.min(Math.max(rect.width, 280), 560, window.innerWidth - 24)}px`;
    this.popup.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - this.popup.offsetWidth - 12))}px`;
    this.list.style.maxHeight = `${Math.max(80, Math.min(340, (useBelow ? below : above) - this.heading.offsetHeight - 18))}px`;
    this.popup.style.top = `${useBelow ? rect.bottom + 6 : Math.max(12, rect.top - this.popup.offsetHeight - 6)}px`;
  }
}
