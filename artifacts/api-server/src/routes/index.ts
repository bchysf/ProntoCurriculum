import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import parseCvRouter from "./parseCv";
import optimizeCvRouter from "./optimizeCv";
import experiencesRouter from "./experiences";
import tailorCvRouter from "./tailorCv";
import translateCvRouter from "./translateCv";
import cvsRouter from "./cvs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(parseCvRouter);
router.use(optimizeCvRouter);
router.use(experiencesRouter);
router.use(tailorCvRouter);
router.use(translateCvRouter);
router.use(cvsRouter);

export default router;
