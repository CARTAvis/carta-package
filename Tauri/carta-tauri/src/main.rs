use tauri::{Manager, Wry};
use std::process::Command;
use std::thread;
use std::env;
use std::process::Stdio;
use std::io::BufRead;
use std::sync::{Arc, Mutex};
use std::time::Duration;

struct BackendProcess {
    child: Option<std::process::Child>,
}

impl Drop for BackendProcess {
    fn drop(&mut self) {
        if let Some(ref mut child) = self.child {
            let _ = child.kill();
        }
    }
}

fn main() {
    // Collect all command line arguments
    let args: Vec<String> = env::args().skip(1).collect();

    // Set run.sh path correctly if built in debug mode e.g. 'cargo tauri dev' or built in release mode e.g. 'cargo tauri build'.
    // Note: The release mode path is set for macOS. It would be different for a Linux package.
    let script_path = if cfg!(debug_assertions) {
        let mut path = std::env::current_exe().unwrap().parent().unwrap().to_path_buf();
        path.push("../../carta-backend/bin/run.sh");
        path
    } else {
        let mut path = std::env::current_exe().unwrap().parent().unwrap().to_path_buf();
        path.push("../Resources/carta-backend/bin/run.sh"); // For macOS app
        // path.push("/usr/lib/carta-tauri/carta-backend/bin/run.sh"); // Linux deb package
        path
    };
    println!("Path to run.sh: {:?}", script_path);

    let carta_url = Arc::new(Mutex::new(String::new()));

    let cloned_carta_url = Arc::clone(&carta_url);

    let child_process = Arc::new(Mutex::new(BackendProcess { child: None }));
    
    // Start the carta_backend as background process
    let handle = thread::spawn({
        let child_process = Arc::clone(&child_process);
        move || {
            let child = Command::new(script_path)
                //.arg(folder_or_image.to_string())
                .args(&args)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .expect("Failed to execute run.sh");

            child_process.lock().unwrap().child = Some(child);

            // Print all carta_backned stdout to the terminal
            let stdout = child_process.lock().unwrap().child.as_mut().unwrap().stdout.take().unwrap();
            let reader = std::io::BufReader::new(stdout);
            for line in reader.lines() {
                let line = line.expect("Failed to read stdout");
                println!("{}", line);
                // Grab the unique connection URL for the Tauri window to use
                if line.contains("CARTA is accessible at") {
                    let tokens: Vec<&str> = line.split_whitespace().collect();
                    let mut carta_url_guard = carta_url.lock().unwrap();
                    *carta_url_guard = tokens.last().unwrap().to_string();
                }
            }
            let _ = child_process.lock().unwrap().child.as_mut().unwrap().wait();
        }
    });

    // Make sure the carta_backend process has time to start up and output the URL to stdout.
    // (There is probably a better way to do this).
    thread::sleep(Duration::from_secs(2));

    let child_process_clone = Arc::clone(&child_process);

    // Create the Tauri window and open the frontend URL in it.
    tauri::Builder::<Wry>::new()
        .setup(move |app: &mut tauri::App<Wry>| {
            let window = app.get_window("main").unwrap();
            let carta_url_guard = cloned_carta_url.lock().unwrap();
            window
                .eval(&format!("window.location.replace('{}')", *carta_url_guard))
                .unwrap();
            Ok(())
        })
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .on_page_load(move |_window: tauri::Window<Wry>, _payload: tauri::PageLoadPayload| {
            let _child_process = child_process.lock().unwrap();
    {
        // Make sure the carta_backend process is stopped when the Tauri window is closed.
        let mut locked_child_process = child_process_clone.lock().unwrap();
        if let Some(ref mut child) = locked_child_process.child.as_mut() {
            let _ = child.kill();
        }
    }
        })
        .run(tauri::generate_context!())
        .expect("error running tauri app");

    handle.join().unwrap();
}

