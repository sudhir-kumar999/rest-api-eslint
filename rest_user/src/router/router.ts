import express from "express";
import { deleteData, getData, postData, updateData } from "../controller/register.ts";
import { limiter } from "../middleware/rateMiddleware.ts";
const router=express.Router();

router.get("/getData",getData);
router.post("/postData",limiter,postData);
router.patch("/updateData/:id",updateData);
router.delete("/deleteData/:id",deleteData);

export default router;