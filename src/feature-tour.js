/**
 * Feature walkthroughs: a "?" beside a feature plays it for real — the tour fills the actual
 * controls one step at a time and says what it is doing, so the reader can repeat it afterwards.
 */
import { icon } from "./ui-controls.js";

/** @typedef {{ text: string, target?: () => Element | null | undefined, enter?: () => void | Promise<void>, run?: () => void | Promise<void>, settle?: number }} TourStep */
/** @typedef {{ title: string, steps: TourStep[], cleanup?: () => void | Promise<void>, spotlight?: boolean }} Tour */

/** @type {Map<string, Tour>} */
const tours = new Map();
let active = null;

export function registerTour(id, tour) {
  tours.set(id, tour);
}

/** Adds the "?" that plays a feature's walkthrough, next to that feature's heading. */
export function attachTourButton(host, id, label) {
  if (!host || host.querySelector(".feature-tour-button")) return null;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "feature-tour-button";
  button.setAttribute("aria-label", `Walk me through ${label}`);
  button.title = `Walk me through ${label}`;
  button.append(icon("help"));
  button.addEventListener("click", () => startTour(id));
  host.append(button);
  return button;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function place(session) {
  const { card, ring, steps, index } = session;
  if (index < 0) return;
  const step = steps[index];
  const target = step.target?.();
  if (!target || !(target instanceof Element)) {
    if (session.signature === "none") return;
    session.signature = "none";
    ring.hidden = true;
    card.style.left = "50%";
    card.style.top = "auto";
    card.style.bottom = "24px";
    card.style.transform = "translateX(-50%)";
    return;
  }
  const box = target.getBoundingClientRect();
  if (!box.width && !box.height) { ring.hidden = true; return; }
  const signature = `${Math.round(box.left)}:${Math.round(box.top)}:${Math.round(box.width)}:${Math.round(box.height)}`;
  if (session.signature === signature) return;
  session.signature = signature;
  ring.hidden = false;
  // Hug the target: 3px of breathing room, and the same corner the element itself uses.
  const inset = 3;
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 8;
  ring.style.left = `${box.left - inset}px`;
  ring.style.top = `${box.top - inset}px`;
  ring.style.width = `${box.width + inset * 2}px`;
  ring.style.height = `${box.height + inset * 2}px`;
  ring.style.borderRadius = `${Math.round(radius + inset)}px`;

  const width = card.offsetWidth || 300;
  const height = card.offsetHeight || 140;
  const gap = 14;
  // Prefer the side with room: left of the target, else right, else below.
  let left = box.left - width - gap;
  if (left < 12) left = box.right + gap;
  if (left + width > window.innerWidth - 12) left = Math.max(12, window.innerWidth - width - 12);
  let top = box.top + box.height / 2 - height / 2;
  top = Math.min(Math.max(12, top), Math.max(12, window.innerHeight - height - 12));
  card.style.transform = "none";
  card.style.bottom = "auto";
  card.style.left = `${Math.round(left)}px`;
  card.style.top = `${Math.round(top)}px`;
}

async function show(session, next) {
  const step = session.steps[next];
  if (!step) return finish(session);
  session.index = next;
  session.signature = "";
  session.copy.textContent = step.text;
  session.counter.textContent = `Step ${next + 1} of ${session.steps.length}`;
  session.back.disabled = next === 0;
  session.next.textContent = next === session.steps.length - 1 ? "Done" : "Next";
  // A step's enter runs every time it is shown, so Back lands in the same state as Next did.
  if (step.enter) {
    session.next.disabled = session.back.disabled = true;
    try { await step.enter(); } catch { /* the step still shows its copy */ }
    if (active !== session) return;
    session.next.disabled = false;
    session.back.disabled = next === 0;
    session.signature = "";
  }
  place(session);
  if (!session.done.has(next) && step.run) {
    session.done.add(next);
    session.next.disabled = true;
    try { await step.run(); } catch { /* a step that cannot run still shows its copy */ }
    if (step.settle) await new Promise((resolve) => window.setTimeout(resolve, step.settle));
    session.next.disabled = false;
  }
  place(session);
}

function finish(session) {
  if (active !== session) return;
  active = null;
  cancelAnimationFrame(session.frame);
  window.removeEventListener("scroll", session.reposition, true);
  window.removeEventListener("resize", session.reposition);
  document.removeEventListener("keydown", session.onKey, true);
  session.layer.remove();
  session.tour.cleanup?.();
}

export function stopTour() {
  if (active) finish(active);
}

export async function startTour(id) {
  const tour = tours.get(id);
  if (!tour) return;
  stopTour();

  const layer = element("div", `feature-tour-layer${tour.spotlight ? " is-spotlight" : ""}`);
  const ring = element("div", "feature-tour-ring");
  ring.hidden = true;
  const card = element("div", "feature-tour-card");
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-live", "polite");
  card.setAttribute("aria-label", `${tour.title} walkthrough`);

  const head = element("div", "feature-tour-head");
  const title = element("strong", "", tour.title);
  const close = element("button", "feature-tour-close");
  close.type = "button";
  close.setAttribute("aria-label", "End the walkthrough");
  close.append(icon("close"));
  head.append(title, close);

  const copy = element("p", "feature-tour-copy");
  const counter = element("span", "feature-tour-counter");
  const back = element("button", "feature-tour-back", "Back");
  back.type = "button";
  const next = element("button", "feature-tour-next", "Next");
  next.type = "button";
  const foot = element("div", "feature-tour-foot");
  const actions = element("div", "feature-tour-actions");
  actions.append(back, next);
  foot.append(counter, actions);

  card.append(head, copy, foot);
  layer.append(ring, card);
  document.body.append(layer);

  const session = { tour, steps: tour.steps, index: -1, done: new Set(), layer, ring, card, copy, counter, back, next };
  session.reposition = () => place(session);
  session.onKey = (event) => {
    if (event.key === "Escape") { event.stopPropagation(); finish(session); }
  };
  active = session;

  close.addEventListener("click", () => finish(session));
  back.addEventListener("click", () => show(session, Math.max(0, session.index - 1)));
  next.addEventListener("click", () => {
    if (session.index >= session.steps.length - 1) finish(session);
    else show(session, session.index + 1);
  });
  window.addEventListener("scroll", session.reposition, true);
  window.addEventListener("resize", session.reposition);
  document.addEventListener("keydown", session.onKey, true);
  const follow = () => {
    if (active !== session) return;
    place(session);
    session.frame = requestAnimationFrame(follow);
  };
  session.frame = requestAnimationFrame(follow);

  await show(session, 0);
}

/** Sets a native select and lets the app's own listeners react, custom dropdowns included. */
export function setSelect(select, value) {
  if (!select) return false;
  // No value given means "take the first real choice", not the placeholder option.
  const option = (value ? [...select.options].find((item) => item.value === value) : null)
    || [...select.options].find((item) => item.value && !item.disabled);
  if (!option) return false;
  select.value = option.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

/** Waits for an element a step depends on, so a tour never races the UI it is driving. */
export function waitFor(find, timeout = 2500) {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const found = find();
      if (found || Date.now() - started > timeout) return resolve(found || null);
      window.setTimeout(tick, 60);
    };
    tick();
  });
}
