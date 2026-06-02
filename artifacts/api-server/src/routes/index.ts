import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lessonsRouter from "./lessons";
import exercisesRouter from "./exercises";
import progressRouter from "./progress";
import vocabularyRouter from "./vocabulary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lessonsRouter);
router.use(exercisesRouter);
router.use(progressRouter);
router.use(vocabularyRouter);

export default router;
