import { Router, type IRouter } from "express";
import healthRouter from "./health";
import parseCvRouter from "./parseCv";

const router: IRouter = Router();

router.use(healthRouter);
router.use(parseCvRouter);

export default router;
