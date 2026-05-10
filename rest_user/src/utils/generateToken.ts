import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

interface payload extends JwtPayload {
  name: string;
  email: string;
  id: string;
}
interface payload2 extends JwtPayload {
  id: string;
}
export const generateAccessToken = (payload: payload, secret: string) => {
  return jwt.sign(payload, secret, {
    expiresIn: "10m",
  });
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret);
};

export const generateRefreshToken = (payload: payload2, secret: string) => {
  return jwt.sign(payload, secret);
};
export const verifyRefToken = (token: string, secret: string) => {
  return jwt.verify(token, secret);
};

