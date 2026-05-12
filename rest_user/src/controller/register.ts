import { type Request, type Response } from "express";
import fs from "fs";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.ts";
import dotenv from "dotenv";
import { sendMail } from "../utils/emailSend.ts";
import { generateOtp } from "../utils/otp.ts";
import { Webhook } from "discord-webhook-node";
const hook = new Webhook(
  "https://discordapp.com/api/webhooks/1502281278995693649/L4xtkh1IZn0MuCaOi5AUj3Jm0BItTY8uT2Ltx0C570CkYO7Ha6Eg17YQVWzJDVCAsaLm",
);

dotenv.config();
interface reqData {
  id: string;
  name: string;
  age: number;
  email: string;
  password: string;
  place: string;
  city: string;
  otp?: string;
  otpVerified: boolean;
}
// interface password {
//   password: string;
//   email: string;
// }

interface decode {
  name: string;
  email: string;
  id: string;
  iat: number;
  exp: number;
}
interface RequestWithUserRole extends Request {
  user?: decode;
}

const stringRegex = /^[A-Za-z ]+$/;

const numberRegex = /^[0-9]+$/;

const emailRegex = /^[=a-zA-Z0-9._%+-]+@gmail.com$/;

interface otp {
  email: string;
  otp: string;
  attempt: number;
  isVerified: boolean;
  createdAt: number;
  expiredAt: number;
}

interface valid {
  email: string;
  password: string;
}

export const getData = (req: Request, res: Response) => {
  try {
    const limit: number = Number(req.query.limit);
    const skip: number = Number(req.query.skip);
    const offset: number = limit * skip;
    const last: number = skip * limit + limit;
    fs.readFile("data.json", "utf-8", (err, data: string) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message || "error occurred at writing file",
        });
      }
      if (data) {
        const parsed = JSON.parse(data);
        const sendData: reqData[] = parsed.slice(offset, last);
        return res.json({
          success: true,
          message: "data fetched of all user",
          data: sendData,
        });
      }
      return res.status(404).json({
        success: false,
        message: "no user found in database or json file",
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};

export const loginController = (req: Request, res: Response) => {
  try {
    const { email, password }: valid = req.body;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "email is not valid enter valid email",
      });
    }
    fs.readFile("data.json", "utf-8", async (err, data) => {
      if (!data) {
        return res.status(200).json({
          success: false,
          message: "No data found inside DB",
        });
      }
      // eslint-disable-next-line prefer-const
      let readData: reqData[] = JSON.parse(data);
      const emailCheck = readData.find((ele) => ele.email == email);
      const hashed: string = String(emailCheck?.password);
      if (emailCheck == undefined) {
        return res.status(401).json({
          success: false,
          message: "No email found. kindly sign up or enter right email",
        });
      }
      const isValidPass = await bcrypt.compare(password, hashed);
      if (!isValidPass) {
        return res.status(401).json({
          success: true,
          message: "Wrong password. Try again with correct password",
        });
      }

      const name: string = String(emailCheck.name);
      const gmail: string = String(emailCheck.email);
      const id: string = String(emailCheck.id);

      const payload = {
        name: name,
        email: gmail,
        id: id,
      };
      const secret_access_key: string = String(process.env.ACCESS_KEY);
      const accessToken = generateAccessToken(payload, secret_access_key);
      const payload2 = {
        id: id,
      };

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
      });

      const secret_refresh_key: string = String(process.env.REFRESH_KEY);
      const refreshToken = generateRefreshToken(payload2, secret_refresh_key);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
      });

      const otp = generateOtp();
      const template = `
    <h1>Your otp is ${otp}</h1>
    `;
      const mailInfo = await sendMail(gmail, template);
      if (!mailInfo?.accepted[0]) {
        return res.status(502).json({
          success: false,
          message: "Failed when send Email",
        });
      }
      //  new opt table
      fs.readFile("otp.json", "utf-8", (err, data) => {
        let otpData: otp[] = [];
        if (!err && data) {
          otpData = JSON.parse(data);
        }
        otpData = otpData.filter((ele) => ele.email != emailCheck.email);
        const curTime = Date.now();
        const newData: otp = {
          email: emailCheck.email,
          otp: String(otp),
          attempt: 0,
          isVerified: false,
          createdAt: curTime,
          expiredAt: curTime + 10 * 60 * 1000,
        };
        otpData.push(newData);
        fs.writeFile("otp.json", JSON.stringify(otpData), (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "error at writing otp to db",
            });
          }
          return res.status(200).json({
            success: true,
            message: "otp sent successfully",
          });
        });
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};

export const verifyOtp = (req: RequestWithUserRole, res: Response) => {
  try {
    const userId: string = String(req.user?.id);
    const { otp } = req.body;
    fs.readFile("data.json", "utf-8", (err, data) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "error while reading user file",
        });
      }
      let readData: reqData[] = [];
      if (data) {
        readData = JSON.parse(data);
      }
      const user = readData.find((ele) => ele.id == userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "no user found",
        });
      }
      fs.readFile("otp.json", "utf-8", (err, data) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: "error while reading otp file",
          });
        }
        let otpData: otp[] = [];
        if (data) {
          otpData = JSON.parse(data);
        }
        const otpUser = otpData.find((ele) => ele.email == user.email);
        if (!otpUser) {
          return res.status(404).json({
            success: false,
            message: "user not found in otp table",
          });
        }
        if (Date.now() > otpUser.expiredAt) {
          const deleteExpiredOtp = otpData.filter(
            (ele) => ele.email != otpUser.email,
          );
          fs.writeFile("otp.json", JSON.stringify(deleteExpiredOtp), () => {});
          return res.status(401).json({
            success: false,
            message: "otp expired generate new otp",
          });
        }
        if (otpUser.attempt >= 3) {
          const deleteOtp = otpData.filter((ele) => ele.email != otpUser.email);
          fs.writeFile("otp.json", JSON.stringify(deleteOtp), () => {});
          return res.status(401).json({
            success: false,
            message: "no attempt left generate new otp",
          });
        }
        if (otpUser.otp != otp) {
          otpUser.attempt += 1;
          if (otpUser.attempt >= 3) {
            const deleteOtp = otpData.filter(
              (ele) => ele.email != otpUser.email,
            );
            fs.writeFile("otp.json", JSON.stringify(deleteOtp), (err) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: "error while deleting otp",
                });
              }
              return res.status(401).json({
                success: false,
                message: "max attempt exceeded otp deleted",
              });
            });
            return;
          }
          const updateAttempt = otpData.map((ele) =>
            ele.email == otpUser.email ? otpUser : ele,
          );
          fs.writeFile("otp.json", JSON.stringify(updateAttempt), (err) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "error while updating attempt",
              });
            }
            return res.status(401).json({
              success: false,
              message: `wrong otp attempt left ${3 - otpUser.attempt}`,
            });
          });
          return;
        }
        const verifyOtp = otpData.filter((ele) => ele.email != otpUser.email);
        fs.writeFile("otp.json", JSON.stringify(verifyOtp), (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "error occured while writing file at delete otp",
            });
          }
          return res.status(200).json({
            success: true,
            message: "otp verified success",
          });
        });
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};

export const postData = async (req: RequestWithUserRole, res: Response) => {
  try {
    const remaining = res.getHeader("RateLimit-Remaining");
    const bodyData: reqData = req.body;
    const { name, age, email, password, place, city }: reqData = req.body;
    const now = new Date().toTimeString();

    if (!stringRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: "only letter are allowed in names",
      });
    }

    if (!numberRegex.test(age.toString())) {
      return res.status(400).json({
        success: false,
        message: "only number are allowed in age",
      });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "email is not valid enter valid email",
      });
    }
    if (!stringRegex.test(city)) {
      return res.status(400).json({
        success: false,
        message: "only letter are allowed in city",
      });
    }
    if (!stringRegex.test(place)) {
      return res.status(400).json({
        success: false,
        message: "only letter are allowed in place",
      });
    }

    const strPassword = password.toString();
    const hashed = await bcrypt.hash(strPassword, 10);
    const id = uuidv4();
    bodyData.id = id;
    bodyData.password = hashed;
    const path = "data.json";
    if (!fs.existsSync(path)) {
      fs.writeFileSync("path", "");
    }
    fs.readFile("data.json", "utf-8", (err, data) => {
      let pushData: reqData[] = [];
      if (!err && data) {
        pushData = JSON.parse(data);
      }
      const check = pushData.some((ele: reqData) => ele.email == email);
      if (check) {
        const str = `Hello ${bodyData.email} you are already signed in. Please Log in to continue. Thank you`;
        hook.send(str);
        return res.status(409).json({
          success: false,
          message: "Email already exist try with new email",
          attemptLeft: remaining,
        });
      }
      pushData.push(bodyData);
      const str2 = `Hello ${bodyData.name} you are sign up on our website with your Email : ${bodyData.email} at time ${now}. Now you can log in. This is system generated message do not reply`;
      hook.send(str2);
      fs.writeFile("data.json", JSON.stringify(pushData), (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: err.message || "error occurred at writing file",
          });
        }
        return res.status(201).json({
          success: true,
          message: "user created in json file successfully",
        });
      });
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};

export const updateData = async (req: RequestWithUserRole, res: Response) => {
  try {
    let resData: reqData[] = [];
    const bodyData = req.body;
    const { name, age, email, password, place, city } = req.body;
    const tokenId: decode | undefined = req.user;
    const author_id: string = String(tokenId?.id);

    if (name !== undefined) {
      if (!stringRegex.test(name)) {
        return res.status(400).json({
          success: false,
          message: "only letter are allowed in names",
        });
      }
    }

    if (age !== undefined) {
      if (!numberRegex.test(age.toString())) {
        return res.status(400).json({
          success: false,
          message: "only number are allowed in age",
        });
      }
    }

    //   if(email!==undefined){
    //   if(!emailRegex.test(email)){
    //     return res.status(400).json({
    //       success:false,
    //       message:"only letter are allowed in email"
    //     })
    //   }
    // }

    if (city !== undefined) {
      if (!stringRegex.test(city)) {
        return res.status(400).json({
          success: false,
          message: "only letter are allowed in city",
        });
      }
    }

    if (place !== undefined) {
      if (!stringRegex.test(place)) {
        return res.status(400).json({
          success: false,
          message: "only letter are allowed in place",
        });
      }
    }

    if (email != undefined) {
      return res.status(422).json({
        success: true,
        message: "Email cannot be change",
      });
    }
    if (password != undefined) {
      return res.status(422).json({
        success: true,
        message: "password cannot be change",
      });
    }
    fs.readFile("data.json", "utf-8", (err, data) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message || "error occurred at writing file",
        });
      }
      if (data) {
        resData = JSON.parse(data);
        const item: number = resData.findIndex(
          (ele: reqData) => ele.id == author_id,
        );
        if (item != -1) {
          resData[item] = { ...resData[item], ...bodyData };
          fs.writeFile("data.json", JSON.stringify(resData), (err) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: err.message || "error occurred at writing file",
              });
            }
            return res.status(200).json({
              success: true,
              message: "data updated successfully",
            });
          });
        } else {
          return res.status(404).json({
            success: false,
            message: "No data found with given id. enter the correct id",
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          message: "no data found insert some data to update",
        });
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};

export const deleteData = (req: RequestWithUserRole, res: Response) => {
  try {
    // const id: string = String(req.params.id);
    const tokenId: decode | undefined = req.user;
    const author_id: string = String(tokenId?.id);
    fs.readFile("data.json", "utf-8", (err, data) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.message || "error occurred at writing file",
        });
      }
      if (data) {
        const result = JSON.parse(data);
        const check = result.some((ele: reqData) => ele.id == author_id);
        if (!check) {
          return res.status(404).json({
            success: false,
            message: "No user found with given id. Give correct id",
          });
        }
        const duplicate = result.filter((ele: reqData) => ele.id !== author_id);
        fs.writeFile("data.json", JSON.stringify(duplicate), (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: err.message || "error occurred at writing file",
            });
          }

          res.clearCookie("accessToken", {
            path: "/",
            httpOnly: true,
            secure: true,
          });
          res.clearCookie("refreshToken", {
            path: "/",
            httpOnly: true,
            secure: true,
          });
          return res.status(200).json({
            success: true,
            message: "data deleted",
          });
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "no found in db to delete",
        });
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({
        success: false,
        message: error.message || "internal server error",
      });
    }
  }
};
