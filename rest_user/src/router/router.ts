import express from "express";
import { deleteData, getData, loginController, postData, updateData } from "../controller/register.ts";
import { limiter } from "../middleware/rateMiddleware.ts";
import { checkLogin } from "../middleware/loginMiddleware.ts";
const router=express.Router();

router.get("/getData",checkLogin,getData);
router.post("/postData",limiter,postData);
router.post("/login",loginController);
router.patch("/updateData",checkLogin,updateData);
router.delete("/deleteData/:id",deleteData);

export default router;