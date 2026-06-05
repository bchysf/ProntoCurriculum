import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import parseCvRouter from "./parseCv";
import optimizeCvRouter from "./optimizeCv";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(parseCvRouter);
router.use(optimizeCvRouter);

export default router;
