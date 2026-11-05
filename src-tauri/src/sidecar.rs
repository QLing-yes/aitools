//! Bun sidecar 进程管理（仅 release 构建，开发模式由 bun 直接启动服务）

use std::path::PathBuf;

use tauri::{Emitter, Manager};
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
/// 失败仅记录不中断——桌面版2 的 /api 走远程服务器，本地 bun 缺失不应阻止应用启动
pub fn spawn_bun_sidecar(app: &tauri::App) {
    let token = &app.state::<SidecarToken>().0;
    let msg = "[tauri] spawning bun sidecar".to_string();
    println!("{msg}");

    let spawned = app
        .shell()
        .sidecar("bun-service")
        .and_then(|cmd| cmd.env("TAURI_SIDECAR", format!(r#"{{"token":"{token}"}}"#)).spawn());
    let (mut rx, child) = match spawned {
        Ok(pair) => pair,
        Err(e) => {
            let msg = format!("[tauri] bun sidecar 启动失败，应用继续运行: {e}");
            eprintln!("{msg}");
            // release GUI 无控制台，失败也要在终端日志目录留痕（异步写不阻塞 setup）
            let mut log = log_dir().map(SidecarTerminalLog::new);
            tauri::async_runtime::spawn(async move {
                write(&mut log, &msg).await;
            });
            return;
        }
    };
    let pid = child.pid();
    let handle = app.app_handle().clone();

    // child 随任务持有，保证 stdin 管道在 Tauri 退出前不关闭
    tauri::async_runtime::spawn(async move {
        let _child = child;
        let mut log = log_dir().map(SidecarTerminalLog::new);
        write(&mut log, &format!("{msg}, pid: {pid}")).await;

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
                    // 通知前端：本地 /offline 能力已失效（emit 失败仅表示无人监听，忽略）
                    let _ = handle.emit("sidecar-terminated", p.code);
                    break;
                }
                _ => {}
            }
        }
    });
}
