import { run } from "./spawn.ts";

const build = (tag: string, command: string, cwd = "") => {
    return run(`build_${tag} |`, "bun run " + command, cwd, {
        ...process.env,
        NODE_ENV: "production",
    })
}

await build_config();
await Promise.all([build_web(), build_bun()]);
await build_tauri();
process.exit(0);

function build_config() {
    return build("config", "scripts/config.ts")
}

function build_web() {
    return build("web", "build", "src-web")
}

function build_bun() {
    return build("bun", "system/script/build_tauri_bun.ts", "src-bun")
}

function build_tauri() {
    console.log("\n\x1b[33m🔄 [tauri] 构建中...\x1b[0m\n");
    return build("tauri", "tauri build --no-bundle").then((res) => {
        if(res === 0) console.log("\n\x1b[32m✅ [tauri] 构建完成\x1b[0m\n");
        return res;
    })
}
