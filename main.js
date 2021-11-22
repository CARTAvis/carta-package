const electron = require('electron');
const { app, BrowserWindow, TouchBar } = require('electron')
const { TouchBarLabel, TouchBarButton, TouchBarSpacer } = TouchBar

const path = require('path');
const url = require('url');
var spawn = require('child_process').spawn;
const child_process = require("child_process");
const os = require('os');
const contextMenu = require('electron-context-menu');
const dialog = electron.dialog;
const WindowStateManager = require('electron-window-state-manager');

const mainProcess = require('./main.js');

electron.app.allowRendererProcessReuse = true;

var fs = require('fs');
const homedir = require('os').homedir();

var findFreePort = require('find-free-port-sync');

var uuid = require("uuid");

///////////////////////////////////////////
// Creating simplified custom menus
const {Menu} = require('electron');

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
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { 
        role: 'quit'
      },

    ]
  })
}
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
//////////////////////////////////////////////

// Disable error dialogs by overriding
dialog.showErrorBox = function(title, content) {
    console.log(`${title}\n${content}`);
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let newWindow;

 var arg0 = 'undefined';
 var arg1 = 'undefined';
 var arg2 = 'undefined';
 var arg4 = 'undefined';
 var folder = process.cwd(); //Default to $PWD if no directory or --base is defined

// Want to default filebrowser location to be homedir if opening from launchpad
 var str = String(folder);

// console.log("DEBUG",str);
 if (process.platform === 'darwin') {
    if (str.substring(str.lastIndexOf('/')+1) === '') {
//       console.log('DEBUG: Probably using Launchpad. Defaulting to $HOME');
       folder = homedir;
       } else {
         folder = process.cwd();
    }
 }  
// console.log('DEBUG:', folder);

 var items = require('minimist')(process.argv.slice(1));
// console.log(items);

// Check if a directory or image is requested
 var arg1 = items._.toString()

//
// Note: if it is a directory, it should become arg2
// and take preference if any 'base' directory is also defined
//

 if (arg1 === '')  { 
     arg1 = '';
//      console.log('DEBUG: arg1', arg1);
     var filemode = 0
   } else {
     try {
       fs.statSync(arg1);
//       console.log('DEBUG: File or directory exists');
//       console.log('DEBUG: Checking if a directory or file');
       
       if (fs.statSync(arg1).isFile() === true) {
//         console.log('DEBUG: File detected');
	 //double check that it is a valid filetype for CARTA
          if ( arg1.endsWith('.fits') || arg1.endsWith('.hdf5') )  {
            var filemode = 1
//            console.log('DEBUG: File type should be OK', arg1);
          } else {
            console.log('Error: Possibly an unsupported file type');
            process.exit()
         }
       }
    
   if (fs.statSync(arg1).isDirectory() === true) {
   //check if it could actually be an image such as casa file format image 
//   console.log( fs.existsSync(arg1+'/table.dat')); 
     if  ( (fs.existsSync(arg1+'/table.dat') && fs.existsSync(arg1+'/table.info') && fs.existsSync(arg1+'/table.f0') ) // for CASA image  
            || ( fs.existsSync(arg1+'/image') && fs.existsSync(arg1+'/header') && fs.existsSync(arg1+'/history') ) //for MIRIAD image
         ){
//           console.log('DEBUG: However it seems to be a CASA or MIRIAD file format image');
//           console.log('DEBUG: So opening', arg1,'as an image');
	   var filemode = 1;
     } else {
	   var filemode = 0;
           folder = arg1;
//	   console.log('DEBUG: File browser starting location will default to',folder);
     }
     // Extra: detect if a CASA or MIRIAD image is attempted to be opened in --remote mode
   } //end of  (fs.statSync(arg1).isDirectory() === true) loop
 } //end of try loop
    catch (err) {
       if (err.code === 'ENOENT') {
            console.log('Error: Requested file or directory does not exist, or image is a non standard type. Please check.');
            process.exit()
       }
    }
 }
// console.log("DEBUG: User argument 1:", arg1);


// --folder directory setting
// Note: If user has defined arg1 as a directory and also defines the 'folder' flag, 'folder' will take preference
 arg2 = items.folder;
 if (arg2 === undefined) {
         arg2 = String(homedir);
 } else {
   try{
        fs.statSync(arg2);
//         console.log('Checking...',arg2,' directory exists');
        folder = items.folder;

// Extra: detect if a CASA or MIRIAD image is attempted to be opened with --folder flag
         if  ( (fs.existsSync(arg2+'/table.dat') && fs.existsSync(arg2+'/table.info') && fs.existsSync(arg2+'/table.f0') ) // for CASA image  
                   || ( fs.existsSync(arg2+'/image') && fs.existsSync(arg2+'/header') && fs.existsSync(arg2+'/history')  ) //for MIRIAD image
             ){
                console.log('Error: Requested --folder path is a CASA or MIRIAD image.') 
	        console.log('--folder should be a directory, a path, or a folder, not an image.')
                process.exit()
         }
// Extra: detect if a file is requested as a --folder
         if (fs.statSync(arg2).isFile() === true) {
                console.log('Error: Requested --folder path is a file.')
                console.log('--folder should be a directory, a path, or a folder, not a file.')
                process.exit()
         }

     }
     catch (err) {
        if (err.code === 'ENOENT') {
          console.log('Requested directory does not exist. Please check.');
          process.exit()
        }
     }
 }
// console.log("DEBUG: User argument 2:", folder);

// --remote mode message
if (items.remote === true) {
     console.log("  As of version 2.0, the 'remote' mode is no longer");
     console.log("  available in the Electron desktop version of CARTA.");
     console.log("  We recomend to use the Homebrew version of CARTA instead;");
     console.log("  'brew install cartavis/tap/carta'");
process.exit()
}

// --help output  
 if (items.help === true) {
     console.log("CARTA Electron desktop version");
     console.log("Usage:");
     console.log("carta []             CARTA file browser will default to the current path.");
     console.log("      [<path>]       CARTA file browser will default to the specified    ");
     console.log("                     path <path> e.g. carta ~/CARTA/Images               ");
     console.log("      [<image>]      CARTA will directly open the image named <image>    ");
     console.log("                     e.g. carta aJ.fits or carta ~/CARTA/Images/aJ.fits  ");
     console.log("      --help         View this help output.                              ");
     console.log("      --debug        Open the DevTools in the Electron window.           ");
     console.log(" ");
process.exit()
 }

// Basic MacOS touch bar support

// Show CARTA version number
  const button1 = new TouchBarButton({
      icon: path.join(__dirname, 'carta_logo_v2.png'),
      iconPosition: 'left',
      label: 'CARTA v3.0.0-beta.1b',
      backgroundColor: '#000',
//      click: () => {
//           mainWindow.loadURL('https://cartavis.github.io/');
//      },
   });

// Button to open new CARTA instance
  const button2 = new TouchBarButton({
              iconPosition: 'right',
              label: 'New CARTA Window',
              click() {
                openNewCarta()
              }
  });

// Button to open CARTA user manual in local webbrowser
  const button3 = new TouchBarButton({
              iconPosition: 'right',
              label: 'CARTA User Manual',
              click: () => {
              electron.shell.openExternal("https://carta.readthedocs.io/en/2.0");
                },
  });

// Button to quit CARTA
//  const button4 = new TouchBarButton({
//            iconPosition: 'right',
//            label: 'Quit CARTA',
//            click: () => {
//              var killall = "/usr/bin/killall";
//              var args = ["carta_backend"];
//              child_process.spawn(killall, args, {});
//              app.quit()
//              },
// });

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

// Allow multiple instances of Electron
const windows = new Set();

// Generate the UUID security token
var arg0 = uuid.v4();
//console.log("DEBUG: Random UUID", arg0);

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    return false;
  }
});

app.on('activate', (event, hasVisibleWindows) => {
  if (!hasVisibleWindows) { createWindow(); }
});

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

//console.log('case1');
    const newWindow = new BrowserWindow({
    width: mainWindowState.width,
    height: mainWindowState.height,
    x: x,
    y: y,
    show: false
  });

// Using the find-free-port-sync to find a free port for each carta-backend instance
   arg4 = findFreePort();

// CARTA will open normally if arg1/arg2 is a directory or empty
  if (filemode === 0) {
    newWindow.loadURL(`file:\/\/${__dirname}/index.html?socketUrl=ws://localhost:${encodeURIComponent(arg4)}&token=${encodeURIComponent(arg0)}`);
  }

// CARTA will load image directly if arg1 is a file
  if (filemode === 1) {
    var filename = arg1
//    console.log("DEBUG: full string:", arg1)
// Figure out the correct path e.g. if user does 'carta aJ.fits' or 'carta ~/CARTA/Images/aJ.fits'
    if ( arg1.startsWith('/') ) {
//      console.log("DEBUG: Case 1: String contains a / at beginning so must be an absolute path");
      newWindow.loadURL(`file:\/\/${__dirname}/index.html?socketUrl=ws://localhost:${encodeURIComponent(arg4)}&token=${encodeURIComponent(arg0)}&file=${encodeURIComponent(arg1)}`);
    } else {
//      console.log("DEBUG:",process.cwd());
      newWindow.loadURL(`file:\/\/${__dirname}/index.html?socketUrl=ws://localhost:${encodeURIComponent(arg4)}&token=${encodeURIComponent(arg0)}&file=${process.cwd()}\/${encodeURIComponent(arg1)}`);
    };
  }  

//// Start backend here ///////////////////////
//console.log("DEBUG: Starting CARTA normally");

 const exec = require('child_process').exec;

      cartauuid = arg0;    
      cartabase = folder;
      cartaport = arg4;

      var run = exec(path.join(__dirname,'carta-backend/bin/run.sh').concat(' ',cartauuid, ' ',cartabase,' ',cartaport));

//  console.log('backend startup script',run.pid);
///////////////////////////////////////////////

/// Open the DevTools with the --debug flag //
if (items.debug === true) {
  newWindow.webContents.openDevTools()
  }
//////////////////////////////////////////////

  app.releaseSingleInstanceLock()

  newWindow.once('ready-to-show', () => {
    newWindow.show();
  });

  newWindow.setTouchBar(touchBar);

  newWindow.on('close', () => {
//    windows.delete(newWindow);
//    newWindow = null;

  mainWindowState.saveState(newWindow);

  // Also, stop the carta_backend process associated with the child process
  var pkill = "/usr/bin/pkill";
  var signal = ["-9"];
  var ppid = ["-P"];
    child_process.spawn(pkill, [signal, ppid, run.pid]);
  });

// Completely close Electron if no other windows are open
  app.on('window-all-closed', function () {
    app.quit()
  });

  windows.add(newWindow);
  return newWindow;

}

function openNewCarta() {
 mainProcess.createWindow();
}

