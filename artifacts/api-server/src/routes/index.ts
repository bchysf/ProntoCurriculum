import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import parseCvRouter from "./parseCv";
import optimizeCvRouter from "./optimizeCv";
import experiencesRouter from "./experiences";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(parseCvRouter);
router.use(optimizeCvRouter);
router.use(experiencesRouter);

export default router;
