import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import lessonsRouter from "./lessons";
import exercisesRouter from "./exercises";
import progressRouter from "./progress";
import vocabularyRouter from "./vocabulary";
import gamificationRouter from "./gamification";
import unitsRouter from "./units";
import goalsRouter from "./goals";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(unitsRouter);
router.use(lessonsRouter);
router.use(exercisesRouter);
router.use(progressRouter);
router.use(vocabularyRouter);
router.use(gamificationRouter);
router.use(goalsRouter);

export default router;
