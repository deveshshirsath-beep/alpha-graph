const MAX_BUFFER_SIZE = 200;
const buffer = [];
let telemetryEndpoint = "";
let releaseName = "development";
let flushTimer = null;

function scrub(value) {
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return value.slice(0, 500);
  if (Array.isArray(value)) return value.slice(0, 20).map(scrub);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).slice(0, 30).map(([key, item]) => [key, scrub(item)]));
  return null;
}

function enqueue(kind, name, details = {}) {
  const entry = {
    kind,
    name,
    timestamp: new Date().toISOString(),
    release: releaseName,
    path: location.pathname,
    details: scrub(details),
  };
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER_SIZE) buffer.shift();
  return entry;
}

export function trackEvent(name, details = {}) {
  return enqueue("event", name, details);
}

export function trackMetric(name, value, details = {}) {
  return enqueue("metric", name, { ...details, value: Math.round(Number(value) * 100) / 100 });
}

export function captureException(error, details = {}) {
  const normalized = error instanceof Error ? error : new Error(String(error));
  return enqueue("error", normalized.name || "Error", {
    ...details,
    message: normalized.message,
    stack: normalized.stack,
  });
}

export function startTimer(name, details = {}) {
  const startedAt = performance.now();
  return (finishDetails = {}) => trackMetric(name, performance.now() - startedAt, { ...details, ...finishDetails, unit: "ms" });
}

export function flushObservability() {
  if (!telemetryEndpoint || !buffer.length) return false;
  const payload = JSON.stringify({ sentAt: new Date().toISOString(), entries: buffer.splice(0) });
  if (navigator.sendBeacon?.(telemetryEndpoint, new Blob([payload], { type: "application/json" }))) return true;
  fetch(telemetryEndpoint, { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  return true;
}

export function initializeObservability({ endpoint = "", release = "development" } = {}) {
  telemetryEndpoint = endpoint;
  releaseName = release;
  window.addEventListener("error", (event) => captureException(event.error || event.message, { source: event.filename, line: event.lineno, column: event.colno }));
  window.addEventListener("unhandledrejection", (event) => captureException(event.reason, { source: "unhandledrejection" }));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushObservability(); });
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) trackMetric("long_task", entry.duration, { unit: "ms" });
      });
      observer.observe({ type: "longtask", buffered: true });
    } catch {
      // Long-task observation is not available in every supported browser.
    }
  }
  window.clearInterval(flushTimer);
  flushTimer = window.setInterval(flushObservability, 15000);
  /** @type {Window & typeof globalThis & { __ATLAS_DIAGNOSTICS__?: object }} */ (window).__ATLAS_DIAGNOSTICS__ = {
    get entries() { return [...buffer]; },
    flush: flushObservability,
    release: releaseName,
  };
  trackEvent("application_started", { userAgent: navigator.userAgent.slice(0, 180) });
}
