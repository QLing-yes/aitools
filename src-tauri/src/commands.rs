//! 暴露给前端的 IPC 命令

use tauri::{Emitter, Manager};

use crate::state::{CornerState, SidecarReady, SidecarToken, WindowCorners};

/// web 首屏提交后的就绪信号：还原最小化、显示窗口并聚焦（动作实现见 lib.rs `present_window`）
#[tauri::command]
pub fn reveal_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        crate::present_window(&window);
    }
}

/// 宿主平台标识（windows/macos/linux/android/ios…），前端据此做能力门控，不依赖 UA 嗅探
#[tauri::command]
pub fn shell_platform() -> &'static str {
    std::env::consts::OS
}

/// 获取 sidecar 访问令牌；开发模式或未就绪返回空串（前端以「非空=可用」为判据）
#[tauri::command]
pub fn sidecar_token(
    state: tauri::State<'_, SidecarToken>,
    ready: tauri::State<'_, SidecarReady>,
) -> String {
    if !ready.is_ready() {
        return String::new();
    }
    state.0.clone()
}

/// 设置窗口四角圆角；成功后向前端广播 `window-corners-changed` 事件
#[tauri::command]
pub fn set_window_corners(
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
    // 锁中毒取回内值继续：best-effort 路径，panic=abort 下不能让读锁崩掉应用
    *state.0.lock().unwrap_or_else(|e| e.into_inner()) = corners;
    app.emit("window-corners-changed", corners)
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// 获取当前窗口四角圆角
#[tauri::command]
pub fn get_window_corners(state: tauri::State<'_, CornerState>) -> WindowCorners {
    *state.0.lock().unwrap_or_else(|e| e.into_inner())
}
