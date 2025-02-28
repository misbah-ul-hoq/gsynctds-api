import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
function verifyUser(req: Request, res: Response, next: NextFunction) {
  const authToken = req.headers.authtoken;
  if (!authToken) return res.status(401).send({ message: "Unauthorized" });
  const isValid = jwt.verify(
    authToken as string,
    process.env.JWT_SECRET as string
  );
  if (!isValid) return res.status(401).send({ message: "Unauthorized" });
  next();
}

export { verifyUser };
