import rateLimit from "express-rate-limit";
export const limiter=rateLimit({
  windowMs:15*60*100,
  max:2,
  legacyHeaders:false,
  standardHeaders:true,
  message:{
    status:429,
    message:"rate limit hit for this time period wait for 15 min to try again"
  }
});