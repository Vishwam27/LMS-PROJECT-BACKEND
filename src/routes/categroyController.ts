import { Router } from "express";
import { getAllCategories } from "../controllers/categroyController";


const router = Router();

router.get("/", getAllCategories);

export default router;