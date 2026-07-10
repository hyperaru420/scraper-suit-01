import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scrapeRouter from "./scrape";
import productsRouter from "./products";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scrapeRouter);
router.use(productsRouter);

export default router;
