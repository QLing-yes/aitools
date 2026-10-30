import { run } from "./spawn.ts";

// --------------------------------- 流程 ---------------------------------

await build_config()
Promise.all([dev_bun(), dev_web(), dev_tauri()])

// --------------------------------- 启动函数 ---------------------------------

function build_config() {
    return dev("config", "scripts/config.ts")
}
function dev_bun() {
    return dev("bun", "dev", "src-bun")
}
function dev_web() {
    return dev("web", "dev", "src-web")
}
function dev_tauri() {
    return dev("tauri", "tauri dev")
}

// --------------------------------- 工具 ---------------------------------

async function dev(tag: string, command: string, cwd = "") {
    const code = await run(`dev_${tag} |`, "bun run " + command, cwd, {
        NODE_ENV: "development",
    })
    if (code !== 0) {
        console.error(`\n\x1b[31m❌ [${tag}] 启动失败，退出码 ${code}\x1b[0m\n`);
        process.exit(code);
    }
    return code;
}
