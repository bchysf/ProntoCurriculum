import { Router, type IRouter } from "express";
import healthRouter from "./health";
import parseCvRouter from "./parseCv";
import optimizeCvRouter from "./optimizeCv";

const router: IRouter = Router();

router.use(healthRouter);
router.use(parseCvRouter);
router.use(optimizeCvRouter);

export default router;
