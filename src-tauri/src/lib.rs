mod commands;
mod state;
#[cfg(not(debug_assertions))]
mod sidecar;
#[cfg(not(debug_assertions))]
mod sidecar_terminal_log;

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
                // Windows: 开启 WebView2 非客户区支持（ICoreWebView2Settings9）——
                // -webkit-app-region: drag 区域由系统接管：触摸/鼠标拖窗、双击最大化原生可用
                // （贴靠布局浮层需 web 自绘按钮申报 HTMAXBUTTON，稳定版 WebView2 无此通道，等 WCO 转正）
                #[cfg(target_os = "windows")]
                {
                    // 去除 Win11 对无装饰窗口默认的 1px DWM 边框线（DWMWA_COLOR_NONE）；
                    // 窗口阴影为 OS 固定样式（仅 conf 开关，无强度参数），保持现状
                    if let Ok(hwnd) = window.hwnd() {
                        use windows::Win32::Foundation::HWND;
                        use windows::Win32::Graphics::Dwm::{
                            DwmSetWindowAttribute, DWMWA_BORDER_COLOR,
                        };
                        const BORDER_NONE: u32 = 0xFFFF_FFFE;
                        let raw = HWND(hwnd.0 as *mut core::ffi::c_void);
                        unsafe {
                            let _ = DwmSetWindowAttribute(
                                raw,
                                DWMWA_BORDER_COLOR,
                                &BORDER_NONE as *const u32 as *const core::ffi::c_void,
                                core::mem::size_of::<u32>() as u32,
                            );
                        }
                    }

                    let _ = window.with_webview(|w| unsafe {
                        use webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2Settings9;
                        use windows::core::Interface;
                        if let Ok(core) = w.controller().CoreWebView2() {
                            if let Ok(settings) = core.Settings() {
                                if let Ok(s9) = settings.cast::<ICoreWebView2Settings9>() {
                                    let _ = s9.SetIsNonClientRegionSupportEnabled(true);
                                }
                            }
                        }
                    });
                }

                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_secs(5));
                    // release 无控制台不打日志：兜底本身自愈，强显成功即恢复
                    if matches!(window.is_visible(), Ok(false)) {
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
