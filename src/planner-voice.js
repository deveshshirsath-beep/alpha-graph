import { icon } from "./ui-controls.js";

const DOT = 6; // a 2px dot and its 4px gap, as in Figma's recording waveform
const PEAKS = 15; // dots either side of the playhead drawn as the stronger peak dots
const SAMPLE_MS = 70;

function button(className, label, content) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.setAttribute("aria-label", label);
  node.title = label;
  node.append(content);
  return node;
}

/**
 * Speech to text for the composer (Figma 211:76960). Recording swaps the composer for one row:
 * cancel, a dotted waveform that follows the microphone, stop (keep the words to edit) and send.
 * @param {{ card: HTMLElement, onDone: (text: string, send: boolean) => void, onStatus: (text: string) => void }} options
 */
export function createVoiceInput({ card, onDone, onStatus }) {
  const Recognition = /** @type {any} */ (window).SpeechRecognition || /** @type {any} */ (window).webkitSpeechRecognition;
  const row = document.createElement("div");
  row.className = "composer-voice";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Voice input");
  row.hidden = true;
  const wave = document.createElement("div");
  wave.className = "voice-wave";
  wave.setAttribute("aria-hidden", "true");
  const square = document.createElement("span");
  const cancel = button("voice-cancel", "Cancel voice input", icon("x"));
  const stop = button("voice-stop", "Stop and edit", square);
  const send = button("voice-send", "Send", icon("arrow-up"));
  row.append(cancel, wave, stop, send);
  card.append(row);

  let recognition = null;
  let stream = null;
  let context = null;
  let analyser = null;
  let frame = 0;
  let recording = false;
  let finalText = "";
  let interimText = "";
  let dots = [];
  let center = 0;
  /** Recent loudness, newest first; each dot reads the sample for its distance from the playhead. */
  let levels = [];
  let lastSample = 0;
  let speechPulse = 0;

  const buildWave = () => {
    const count = Math.max(24, Math.floor((wave.clientWidth + 4) / DOT) | 1);
    center = Math.floor(count / 2);
    dots = Array.from({ length: count }, (_, index) => {
      const dot = document.createElement("i");
      if (Math.abs(index - center) <= PEAKS) dot.className = "is-peak";
      return dot;
    });
    const playhead = document.createElement("b");
    wave.replaceChildren(...dots.slice(0, center), playhead, ...dots.slice(center));
    levels = new Array(center + 1).fill(0);
  };

  const level = () => {
    if (!analyser) return Math.max(0, speechPulse -= 0.04);
    const samples = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(samples);
    let sum = 0;
    for (const value of samples) sum += ((value - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(sum / samples.length) * 5);
  };

  const draw = (time) => {
    if (!recording) return;
    if (time - lastSample > SAMPLE_MS) {
      lastSample = time;
      levels.unshift(level());
      levels.length = center + 1;
    }
    // The waveform is mirrored around the playhead: the newest sound sits beside it and older sound drifts outward.
    dots.forEach((dot, index) => {
      const value = levels[Math.abs(index - center)] || 0;
      const base = dot.classList.contains("is-peak") ? 3 : 2;
      dot.style.height = `${(base + value * 16).toFixed(1)}px`;
      dot.classList.toggle("is-loud", value > 0.08);
    });
    frame = window.requestAnimationFrame(draw);
  };

  const release = () => {
    window.cancelAnimationFrame(frame);
    stream?.getTracks().forEach((track) => track.stop());
    context?.close().catch(() => {});
    stream = context = analyser = null;
  };

  const finish = (mode) => {
    if (!recording) return;
    recording = false;
    const text = `${finalText} ${interimText}`.replace(/\s+/g, " ").trim();
    try { recognition?.abort(); } catch { /* Already stopped. */ }
    recognition = null;
    release();
    card.classList.remove("is-recording");
    card.style.minHeight = "";
    row.hidden = true;
    document.removeEventListener("keydown", onKey, true);
    if (mode === "cancel") { onStatus(""); onDone("", false); return; }
    if (!text) { onStatus("No speech was heard. Try again, closer to the microphone."); onDone("", false); return; }
    onStatus("");
    onDone(text, mode === "send");
  };

  const onKey = (event) => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); finish("cancel"); }
  };

  const listen = () => {
    recognition = new Recognition();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (result.isFinal) finalText += ` ${result[0].transcript}`;
        else interimText += ` ${result[0].transcript}`;
      }
      speechPulse = 0.7;
    };
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      const blocked = event.error === "not-allowed" || event.error === "service-not-allowed";
      onStatus(blocked ? "Microphone access is blocked. Allow it for this site to use voice input." : "Voice input stopped unexpectedly. Try again.");
      finish("cancel");
    };
    // Browsers end a session after a pause; keep listening until the user stops.
    recognition.onend = () => { if (recording) try { recognition.start(); } catch { /* Restarting too fast; the next end retries. */ } };
    recognition.start();
  };

  cancel.addEventListener("click", () => finish("cancel"));
  stop.addEventListener("click", () => finish("stop"));
  send.addEventListener("click", () => finish("send"));

  return {
    supported: Boolean(Recognition),
    get recording() { return recording; },
    async start() {
      if (recording) return;
      if (!Recognition) { onStatus("Voice input isn't available in this browser. Try Chrome or Edge."); return; }
      recording = true;
      finalText = interimText = "";
      onStatus("");
      card.style.minHeight = `${card.offsetHeight}px`;
      card.classList.add("is-recording");
      row.hidden = false;
      buildWave();
      document.addEventListener("keydown", onKey, true);
      try { listen(); } catch { onStatus("Voice input couldn't start. Try again."); finish("cancel"); return; }
      frame = window.requestAnimationFrame(draw);
      send.focus({ preventScroll: true });
      // The waveform follows the microphone when the browser shares its level; otherwise it pulses with recognised words.
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!recording) { release(); return; }
        context = new AudioContext();
        analyser = context.createAnalyser();
        analyser.fftSize = 512;
        context.createMediaStreamSource(stream).connect(analyser);
      } catch { /* The level is optional; recognition still runs. */ }
    },
    cancel: () => finish("cancel"),
  };
}
