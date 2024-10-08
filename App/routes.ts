import * as Router from 'koa-router';
import { LoadPublicControllers, LoadControllers, LoadAdminControllers } from '../Api/Controllers';
const router = new Router();
const publicRouter = new Router();
const adminRouter = new Router();

// Basic health check
publicRouter.get('/health', async ctx => {
  ctx.body = 'OK';
  ctx.status = 200;
});

LoadControllers(router);
LoadPublicControllers(publicRouter);
LoadAdminControllers(adminRouter);

export const routes = router;
export const publicRoutes = publicRouter;
export const adminRoutes = adminRouter;



