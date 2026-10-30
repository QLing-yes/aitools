import { join } from "node:path";

export const root = process.cwd();

/** 启动子进程并实时拦截、处理后转发输出
 * @param cmd 子进程命令
 * @param cwd 子进程工作目录，默认程序启动根目录
 * @returns 进程的退出代码 Promise
 */
export function run(tag: string, command: string, cwd = "", env?: Record<string, string>) {
    const cmd = command.split(" ");
    const proc = Bun.spawn({
        cmd,
        cwd: join(root, cwd),
        stdin: "inherit",
        stdout: "pipe",
        stderr: "pipe",
        env: {
            ...process.env,
            ...env,
        }
    });
    pipe_out(proc.stdout, tag);
    pipe_out(proc.stderr, tag);
    return proc.exited;
}

/** 逐块读取输出流，按行处理后写回终端
 * @param stream 子进程输出流
 * @param tag 来源标记
 * @returns 无
 */
export async function pipe_out(stream: ReadableStream<Uint8Array>, tag: string) {
    const decoder = new TextDecoder();
    let rest = "";
    for await (const chunk of stream) {
        const lines = (rest + decoder.decode(chunk)).split("\n");
        rest = lines.pop() ?? ""; // 处理跨 chunk 被截断的半行
        for (const line of lines) {
            const out = `${color(tag)} ${line}`; // 这里就是「处理」
            process.stdout.write(out + "\n");
        }
    }
    if (rest) process.stdout.write(rest + "\n");
}

/** 可选调色板：256 色索引（用于 `38;5;n` 前景色），仅绿/青/蓝/紫系，避开红黄，相邻色相拉开便于区分 */
const palette = [34, 201, 44, 111, 46, 207, 51, 147, 40, 213, 87, 177, 37, 117, 189, 183, 81, 159, 171, 123];
/** tag 与着色文本的缓存，tag 不重复，首次分配后直接复用 */
const cache = new Map<string, string>();

/** 为 tag 分配固定颜色，同 tag 始终同色
 * @param tag 来源标记
 * @returns 带 256 色前景转义序列的 tag 文本（已重置颜色）
 */
export function color(tag: string) {
    let colored = cache.get(tag);
    if (colored === undefined) {
        // 38;5;n 表示 256 色前景，避免裸写 n 时 40~47 被当作背景色
        colored = `\x1b[38;5;${palette[cache.size % palette.length]!}m${tag}\x1b[0m`;
        cache.set(tag, colored);
    }
    return colored;
}
