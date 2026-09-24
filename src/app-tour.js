import { registerTour, waitFor } from "./feature-tour.js";

const $ = (selector) => /** @type {HTMLElement | null} */ (document.querySelector(selector));
const inChat = () => document.body.classList.contains("planner-mode");
const pause = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
/** The element only if it is on screen, so a hidden panel is never spotlit. */
const shown = (selector) => {
  const element = $(selector);
  return element && element.getClientRects().length ? element : null;
};

async function toChat() {
  if (inChat()) return;
  $("#planner-mode-toggle")?.click();
  await waitFor(() => inChat(), 1500);
  await pause(420);
}

async function toGraph() {
  if (!inChat()) return;
  $("#planner-back-to-viewer")?.click();
  await waitFor(() => !inChat(), 1500);
  await pause(620);
}

/**
 * The top bar's "?": a spotlight tour of the whole app, chat first and then the graph.
 * It opens what it needs and puts the reader back where they started when it ends.
 */
export function registerAppTour() {
  let startedInChat = true;
  let contextWasOpen = false;
  const contextOpen = () => !$("#planner-context")?.hidden;
  const setContext = async (open) => {
    if (contextOpen() === open) return;
    (open ? $("#planner-context-reopen") : $("#planner-context-toggle"))?.click();
    await pause(260);
  };

  registerTour("atlas", {
    title: "Tour of Atlas",
    spotlight: true,
    steps: [
      {
        text: "Atlas maps your API estate, from business areas to APIs to runtime, as one knowledge graph. Ask it questions in plain language, or explore the map itself. This tour takes about a minute.",
        enter: async () => {
          startedInChat = inChat();
          contextWasOpen = contextOpen();
          await toChat();
          await setContext(false);
        },
      },
      {
        text: "Switch between Chat, where you ask questions, and Graph, where you explore the map. Both work on the same graph.",
        target: () => shown("#planner-library .mode-switch"),
        enter: toChat,
      },
      {
        text: "Ask anything here, typed or spoken with the waveform button. Atlas works through the graph step by step, then answers with tables, reasoning and the graph behind it.",
        target: () => shown("#planner-query-form .planner-composer-card"),
        enter: async () => { await toChat(); await setContext(false); },
      },
      {
        text: "Questions lists everything Atlas can answer. Filter by layer, entity or question type. A question that needs a value asks for it first.",
        target: () => shown("#planner-questions-nav"),
        enter: toChat,
      },
      {
        text: "Chats live in projects. Every answer keeps its graph snapshot, so you can reopen exactly what it was based on.",
        target: () => shown("#planner-workspaces-panel"),
        enter: async () => { await toChat(); await setContext(false); },
      },
      {
        text: "The entity map groups every entity type by layer. Pick a type to see the questions you can ask about it. The other tabs show an answer's map, its entities and follow-ups.",
        target: () => shown("#planner-context .planner-context-card"),
        enter: async () => { await toChat(); await setContext(true); },
      },
      {
        text: "Each dataset is a captured snapshot of your estate. Switch between them here, and set the theme and text size beside it.",
        target: () => shown(".topbar .header-actions"),
        enter: async () => { await toChat(); await setContext(false); },
      },
      {
        text: "In the graph, the breadcrumb names the snapshot you are looking at. Opened from a chat answer, the canvas shows only that answer's entities, and the back arrow returns to the full graph.",
        target: () => shown("#stage-header"),
        enter: toGraph,
      },
      {
        text: "Filter the canvas by layer, then by entity type. The eye on each row shows or hides it.",
        target: () => shown("#controls-panel .explorer-tabpanel:not([hidden])"),
        enter: toGraph,
      },
      {
        text: "Graph controls: build a query to filter the graph, or trace paths out from any entity with a traversal. The ? beside each section walks you through it hands-on.",
        target: () => shown("#query-panel .query-card"),
        enter: toGraph,
      },
      {
        text: "Change how the graph is laid out, and use the map corner to zoom, fit and find your place.",
        target: () => shown(".view-switcher"),
        enter: toGraph,
      },
      {
        text: "That's Atlas. Press ? on your keyboard for shortcuts, or open this tour again from the top bar at any time.",
      },
    ],
    cleanup: async () => {
      if (startedInChat) await toChat();
      else await toGraph();
      if (startedInChat) await setContext(contextWasOpen);
    },
  });
}
