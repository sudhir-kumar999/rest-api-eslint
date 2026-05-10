import express from "express";
import { deleteData, getData, loginController, postData, updateData, verifyOtp } from "../controller/register.ts";
import { limiter } from "../middleware/rateMiddleware.ts";
import { checkLogin } from "../middleware/loginMiddleware.ts";
import { twoFactor } from "../middleware/twoFactor.ts";
const router=express.Router();

router.get("/getData",checkLogin,getData);
router.post("/postData",limiter,postData);
router.post("/login",loginController);
router.post("/verify",checkLogin,verifyOtp);
router.patch("/updateData",checkLogin,twoFactor,updateData);
router.delete("/deleteData",checkLogin,twoFactor,deleteData);

export default router;