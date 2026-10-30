import { run } from "./spawn.ts";

const dev = (tag: string, command: string, cwd = "") => {
    return run(`dev_${tag} |`, "bun run " + command, cwd, {
        NODE_ENV: "development",
    })
}

await build_config()
Promise.all([dev_bun(), dev_web(), dev_tauri()])

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
