//! Bun sidecar 进程管理（仅 release 构建，开发模式由 bun 直接启动服务）

use std::path::PathBuf;

use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

use crate::sidecar_terminal_log::SidecarTerminalLog;
use crate::state::SidecarToken;

/// 终端日志保存目录：启动目录/logs/sidecar_terminal_bun；无法解析时为 None（跳过日志）
fn log_dir() -> Option<PathBuf> {
    Some(std::env::current_exe().ok()?.parent()?.join("logs").join("sidecar_terminal_bun"))
}

/// 写入一行终端日志；目录无法解析时跳过
async fn write(log: &mut Option<SidecarTerminalLog>, line: &str) {
    if let Some(log) = log {
        log.write(line).await;
    }
}

/// 启动 Bun 构建的 Sidecar 进程：注入一次性随机令牌，并转发其日志
pub fn spawn_bun_sidecar(app: &tauri::App) {
    let token = &app.state::<SidecarToken>().0;
    let msg = format!("[tauri] spawning bun sidecar, pid: {}", std::process::id());
    println!("{msg}");

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
        let mut log = log_dir().map(SidecarTerminalLog::new);
        write(&mut log, &msg).await;

        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    let text = String::from_utf8_lossy(&line);
                    println!("Sidecar: {text}");
                    write(&mut log, &text).await;
                }
                CommandEvent::Stderr(line) => {
                    let text = String::from_utf8_lossy(&line);
                    eprintln!("Sidecar Error: {text}");
                    write(&mut log, &text).await;
                }
                CommandEvent::Terminated(p) => {
                    let msg = format!("[tauri] bun sidecar exited, code: {:?}", p.code);
                    println!("{msg}");
                    write(&mut log, &msg).await;
                    break;
                }
                _ => {}
            }
        }
    });
}
