const { ipcRenderer, webUtils } = require('electron');

// Intercept file drops anywhere on the window and forward the real paths
// to the main process. We must call webUtils.getPathForFile(file) because
// File.path was removed in Electron 32+.
window.addEventListener('DOMContentLoaded', () => {
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((ev) => {
    window.addEventListener(ev, stop, false);
    document.addEventListener(ev, stop, false);
  });

  document.addEventListener('drop', (e) => {
    const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
    if (!files.length) return;

    const paths = files
      .map((f) => {
        try {
          return webUtils.getPathForFile(f);
        } catch (_) {
          return '';
        }
      })
      .filter(Boolean);

    if (paths.length) {
      ipcRenderer.send('carta:open-dropped-files', paths);
    }
  }, false);
});
