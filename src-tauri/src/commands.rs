//! 暴露给前端的 IPC 命令

use tauri::Emitter;

use crate::state::{CornerState, SidecarToken, WindowCorners};

/// 获取 sidecar 访问令牌；开发模式为空串
#[tauri::command]
pub fn sidecar_token(state: tauri::State<'_, SidecarToken>) -> String {
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
