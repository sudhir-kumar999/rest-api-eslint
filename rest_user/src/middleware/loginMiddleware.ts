import type { Request,Response,NextFunction } from "express";
import { verifyToken } from "../utils/generateToken.ts";

interface decode{
    name:string;
    email:string
    id:string;
    iat:number;
    exp:number
}
interface RequestWithUserRole extends Request {
    user?: decode,
}
export const checkLogin=(req:RequestWithUserRole ,res:Response,next:NextFunction)=>{
  try {
    const token:string=String(req.cookies.accessToken);
    if(token=="undefined"){
      return res.status(404).json({
        success:false,
        message:"No tokens found. login first"
      });
    }
    const secret:string=String(process.env.ACCESS_KEY);
    const decoded=verifyToken(token,secret) as decode;
    if(!decoded){
      return res.status(404).json({
        success:false,
        message:"JWT token expires login again"
      });
    }
    req.user=decoded;
    next();
  } catch (error:unknown) {
    if(error instanceof Error){
      return res.status(400).json({
        success:false,
        message:"JWT expired login again"
      });
    }
  }
};