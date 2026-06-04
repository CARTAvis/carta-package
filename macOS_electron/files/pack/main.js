const electron = require('electron');
const { app, BrowserWindow, TouchBar, Menu, shell, dialog, ipcMain } = electron;
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

app.allowRendererProcessReuse = true;

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function createProgressWindow() {
  if (progressWindow && !progressWindow.isDestroyed()) return;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
         padding: 20px; margin: 0; background: #f5f5f5; user-select: none; }
  h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #333; }
  progress { width: 100%; height: 10px; accent-color: #0070c9; }
  #info { margin: 8px 0 0; font-size: 12px; color: #666; }
</style></head>
<body>
  <h3>Downloading CARTA Update...</h3>
  <progress id="bar" value="0" max="100"></progress>
  <div id="info">Starting download...</div>
</body></html>`;

  progressWindow = new BrowserWindow({
    width: 380,
    height: 130,
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
}

function closeProgressWindow() {
  if (progressWindow && !progressWindow.isDestroyed()) {
    progressWindow.destroy();
    progressWindow = null;
  }
  try { app.dock.setProgressBar(-1); } catch (e) {}
}

// Configure auto-updater
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'pshnghng0318',
  repo: 'carta-builds'
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

  const dialogOpts = {
    type: 'info',
    buttons: ['Update', 'Later', 'Skip This Version'],
    title: 'CARTA Update Available',
    message: `New version ${info.version} is available`,
    detail: `Current version: ${app.getVersion()}\nNew version: ${info.version}\n\nWould you like to download and install the update?`
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      createProgressWindow();
      autoUpdater.downloadUpdate();
    } else if (returnValue.response === 2) {
      setSkippedVersion(info.version);
      console.log('Version skipped:', info.version);
    }
  });
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Already up to date');
  dialog.showMessageBox({
    type: 'info',
    title: 'No Updates Available',
    message: 'You are already using the latest version',
    detail: `Current version: ${app.getVersion()}`
  });
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  closeProgressWindow();
  dialog.showMessageBox({
    type: 'error',
    title: 'Update Failed',
    message: 'An error occurred while checking for updates',
    detail: err.message
  });
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
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart Now', 'Later'],
    title: 'Update Ready',
    message: 'Update has been downloaded',
    detail: 'The application will restart to complete the update installation.'
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      const cacheDir = path.join(homedir, 'Library/Caches/carta-updater/pending');
      const zipName = info.downloadedFile ? path.basename(info.downloadedFile) : 'update.zip';
      const zipPath = path.join(cacheDir, zipName);
      const currentAppPath = path.resolve(__dirname, '../../..');
      const appsDir = path.dirname(currentAppPath);
      const tempDir = path.join(os.tmpdir(), 'carta-update-' + Date.now());

      try {
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

        // Cleanup temp and downloaded zip, open new app, then quit current
        try { execSync(`rm -rf "${tempDir}"`); } catch (e) {}
        try { fs.unlinkSync(zipPath); } catch (e) {}
        try { fs.unlinkSync(path.join(cacheDir, 'update-info.json')); } catch (e) {}
        spawn('open', [newAppDest], { detached: true, stdio: 'ignore' }).unref();
        setTimeout(() => app.quit(), 1500);

      } catch (err) {
        console.error('Custom install failed:', err.message);
        dialog.showMessageBox({
          type: 'error',
          title: 'Install Failed',
          message: 'Failed to install update',
          detail: err.message
        });
      }
    }
  });
});

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
        role: 'quit'
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
        shell.openExternal('https://carta.readthedocs.io/en/4.1');
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
  app.quit();
});

app.on('before-quit', (event) => {
  // Close all windows forcefully
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach(win => {
    win.destroy();
  });
}); 

app.on('will-quit', (event) => {
  // Kill any remaining carta_backend processes started by this app
  const { execSync } = require('child_process');
  try {
    const appPath = __dirname.replace(/\//g, '\\/');
    execSync(`pkill -9 -f "${appPath}/carta-backend/bin/carta_backend"`, { timeout: 1000 });
  } catch (e) {
  }
  backendPorts.clear();
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
    [cartaAuthToken, baseDirectory, String(backendPort), ...finalExtraArgs]
  );

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

  run.on('error', (err) => {
     console.error('Error:', err);
  });

  app.releaseSingleInstanceLock();

  newWindow.once('ready-to-show', () => {
    newWindow.show();
  });

  newWindow.setTouchBar(touchBar);

  newWindow.on('close', (event) => {
    event.preventDefault();
    try { mainWindowState.saveState(newWindow); } catch (e) {}

    try {
      execSync(`pkill -9 -f "carta_backend.*${windowPort}"`, { timeout: 1000 });
    } catch (e) {
      // Ignore - process may have already exited
    }
    
    // Completely close Electron if no other windows are open
    newWindow.destroy();
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
  autoUpdater.checkForUpdates().catch(err => {
    console.error('Failed to check for updates:', err);
    dialog.showMessageBox({
      type: 'error',
      title: 'Update Check Failed',
      message: 'Unable to check for updates',
      detail: 'Please check your internet connection and try again later.'
    });
  });
}
