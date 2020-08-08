const electron = require('electron');

/////////////////////////////////////////////////////////////
// Set the Electron frontend port number here.
// This is the port number that the carta-frontend has been 
// built to listen for in its .env.local file
// i.e. REACT_APP_DEFAULT_ADDRESS_PROD=ws://localhost:54143
// We usually increment it for each CARTA release.
var electronport = '54143';
/////////////////////////////////////////////////////////////

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
// For touch bar support on MacOS
const { TouchBar, nativeImage } = require('electron');
const { TouchBarLabel, TouchBarButton, TouchBarSpacer } = TouchBar;

const path = require('path');
const url = require('url');
var spawn = require('child_process').spawn;
const child_process = require("child_process");
const os = require('os');
const contextMenu = require('electron-context-menu');
const dialog = electron.dialog;
const windowStateKeeper = require('electron-window-state');

electron.app.allowRendererProcessReuse = true;

var fs = require('fs');
const homedir = require('os').homedir();

var portscanner = require('portscanner');
var express = require('express');

//////////////////////////////////////////////
// Creating a simple 'Edit' menu
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
      { role: 'selectall' }
    ]
  }
]

if (process.platform === 'darwin') {
  const name = app.name;
  template.unshift({
    label: name,
    submenu: [
      {
        role: 'quit'
      }
    ]
  })
}
const menu = Menu.buildFromTemplate(template)
//////////////////////////////////////////////

// Close any earlier versions of CARTA that may be running
var execSync = require('child_process').execSync;
execSync("xargs pkill -f CARTA-v1.0 CARTA-v1.0.1 CARTA-v1.1-beta0");

// Disable error dialogs by overriding
dialog.showErrorBox = function(title, content) {
    console.log(`${title}\n${content}`);
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

 var arg1 = 'undefined';
 var arg2 = 'undefined';
 var arg3 = 'undefined';
 var arg4 = 'undefined';
 var arg5 = 'undefined'; 
 var arg6 = 'undefined';
 var arg7 = 'undefined';
 var arg8 = 'undefined';
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

// Check if the user uses the older --server flag
 if (items.server === true) {
    console.log('Please use the "--remote" flag instead')
    process.exit()
 }

// Check if remote mode is requested
 if (items.remote === true) {;
//    console.log("DEBUG: Server mode requested");
    var remotemode = 1
    console.log(remotemode);
 }

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
          if ( arg1.includes('.fits') || arg1.includes('.hdf5') )  {
            var filemode = 1
//            console.log('DEBUG: File type should be OK', arg1);
            if (items.remote === true) {
              console.log('Error: Can not open an image directly if you are also requesting "--remote" mode')
	      process.exit()
	    }
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
     if  ( (fs.existsSync(arg1+'/table.dat') && fs.existsSync(arg1+'/table.info') && fs.existsSync(arg1+'/table.f0') && items.remote === true ) // for CASA image  
            || ( fs.existsSync(arg1+'/image') && fs.existsSync(arg1+'/header') && fs.existsSync(arg1+'/history')  && items.remote === true ) //for MIRIAD image
         ){
           console.log('Error: Can not open a CASA or MIRIAD image directly if you are also requesting "--remote" mode')
           process.exit()
      }
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


// --root directory setting
 arg3 = items.root; 
  if (arg3 === undefined) {
     arg3 = String('/');
       } else {
          try{
         fs.statSync(arg3);
//         console.log('Checking... root directory exists');
         arg3 = items.root; 
     }
     catch (err) {
        if (err.code === 'ENOENT') {
          console.log('Root directory does not exist. Please check.');
          process.exit()
        }
     }
  }

// Check if selected --root is a subdirectory of 'folder'
   if ( arg3.indexOf(folder) === 0 ) {
      console.log('Chosen --root',arg3,'can not be inside --folder or $pwd',folder);
      process.exit()
   }

// console.log("DEBUG: User argument 3:", arg3);


// --port setting
// When using Electron, this should really be fixed to port number 
// defined on line 9 of this file (the 'electronport' variable)
// but the option to change it is still available.
 if (items.remote != true) {
    arg4 = items.port;
       if (arg4 === undefined) {
          arg4 = electronport;
       } else {
          if (typeof arg4 != "number") {
             console.log('Selected port value is not number. Please check.');
             process.exit()
          }     
       }
    // Check if the port is available on the system
    portscanner.checkPortStatus(arg4).then(status => {
       // Status is 'open' if currently in use or 'closed' if available
       if (status == 'closed'){
//          console.log('DEBUG: Port',arg4,'is available')
       }
       if (status == 'open'){
          console.log('Port',arg4,'already in use. Please free the port before starting CARTA'); 
          console.log('Suggestion: Check with "lsof -i :',arg4,'" to find the PID and kill the process with "kill -9 <PID>".');
           process.exit()
       }
    });
// console.log("DEBUG: User argument 4:", arg4);
 } //end of items.remote loop


// --threads setting
 arg5 = items.threads;
 if (arg5 == undefined) {
     // set the default --threads setting as 4
     arg5 = 4;
       } else {
       if (typeof arg5 != "number") {
          console.log('Selected threads value is not number. Please check.');
          process.exit()
       }
 }
// console.log("DEBUG: User argument 5:", arg5);


// --omp_threads setting
 arg7 = items.omp_threads;
  if (arg7 == undefined) {
      // Default value is taken as the actual number of cores on the system
      var corecount = os.cpus().length;
      arg7 = corecount;
        } else {
	if (typeof arg7 != "number") {
           console.log('Selected omp_threads value is not number. Please check.');
	   process.exit()
	}
 }
// console.log("DEBUG: User argument 7:", arg7);


// --grpc_port setting

    arg8 = items.grpc_port;
       if (arg8 === undefined) {
       // gRPC for scripting interface is deactivated by default
          arg8 = -1;
       } else {
          if (typeof arg8 != "number") {
             console.log('Selected grpc_port value is not number. Please check.');
             process.exit()
          }
       }

    if (arg8 > 0) {
       // Check if the grpc_port is available on the system
       portscanner.checkPortStatus(arg8).then(status => {
       // Status is 'open' if currently in use or 'closed' if available
       if (status == 'closed'){
       //   console.log('DEBUG: Port',arg8,'is available')
       }
       if (status == 'open'){
          console.log('grpc_port',arg8,'already in use. Please free the port before starting CARTA');
          console.log('Suggestion: Check with "lsof -i :',arg8,'" to find the PID and kill the process with "kill -9 <PID>".');
           process.exit()
       }
      });
    };
// console.log("DEBUG: User argument 8:", arg8);


////
//// Check for pfort and port number in remote mode
////
if (items.remote === true) {

//console.log('DEBUG: remote mode variables');
// --feport setting (frontend port)
 arg6 = items.fport;
 if (arg6 === undefined) {
       // Automatically choose free port within certain range
       portscanner.findAPortNotInUse(2000, 2500, '127.0.0.1', function(error, port) {
//       console.log('DEBUG: Automatically selected port',port,'for frontend')
       arg6 = port;
       });
 } else if (Number.isInteger(arg6) === false) {
       console.log('Selected websocket port value is not number. Please check.');
       process.exit()
 } else {
// Check if the port is available on the system
  try{
  portscanner.checkPortStatus(arg6, function(error, status1) {
      // Status is 'open' if currently in use or 'closed' if available
//      console.log('frontend',status1);
      if (status1 == 'closed'){
//         console.log('DEBUG: Manually selected port',arg6,'is available for the frontend')
      }
      if (status1 == 'open'){
         console.log('Requested frontend port',arg6,'is already in use. Please try a different port number');
         process.exit()
      }
   });
 }
 catch(error) {
     if (error.code === 'ERR_SOCKET_BAD_PORT') {
        console.log('Requested port value out of range. It should be > 1024 and < 65536, but',arg6,'was received');
        process.exit()
     }
  }
 }
// console.log("DEBUG: User argument 6:", arg6);

// --port setting (backend websocket port)
 arg4 = items.port;
if (arg4 === undefined) {
       // Automatically choose free port within certain range
       portscanner.findAPortNotInUse(3000, 3500, '127.0.0.1', function(error, port) {
//       console.log('DEBUG: Automatically selected port',port,'for websocket')
       arg4 = port;
       });
 } else if (Number.isInteger(arg4) === false) {
       console.log('Selected websocket port value is not number. Please check.');
       process.exit()
 } else {
// Check if the port is available on the system
  try{
   portscanner.checkPortStatus(arg4, function(error, status2) {
      // Status is 'open' if currently in use or 'closed' if available
//      console.log('websocket',status2);
      if (status2 == 'closed'){
//         console.log('DEBUG: Manually selected port',arg4,'is available for the backend')
      }
      if (status2 == 'open'){
         console.log('Requested backend port',arg4,'is already in use. Please try a different port number');
         process.exit()
      }
   });
  }
  catch(error) {
     if (error.code === 'ERR_SOCKET_BAD_PORT') {
	console.log('Requested port value out of range. It should be > 1024 and < 65536, but',arg4,'was received');
        process.exit()
     }
  }
 }
// console.log("DEBUG: User argument 4:", arg4);

} //end of (items.remote === true) for selecting two ports

////
////
////

// --help output  
 if (items.help === true) {
     console.log("usage: carta [] CARTA file browser will default to the current path.");
     console.log("             [<path>] CARTA file browser will default to the specified");
     console.log("                      path <path> e.g. carta ~/CARTA/Images");
     console.log("             [<image>] CARTA will directly open the image named <image>");
     console.log("                       e.g. carta aJ.fits or carta ~/CARTA/Images/aJ.fits");
     console.log("             [--folder=<path>] Optional: An alternative way to define the");
     console.log("                               default CARTA file browser path.");
     console.log("                               Note: Not for directly opening an image.");     
     console.log("             [--help] View this help output");
     console.log("Remote mode flags");
     console.log("             [--remote] start CARTA in 'remote' mode. For accessing CARTA's");
     console.log("                        frontend through your webrowser rather than the standard ");
     console.log("                        Electron interface. A free websocket port and a frontend");
     console.log("                        port will be chosen automatically.");
     console.log("             [--port=<number>] Optional: Manually choose a websocket port for the");
     console.log("                               backend. CARTA will check if the port is available");
     console.log("                               and issue a warning if not. A typical value is");
     console.log("                               between 1025-65535.");                   
     console.log("             [--fport=<number>] Optional: Manually choose a frontend port for the");
     console.log("                                CARTA web interface. CARTA will check if the port");
     console.log("                                is available and issue a warning if not. A typical");
     console.log("                                value is between 1025-65535.");
     console.log("             [--grpc_port=<number>] Optional: Manually choose a port to activate ");
     console.log("                                    and use the scripting functionality.");
     console.log("                                    Note: This feature is currently in development.");
     console.log("Advanced usage flags");
     console.log("             [--root=<path>] Define the lowest path the file browser can");
     console.log("                             navigate to. e.g. carta --root /home/bob means the ");
     console.log("                             the file browser can not access anything in /home");
     console.log("                             Note: --root can not be set inside --folder.");
     console.log("             [--threads=<number>] Set the number of threads. It controls how many");
     console.log("                                  tasks CARTA handles simultaneosuly. The default");
     console.log("                                  value is set as 4");
     console.log("             [--omp_threads=<number>] Set the number of OpenMP threads. It controls"); 
     console.log("                                      how trivially parallelisable tasks are split");
     console.log("                                      by CARTA. The default value is the");
     console.log("                                      automatically detected number of cores on");
     console.log("                                      your system; usually 4 or 8 on a typcial");
     console.log("             [--size=<width>x<height>] Manually define the dimensions of CARTA's");
     console.log("                                       Electron window in pixels.");     
     console.log("             [--disable-gpu] May help if running CARTA Desktop through a VNC server");
     console.log("                             and images are not rendering properly.");     
     console.log("             [--debug] Open the DevTools in the Electron window.");
     console.log("            ");
process.exit()
 }



// Basic MacOS touch bar support

// Show CARTA version number
  const button1 = new TouchBarButton({
      icon: path.join(__dirname, 'carta_logo_v2.png'),
      iconPosition: 'left',
      label: 'CARTA v1.4.alpha.4',
      backgroundColor: '#000',
//      click: () => {
//           mainWindow.loadURL('https://cartavis.github.io/');
//      },
   });

// Button to open CARTA user manual in local webbrowser
  const button2 = new TouchBarButton({
              iconPosition: 'right',
              label: 'CARTA user manual',
              click: () => {
              electron.shell.openExternal("https://carta.readthedocs.io/en/latest");
                },
  });

// Button to quit CARTA
//  const button3 = new TouchBarButton({
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
	    //new TouchBarSpacer({ size: 'flexible' }),
	    //button3,
           ],
     });


// Prevent Electron window opening if using remote mode
if (items.remote != true) {

  function createWindow() {
    // Create the browser window.

// Allow user to manually set size of the Electron window
if (items.size === undefined){
 
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1920,
    defaultHeight: 1080
  });

  mainWindow = new BrowserWindow({
    'x': mainWindowState.x,
    'y': mainWindowState.y,
    'width': mainWindowState.width,
    'height': mainWindowState.height
  });
  mainWindowState.manage(mainWindow);

} else {
  window_size=items.size
  var dims = window_size.split("x", 2);
  windowWidth = dims[0];
  windowHeight = dims[1];

  var check_width = (!isNaN(windowWidth) && windowWidth % 1 === 0 && 0 <= ~~windowWidth);
  var check_height = (!isNaN(windowHeight) && windowHeight % 1 === 0 && 0 <= ~~windowHeight);
  if (check_width === false || check_height === false) {
    console.log('Can not understand chosen window dimensions: ',windowWidth,'x',windowHeight,' Please check.');
    process.exit()
  }

  mainWindow = new BrowserWindow({
      'width': parseInt(windowWidth),
      'height': parseInt(windowHeight)
  });
}

mainWindow.setTouchBar(touchBar);

// add a simple right click context menu for copy,cut,paste.
Menu.setApplicationMenu(menu);
contextMenu({
        prepend: (params, browserWindow) => [
    ],
});

// CARTA will load image directly if arg1 is a file
   if (filemode === 1) {
//        console.log("DEBUG: Opening file directly");
//        console.log("DEBUG: full string:", arg1);
        var filename = arg1.substring(arg1.lastIndexOf('/')+1);
//        console.log("DEBUG: filename:",filename);
	var pathname = arg1.substring(0, arg1.lastIndexOf('/'));
//	console.log("DEBUG: path:",pathname);
//	console.log("DEBUG: current directory", process.cwd());
//	console.log("DEBUG:", folder);

// Figure out the correct path e.g. if user does 'carta aJ.fits' or 'carta ~/CARTA/Images/aJ.fits'

        if (arg1.includes(process.cwd()) ){
//	   console.log("DEBUG: Case1: String includes the current directory");
           mainWindow.loadURL(`file:\/\/${__dirname}\/index.html?folder=${pathname}&file=${filename}`);
//	}   
//       } else if ( arg1.includes('/') ) {
//           console.log("DEBUG: String contains a / so image must not be in the current directory");
//           mainWindow.loadURL(`file:\/\/${__dirname}\/index.html?folder=${process.cwd()}&file=${arg1}`);
	} else {
//           console.log("DEBUG: Case2: String does not include the current directory ");
           mainWindow.loadURL(`file:\/\/${__dirname}\/index.html?folder=${process.cwd()}&file=${arg1}`);
       };
    
    }

// CARTA will open normally if arg1/arg2 is a directory or empty
   if (filemode === 0) {
//    console.log("DEBUG: Starting CARTA normally");
        mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        preload: __dirname + '/preload.js',
        slashes: true
    }));
   }

// Start CARTA backend
//    if (process.platform === 'linux') {
      const exec = require('child_process').exec;
//
// 6 varaibles will be sent from here to the carta_backend executable's run.sh script in carta-backend/bin/run.sh
// cartabase $1
// cartaroot $2
// cartaport $3
// cartathreads $4
// carta_omp_threads = $5;
// carta_grpc_port = $6;

      cartabase = folder;
      cartaroot = arg3;
      cartaport = arg4;
      cartathreads = arg5;
      carta_omp_threads = arg7;
      carta_grpc_port = arg8;

      exec(path.join(__dirname,'carta-backend/bin/run.sh').concat(' ',cartabase,' ',cartaroot,' ',cartaport,' ',cartathreads,' ',carta_omp_threads,' ',carta_grpc_port));
//      console.log(path.join('DEBUG',__dirname,'carta-backend/bin/run.sh').concat(' ',cartabase,' ',cartaroot,' ',cartaport,' ',cartathreads,' ',carta_omp_threads,' ',carta_grpc_port));
//    };

// Open the DevTools with the --debug flag
if (items.debug === true) {
  mainWindow.webContents.openDevTools()
  }


    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        mainWindow = null;
        // Also, stop the carta_backend process
        var killall = "/usr/bin/killall";
        var args = ["carta_backend"];
        child_process.spawn(killall, args, {});
        app.quit()
        });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On MacOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
//    if (process.platform == 'darwin') {
        var killall = "/usr/bin/killall";
        var args = ["carta_backend"];
        child_process.spawn(killall, args, {});
        app.quit()
//    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
   }
});

} //end of the large remotemode=false loop

// Start CARTA in remote mode
// This prevents the Electron window from opening
if (items.remote === true) {

setTimeout(function(){ //delay to make sure asynchronous portscanner finishes

      console.log("Starting CARTA in remote mode");

// 7 variables will be sent from here to the carta_backend executable in remote.sh
// cartabase
// cartaroot
// cartaport
// cartathreads
// cartafport
// carta_omp_threads
// carta_grpc_port

      cartabase = folder;
      cartaroot = arg3;
      cartaport = arg4;
      cartathreads = arg5;
      cartafport = arg6;
      carta_omp_threads = arg7;
      carta_grpc_port = arg8;

// Start the http webserver
// It uses cartafport: arg6
      webserver = express(); 
      webserver.use('/', express.static(__dirname + '/'));
      webserver.listen(arg6);

// Start the backend process using the the remote.sh script
      const { spawn } = require('child_process');
      const remote = spawn('bash', [path.join(__dirname,'carta-backend/bin/remote.sh'),cartabase,cartaroot,cartaport,cartathreads,cartafport,carta_omp_threads,carta_grpc_port]);

      remote.stdout.on('data', (data) => {
      console.log(`${data}`);
      });

      remote.stderr.on('data', (data) => {
//      console.log(`stderr: ${data}`);
      });

      remote.on('close', (code) => {
//      console.log(`child process exited with code ${code}`);
      process.exit();
      });

   },3000); // delay for 3 seconds

}

