mod commands;
mod state;
#[cfg(not(debug_assertions))]
mod sidecar;

use state::{CornerState, SidecarToken, WindowCorners};
use tauri::Manager;

#[cfg(not(debug_assertions))]
use rand::distr::{Alphanumeric, SampleString};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // sidecar 访问令牌：release 随机生成 48 位，开发模式为空串（服务端随之跳过校验）
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
            sidecar::spawn_bun_sidecar(app);

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
            commands::sidecar_token,
            commands::set_window_corners,
            commands::get_window_corners
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
