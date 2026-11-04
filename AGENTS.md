# 项目

同时支持的平台: web、windows、linux、macos

```
Project/
|── scripts/                  # 脚本目录
|── src-bun/                  # Bun服务模块
|── src-web/                  # web模块
|── src-tauri/                # Tauri模块
|── .env                      # 配置文件
...
```

请参考各种目录下的 package.json、README.md 确定技术栈。
统一使用 bun 作为包管理器。
node_modules 目录下的内容不能修改。

# 分发与环境处理

三种打包分发方式（桌面版均自带 bun sidecar，差异在公共路由的访问地址）：

1. 桌面版1（离线版客户端）: web 与 bun 全部在客户端，`/api` 和 `/offline` 都访问本地 sidecar
2. 桌面版2（服务版客户端）: bun 同时部署到服务器，`/api` 走远程服务器、`/offline` 仍走本地 sidecar
3. web 部署版: web 与 bun 各自单独部署到服务器，仅访问服务器的 `/api`（无本地 bun，`/offline` 不存在）

bun 服务内部两套路由：

- `/offline/...`: 桌面端专属，仅本地 sidecar 实例提供，服务器部署实例不注册
- `/api/...`: 公共通用，本地与服务器实例均有，只是 web 模块访问的地址不一样

环境判断入口（各模块自查，互不牵扯）：

- src-web: `isTauri` 区分桌面/浏览器；`sidecarToken()` 非空=本地 sidecar 就绪（仅 web 部署版与 dev 为空）；`/api` 地址取 `VITE_API_URL`（空=同源）
- src-bun: `app/common/tauri_sidecar.ts` 的 `config.token` 非空=本地 sidecar 模式（令牌校验见控制器插件），空=服务器模式
- src-tauri: 仅 release 模式启动 sidecar 并注入 `TAURI_SIDECAR` 令牌，dev/web 部署恒为空

# AGENTS

每个模块下的 AGENTS.md 文件内容属于规则，只有牵扯到该模块的代码，才需要读取该文件。

# 全局规则
- 代码准则: 极致性能、高复用性、高可读性、易维护，逻辑嵌套≤3层，分区分块编写;
- 语法规范: 禁用存在变量提升的语法声明属性; 不可变对象用常量;
- 规范: 所有入参、返回值、字段、函数，必须写简单明了的注释，注释不能越界描述;
- 格式: 合理换行，代码精简无冗余，尽量减少代码量达到同样效果（不能使用压缩代码的方式）;
- 边界职责: 注意模块之间边界职责清晰不要有任何牵扯（包括注释描述），每个模块只能负责自己的功能！！！
