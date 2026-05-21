import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import instancesRouter from "./instances.js";
import solverRouter from "./solver.js";
import algorithmsRouter from "./algorithms.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(instancesRouter);
router.use(solverRouter);
router.use(algorithmsRouter);

export default router;
