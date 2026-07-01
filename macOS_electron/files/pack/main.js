const electron = require('electron');
const { app, BrowserWindow, TouchBar, Menu, shell, dialog, ipcMain, powerMonitor } = electron;
const { TouchBarLabel, TouchBarButton, TouchBarSpacer } = TouchBar;
const { exec, spawn, execSync } = require('child_process');
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');
const minimist = require('minimist');
const contextMenu = require('electron-context-menu');
const WindowStateManager = require('electron-window-state-manager');
const { autoUpdater } = require('electron-updater');
const mainProcess = require('./main.js');
const uuid = require('uuid');
const getPortSync = require('find-free-port-sync');
const homedir = os.homedir();

let openFilePaths = [];
let fileMode;
let progressWindow = null;
let pendingUpdateInfo = null;
let isCancellingDownload = false;
let isSystemSuspended = false;
let appIsQuitting = false;

app.allowRendererProcessReuse = true;

// Function to read theme preference from ~/.carta/config/preferences.json
function getThemePreference() {
  try {
    const preferencesPath = path.join(homedir, '.carta/config/preferences.json');
    if (fs.existsSync(preferencesPath)) {
      const preferences = JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
      return preferences.theme || 'auto';
    }
  } catch (e) {
    console.warn('Could not read theme preference:', e.message);
  }
  return 'auto';
}

function showMessageBoxWithTheme(options) {
  const { nativeTheme } = require('electron');
  const theme = getThemePreference();

  if (theme === 'dark') {
    nativeTheme.themeSource = 'dark';
  } else if (theme === 'light') {
    nativeTheme.themeSource = 'light';
  } else {
    nativeTheme.themeSource = 'system';
  }

  return dialog.showMessageBox(options);
}

// Function to determine if dark mode should be used
function isDarkMode() {
  const theme = getThemePreference();
  if (theme === 'dark') {
    return true;
  } else if (theme === 'light') {
    return false;
  }
  // auto mode: check system preference
  if (require('electron').nativeTheme) {
    return require('electron').nativeTheme.shouldUseDarkColors;
  }
  return false;
}

// Function to get theme colors based on theme preference
function getThemeColors() {
  const dark = isDarkMode();
  if (dark) {
    return {
      bodyBackground: '#383E47',
      bodyForeground: '#e0e0e0',
      titleColor: '#e0e0e0',
      infoColor: '#a0a0a0',
      errorColor: '#b0b0b0',
      buttonBackground: '#8a8a8a',
      buttonText: '#e0e0e0',
      primaryButtonBackground: '#0070c9',
      primaryButtonText: '#ffffff',
      progressAccent: '#0070c9',
      border: '#404040'
    };
  } else {
    return {
      bodyBackground: '#f5f5f5',
      bodyForeground: '#333333',
      titleColor: '#333333',
      infoColor: '#666666',
      errorColor: '#999999',
      buttonBackground: '#e0e0e0',
      buttonText: '#222222',
      primaryButtonBackground: '#0070c9',
      primaryButtonText: '#ffffff',
      progressAccent: '#0070c9',
      border: '#cccccc'
    };
  }
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function createProgressWindow() {
  if (progressWindow && !progressWindow.isDestroyed()) return;
  
  const colors = getThemeColors();
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
         padding: 20px; margin: 0; background: ${colors.bodyBackground}; user-select: none; }
  h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; color: ${colors.titleColor}; }
  progress { width: 100%; height: 10px; accent-color: ${colors.progressAccent}; }
  #info { margin: 8px 0 0; font-size: 12px; color: ${colors.infoColor}; }
  #error { margin: 8px 0 0; font-size: 11px; color: ${colors.errorColor}; word-break: break-word; }
  #actions { margin-top: 16px; text-align: right; }
  button { border: 1px solid ${colors.border}; border-radius: 6px; padding: 6px 16px; margin-left: 8px;
           font-size: 12px; cursor: pointer; background: ${colors.buttonBackground}; color: ${colors.buttonText}; }
  button#retry-btn { background: ${colors.primaryButtonBackground}; color: ${colors.primaryButtonText}; border: 1px solid ${colors.primaryButtonBackground}; }
</style></head>
<body>
  <h3 id="title">Downloading CARTA Update...</h3>
  <progress id="bar" value="0" max="100"></progress>
  <div id="info">Starting download...</div>
  <div id="error" style="display:none;"></div>
  <div id="actions">
    <button id="retry-btn" style="display:none;">Retry</button>
    <button id="cancel-btn">Cancel</button>
  </div>
  <script>
    document.getElementById('cancel-btn').onclick = function() {
      window.location.href = 'carta://cancel';
    };
    document.getElementById('retry-btn').onclick = function() {
      window.location.href = 'carta://retry';
    };
    window.showError = function(msg) {
      document.getElementById('title').textContent = 'Update Download Failed';
      document.getElementById('bar').style.display = 'none';
      document.getElementById('info').style.display = 'none';
      var e = document.getElementById('error');
      e.style.display = 'block';
      e.textContent = msg;
      document.getElementById('retry-btn').style.display = 'inline-block';
    };
    window.showDownloading = function() {
      document.getElementById('title').textContent = 'Downloading CARTA Update...';
      var bar = document.getElementById('bar');
      bar.style.display = 'block';
      bar.value = 0;
      var info = document.getElementById('info');
      info.style.display = 'block';
      info.textContent = 'Starting download...';
      document.getElementById('error').style.display = 'none';
      document.getElementById('retry-btn').style.display = 'none';
    };
  <\/script>
</body></html>`;

  progressWindow = new BrowserWindow({
    width: 380,
    height: 180,
    resizable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    alwaysOnTop: true,
    title: 'Downloading Update',
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  progressWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  progressWindow.setMenu(null);

  progressWindow.webContents.on('will-navigate', (event, navUrl) => {
    event.preventDefault();
    if (navUrl === 'carta://cancel') {
      onCancelDownload();
    } else if (navUrl === 'carta://retry') {
      onRetryDownload();
    }
  });
}

function showDownloadError(message) {
  if (progressWindow && !progressWindow.isDestroyed()) {
    // Error view needs more room than the download view, so double the height.
    try {
      progressWindow.setResizable(true);
      progressWindow.setSize(380, 220);
      progressWindow.setResizable(false);
    } catch (e) {}
    progressWindow.webContents.executeJavaScript(
      'window.showError(' + JSON.stringify(String(message)) + ');'
    ).catch(() => {});
  }
}

// Create a themed dialog window
function showThemedDialog(options) {
  return new Promise((resolve) => {
    const colors = getThemeColors();
    const buttons = options.buttons || ['OK'];
    const buttonsHtml = buttons.map((btn, idx) => 
      `<button data-value="${idx}" class="${idx === 0 ? 'primary' : ''}">${btn}</button>`
    ).join('');
    
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
         padding: 20px; background: ${colors.bodyBackground}; color: ${colors.bodyForeground};
         min-width: 400px; user-select: none; }
  .container { display: flex; flex-direction: column; gap: 12px; }
  .title { font-size: 16px; font-weight: 600; color: ${colors.titleColor}; }
  .message { font-size: 14px; color: ${colors.bodyForeground}; }
  .detail { font-size: 12px; color: ${colors.infoColor}; margin-top: 4px; word-break: break-word; white-space: pre-wrap; }
  .buttons { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  button { padding: 6px 16px; border-radius: 6px; border: 1px solid ${colors.border};
           font-size: 12px; cursor: pointer; background: ${colors.buttonBackground}; 
           color: ${colors.buttonText}; transition: all 0.2s; }
  button:hover { opacity: 0.8; }
  button.primary { background: ${colors.primaryButtonBackground}; color: ${colors.primaryButtonText}; border: 1px solid ${colors.primaryButtonBackground}; }
  button.primary:hover { opacity: 0.9; }
</style></head>
<body>
  <div class="container">
    <div class="title">${options.title || ''}</div>
    <div class="message">${options.message || ''}</div>
    ${options.detail ? `<div class="detail">${options.detail}</div>` : ''}
    <div class="buttons">${buttonsHtml}</div>
  </div>
  <script>
    document.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = 'dialog://button-' + btn.dataset.value;
      });
    });
  </script>
</body></html>`;

    const dialogWindow = new BrowserWindow({
      width: Math.max(450, options.width || 450),
      height: options.detail ? Math.max(200, options.height || 200) : Math.max(160, options.height || 160),
      resizable: false,
      minimizable: false,
      maximizable: false,
      modal: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });

    dialogWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    dialogWindow.setMenu(null);

    dialogWindow.webContents.on('will-navigate', (event, navUrl) => {
      event.preventDefault();
      const match = navUrl.match(/dialog:\/\/button-(\d+)/);
      if (match) {
        const buttonIndex = parseInt(match[1]);
        dialogWindow.destroy();
        resolve({ response: buttonIndex });
      }
    });

    dialogWindow.on('closed', () => {
      resolve({ response: -1 });
    });
  });
}

// Retry a failed download: reset the progress UI and start downloading again.
function onRetryDownload() {
  isCancellingDownload = false;
  if (progressWindow && !progressWindow.isDestroyed()) {
    // Restore the original (shorter) download view height.
    try {
      progressWindow.setResizable(true);
      progressWindow.setSize(380, 180);
      progressWindow.setResizable(false);
    } catch (e) {}
    progressWindow.webContents.executeJavaScript('window.showDownloading();').catch(() => {});
  } else {
    createProgressWindow();
  }
  try { autoUpdater.downloadUpdate(); } catch (e) {}
}

function closeProgressWindow() {
  if (progressWindow && !progressWindow.isDestroyed()) {
    progressWindow.destroy();
    progressWindow = null;
  }
  try { app.dock.setProgressBar(-1); } catch (e) {}
}

function cleanupBackendProcesses() {
  for (const win of windows) {
    cleanupWindowBackend(win, win.backendPort);
  }

  try {
    execSync('pkill -9 -f "carta_backend"', { timeout: 1000 });
  } catch (e) {}

  backendPorts.clear();
}

function cleanupWindowBackend(win, port) {
  try {
    if (win.backendProcess && !win.backendProcess.killed) {
      win.backendProcess.kill('SIGKILL');
    }
  } catch (e) {}

  try {
    if (port) {
      execSync(`pkill -9 -f "carta_backend.*${port}"`, { timeout: 1000 });
    }
  } catch (e) {}

  backendPorts.delete(port);
}

function quitApplication() {
  appIsQuitting = true;

  if (openFileTimer) {
    clearTimeout(openFileTimer);
    openFileTimer = null;
  }

  closeProgressWindow();
  cleanupBackendProcesses();

  for (const win of BrowserWindow.getAllWindows()) {
    try {
      if (!win.isDestroyed()) {
        win.destroy();
      }
    } catch (e) {}
  }

  app.exit(0);
}

// Cancel the in-progress download. Does NOT delete the downloaded zip, then
// re-shows the update-available dialog (Update / Remind Me in 7 Days / Skip This Version).
function onCancelDownload() {
  isCancellingDownload = true;
  try { autoUpdater.cancelDownload(); } catch (e) {}
  closeProgressWindow();
  if (pendingUpdateInfo) {
    showUpdateDialog(pendingUpdateInfo);
  }
}

// Show the "update available" dialog and act on the user's choice.
function showUpdateDialog(info) {
  const dialogOpts = {
    title: 'CARTA Update Available',
    message: `New version ${info.version} is available`,
    detail: `Current version: ${app.getVersion()}\nNew version: ${info.version}\n\nWould you like to download and install the update?`,
    buttons: ['Update', 'Remind Me in 7 Days', 'Skip This Version'],
    width: 500,
    height: 220
  };

  showMessageBoxWithTheme(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      isCancellingDownload = false;
      clearRemindDate();
      createProgressWindow();
      autoUpdater.downloadUpdate();
    } else if (returnValue.response === 1) {
      setRemindDate();
      console.log('Reminder set for 7 days later.');
    } else if (returnValue.response === 2) {
      setSkippedVersion(info.version);
      console.log('Version skipped:', info.version);
    }
  });
}

// Configure auto-updater

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'CARTAvis',
  repo: 'carta'
}); 
autoUpdater.autoDownload = false; // Don't auto-download, wait for user confirmation
autoUpdater.autoInstallOnAppQuit = false; // We handle installation manually

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
});

// Skipped version persistence
function getSkippedVersion() {
  try {
    const filePath = path.join(app.getPath('userData'), 'skipped-version.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8')).skippedVersion || null;
    }
  } catch (e) {}
  return null;
}

function setSkippedVersion(version) {
  try {
    const filePath = path.join(app.getPath('userData'), 'skipped-version.json');
    fs.writeFileSync(filePath, JSON.stringify({ skippedVersion: version }), 'utf8');
  } catch (e) {
    console.error('Failed to save skipped version:', e);
  }
}

function getRemindDate() {
  try {
    const filePath = path.join(app.getPath('userData'), 'remind-date.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data.remindAfter ? new Date(data.remindAfter) : null;
    }
  } catch (e) {}
  return null;
}

function setRemindDate() {
  try {
    const filePath = path.join(app.getPath('userData'), 'remind-date.json');
    const remindAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    fs.writeFileSync(filePath, JSON.stringify({ remindAfter: remindAfter.toISOString() }), 'utf8');
    console.log('Will remind after:', remindAfter.toISOString());
  } catch (e) {
    console.error('Failed to save remind date:', e);
  }
}

function clearRemindDate() {
  try {
    const filePath = path.join(app.getPath('userData'), 'remind-date.json');
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {}
}

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);

  // Clear stale pending cache if it belongs to a different version
  const pendingDir = path.join(homedir, 'Library/Caches/carta-updater/pending');
  const updateInfoPath = path.join(pendingDir, 'update-info.json');
  try {
    if (fs.existsSync(updateInfoPath)) {
      const cached = JSON.parse(fs.readFileSync(updateInfoPath, 'utf8'));
      if (cached.fileName && !cached.fileName.includes(info.version)) {
        console.log('Stale cache detected, clearing pending dir for version:', cached.fileName);
        execSync(`rm -rf "${pendingDir}"`);
        fs.mkdirSync(pendingDir, { recursive: true });
      }
    }
  } catch (e) {
    console.warn('Could not check/clear pending cache:', e.message);
  }

  // Skip if this version was previously dismissed
  if (getSkippedVersion() === info.version) {
    console.log('Skipping version:', info.version);
    return;
  }

  // Suppress if the user asked to be reminded later and 7 days haven't passed
  const remindAfter = getRemindDate();
  if (remindAfter && new Date() < remindAfter) {
    console.log('Reminder not yet due, suppressing update dialog until:', remindAfter.toISOString());
    return;
  }

  pendingUpdateInfo = info;
  showUpdateDialog(info);
});

function normalizeVersion(version) {
  return String(version || '').replace(/^v/i, '');
}

autoUpdater.on('update-not-available', (info) => {
  console.log('Already up to date');

  if (normalizeVersion(info && info.version) === normalizeVersion(app.getVersion())) {
    console.log('Current CARTA version matches the latest release; suppressing up-to-date dialog.');
    return;
  }

  showMessageBoxWithTheme({
    title: 'No Updates Available',
    message: 'You are already using the latest version',
    detail: `Current version: ${app.getVersion()}`,
    buttons: ['OK'],
    width: 450,
    height: 180
  });
});

autoUpdater.on('error', (err) => {
  // cancelDownload() raises an error event; swallow it (this is expected).
  if (isCancellingDownload) {
    console.log('Download cancelled by user.');
    isCancellingDownload = false;
    return;
  }
  // Silently ignore 404 on latest-mac.yml — the release exists but update
  // metadata hasn't been published yet; treat it as "no update available".
  const errMsg = err.message || String(err);
  if (errMsg.includes('latest-mac.yml') || err.statusCode === 404 || err.status === 404) {
    console.log('Update metadata (latest-mac.yml) not found in release, skipping update check.');
    return;
  }
  console.error('Update error:', err);
  // If a download is in progress (progress window open), show the error inline
  // with Retry / Cancel buttons instead of popping up a separate dialog.
  if (progressWindow && !progressWindow.isDestroyed()) {
    try { app.dock.setProgressBar(-1); } catch (e) {}
    showDownloadError(errMsg);
    return;
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Math.round(progressObj.percent);
  const speed = formatBytes(progressObj.bytesPerSecond);
  const transferred = formatBytes(progressObj.transferred);
  const total = formatBytes(progressObj.total);
  console.log(`Downloading: ${percent}% (${transferred}/${total}) at ${speed}/s`);

  try { app.dock.setProgressBar(progressObj.percent / 100); } catch (e) {}

  if (progressWindow && !progressWindow.isDestroyed()) {
    progressWindow.webContents.executeJavaScript(`
      document.getElementById('bar').value = ${percent};
      document.getElementById('info').textContent =
        '${percent}%  \u2022  ${transferred} / ${total}  \u2022  ${speed}/s';
    `).catch(() => {});
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info);
  closeProgressWindow();

  // Install immediately once the download succeeds — no need to wait for the
  // user's restart choice. The dialog afterwards only decides whether to
  // relaunch now or keep working (the new version is already in place).
  setTimeout(() => {
    let installedAppPath = null;
    try {
      installedAppPath = installDownloadedUpdate(info);
    } catch (err) {
      console.error('Custom install failed:', err.message);
      showMessageBoxWithTheme({
        title: 'Install Failed',
        message: 'Failed to install update',
        detail: err.message,
        buttons: ['OK'],
        width: 450,
        height: 180
      });
      return;
    }

    const dialogOpts = {
      title: 'Update Installed',
      message: 'The update has been installed',
      buttons: ['Restart Now', 'Later'],
      width: 450,
      height: 180
    };

    showMessageBoxWithTheme(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0 && installedAppPath) {
        // Open the new app and fully terminate the current one.
        BrowserWindow.getAllWindows().forEach(w => w.hide());
        spawn('open', ['-n', installedAppPath], { detached: true, stdio: 'ignore' }).unref();
        setTimeout(() => quitApplication(), 250);
      }
    });
  }, 0); // yield so the progress window close can paint before we block
});

// Extract the downloaded zip and replace the app bundle in /Applications.
// Returns the path of the installed .app bundle. Throws on failure.
function installDownloadedUpdate(info) {
  const cacheDir = path.join(homedir, 'Library/Caches/carta-updater/pending');
  const currentAppPath = path.resolve(__dirname, '../../..');
  const appsDir = path.dirname(currentAppPath);
  const tempDir = path.join(os.tmpdir(), 'carta-update-' + Date.now());

  // Prefer the exact path electron-updater reports (already the final,
  // renamed file). Fall back to scanning the cache for a non-temp .zip.
  let zipPath = info.downloadedFile || '';
  if (!zipPath || !fs.existsSync(zipPath)) {
    const zips = fs.existsSync(cacheDir)
      ? fs.readdirSync(cacheDir).filter(f => f.endsWith('.zip') && !f.startsWith('temp-'))
      : [];
    if (zips.length > 0) {
      zipPath = path.join(cacheDir, zips[0]);
    } else {
      throw new Error(`Downloaded zip not found. info.downloadedFile=${info.downloadedFile}`);
    }
  }

  // Extract zip using macOS ditto
  execSync(`ditto -x -k "${zipPath}" "${tempDir}"`);

  // Find the .app bundle inside extracted dir
  const newAppName = fs.readdirSync(tempDir).find(e => e.endsWith('.app'));
  if (!newAppName) throw new Error('No .app found in zip');

  const newAppSrc = path.join(tempDir, newAppName);
  const newAppDest = path.join(appsDir, newAppName);

  // Remove old copy if exists, then install
  try { execSync(`rm -rf "${newAppDest}"`); } catch (e) {}
  execSync(`ditto "${newAppSrc}" "${newAppDest}"`);

  // Cleanup: remove the extracted temp dir and wipe the entire pending cache
  // directory so no zip (including any temp-*.zip partials) is left behind.
  try { execSync(`rm -rf "${tempDir}"`); } catch (e) {}
  try {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    fs.mkdirSync(cacheDir, { recursive: true });
  } catch (e) {
    console.warn('Failed to clear pending cache after install:', e.message);
  }

  console.log('Update installed at:', newAppDest);
  return newAppDest;
}

// To process all command line arguments correctly (Also remove the --inspect flag)
function generateExtraArgs(args) {
  const newArgs = [];

  for (const argName in args) {
    if (args.hasOwnProperty(argName) && argName !== '_' && argName !== 'inspect') {
      const value = args[argName];
      if (value === true) {
        newArgs.push(`--${argName}`);
      } else if (value !== false) {
        newArgs.push(`--${argName}=${value}`);
      }
    }
  }
  return newArgs;
}

const items = minimist(process.argv.slice(1));
const args = minimist(process.argv.slice(1));
const inputPaths = args._.filter(p => p);
const inputPath = inputPaths[0] || '';
let baseDirectory;

// Handle the different File Browser starting folder scenarios
try {
    let fileStatus = null;

    if (inputPath !== '') {
        fileStatus = fs.statSync(inputPath);
    }

    if (inputPath === '' ) {
        if (process.platform === 'darwin' && process.cwd().split('/').pop() === '') {
            baseDirectory = homedir; // When started using the Launchpad, set Filebrowser to $HOME
        } else {
            baseDirectory = process.cwd(); // When using command line without arguments, set Filebrowser to $PWD
        }
    } else if (fileStatus.isFile()) {
        fileMode = 1;
        openFilePaths = inputPaths;
        baseDirectory = path.dirname(inputPath); // Using command line to directly open an image
    } else if (fileStatus.isDirectory()) {
        fileMode = 0;
        baseDirectory = inputPath; // When using command line with a folder argument, set Filebrowser to specified folder
    }
} catch (err) {
    if (err.code === 'ENOENT') {
        console.log('Error: Requested file or directory does not exist');
        process.exit();
    } else {
        console.log('An unexpected error occurred:', err);
        process.exit();
    }
}

// Creating simplified custom menus
const template = [
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'delete' },
      { type: 'separator' },
      { role: 'selectall' },
    ]
  }
]

if (process.platform === 'darwin') {
  const name = app.name;
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'New CARTA Window',
        accelerator: process.platform === 'darwin' ? 'Cmd+N' : 'Ctrl+N',
        click() {
          openNewCarta()
        }
      },
      { type: 'separator' },
      {
        label: 'Check for Updates...',
        click() {
          checkForUpdates()
        }
      },
      { type: 'separator' },
      { role: 'toggleFullScreen' },
      { type: 'separator' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      {
        label: `Quit ${name}`,
        accelerator: 'Command+Q',
        click() {
          quitApplication();
        }
      },
    ]
  })
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// macOS touch bar support
const button1 = new TouchBarButton({
    icon: path.join(__dirname, 'carta_icon_128px.png'),
    iconPosition: 'left',
    label: 'CARTA',
    backgroundColor: '#000',
});

const button2 = new TouchBarButton({
    iconPosition: 'right',
    label: 'New CARTA Window',
    click() {
        openNewCarta()
    }
});

const button3 = new TouchBarButton({
    iconPosition: 'right',
    label: 'CARTA User Manual',
    click: () => {
        shell.openExternal('https://carta.readthedocs.io/en/latest');
    },
});

const touchBar = new TouchBar({
    items: [
        new TouchBarSpacer({ size: 'flexible' }),
        button1,
        new TouchBarSpacer({ size: 'flexible' }),
        button2,
        new TouchBarSpacer({ size: 'flexible' }),
        button3,
    ],
});

// Print the --help output from the carta_backend --help output
if (items.help) {

  var run = spawn(path.join(__dirname, 'carta-backend/bin/carta_backend'), ['--help']);

  run.stdout.on('data', (data) => {
    console.log(`${data}`);
    console.log('Additional Electron version flag:');
    console.log('      --inspect      Open the DevTools in the Electron window.');
  });

  run.on('error', (err) => {
    console.error('Error:', err);
  });

  run.on('exit', () => {
    process.exit();
  });

}

// Print the --version output from the carta_backend --version output
if (items.version) {

  var run = spawn(path.join(__dirname, 'carta-backend/bin/carta_backend'), ['--version']);

  run.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  run.on('error', (err) => {
    console.error('Error:', err);
  });

  run.on('exit', () => {
    process.exit();
  });

}

// Allow multiple instances of Electron
const windows = new Set();
const backendPorts = new Set();

// Generate a UUID for the CARTA_AUTH_TOKEN
const cartaAuthToken = uuid.v4();

let appIsReady = false;
let pendingOpenFiles = [];
let openFileTimer = null;

app.on('open-file', (event, filePath) => {
  event.preventDefault();

  console.log('macOS open-file:', filePath);

  if (appIsReady) {
    pendingOpenFiles.push(filePath);
    clearTimeout(openFileTimer);
    openFileTimer = setTimeout(() => {
      openFilePaths = [...pendingOpenFiles];
      baseDirectory = path.dirname(pendingOpenFiles[0]);
      fileMode = 1;
      pendingOpenFiles = [];
      createWindow();
    }, 100);
  } else {
    openFilePaths.push(filePath);
    fileMode = 1;
    if (!baseDirectory) {
      baseDirectory = path.dirname(filePath);
    }
  }
});

app.on('ready', () => {
  appIsReady = true;
  createWindow();
  // Check for updates 0.1 seconds after launch
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      console.error('Auto update check failed:', err.message);
    });
  }, 100);
});

ipcMain.on('carta:open-dropped-files', (event, filePaths) => {
  if (!Array.isArray(filePaths) || filePaths.length === 0) return;

  const wc = event.sender;
  const payload = JSON.stringify(filePaths);

  const tryAppend = (attempt = 0) => {
    const script = `(async () => {
      if (!window.app || typeof window.app.appendFile !== 'function') {
        return false;
      }
      const files = ${payload};
      for (const f of files) {
        try { await window.app.appendFile(f); }
        catch (err) { console.error('appendFile failed for', f, err); }
      }
      return true;
    })();`;

    wc.executeJavaScript(script, true).then((ok) => {
      if (!ok && attempt < 150) {
        setTimeout(() => tryAppend(attempt + 1), 200);
      }
    }).catch((err) => {
      console.error('executeJavaScript for dropped files failed:', err);
    });
  };

  tryAppend();
});

app.on('window-all-closed', () => {
  // CARTA should fully exit when the last window is closed.
  quitApplication();
});

powerMonitor.on('suspend', () => {
  isSystemSuspended = true;
});

powerMonitor.on('resume', () => {
  isSystemSuspended = false;
});

app.on('before-quit', () => {
  console.log('before-quit');
  appIsQuitting = true;
  closeProgressWindow();
}); 

app.on('will-quit', () => {
  console.log('will-quit');
  cleanupBackendProcesses();
});

app.on('activate', (event, hasVisibleWindows) => {
  if (!hasVisibleWindows) { createWindow(); }
});

let newWindow;

const mainWindowState = new WindowStateManager('newWindow', {
    defaultWidth: 1920,
    defaultHeight: 1080
});

const createWindow = exports.createWindow = () => {
  let x, y;
  x =  mainWindowState.x;
  y =  mainWindowState.y;

  const currentWindow = BrowserWindow.getFocusedWindow();

  if (currentWindow) {
    const [ currentWindowX, currentWindowY ] = currentWindow.getPosition();
    x = currentWindowX + 25;
    y = currentWindowY + 25;
  }

  const newWindow = new BrowserWindow({
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: x,
    y: y,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    }
  });

  // Using the find-free-port-sync to find a free port for each carta-backend instance
  backendPort = getPortSync();
  const windowPort = backendPort;

  // Open the Electron DevTools with the --inspect flag
  if (items.inspect === true) {
    newWindow.webContents.openDevTools();
  }

  const finalExtraArgs = generateExtraArgs(items);

  const run = spawn(
    path.join(__dirname, 'carta-backend/bin/run.sh'),
    [cartaAuthToken, baseDirectory, String(backendPort), ...finalExtraArgs], 
    {
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  newWindow.backendProcess = run;
  newWindow.backendPort = windowPort;

  // Correctly handle Electron window URL scenarios
  if (openFilePaths.length > 0) {

    const encodedFiles = openFilePaths.map(file => {
      const inputFile = file.startsWith('/')
        ? file
        : `${process.cwd()}/${file}`;

      return encodeURIComponent(inputFile);
    });

    newWindow.loadURL(
      `file://${__dirname}/index.html?socketUrl=ws://localhost:${encodeURIComponent(backendPort)}&token=${encodeURIComponent(cartaAuthToken)}&files=${encodedFiles.join(',')}`
    );

  } else {

    newWindow.loadURL(
      `file://${__dirname}/index.html?socketUrl=ws://localhost:${encodeURIComponent(backendPort)}&token=${encodeURIComponent(cartaAuthToken)}`
    );

  }

  run.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  run.stderr.on('data', (data) => {
    console.error(`${data}`);
  });

  run.on('error', (err) => {
    console.error('Error:', err);
  });

  newWindow.once('ready-to-show', () => {
    newWindow.show();
  });

  newWindow.setTouchBar(touchBar);

  newWindow.on('close', (event) => {
    console.log('window close', {
      appIsQuitting,
      isSystemSuspended,
      port: windowPort
    });

    if (newWindow.forceClosing || appIsQuitting) {
      try { mainWindowState.saveState(newWindow); } catch (e) {}
      return;
    }

    if (isSystemSuspended && !appIsQuitting) {
      event.preventDefault();
      return;
    }

    try { mainWindowState.saveState(newWindow); } catch (e) {}
    event.preventDefault();
    newWindow.forceClosing = true;
    cleanupWindowBackend(newWindow, windowPort);
    windows.delete(newWindow);
    newWindow.destroy();
  });

  newWindow.on('closed', () => {
    console.log('window closed, killing backend', windowPort);
    cleanupWindowBackend(newWindow, windowPort);
    windows.delete(newWindow);
  });

  windows.add(newWindow);
  return newWindow;
};

function openNewCarta() {
  mainProcess.createWindow();
}

// Check for updates function
function checkForUpdates() {
  setSkippedVersion(null);
  clearRemindDate();
  autoUpdater.checkForUpdates().catch(err => {
    const errMsg = err.message || String(err);
    if (errMsg.includes('latest-mac.yml') || err.statusCode === 404 || err.status === 404) {
      console.log('Update metadata (latest-mac.yml) not found in release, skipping update check.');
      return;
    }
    console.error('Failed to check for updates:', err);
    showMessageBoxWithTheme({
      title: 'Update Check Failed',
      message: 'Unable to check for updates',
      detail: 'Please check your internet connection and try again later.',
      buttons: ['OK'],
      width: 450,
      height: 180
    });
  });
}
