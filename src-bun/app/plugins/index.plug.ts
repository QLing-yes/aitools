import { cors } from "@elysia/cors";
import { openapi } from "@elysia/openapi";
import { staticPlugin } from "@elysia/static";
import { Elysia } from "elysia";
import routes from "@/system/generated/routes";
import plug_controller from "@/app/plugins/controller.plug";
import { createDir } from "@/app/utils/file";

export const controller = plug_controller.use(routes);
const staticAssets = await (() => {
  const op = {
    assets: "public",
    alwaysStatic: false // 如果你想在AOT中使用动态路径的静态资源，需要设置为false
  }
  createDir(op.assets);
  return staticPlugin(op);;
})();

export default new Elysia({ name: String($g.counter.n) })
  .derive(() => {
    return { rid: crypto.randomUUID() };
  })
  .use(cors())
  .use(openapi())
  .use(staticAssets)
  .use(controller);

