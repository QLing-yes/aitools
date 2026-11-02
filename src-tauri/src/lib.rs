#[cfg(not(debug_assertions))]
use rand::distr::{Alphanumeric, SampleString};
#[cfg(not(debug_assertions))]
use tauri::Manager;
#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;
#[cfg(not(debug_assertions))]
use tauri_plugin_shell::process::CommandEvent;

/// Sidecar 访问令牌，经 IPC 下发给前端，随 HTTP 请求头回传鉴权
struct SidecarToken(String);

/// 获取 sidecar 访问令牌；开发模式为空串
#[tauri::command]
fn sidecar_token(state: tauri::State<'_, SidecarToken>) -> String {
    state.0.clone()
}

/// 启动 Bun 构建的 Sidecar 进程：注入一次性随机令牌，并转发其日志
#[cfg(not(debug_assertions))]
fn spawn_bun_sidecar(app: &tauri::App) {
    let token = &app.state::<SidecarToken>().0;
    println!("[tauri] spawning bun sidecar, pid: {}", std::process::id());

    let (mut rx, child) = app
        .shell()
        .sidecar("bun-service")
        .expect("Failed to create sidecar command")
        .env("TAURI_SIDECAR", format!(r#"{{"token":"{token}"}}"#))
        .spawn()
        .expect("Failed to spawn sidecar");

    // child 随任务持有，保证 stdin 管道在 Tauri 退出前不关闭
    tauri::async_runtime::spawn(async move {
        let _child = child;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    println!("Sidecar: {}", String::from_utf8_lossy(&line))
                }
                CommandEvent::Stderr(line) => {
                    eprintln!("Sidecar Error: {}", String::from_utf8_lossy(&line))
                }
                CommandEvent::Terminated(p) => {
                    println!("[tauri] bun sidecar exited, code: {:?}", p.code);
                    break;
                }
                _ => {}
            }
        }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(not(debug_assertions))]
    let token = Alphanumeric.sample_string(&mut rand::rng(), 48);
    #[cfg(debug_assertions)]
    let token = String::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarToken(token))
        .setup(|_app| {
            #[cfg(not(debug_assertions))]
            spawn_bun_sidecar(_app);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![sidecar_token])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
