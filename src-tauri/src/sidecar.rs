//! Bun sidecar 进程管理（仅 release 构建，开发模式由 bun 直接启动服务）

use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

use crate::state::SidecarToken;

/// 启动 Bun 构建的 Sidecar 进程：注入一次性随机令牌，并转发其日志
pub fn spawn_bun_sidecar(app: &tauri::App) {
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
