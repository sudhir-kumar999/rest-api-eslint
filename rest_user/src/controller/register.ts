/* eslint-disable prefer-const */
import { type Request, type Response } from "express";
import fs from "fs";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.ts";
import dotenv from "dotenv";
dotenv.config();
import { sendMail } from "../utils/emailSend.ts";
import { generateOtp } from "../utils/otp.ts";
import { Webhook } from "discord-webhook-node";
const hook = new Webhook(process.env.DISCORD_WEBHOOK);

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

interface body {
  email: string;
  otp: string;
}

const stringRegex = /^[A-Za-z ]+$/;
const passRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    if (isNaN(limit) || isNaN(skip)) {
      return res.status(400).json({
        success: false,
        message: "limit and skip must be numbers",
      });
    }

    if (limit <= 0 || skip < 0) {
      return res.status(400).json({
        success: false,
        message: "invalid limit and skip value",
      });
    }
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

export const postData = async (req: RequestWithUserRole, res: Response) => {
  try {
    const remaining = res.getHeader("RateLimit-Remaining");
    const bodyData: reqData = req.body;
    let { name, age, email, password, place, city }: reqData = req.body;

    if (
      name == undefined ||
      age == undefined ||
      email == undefined ||
      password == undefined ||
      place == undefined ||
      city == undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "ever field is required for register",
      });
    }
    const now = new Date().toTimeString();

    if (!passRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "password contains at least one digit a uppercase letter a lowercase letter and special character and min length 8",
      });
    }

    if (!stringRegex.test(name)) {
      return res.status(400).json({
        success: false,
        message: "only letter are allowed in names",
      });
    }

    if (typeof age != "number") {
      return res.status(400).json({
        success: false,
        message: "only number are allowed in age",
      });
    }

    if (age <= 0 || age >= 150) {
      return res.status(400).json({
        success: false,
        message: "age can only  be between 1 and 150",
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

    name = name?.trim();
    city = city?.trim();
    place = place?.trim();
    email = email?.trim().toLowerCase();
    bodyData.email=email;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required it acnnot be empty",
      });
    }

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "city is not be required",
      });
    }

    if (!place) {
      return res.status(400).json({
        success: false,
        message: "place cannot be empty string",
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

export const loginController = (req: RequestWithUserRole, res: Response) => {
  try {
    let { email, password }: valid = req.body;
    if (email == undefined || password == undefined) {
      return res.status(401).json({
        success: false,
        message: "email and password is required for login",
      });
    }
    email = email.trim().toLowerCase();
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "email is not valid enter valid email",
      });
    }

    fs.readFile("data.json", "utf-8", async (err, data) => {
      if (!data) {
        return res.status(404).json({
          success: false,
          message: "No data found inside DB",
        });
      }
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
          success: false,
          message: "Wrong password. Try again with correct password",
        });
      }

      const otp = generateOtp();
      const template = `
    <h1>Your otp is ${otp}</h1>
    `;
      const mailInfo = await sendMail(emailCheck.email, template);
      if (!mailInfo?.accepted[0]) {
        return res.status(502).json({
          success: false,
          message: "Failed when send Email",
        });
      }
      fs.readFile("otp.json", "utf-8", (err, data) => {
        let otpData: otp[] = [];
        if (!err && data) {
          otpData = JSON.parse(data);
        }

        const existOtp = otpData.find((ele) => ele.email == emailCheck.email);
        const curTime = Date.now();
        if (existOtp) {
          const time = curTime - existOtp.createdAt;
          if (time < 2 * 60 * 1000) {
            return res.status(429).json({
              success: false,
              message: "try again after 2 min",
            });
          }
        }

        otpData = otpData.filter((ele) => ele.email != emailCheck.email);
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

export const verifyOtp = (req: Request, res: Response) => {
  try {
    let { email, otp }: body = req.body;

    if (email == undefined) {
      return res.status(401).json({
        success: false,
        message: "email cannot be empty string",
      });
    }
    if (!otp) {
      return res.status(401).json({
        success: false,
        message: "otp cannot be empty string",
      });
    }
    email = email.trim().toLowerCase();
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "email is not valid enter valid email",
      });
    }

    if (typeof otp != "string") {
      return res.status(401).json({
        success: false,
        message: "otp must be string",
      });
    }
    if (otp.length != 6) {
      return res.status(401).json({
        success: false,
        message: "otp must be 6 digit long",
      });
    }
    otp = otp.trim();

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
      const user: reqData | undefined = readData.find(
        (ele) => ele.email == email,
      );
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
                message: "max attempt exceed otp deleted",
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
              message: "error occured while deleting otp",
            });
          }

          const payload = {
            name: user.name,
            email: user.email,
            id: user.id,
          };

          const accessToken = generateAccessToken(
            payload,
            process.env.ACCESS_KEY as string,
          );

          const refreshPayload = {
            id: user.id,
          };

          const refreshToken = generateRefreshToken(
            refreshPayload,
            process.env.REFRESH_KEY as string,
          );

          res.cookie("accessToken", accessToken, {
            httpOnly: true,
          });

          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
          });

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

export const updateData = async (req: RequestWithUserRole, res: Response) => {
  try {
    let resData: reqData[] = [];
    const bodyData = req.body;
    let { name, age, email, password, place, city } = req.body;
    const tokenId: decode | undefined = req.user;
    const author_id: string | undefined = tokenId?.id;

    if (!author_id) {
      return res.status(401).json({
        success: false,
        message: "No author_id found login again",
      });
    }
    if (
      name == undefined &&
      age == undefined &&
      city == undefined &&
      place == undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "give at least one field to update",
      });
    }
    name = name?.trim();
    if (name !== undefined) {
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "name is required",
        });
      }
      if (!stringRegex.test(name)) {
        return res.status(400).json({
          success: false,
          message: "only letter are allowed in name",
        });
      }
    }

    if (age !== undefined) {
      if (typeof age != "number") {
        return res.status(400).json({
          success: false,
          message: "only number are allowed in age",
        });
      }

      if (age <= 0 || age >= 150) {
        return res.status(400).json({
          success: false,
          message: "age can only  be between 1 and 150",
        });
      }
    }

    city = city?.trim();
    if (city !== undefined) {
      if (!stringRegex.test(city)) {
        return res.status(400).json({
          success: false,
          message: "only letter are allowed in city",
        });
      }
    }

    place = place?.trim();
    if (place !== undefined) {
      if (!stringRegex.test(place)) {
        return res.status(400).json({
          success: false,
          message: "only letter are allowed in place",
        });
      }
    }
    email = email?.trim().toLowerCase();
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
    const tokenId: decode | undefined = req.user;
    const author_id: string | undefined = tokenId?.id;
    if (!author_id || author_id == undefined) {
      return res.status(401).json({
        success: false,
        message: "no author id found",
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
