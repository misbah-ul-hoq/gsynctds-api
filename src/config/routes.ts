import { Express } from "express";
import { authRoutes } from "../routes/authRoutes";

const routes = (app: Express) => {
  app.use("/auth", authRoutes);
};

export default routes;
