import fs from "fs";

interface decode{
    name:string;
    email:string
    id:string;
    iat:number;
    exp:number
}
interface reqData {
  id: string;
  name: string;
  age: number;
  email: string;
  password: string;
  place: string;
  city: string;
  otp?:string;
  otpVerified:boolean;
}

export const twoFactor=(req,res,next)=>{
  try {
    const tokenId:decode|undefined=req.user;
    const userId:string=String(tokenId?.id);

    fs.readFile("data.json","utf-8",(err,data)=>{
      if(!err && data){
        const checkVerify:reqData[]=JSON.parse(data);
        const filetrData:reqData | undefined=checkVerify.find((ele)=>ele.id==userId);
        if(filetrData?.otpVerified==false){
          return res.status(403).json({
            success:false,
            message:"otp is not verified, otp verify first"
          });
        }
        next();
      }
    });
  } catch (error) {
    return res.status(401).json({
      success:false,
      message:"two factor not verified. verify the otp first",
      Error:error
    });
  }
};