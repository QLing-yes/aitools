use tauri::{Emitter, Manager};

#[cfg(not(debug_assertions))]
use rand::distr::{Alphanumeric, SampleString};
#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;
#[cfg(not(debug_assertions))]
use tauri_plugin_shell::process::CommandEvent;

/// Sidecar 访问令牌，经 IPC 下发给前端，随 HTTP 请求头回传鉴权
struct SidecarToken(String);

/// 窗口四角圆角半径（px）
#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowCorners {
    /// 左上角
    pub top_left: u32,
    /// 右上角
    pub top_right: u32,
    /// 右下角
    pub bottom_right: u32,
    /// 左下角
    pub bottom_left: u32,
}

impl Default for WindowCorners {
    fn default() -> Self {
        Self {
            top_left: 5,
            top_right: 5,
            bottom_right: 5,
            bottom_left: 5,
        }
    }
}

/// 圆角状态，由 Tauri 持有，前端通过命令读写
struct CornerState(std::sync::Mutex<WindowCorners>);

/// 获取 sidecar 访问令牌；开发模式为空串
#[tauri::command]
fn sidecar_token(state: tauri::State<'_, SidecarToken>) -> String {
    state.0.clone()
}

/// 设置窗口四角圆角；成功后向前端广播 `window-corners-changed` 事件
#[tauri::command]
fn set_window_corners(
    app: tauri::AppHandle,
    state: tauri::State<'_, CornerState>,
    top_left: u32,
    top_right: u32,
    bottom_right: u32,
    bottom_left: u32,
) -> Result<(), String> {
    let corners = WindowCorners {
        top_left,
        top_right,
        bottom_right,
        bottom_left,
    };
    *state.0.lock().unwrap() = corners;
    app.emit("window-corners-changed", corners)
        .map_err(|e| e.to_string())?;
    println!("[tauri] window corners set to {:?}", corners);
    Ok(())
}

/// 获取当前窗口四角圆角
#[tauri::command]
fn get_window_corners(state: tauri::State<'_, CornerState>) -> WindowCorners {
    *state.0.lock().unwrap()
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
        // 恢复窗口大小/位置/最大化状态；排除 VISIBLE——显示时机由前端挂载后控制，避免白屏
        .plugin(
            tauri_plugin_window_state::Builder::new()
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::all()
                        & !tauri_plugin_window_state::StateFlags::VISIBLE,
                )
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 聚焦已有窗口
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .manage(SidecarToken(token))
        .manage(CornerState(std::sync::Mutex::new(WindowCorners::default())))
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            spawn_bun_sidecar(app);

            // 防隐藏兜底：前端挂载后应调用 show()；超时仍未显示则强制显示，避免窗口永远不可见
            if let Some(window) = app.get_webview_window("main") {
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(5));
                    if matches!(window.is_visible(), Ok(false)) {
                        println!("[tauri] window not shown by frontend within 5s, forcing show");
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            sidecar_token,
            set_window_corners,
            get_window_corners
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
