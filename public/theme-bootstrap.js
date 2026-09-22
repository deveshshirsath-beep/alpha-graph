(function applySavedTheme() {
  try {
    const theme = localStorage.getItem("atlas-v2-theme");
    document.documentElement.dataset.theme = ["light", "dark", "ocean", "sunset"].includes(theme) ? theme : "light";
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();

// Restore before the app paints, even while the graph is still loading.
(function applySavedTextSize() {
  let size = 'default';
  try { size = localStorage.getItem('atlas-v2-text-size') || size; } catch { /* Optional preference. */ }
  document.documentElement.dataset.textSize = ['default', 'small', 'medium', 'large', 'xlarge'].includes(size) ? size : 'default';
})();
