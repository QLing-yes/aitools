import { mergeDeep } from "../src-bun/app/utils";
import { write } from "../src-bun/app/utils/file";
import path from "node:path";

const isProd = process.env.NODE_ENV === "production";

async function build_tauri_conf() {
    console.log("\n\x1b[33m🔄 [tauri.conf.json] 构建中...\x1b[0m\n");
    const filePath = path.join(__dirname, "../src-tauri/tauri.conf.json");
    const tauri_json = (await import(filePath)).default;

    const config = {
        "build": {
            "devUrl": `http://localhost:${process.env.VITE_PORT}`,
        },
        "bundle": {
            "externalBin": isProd ? [
                "../src-bun/bun-service"
            ] : []
        }
    }

    const merged = mergeDeep(tauri_json, config);
    const file = write(filePath);
    file.write(JSON.stringify(merged, null, 2))
    file.end();
    console.log(`\x1b[32m✅ [tauri.conf.json] 构建完成 \x1b[0m\n`);
}

await build_tauri_conf();
