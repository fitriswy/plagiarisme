import { sign } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "123456";
export const generateToken = async (payload: Record<string, string | number | Date>) => {

    const token = sign(payload, JWT_SECRET, { algorithm: "HS256", expiresIn: "30d" })

    return token;
}