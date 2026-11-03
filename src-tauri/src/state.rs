//! Tauri 托管状态定义

/// Sidecar 访问令牌，经 IPC 下发给前端，随 HTTP 请求头回传鉴权
pub struct SidecarToken(pub String);

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
pub struct CornerState(pub std::sync::Mutex<WindowCorners>);
