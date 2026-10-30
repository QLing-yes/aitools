#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;
#[cfg(not(debug_assertions))]
use tauri_plugin_shell::process::CommandEvent;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {

            #[cfg(not(debug_assertions))]
            {
                // 启动 Bun 构建的 Sidecar 进程
                let sidecar_command = _app
                    .shell()
                    .sidecar("bun-service")
                    .expect("Failed to create sidecar command");

                let (mut rx, _child) = sidecar_command.spawn().expect("Failed to spawn sidecar");

                // 监听 Sidecar 输出日志 (可选)
                tauri::async_runtime::spawn(async move {
                    while let Some(event) = rx.recv().await {
                        if let CommandEvent::Stdout(line) = event {
                            println!("Sidecar: {}", String::from_utf8_lossy(&line));
                        } else if let CommandEvent::Stderr(line) = event {
                            eprintln!("Sidecar Error: {}", String::from_utf8_lossy(&line));
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
