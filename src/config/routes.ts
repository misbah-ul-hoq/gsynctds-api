import { Express } from "express";
import { authRoutes } from "../routes/authRoutes";
import eventRoutes from "../routes/eventRoutes";

const routes = (app: Express) => {
  app.use("/auth", authRoutes);
  app.use("/events", eventRoutes);
};

export default routes;
